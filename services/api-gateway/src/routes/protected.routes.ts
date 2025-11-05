/**
 * Example protected routes demonstrating authentication and RBAC
 * These routes show how to protect endpoints with JWT and role-based access
 */

import { Router, Response } from 'express';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';
import { requireRole, requireExactRole, requireSelfOrAdmin } from '../middleware/rbac.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * Public route - no authentication required
 */
router.get('/public/status', (_req, res: Response) => {
  res.json({
    status: 'public',
    message: 'This endpoint is publicly accessible',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Optional auth route - works with or without token
 */
router.get('/public/info', optionalAuth, (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user) {
    res.json({
      status: 'authenticated',
      message: 'Welcome back!',
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        role: authReq.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      status: 'anonymous',
      message: 'Hello, guest!',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Protected route - requires authentication (any role)
 */
router.get('/protected/profile', authenticateJWT, (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    status: 'authenticated',
    message: 'You are authenticated',
    user: {
      id: authReq.user!.id,
      email: authReq.user!.email,
      role: authReq.user!.role,
      tenantId: authReq.user!.tenantId,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Admin-only route - requires admin privileges
 */
router.get(
  '/protected/admin',
  authenticateJWT,
  requireRole('tenant_admin', 'system_admin'),
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      status: 'admin_access',
      message: 'Welcome, admin!',
      user: {
        id: authReq.user!.id,
        email: authReq.user!.email,
        role: authReq.user!.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * System admin only - requires exact role match
 */
router.get(
  '/protected/system',
  authenticateJWT,
  requireExactRole('system_admin'),
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      status: 'system_admin_access',
      message: 'Welcome, system administrator!',
      user: {
        id: authReq.user!.id,
        email: authReq.user!.email,
        role: authReq.user!.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Technician-only route
 */
router.get(
  '/protected/technician',
  authenticateJWT,
  requireRole('technician'),
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      status: 'technician_access',
      message: 'Welcome, technician!',
      user: {
        id: authReq.user!.id,
        email: authReq.user!.email,
        role: authReq.user!.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * User resource - can access own or admin can access any
 */
router.get(
  '/protected/users/:id',
  authenticateJWT,
  requireSelfOrAdmin('id'),
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      status: 'authorized',
      message: 'Access to user resource granted',
      requestedUserId: req.params.id,
      currentUser: {
        id: authReq.user!.id,
        email: authReq.user!.email,
        role: authReq.user!.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Multi-role route - technicians, developers, or admins
 */
router.get(
  '/protected/internal',
  authenticateJWT,
  requireRole('technician', 'software_developer', 'account_manager'),
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      status: 'internal_access',
      message: 'Welcome, team member!',
      user: {
        id: authReq.user!.id,
        email: authReq.user!.email,
        role: authReq.user!.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
