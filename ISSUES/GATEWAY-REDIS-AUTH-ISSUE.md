# API Gateway: Redis Authentication Failing on PM2 Startup

**Issue ID:** GATEWAY-REDIS-001
**Created:** 2025-11-06
**Reporter:** Senior-5 (Tickets Agent)
**Priority:** P2 (Medium - workaround exists)
**Status:** 🔴 OPEN
**Component:** API Gateway
**Affected Version:** 1.0.0

---

## Problem

API Gateway fails to start with PM2 due to Redis authentication error, even though the Redis password is configured in multiple places.

## Environment

- **Service:** API Gateway (psa-api-gateway)
- **Port:** 3000 (target)
- **PM2 Config:** `services/api-gateway/ecosystem.config.js`
- **Redis Password:** Configured in both `.env` and `ecosystem.config.js`
- **Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG`
- **Commit:** `10beee1` (gateway integration work)

## Error Message

```
2025-11-06 09:59:57 [error]: Failed to connect to Redis
{
  "service":"psa-api-gateway",
  "error":"NOAUTH Authentication required."
}
```

## Current Status

- ✅ Tickets service proxy routes configured in code
- ✅ Redis password set in `ecosystem.config.js` env variables
- ✅ Redis password set in `.env` file
- ✅ Redis import path fixed in `index.ts`
- ⚠️ Gateway crashes on startup (restart loop)

## Root Cause (Suspected)

The `redisClient` in `rate-limit.middleware.ts` connects immediately when the module loads (line 34-45), potentially **before** environment variables are fully loaded by PM2 or dotenv.

**Code Location:** `services/api-gateway/src/middleware/rate-limit.middleware.ts:14-45`

```typescript
// Redis client created at module load time (BEFORE env might be ready)
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD || undefined, // ⚠️ May be undefined at this point
});

// Auto-connects in IIFE (async immediately invoked)
(async () => {
  try {
    await redisClient.connect();
    redisConnected = true;
    logger.info('Redis connected for rate limiting');
  } catch (error) {
    logger.error('Failed to connect to Redis for rate limiting', {
      error: error instanceof Error ? error.message : String(error),
    });
    logger.warn('Rate limiting will use memory store (not distributed)');
  }
})();
```

## Files Involved

1. **`services/api-gateway/src/middleware/rate-limit.middleware.ts`**
   - Line 14-20: Redis client creation
   - Line 34-45: Auto-connection IIFE

2. **`services/api-gateway/src/index.ts`**
   - Line 8: Imports redisClient
   - Line 84: Redis ping check before server start

3. **`services/api-gateway/ecosystem.config.js`**
   - Line 33-42: Environment variables (REDIS_PASSWORD set)

4. **`services/api-gateway/.env`**
   - Line 9: `REDIS_PASSWORD=uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C`

## Attempted Fixes (All Failed)

1. ✅ Added Redis password to `.env` file → Still fails
2. ✅ Added Redis password to PM2 `ecosystem.config.js` env block → Still fails
3. ✅ Fixed Redis client import path in `index.ts` → Still fails
4. ✅ Changed `wait_ready: false` in PM2 config → Still fails (service starts but crashes)

## Impact

### Current Workaround
- ✅ **Tickets service accessible directly on port 3003**
- ✅ All 23 API endpoints working
- ✅ Swagger docs available at http://localhost:3003/api-docs/

### Blocked Features
- ⚠️ Gateway integration testing blocked
- ⚠️ Unified API endpoint (port 3000) not available
- ⚠️ Rate limiting via Redis not working
- ⚠️ Circuit breaker monitoring not available

### Priority Justification
**Medium Priority** because:
- Workaround exists (direct service access)
- Other services operational
- Not blocking critical path
- Needed for production but not MVP blocker

## Suggested Solutions

### Option A: Lazy Redis Connection (RECOMMENDED)
**Complexity:** ⭐⭐ Medium
**Risk:** Low

Move Redis connection from module load time to after dotenv is fully initialized:

```typescript
// rate-limit.middleware.ts
let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis() {
  if (redisClient) return redisClient;

  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  await redisClient.connect();
  return redisClient;
}
```

Then call `initializeRedis()` in `index.ts` **after** dotenv loads.

### Option B: PM2 Environment Variables Only
**Complexity:** ⭐ Easy
**Risk:** Low

Remove `.env` dependency entirely, rely only on PM2 env vars:
- Ensures env vars loaded before Node process starts
- More reliable for production deployments

### Option C: Optional Redis with Graceful Degradation
**Complexity:** ⭐⭐⭐ High
**Risk:** Medium

Make Redis optional with memory-based fallback:
- Allow gateway to start even if Redis unavailable
- Use memory store for rate limiting (not distributed)
- Log warning about degraded mode

### Option D: Debug Env Loading Order
**Complexity:** ⭐ Easy
**Risk:** Low

Add debug logging to understand load order:
```typescript
console.log('ENV VARS AT MODULE LOAD:', {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***SET***' : 'MISSING',
  REDIS_PORT: process.env.REDIS_PORT,
});
```

## Comparison with Working Services

### ✅ Auth Service (WORKS)
- **Port:** 3001
- **Redis:** Uses same Redis instance
- **Config:** Similar .env setup
- **Difference:** May load dotenv earlier in initialization

### 🔍 Investigation Needed
Compare auth service's Redis initialization with gateway's to identify difference.

## Testing Steps

Once fixed, verify with:

```bash
# 1. Start gateway
pm2 start /opt/psa-putzi/services/api-gateway/ecosystem.config.js

# 2. Verify no crashes (wait 10 seconds)
sleep 10 && pm2 list

# 3. Test health endpoint
curl http://localhost:3000/health

# 4. Test Redis rate limiting
for i in {1..10}; do curl -s http://localhost:3000/health | jq -r '.status'; done

# 5. Test tickets proxy
curl http://localhost:3000/api/v1/tickets

# 6. Verify circuit breaker status
curl http://localhost:3000/health/detailed
```

## Assignment

- **Suggested Agent:** Senior-4 (Gateway specialist) **OR** Senior-2 (knows Redis setup from auth)
- **Estimated Time:** 1-2 hours
- **Complexity:** ⭐⭐ Medium
- **Dependencies:** None (tickets service operational)

## Related Issues

- None

## Related Services

- ✅ Auth service (port 3001) - Uses same Redis, works fine
- ✅ Tickets service (port 3003) - Operational, ready for gateway integration
- ⚠️ Gateway (port 3000) - Not operational (this issue)

## Progress Notes

### 2025-11-06 10:10 UTC - Issue Created
- Documented Redis authentication failure
- Identified suspected root cause (module load timing)
- Proposed 4 solution options
- Created workaround documentation

---

**Next Action:** Assign to Senior-4 or Senior-2 for investigation and fix.
