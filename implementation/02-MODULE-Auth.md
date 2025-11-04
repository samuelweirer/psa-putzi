# Module Implementation Guide: psa-auth

**Module:** Authentication & Authorization (psa-auth)
**Phase:** 1 (MVP)
**Priority:** P0 (Critical - Blocker for all other services)
**Port:** 3010
**Dependencies:** psa-db-master (PostgreSQL)

> **📦 Deployment Note:** For MVP (Phase 1-2), this service runs on **Container 150 (psa-app)** alongside all other Node.js services, managed by PM2. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The Auth module provides centralized authentication and authorization for the entire PSA-Platform.

### Key Features
- **Local Authentication** (Email/Password)
- **Single Sign-On (SSO):** SAML 2.0, OpenID Connect, Azure AD, LDAP
- **Multi-Factor Authentication (MFA):** TOTP, FIDO2, SMS backup
- **Role-Based Access Control (RBAC):** 23 roles with granular permissions
- **JWT Token Management:** Access tokens (15min) + Refresh tokens (7 days)
- **Session Management:** Concurrent session limiting, timeout handling
- **Audit Logging:** All auth events logged

### Container Specifications
- **CPU:** 2-4 cores
- **RAM:** 4 GB
- **Storage:** 10 GB
- **Network:** VLAN 20 (Application)
- **Port:** 3010

---

## 2. DATABASE SCHEMA

### Tables Required

See BDUF-Chapter3.md for complete schema. Key tables:

**users** - Already defined in Chapter 3 (with 23 roles)
**audit_log** - Already defined in Chapter 3

**Additional tables for Auth:**

```sql
-- Refresh Tokens
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

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL;

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    used_at TIMESTAMP
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash) 
    WHERE used_at IS NULL AND expires_at > NOW();

-- MFA Setup Tokens (temp tokens during MFA enrollment)
CREATE TABLE mfa_setup_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    secret VARCHAR(100) NOT NULL, -- TOTP secret during setup
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    verified_at TIMESTAMP
);
```

---

## 3. API SPECIFICATION

### Base URL
`https://api.psa-platform.local/api/v1/auth`

### Endpoints

#### POST /auth/login
**Description:** Authenticate user with email/password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "mfa_code": "123456"  // Optional, required if MFA enabled
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "Bearer",
  "expires_in": 900,  // 15 minutes
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

---

#### POST /auth/refresh
**Description:** Refresh access token using refresh token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

---

#### POST /auth/logout
**Description:** Revoke refresh token and invalidate session

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response (204 No Content)**

---

#### POST /auth/register
**Description:** Register new user (admin only or self-registration if enabled)

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "technician_junior"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "technician_junior",
  "is_verified": false
}
```

---

#### POST /auth/password-reset/request
**Description:** Request password reset email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

---

#### POST /auth/password-reset/confirm
**Description:** Confirm password reset with token

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully."
}
```

---

#### GET /auth/me
**Description:** Get current authenticated user

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "technician_senior",
  "permissions": {},
  "mfa_enabled": true,
  "last_login_at": "2025-11-04T10:30:00Z"
}
```

---

#### POST /auth/mfa/setup
**Description:** Begin MFA setup (TOTP)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KG...",
  "setup_token": "temp-setup-token"
}
```

---

#### POST /auth/mfa/verify
**Description:** Verify and enable MFA

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "setup_token": "temp-setup-token",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "MFA enabled successfully",
  "recovery_codes": ["ABC123", "DEF456", "GHI789", ...]
}
```

---

#### POST /auth/mfa/disable
**Description:** Disable MFA

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "password": "CurrentPassword123!",
  "code": "123456"  // Current MFA code
}
```

**Response (200 OK):**
```json
{
  "message": "MFA disabled successfully"
}
```

---

### SSO Endpoints

#### GET /auth/sso/saml/metadata
**Description:** SAML metadata XML

#### POST /auth/sso/saml/acs
**Description:** SAML Assertion Consumer Service

#### GET /auth/sso/oidc/authorize
**Description:** OIDC authorization endpoint

#### POST /auth/sso/oidc/token
**Description:** OIDC token endpoint

---

## 4. BUSINESS LOGIC

### Password Hashing
- **Algorithm:** bcrypt with cost factor 12
- **Validation:** Min 12 characters, complexity requirements
- **History:** Last 5 passwords stored (hashed)

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### JWT Token Generation

```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;  // user_id
  email: string;
  role: string;
  permissions: object;
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m',
    issuer: 'psa-platform',
    audience: 'psa-api'
  });
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
    issuer: 'psa-platform',
    audience: 'psa-api'
  });
}
```

