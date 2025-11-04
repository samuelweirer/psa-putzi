/**
 * Type definitions for PSA Auth Service
 */

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  permissions?: Record<string, any>;
  internal_cost_rate?: number;
  default_billing_rate?: number;
  language: string;
  timezone: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  mfa_secret?: string;
  mfa_recovery_codes?: string[];
  sso_provider?: string;
  sso_identifier?: string;
  last_login_at?: Date;
  last_login_ip?: string;
  password_changed_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export type UserRole =
  // System Admins
  | 'system_admin'
  | 'tenant_admin'
  | 'security_admin'
  | 'service_manager'
  // Software Developers
  | 'software_developer_lead'
  | 'software_developer_senior'
  | 'software_developer'
  | 'software_developer_junior'
  // Support Technicians
  | 'technician_lead'
  | 'technician_senior'
  | 'technician'
  | 'technician_junior'
  // Legacy Support Tier (Deprecated)
  | 'technician_l3'
  | 'technician_l2'
  | 'technician_l1'
  // Other Internal Roles
  | 'account_manager'
  | 'project_manager'
  | 'billing_manager'
  // Customer Roles
  | 'customer_admin'
  | 'customer_technician'
  | 'customer_user';

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
  user_agent?: string;
  ip_address?: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date;
}

export interface MfaSetupToken {
  id: string;
  user_id: string;
  token_hash: string;
  secret: string;
  expires_at: Date;
  created_at: Date;
  verified_at?: Date;
}

export interface JWTPayload {
  sub: string;  // user_id
  email: string;
  role: UserRole;
  permissions: Record<string, any>;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  permissions: Record<string, any>;
  mfa_enabled: boolean;
  last_login_at?: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  token: string;
  new_password: string;
}

export interface MfaSetupResponse {
  secret: string;
  qr_code: string;
  setup_token: string;
}

export interface MfaVerifyRequest {
  setup_token: string;
  code: string;
}

export interface MfaDisableRequest {
  password: string;
  code: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}
