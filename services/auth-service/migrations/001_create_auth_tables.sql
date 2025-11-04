-- Auth Service Database Migration
-- Creates tables for refresh tokens, password reset tokens, and MFA setup tokens
-- Run this migration after the core database schema (PSA-Platform main schema)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Refresh Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for user sessions';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of the refresh token';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'When the token was revoked (null = still valid)';

-- =====================================================
-- Password Reset Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token_hash)
    WHERE used_at IS NULL AND expires_at > NOW();

COMMENT ON TABLE password_reset_tokens IS 'One-time tokens for password reset flow';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA256 hash of the reset token';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When the token was used (null = not yet used)';

-- =====================================================
-- MFA Setup Tokens Table (Temporary tokens during MFA enrollment)
-- =====================================================
CREATE TABLE IF NOT EXISTS mfa_setup_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    secret VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mfa_setup_user ON mfa_setup_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_setup_token ON mfa_setup_tokens(token_hash)
    WHERE verified_at IS NULL AND expires_at > NOW();

COMMENT ON TABLE mfa_setup_tokens IS 'Temporary tokens during MFA enrollment process';
COMMENT ON COLUMN mfa_setup_tokens.secret IS 'TOTP secret (base32 encoded) for verification';
COMMENT ON COLUMN mfa_setup_tokens.verified_at IS 'When MFA was successfully enabled (null = pending)';

GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO psa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO psa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_setup_tokens TO psa_app;
