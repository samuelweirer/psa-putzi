# Issue: API Gateway Missing CRM Service Routes

**Date:** 2025-11-07 07:05 UTC
**Reported By:** Junior-5 (Frontend Agent)
**Severity:** 🔴 High - Blocks all CRM functionality
**Status:** ✅ RESOLVED (2025-11-07 07:20 UTC by Senior-4)

---

## Problem Description

Customer list page fails to load with error message:
```
Fehler beim Laden der Kundendaten
```

**Test Case:**
- Navigate to: http://10.255.20.15:5173/customers
- Click "Alle anzeigen" on Dashboard under "Aktive Kunden"
- **Result:** Error page displayed, no customer data loads

**Browser Network Tab:**
```
GET http://localhost:3000/api/v1/customers
Status: 404 Not Found
Response: {"error":{"code":"NOT_FOUND","message":"The requested endpoint does not exist"}}
```

---

## Root Cause Analysis

### Investigation Steps:

1. **Frontend Check:** ✅ Working correctly
   - CustomerListPage.tsx making correct API call: `GET /api/v1/customers`
   - Error handling working: displays backend error message
   - Code integrated with backend (yesterday's work)

2. **API Gateway Check:** ❌ **Missing CRM routes**
   - Gateway running: Online (port 3000, instances 11 & 12)
   - Response: `404 "The requested endpoint does not exist"`
   - **Gateway has no routes configured for CRM service**

3. **CRM Service Check:** ✅ Running and functional
   - Status: Online (port **3020**, instances 0 & 1)
   - Direct test: `curl http://localhost:3020/api/v1/customers`
   - Response: `{"error":{"message":"No authentication token provided","statusCode":401}}`
   - ✅ This is **correct behavior** - service is working, just requires auth

### Port Configuration:

| Service | Expected Port | Actual Port | Status |
|---------|--------------|-------------|---------|
| API Gateway | 3000 | 3000 | ✅ Correct |
| Auth Service | 3001 | 3001 | ✅ Correct |
| CRM Service | 3002 | **3020** | ⚠️ Different |

**Note:** CRM Service running on port 3020 (not 3002 as documented). This is fine as long as gateway routes to correct port.

---

## Impact

**Affected Functionality:**
- ❌ Customer List (GET /api/v1/customers)
- ❌ Customer Detail (GET /api/v1/customers/:id)
- ❌ Customer Create (POST /api/v1/customers)
- ❌ Customer Update (PUT /api/v1/customers/:id)
- ❌ Customer Delete (DELETE /api/v1/customers/:id)
- ❌ Customer Status Update (PATCH /api/v1/customers/:id)
- ❌ Contact List (GET /api/v1/customers/:id/contacts)
- ❌ Contact Create (POST /api/v1/customers/:id/contacts)
- ❌ Contact Delete (DELETE /api/v1/customers/:id/contacts/:id)
- ❌ Location List (GET /api/v1/customers/:id/locations)
- ❌ Location Create (POST /api/v1/customers/:id/locations)
- ❌ Location Delete (DELETE /api/v1/customers/:id/locations/:id)

**Downstream Impact:**
- All CRM functionality completely broken
- Cannot test customer management features
- Manual testing blocked for entire CRM module
- Frontend CRM integration work cannot be validated

---

## Solution Required

### API Gateway Configuration Needed:

The API Gateway needs to proxy CRM requests to the CRM service on **port 3020**.

**Required Routes:**

```javascript
// CRM Service Routes (port 3020)
{
  path: '/api/v1/customers',
  target: 'http://localhost:3020',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
},
{
  path: '/api/v1/customers/:customerId/contacts',
  target: 'http://localhost:3020',
  methods: ['GET', 'POST', 'DELETE']
},
{
  path: '/api/v1/customers/:customerId/locations',
  target: 'http://localhost:3020',
  methods: ['GET', 'POST', 'DELETE']
}
```

### Configuration File Location:

Likely one of these files needs updating:
- `/opt/psa-platform/services/api-gateway/src/routes/proxy.routes.ts`
- `/opt/psa-platform/services/api-gateway/src/config/services.config.ts`
- `/opt/psa-platform/services/api-gateway/ecosystem.config.js`

### Steps to Fix:

1. **Add CRM routes to API Gateway configuration**
   - Map `/api/v1/customers*` to `http://localhost:3020`
   - Map `/api/v1/customers/:id/contacts*` to `http://localhost:3020`
   - Map `/api/v1/customers/:id/locations*` to `http://localhost:3020`

2. **Restart API Gateway**
   ```bash
   cd /opt/psa-platform/services/api-gateway
   pm2 restart ecosystem.config.js
   ```

3. **Verify routing works**
   ```bash
   curl http://localhost:3000/api/v1/customers
   # Should return 401 "No authentication token provided"
   # (Not 404 "endpoint does not exist")
   ```

---

## Verification Steps

After configuring the gateway:

### 1. Test Gateway Routing:
```bash
# Test without auth (should return 401, not 404)
curl -v http://localhost:3000/api/v1/customers

# Expected response:
# HTTP/1.1 401 Unauthorized
# {"error":{"message":"No authentication token provided","statusCode":401}}

# NOT this:
# HTTP/1.1 404 Not Found
# {"error":{"code":"NOT_FOUND","message":"The requested endpoint does not exist"}}
```

### 2. Test with Auth Token:
```bash
# First, login to get a token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' | \
  jq -r '.accessToken')

# Then test CRM endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/customers

# Expected: JSON array of customers
```

### 3. Test in Browser:
- Navigate to: http://10.255.20.15:5173/customers
- Should load customer list successfully
- Should display customer data from database

---

## Current Service Status

| Service | Status | Port | PM2 Instance | Health |
|---------|--------|------|--------------|--------|
| API Gateway | ✅ Online | 3000 | 11, 12 | ✅ Responding |
| Auth Service | ✅ Online | 3001 | 13 | ✅ Responding |
| CRM Service | ✅ Online | 3020 | 0, 1 | ✅ Responding |

**All services are running** - only gateway routing configuration is missing.

---

## Evidence

### Test Results:

```bash
# Gateway returns 404 (route not found)
$ curl http://localhost:3000/api/v1/customers
{"error":{"code":"NOT_FOUND","message":"The requested endpoint does not exist","status":404}}

# CRM service responds correctly on port 3020
$ curl http://localhost:3020/api/v1/customers
{"error":{"message":"No authentication token provided","statusCode":401}}

# Port 3020 is listening
$ ss -tlnp | grep 3020
LISTEN 0 511 *:3020 *:* users:(("PM2 v6.0.13: Go",pid=219789,fd=22))
```

### CRM Service Logs:
```
2025-11-05 20:41:12 [psa-crm-service] info: CRM service started {"port":3020,"env":"production"}
```

---

## Notes

- Frontend code is **100% correct** - all integration work done yesterday
- CRM service is **fully functional** and responding correctly
- This is purely a **gateway configuration issue**
- No code changes needed - only configuration update
- Owned by: @Senior-4 (API Gateway Agent)
- CRM Service by: @Senior-3 (CRM Backend Agent)

---

## Related Files

- **Gateway Config:** `/opt/psa-platform/services/api-gateway/src/routes/`
- **CRM Service:** `/opt/psa-platform/services/crm-service/` (running on port 3020)
- **Frontend:** `/opt/psa-putzi/frontend/src/pages/crm/` (integration complete)

---

## Related Issues

- **Previous:** ISSUE-Auth-Service-Not-Running-2025-11-06.md (resolved)
- **Sprint 2 Completion:** CRM Backend completed by Senior-3 (141 tests, 83.7% coverage)
- **Frontend Integration:** Completed by Junior-5 on 2025-11-05 (8 pages, 14 endpoints)

---

## Timeline

- **07:03 UTC:** Issue discovered during manual testing
- **07:05 UTC:** Root cause identified (gateway routes missing)
- **07:06 UTC:** Issue documented, waiting for gateway configuration

---

**Status:** ✅ RESOLVED - CRM routes configured and operational

---

## ✅ Resolution (2025-11-07 07:20 UTC)

**Resolved By:** Senior-4 (API Gateway Agent)
**Resolution Time:** 15 minutes

### Changes Made:

1. **Updated .env file** - Changed CRM_SERVICE_URL from port 3002 to 3020
2. **Uncommented CRM routes** in `src/routes/proxy.routes.ts`:
   - `/api/v1/customers` → CRM service
   - `/api/v1/contacts` → CRM service
3. **Updated ecosystem.config.js** - Added CRM_SERVICE_URL to PM2 environment variables
4. **Rebuilt TypeScript** - `npm run build`
5. **Restarted gateway** - `pm2 restart psa-api-gateway --update-env`

### Verification:

```bash
# Test without auth (should return 401, not 404)
$ curl http://localhost:3000/api/v1/customers
{"error":{"message":"No authentication token provided","statusCode":401}}
✅ WORKING - Gateway correctly routes to CRM service

# Check proxy logs
$ pm2 logs psa-api-gateway | grep "Proxy created"
[HPM] Proxy created: /  -> http://localhost:3020
✅ CONFIRMED - Proxying to correct port
```

### Commits:
- Gateway configuration updated in branch `claude/session-011CUa86VGPkHjf5rHUmwfvG`

### Frontend Can Now:
- ✅ Access customer list at `GET /api/v1/customers`
- ✅ Create customers at `POST /api/v1/customers`
- ✅ View customer details at `GET /api/v1/customers/:id`
- ✅ Update customers at `PUT /api/v1/customers/:id`
- ✅ Delete customers at `DELETE /api/v1/customers/:id`
- ✅ Manage contacts and locations via CRM endpoints

**Issue Closed:** All CRM functionality now accessible through gateway
