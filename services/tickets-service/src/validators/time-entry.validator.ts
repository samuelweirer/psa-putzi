/**
 * Time Entry validation schemas using Joi
 */

import Joi from 'joi';

// Schema for creating time entry from ticket endpoint (ticket_id comes from URL)
export const createTicketTimeEntrySchema = Joi.object({
  date: Joi.date().optional(),

  hours: Joi.number().min(0.25).max(24).required()
    .messages({
      'number.base': 'hours must be a number',
      'number.min': 'hours must be at least 0.25 (15 minutes)',
      'number.max': 'hours cannot exceed 24',
      'any.required': 'hours is required',
    }),

  description: Joi.string().min(1).max(1000).required()
    .messages({
      'string.empty': 'Description is required',
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  notes: Joi.string().max(2000).optional().allow(null, ''),

  work_type: Joi.string().valid('support', 'project', 'consulting', 'emergency').optional(),

  billable: Joi.boolean().optional(),
});

// Generic schema for creating time entry (requires ticket_id or project_task_id)
export const createTimeEntrySchema = Joi.object({
  ticket_id: Joi.string().uuid().optional().allow(null),

  project_task_id: Joi.string().uuid().optional().allow(null),

  date: Joi.date().optional(),

  hours: Joi.number().min(0.25).max(24).required()
    .messages({
      'number.base': 'hours must be a number',
      'number.min': 'hours must be at least 0.25 (15 minutes)',
      'number.max': 'hours cannot exceed 24',
      'any.required': 'hours is required',
    }),

  description: Joi.string().min(1).max(1000).required()
    .messages({
      'string.empty': 'Description is required',
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  notes: Joi.string().max(2000).optional().allow(null, ''),

  work_type: Joi.string().valid('support', 'project', 'consulting', 'emergency').optional(),

  billable: Joi.boolean().optional(),
}).custom((value, helpers) => {
  // At least one of ticket_id or project_task_id must be provided
  if (!value.ticket_id && !value.project_task_id) {
    return helpers.error('any.custom', {
      message: 'Either ticket_id or project_task_id is required',
    });
  }
  return value;
});

export const updateTimeEntrySchema = Joi.object({
  date: Joi.date().optional(),

  hours: Joi.number().min(0.25).max(24).optional(),

  description: Joi.string().min(1).max(1000).optional(),

  notes: Joi.string().max(2000).optional().allow(null, ''),

  work_type: Joi.string().valid('support', 'project', 'consulting', 'emergency').optional(),

  billable: Joi.boolean().optional(),
}).min(1);

export const timeEntryFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  user_id: Joi.string().uuid().optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional(),
  billable: Joi.boolean().optional(),
  billed: Joi.boolean().optional(),
  work_type: Joi.string().valid('support', 'project', 'consulting', 'emergency').optional(),
});
