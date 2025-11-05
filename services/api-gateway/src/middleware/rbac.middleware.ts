/**
 * Role-Based Access Control (RBAC) middleware for API Gateway
 * Adapted from auth-service/src/middleware/rbac.middleware.ts
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { logger } from '../utils/logger';

/**
 * Role hierarchy - each role inherits permissions from roles below it
 * Higher number = higher privilege level
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
 *
 * @example
 * router.get('/tickets', authenticateJWT, requireRole('technician', 'customer_admin'), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (!authReq.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
            status: 401,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
        return;
      }

      const userRole = authReq.user.role;
      const userPriority = roleHierarchy[userRole] || 0;

      // Check if user has one of the allowed roles or a higher priority role
      const isAllowed = allowedRoles.some(role => {
        const allowedPriority = roleHierarchy[role] || 0;
        return userPriority >= allowedPriority;
      });

      if (!isAllowed) {
        logger.warn('Access denied - insufficient permissions', {
          requestId: authReq.id,
          userId: authReq.user.id,
          userRole,
          requiredRoles: allowedRoles,
          path: authReq.path,
          method: authReq.method,
        });

        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource',
            status: 403,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
        return;
      }

      logger.debug('Access granted', {
        requestId: authReq.id,
        userId: authReq.user.id,
        userRole,
        path: authReq.path,
      });

      next();
    } catch (error) {
      logger.error('RBAC error', {
        error: error instanceof Error ? error.message : String(error),
        requestId: authReq.id,
      });

      res.status(403).json({
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Authorization failed',
          status: 403,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
    }
  };
}

/**
 * Middleware to require exact role match (no hierarchy)
 * Only users with exactly these roles can access
 *
 * @example
 * router.post('/admin', authenticateJWT, requireExactRole('system_admin'), handler)
 */
export function requireExactRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (!authReq.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
            status: 401,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
        return;
      }

      const userRole = authReq.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Access denied - exact role required', {
          requestId: authReq.id,
          userId: authReq.user.id,
          userRole,
          requiredRoles: allowedRoles,
          path: authReq.path,
        });

        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource',
            status: 403,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('RBAC error', {
        error: error instanceof Error ? error.message : String(error),
        requestId: authReq.id,
      });

      res.status(403).json({
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Authorization failed',
          status: 403,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
    }
  };
}

/**
 * Middleware to allow access only to own resources or admins
 *
 * @param userIdParam - Name of the route parameter containing the user ID
 * @example
 * router.get('/users/:id', authenticateJWT, requireSelfOrAdmin('id'), handler)
 */
export function requireSelfOrAdmin(userIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (!authReq.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
            status: 401,
            timestamp: new Date().toISOString(),
            request_id: authReq.id,
          },
        });
        return;
      }

      const userId = authReq.params[userIdParam];
      const currentUserId = authReq.user.id;
      const userRole = authReq.user.role;

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
        requestId: authReq.id,
        userId: currentUserId,
        requestedUserId: userId,
        path: authReq.path,
      });

      res.status(403).json({
        error: {
          code: 'FORBIDDEN_RESOURCE_ACCESS',
          message: 'You can only access your own resources',
          status: 403,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
      });
    } catch (error) {
      logger.error('RBAC error', {
        error: error instanceof Error ? error.message : String(error),
        requestId: authReq.id,
      });

      res.status(403).json({
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Authorization failed',
          status: 403,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
        },
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

/**
 * Get role priority level
 */
export function getRolePriority(role: UserRole): number {
  return roleHierarchy[role] || 0;
}
