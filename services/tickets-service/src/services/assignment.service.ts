/**
 * Auto-Assignment Service
 * Intelligently assigns tickets to technicians based on workload, skills, and availability
 */

import { query } from '../utils/database';
import logger from '../utils/logger';

export interface AssignmentCandidate {
  user_id: string;
  name: string;
  email: string;
  role: string;
  current_workload: number;
  skills: string[];
  is_available: boolean;
  last_assigned_at?: Date;
}

export interface AssignmentScore {
  user_id: string;
  score: number;
  reason: string;
}

export interface AssignmentCriteria {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  tags?: string[];
  customer_id?: string;
}

export class AssignmentService {
  /**
   * Auto-assign a ticket to the best available technician
   */
  static async autoAssignTicket(
    ticketId: string,
    criteria: AssignmentCriteria
  ): Promise<string | null> {
    try {
      logger.info('Starting auto-assignment', { ticketId, criteria });

      // Get eligible technicians
      const candidates = await this.getEligibleTechnicians();

      if (candidates.length === 0) {
        logger.warn('No eligible technicians found for auto-assignment', { ticketId });
        return null;
      }

      // Score each candidate
      const scores = await this.scoreCandidates(candidates, criteria);

      // Sort by score (highest first)
      scores.sort((a, b) => b.score - a.score);

      if (scores.length === 0 || scores[0].score === 0) {
        logger.warn('No suitable technician found (all scores are 0)', { ticketId });
        return null;
      }

      const bestCandidate = scores[0];

      logger.info('Auto-assignment complete', {
        ticketId,
        assignedTo: bestCandidate.user_id,
        score: bestCandidate.score,
        reason: bestCandidate.reason,
      });

      return bestCandidate.user_id;
    } catch (error) {
      logger.error('Failed to auto-assign ticket', { error, ticketId });
      throw error;
    }
  }

