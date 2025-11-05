/**
 * Express application configuration
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import customerRoutes from './routes/customer.routes';
import contactRoutes from './routes/contact.routes';
import locationRoutes from './routes/location.routes';
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
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
      service: 'psa-crm-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/contacts', contactRoutes);
  app.use('/api/v1/locations', locationRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

// Default export for tests
export default createApp();
