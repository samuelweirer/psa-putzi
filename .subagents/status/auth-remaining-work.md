# AUTH-001 Remaining Work Breakdown

**Module:** Authentication & Authorization Service
**Current Status:** 75% Complete
**Agent:** Senior-2 (Security Specialist) - Claude Sonnet 4.5
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG`
**Target:** 100% Complete by end of Week 3

---

## ✅ Completed (75%)

### Core Authentication (100%)
- ✅ User registration with email/password
- ✅ Login with credentials
- ✅ JWT token generation (access + refresh with unique jti)
- ✅ Token refresh mechanism
- ✅ Logout with token invalidation
- ✅ Password hashing with bcrypt
- ✅ Password policy validation

### MFA/2FA (100%)
- ✅ TOTP setup with QR code generation
- ✅ TOTP verification (6-digit codes)
- ✅ Recovery codes generation (10 codes per user)
- ✅ Recovery code verification
- ✅ MFA enable/disable functionality

### Password Management (100%)
- ✅ Password change (authenticated users)
- ✅ Password reset request (forgot password)
- ✅ Password reset with token
- ✅ Token expiration (15 minutes for reset)

### User Management (100%)
- ✅ User profile retrieval (GET /me)
- ✅ User profile update (PATCH /me)
- ✅ Account locking after failed login attempts
- ✅ Account status tracking (active/suspended/locked)

### RBAC (100%)
- ✅ Role-based access control middleware
- ✅ 23 predefined roles (super_admin → guest)
- ✅ Permission checking per role
- ✅ Role hierarchy enforcement

### Security Features (100%)
- ✅ Rate limiting (Redis-based)
  - Login: 10 attempts per 15 min
  - Register: 5 attempts per hour
  - Password reset: 3 attempts per hour
- ✅ Error handling middleware
- ✅ Graceful shutdown handling
- ✅ Logging with Winston (info/error/debug)

### Testing (100% passing, 69% coverage)
- ✅ Unit tests: 107/107 passing
  - Auth service: 12 tests
  - JWT service: 10 tests
  - Password service: 8 tests
  - MFA service: 15 tests
  - User model: 35 tests
  - Refresh token model: 15 tests
  - Validators: 12 tests
- ✅ Integration tests: 30/30 passing
  - Auth endpoints: 18 tests
  - MFA flow: 12 tests
- ✅ Test coverage: 69% (target: 80%)

### Infrastructure (100%)
- ✅ TypeScript + Express.js setup
- ✅ PostgreSQL connection with connection pooling
- ✅ Redis connection for caching/rate limiting
- ✅ Environment configuration (.env)
- ✅ ESLint 9 flat config + Prettier
- ✅ npm scripts (dev, build, test, lint)
- ✅ Service builds cleanly (0 errors)
- ✅ Service starts and runs (tested)

---

## 🔄 Remaining Work (25%)

### 1. OAuth2 Integration (15% of total work)

**Priority:** High (P0 - blocking production deployment)
**Estimated Time:** 6-8 hours
**Complexity:** ⭐⭐⭐⭐ High

#### Tasks:

**A. Google OAuth2 (4 hours)**
- [ ] Install `passport-google-oauth20` package
- [ ] Create Google OAuth2 strategy in `src/services/oauth.service.ts`
- [ ] Implement routes:
  - `GET /api/v1/auth/google` - Initiate Google login
  - `GET /api/v1/auth/google/callback` - Handle callback
- [ ] User creation/linking logic:
  - If email exists → link to existing account
  - If new user → create account with OAuth provider
- [ ] Store OAuth provider info in users table (`oauth_provider`, `oauth_provider_id`)
- [ ] Generate JWT tokens after successful OAuth
- [ ] Handle OAuth errors gracefully
- [ ] Write integration tests (5 tests):
  - Google OAuth initiation
  - Successful callback with new user
  - Successful callback with existing user
  - Error handling (invalid state)
  - Email conflict resolution

**B. Microsoft OAuth2 (4 hours)**
- [ ] Install `passport-microsoft` package
- [ ] Create Microsoft OAuth2 strategy
- [ ] Implement routes:
  - `GET /api/v1/auth/microsoft` - Initiate Microsoft login
  - `GET /api/v1/auth/microsoft/callback` - Handle callback
- [ ] Same user linking logic as Google
- [ ] Write integration tests (5 tests)

**Files to Create/Modify:**
- `src/services/oauth.service.ts` (new)
- `src/controllers/oauth.controller.ts` (new)
- `src/routes/oauth.routes.ts` (new)
- `src/app.ts` (add OAuth routes)
- `package.json` (add passport dependencies)
- `tests/integration/oauth.test.ts` (new)

**Database Changes:**
- Add columns to users table:
  - `oauth_provider` (VARCHAR, nullable)
  - `oauth_provider_id` (VARCHAR, nullable)
  - Composite unique index on (oauth_provider, oauth_provider_id)

**Environment Variables:**
```env
# Google OAuth2
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/v1/auth/microsoft/callback
```

---

### 2. Test Coverage Improvement (8% of total work)

**Priority:** Medium (P1 - important for quality)
**Estimated Time:** 4-6 hours
**Current:** 69% | **Target:** 80% (+11%)
**Complexity:** ⭐⭐⭐ Medium

#### Coverage Gaps:

**A. RBAC Middleware (0% coverage - HIGH PRIORITY)**
- [ ] Test `requireAuth` middleware
  - Valid token → next()
  - Missing token → 401
  - Invalid token → 401
  - Expired token → 401
- [ ] Test `requireRoles` middleware
  - User has required role → next()
  - User missing role → 403
  - Multiple roles (any match) → next()
  - Multiple roles (no match) → 403
- [ ] Test `requirePermissions` middleware
  - Similar to requireRoles

**Estimated:** 12 unit tests, +10% coverage, 2 hours

**B. Controller Edge Cases (partial coverage)**
- [ ] Auth controller error handling:
  - Database connection failures
  - Redis connection failures
  - Validation errors with multiple fields
  - Concurrent registration attempts (race conditions)
- [ ] MFA controller edge cases:
  - QR code generation failures
  - Invalid base32 secrets
  - Clock drift in TOTP validation

**Estimated:** 15 unit tests, +3% coverage, 2 hours

**C. Error Middleware (partial coverage)**
- [ ] Test all error types:
  - ValidationError → 400
  - UnauthorizedError → 401
  - ForbiddenError → 403
  - NotFoundError → 404
  - DatabaseError → 500
  - Generic Error → 500
- [ ] Test error logging
- [ ] Test error sanitization (no stack traces in production)

**Estimated:** 8 unit tests, +2% coverage, 1 hour

**D. User Model Edge Cases (partial coverage)**
- [ ] Pagination edge cases (page > max, negative page)
- [ ] Search with special characters
- [ ] Account locking race conditions
- [ ] Soft delete cascading

**Estimated:** 8 unit tests, +1% coverage, 1 hour

---

### 3. API Documentation (2% of total work)

**Priority:** Medium (P1 - important for frontend team)
**Estimated Time:** 2-3 hours
**Complexity:** ⭐⭐ Low-Medium

#### Tasks:

- [ ] Install Swagger dependencies:
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  npm install -D @types/swagger-jsdoc @types/swagger-ui-express
  ```

