-- Migration: Add OAuth provider columns to users table
-- Created: 2025-11-04
-- Purpose: Support Google and Microsoft OAuth2 SSO

-- Add OAuth provider columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);

-- Create unique index to prevent duplicate OAuth accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_provider
ON users(oauth_provider, oauth_provider_id)
WHERE oauth_provider IS NOT NULL AND oauth_provider_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name (google, microsoft, etc.)';
COMMENT ON COLUMN users.oauth_provider_id IS 'Unique user ID from OAuth provider';

-- Note: Password is now optional for OAuth users
-- Existing password validation will check if oauth_provider is set
