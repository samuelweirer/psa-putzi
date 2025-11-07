/**
 * Attachment Controller
 * Handles file upload/download and attachment management
 */

import { Response } from 'express';
import { AttachmentModel } from '../models/attachment.model';
import { AuthRequest } from '../types';
import logger from '../utils/logger';
import {
  isAllowedMimeType,
  isValidFileSize,
  sanitizeFilename,
  formatFileSize,
  MAX_FILE_SIZE,
  MAX_TICKET_ATTACHMENTS_SIZE,
} from '../validators/attachment.validator';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload directory (configurable via env)
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/psa-uploads';

export class AttachmentController {
  /**
   * Upload attachment
   * POST /api/v1/tickets/:ticketId/attachments
   * POST /api/v1/comments/:commentId/attachments
   */
  static async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const file = (req as any).file; // Multer adds this

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate MIME type
      if (!isAllowedMimeType(file.mimetype)) {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {});
        res.status(400).json({
          error: `File type not allowed: ${file.mimetype}`,
          allowed_types: 'Images, PDFs, Office documents, text files, archives',
        });
        return;
      }

      // Validate file size
      if (!isValidFileSize(file.size)) {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {});
        res.status(400).json({
          error: `File too large: ${formatFileSize(file.size)}`,
          max_size: formatFileSize(MAX_FILE_SIZE),
        });
        return;
      }

      const ticketId = req.params.ticketId;
      const commentId = req.params.commentId;

      // Check ticket attachment quota if attaching to ticket
      if (ticketId) {
        const stats = await AttachmentModel.getTicketStats(ticketId);
        if (stats.total_size + file.size > MAX_TICKET_ATTACHMENTS_SIZE) {
          await fs.unlink(file.path).catch(() => {});
          res.status(400).json({
            error: `Ticket attachment quota exceeded`,
            current_size: formatFileSize(stats.total_size),
            max_size: formatFileSize(MAX_TICKET_ATTACHMENTS_SIZE),
          });
          return;
        }
      }

      // Generate unique filename
      const ext = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${ext}`;
      const sanitizedOriginal = sanitizeFilename(file.originalname);

      // Create attachment record
      const attachment = await AttachmentModel.create(
        {
          ticket_id: ticketId,
          comment_id: commentId,
          filename: uniqueFilename,
          original_filename: sanitizedOriginal,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          storage_type: 'local',
          metadata: {
            uploaded_from: req.ip,
            user_agent: req.get('user-agent'),
          },
        },
        user.id
      );

      res.status(201).json(attachment);
    } catch (error) {
      logger.error('Failed to upload attachment', { error });
      res.status(500).json({ error: 'Failed to upload attachment' });
    }
  }

  /**
   * Download attachment
   * GET /api/v1/attachments/:id/download
   */
  static async download(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const attachment = await AttachmentModel.findById(id);

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      // Check if file exists
      try {
        await fs.access(attachment.file_path);
      } catch {
        res.status(404).json({ error: 'File not found on disk' });
        return;
      }

      // Set headers for download
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
      res.setHeader('Content-Length', attachment.file_size.toString());

      // Stream file
      const fileStream = require('fs').createReadStream(attachment.file_path);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('Failed to download attachment', { error });
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  }

  /**
   * List attachments for ticket
   * GET /api/v1/tickets/:ticketId/attachments
   */
  static async listByTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;

      const attachments = await AttachmentModel.findByTicketId(ticketId);

      res.json({
        data: attachments,
        count: attachments.length,
      });
    } catch (error) {
      logger.error('Failed to list ticket attachments', { error });
      res.status(500).json({ error: 'Failed to list attachments' });
    }
  }

  /**
   * List attachments for comment
   * GET /api/v1/comments/:commentId/attachments
   */
  static async listByComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;

      const attachments = await AttachmentModel.findByCommentId(commentId);

      res.json({
        data: attachments,
        count: attachments.length,
      });
    } catch (error) {
      logger.error('Failed to list comment attachments', { error });
      res.status(500).json({ error: 'Failed to list attachments' });
    }
  }

  /**
   * Delete attachment
   * DELETE /api/v1/attachments/:id
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const attachment = await AttachmentModel.findById(id);

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      await AttachmentModel.delete(id, user.id, user.role);

      // Delete file from disk
      await fs.unlink(attachment.file_path).catch((error) => {
        logger.warn('Failed to delete file from disk', { error, path: attachment.file_path });
      });

      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes('Only the uploader')) {
        res.status(403).json({ error: error.message });
        return;
      }

      logger.error('Failed to delete attachment', { error });
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }

  /**
   * Get attachment statistics for ticket
   * GET /api/v1/tickets/:ticketId/attachments/stats
   */
  static async getTicketStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;

      const stats = await AttachmentModel.getTicketStats(ticketId);

      res.json({
        count: stats.count,
        total_size: stats.total_size,
        total_size_formatted: formatFileSize(stats.total_size),
        max_size: MAX_TICKET_ATTACHMENTS_SIZE,
        max_size_formatted: formatFileSize(MAX_TICKET_ATTACHMENTS_SIZE),
        remaining: MAX_TICKET_ATTACHMENTS_SIZE - stats.total_size,
        remaining_formatted: formatFileSize(MAX_TICKET_ATTACHMENTS_SIZE - stats.total_size),
      });
    } catch (error) {
      logger.error('Failed to get attachment stats', { error });
      res.status(500).json({ error: 'Failed to get attachment statistics' });
    }
  }
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info('Upload directory ready', { path: UPLOAD_DIR });
  } catch (error) {
    logger.error('Failed to create upload directory', { error, path: UPLOAD_DIR });
    throw error;
  }
}
