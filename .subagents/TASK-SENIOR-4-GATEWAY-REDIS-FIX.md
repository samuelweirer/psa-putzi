# Task Assignment: Fix API Gateway Redis Authentication

**Task ID:** GATEWAY-REDIS-FIX-001
**Assigned To:** Senior-4 (API Gateway Agent)
**Created:** 2025-11-06
**Priority:** P2 (Medium)
**Estimated Time:** 1-2 hours
**Status:** ⚪ Pending

---

## 📋 Task Overview

**Objective:** Fix the API Gateway Redis authentication failure that's preventing the gateway from starting on PM2.

**Issue Reference:** `ISSUES/GATEWAY-REDIS-AUTH-ISSUE.md`

**Problem Summary:**
Gateway crashes on PM2 startup with "NOAUTH Authentication required" error because Redis client connects before environment variables are fully loaded.

---

## 🎯 What Needs to Be Done

### Primary Task: Implement Lazy Redis Connection (Option A)

**Current Problem:**
```typescript
// rate-limit.middleware.ts - BAD (connects at module load)
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD || undefined, // ⚠️ May be undefined!
});

// Auto-connects immediately
(async () => {
  await redisClient.connect(); // FAILS - env not loaded yet
})();
```

**Solution:**
```typescript
// rate-limit.middleware.ts - GOOD (lazy connection)
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
  logger.info('Redis connected for rate limiting');
  return redisClient;
}
```

Then call `initializeRedis()` in `index.ts` **AFTER** `dotenv.config()`.

---

## 📝 Step-by-Step Instructions

### Step 1: Read Issue Document
- [ ] Read `ISSUES/GATEWAY-REDIS-AUTH-ISSUE.md` completely
- [ ] Understand root cause (module load timing)
- [ ] Review proposed solutions

### Step 2: Implement Lazy Redis Connection
- [ ] Modify `services/api-gateway/src/middleware/rate-limit.middleware.ts`
  - [ ] Remove IIFE that auto-connects Redis
  - [ ] Create `initializeRedis()` function
  - [ ] Export function for use in index.ts
  - [ ] Update rate limiting middleware to handle null client gracefully

- [ ] Modify `services/api-gateway/src/index.ts`
  - [ ] Call `initializeRedis()` after `dotenv.config()`
  - [ ] Add error handling if Redis fails
  - [ ] Log success/failure appropriately

### Step 3: Test Locally
- [ ] Build TypeScript: `npm run build`
- [ ] Start gateway: `npm start` (not PM2 yet)
- [ ] Verify Redis connects successfully
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Test rate limiting works: Make 10+ rapid requests

### Step 4: Deploy to PM2
- [ ] Stop existing gateway: `pm2 stop psa-api-gateway` (if running)
- [ ] Delete old instance: `pm2 delete psa-api-gateway` (if exists)
- [ ] Start with PM2: `npm run pm2:start`
- [ ] Wait 10 seconds, check status: `pm2 list`
- [ ] Verify no crashes: `pm2 logs psa-api-gateway --lines 50`

### Step 5: Integration Testing
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Test detailed health: `curl http://localhost:3000/health/detailed`
- [ ] Test tickets proxy: `curl http://localhost:3000/api/v1/tickets`
- [ ] Test CRM proxy: `curl http://localhost:3000/api/v1/customers`
- [ ] Test rate limiting (10+ rapid requests)
- [ ] Verify circuit breaker status in health check

### Step 6: Documentation & Cleanup
- [ ] Update issue status in `ISSUES/GATEWAY-REDIS-AUTH-ISSUE.md`
  - [ ] Add resolution notes
  - [ ] Change status to ✅ RESOLVED
  - [ ] Add timestamp and your name
- [ ] Commit changes with descriptive message
- [ ] Push to GitHub

---

## 🔧 Files to Modify

### 1. `services/api-gateway/src/middleware/rate-limit.middleware.ts`
**Lines to change:** 14-45 (Redis client creation and auto-connection)

**Before:**
```typescript
const redisClient = createClient({...});
(async () => { await redisClient.connect(); })();
```

**After:**
```typescript
let redisClient: ReturnType<typeof createClient> | null = null;
export async function initializeRedis() { ... }
```

