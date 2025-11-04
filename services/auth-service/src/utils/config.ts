/**
 * Configuration management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Also try loading from platform root
dotenv.config({ path: '/opt/psa-platform/.env' });

export const config = {
  // Service
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3010', 10),
  serviceName: process.env.SERVICE_NAME || 'psa-auth-service',

  // Database
  database: {
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'psa_platform',
    user: process.env.POSTGRES_USER || 'psa_app',
    password: process.env.POSTGRES_PASSWORD || '',
    max: 20, // connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Password Policy
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12', 10),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
    historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT || '5', 10),
  },

  // Security
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),
    sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  // MFA
  mfa: {
    issuer: process.env.MFA_ISSUER || 'PSA-Platform',
    window: parseInt(process.env.MFA_WINDOW || '1', 10),
  },

  // Email (optional)
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@psa-platform.local',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required configuration
export function validateConfig() {
  const errors: string[] = [];

  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (!config.database.password) {
    errors.push('POSTGRES_PASSWORD is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export default config;
