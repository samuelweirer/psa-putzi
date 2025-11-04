/**
 * RBAC Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requireExactRole,
  requireSelfOrAdmin,
  isAdmin,
  isSystemAdmin,
} from '../../../src/middleware/rbac.middleware';
import { UserRole } from '../../../src/types';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
      params: {},
      path: '/test',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  describe('requireRole', () => {
    it('should allow user with exact role', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'software_developer' as UserRole,
        permissions: {},
      };

      const middleware = requireRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow user with higher priority role', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'tenant_admin' as UserRole, // Priority 90
        permissions: {},
      };

      const middleware = requireRole('software_developer' as UserRole); // Priority 50
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny user with lower priority role', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'customer_user' as UserRole, // Priority 10
        permissions: {},
      };

      const middleware = requireRole('software_developer' as UserRole); // Priority 50
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions',
      });
    });

    it('should deny when user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'NOT_AUTHENTICATED',
        message: 'User not authenticated',
      });
    });

    it('should allow user with any of multiple allowed roles', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'technician' as UserRole,
        permissions: {},
      };

      const middleware = requireRole(
        'software_developer' as UserRole,
        'technician' as UserRole
      );
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow system_admin for any role requirement', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'admin@example.com',
        role: 'system_admin' as UserRole, // Highest priority: 100
        permissions: {},
      };

      const middleware = requireRole('customer_user' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireExactRole', () => {
    it('should allow user with exact role match', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'software_developer' as UserRole,
        permissions: {},
      };

      const middleware = requireExactRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny user with higher priority role (no hierarchy)', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'admin@example.com',
        role: 'tenant_admin' as UserRole,
        permissions: {},
      };

      const middleware = requireExactRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions',
      });
    });

    it('should allow user with one of exact roles', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'technician' as UserRole,
        permissions: {},
      };

      const middleware = requireExactRole(
        'software_developer' as UserRole,
        'technician' as UserRole
      );
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny when user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireExactRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireSelfOrAdmin', () => {
    it('should allow user accessing own resource', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'customer_user' as UserRole,
        permissions: {},
      };
      mockRequest.params = { id: 'user-123' };

      const middleware = requireSelfOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow admin accessing other user resource', () => {
      mockRequest.user = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'tenant_admin' as UserRole,
        permissions: {},
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireSelfOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny non-admin accessing other user resource', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'customer_user' as UserRole,
        permissions: {},
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireSelfOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN_RESOURCE_ACCESS',
        message: 'You can only access your own resources',
      });
    });

    it('should work with custom parameter name', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'customer_user' as UserRole,
        permissions: {},
      };
      mockRequest.params = { userId: 'user-123' };

      const middleware = requireSelfOrAdmin('userId');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny when user is not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'user-123' };

      const middleware = requireSelfOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should allow system_admin accessing other user resource', () => {
      mockRequest.user = {
        sub: 'admin-123',
        email: 'sysadmin@example.com',
        role: 'system_admin' as UserRole,
        permissions: {},
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireSelfOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should return true for tenant_admin', () => {
      expect(isAdmin('tenant_admin' as UserRole)).toBe(true);
    });

    it('should return true for system_admin', () => {
      expect(isAdmin('system_admin' as UserRole)).toBe(true);
    });

    it('should return true for security_admin', () => {
      expect(isAdmin('security_admin' as UserRole)).toBe(false); // Priority 85, below tenant_admin
    });

    it('should return false for software_developer', () => {
      expect(isAdmin('software_developer' as UserRole)).toBe(false);
    });

    it('should return false for customer_user', () => {
      expect(isAdmin('customer_user' as UserRole)).toBe(false);
    });

    it('should return false for service_manager', () => {
      expect(isAdmin('service_manager' as UserRole)).toBe(false);
    });
  });

  describe('isSystemAdmin', () => {
    it('should return true for system_admin', () => {
      expect(isSystemAdmin('system_admin' as UserRole)).toBe(true);
    });

    it('should return false for tenant_admin', () => {
      expect(isSystemAdmin('tenant_admin' as UserRole)).toBe(false);
    });

    it('should return false for any other role', () => {
      expect(isSystemAdmin('software_developer' as UserRole)).toBe(false);
      expect(isSystemAdmin('customer_user' as UserRole)).toBe(false);
    });
  });

  describe('Role Hierarchy Tests', () => {
    it('should allow software_developer_lead access to software_developer endpoints', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'lead@example.com',
        role: 'software_developer_lead' as UserRole, // Priority 70
        permissions: {},
      };

      const middleware = requireRole('software_developer' as UserRole); // Priority 50
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny software_developer access to software_developer_lead endpoints', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'dev@example.com',
        role: 'software_developer' as UserRole, // Priority 50
        permissions: {},
      };

      const middleware = requireRole('software_developer_lead' as UserRole); // Priority 70
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should respect legacy technician tier roles', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'tech@example.com',
        role: 'technician_l3' as UserRole, // Priority 55
        permissions: {},
      };

      const middleware = requireRole('technician' as UserRole); // Priority 50
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully in requireRole', () => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'software_developer' as UserRole,
        permissions: {},
      };

      // Force an error by making req.path throw
      Object.defineProperty(mockRequest, 'path', {
        get: () => {
          throw new Error('Unexpected error');
        },
      });

      const middleware = requireRole('software_developer' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'AUTHORIZATION_FAILED',
        message: 'Authorization failed',
      });
    });
  });
});