### 2. `services/api-gateway/src/index.ts`
**Add after dotenv.config():**
```typescript
import { initializeRedis } from './middleware/rate-limit.middleware';

// ... dotenv.config() ...

async function startServer() {
  try {
    // Initialize Redis before starting server
    await initializeRedis();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Redis initialization failed', { error });
    logger.warn('Gateway will run without distributed rate limiting');
  }

  // ... rest of server startup ...
}
```

---

## ✅ Success Criteria

**Gateway must:**
- ✅ Start successfully with PM2 (no crashes)
- ✅ Connect to Redis with authentication
- ✅ Respond to health checks on port 3000
- ✅ Proxy requests to tickets service (port 3003)
- ✅ Proxy requests to CRM service (port 3002)
- ✅ Proxy requests to auth service (port 3001)
- ✅ Rate limiting functional
- ✅ Circuit breaker monitoring working
- ✅ Stay online for 10+ minutes without crashes

**Documentation must:**
- ✅ Issue marked as RESOLVED
- ✅ Changes committed with clear message
- ✅ All changes pushed to GitHub

---

## 🔍 Reference Information

### Current Working Services:
- ✅ Auth service (port 3001) - Uses Redis successfully
- ✅ CRM service (port 3002) - Running on PM2 cluster
- ✅ Tickets service (port 3003) - Running on PM2, deployed today

### Why Auth Service Works:
Auth service likely loads dotenv earlier or initializes Redis differently. Compare:
- `services/auth-service/src/index.ts` - How they load Redis
- `services/auth-service/src/middleware/rate-limit.middleware.ts` - Their Redis setup

### Redis Configuration:
- **Host:** localhost (or from .env)
- **Port:** 6379
- **Password:** `uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C` (in .env and ecosystem.config.js)
- **Database:** 0 (default)

---

## ⏱️ Time Estimate Breakdown

- **Reading & understanding:** 15 minutes
- **Code changes:** 30 minutes
- **Local testing:** 15 minutes
- **PM2 deployment:** 15 minutes
- **Integration testing:** 15 minutes
- **Documentation:** 10 minutes
- **Buffer:** 10 minutes

**Total:** ~1.5-2 hours

---

## 🆘 If You Get Stuck

### Issue: Redis still fails to connect
**Try:**
1. Add debug logging: `console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? 'SET' : 'MISSING');`
2. Check Redis is running: `redis-cli ping` (should return PONG)
3. Test auth manually: `redis-cli -a uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C ping`

### Issue: Gateway crashes with different error
**Try:**
1. Check PM2 logs: `pm2 logs psa-api-gateway --lines 100`
2. Check if port 3000 is in use: `lsof -i :3000`
3. Test without PM2 first: `npm start`

### Issue: Rate limiting not working
**Try:**
1. Check if Redis client is actually connected
2. Add logging in rate limiting middleware
3. Fall back to memory store if Redis unavailable

### Ask for Help:
- @Senior-2 - Redis expert (set up Auth service Redis)
- @Main-Agent - Architecture questions
- Review Auth service code for working example

---

## 📚 Related Documentation

- **Issue:** `ISSUES/GATEWAY-REDIS-AUTH-ISSUE.md` (comprehensive analysis)
- **Gateway README:** `services/api-gateway/README.md`
- **Implementation Guide:** `implementation/03-MODULE-API-Gateway.md`
- **Auth service example:** `services/auth-service/` (working Redis setup)

---

## 🎯 Deliverables

When complete, you should have:

1. ✅ Gateway running on PM2 (port 3000)
2. ✅ Redis connection working
3. ✅ All proxy routes functional
4. ✅ Rate limiting operational
5. ✅ Circuit breaker monitoring working
6. ✅ Issue marked RESOLVED
7. ✅ Code committed and pushed
8. ✅ Gateway stable for 10+ minutes

---

**Ready to start? Read the issue document first, then implement the lazy Redis connection!**

**Estimated completion:** 1-2 hours
**Priority:** P2 (Medium - not blocking but valuable)
**Status:** Waiting for Senior-4 to begin

---

**Created by:** Main Agent (PM)
**Date:** 2025-11-06 10:15 UTC
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG`
