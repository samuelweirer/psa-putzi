/**
 * Express application configuration
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiRateLimit } from './middleware/rate-limit.middleware';
import logger from './utils/logger';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request logging
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next();
  });

  // Global rate limiting
  app.use(apiRateLimit);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'psa-auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use('/api/v1/auth', authRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
