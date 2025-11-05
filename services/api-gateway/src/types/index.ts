/**
 * Type definitions for API Gateway
 */

import { Request } from 'express';

/**
 * User roles supported by the platform
 */
export type UserRole =
  | 'system_admin'
  | 'tenant_admin'
  | 'security_admin'
  | 'service_manager'
  | 'software_developer_lead'
  | 'software_developer_senior'
  | 'software_developer'
  | 'software_developer_junior'
  | 'technician_lead'
  | 'technician_senior'
  | 'technician'
  | 'technician_junior'
  | 'technician_l3'
  | 'technician_l2'
  | 'technician_l1'
  | 'account_manager'
  | 'project_manager'
  | 'billing_manager'
  | 'customer_admin'
  | 'customer_technician'
  | 'customer_user';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string;            // User ID (UUID)
  email: string;          // User email
  role: UserRole;         // User role
  tenantId?: string;      // Tenant ID (UUID)
  permissions?: Record<string, boolean>;  // Optional permissions map
  iat: number;            // Issued at timestamp
  exp: number;            // Expiration timestamp
  jti: string;            // JWT ID for tracking/revocation
}

/**
 * User context attached to request
 */
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions?: Record<string, boolean>;
}

/**
 * Extended Express Request with user context
 */
export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  id: string;  // Request ID
}

/**
 * Service configuration for routing
 */
export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
  retries?: number;
}

/**
 * Service registry type
 */
export interface ServiceRegistry {
  [key: string]: ServiceConfig;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  dependencies?: {
    [key: string]: 'healthy' | 'unhealthy';
  };
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    timestamp: string;
    request_id?: string;
    details?: unknown;
  };
}
