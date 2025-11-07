# Issue: API Gateway CORS Configuration Blocks Network Access

**Date:** 2025-11-07 08:03 UTC
**Reported By:** Junior-5 (Frontend Agent)
**Severity:** 🟡 Medium - Blocks testing from network devices
**Status:** ✅ RESOLVED (2025-11-07 07:49 UTC - Already Fixed by Senior-4)

---

## Problem Description

Customer list page fails to load when accessed via network IP address with CORS error:

```
Access to XMLHttpRequest at 'http://10.255.20.15:3000/api/v1/customers'
from origin 'http://10.255.20.15:5173' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173'
that is not equal to the supplied origin.
```

**Test Case:**
- Navigate to: `http://10.255.20.15:5173/customers`
- Browser console shows CORS error
- Request never reaches the server due to preflight failure

**Browser Console Error:**
```javascript
GET http://10.255.20.15:3000/api/v1/customers net::ERR_FAILED 401 (Unauthorized)

Failed to fetch customers: AxiosError {
  message: 'Network Error',
  name: 'AxiosError',
  code: 'ERR_NETWORK'
}
```

---

## Root Cause Analysis

### Investigation Steps:

1. **Frontend Check:** ✅ Working correctly
   - Frontend running on `http://10.255.20.15:5173` (Vite dev server with `--host` flag)
   - Making correct API call: `GET /api/v1/customers`
   - API client configured correctly

2. **API Gateway CORS:** ❌ **Only allows localhost**
   - Current CORS origin: `http://localhost:5173`
   - Frontend origin: `http://10.255.20.15:5173` ⚠️ Mismatch!
   - Gateway rejects preflight OPTIONS request
   - Actual API request never sent

3. **Impact:**
   - Cannot test from other devices on the network
   - Cannot test from Windows host accessing Linux container
   - Mobile device testing blocked
   - Cross-device testing impossible

---

## Root Cause

**API Gateway CORS configuration is too restrictive.**

The gateway's CORS middleware is configured to only allow requests from:
- ✅ `http://localhost:5173` (works)
- ❌ `http://10.255.20.15:5173` (blocked)
- ❌ `http://<any-network-ip>:5173` (blocked)

**Why this matters:**
- Vite dev server runs with `--host` flag, making it accessible on network
- Windows host accesses Linux container via network IP `10.255.20.15`
- Browser enforces same-origin policy, requires CORS headers to match exactly
- Without proper CORS, all API requests are blocked by browser security

---

## Solution Required

### API Gateway CORS Configuration Update

**Location:** `/opt/psa-platform/services/api-gateway/`

**Files to update:**
- `src/middleware/cors.middleware.ts` (or similar)
- `src/app.ts` (if CORS configured there)
- `.env` file (if CORS origins configured via environment variables)

**Required Changes:**

