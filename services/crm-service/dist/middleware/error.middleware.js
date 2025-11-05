"use strict";
/**
 * Error handling middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.validate = validate;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
function errorHandler(err, req, res, _next) {
    logger_1.default.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                statusCode: err.statusCode,
            },
        });
    }
    // Unknown error
    return res.status(500).json({
        error: {
            message: 'Internal server error',
            statusCode: 500,
        },
    });
}
function notFoundHandler(req, res) {
    return res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            statusCode: 404,
        },
    });
}
/**
 * Validation middleware wrapper for Joi schemas
 */
function validate(schema) {
    return (req, res, next) => {
        // Validate query params for GET requests, body for others
        const dataToValidate = req.method === 'GET' ? req.query : req.body;
        const { error } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const messages = error.details.map((detail) => detail.message).join('; ');
            res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: messages,
                details: error.details,
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=error.middleware.js.map