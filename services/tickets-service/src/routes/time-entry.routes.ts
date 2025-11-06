/**
 * Time Entry routes
 */

import { Router } from 'express';
import { TimeEntryController } from '../controllers/time-entry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  updateTimeEntrySchema,
} from '../validators/time-entry.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/time-entries/unbilled
 * @desc Get all unbilled time entries for tenant
 * @access Private
 */
router.get('/unbilled', TimeEntryController.getUnbilledTimeEntries);

/**
 * @route GET /api/v1/time-entries/:id
 * @desc Get single time entry by ID
 * @access Private
 */
router.get('/:id', TimeEntryController.getTimeEntry);

/**
 * @route PUT /api/v1/time-entries/:id
 * @desc Update time entry
 * @access Private
 */
router.put(
  '/:id',
  validate(updateTimeEntrySchema),
  TimeEntryController.updateTimeEntry
);

/**
 * @route DELETE /api/v1/time-entries/:id
 * @desc Delete time entry
 * @access Private
 */
router.delete('/:id', TimeEntryController.deleteTimeEntry);

export default router;
