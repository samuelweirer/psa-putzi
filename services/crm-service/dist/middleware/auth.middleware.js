"use strict";
/**
 * Authentication middleware
 *
 * This middleware validates JWT tokens and extracts user context.
 * In production, the API Gateway will forward user context in headers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../utils/config"));
const logger_1 = __importDefault(require("../utils/logger"));
function authenticate(req, _res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No authentication token provided');
        }
        const token = authHeader.substring(7);
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        // Extract user context
        const user = {
            id: decoded.userId || decoded.sub,
            tenant_id: decoded.tenantId || decoded.tenant_id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
        };
        // Validate required fields
        if (!user.id || !user.tenant_id) {
            throw new errors_1.UnauthorizedError('Invalid token payload');
        }
        // Attach user to request
        req.user = user;
        logger_1.default.debug('User authenticated', {
            userId: user.id,
            tenantId: user.tenant_id,
            role: user.role,
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new errors_1.UnauthorizedError('Invalid authentication token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new errors_1.UnauthorizedError('Authentication token expired'));
        }
        next(error);
    }
}
/**
 * Optional authentication - does not fail if no token
 */
function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        req.user = {
            id: decoded.userId || decoded.sub,
            tenant_id: decoded.tenantId || decoded.tenant_id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
        };
        next();
    }
    catch (error) {
        // Silently continue without user context
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map