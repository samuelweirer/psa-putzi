/**
 * Customer validation schemas using Joi
 */

import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Customer name is required',
      'string.max': 'Customer name cannot exceed 255 characters',
    }),

  display_name: Joi.string().max(255).optional().allow(null, ''),

  customer_number: Joi.string().max(50).optional().allow(null, ''),

  parent_customer_id: Joi.string().uuid().optional().allow(null),

  type: Joi.string().valid('business', 'residential', 'nonprofit', 'government').optional(),

  tier: Joi.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional().allow(null),

  status: Joi.string().valid('active', 'inactive', 'prospect', 'churned').optional(),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  phone: Joi.string().max(50).optional().allow(null, ''),

  website: Joi.string().uri().max(255).optional().allow(null, ''),

  address_line1: Joi.string().max(255).optional().allow(null, ''),

  address_line2: Joi.string().max(255).optional().allow(null, ''),

  city: Joi.string().max(100).optional().allow(null, ''),

  state: Joi.string().max(100).optional().allow(null, ''),

  postal_code: Joi.string().max(20).optional().allow(null, ''),

  country: Joi.string().length(3).optional().allow(null),

  tax_id: Joi.string().max(50).optional().allow(null, ''),

  payment_terms: Joi.number().integer().min(0).max(365).optional(),

  currency: Joi.string().length(3).optional(),

  custom_fields: Joi.object().optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  notes: Joi.string().optional().allow(null, ''),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),

  display_name: Joi.string().max(255).optional().allow(null, ''),

  parent_customer_id: Joi.string().uuid().optional().allow(null),

  type: Joi.string().valid('business', 'residential', 'nonprofit', 'government').optional(),

  tier: Joi.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional().allow(null),

  status: Joi.string().valid('active', 'inactive', 'prospect', 'churned').optional(),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  phone: Joi.string().max(50).optional().allow(null, ''),

  website: Joi.string().uri().max(255).optional().allow(null, ''),

  address_line1: Joi.string().max(255).optional().allow(null, ''),

  address_line2: Joi.string().max(255).optional().allow(null, ''),

  city: Joi.string().max(100).optional().allow(null, ''),

  state: Joi.string().max(100).optional().allow(null, ''),

  postal_code: Joi.string().max(20).optional().allow(null, ''),

  country: Joi.string().length(3).optional().allow(null),

  tax_id: Joi.string().max(50).optional().allow(null, ''),

  payment_terms: Joi.number().integer().min(0).max(365).optional(),

  currency: Joi.string().length(3).optional(),

  custom_fields: Joi.object().optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  notes: Joi.string().optional().allow(null, ''),
}).min(1);

export const customerFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('active', 'inactive', 'prospect', 'churned').optional(),
  tier: Joi.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional(),
  type: Joi.string().valid('business', 'residential', 'nonprofit', 'government').optional(),
  search: Joi.string().max(255).optional(),
  parent_customer_id: Joi.string().uuid().optional(),
});
