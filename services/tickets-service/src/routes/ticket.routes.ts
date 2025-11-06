/**
 * Ticket routes
 */

import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  createTicketSchema,
  updateTicketSchema,
  ticketFiltersSchema,
  updateStatusSchema,
  assignTicketSchema,
} from '../validators/ticket.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/tickets/statistics
 * @desc Get ticket statistics
 * @access Private
 */
router.get('/statistics', TicketController.getStatistics);

/**
 * @route GET /api/v1/tickets/my-tickets
 * @desc Get tickets assigned to current user
 * @access Private
 */
router.get('/my-tickets', TicketController.getMyTickets);

/**
 * @route GET /api/v1/tickets/:id/activity
 * @desc Get activity timeline for a ticket
 * @access Private
 */
router.get('/:id/activity', CommentController.getTicketActivity);

/**
 * @route GET /api/v1/tickets
 * @desc List all tickets with filters and pagination
 * @access Private
 */
router.get(
  '/',
  validate(ticketFiltersSchema),
  TicketController.listTickets
);

/**
 * @route GET /api/v1/tickets/:id
 * @desc Get single ticket by ID
 * @access Private
 */
router.get('/:id', TicketController.getTicket);

/**
 * @route POST /api/v1/tickets
 * @desc Create new ticket
 * @access Private
 */
router.post(
  '/',
  validate(createTicketSchema),
  TicketController.createTicket
);

/**
 * @route PUT /api/v1/tickets/:id
 * @desc Update ticket
 * @access Private
 */
router.put(
  '/:id',
  validate(updateTicketSchema),
  TicketController.updateTicket
);

/**
 * @route PATCH /api/v1/tickets/:id/status
 * @desc Update ticket status (with workflow validation)
 * @access Private
 */
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  TicketController.updateStatus
);

/**
 * @route PATCH /api/v1/tickets/:id/assign
 * @desc Assign ticket to user
 * @access Private
 */
router.patch(
  '/:id/assign',
  validate(assignTicketSchema),
  TicketController.assignTicket
);

/**
 * @route DELETE /api/v1/tickets/:id
 * @desc Soft delete ticket
 * @access Private
 */
router.delete('/:id', TicketController.deleteTicket);

export default router;