### Failed Login Handling

```typescript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

async function handleFailedLogin(userId: string) {
  const user = await User.findById(userId);
  user.failed_login_attempts += 1;

  if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
    user.locked_until = new Date(Date.now() + LOCKOUT_DURATION);
  }

  await user.save();
}
```

### RBAC Middleware

```typescript
function requireRole(...allowedRoles: string[]) {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

// Usage:
router.get('/admin/users', 
  authenticateJWT, 
  requireRole('system_admin', 'tenant_admin'),
  adminController.listUsers
);
```

---

## 5. TESTING REQUIREMENTS

### Unit Tests (Target: 80% coverage)

```typescript
// tests/unit/auth-service.test.ts
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@test.com', 'Password123!');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw error for invalid password', async () => {
      await expect(authService.login('user@test.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should increment failed_login_attempts', async () => {
      await authService.login('user@test.com', 'wrongpassword').catch(() => {});
      const user = await User.findByEmail('user@test.com');
      expect(user.failed_login_attempts).toBe(1);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/auth.test.ts
describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
  });

  it('should require MFA code if enabled', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mfa-user@example.com', password: 'Password123!' });

    expect(response.status).toBe(428);
    expect(response.body.error).toBe('MFA code required');
  });
});
```

---

## 6. IMPLEMENTATION CHECKLIST

### Database Setup
- [ ] Create `refresh_tokens` table
- [ ] Create `password_reset_tokens` table
- [ ] Create `mfa_setup_tokens` table
- [ ] Add indexes
- [ ] Create migration scripts

### Core Auth
- [ ] Implement password hashing (bcrypt)
- [ ] Implement JWT token generation
- [ ] Implement JWT token validation middleware
- [ ] Implement refresh token logic
- [ ] Implement failed login handling
- [ ] Implement account lockout

### Endpoints
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout
- [ ] POST /auth/register
- [ ] GET /auth/me
- [ ] POST /auth/password-reset/request
- [ ] POST /auth/password-reset/confirm

### MFA
- [ ] Implement TOTP generation (speakeasy/otplib)
- [ ] Implement QR code generation
- [ ] POST /auth/mfa/setup
- [ ] POST /auth/mfa/verify
- [ ] POST /auth/mfa/disable
- [ ] Recovery codes generation

### RBAC
- [ ] Implement role validation middleware
- [ ] Implement permission checking
- [ ] Audit logging for authorization events

### SSO (Optional for MVP, Priority for Phase 2)
- [ ] SAML 2.0 integration (passport-saml)
- [ ] OIDC integration (passport-openidconnect)
- [ ] Azure AD integration
- [ ] LDAP integration

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests
- [ ] Security tests (OWASP)
- [ ] Performance tests (login < 200ms)

### Documentation
- [ ] OpenAPI specification
- [ ] README with setup instructions
- [ ] Environment variables documentation

### Security
- [ ] Rate limiting (10 login attempts per minute per IP)
- [ ] CSRF protection
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Input validation (joi/zod)
- [ ] SQL injection prevention (ORM/parameterized queries)

---

## 7. DEFINITION OF DONE

- [x] All endpoints implemented and tested
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] API documentation complete (OpenAPI)
- [ ] Code review approved
- [ ] Security scan passed (no critical findings)
- [ ] Performance: Login < 200ms (p95)
- [ ] Deployed to staging successfully
- [ ] Manual QA testing completed

---

## 8. DEPENDENCIES & LIBRARIES

### NPM Packages

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "passport": "^0.6.0",
    "passport-local": "^1.0.0",
    "passport-jwt": "^4.0.1",
    "speakeasy": "^2.0.0",  // TOTP
    "qrcode": "^1.5.3",      // QR code generation
    "joi": "^17.11.0",       // Validation
    "pg": "^8.11.3",         // PostgreSQL
    "typeorm": "^0.3.17"     // ORM
  }
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://postgres:password@psa-db-master:5432/psa_platform

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-here-min-32-chars

# App
NODE_ENV=production
PORT=3010

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
SESSION_TIMEOUT_MINUTES=30

# MFA
MFA_ISSUER=PSA-Platform

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@psa-platform.local
SMTP_PASSWORD=smtp-password
```

---

## 10. DEPLOYMENT

### Docker/LXC Container

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3010

CMD ["node", "dist/index.js"]
```

### Health Check

```typescript
// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'psa-auth',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 4 weeks (2 developers)
