# Sub-Agent Handover: Auth Module Development

**Handover ID:** AUTH-001
**Date:** 2025-11-04
**From:** Master Agent (Planning & Coordination)
**To:** Auth Module Sub-Agent
**Priority:** P0 (Critical - Blocker for all other services)
**Estimated Duration:** 3-4 weeks (1 developer)

---

## Task Overview

Develop the complete Authentication & Authorization service (psa-auth) with JWT tokens, MFA support, RBAC with 23 roles, and SSO integration.

## Objective

Create a production-ready authentication service that provides:
- Local authentication (email/password)
- JWT token management (access + refresh tokens)
- Multi-Factor Authentication (TOTP, FIDO2, SMS)
- Role-Based Access Control (23 roles)
- Single Sign-On (SAML, OIDC, Azure AD, LDAP)
- Password policies and security
- Session management

## Prerequisites

**MUST BE COMPLETED FIRST:**
- ✅ Infrastructure setup (Container 200) - See HANDOVER-infrastructure-setup.md
- ✅ Database schema applied (users, refresh_tokens, etc.)
- ✅ Node.js 20 LTS installed
- ✅ PM2 configured

## Reference Documents

**Primary Guide:**
- `implementation/02-MODULE-Auth.md` - Complete implementation guide

**Supporting Documents:**
- `BDUF/BDUF-Chapter3.md` - Database schema (users table)
- `BDUF/BDUF-Chapter5.md` - Security architecture
- `BDUF/BDUF-Chapter3-Role-Model-Enhancement.md` - 23 roles explained
- `implementation/00-DEPLOYMENT-STRATEGY.md` - Deployment context

## Project Structure

Create service in: `/opt/psa-platform/services/auth/`

