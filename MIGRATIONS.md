# Database Migrations Log

This file tracks manual database migrations that have been applied to the production database.

## 2025-11-10: Add tenant_id to users table

**Migration File:** `services/auth-service/migrations/003_add_tenant_id_to_users.sql`

**Applied By:** Claude Code (Session 011CUa86VGPkHjf5rHUmwfvG)

**Changes:**
- Added `tenant_id UUID` column to `users` table (nullable)
- Created index `idx_users_tenant_id` on `users(tenant_id)`
- Updated test user (testuser06112025@example.com):
  - Role: `customer_user` → `tenant_admin`
  - Added `tenant_id`: `550e8400-e29b-41d4-a716-446655440001`

**Related Code Changes:**
- Auth service: Added `tenant_id` to User interface
- Auth service: Added `tenantId` to JWTPayload interface
- Auth service: Modified login/refresh to include tenantId in JWT tokens
- Frontend: Fixed contact creation field name transformation

**Commit:** 9f04f00 - feat(auth,crm,frontend): Add tenant_id support and fix contact creation

**Impact:**
- JWT tokens now include `tenantId` field
- CRM operations now work with tenant isolation
- Users can be associated with specific MSP tenants

**Rollback (if needed):**
```sql
DROP INDEX IF EXISTS idx_users_tenant_id;
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
```
