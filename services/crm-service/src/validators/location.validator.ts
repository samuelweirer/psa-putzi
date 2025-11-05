/**
 * Location validation schemas using Joi
 */

import Joi from 'joi';

export const createLocationSchema = Joi.object({
  customer_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Customer ID must be a valid UUID',
      'any.required': 'Customer ID is required',
    }),

  name: Joi.string().min(1).max(200).required()
    .messages({
      'string.empty': 'Location name is required',
      'string.max': 'Location name cannot exceed 200 characters',
    }),

  location_type: Joi.string().valid('headquarters', 'branch', 'datacenter', 'remote').optional().allow(null),

  address_line1: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Address line 1 is required',
      'string.max': 'Address line 1 cannot exceed 255 characters',
    }),

  address_line2: Joi.string().max(255).optional().allow(null, ''),

  city: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': 'City is required',
      'string.max': 'City cannot exceed 100 characters',
    }),

  state: Joi.string().max(100).optional().allow(null, ''),

  postal_code: Joi.string().min(1).max(20).required()
    .messages({
      'string.empty': 'Postal code is required',
      'string.max': 'Postal code cannot exceed 20 characters',
    }),

  country: Joi.string().length(3).optional(),

  latitude: Joi.number().min(-90).max(90).optional().allow(null),

  longitude: Joi.number().min(-180).max(180).optional().allow(null),

  phone: Joi.string().max(50).optional().allow(null, ''),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  custom_fields: Joi.object().optional(),

  notes: Joi.string().optional().allow(null, ''),
});

export const updateLocationSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),

  location_type: Joi.string().valid('headquarters', 'branch', 'datacenter', 'remote').optional().allow(null),

  address_line1: Joi.string().min(1).max(255).optional(),

  address_line2: Joi.string().max(255).optional().allow(null, ''),

  city: Joi.string().min(1).max(100).optional(),

  state: Joi.string().max(100).optional().allow(null, ''),

  postal_code: Joi.string().min(1).max(20).optional(),

  country: Joi.string().length(3).optional(),

  latitude: Joi.number().min(-90).max(90).optional().allow(null),

  longitude: Joi.number().min(-180).max(180).optional().allow(null),

  phone: Joi.string().max(50).optional().allow(null, ''),

  email: Joi.string().email().max(255).optional().allow(null, ''),

  custom_fields: Joi.object().optional(),

  notes: Joi.string().optional().allow(null, ''),
}).min(1);
