/**
 * Role-Based Access Control (RBAC) middleware
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Role hierarchy - each role inherits permissions from roles below it
 */
const roleHierarchy: Record<UserRole, number> = {
  // System roles (highest priority)
  'system_admin': 100,
  'tenant_admin': 90,
  'security_admin': 85,
  'service_manager': 80,

  // Technical leads
  'software_developer_lead': 70,
  'technician_lead': 70,

  // Senior roles
  'software_developer_senior': 60,
  'technician_senior': 60,

  // Mid-level roles
  'software_developer': 50,
  'technician': 50,

  // Junior roles
  'software_developer_junior': 40,
  'technician_junior': 40,

  // Legacy support tiers (deprecated but supported)
  'technician_l3': 55,
  'technician_l2': 45,
  'technician_l1': 35,

  // Management roles
  'account_manager': 65,
  'project_manager': 65,
  'billing_manager': 65,

  // Customer roles (lowest priority)
  'customer_admin': 30,
  'customer_technician': 20,
  'customer_user': 10,
};

/**
 * Middleware to require specific roles
 * Users with higher priority roles can also access
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      const userRole = req.user.role;
      const userPriority = roleHierarchy[userRole] || 0;

      // Check if user has one of the allowed roles or a higher priority role
      const isAllowed = allowedRoles.some(role => {
        const allowedPriority = roleHierarchy[role] || 0;
        return userPriority >= allowedPriority;
      });

      if (!isAllowed) {
        logger.warn('Access denied', {
          userId: req.user.sub,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        throw new ForbiddenError(
          'Insufficient permissions',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      logger.error('RBAC error', { error });
      res.status(403).json({
        error: 'AUTHORIZATION_FAILED',
        message: 'Authorization failed',
      });
    }
  };
}

/**
 * Middleware to require exact role match (no hierarchy)
 */
export function requireExactRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Access denied - exact role required', {
          userId: req.user.sub,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        throw new ForbiddenError(
          'Insufficient permissions',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      logger.error('RBAC error', { error });
      res.status(403).json({
        error: 'AUTHORIZATION_FAILED',
        message: 'Authorization failed',
      });
    }
  };
}

/**
 * Middleware to allow access only to own resources or admins
 */
export function requireSelfOrAdmin(userIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      const userId = req.params[userIdParam];
      const currentUserId = req.user.sub;
      const userRole = req.user.role;

      // Allow if accessing own resource
      if (userId === currentUserId) {
        next();
        return;
      }

      // Allow if admin
      const userPriority = roleHierarchy[userRole] || 0;
      if (userPriority >= roleHierarchy['tenant_admin']) {
        next();
        return;
      }

      logger.warn('Access denied - not own resource', {
        userId: currentUserId,
        requestedUserId: userId,
        path: req.path,
      });

      throw new ForbiddenError(
        'You can only access your own resources',
        'FORBIDDEN_RESOURCE_ACCESS'
      );
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      logger.error('RBAC error', { error });
      res.status(403).json({
        error: 'AUTHORIZATION_FAILED',
        message: 'Authorization failed',
      });
    }
  };
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  const priority = roleHierarchy[role] || 0;
  return priority >= roleHierarchy['tenant_admin'];
}

/**
 * Check if user has system admin privileges
 */
export function isSystemAdmin(role: UserRole): boolean {
  return role === 'system_admin';
}
