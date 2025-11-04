/**
 * Auth Service entry point
 */

import { createApp } from './app';
import { validateConfig } from './utils/config';
import { getPool, closePool } from './utils/database';
import { closeRedis } from './middleware/rate-limit.middleware';
import logger from './utils/logger';
import config from './utils/config';

// Validate configuration
try {
  validateConfig();
} catch (error: any) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Create Express app
const app = createApp();

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Auth service started`, {
    port: config.port,
    env: config.nodeEnv,
  });
});

// Test database connection
getPool().query('SELECT NOW()')
  .then(() => {
    logger.info('Database connection successful');
  })
  .catch((error: Error) => {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  });

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database pool
  await closePool();

  // Close Redis
  await closeRedis();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});
