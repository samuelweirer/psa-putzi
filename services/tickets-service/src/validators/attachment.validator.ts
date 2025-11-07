/**
 * Attachment validation schemas
 */

import Joi from 'joi';

/**
 * Allowed MIME types for attachments
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text files
  'text/plain',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',

  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',

  // Logs
  'text/x-log',
  'application/x-log',
];

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Maximum total attachments per ticket: 100MB
 */
export const MAX_TICKET_ATTACHMENTS_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validate file upload metadata
 */
export const attachmentMetadataSchema = Joi.object({
  ticket_id: Joi.string().uuid().optional(),
  comment_id: Joi.string().uuid().optional(),
  description: Joi.string().max(500).optional(),
}).or('ticket_id', 'comment_id'); // At least one must be present

/**
 * Validate file MIME type
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize filename (remove dangerous characters)
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and other dangerous characters
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 255); // Max filename length
}
