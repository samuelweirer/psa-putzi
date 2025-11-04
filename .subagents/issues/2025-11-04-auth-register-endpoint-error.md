# Issue: Auth Register Endpoint Returns Internal Server Error

**Date Created:** 2025-11-04
**Issue ID:** 2025-11-04-auth-register-endpoint-error
**Reported By:** Junior-5 (Frontend Developer)
**Severity:** 🔴 Critical
**Type:** 🐛 Bug | ⚠️ Blocker
**Status:** 🆕 New

---

## 📋 Summary

**One-Line Description:**
POST /api/v1/auth/register endpoint returns "INTERNAL_SERVER_ERROR" for all registration attempts

**Affected Agents:**
- @Senior-2 (Auth Backend - **OWNER**)
- @Junior-5 (Frontend - **BLOCKED**)

**Affected Components:**
- `services/auth-service/` - Auth service backend
- `frontend/src/pages/auth/RegisterPage.tsx` - Registration UI (ready but can't test)

---

## 🎯 Problem Description

### What's Wrong?
The auth service register endpoint returns an internal server error when attempting to register new users. The error logs show: "Bad escaped character in JSON at position 45"

### Why Is This a Problem?
- Users cannot create accounts through the PUTZI registration UI
- Frontend registration page is complete but untestable
- Blocks all user onboarding and testing workflows

### Expected Behavior
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```
**Expected:** 201 Created with user data and tokens

### Actual Behavior
**Actual:** 500 Internal Server Error
```json
{"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}
```

---

## 📊 Impact Assessment

### Severity Justification
**🔴 Critical** - Blocks all frontend testing and user registration functionality. The registration UI is complete but cannot be verified or used.

### Who Is Blocked?
- @Junior-5: Cannot test registration flow, cannot proceed to MFA UI testing
- Future users: Cannot create accounts to use PUTZI

### Timeline Impact
- **Without fix:** Frontend registration page cannot be tested, Day 4-6 work at risk
- **With fix:** Can complete full auth flow testing (login, register, MFA)
- **Fix urgency:** ASAP (Today if possible)

---

## 🔍 Steps to Reproduce

### Prerequisites
```bash
# Auth service running on port 3001
cd /opt/psa-putzi/services/auth-service
npm run dev
```

### Reproduction Steps
1. Send POST request to register endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'
   ```
2. Or use frontend UI at: http://10.255.20.15:5173/auth/register
   - Fill in all fields
   - Click "Konto erstellen"

### Actual Result
```json
{"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}
```

### Expected Result
```json
{
  "id": "uuid",
  "email": "test@test.com",
  "firstName": "Test",
  "lastName": "User",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

## 🖼️ Screenshots / Logs

### Error Messages
From auth service logs (`/tmp/auth-service.log`):
```
2025-11-04 21:31:10 [psa-auth-service] error: Error handler caught error
{
  "error": "Bad escaped character in JSON at position 45",
  "stack": "SyntaxError: Bad escaped character in JSON at position 45
    at JSON.parse (<anonymous>)
    at parse (/opt/psa-putzi/services/auth-service/node_modules/body-parser/lib/types/json.js:92:19)
    at /opt/psa-putzi/services/auth-service/node_modules/body-parser/lib/read.js:128:18
    ...",
  "path": "/api/v1/auth/register",
  "method": "POST"
}
```

### Stack Trace
```
SyntaxError: Bad escaped character in JSON at position 45
    at JSON.parse (<anonymous>)
    at parse (/opt/psa-putzi/services/auth-service/node_modules/body-parser/lib/types/json.js:92:19)
    at /opt/psa-putzi/services/auth-service/node_modules/body-parser/lib/read.js:128:18
    at AsyncResource.runInAsyncScope (node:async_hooks:206:9)
    at invokeCallback (/opt/psa-putzi/services/auth-service/node_modules/raw-body/index.js:238:16)
    at done (/opt/psa-putzi/services/auth-service/node_modules/raw-body/index.js:227:7)
    at IncomingMessage.onEnd (/opt/psa-putzi/services/auth-service/node_modules/raw-body/index.js:287:7)
```

---

## 🔧 Technical Details

### Environment
```bash
Node Version: v20.19.5
npm Version: 10.8.2
OS: Linux 6.14.8-2-pve
Container: Container 200 (psa-all-in-one)
Auth Service Port: 3001
Database: PostgreSQL 15.14 (connected successfully)
```

### Affected Files
```
services/auth-service/src/controllers/auth.controller.ts (register endpoint)
services/auth-service/src/routes/auth.routes.ts
services/auth-service/node_modules/body-parser/ (JSON parsing)
```

### Service Status
- Auth service: ✅ Running (started at 21:00:11)
- Database: ✅ Connected
- Port 3001: ✅ Listening
- All other endpoints: ❓ Unknown (haven't tested)

---

## 💡 Proposed Solution

### Investigation Needed
@Senior-2 please investigate:

1. **Body Parser Configuration** - Check if body-parser is correctly configured for JSON
2. **Request Validation** - Check Joi validation schemas for register endpoint
3. **Character Encoding** - Check if special characters are causing issues
4. **Database Connection** - Verify users table is accessible
5. **Error Handling** - Check if error is being caught and logged properly

### Quick Test
Try these simple tests to narrow down the issue:

**Test 1: Minimal payload**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"Pass1234","firstName":"A","lastName":"B"}'
```

**Test 2: Check other auth endpoints**
```bash
# Does login endpoint work?
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## 🗣️ Discussion

### 2025-11-04 22:00 - @Junior-5 (Frontend)
Frontend registration page is complete and ready:
- ✅ UI built with all fields (firstName, lastName, email, password, confirmPassword)
- ✅ Password strength indicator working
- ✅ Form validation working
- ✅ Connected to POST /api/v1/auth/register
- ⚠️ Cannot test due to backend error

**Frontend is ready** - waiting on backend fix to test and verify.

**Follow-up questions for @Senior-2:**
- [ ] Are other auth endpoints working (login, logout, /me)?
- [ ] Is this a new issue or has register never worked?
- [ ] Do integration tests for register endpoint pass?

---

## 🎯 Action Items

### Immediate Actions
- [ ] @Senior-2: Investigate auth register endpoint error
  - **Deadline:** 2025-11-05 (ASAP)
  - **Status:** 🆕 Not Started
  - **Priority:** Critical blocker

- [ ] @Senior-2: Fix register endpoint and verify with tests
  - **Deadline:** 2025-11-05
  - **Status:** Pending investigation

- [ ] @Junior-5: Continue with Day 4 tasks (MFA UI) while waiting
  - **Status:** Can proceed (MFA UI doesn't need working register)
  - **Will test register endpoint once fixed**

### Follow-up Actions
- [ ] Test full registration flow (frontend → backend → database)
- [ ] Verify auto-login after registration works
- [ ] Add integration test for registration if missing

---

## 📝 Related Information

### Related Documentation
- `implementation/02-MODULE-Auth.md` - Auth module spec
- `.subagents/handovers/03-auth-to-frontend.md` - Auth API specs
- `services/auth-service/src/controllers/auth.controller.ts` - Register implementation

### Related Code (Frontend)
Frontend registration page is complete at:
- `frontend/src/pages/auth/RegisterPage.tsx` (270 lines)
- `frontend/src/contexts/AuthContext.tsx` (register function)
- `frontend/src/App.tsx` (route added)

---

## 📊 Dependencies

### Blocks
- Frontend registration testing
- Full auth flow E2E tests
- User onboarding workflows

### Frontend Workaround
While waiting for fix, @Junior-5 can:
- ✅ Continue building MFA UI (Day 4 tasks)
- ✅ Build password reset UI (Day 5 tasks)
- ✅ Build user profile UI (Day 5 tasks)
- ⚠️ Cannot test any of these with real accounts

---

## 📢 Notifications

### Agents Notified
- ✅ @Senior-2 (Auth Backend) - Via this issue - **ACTION REQUIRED**
- ✅ @Main-Agent (PM) - FYI - Critical blocker reported

---

## 🏷️ Labels

**Priority:** P0 (Critical Blocker)
**Category:** Backend
**Module:** Auth
**Phase:** MVP

---

## 📅 Timeline

**Created:** 2025-11-04 22:00 UTC
**Updated:** 2025-11-04 22:00 UTC
**Target Resolution:** 2025-11-05 (Tomorrow)
**Actual Resolution:** TBD

---

## 🔗 Quick Links

- **Module Spec:** `implementation/02-MODULE-Auth.md`
- **Auth Status:** `.subagents/status/auth-remaining-work.md`
- **Frontend Status:** `.subagents/status/frontend-agent-2025-11-04.md`
- **Handover:** `.subagents/handovers/03-auth-to-frontend.md`
- **Auth Service:** `services/auth-service/`
- **Frontend Register:** `frontend/src/pages/auth/RegisterPage.tsx`

---

**Last Updated:** 2025-11-04 22:00 UTC
**Last Updated By:** @Junior-5 (Frontend Developer)

---

## 📋 Checklist for Issue Creator

- [x] Title is clear and descriptive
- [x] Severity is justified (blocks frontend testing)
- [x] Steps to reproduce are clear
- [x] Expected vs actual behavior defined
- [x] Impact is explained
- [x] Proposed solution included (investigation steps)
- [x] Relevant agents @mentioned (@Senior-2)
- [x] Related files listed
- [x] Error logs included
