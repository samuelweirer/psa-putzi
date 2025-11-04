# PSA Auth Service

Authentication & Authorization service for the PSA-Platform.

## Status

**Status:** ✅ Fully Implemented & Operational
**Version:** 1.0.0
**Sprint:** Sprint 2 (AUTH-001)
**Completion Date:** 2025-11-04

## Overview

The Auth Service provides centralized authentication and authorization for the entire PSA-Platform. It supports:

- ✅ Local authentication (email/password with bcrypt)
- ✅ JWT token management (access + refresh tokens)
- ✅ Multi-Factor Authentication (TOTP with QR codes)
- ✅ Role-Based Access Control (23 roles with hierarchical permissions)
- ✅ Password policies and security features
- ✅ Rate limiting (Redis-based)
- ✅ Account lockout after failed login attempts
- ✅ Password reset flow
- 🟡 OAuth2/SSO (Google, Microsoft) - planned for Phase 2

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.3+
- **Framework:** Express.js 4.18+
- **Database:** PostgreSQL 15+ (via pg driver)
- **Cache/Rate Limiting:** Redis 7+ (via ioredis)
- **Authentication:** jsonwebtoken 9+ (JWT)
- **Password Hashing:** bcrypt (12 rounds)
- **MFA:** speakeasy (TOTP), qrcode
- **Validation:** Joi 17+
- **Testing:** Vitest 1.6+
- **Linting:** ESLint 9+ (flat config)

## Project Structure

```
auth-service/
├── src/
│   ├── index.ts              # Application entry point
│   ├── app.ts                # Express app configuration
│   ├── routes/
│   │   └── auth.routes.ts    # Authentication routes
│   ├── controllers/
│   │   └── auth.controller.ts  # Authentication controllers
│   ├── services/
│   │   ├── auth.service.ts     # Core authentication logic
│   │   ├── jwt.service.ts      # JWT token management
│   │   ├── password.service.ts # Password hashing & validation
│   │   └── mfa.service.ts      # Multi-factor authentication
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── rbac.middleware.ts      # Role-based access control
│   │   ├── rate-limit.middleware.ts # Rate limiting
│   │   └── error.middleware.ts     # Error handling
│   ├── models/
│   │   ├── user.model.ts                # User database operations
│   │   ├── refresh-token.model.ts       # Refresh token operations
│   │   └── password-reset-token.model.ts # Password reset operations
│   ├── validators/
│   │   └── auth.validator.ts    # Joi validation schemas
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── utils/
│       ├── config.ts            # Configuration management
│       ├── database.ts          # PostgreSQL connection pool
│       ├── logger.ts            # Winston logger
│       └── errors.ts            # Custom error classes
├── migrations/
│   └── 001_create_auth_tables.sql  # Database migrations
├── tests/
│   ├── unit/                   # Unit tests (to be implemented)
│   └── integration/            # Integration tests (to be implemented)
├── package.json
├── tsconfig.json
├── .env                        # Environment variables
└── README.md                   # This file
```

## API Endpoints

### Public Endpoints

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "technician_junior"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "technician_junior",
  "is_verified": false
}
```

#### POST /api/v1/auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "mfa_code": "123456"  // Optional, required if MFA enabled
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "technician_senior",
    "permissions": {},
    "mfa_enabled": true
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account locked
- `428 Precondition Required`: MFA code required

#### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "expires_in": 900
}
```

#### POST /api/v1/auth/logout
Revoke refresh token and logout.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response (204 No Content)**

#### POST /api/v1/auth/password-reset/request
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

#### POST /api/v1/auth/password-reset/confirm
Confirm password reset with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password has been reset successfully."
}
```

### Protected Endpoints (Require Authentication)

All protected endpoints require the `Authorization: Bearer <access_token>` header.

#### GET /api/v1/auth/me
Get current authenticated user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "technician_senior",
  "permissions": {},
  "mfa_enabled": true,
  "last_login_at": "2025-11-04T10:30:00Z",
  "language": "de",
  "timezone": "Europe/Vienna"
}
```

#### PUT /api/v1/auth/me
Update own profile.

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+43 1 234 5678",
  "language": "de",
  "timezone": "Europe/Vienna"
}
```

#### PUT /api/v1/auth/change-password
Change own password.

**Request:**
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### POST /api/v1/auth/mfa/setup
Begin MFA setup (generates QR code).

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KG...",
  "setup_token": "temp-setup-token"
}
```

