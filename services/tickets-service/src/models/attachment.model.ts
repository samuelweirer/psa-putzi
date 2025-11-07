/**
 * Attachment Model
 * Handles file attachments for tickets and comments
 */

import { query } from '../utils/database';
import { eventPublisher, createDomainEvent } from '../utils/event-publisher';
import logger from '../utils/logger';

export interface Attachment {
  id: string;
  ticket_id?: string;
  comment_id?: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  storage_type: 'local' | 's3';
  s3_bucket?: string;
  s3_key?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  deleted_at?: Date;
}

export class AttachmentModel {
  /**
   * Create a new attachment
   */
  static async create(
    data: Partial<Attachment>,
    userId: string
  ): Promise<Attachment> {
    try {
      // Validate required fields
      if (!data.filename || !data.file_path || !data.mime_type) {
        throw new Error('Missing required attachment fields');
      }

      // Validate that either ticket_id or comment_id is provided
      if (!data.ticket_id && !data.comment_id) {
        throw new Error('Attachment must be associated with either a ticket or comment');
      }

      const result = await query(
        `INSERT INTO attachments (
          ticket_id, comment_id, user_id,
          filename, original_filename, file_path, file_size,
          mime_type, storage_type, s3_bucket, s3_key, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          data.ticket_id || null,
          data.comment_id || null,
          userId,
          data.filename,
          data.original_filename || data.filename,
          data.file_path,
          data.file_size || 0,
          data.mime_type,
          data.storage_type || 'local',
          data.s3_bucket || null,
          data.s3_key || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      const attachment = result.rows[0];

      // Publish event
      await eventPublisher.publish(
        'attachment.created',
        createDomainEvent('attachment.created', 'default', {
          attachment_id: attachment.id,
          ticket_id: attachment.ticket_id,
          comment_id: attachment.comment_id,
          filename: attachment.filename,
          mime_type: attachment.mime_type,
          file_size: attachment.file_size,
        }, userId)
      );

      logger.info('Attachment created', {
        attachmentId: attachment.id,
        ticketId: attachment.ticket_id,
        commentId: attachment.comment_id,
        userId,
      });

      return attachment;
    } catch (error) {
      logger.error('Failed to create attachment', { error, data });
      throw error;
    }
  }

  /**
   * Get attachment by ID
   */
  static async findById(id: string): Promise<Attachment | null> {
    const result = await query(
      `SELECT * FROM attachments
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * List attachments for a ticket
   */
  static async findByTicketId(ticketId: string): Promise<Attachment[]> {
    const result = await query(
      `SELECT a.*, u.name as uploaded_by_name
       FROM attachments a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.ticket_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [ticketId]
    );

    return result.rows;
  }

  /**
   * List attachments for a comment
   */
  static async findByCommentId(commentId: string): Promise<Attachment[]> {
    const result = await query(
      `SELECT a.*, u.name as uploaded_by_name
       FROM attachments a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.comment_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [commentId]
    );

    return result.rows;
  }

  /**
   * Delete attachment (soft delete)
   * Only the uploader or admin can delete
   */
  static async delete(id: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Get attachment to check ownership
      const attachment = await this.findById(id);

      if (!attachment) {
        return false;
      }

      // Check if user can delete (owner or admin)
      if (attachment.user_id !== userId && userRole !== 'admin' && userRole !== 'manager') {
        throw new Error('Only the uploader or admin can delete attachments');
      }

      await query(
        `UPDATE attachments
         SET deleted_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // Publish event
      await eventPublisher.publish(
        'attachment.deleted',
        createDomainEvent('attachment.deleted', 'default', {
          attachment_id: id,
          ticket_id: attachment.ticket_id,
          comment_id: attachment.comment_id,
          filename: attachment.filename,
        }, userId)
      );

      logger.info('Attachment deleted', {
        attachmentId: id,
        userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete attachment', { error, id });
      throw error;
    }
  }

  /**
   * Get attachment statistics for a ticket
   */
  static async getTicketStats(ticketId: string): Promise<{
    count: number;
    total_size: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as count,
        COALESCE(SUM(file_size), 0) as total_size
       FROM attachments
       WHERE ticket_id = $1 AND deleted_at IS NULL`,
      [ticketId]
    );

    return {
      count: parseInt(result.rows[0].count, 10),
      total_size: parseInt(result.rows[0].total_size, 10),
    };
  }
}
