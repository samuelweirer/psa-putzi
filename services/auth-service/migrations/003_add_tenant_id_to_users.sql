/**
 * Migration: Add tenant_id to users table
 * Date: 2025-11-10
 * Purpose: Add multi-tenancy support to users table
 *
 * This migration adds tenant_id column to track which MSP tenant each user belongs to.
 * Note: tenant_id is optional (nullable) because not all users belong to a tenant:
 * - system_admin: No tenant (manages the entire platform)
 * - customer_user: No tenant (belongs to a customer, not an MSP)
 * - MSP staff (tenant_admin, technicians, etc.): Have tenant_id
 */

-- Add tenant_id column to users table (nullable for compatibility)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_users_tenant_id
ON users(tenant_id)
WHERE deleted_at IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN users.tenant_id IS 'MSP tenant that this user belongs to (NULL for system admins and customer users)';