  /**
   * Get all eligible technicians (technician or admin role, not on vacation)
   */
  private static async getEligibleTechnicians(): Promise<AssignmentCandidate[]> {
    const result = await query(
      `SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.role,
        COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('new', 'assigned', 'in_progress')), 0) as current_workload,
        COALESCE(u.skills, '{}') as skills,
        (u.deleted_at IS NULL AND COALESCE(u.is_active, true)) as is_available,
        u.last_assigned_at
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id AND t.deleted_at IS NULL
      WHERE u.role IN ('technician', 'admin', 'manager')
        AND u.deleted_at IS NULL
        AND COALESCE(u.is_active, true) = true
      GROUP BY u.id, u.name, u.email, u.role, u.skills, u.deleted_at, u.is_active, u.last_assigned_at
      ORDER BY current_workload ASC, u.last_assigned_at ASC NULLS FIRST`
    );

    return result.rows.map((row) => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      current_workload: parseInt(row.current_workload, 10),
      skills: Array.isArray(row.skills) ? row.skills : [],
      is_available: row.is_available,
      last_assigned_at: row.last_assigned_at,
    }));
  }

  /**
   * Score candidates based on multiple criteria
   */
  private static async scoreCandidates(
    candidates: AssignmentCandidate[],
    criteria: AssignmentCriteria
  ): Promise<AssignmentScore[]> {
    const scores: AssignmentScore[] = [];

    for (const candidate of candidates) {
      let score = 0;
      const reasons: string[] = [];

      // Base score: availability (must be available)
      if (!candidate.is_available) {
        scores.push({
          user_id: candidate.user_id,
          score: 0,
          reason: 'Not available',
        });
        continue;
      }

      score += 10;
      reasons.push('available');

      // Workload score (inverse - lower workload = higher score)
      // Give 50 points for 0 tickets, decreasing by 5 points per ticket
      const workloadScore = Math.max(0, 50 - candidate.current_workload * 5);
      score += workloadScore;
      reasons.push(`workload: ${candidate.current_workload} tickets (${workloadScore}pts)`);

      // Skills matching (category and tags)
      let skillsMatched = 0;

      if (criteria.category && candidate.skills.length > 0) {
        const categoryLower = criteria.category.toLowerCase();
        const hasSkill = candidate.skills.some((skill) =>
          skill.toLowerCase().includes(categoryLower) ||
          categoryLower.includes(skill.toLowerCase())
        );

        if (hasSkill) {
          score += 30;
          skillsMatched++;
          reasons.push(`category match: ${criteria.category}`);
        }
      }

      if (criteria.tags && criteria.tags.length > 0 && candidate.skills.length > 0) {
        const matchedTags = criteria.tags.filter((tag) =>
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        );

        if (matchedTags.length > 0) {
          score += matchedTags.length * 10;
          skillsMatched += matchedTags.length;
          reasons.push(`tag match: ${matchedTags.join(', ')}`);
        }
      }

      // Priority-based scoring
      if (criteria.priority) {
        // For high/critical priority, prefer admins/managers
        if (
          (criteria.priority === 'critical' || criteria.priority === 'high') &&
          (candidate.role === 'admin' || candidate.role === 'manager')
        ) {
          score += 20;
          reasons.push('senior role for high priority');
        }

        // For critical tickets, heavily penalize overloaded technicians
        if (criteria.priority === 'critical' && candidate.current_workload > 5) {
          score -= 30;
          reasons.push('overloaded for critical ticket');
        }
      }

      // Round-robin bonus: favor technicians who haven't been assigned recently
      const now = new Date();
      if (candidate.last_assigned_at) {
        const hoursSinceLastAssignment =
          (now.getTime() - new Date(candidate.last_assigned_at).getTime()) / (1000 * 60 * 60);

        // Give bonus points based on hours since last assignment (up to 24 hours)
        const roundRobinBonus = Math.min(15, Math.floor(hoursSinceLastAssignment / 2));
        score += roundRobinBonus;
        reasons.push(`round-robin: ${Math.floor(hoursSinceLastAssignment)}h ago (${roundRobinBonus}pts)`);
      } else {
        // Never assigned before - give full bonus
        score += 15;
        reasons.push('round-robin: never assigned (15pts)');
      }

      // Customer affinity (if they've handled tickets for this customer before)
      if (criteria.customer_id) {
        const hasHandledCustomer = await this.hasHandledCustomer(
          candidate.user_id,
          criteria.customer_id
        );

        if (hasHandledCustomer) {
          score += 25;
          reasons.push('customer affinity');
        }
      }

      scores.push({
        user_id: candidate.user_id,
        score,
        reason: reasons.join(', '),
      });
    }

    return scores;
  }

  /**
   * Check if technician has handled tickets for a specific customer before
   */
  private static async hasHandledCustomer(
    userId: string,
    customerId: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(
        SELECT 1 FROM tickets
        WHERE assigned_to = $1
          AND customer_id = $2
          AND deleted_at IS NULL
      ) as has_handled`,
      [userId, customerId]
    );

    return result.rows[0].has_handled;
  }

  /**
   * Get assignment recommendations without actually assigning
   * Useful for UI to show suggested technicians
   */
  static async getAssignmentRecommendations(
    criteria: AssignmentCriteria,
    limit: number = 5
  ): Promise<AssignmentScore[]> {
    try {
      const candidates = await this.getEligibleTechnicians();

      if (candidates.length === 0) {
        return [];
      }

      const scores = await this.scoreCandidates(candidates, criteria);

      // Sort by score (highest first) and limit
      scores.sort((a, b) => b.score - a.score);

      return scores.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get assignment recommendations', { error });
      throw error;
    }
  }

  /**
   * Get technician workload statistics
   */
  static async getWorkloadStats(): Promise<{
    user_id: string;
    name: string;
    open_tickets: number;
    in_progress_tickets: number;
    avg_resolution_hours: number;
  }[]> {
    const result = await query(
      `SELECT
        u.id as user_id,
        u.name,
        COUNT(t.id) FILTER (WHERE t.status IN ('new', 'assigned')) as open_tickets,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tickets,
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)
          FILTER (WHERE t.resolved_at IS NOT NULL),
          0
        ) as avg_resolution_hours
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id AND t.deleted_at IS NULL
      WHERE u.role IN ('technician', 'admin', 'manager')
        AND u.deleted_at IS NULL
      GROUP BY u.id, u.name
      ORDER BY open_tickets DESC, in_progress_tickets DESC`
    );

    return result.rows.map((row) => ({
      user_id: row.user_id,
      name: row.name,
      open_tickets: parseInt(row.open_tickets, 10),
      in_progress_tickets: parseInt(row.in_progress_tickets, 10),
      avg_resolution_hours: parseFloat(row.avg_resolution_hours),
    }));
  }
}
