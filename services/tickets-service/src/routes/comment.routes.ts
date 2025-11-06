/**
 * Comment routes (standalone)
 */

import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import { updateCommentSchema } from '../validators/comment.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/comments/:id
 * @desc Get single comment by ID
 * @access Private
 */
router.get('/:id', CommentController.getComment);

/**
 * @route PUT /api/v1/comments/:id
 * @desc Update comment
 * @access Private (author only)
 */
router.put(
  '/:id',
  validate(updateCommentSchema),
  CommentController.updateComment
);

/**
 * @route DELETE /api/v1/comments/:id
 * @desc Delete comment (soft delete)
 * @access Private (author only)
 */
router.delete('/:id', CommentController.deleteComment);

export default router;
