"use strict";
/**
 * Logger utility using Winston
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = winston_1.default.createLogger({
    level: logLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    defaultMeta: { service: 'psa-crm-service' },
    transports: [
        // Write all logs to console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, timestamp, service, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
            }))
        }),
        // Write all logs to file
        new winston_1.default.transports.File({
            filename: '/opt/psa-platform/logs/crm/error.log',
            level: 'error',
            format: winston_1.default.format.json()
        }),
        new winston_1.default.transports.File({
            filename: '/opt/psa-platform/logs/crm/combined.log',
            format: winston_1.default.format.json()
        })
    ]
});
// If we're not in production, log to the console with more detail
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map