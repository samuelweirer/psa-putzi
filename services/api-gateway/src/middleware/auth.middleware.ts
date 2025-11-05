/**
 * JWT Authentication middleware for API Gateway
 * Adapted from auth-service/src/middleware/auth.middleware.ts
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate JWT token
 * Validates JWT and attaches user payload to request
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
          status: 401,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Server configuration error',
          status: 500,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach user context to request
    authReq.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      permissions: payload.permissions,
    };

    logger.debug('User authenticated', {
      requestId: authReq.id,
      userId: authReq.user.id,
      role: authReq.user.role,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          status: 401,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          status: 401,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
      return;
    }

    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : String(error),
      requestId: authReq.id,
    });

    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        status: 401,
        timestamp: new Date().toISOString(),
        request_id: authReq.id,
      },
    });
  }
}

/**
 * Optional authentication - attach user if token is provided, but don't fail if not
 * Useful for endpoints that can work with or without authentication
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        const payload = jwt.verify(token, jwtSecret) as JWTPayload;
        authReq.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          tenantId: payload.tenantId,
          permissions: payload.permissions,
        };

        logger.debug('Optional auth: User authenticated', {
          requestId: authReq.id,
          userId: authReq.user.id,
        });
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth - continue without user
    logger.debug('Optional auth: No valid token, continuing without user', {
      requestId: authReq.id,
    });
    next();
  }
}
