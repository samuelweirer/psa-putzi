/**
 * Tickets Service Entry Point
 */

import { createApp } from './app';
import { getPool, closePool } from './utils/database';
import config from './utils/config';
import logger from './utils/logger';
import { eventPublisher } from './utils/event-publisher';
import { ensureUploadDir } from './controllers/attachment.controller';
import { emailIngestionService } from './services/email-ingestion.service';

const app = createApp();

// Test database connection
async function testDatabaseConnection() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', {
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
}

// Start server
async function start() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Ensure upload directory exists
    await ensureUploadDir();

    // Connect to RabbitMQ
    try {
      await eventPublisher.connect();
      logger.info('RabbitMQ connection established');
    } catch (error) {
      logger.warn('Failed to connect to RabbitMQ, events will not be published', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail startup if RabbitMQ is unavailable
    }

    // Start email ingestion service (if enabled)
    // Note: Service constructor already starts polling if IMAP_ENABLED=true
    logger.info('Email ingestion service initialized', {
      enabled: process.env.IMAP_ENABLED === 'true',
    });

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info('Tickets service started', {
        port: config.port,
        env: config.env,
        nodeVersion: process.version,
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutdown signal received, closing server gracefully...');

      server.close(async () => {
        logger.info('HTTP server closed');

        // Stop email ingestion
        emailIngestionService.stop();

        await closePool();
        await eventPublisher.close();
        logger.info('RabbitMQ connection closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start Tickets service', { error });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

start();
