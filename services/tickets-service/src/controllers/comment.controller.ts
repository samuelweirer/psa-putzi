/**
 * Comment Controller
 *
 * Handles HTTP requests for ticket and project comments
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CommentModel } from '../models/comment.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class CommentController {
  /**
   * GET /api/v1/tickets/:ticketId/comments
   * List all comments for a ticket
   */
  static async listComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { ticketId } = req.params;
      const { tenant_id } = req.user;

      // Extract filters
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const includeInternal = req.query.include_internal === 'true' || req.query.include_internal === undefined;

      const result = await CommentModel.findByTicket(
        ticketId,
        tenant_id,
        includeInternal,
        page,
        limit
      );

      logger.info('Comments listed', {
        tenantId: tenant_id,
        ticketId,
        count: result.data.length,
        includeInternal,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/comments/:id
   * Get single comment by ID
   */
  static async getComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const comment = await CommentModel.findById(id, tenant_id);

      logger.info('Comment retrieved', { commentId: id, tenantId: tenant_id });

      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tickets/:ticketId/comments
   * Create new comment for ticket
   *
   * CRITICAL: Automatically updates ticket.first_response_at if this is
   * the first customer-facing comment on the ticket.
   */
  static async createComment(req: AuthRequest, res: Response, next: NextFunction) {
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

      const comment = await CommentModel.create(data, tenant_id, userId);

      logger.info('Comment created', {
        commentId: comment.id,
        ticketId,
        tenantId: tenant_id,
        userId,
        isInternal: comment.is_internal,
        isResolution: comment.is_resolution,
      });

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/comments/:id
   * Update comment
   *
   * NOTE: Only the comment author can update their own comment
   */
  static async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      const comment = await CommentModel.update(id, tenant_id, req.body, userId);

      logger.info('Comment updated', {
        commentId: id,
        tenantId: tenant_id,
        userId,
      });

      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/comments/:id
   * Delete comment (soft delete)
   *
   * NOTE: Only the comment author can delete their own comment
   */
  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id, id: userId } = req.user;

      await CommentModel.softDelete(id, tenant_id, userId);

      logger.info('Comment deleted', {
        commentId: id,
        tenantId: tenant_id,
        userId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/:ticketId/comments/count
   * Get comment count statistics for a ticket
   */
  static async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { ticketId } = req.params;
      const { tenant_id } = req.user;

      const counts = await CommentModel.getTicketCommentCount(ticketId, tenant_id);

      logger.info('Comment count retrieved', {
        ticketId,
        tenantId: tenant_id,
        total: counts.total,
      });

      res.json(counts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tickets/:id/activity
   * Get activity timeline for a ticket (comments + system events)
   */
  static async getTicketActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id: ticketId } = req.params;
      const { tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await CommentModel.getTicketActivity(ticketId, tenant_id, page, limit);

      logger.info('Ticket activity retrieved', {
        ticketId,
        tenantId: tenant_id,
        count: result.data.length,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
