"use strict";
/**
 * Express application configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const config_1 = __importDefault(require("./utils/config"));
const logger_1 = __importDefault(require("./utils/logger"));
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: config_1.default.cors.origin,
        credentials: true,
    }));
    // Body parsing
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    // Request logging
    app.use((req, _res, next) => {
        logger_1.default.info('Incoming request', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        next();
    });
    // Health check
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            service: 'psa-crm-service',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    });
    // Routes
    app.use('/api/v1/customers', customer_routes_1.default);
    app.use('/api/v1/contacts', contact_routes_1.default);
    app.use('/api/v1/locations', location_routes_1.default);
    // 404 handler
    app.use(error_middleware_1.notFoundHandler);
    // Error handler (must be last)
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map