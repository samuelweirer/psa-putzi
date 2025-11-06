/**
 * Ticket Time Entry routes (nested under tickets)
 */

import { Router } from 'express';
import { TimeEntryController } from '../controllers/time-entry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  createTimeEntrySchema,
  timeEntryFiltersSchema,
} from '../validators/time-entry.validator';

const router = Router({ mergeParams: true }); // mergeParams to access :ticketId

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/tickets/:ticketId/time-entries/summary
 * @desc Get time entry summary for a ticket
 * @access Private
 */
router.get('/summary', TimeEntryController.getTicketSummary);

/**
 * @route GET /api/v1/tickets/:ticketId/time-entries
 * @desc List all time entries for a ticket
 * @access Private
 */
router.get(
  '/',
  validate(timeEntryFiltersSchema),
  TimeEntryController.listTimeEntries
);

/**
 * @route POST /api/v1/tickets/:ticketId/time-entries
 * @desc Create new time entry for ticket (with automatic rate resolution)
 * @access Private
 */
router.post(
  '/',
  validate(createTimeEntrySchema),
  TimeEntryController.createTimeEntry
);

export default router;
