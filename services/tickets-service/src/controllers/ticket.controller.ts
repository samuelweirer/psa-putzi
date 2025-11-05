/**
 * Ticket Controller
 *
 * Handles HTTP requests for ticket management
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, TicketFilters } from '../types';
import { TicketModel } from '../models/ticket.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class TicketController {
  /**
   * GET /api/v1/tickets
   * List all tickets with filters and pagination
   */
  static async listTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      // Extract filters
      const filters: TicketFilters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        assigned_to: req.query.assigned_to as string,
        customer_id: req.query.customer_id as string,
        search: req.query.search as string,
        sla_breached: req.query.sla_breached === 'true' ? true : req.query.sla_breached === 'false' ? false : undefined,
        created_from: req.query.created_from ? new Date(req.query.created_from as string) : undefined,
        created_to: req.query.created_to ? new Date(req.query.created_to as string) : undefined,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof TicketFilters] === undefined) {
          delete filters[key as keyof TicketFilters];
        }
      });

      const result = await TicketModel.findAll(tenant_id, filters, page, limit);

      logger.info('Tickets listed', {
        tenantId: tenant_id,
        count: result.data.length,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/:id
   * Get single ticket by ID
   */
  static async getTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const ticket = await TicketModel.findById(id, tenant_id);

      logger.info('Ticket retrieved', { ticketId: id, tenantId: tenant_id });

      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tickets
   * Create new ticket
   */
  static async createTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id, id: userId } = req.user;

      const ticket = await TicketModel.create(req.body, tenant_id, userId);

      logger.info('Ticket created', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        tenantId: tenant_id,
        userId,
      });

      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/tickets/:id
   * Update ticket
   */
  static async updateTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      const ticket = await TicketModel.update(id, tenant_id, req.body, userId);

      logger.info('Ticket updated', {
        ticketId: id,
        tenantId: tenant_id,
        userId,
      });

      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/tickets/:id/status
   * Update ticket status (with workflow validation)
   */
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;
      const { status } = req.body;

      const ticket = await TicketModel.update(id, tenant_id, { status }, userId);

      logger.info('Ticket status updated', {
        ticketId: id,
        newStatus: status,
        tenantId: tenant_id,
        userId,
      });

      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/tickets/:id/assign
   * Assign ticket to user
   */
  static async assignTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;
      const { assigned_to } = req.body;

      const ticket = await TicketModel.update(id, tenant_id, { assigned_to, status: 'assigned' }, userId);

      logger.info('Ticket assigned', {
        ticketId: id,
        assignedTo: assigned_to,
        tenantId: tenant_id,
        userId,
      });

      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/tickets/:id
   * Soft delete ticket
   */
  static async deleteTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      await TicketModel.softDelete(id, tenant_id, userId);

      logger.info('Ticket deleted', {
        ticketId: id,
        tenantId: tenant_id,
        userId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/statistics
   * Get ticket statistics
   */
  static async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;

      const stats = await TicketModel.getStatistics(tenant_id);

      logger.info('Ticket statistics retrieved', { tenantId: tenant_id });

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/my-tickets
   * Get tickets assigned to current user
   */
  static async getMyTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id: userId, tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await TicketModel.findByAssignedUser(userId, tenant_id, page, limit);

      logger.info('My tickets retrieved', {
        userId,
        tenantId: tenant_id,
        count: result.data.length,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
