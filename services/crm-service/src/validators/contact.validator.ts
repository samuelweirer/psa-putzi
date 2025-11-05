/**
 * Contact validation schemas using Joi
 */

import Joi from 'joi';

export const createContactSchema = Joi.object({
  customer_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Customer ID must be a valid UUID',
      'any.required': 'Customer ID is required',
    }),

  first_name: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name cannot exceed 100 characters',
    }),

  last_name: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name cannot exceed 100 characters',
    }),

  title: Joi.string().max(50).optional().allow(null, ''),

  department: Joi.string().max(100).optional().allow(null, ''),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  phone_office: Joi.string().max(50).optional().allow(null, ''),

  phone_mobile: Joi.string().max(50).optional().allow(null, ''),

  phone_direct: Joi.string().max(50).optional().allow(null, ''),

  is_primary: Joi.boolean().optional(),

  is_billing: Joi.boolean().optional(),

  is_technical: Joi.boolean().optional(),

  custom_fields: Joi.object().optional(),

  notes: Joi.string().optional().allow(null, ''),
});

export const updateContactSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),

  last_name: Joi.string().min(1).max(100).optional(),

  title: Joi.string().max(50).optional().allow(null, ''),

  department: Joi.string().max(100).optional().allow(null, ''),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  phone_office: Joi.string().max(50).optional().allow(null, ''),

  phone_mobile: Joi.string().max(50).optional().allow(null, ''),

  phone_direct: Joi.string().max(50).optional().allow(null, ''),

  is_primary: Joi.boolean().optional(),

  is_billing: Joi.boolean().optional(),

  is_technical: Joi.boolean().optional(),

  custom_fields: Joi.object().optional(),

  notes: Joi.string().optional().allow(null, ''),
}).min(1);
