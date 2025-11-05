"use strict";
/**
 * Configuration management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3020', 10),
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        database: process.env.DATABASE_NAME || 'psa_platform',
        user: process.env.DATABASE_USER || 'psa_app',
        password: process.env.DATABASE_PASSWORD || '',
        max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};
exports.default = config;
//# sourceMappingURL=config.js.map