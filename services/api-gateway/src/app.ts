/**
 * Main Express application for API Gateway
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { HealthResponse } from './types';
import proxyRoutes from './routes/proxy.routes';
import protectedRoutes from './routes/protected.routes';

// Load environment variables
dotenv.config();

const app = express();

/**
 * Trust proxy - we're behind a reverse proxy
 */
app.set('trust proxy', true);

/**
 * Middleware: Add request ID to all requests
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).id = uuidv4();
  res.setHeader('X-Request-ID', (req as any).id);
  next();
});

/**
 * Middleware: Security headers (helmet)
 */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API gateway
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

/**
 * Middleware: CORS configuration
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  })
);

/**
 * Middleware: Parse JSON bodies
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware: Request logging
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = (req as any).user;

    logger.info('Request processed', {
      requestId: (req as any).id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
});

/**
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  const uptime = process.uptime();

  const health: HealthResponse = {
    status: 'healthy',
    service: 'psa-api-gateway',
    version: '1.0.0',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    dependencies: {
      // Will be populated by checking downstream services
    },
  };

  res.status(200).json(health);
});

/**
 * Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'PSA Platform API Gateway',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api-docs',
  });
});

/**
 * Example protected routes (for testing authentication)
 */
app.use('/api/v1', protectedRoutes);

/**
 * Proxy routes to microservices
 */
app.use(proxyRoutes);

/**
 * 404 handler for undefined routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
      status: 404,
      timestamp: new Date().toISOString(),
      request_id: (req as any).id,
    },
  });
});

/**
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
      timestamp: new Date().toISOString(),
      request_id: (req as any).id,
    },
  });
});

export default app;
