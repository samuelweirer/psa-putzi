/**
 * Attachment Routes
 * File upload/download and attachment management
 */

import { Router } from 'express';
import { AttachmentController } from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

/**
 * Configure multer for file uploads
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/psa-uploads';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Temporary filename - will be renamed after validation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Single file upload
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * Upload attachment to ticket
 * POST /api/v1/tickets/:ticketId/attachments
 */
router.post(
  '/tickets/:ticketId/attachments',
  upload.single('file'),
  AttachmentController.upload
);

/**
 * Upload attachment to comment
 * POST /api/v1/comments/:commentId/attachments
 */
router.post(
  '/comments/:commentId/attachments',
  upload.single('file'),
  AttachmentController.upload
);

/**
 * Download attachment
 * GET /api/v1/attachments/:id/download
 */
router.get('/attachments/:id/download', AttachmentController.download);

/**
 * List attachments for ticket
 * GET /api/v1/tickets/:ticketId/attachments
 */
router.get('/tickets/:ticketId/attachments', AttachmentController.listByTicket);

/**
 * List attachments for comment
 * GET /api/v1/comments/:commentId/attachments
 */
router.get('/comments/:commentId/attachments', AttachmentController.listByComment);

/**
 * Delete attachment
 * DELETE /api/v1/attachments/:id
 */
router.delete('/attachments/:id', AttachmentController.delete);

/**
 * Get attachment statistics for ticket
 * GET /api/v1/tickets/:ticketId/attachments/stats
 */
router.get('/tickets/:ticketId/attachments/stats', AttachmentController.getTicketStats);

export default router;
