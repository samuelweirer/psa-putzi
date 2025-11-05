/**
 * Ticket validation schemas using Joi
 */

import Joi from 'joi';

export const createTicketSchema = Joi.object({
  customer_id: Joi.string().uuid().required()
    .messages({
      'string.empty': 'Customer ID is required',
      'string.guid': 'Customer ID must be a valid UUID',
    }),

  contact_id: Joi.string().uuid().optional().allow(null),

  location_id: Joi.string().uuid().optional().allow(null),

  contract_id: Joi.string().uuid().optional().allow(null),

  title: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Ticket title is required',
      'string.max': 'Ticket title cannot exceed 255 characters',
    }),

  description: Joi.string().optional().allow(null, ''),

  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),

  status: Joi.string().valid('new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled').optional(),

  category: Joi.string().max(100).optional().allow(null, ''),

  subcategory: Joi.string().max(100).optional().allow(null, ''),

  assigned_to: Joi.string().uuid().optional().allow(null),

  assigned_team: Joi.string().uuid().optional().allow(null),

  custom_fields: Joi.object().optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  source: Joi.string().valid('email', 'portal', 'phone', 'rmm_alert', 'api').optional(),

  source_reference: Joi.string().max(200).optional().allow(null, ''),

  parent_ticket_id: Joi.string().uuid().optional().allow(null),
});

export const updateTicketSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),

  description: Joi.string().optional().allow(null, ''),

  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),

  status: Joi.string().valid('new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled').optional(),

  category: Joi.string().max(100).optional().allow(null, ''),

  subcategory: Joi.string().max(100).optional().allow(null, ''),

  assigned_to: Joi.string().uuid().optional().allow(null),

  assigned_team: Joi.string().uuid().optional().allow(null),

  contact_id: Joi.string().uuid().optional().allow(null),

  location_id: Joi.string().uuid().optional().allow(null),

  contract_id: Joi.string().uuid().optional().allow(null),

  custom_fields: Joi.object().optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  source: Joi.string().valid('email', 'portal', 'phone', 'rmm_alert', 'api').optional(),

  source_reference: Joi.string().max(200).optional().allow(null, ''),

  parent_ticket_id: Joi.string().uuid().optional().allow(null),
}).min(1);

export const ticketFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assigned_to: Joi.string().uuid().optional(),
  customer_id: Joi.string().uuid().optional(),
  search: Joi.string().max(255).optional(),
  sla_breached: Joi.boolean().optional(),
  created_from: Joi.date().optional(),
  created_to: Joi.date().optional(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled').required()
    .messages({
      'string.empty': 'Status is required',
      'any.only': 'Invalid status value',
    }),
});

export const assignTicketSchema = Joi.object({
  assigned_to: Joi.string().uuid().required()
    .messages({
      'string.empty': 'Assigned user ID is required',
      'string.guid': 'Assigned user ID must be a valid UUID',
    }),
});
