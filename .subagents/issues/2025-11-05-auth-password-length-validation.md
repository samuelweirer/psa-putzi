# Issue: Auth Service Rejects Valid 8-Character Passwords

**Date Created:** 2025-11-05
**Issue ID:** 2025-11-05-auth-password-length-validation
**Reported By:** Junior-5 (Frontend Developer)
**Severity:** 🟡 Medium
**Type:** 🐛 Bug
**Status:** 🔴 Open

---

## 📋 Summary

**One-Line Description:**
POST /api/v1/auth/register returns "INTERNAL_SERVER_ERROR" for valid 8-9 character passwords, but accepts 12+ character passwords

**Affected Agents:**
- @Senior-2 (Auth Backend - **OWNER**)
- @Junior-5 (Frontend - **REPORTER**)

**Affected Components:**
- `services/auth-service/src/validators/` - Password validation
- `services/auth-service/src/controllers/auth.controller.ts` - Register endpoint

---

## 🎯 Problem Description

### What's Wrong?
The auth service spec says minimum password length is 8 characters, but the backend returns an internal server error for valid 8-9 character passwords that meet all other requirements (uppercase, lowercase, number, special char).

### Why Is This a Problem?
- Users with strong 8-9 character passwords cannot register
- Spec says 8 characters minimum, but backend requires 12+
- Frontend had to workaround by increasing minimum to 12 chars
- Error is confusing (INTERNAL_SERVER_ERROR instead of validation error)

### Expected Behavior
```bash
curl -X POST http://10.255.20.15:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","first_name":"Test","last_name":"User"}'
```
**Expected:** 201 Created with user data
- Password "Test123!" has 8 characters
- Has uppercase (T), lowercase (est), number (123), special char (!)
- Meets all documented requirements

### Actual Behavior
**Actual:** 500 Internal Server Error
```json
{"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}
```

---

## 📊 Impact Assessment

### Severity Justification
**🟡 Medium** - Users can still register with longer passwords (12+ chars), but spec is incorrect and UX is degraded.

### Who Is Affected?
- Users with strong 8-9 character passwords
- Frontend validation had to be changed to 12 chars (workaround)

### Timeline Impact
- **Without fix:** Frontend must enforce 12 char minimum (not spec-compliant)
- **With fix:** Can use documented 8 char minimum
- **Fix urgency:** Normal - workaround exists

---

## 🔍 Steps to Reproduce

### Prerequisites
```bash
# Auth service running on port 3001
# Confirmed working with 12+ char passwords
```

### Test Cases

**Test 1: 8 characters (meets all requirements) - FAILS**
```bash
curl -X POST http://10.255.20.15:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test8@example.com","password":"Test123!","first_name":"Test","last_name":"User"}'
```
Result: `{"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}`

**Test 2: 9 characters (meets all requirements) - FAILS**
```bash
curl -X POST http://10.255.20.15:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test9@example.com","password":"Test1234!","first_name":"Test","last_name":"User"}'
```
Result: `{"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}`

**Test 3: 16 characters (meets all requirements) - WORKS**
```bash
curl -X POST http://10.255.20.15:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test16@example.com","password":"TestPassword@123","first_name":"Test","last_name":"User"}'
```
Result: `201 Created` ✅

---

## 🖼️ Screenshots / Logs

### Error Response
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

### Expected According to Spec
From `.subagents/handovers/03-auth-to-frontend.md`:
```
**Validation:**
- Email must be valid format
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- First/last name: 1-100 characters
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
services/auth-service/src/validators/auth.validator.ts (likely)
services/auth-service/src/utils/password.ts (password hashing?)
services/auth-service/src/controllers/auth.controller.ts (register endpoint)
```

### Password Requirements (From Spec)
- Minimum: 8 characters
- Maximum: Not specified (should be reasonable, like 128)
- Must contain:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

---

## 💡 Proposed Solution

### Investigation Needed
@Senior-2 please investigate:

1. **Password Validation Logic**
   - Check Joi schema for register endpoint
   - Verify minimum length is set to 8 (not 12)

2. **Password Hashing**
   - Check if bcrypt/argon2 has issues with shorter passwords
   - Verify salt rounds configuration

3. **Database Constraints**
   - Check if password column has minimum length constraint
   - Verify hashed password storage

4. **Error Handling**
   - Should return 400 Bad Request with validation error
   - Not 500 Internal Server Error

