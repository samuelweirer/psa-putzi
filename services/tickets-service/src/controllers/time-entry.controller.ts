/**
 * Time Entry Controller
 *
 * Handles HTTP requests for time tracking with automatic billing rate resolution
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { TimeEntryModel } from '../models/time-entry.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class TimeEntryController {
  /**
   * GET /api/v1/tickets/:ticketId/time-entries
   * List all time entries for a ticket
   */
  static async listTimeEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { ticketId } = req.params;
      const { tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await TimeEntryModel.findByTicket(ticketId, tenant_id, page, limit);

      logger.info('Time entries listed', {
        tenantId: tenant_id,
        ticketId,
        count: result.data.length,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/time-entries/:id
   * Get single time entry by ID
   */
  static async getTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const timeEntry = await TimeEntryModel.findById(id, tenant_id);

      logger.info('Time entry retrieved', { timeEntryId: id, tenantId: tenant_id });

      res.json(timeEntry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tickets/:ticketId/time-entries
   * Create new time entry with automatic rate resolution
   *
   * CRITICAL: This endpoint automatically resolves billing and cost rates
   * using the 4-level hierarchy and snapshots them in the database.
   */
  static async createTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { ticketId } = req.params;
      const { tenant_id, id: userId } = req.user;

      // Add ticket_id to body
      const data = {
        ...req.body,
        ticket_id: ticketId,
      };

      const timeEntry = await TimeEntryModel.create(data, tenant_id, userId);

      logger.info('Time entry created', {
        timeEntryId: timeEntry.id,
        ticketId,
        tenantId: tenant_id,
        userId,
        hours: timeEntry.hours,
        billingRate: timeEntry.billing_rate,
      });

      res.status(201).json(timeEntry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/time-entries/:id
   * Update time entry
   *
   * NOTE: Billing and cost rates cannot be updated (snapshot pattern)
   */
  static async updateTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      const timeEntry = await TimeEntryModel.update(id, tenant_id, req.body, userId);

      logger.info('Time entry updated', {
        timeEntryId: id,
        tenantId: tenant_id,
        userId,
      });

      res.json(timeEntry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/time-entries/:id
   * Delete time entry
   *
   * NOTE: Cannot delete if already billed
   */
  static async deleteTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      await TimeEntryModel.delete(id, tenant_id, userId);

      logger.info('Time entry deleted', {
        timeEntryId: id,
        tenantId: tenant_id,
        userId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/:ticketId/time-entries/summary
   * Get time entry summary for a ticket
   */
  static async getTicketSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { ticketId } = req.params;
      const { tenant_id } = req.user;

      const summary = await TimeEntryModel.getTicketSummary(ticketId, tenant_id);

      logger.info('Time entry summary retrieved', {
        ticketId,
        tenantId: tenant_id,
        totalHours: summary.total_hours,
      });

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/time-entries/unbilled
   * Get all unbilled time entries for tenant
   */
  static async getUnbilledTimeEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await TimeEntryModel.findUnbilled(tenant_id, page, limit);

      logger.info('Unbilled time entries retrieved', {
        tenantId: tenant_id,
        count: result.data.length,
        total: result.pagination.total,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
