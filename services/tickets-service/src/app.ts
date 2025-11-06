/**
 * Express application configuration
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger';
import ticketRoutes from './routes/ticket.routes';
import timeEntryRoutes from './routes/time-entry.routes';
import ticketTimeEntryRoutes from './routes/ticket-time-entry.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import config from './utils/config';
import logger from './utils/logger';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' })); // Larger limit for attachments
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req, _res, next) => {
    logger.info('Incoming request', {
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
      service: 'psa-tickets-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'PSA Tickets API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Routes
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/time-entries', timeEntryRoutes);

  // Nested routes (tickets/:ticketId/time-entries)
  app.use('/api/v1/tickets/:ticketId/time-entries', ticketTimeEntryRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

// Default export for tests
export default createApp();