- [ ] Create OpenAPI 3.0 spec in `src/docs/openapi.yaml` or use JSDoc comments

- [ ] Add Swagger UI route:
  ```typescript
  // src/app.ts
  import swaggerUi from 'swagger-ui-express';
  import swaggerSpec from './docs/swagger';

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  ```

- [ ] Document all 12 auth endpoints:
  - Request/response schemas
  - Authentication requirements
  - Error responses
  - Examples

- [ ] Add API versioning documentation

**Files to Create/Modify:**
- `src/docs/swagger.ts` (new)
- `src/docs/schemas/` (new directory with schema definitions)
- `src/app.ts` (add Swagger route)

---

## 📊 Work Distribution

### Option A: Complete Everything (Recommended)
**Total Time:** 12-17 hours (1.5-2 days)

**Day 1 (8 hours):**
- OAuth2 Google (4 hours)
- OAuth2 Microsoft (4 hours)

**Day 2 (6-8 hours):**
- Test coverage: RBAC middleware (2 hours)
- Test coverage: Controller edge cases (2 hours)
- Test coverage: Error middleware (1 hour)
- Test coverage: Model edge cases (1 hour)
- API documentation (2-3 hours)

**Day 3 (Buffer):**
- Fix any integration issues
- Final testing
- Update documentation

### Option B: Critical Path Only (Minimal MVP)
**Total Time:** 8-10 hours (1 day)

**Day 1:**
- OAuth2 Google (4 hours)
- OAuth2 Microsoft (4 hours)
- Basic API docs (2 hours)

**Defer:**
- Test coverage improvement (do in parallel with frontend work)

---

## 🔗 Dependencies

### Blocking Frontend Development?
**No.** Frontend can start now with existing endpoints.

### Blocking API Gateway (GATEWAY-001)?
**Yes, partially.** Gateway needs:
- ✅ JWT validation (ready)
- ✅ RBAC middleware (ready)
- 🔄 OAuth2 callbacks (pending)

**Recommendation:** Gateway can start with local auth, add OAuth2 later.

---

## 🚀 Parallel Work Strategy

### My Work (Senior-2):
1. OAuth2 integration (Day 1-2)
2. Test coverage improvements (Day 2-3)
3. API documentation (Day 3)

### Frontend Agent (Junior-5) - Parallel:
1. React setup (Day 1)
2. Login/Register UI (Day 2-3)
3. MFA UI (Day 4)
4. Profile pages (Day 5)
5. Testing (Day 6)

**Coordination Points:**
- Frontend can use existing auth endpoints immediately
- OAuth2 buttons can be placeholders until Week 3
- Frontend tests against running auth service (port 3001)

---

## ✅ Definition of Done

AUTH-001 is **100% complete** when:

- [x] All local auth features working (✅ done)
- [x] MFA/2FA fully functional (✅ done)
- [ ] Google OAuth2 working
- [ ] Microsoft OAuth2 working
- [ ] Test coverage ≥80%
- [ ] All 137+ tests passing
- [ ] API documentation published (Swagger UI)
- [ ] Service deployed to PM2 on Container 200
- [ ] Handover document to GATEWAY-001 complete
- [ ] No critical bugs
- [ ] Code reviewed and approved

---

## 📝 Next Steps

1. **Immediate:** Start OAuth2 Google integration
2. **Day 2:** Complete Microsoft OAuth2
3. **Day 3:** Improve test coverage to 80%
4. **Day 3:** Create API documentation
5. **Day 4:** Deploy to production (PM2)
6. **Day 4:** Create handover to Gateway team

---

## 🤝 Support Frontend Team

While completing OAuth2:
- Monitor `.subagents/issues/` for frontend questions
- Respond to API questions < 2 hours
- Help debug auth endpoint issues
- Provide examples/guidance as needed

---

**Last Updated:** 2025-11-04
**Current Sprint:** Week 2 of 3-4
**Target Completion:** End of Week 3 (2025-11-11)