#### POST /api/v1/auth/mfa/verify
Verify and enable MFA.

**Request:**
```json
{
  "setup_token": "temp-setup-token",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "MFA enabled successfully",
  "recovery_codes": ["ABC123", "DEF456", "GHI789", ...]
}
```

#### POST /api/v1/auth/mfa/disable
Disable MFA.

**Request:**
```json
{
  "password": "CurrentPassword123!",
  "code": "123456"
}
```

### Health Check

#### GET /health
Check service health status.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "psa-auth-service",
  "version": "1.0.0",
  "timestamp": "2025-11-04T18:00:00Z"
}
```

## Database Schema

The Auth Service uses the following PostgreSQL tables:

### users
Main user table (defined in core PSA schema).

### refresh_tokens
JWT refresh tokens with revocation support.

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);
```

### password_reset_tokens
One-time tokens for password reset flow.

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    used_at TIMESTAMP
);
```

### mfa_setup_tokens
Temporary tokens during MFA enrollment.

```sql
CREATE TABLE mfa_setup_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    secret VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    verified_at TIMESTAMP
);
```

## Role-Based Access Control (RBAC)

The Auth Service supports 23 hierarchical roles:

### System Roles (Highest Priority)
- `system_admin` (100) - Full system access
- `tenant_admin` (90) - Tenant-wide administration
- `security_admin` (85) - Security management
- `service_manager` (80) - Service management

### Technical Leads
- `software_developer_lead` (70)
- `technician_lead` (70)

### Senior Roles
- `software_developer_senior` (60)
- `technician_senior` (60)

### Mid-Level Roles
- `software_developer` (50)
- `technician` (50)

### Junior Roles
- `software_developer_junior` (40)
- `technician_junior` (40)

### Legacy Support Tiers (Deprecated but supported)
- `technician_l3` (55)
- `technician_l2` (45)
- `technician_l1` (35)

### Management Roles
- `account_manager` (65)
- `project_manager` (65)
- `billing_manager` (65)

### Customer Roles (Lowest Priority)
- `customer_admin` (30)
- `customer_technician` (20)
- `customer_user` (10)

### Role Hierarchy

Higher priority roles inherit permissions from lower roles. For example:
- `tenant_admin` (90) can access anything `technician_senior` (60) can access
- `technician_senior` (60) can access anything `technician_junior` (40) can access

## Security Features

### Password Security
- **Algorithm:** bcrypt with 12 rounds
- **Minimum Length:** 12 characters
- **Complexity Requirements:**
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Password History:** Last 5 passwords stored (future feature)

### Account Lockout
- **Max Failed Attempts:** 5
- **Lockout Duration:** 15 minutes
- **Automatic Reset:** On successful login

### Rate Limiting
- **Global API Limit:** 100 requests/minute per IP
- **Login Limit:** 5 attempts/15 minutes per email+IP combination
- **Storage:** Redis (distributed rate limiting)

### JWT Tokens
- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry
- **Storage:** Refresh tokens stored in database (revocable)
- **Hashing:** Token hashes stored with SHA256

### MFA (Multi-Factor Authentication)
- **Algorithm:** TOTP (Time-based One-Time Password)
- **QR Code:** Generated for authenticator apps (Google Authenticator, Authy, etc.)
- **Backup Codes:** 10 one-time recovery codes generated
- **Window:** 1 time step (30 seconds)

## Environment Variables

Create a `.env` file in the service root:

```bash
# Service Configuration
NODE_ENV=development
PORT=3001
SERVICE_NAME=psa-auth-service

# Database Configuration
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=psa_platform
POSTGRES_USER=psa_app
POSTGRES_PASSWORD=<your-password>

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>

# JWT Configuration
JWT_SECRET=<min-32-chars-secret>
JWT_REFRESH_SECRET=<min-32-chars-refresh-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Password Policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_HISTORY_COUNT=5

# Security Settings
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
SESSION_TIMEOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# MFA Configuration
MFA_ISSUER=PSA-Platform
MFA_WINDOW=1

