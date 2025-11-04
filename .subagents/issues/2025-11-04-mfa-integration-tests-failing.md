# Issue: MFA Integration Tests Failing

**Date Created:** 2025-11-04 19:15
**Issue ID:** 2025-11-04-mfa-integration-tests-failing
**Reported By:** Master Agent (Main Session)
**Severity:** 🟡 Important
**Type:** 🐛 Bug | 🔄 Task
**Status:** 🆕 New - Ready for Sub-Agent

---

## 📋 Summary

**One-Line Description:**
MFA integration test is failing due to validation mismatch between TOTP codes (6 digits) and recovery codes (alphanumeric).

**Assigned To:**
- Sub-Agent (Auth Testing Specialist)

**Affected Components:**
- `services/auth-service/tests/integration/mfa-flow.test.ts`
- `services/auth-service/src/validators/auth.validator.ts` (already partially fixed)

---

## 🎯 Problem Description

### What's Wrong?
The MFA integration test `tests/integration/mfa-flow.test.ts` is failing when trying to use recovery codes for login. The test expects recovery codes (alphanumeric like "ABC123") to work, but there's a validation or flow issue.

### Current Status
- ✅ Unit tests: 107 passing (PasswordService, JWTService, MfaService)
- ✅ Basic integration tests: 27 passing (auth endpoints)
- ❌ MFA integration test: 1 failing
- **Test Coverage:** 69.43% (target: 80%)

### Test Output
```
FAIL  tests/integration/mfa-flow.test.ts > MFA Flow Integration Tests > should complete full MFA setup and login flow
Error: expected 200 "OK", got 400 "Bad Request"
```

### What Was Already Fixed
The validator was updated to accept alphanumeric codes:
```typescript
// services/auth-service/src/validators/auth.validator.ts
mfa_code: Joi.string().pattern(/^[A-Z0-9]{6,10}$/i).optional()
```

But the test is still failing, suggesting there's another issue in the flow.

---

## 🔍 Investigation Needed

### Questions to Answer
1. Is the recovery code being validated correctly in `auth.service.ts`?
2. Does the `verifyRecoveryCode` function handle case-insensitivity properly?
3. Is there an issue with how recovery codes are stored/retrieved from database?
4. Are there any other validation layers blocking recovery codes?

### Files to Check
```
services/auth-service/src/services/auth.service.ts:114-130   # Login MFA verification
services/auth-service/src/services/mfa.service.ts:69-78      # verifyRecoveryCode
services/auth-service/src/validators/auth.validator.ts:49    # loginSchema validation
services/auth-service/tests/integration/mfa-flow.test.ts:139-144  # Failing test
```

---

## 💡 Task for Sub-Agent

### Your Mission
Fix the MFA integration tests and get test coverage to ≥80%.

### Deliverables
1. **Fix MFA Integration Test**
   - Debug why recovery code login is failing
   - Fix the issue (likely in auth.service.ts or validation)
   - Ensure full MFA flow test passes

2. **Add Missing Tests** (to reach 80% coverage)
   - RBAC middleware tests (currently 0%)
   - Additional model method tests
   - Edge cases in controllers

3. **Run Coverage Report**
   - `npm run test:coverage`
   - Verify ≥80% coverage achieved
   - Document any areas still below 80%

### Current Test Status
```
Unit Tests: 107 passing ✅
Integration Tests: 27 passing ✅
MFA Integration Test: 1 failing ❌
Total: 134 passing, 1 failing

Coverage: 69.43% (need 80%)
```

---

## 🔧 Technical Context

### Environment Setup
```bash
cd /opt/psa-putzi/services/auth-service
npm install  # Dependencies already installed
npm test     # Run all tests
npm run test:integration  # Run integration tests only
npm run test:coverage     # Get coverage report
```

### Test File Location
- Main test: `tests/integration/mfa-flow.test.ts` (new, failing)
- Working tests: `tests/integration/auth.test.ts` (27 passing)
- Unit tests: `tests/unit/*.test.ts` (107 passing)

