"use strict";
/**
 * Customer validation schemas using Joi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerFiltersSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createCustomerSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).required()
        .messages({
        'string.empty': 'Customer name is required',
        'string.max': 'Customer name cannot exceed 255 characters',
    }),
    display_name: joi_1.default.string().max(255).optional().allow(null, ''),
    customer_number: joi_1.default.string().max(50).optional().allow(null, ''),
    parent_customer_id: joi_1.default.string().uuid().optional().allow(null),
    type: joi_1.default.string().valid('business', 'residential', 'nonprofit', 'government').optional(),
    tier: joi_1.default.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional().allow(null),
    status: joi_1.default.string().valid('active', 'inactive', 'prospect', 'churned').optional(),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    phone: joi_1.default.string().max(50).optional().allow(null, ''),
    website: joi_1.default.string().uri().max(255).optional().allow(null, ''),
    address_line1: joi_1.default.string().max(255).optional().allow(null, ''),
    address_line2: joi_1.default.string().max(255).optional().allow(null, ''),
    city: joi_1.default.string().max(100).optional().allow(null, ''),
    state: joi_1.default.string().max(100).optional().allow(null, ''),
    postal_code: joi_1.default.string().max(20).optional().allow(null, ''),
    country: joi_1.default.string().length(3).optional().allow(null),
    tax_id: joi_1.default.string().max(50).optional().allow(null, ''),
    payment_terms: joi_1.default.number().integer().min(0).max(365).optional(),
    currency: joi_1.default.string().length(3).optional(),
    custom_fields: joi_1.default.object().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
});
exports.updateCustomerSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).optional(),
    display_name: joi_1.default.string().max(255).optional().allow(null, ''),
    parent_customer_id: joi_1.default.string().uuid().optional().allow(null),
    type: joi_1.default.string().valid('business', 'residential', 'nonprofit', 'government').optional(),
    tier: joi_1.default.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional().allow(null),
    status: joi_1.default.string().valid('active', 'inactive', 'prospect', 'churned').optional(),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    phone: joi_1.default.string().max(50).optional().allow(null, ''),
    website: joi_1.default.string().uri().max(255).optional().allow(null, ''),
    address_line1: joi_1.default.string().max(255).optional().allow(null, ''),
    address_line2: joi_1.default.string().max(255).optional().allow(null, ''),
    city: joi_1.default.string().max(100).optional().allow(null, ''),
    state: joi_1.default.string().max(100).optional().allow(null, ''),
    postal_code: joi_1.default.string().max(20).optional().allow(null, ''),
    country: joi_1.default.string().length(3).optional().allow(null),
    tax_id: joi_1.default.string().max(50).optional().allow(null, ''),
    payment_terms: joi_1.default.number().integer().min(0).max(365).optional(),
    currency: joi_1.default.string().length(3).optional(),
    custom_fields: joi_1.default.object().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
}).min(1);
exports.customerFiltersSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    status: joi_1.default.string().valid('active', 'inactive', 'prospect', 'churned').optional(),
    tier: joi_1.default.string().valid('platinum', 'gold', 'silver', 'bronze', 'trial').optional(),
    type: joi_1.default.string().valid('business', 'residential', 'nonprofit', 'government').optional(),
    search: joi_1.default.string().max(255).optional(),
    parent_customer_id: joi_1.default.string().uuid().optional(),
});
//# sourceMappingURL=customer.validator.js.map