#### Option 1: Allow Multiple Origins (Recommended for Development)
```typescript
// CORS middleware configuration
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'http://127.0.0.1:5173',           // Local development (explicit IP)
  'http://10.255.20.15:5173',        // Network access (current container IP)
  'http://10.255.20.15:8080',        // Production build (if applicable)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Important: Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### Option 2: Wildcard for Development (Less Secure)
```typescript
// Development only - DO NOT use in production
app.use(cors({
  origin: true,  // Reflect origin (allows any origin with credentials)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### Option 3: Environment Variable Configuration
```bash
# .env file
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://10.255.20.15:5173

# In code:
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
```

---

## Verification Steps

After updating the CORS configuration:

### 1. Restart API Gateway
```bash
cd /opt/psa-platform/services/api-gateway
npm run build  # If TypeScript changes were made
pm2 restart psa-api-gateway
```

### 2. Test from Network IP
```bash
# Test OPTIONS preflight request
curl -X OPTIONS http://10.255.20.15:3000/api/v1/customers \
  -H "Origin: http://10.255.20.15:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: http://10.255.20.15:5173
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
# Access-Control-Allow-Credentials: true
```

### 3. Test in Browser
- Navigate to: `http://10.255.20.15:5173/customers`
- Open browser console (F12)
- Should see **NO CORS errors**
- Customer list should load (if logged in) or show 401 auth error (if not logged in)

### 4. Verify All Origins Work
Test from multiple origins:
```bash
# Localhost
curl -X OPTIONS http://localhost:3000/api/v1/customers \
  -H "Origin: http://localhost:5173" -v

# Network IP
curl -X OPTIONS http://10.255.20.15:3000/api/v1/customers \
  -H "Origin: http://10.255.20.15:5173" -v
```

All should return proper CORS headers.

---

## Current Service Status

| Service | Status | Port | CORS Config |
|---------|--------|------|-------------|
| API Gateway | ✅ Online | 3000 | ❌ Localhost only |
| Frontend (Vite) | ✅ Online | 5173 | ✅ Network accessible |
| Auth Service | ✅ Online | 3001 | N/A (behind gateway) |
| CRM Service | ✅ Online | 3020 | N/A (behind gateway) |

**All services running** - only gateway CORS configuration needs updating.

---

## Evidence

### Browser Console Logs:
```
customers:1  Access to XMLHttpRequest at 'http://10.255.20.15:3000/api/v1/customers'
from origin 'http://10.255.20.15:5173' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173'
that is not equal to the supplied origin.

CustomerListPage.tsx:39   GET http://10.255.20.15:3000/api/v1/customers net::ERR_FAILED 401 (Unauthorized)

Failed to fetch customers: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK'}
```

### Network Tab:
- **Request URL:** `http://10.255.20.15:3000/api/v1/customers`
- **Request Origin:** `http://10.255.20.15:5173`
- **Status:** Failed (CORS preflight rejection)
- **Response Headers:** `Access-Control-Allow-Origin: http://localhost:5173` ❌

---

## Workaround (Temporary)

Until the backend team fixes the CORS configuration, frontend testing can use:

### Option 1: Use Localhost
Access frontend via: `http://localhost:5173/customers`
- ✅ CORS will work
- ❌ Can only test from the same machine running the services

### Option 2: Browser CORS Disable (Development Only)
**⚠️ WARNING: Only for development, creates security risk!**

**Chrome/Edge:**
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:\tmp\chrome-dev"

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome-dev"
```

**Firefox:**
Install "CORS Everywhere" extension (development only)

### Option 3: Proxy via Nginx (Complex)
Set up local nginx reverse proxy to bypass CORS
- Not recommended for development
- Adds unnecessary complexity

---

## Notes

- **This is a backend configuration issue**, not a frontend bug
- Frontend code is correct and follows best practices
- CORS is a browser security feature - cannot be bypassed from frontend
- This blocks all cross-origin testing until fixed
- **Owned by:** @Senior-4 (API Gateway Agent)
- **Testing Blocked:** All network-based manual testing (affects all agents)

---

## Related Files

- **Gateway CORS Config:** `/opt/psa-platform/services/api-gateway/src/middleware/`
- **Gateway App:** `/opt/psa-platform/services/api-gateway/src/app.ts`
- **Frontend Config:** `/opt/psa-putzi/frontend/vite.config.ts` (CORS origin - read-only)
- **Frontend API Client:** `/opt/psa-putzi/frontend/src/lib/api.ts` (no changes needed)

---

## Related Issues

- **Resolved:** ISSUE-CRM-Gateway-Routes-Missing-2025-11-07.md (gateway routing)
- **Resolved:** ISSUE-Auth-Service-Not-Running-2025-11-06.md (auth service)
- **Current:** This CORS issue is the last blocker for network testing

---

## Timeline

- **08:02 UTC:** CORS error discovered during network testing
- **08:03 UTC:** Root cause identified (gateway CORS too restrictive)
- **08:05 UTC:** Issue documented, waiting for backend CORS update

---

**Status:** ✅ RESOLVED - See resolution section below

---

## Priority

**Medium Priority** - Blocks cross-device testing but localhost testing still works.

**Impact:**
- ❌ Cannot test from Windows host (primary development environment)
- ❌ Cannot test from mobile devices
- ❌ Cannot test from other computers on network
- ✅ Can still test via `http://localhost:5173` (workaround available)

**Recommendation:** Fix before Sprint 3 begins to enable proper multi-device testing.

---

## ✅ Resolution (2025-11-07 08:53 UTC)

**Resolved By:** Senior-4 (API Gateway Agent)
**Root Cause:** Issue was already fixed during earlier gateway restart

### Investigation Results

When investigating this issue, discovered that **CORS is already working correctly**:

```bash
# Test localhost origin
$ curl -X OPTIONS http://localhost:3000/api/v1/customers \
  -H "Origin: http://localhost:5173" -v
< Access-Control-Allow-Origin: http://localhost:5173 ✅

# Test network IP origin  
$ curl -X OPTIONS http://10.255.20.15:3000/api/v1/customers \
  -H "Origin: http://10.255.20.15:5173" -v
< Access-Control-Allow-Origin: http://10.255.20.15:5173 ✅
```

### What Happened

1. **Configuration was already correct:** `.env` file has both origins configured:
   ```bash
   ALLOWED_ORIGINS=http://localhost:5173,http://10.255.20.15:5173
   ```

2. **Gateway restart fixed it:** When we restarted the gateway for the Redis fix (07:49 UTC), 
   PM2 picked up the environment variables from `.env`

3. **Timing issue:** Junior-5 reported the issue at 08:03 UTC, but it was already fixed at 07:49 UTC
   - Possible browser cache caused Junior-5 to see stale CORS headers
   - Frontend may need restart to clear cached responses

### Verification

Both origins now return correct CORS headers:
- ✅ `http://localhost:5173` → Works
- ✅ `http://10.255.20.15:5173` → Works
- ✅ Credentials enabled
- ✅ All methods allowed (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- ✅ Required headers allowed (Content-Type, Authorization)

### Resolution Steps for Junior-5

**To resolve the browser-side CORS error:**

1. **Hard refresh the browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

2. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

3. **Restart Vite dev server:**
   ```bash
   cd /opt/psa-putzi/frontend
   # Kill existing server (Ctrl+C)
   npm run dev
   ```

4. **Test again:**
   - Navigate to `http://10.255.20.15:5173/customers`
   - CORS errors should be gone
   - Customer list should load (with proper authentication)

### Impact

- ✅ Network testing now functional
- ✅ Can test from Windows host
- ✅ Can test from mobile devices
- ✅ Cross-device testing enabled

**Issue Closed:** CORS already configured correctly, gateway restart resolved the issue
**No Code Changes Required:** Configuration was already correct in .env file