### Database
- PostgreSQL connection working
- Test uses real database (cleanup in afterAll)
- User cleanup: `DELETE FROM users WHERE email = $1`

---

## 📊 Success Criteria

### Definition of Done
- [ ] All MFA integration tests pass
- [ ] Test coverage ≥80% overall
- [ ] No regressions in existing tests (134 must still pass)
- [ ] RBAC middleware has tests (currently 0%)
- [ ] Coverage report shows all services >80%
- [ ] Tests committed with descriptive commit message

### Expected Outcome
```
Test Files  N passed (N)
      Tests  150+ passed (150+)

Coverage: ≥80.00%
- Services: >80%
- Controllers: >70%
- Models: >70%
- Middleware: >70%
```

---

## 📝 Steps to Complete

### Step 1: Debug MFA Test
```bash
# Run the failing test
npm run test tests/integration/mfa-flow.test.ts

# Check what's failing
# Look at the error message
# Add console.log if needed to see what's happening
```

### Step 2: Fix the Issue
Likely fixes needed:
- Check recovery code validation in auth.service.ts
- Ensure case-insensitive matching
- Verify database storage/retrieval
- Check if there's additional validation blocking it

### Step 3: Add RBAC Tests
```bash
# Create tests/unit/rbac.middleware.test.ts
# Test role checking
# Test permission checking
# Test unauthorized access
```

### Step 4: Run Coverage
```bash
npm run test:coverage
# Check which areas need more tests
# Add tests for low-coverage areas
```

### Step 5: Commit
```bash
git add tests/
git commit -m "test(auth): Fix MFA integration tests and reach 80% coverage

- Fixed recovery code validation in MFA flow
- Added RBAC middleware tests (was 0%, now >70%)
- Added additional model/controller tests
- Test coverage: 69.43% → 80%+
- All 150+ tests passing

Closes .subagents/issues/2025-11-04-mfa-integration-tests-failing.md"
```

---

## 🎯 Hints & Tips

### Debugging Recovery Code Issue
The test creates recovery codes like this:
```typescript
const recoveryCodes = verifyRes.body.recovery_codes; // ['ABC123', 'DEF456', ...]
const recoveryCode = recoveryCodes[0];

// Then tries to login with it
const loginWithRecoveryRes = await request(app)
  .post('/api/v1/auth/login')
  .send({
    email: testUser.email,
    password: testUser.password,
    mfa_code: recoveryCode,  // This is failing
  })
  .expect(200);
```

Check if:
1. Recovery code is being passed to `verifyRecoveryCode` correctly
2. Case sensitivity is handled (codes are uppercase, but validator is case-insensitive)
3. The recovery code is in the user's `mfa_recovery_codes` array

### Getting to 80% Coverage
Focus on:
1. RBAC middleware (0% → must test)
2. Auth controller MFA endpoints (55% → can improve)
3. Model methods not tested (some at 68%)

---

## 📞 Communication

### Questions?
Create a comment in this file or ask in project chat.

### When Done
1. Update this issue with ✅ Resolved status
2. Document what you fixed
3. Commit your changes
4. Push to branch
5. Notify master agent

---

## 🔗 Related Files

**Implementation:**
- `services/auth-service/src/services/auth.service.ts` - Login with MFA
- `services/auth-service/src/services/mfa.service.ts` - Recovery code verification
- `services/auth-service/src/middleware/rbac.middleware.ts` - Needs tests

**Tests:**
- `tests/integration/mfa-flow.test.ts` - Failing test (fix this)
- `tests/unit/` - Unit tests (all passing)
- `vitest.config.ts` - Coverage config (80% threshold set)

**Documentation:**
- `implementation/02-MODULE-Auth.md` - Auth module spec
- `.subagents/handovers/02-auth-module-handover.md` - Previous work

---

**Created:** 2025-11-04 19:15
**Target Resolution:** 2025-11-05
**Estimated Effort:** 2-4 hours

---

Good luck! You've got this! 🚀
