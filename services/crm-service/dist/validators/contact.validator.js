"use strict";
/**
 * Contact validation schemas using Joi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactSchema = exports.createContactSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createContactSchema = joi_1.default.object({
    customer_id: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Customer ID must be a valid UUID',
        'any.required': 'Customer ID is required',
    }),
    first_name: joi_1.default.string().min(1).max(100).required()
        .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 100 characters',
    }),
    last_name: joi_1.default.string().min(1).max(100).required()
        .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 100 characters',
    }),
    title: joi_1.default.string().max(50).optional().allow(null, ''),
    department: joi_1.default.string().max(100).optional().allow(null, ''),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    phone_office: joi_1.default.string().max(50).optional().allow(null, ''),
    phone_mobile: joi_1.default.string().max(50).optional().allow(null, ''),
    phone_direct: joi_1.default.string().max(50).optional().allow(null, ''),
    is_primary: joi_1.default.boolean().optional(),
    is_billing: joi_1.default.boolean().optional(),
    is_technical: joi_1.default.boolean().optional(),
    custom_fields: joi_1.default.object().optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
});
exports.updateContactSchema = joi_1.default.object({
    first_name: joi_1.default.string().min(1).max(100).optional(),
    last_name: joi_1.default.string().min(1).max(100).optional(),
    title: joi_1.default.string().max(50).optional().allow(null, ''),
    department: joi_1.default.string().max(100).optional().allow(null, ''),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    phone_office: joi_1.default.string().max(50).optional().allow(null, ''),
    phone_mobile: joi_1.default.string().max(50).optional().allow(null, ''),
    phone_direct: joi_1.default.string().max(50).optional().allow(null, ''),
    is_primary: joi_1.default.boolean().optional(),
    is_billing: joi_1.default.boolean().optional(),
    is_technical: joi_1.default.boolean().optional(),
    custom_fields: joi_1.default.object().optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
}).min(1);
//# sourceMappingURL=contact.validator.js.map