```
services/auth/
├── src/
│   ├── index.ts              # Application entry point
│   ├── app.ts                # Express app configuration
│   ├── routes/
│   │   ├── auth.routes.ts    # POST /login, /logout, /register, etc.
│   │   ├── mfa.routes.ts     # POST /mfa/setup, /mfa/verify
│   │   └── users.routes.ts   # GET /users/:id, PUT /users/:id
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── mfa.controller.ts
│   │   └── users.controller.ts
│   ├── services/
│   │   ├── jwt.service.ts    # JWT token generation/validation
│   │   ├── password.service.ts # Bcrypt hashing
│   │   ├── mfa.service.ts    # TOTP, FIDO2 logic
│   │   └── sso.service.ts    # SAML, OIDC integration
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT validation
│   │   ├── rbac.middleware.ts # Permission checking
│   │   └── rate-limit.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── refresh-token.model.ts
│   ├── validators/
│   │   ├── auth.validator.ts # Joi schemas
│   │   └── user.validator.ts
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── tests/
│   ├── unit/
│   │   ├── jwt.service.test.ts
│   │   ├── password.service.test.ts
│   │   └── rbac.middleware.test.ts
│   └── integration/
│       ├── auth.routes.test.ts
│       ├── mfa.routes.test.ts
│       └── users.routes.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Implementation Checklist

### Phase 1: Setup & Basic Auth (Week 1)
- [ ] Initialize TypeScript project
- [ ] Install dependencies (see module guide section 8)
- [ ] Configure TypeScript and build process
- [ ] Set up database connection using shared pool
- [ ] Implement User model
- [ ] Implement password hashing (bcrypt)
- [ ] Implement JWT service (access + refresh tokens)
- [ ] **API: POST /auth/register** - User registration
- [ ] **API: POST /auth/login** - User login
- [ ] **API: POST /auth/logout** - User logout
- [ ] **API: POST /auth/refresh** - Token refresh
- [ ] Write unit tests for JWT and password services
- [ ] Write integration tests for basic auth endpoints

### Phase 2: User Management & RBAC (Week 1-2)
- [ ] Implement RBAC middleware
- [ ] Define 23 role permissions (see BDUF-Chapter3-Role-Model-Enhancement.md)
- [ ] **API: GET /users** - List users (with pagination)
- [ ] **API: GET /users/:id** - Get single user
- [ ] **API: PUT /users/:id** - Update user
- [ ] **API: DELETE /users/:id** - Soft delete user
- [ ] **API: GET /auth/me** - Get current user profile
- [ ] **API: PUT /auth/me** - Update own profile
- [ ] **API: PUT /auth/change-password** - Change password
- [ ] Implement role hierarchy checks
- [ ] Write unit tests for RBAC middleware
- [ ] Write integration tests for user management

### Phase 3: Multi-Factor Authentication (Week 2-3)
- [ ] Implement TOTP service (authenticator apps)
- [ ] Implement FIDO2/WebAuthn service (hardware keys)
- [ ] Implement SMS backup (optional)
- [ ] **API: POST /mfa/setup/totp** - Setup TOTP
- [ ] **API: POST /mfa/verify/totp** - Verify TOTP
- [ ] **API: POST /mfa/setup/fido2** - Setup FIDO2
- [ ] **API: POST /mfa/verify/fido2** - Verify FIDO2
- [ ] **API: POST /mfa/backup-codes** - Generate backup codes
- [ ] **API: DELETE /mfa/disable** - Disable MFA
- [ ] Update login flow to require MFA
- [ ] Write unit tests for MFA services
- [ ] Write integration tests for MFA endpoints

### Phase 4: SSO Integration (Week 3-4)
- [ ] Implement SAML 2.0 provider
- [ ] Implement OpenID Connect provider
- [ ] Implement Azure AD integration
- [ ] Implement LDAP/Active Directory integration
- [ ] **API: GET /sso/saml/login** - SAML login initiation
- [ ] **API: POST /sso/saml/callback** - SAML callback
- [ ] **API: GET /sso/oidc/login** - OIDC login
- [ ] **API: GET /sso/oidc/callback** - OIDC callback
- [ ] **API: POST /sso/ldap/login** - LDAP login
- [ ] Test with Azure AD (if available)
- [ ] Write integration tests for SSO flows

### Phase 5: Security & Rate Limiting (Week 4)
- [ ] Implement rate limiting (10 attempts per minute)
- [ ] Implement failed login tracking
- [ ] Implement account lockout (5 failed attempts)
- [ ] Implement password policy validation
- [ ] Implement password reset flow
- [ ] **API: POST /auth/forgot-password** - Request password reset
- [ ] **API: POST /auth/reset-password** - Reset password with token
- [ ] Add security headers (helmet)
- [ ] Add request logging
- [ ] Write security tests

### Phase 6: Testing & Documentation (Week 4)
- [ ] Achieve ≥80% unit test coverage
- [ ] Write comprehensive integration tests
- [ ] Test all 12 API endpoints
- [ ] Load test with k6 (100+ concurrent users)
- [ ] Create OpenAPI specification
- [ ] Document all environment variables
- [ ] Write deployment guide
- [ ] Create troubleshooting guide

## API Endpoints (12 Total)

**Authentication (6):**
1. POST /auth/register
2. POST /auth/login
3. POST /auth/logout
4. POST /auth/refresh
5. POST /auth/forgot-password
6. POST /auth/reset-password

**User Management (4):**
7. GET /auth/me
8. PUT /auth/me
9. PUT /auth/change-password
10. GET /users (admin only)

**MFA (2):**
11. POST /mfa/setup
12. POST /mfa/verify

See `implementation/02-MODULE-Auth.md` section 3 for complete API specifications.

## Testing Requirements

### Unit Tests (Target: 80% coverage)
```typescript
// tests/unit/jwt.service.test.ts
describe('JWT Service', () => {
  it('should generate valid access token', () => { /* ... */ });
  it('should generate valid refresh token', () => { /* ... */ });
  it('should validate tokens correctly', () => { /* ... */ });
  it('should reject expired tokens', () => { /* ... */ });
});

// tests/unit/password.service.test.ts
describe('Password Service', () => {
  it('should hash passwords with bcrypt', () => { /* ... */ });
  it('should verify correct passwords', () => { /* ... */ });
  it('should reject incorrect passwords', () => { /* ... */ });
});

