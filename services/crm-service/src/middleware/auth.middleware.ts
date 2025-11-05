/**
 * Authentication middleware
 *
 * This middleware validates JWT tokens and extracts user context.
 * In production, the API Gateway will forward user context in headers.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types';
import { UnauthorizedError } from '../utils/errors';
import config from '../utils/config';
import logger from '../utils/logger';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Extract user context
    const user: AuthUser = {
      id: decoded.userId || decoded.sub,
      tenant_id: decoded.tenantId || decoded.tenant_id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    // Validate required fields
    if (!user.id || !user.tenant_id) {
      throw new UnauthorizedError('Invalid token payload');
    }

    // Attach user to request
    req.user = user;

    logger.debug('User authenticated', {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid authentication token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Authentication token expired'));
    }
    next(error);
  }
}

/**
 * Optional authentication - does not fail if no token
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    req.user = {
      id: decoded.userId || decoded.sub,
      tenant_id: decoded.tenantId || decoded.tenant_id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    // Silently continue without user context
    next();
  }
}
