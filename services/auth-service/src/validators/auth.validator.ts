/**
 * Request validation schemas using Joi
 */

import Joi from 'joi';
import { UserRole } from '../types';

const userRoles: UserRole[] = [
  'system_admin', 'tenant_admin', 'security_admin', 'service_manager',
  'software_developer_lead', 'software_developer_senior', 'software_developer', 'software_developer_junior',
  'technician_lead', 'technician_senior', 'technician', 'technician_junior',
  'technician_l3', 'technician_l2', 'technician_l1',
  'account_manager', 'project_manager', 'billing_manager',
  'customer_admin', 'customer_technician', 'customer_user'
];

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(12).required().messages({
    'string.min': 'Password must be at least 12 characters long',
    'any.required': 'Password is required'
  }),
  first_name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'First name is required',
    'string.max': 'First name cannot exceed 100 characters',
    'any.required': 'First name is required'
  }),
  last_name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name cannot exceed 100 characters',
    'any.required': 'Last name is required'
  }),
  role: Joi.string().valid(...userRoles).optional().messages({
    'any.only': 'Invalid role specified'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
  mfa_code: Joi.string().pattern(/^[A-Z0-9]{6,10}$/i).optional().messages({
    'string.pattern.base': 'MFA code must be 6-10 alphanumeric characters'
  })
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

export const logoutSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  new_password: Joi.string().min(12).required().messages({
    'string.min': 'Password must be at least 12 characters long',
    'any.required': 'New password is required'
  })
});

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  new_password: Joi.string().min(12).required().messages({
    'string.min': 'New password must be at least 12 characters long',
    'any.required': 'New password is required'
  })
});

export const mfaVerifySchema = Joi.object({
  setup_token: Joi.string().required().messages({
    'any.required': 'Setup token is required'
  }),
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'MFA code must be 6 digits',
    'any.required': 'MFA code is required'
  })
});

export const mfaDisableSchema = Joi.object({
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
  code: Joi.string().pattern(/^[A-Z0-9]{6,10}$/i).required().messages({
    'string.pattern.base': 'MFA code must be 6-10 alphanumeric characters',
    'any.required': 'MFA code is required'
  })
});