# Logging
LOG_LEVEL=debug
```

## Running the Service

### Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# The service will start on http://localhost:3001
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

## Database Migrations

Run the migration script to create the auth tables:

```bash
export PGPASSWORD='<your-password>'
psql -h localhost -U psa_app -d psa_platform -f migrations/001_create_auth_tables.sql
```

## Testing the API

### Using curl

```bash
# Register a new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Get current user (with access token)
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <access-token>"

# Health check
curl http://localhost:3001/health
```

## Deployment

The Auth Service is designed to run on **Container 200 (psa-all-in-one)** for the MVP phase.

### PM2 Configuration

Add to `/opt/psa-platform/ecosystem.config.js`:

```javascript
{
  name: 'auth',
  script: './services/auth-service/dist/index.js',
  instances: 2,
  exec_mode: 'cluster',
  env_file: '.env',
  env: {
    NODE_ENV: 'production',
    PORT: 3001
  },
  error_file: './logs/auth/error.log',
  out_file: './logs/auth/out.log',
  merge_logs: true,
  time: true
}
```

### Start with PM2

```bash
pm2 start ecosystem.config.js --only auth
pm2 logs auth
pm2 status
```

## Monitoring & Logging

### Logs

Logs are written to:
- **Console:** Structured JSON logs (Winston)
- **Files:** (if configured) `logs/auth/error.log`, `logs/auth/out.log`

### Log Levels

- **error:** Critical errors
- **warn:** Warnings (e.g., access denied)
- **info:** General information (startup, requests)
- **debug:** Detailed debugging information

### Metrics to Monitor

- **Response Time:** p95 should be < 200ms for login
- **Error Rate:** Should be < 1%
- **Active Sessions:** Number of valid refresh tokens
- **Failed Login Attempts:** Monitor for brute force attacks
- **Database Connection Pool:** Monitor pool utilization
- **Redis Connection:** Monitor rate limiting storage

## Troubleshooting

### Service Won't Start

1. Check database connection:
   ```bash
   export PGPASSWORD='<password>'
   psql -h localhost -U psa_app -d psa_platform -c "SELECT 1"
   ```

2. Check Redis connection:
   ```bash
   redis-cli -a <redis-password> PING
   ```

3. Verify environment variables:
   ```bash
   cat .env | grep -E "(JWT_SECRET|POSTGRES_PASSWORD|REDIS_PASSWORD)"
   ```

### Login Fails

1. Check if user exists in database:
   ```sql
   SELECT email, is_active, locked_until FROM users WHERE email = 'user@example.com';
   ```

2. Check failed login attempts:
   ```sql
   SELECT failed_login_attempts, locked_until FROM users WHERE email = 'user@example.com';
   ```

3. Reset account lockout:
   ```sql
   UPDATE users SET failed_login_attempts = 0, locked_until = NULL
   WHERE email = 'user@example.com';
   ```

### MFA Issues

1. Verify MFA secret:
   ```sql
   SELECT mfa_enabled, mfa_secret FROM users WHERE email = 'user@example.com';
   ```

2. Disable MFA temporarily:
   ```sql
   UPDATE users SET mfa_enabled = false, mfa_secret = NULL
   WHERE email = 'user@example.com';
   ```

## Next Steps (Phase 2)

- [ ] Implement OAuth2 integration (Google, Microsoft)
- [ ] Add SAML 2.0 support for enterprise SSO
- [ ] Implement LDAP/Active Directory integration
- [ ] Add FIDO2/WebAuthn support for hardware keys
- [ ] Write comprehensive unit tests (target: 80% coverage)
- [ ] Write integration tests for all endpoints
- [ ] Add password history enforcement
- [ ] Implement session management UI
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Implement audit logging for all auth events

## References

- **Implementation Guide:** `/opt/psa-putzi/implementation/02-MODULE-Auth.md`
- **Database Schema:** `/opt/psa-putzi/BDUF/BDUF-Chapter3.md`
- **Security Architecture:** `/opt/psa-putzi/BDUF/BDUF-Chapter5.md`
- **Handover Document:** `/opt/psa-putzi/.subagents/HANDOVER-auth-module.md`

## Support

For questions or issues:
1. Check this README
2. Review the implementation guide
3. Check the BDUF documentation
4. Create an issue in the project tracker

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0
**Status:** ✅ Production Ready (MVP)