### Possible Root Causes
- Joi validation schema has wrong minimum (12 instead of 8)
- Password hashing function has undocumented minimum length
- Database column constraint is too strict
- Error is thrown during hashing but caught as generic error

### Recommended Fix
1. Update validation to accept 8+ character passwords
2. If there's a technical reason for 12 char minimum:
   - Update spec documentation
   - Return proper 400 validation error (not 500)
   - Explain why in error message

---

## 🗣️ Discussion

### 2025-11-05 08:30 - @Junior-5 (Frontend) - Issue Reported

**Discovery:**
While testing registration flow, user tried passwords "Test123!" (8 chars) and "Test1234!" (9 chars) which meet all documented requirements but got INTERNAL_SERVER_ERROR.

**Frontend Workaround:**
- Temporarily increased minimum password length to 12 characters
- Added real-time requirements checklist to UI
- This is not spec-compliant but allows users to register

**Request:**
Please fix backend to accept 8+ character passwords as documented, or update the spec if 12 is truly the minimum.

---

## 🎯 Action Items

### For Backend Team (@Senior-2)
- [ ] Investigate why 8-9 character passwords cause internal error
- [ ] Check password validation schema (Joi)
- [ ] Check password hashing function
- [ ] Check database constraints
- [ ] Fix to accept 8+ char passwords OR update spec to 12+ chars
- [ ] Change error from 500 to 400 if it's validation issue
- [ ] Add unit tests for various password lengths (8, 9, 10, 12, 16)

### For Frontend Team (@Junior-5)
- [ ] Once backend fixed, revert minimum from 12 back to 8 characters
- [ ] Update requirements checklist in UI

---

## 📝 Related Information

### Related Documentation
- `implementation/02-MODULE-Auth.md` - Auth module spec (says 8 chars)
- `.subagents/handovers/03-auth-to-frontend.md` - Auth API specs (says 8 chars)
- `.subagents/issues/2025-11-04-auth-register-endpoint-error.md` - Previous register issue (resolved)

### Related Code (Frontend)
- `frontend/src/pages/auth/RegisterPage.tsx` - Has workaround (12 char minimum)
- `frontend/src/contexts/AuthContext.tsx` - Register function

### Related Code (Backend)
- `services/auth-service/src/validators/auth.validator.ts` - Likely location of issue
- `services/auth-service/src/controllers/auth.controller.ts` - Register endpoint

---

## 📊 Dependencies

### Blocks
- Frontend cannot use spec-compliant 8 character minimum
- Users with strong 8-9 character passwords cannot register

### Workaround
- Frontend enforces 12 character minimum (not ideal but functional)

---

## 📢 Notifications

### Agents Notified
- ✅ @Senior-2 (Auth Backend) - Via this issue - **ACTION REQUIRED**
- ✅ @Main-Agent (PM) - FYI - Medium priority issue

---

## 🏷️ Labels

**Priority:** P2 (Medium - has workaround)
**Category:** Backend
**Module:** Auth
**Phase:** MVP

---

## 📅 Timeline

**Created:** 2025-11-05 08:30 UTC
**Target Resolution:** 2025-11-06
**Actual Resolution:** (Pending)

---

## 🔗 Quick Links

- **Module Spec:** `implementation/02-MODULE-Auth.md`
- **Auth Status:** `.subagents/status/auth-remaining-work.md`
- **Frontend Status:** `.subagents/status/frontend-agent-2025-11-04.md`
- **Handover:** `.subagents/handovers/03-auth-to-frontend.md`
- **Auth Service:** `services/auth-service/`
- **Frontend Register:** `frontend/src/pages/auth/RegisterPage.tsx`

---

**Last Updated:** 2025-11-05 08:30 UTC
**Last Updated By:** @Junior-5 (Frontend Developer)
**Resolution:** 🔴 Open - Awaiting backend investigation

---

## 📋 Checklist for Issue Creator

- [x] Title is clear and descriptive
- [x] Severity is justified (medium - has workaround)
- [x] Steps to reproduce are clear
- [x] Expected vs actual behavior defined
- [x] Impact is explained
- [x] Proposed solution included (investigation steps)
- [x] Relevant agents @mentioned (@Senior-2)
- [x] Related files listed
- [x] Test cases included (8, 9, 16 character passwords)
