/**
 * Ticket Comment routes (nested under tickets)
 */

import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  createCommentSchema,
  commentFiltersSchema,
} from '../validators/comment.validator';

const router = Router({ mergeParams: true }); // mergeParams to access :ticketId

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/tickets/:ticketId/comments/count
 * @desc Get comment count statistics for a ticket
 * @access Private
 */
router.get('/count', CommentController.getCommentCount);

/**
 * @route GET /api/v1/tickets/:ticketId/comments
 * @desc List all comments for a ticket
 * @access Private
 */
router.get(
  '/',
  validate(commentFiltersSchema),
  CommentController.listComments
);

/**
 * @route POST /api/v1/tickets/:ticketId/comments
 * @desc Create new comment for ticket
 * @access Private
 */
router.post(
  '/',
  validate(createCommentSchema),
  CommentController.createComment
);

export default router;
