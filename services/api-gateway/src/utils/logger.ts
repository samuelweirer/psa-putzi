/**
 * Winston logger configuration for API Gateway
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || '/tmp/api-gateway.log';

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'psa-api-gateway' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
              msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
          }
        )
      ),
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: logFile,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Write errors to separate file
    new winston.transports.File({
      filename: logFile.replace('.log', '-error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

/**
 * Log request details
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  logger.info('API Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId: userId || 'anonymous',
  });
}

/**
 * Log error details
 */
export function logError(
  error: Error,
  requestId?: string,
  context?: Record<string, unknown>
): void {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    requestId,
    ...context,
  });
}

export default logger;
