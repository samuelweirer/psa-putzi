"use strict";
/**
 * Location validation schemas using Joi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLocationSchema = exports.createLocationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createLocationSchema = joi_1.default.object({
    customer_id: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Customer ID must be a valid UUID',
        'any.required': 'Customer ID is required',
    }),
    name: joi_1.default.string().min(1).max(200).required()
        .messages({
        'string.empty': 'Location name is required',
        'string.max': 'Location name cannot exceed 200 characters',
    }),
    location_type: joi_1.default.string().valid('headquarters', 'branch', 'datacenter', 'remote').optional().allow(null),
    address_line1: joi_1.default.string().min(1).max(255).required()
        .messages({
        'string.empty': 'Address line 1 is required',
        'string.max': 'Address line 1 cannot exceed 255 characters',
    }),
    address_line2: joi_1.default.string().max(255).optional().allow(null, ''),
    city: joi_1.default.string().min(1).max(100).required()
        .messages({
        'string.empty': 'City is required',
        'string.max': 'City cannot exceed 100 characters',
    }),
    state: joi_1.default.string().max(100).optional().allow(null, ''),
    postal_code: joi_1.default.string().min(1).max(20).required()
        .messages({
        'string.empty': 'Postal code is required',
        'string.max': 'Postal code cannot exceed 20 characters',
    }),
    country: joi_1.default.string().length(3).optional(),
    latitude: joi_1.default.number().min(-90).max(90).optional().allow(null),
    longitude: joi_1.default.number().min(-180).max(180).optional().allow(null),
    phone: joi_1.default.string().max(50).optional().allow(null, ''),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    custom_fields: joi_1.default.object().optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
});
exports.updateLocationSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(200).optional(),
    location_type: joi_1.default.string().valid('headquarters', 'branch', 'datacenter', 'remote').optional().allow(null),
    address_line1: joi_1.default.string().min(1).max(255).optional(),
    address_line2: joi_1.default.string().max(255).optional().allow(null, ''),
    city: joi_1.default.string().min(1).max(100).optional(),
    state: joi_1.default.string().max(100).optional().allow(null, ''),
    postal_code: joi_1.default.string().min(1).max(20).optional(),
    country: joi_1.default.string().length(3).optional(),
    latitude: joi_1.default.number().min(-90).max(90).optional().allow(null),
    longitude: joi_1.default.number().min(-180).max(180).optional().allow(null),
    phone: joi_1.default.string().max(50).optional().allow(null, ''),
    email: joi_1.default.string().email().max(255).optional().allow(null, ''),
    custom_fields: joi_1.default.object().optional(),
    notes: joi_1.default.string().optional().allow(null, ''),
}).min(1);
//# sourceMappingURL=location.validator.js.map