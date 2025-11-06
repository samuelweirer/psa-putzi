/**
 * Comment Model
 *
 * Handles ticket and project comments with internal/external visibility.
 * Multi-tenancy: All queries MUST filter by tenant_id
 */

import { query } from '../utils/database';
import { Comment, PaginatedResponse } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { eventPublisher, createDomainEvent } from '../utils/event-publisher';

export class CommentModel {
  /**
   * Find all comments for a ticket with pagination
   */
  static async findByTicket(
    ticketId: string,
    tenantId: string,
    includeInternal = true,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Comment>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [
      'c.ticket_id = $1',
      'c.tenant_id = $2',
      'c.deleted_at IS NULL',
    ];

    // Filter internal comments if requested
    if (!includeInternal) {
      conditions.push('c.is_internal = false');
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM comments c
       WHERE ${whereClause}`,
      [ticketId, tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch data with user info
    const dataResult = await query(
      `SELECT
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at ASC
       LIMIT $3 OFFSET $4`,
      [ticketId, tenantId, limit, offset]
    );

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find comment by ID
   */
  static async findById(id: string, tenantId: string): Promise<Comment> {
    const result = await query(
      `SELECT
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        t.ticket_number,
        t.title as ticket_title
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN tickets t ON c.ticket_id = t.id
       WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Comment with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create new comment
   */
  static async create(
    data: Partial<Comment>,
    tenantId: string,
    userId: string
  ): Promise<Comment> {
    // Validate required fields
    if (!data.ticket_id && !data.project_id) {
      throw new ValidationError('Either ticket_id or project_id is required');
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Comment content is required');
    }

    // Verify ticket exists if ticket_id provided
    if (data.ticket_id) {
      const ticketResult = await query(
        `SELECT id, first_response_at FROM tickets
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [data.ticket_id, tenantId]
      );

      if (ticketResult.rows.length === 0) {
        throw new NotFoundError(`Ticket ${data.ticket_id} not found`);
      }

      // Check if this is the first customer-facing comment (for first_response_at)
      const ticket = ticketResult.rows[0];
      if (!ticket.first_response_at && !data.is_internal) {
        // Update ticket's first_response_at
        await query(
          `UPDATE tickets
           SET first_response_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [data.ticket_id, tenantId]
        );
      }

      // Update ticket's updated_at timestamp
      await query(
        `UPDATE tickets
         SET updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [data.ticket_id, tenantId]
      );
    }

    // Create comment
    const result = await query(
      `INSERT INTO comments (
        tenant_id, ticket_id, project_id, user_id,
        content, is_internal, is_resolution, attachments
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *`,
      [
        tenantId,
        data.ticket_id || null,
        data.project_id || null,
        userId,
        data.content.trim(),
        data.is_internal || false,
        data.is_resolution || false,
        JSON.stringify(data.attachments || []),
      ]
    );

    const comment = result.rows[0];

    logger.info('Comment created', {
      commentId: comment.id,
      ticketId: data.ticket_id,
      userId,
      tenantId,
      isInternal: comment.is_internal,
      isResolution: comment.is_resolution,
    });

    // Publish comment.created event
    await eventPublisher.publish(
      'comment.created',
      createDomainEvent('comment.created', tenantId, { comment }, userId)
    );

    return comment;
  }

  /**
   * Update comment
   */
  static async update(
    id: string,
    tenantId: string,
    data: Partial<Comment>,
    userId?: string
  ): Promise<Comment> {
    // Verify comment exists
    const existing = await this.findById(id, tenantId);

    // Only the author can update their own comment
    if (userId && existing.user_id !== userId) {
      throw new ValidationError('You can only update your own comments');
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    const updateFields = ['content', 'is_internal', 'is_resolution'];

    updateFields.forEach((field) => {
      if (data[field as keyof Comment] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof Comment]);
        paramIndex++;
      }
    });

    // Handle attachments separately (JSONB)
    if (data.attachments !== undefined) {
      fields.push(`attachments = $${paramIndex}`);
      params.push(JSON.stringify(data.attachments));
      paramIndex++;
    }

    if (fields.length === 0) {
      // No fields to update
      return existing;
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    const result = await query(
      `UPDATE comments
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      params
    );

    const comment = result.rows[0];

    logger.info('Comment updated', { commentId: id, tenantId, changes: data });

    // Publish comment.updated event
    await eventPublisher.publish(
      'comment.updated',
      createDomainEvent('comment.updated', tenantId, { comment, changes: data }, userId)
    );

    return comment;
  }

  /**
   * Soft delete comment
   */
  static async softDelete(id: string, tenantId: string, userId?: string): Promise<void> {
    // Verify comment exists
    const comment = await this.findById(id, tenantId);

    // Only the author can delete their own comment
    if (userId && comment.user_id !== userId) {
      throw new ValidationError('You can only delete your own comments');
    }

    await query(
      `UPDATE comments
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    logger.info('Comment deleted', { commentId: id, tenantId });

    // Publish comment.deleted event
    await eventPublisher.publish(
      'comment.deleted',
      createDomainEvent('comment.deleted', tenantId, { commentId: id, comment }, userId)
    );
  }

  /**
   * Get comment count for a ticket
   */
  static async getTicketCommentCount(ticketId: string, tenantId: string): Promise<{
    total: number;
    internal: number;
    external: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_internal = true) as internal,
        COUNT(*) FILTER (WHERE is_internal = false) as external
       FROM comments
       WHERE ticket_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [ticketId, tenantId]
    );

    return {
      total: parseInt(result.rows[0].total, 10),
      internal: parseInt(result.rows[0].internal, 10),
      external: parseInt(result.rows[0].external, 10),
    };
  }

  /**
   * Get activity timeline for a ticket (comments + system events)
   * This can be expanded to include ticket status changes, assignments, etc.
   */
  static async getTicketActivity(
    ticketId: string,
    tenantId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM comments
       WHERE ticket_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [ticketId, tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch comments
    const dataResult = await query(
      `SELECT
        c.id,
        c.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        c.content,
        c.is_internal,
        c.is_resolution,
        c.created_at,
        'comment' as activity_type
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT $3 OFFSET $4`,
      [ticketId, tenantId, limit, offset]
    );

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
