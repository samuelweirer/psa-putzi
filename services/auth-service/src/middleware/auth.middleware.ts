/**
 * JWT Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware to authenticate JWT token
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JWTService.verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }

    logger.error('Authentication error', { error });
    res.status(401).json({
      error: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication - attach user if token is provided, but don't fail if not
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JWTService.verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}