// tests/unit/rbac.middleware.test.ts
describe('RBAC Middleware', () => {
  it('should allow system_admin access to all resources', () => { /* ... */ });
  it('should deny customer_user access to admin resources', () => { /* ... */ });
  it('should enforce role hierarchy', () => { /* ... */ });
});
```

### Integration Tests
```typescript
// tests/integration/auth.routes.test.ts
describe('POST /auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
  });

  it('should reject invalid credentials', async () => { /* ... */ });
  it('should enforce rate limiting', async () => { /* ... */ });
  it('should lock account after 5 failed attempts', async () => { /* ... */ });
});
```

## Dependencies (package.json)

```json
{
  "name": "psa-auth",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "otplib": "^12.0.1",
    "@simplewebauthn/server": "^9.0.0",
    "passport": "^0.7.0",
    "passport-saml": "^3.2.4",
    "passport-azure-ad": "^4.3.5",
    "ldapjs": "^3.0.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "ts-jest": "^29.1.1"
  }
}
```

## Environment Variables

```env
# Service
NODE_ENV=development
PORT=3010

# Database (use shared connection)
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=psa_platform
POSTGRES_USER=psa_app
POSTGRES_PASSWORD=your_password_here

# Redis (for session management)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Account Lockout
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# MFA (optional)
MFA_ISSUER=PSA-Platform
SMS_PROVIDER=twilio
SMS_API_KEY=your_twilio_key

# SSO (optional - configure as needed)
SAML_ENTRY_POINT=https://idp.example.com/sso
SAML_CALLBACK_URL=https://psa-platform.local/sso/saml/callback
SAML_CERT=path/to/cert.pem

AZURE_AD_TENANT_ID=your_tenant_id
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret

LDAP_URL=ldap://ldap.example.com:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=ldap_password
```

## Definition of Done

- [ ] All 12 API endpoints implemented and tested
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] JWT tokens working correctly
- [ ] MFA (TOTP + FIDO2) functional
- [ ] RBAC middleware enforcing all 23 roles
- [ ] SSO integration tested (at least SAML or OIDC)
- [ ] Password policies enforced
- [ ] Rate limiting working
- [ ] Account lockout functional
- [ ] OpenAPI documentation complete
- [ ] Load test: p95 response time < 200ms
- [ ] Service running on PM2 in cluster mode
- [ ] Logs writing to `/opt/psa-platform/logs/auth/`
- [ ] README.md with setup and usage instructions

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/auth-module

# Regular commits during development
git add .
git commit -m "feat(auth): implement JWT service"
git commit -m "feat(auth): add MFA TOTP support"
git commit -m "feat(auth): implement RBAC middleware"

# Push regularly
git push -u origin feature/auth-module

# Create status updates weekly
cp templates/TEMPLATE-status-update.md .subagents/STATUS-auth-week1.md
# Fill in and commit
```

## PM2 Configuration

Add to `/opt/psa-platform/ecosystem.config.js`:

```javascript
{
  name: 'auth',
  script: './services/auth/dist/index.js',
  instances: 2,
  exec_mode: 'cluster',
  env_file: '.env',
  env: {
    NODE_ENV: 'production',
    PORT: 3010
  },
  error_file: './logs/auth/error.log',
  out_file: './logs/auth/out.log',
  merge_logs: true,
  time: true
}
```

Start service: `pm2 start ecosystem.config.js --only auth`

## Handover to Next Agent

Once Auth module is complete:

1. **Create handover for API Gateway sub-agent** - They need Auth working
2. **Document all endpoints** in OpenAPI format
3. **Provide test credentials** for other modules to use
4. **Update status:** Create final status update with completion report
5. **Tag master agent** for review

## Support & Questions

- Reference: `implementation/02-MODULE-Auth.md`
- Issues: Use `templates/TEMPLATE-issue.md`
- Questions: Tag master agent in status updates
- Security concerns: Escalate immediately

---

**Status:** 🟡 Assigned - Waiting for infrastructure
**Depends On:** INFRA-001 (Infrastructure Setup)
**Blocks:** GATEWAY-001 (API Gateway), CRM-001 (CRM Module)
**Last Updated:** 2025-11-04
**Assigned To:** Auth Module Sub-Agent
**Estimated Completion:** 2025-12-02 (4 weeks)
