/**
 * Proxy routes for all microservices
 */

import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { serviceRegistry } from '../config/services';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { authRateLimiter, userRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

/**
 * Create proxy middleware with common configuration
 */
function createServiceProxy(serviceName: string): any {
  const service = serviceRegistry[serviceName];

  if (!service) {
    throw new Error(`Service ${serviceName} not found in registry`);
  }

  const proxyOptions: Options = {
    target: service.url,
    changeOrigin: true,
    timeout: service.timeout,
    proxyTimeout: service.timeout,

    // Add custom headers to forwarded requests
    onProxyReq: (proxyReq, req: any) => {
      const authReq = req as AuthenticatedRequest;

      // Add gateway identification
      proxyReq.setHeader('X-Gateway', 'psa-api-gateway');
      proxyReq.setHeader('X-Request-ID', authReq.id);

      // Forward user context if authenticated
      if (authReq.user) {
        proxyReq.setHeader('X-User-ID', authReq.user.id);
        proxyReq.setHeader('X-User-Email', authReq.user.email);
        proxyReq.setHeader('X-User-Role', authReq.user.role);

        if (authReq.user.tenantId) {
          proxyReq.setHeader('X-Tenant-ID', authReq.user.tenantId);
        }
      }

      // Rewrite request body for POST/PUT/PATCH requests
      // This is needed because express.json() consumes the body
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }

      logger.debug(`Proxying ${req.method} ${req.url} to ${service.name}`, {
        requestId: authReq.id,
        service: service.name,
        target: service.url,
      });
    },

    // Handle proxy responses
    onProxyRes: (proxyRes, req: any, _res) => {
      const authReq = req as AuthenticatedRequest;

      logger.debug(`Received response from ${service.name}`, {
        requestId: authReq.id,
        service: service.name,
        statusCode: proxyRes.statusCode,
      });
    },

    // Handle proxy errors
    onError: (err, req: any, res: any) => {
      const authReq = req as AuthenticatedRequest;

      logger.error(`Proxy error for ${service.name}`, {
        error: err.message,
        requestId: authReq.id,
        service: service.name,
        url: req.url,
      });

      if (!res.headersSent) {
        res.status(502).json({
          error: {
            code: 'BAD_GATEWAY',
            message: `Service ${service.name} is unavailable`,
            status: 502,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
      }
    },
  };

  return createProxyMiddleware(proxyOptions);
}

/**
 * Route: Auth Service
 * All /api/v1/auth/* requests go to auth service
 * Strict rate limiting to prevent brute force attacks
 */
router.use('/api/v1/auth', authRateLimiter, createServiceProxy('auth'));

/**
 * Route: Users (Auth Service)
 * All /api/v1/users/* requests go to auth service
 * User-specific rate limiting for authenticated requests
 */
router.use('/api/v1/users', userRateLimiter, createServiceProxy('auth'));

/**
 * Future routes - commented out until services are ready
 */

// router.use('/api/v1/customers', createServiceProxy('crm'));
// router.use('/api/v1/contacts', createServiceProxy('crm'));
// router.use('/api/v1/tickets', createServiceProxy('tickets'));
// router.use('/api/v1/billing', createServiceProxy('billing'));
// router.use('/api/v1/projects', createServiceProxy('projects'));
// router.use('/api/v1/assets', createServiceProxy('assets'));
// router.use('/api/v1/reports', createServiceProxy('reports'));

export default router;
