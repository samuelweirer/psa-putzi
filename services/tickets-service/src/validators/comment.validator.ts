/**
 * Comment Validators (Joi schemas)
 */

import Joi from 'joi';

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.max': 'Comment content must not exceed 5000 characters',
    }),
  is_internal: Joi.boolean().optional().default(false)
    .description('Whether this is an internal comment (not visible to customers)'),
  is_resolution: Joi.boolean().optional().default(false)
    .description('Whether this comment resolves the ticket'),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().uri().required(),
      size: Joi.number().integer().min(0).required(),
      mime_type: Joi.string().required(),
    })
  ).optional().default([])
    .description('Array of attachment objects'),
});

/**
 * Schema for updating an existing comment
 */
export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).optional()
    .messages({
      'string.empty': 'Comment content cannot be empty',
      'string.max': 'Comment content must not exceed 5000 characters',
    }),
  is_internal: Joi.boolean().optional()
    .description('Whether this is an internal comment (not visible to customers)'),
  is_resolution: Joi.boolean().optional()
    .description('Whether this comment resolves the ticket'),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().uri().required(),
      size: Joi.number().integer().min(0).required(),
      mime_type: Joi.string().required(),
    })
  ).optional()
    .description('Array of attachment objects'),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for comment list filters
 */
export const commentFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1)
    .description('Page number for pagination'),
  limit: Joi.number().integer().min(1).max(100).optional().default(50)
    .description('Number of items per page'),
  include_internal: Joi.boolean().optional().default(true)
    .description('Whether to include internal comments in results'),
});
