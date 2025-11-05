"use strict";
/**
 * CRM Service Entry Point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./utils/database");
const config_1 = __importDefault(require("./utils/config"));
const logger_1 = __importDefault(require("./utils/logger"));
const event_publisher_1 = require("./utils/event-publisher");
const app = (0, app_1.createApp)();
// Test database connection
async function testDatabaseConnection() {
    try {
        const pool = (0, database_1.getPool)();
        const result = await pool.query('SELECT NOW()');
        logger_1.default.info('Database connection successful', {
            timestamp: result.rows[0].now,
        });
    }
    catch (error) {
        logger_1.default.error('Database connection failed', { error });
        throw error;
    }
}
// Start server
async function start() {
    try {
        // Test database connection
        await testDatabaseConnection();
        // Connect to RabbitMQ
        try {
            await event_publisher_1.eventPublisher.connect();
            logger_1.default.info('RabbitMQ connection established');
        }
        catch (error) {
            logger_1.default.warn('Failed to connect to RabbitMQ, events will not be published', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Don't fail startup if RabbitMQ is unavailable
        }
        // Start listening
        const server = app.listen(config_1.default.port, () => {
            logger_1.default.info('CRM service started', {
                port: config_1.default.port,
                env: config_1.default.env,
                nodeVersion: process.version,
            });
        });
        // Graceful shutdown
        const shutdown = async () => {
            logger_1.default.info('Shutdown signal received, closing server gracefully...');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                await (0, database_1.closePool)();
                await event_publisher_1.eventPublisher.close();
                logger_1.default.info('RabbitMQ connection closed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger_1.default.error('Failed to start CRM service', { error });
        process.exit(1);
    }
}
// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger_1.default.error('Unhandled rejection', { reason });
    process.exit(1);
});
start();
//# sourceMappingURL=index.js.map