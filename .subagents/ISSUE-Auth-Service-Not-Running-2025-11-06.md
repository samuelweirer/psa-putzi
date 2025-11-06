# Issue: Auth Service Not Running - Registration Fails

**Date:** 2025-11-06 11:05 UTC
**Reported By:** Junior-5 (Frontend Agent)
**Severity:** 🔴 High - Blocks all authentication flows
**Status:** Awaiting Backend Team Action

---

## Problem Description

User registration fails with generic error message:
```
Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.
```

**Test Case:**
- **Email:** testuser06112025@example.com
- **Password:** Test1234! (meets all requirements)
- **Result:** Registration request fails

---

## Root Cause Analysis

### Investigation Steps:

1. **Frontend Check:** ✅ Registration form working correctly
   - Password validation: All requirements met (green indicators)
   - Form submission: Sends POST to `/api/v1/auth/register`
   - Error handling: Properly displays backend error messages

2. **API Gateway Check:** ✅ Running and reachable
   - Status: `online` (PM2 instances 11, 12)
   - Port: 3000
   - Response: Returns proper error with status 502

3. **Auth Service Check:** ❌ **NOT RUNNING**
   - PM2 Status: No auth service instances found
   - Directory: `/opt/psa-platform/services/auth-service` exists
   - Expected Port: 3001

### Gateway Error Response:
```json
{
  "error": {
    "code": "BAD_GATEWAY",
    "message": "Service auth-service is unavailable",
    "status": 502,
    "timestamp": "2025-11-06T11:05:21.805Z",
    "request_id": "c3cffab2-6a4f-4fd0-aad3-2705cc577f4b"
  }
}
```

---

## Current Service Status

| Service | Status | Port | PM2 Instance |
|---------|--------|------|--------------|
| API Gateway | ✅ Online | 3000 | 11, 12 |
| CRM Service | ✅ Online | 3002 | 0, 1 |
| Auth Service | ❌ **Not Running** | 3001 | None |

---

## Impact

**Affected Functionality:**
- ❌ User Registration
- ❌ User Login
- ❌ Password Reset
- ❌ MFA Setup/Verification
- ❌ All authenticated API calls

**Downstream Impact:**
- Frontend authentication flows completely broken
- Cannot test any authenticated features
- Manual testing blocked (84 test cases require working auth)

---

## Solution

### Required Action:
Start the auth service on port 3001 using PM2.

**Commands to Execute:**
```bash
cd /opt/psa-platform/services/auth-service

# Check if ecosystem.config.js exists
ls -la ecosystem.config.js

# Start the service with PM2
pm2 start ecosystem.config.js

# Verify it's running
pm2 list | grep auth
curl http://localhost:3001/api/v1/health
curl http://localhost:3000/api/v1/auth/health
```

### Expected Result:
```bash
# PM2 should show:
psa-auth-service | online | port 3001

# Health check should return:
{"status":"ok","timestamp":"..."}
```

---

## Verification Steps

After starting the auth service:

1. **Health Check:**
   ```bash
   curl http://localhost:3000/api/v1/auth/health
   ```
   Expected: `{"status":"ok",...}`

2. **Registration Test:**
   - Navigate to: http://10.255.20.15:5173/register
   - Email: testuser06112025@example.com
   - Password: Test1234!
   - Expected: Successful registration → Auto-login → Redirect to dashboard

3. **Login Test:**
   - Use the newly created account to login
   - Expected: Successful login with JWT tokens stored

---

## Notes

- Auth service was developed by @Senior-2 in Sprint 2
- Service directory exists but is not running in PM2
- No code changes needed on frontend - issue is purely backend availability
- This is a deployment/operations issue, not a development bug

---

## Related Documentation

- **Auth Implementation:** `/opt/psa-putzi/implementation/02-MODULE-Auth.md`
- **Auth Service Code:** `/opt/psa-platform/services/auth-service/`
- **Frontend Auth Pages:** `/opt/psa-putzi/frontend/src/pages/auth/`

---

## Timeline

- **11:05 UTC:** Issue discovered during manual testing
- **11:06 UTC:** Root cause identified (auth service not running)
- **11:07 UTC:** Issue documented, waiting for service startup

---

**Status:** 🟡 Waiting for auth service to be started by backend team or PM.
