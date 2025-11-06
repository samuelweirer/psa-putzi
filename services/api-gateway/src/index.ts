/**
 * Entry point for API Gateway
 */

import http from 'http';
import app from './app';
import { logger } from './utils/logger';
import { redisClient } from './middleware/rate-limit.middleware';

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'psa-api-gateway';
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

let server: http.Server;
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 * Closes connections in the following order:
 * 1. Stop accepting new connections
 * 2. Close existing connections gracefully
 * 3. Disconnect from Redis
 * 4. Exit process
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info('Shutdown signal received, starting graceful shutdown', { signal, pid: process.pid });

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit', {
      timeout: SHUTDOWN_TIMEOUT,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // 1. Stop accepting new connections
    logger.info('Closing HTTP server');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server', { error: err.message });
          reject(err);
        } else {
          logger.info('HTTP server closed successfully');
          resolve();
        }
      });
    });

    // 2. Close Redis connection
    logger.info('Closing Redis connection');
    await redisClient.quit();
    logger.info('Redis connection closed successfully');

    // 3. Additional cleanup (RabbitMQ, database pools, etc.) would go here
    // For now, we only have Redis

    clearTimeout(forceShutdownTimer);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimer);
    logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function startServer() {
  try {
    // Verify Redis connection before starting
    try {
      await redisClient.ping();
      logger.info('Redis connection verified');
    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} started successfully`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid,
        timestamp: new Date().toISOString(),
      });

      // Send ready signal to PM2 (if running under PM2)
      if (process.send) {
        process.send('ready');
        logger.info('Sent ready signal to PM2');
      }
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error('Port is already in use', { port: PORT });
      } else {
        logger.error('Server error', {
          error: error.message,
          code: error.code,
        });
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // PM2 graceful reload
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        gracefulShutdown('PM2 shutdown');
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled promise rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start the server
startServer();
