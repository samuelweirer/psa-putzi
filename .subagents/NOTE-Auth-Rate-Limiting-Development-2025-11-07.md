# Operational Note: Auth Service Rate Limiting During Development

**Date:** 2025-11-07 08:50 UTC
**Reported By:** Junior-5 (Frontend Agent)
**Type:** 📋 Operational Note / Development Guide
**Status:** ✅ Working as Designed (Not a Bug)

---

## Situation

During manual testing, the auth service started returning **429 Too Many Requests** errors, preventing login.

```
POST http://10.255.20.15:3000/api/v1/auth/login 429 (Too Many Requests)
```

**This is NOT a bug** - it's a security feature working as intended to prevent brute-force attacks.

---

## Root Cause

**Rate Limiting Triggered:**
- Multiple failed login attempts from IP address `10.255.20.15` (and `::1`)
- Testing activities (curl commands + browser attempts) exceeded rate limit threshold
- Auth service stored rate limit state in Redis
- All subsequent requests from this IP blocked temporarily

**Rate Limit Configuration:**
- Default threshold: ~5-10 failed attempts within a time window
- Block duration: 15-60 minutes (depends on auth service configuration)
- Storage: Redis keys with pattern `rate_limit:<ip_address>`

---

## Impact

**During Development:**
- ⚠️ Frequent testing can trigger rate limits
- ⚠️ Blocks all login attempts from the same IP
- ⚠️ Can slow down manual testing workflows
- ⚠️ Shared development servers can affect multiple developers

**In Production:**
- ✅ Protects against brute-force attacks
- ✅ Prevents credential stuffing
- ✅ Enhances security posture
- ✅ Logs suspicious activity

---

## Solution: How to Clear Rate Limits

### Option 1: Wait for Expiration (Simplest)
Rate limits expire automatically after 15-60 minutes (based on configuration).

**When to use:**
- Not urgent
- Testing can continue with other features
- Production environment (don't interfere with security)

### Option 2: Clear Redis Keys (Development Only)

**⚠️ WARNING: Development environments only! Never do this in production!**

```bash
# Connect to Redis
redis-cli

# List all rate limit keys
KEYS rate_limit:*

# Output example:
# 1) "rate_limit:10.255.20.15"
# 2) "rate_limit:::1"
# 3) "rate_limit:127.0.0.1"

# Delete specific IP rate limit
DEL rate_limit:10.255.20.15

# Or delete all rate limits (development only!)
EVAL "local keys = redis.call('keys', 'rate_limit:*'); for i=1,#keys,5000 do redis.call('del', unpack(keys, i, math.min(i+4999, #keys))) end" 0

# Exit Redis
exit
```

**Verification:**
```bash
# Test login should now work
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test1234!"}'
```

### Option 3: Restart Auth Service (Nuclear Option)

```bash
# Restart auth service (clears all in-memory state)
pm2 restart auth-service

# Note: This may also clear other session data
```

### Option 4: Adjust Rate Limit Configuration (Long-term)

**For development environments only**, consider adjusting the rate limit thresholds:

**File:** `/opt/psa-platform/services/auth-service/.env` (or configuration)

```env
# Development: More lenient rate limits
RATE_LIMIT_MAX_ATTEMPTS=50
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_BLOCK_DURATION_MS=300000  # 5 minutes

# Production: Strict rate limits (default)
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=300000  # 5 minutes
RATE_LIMIT_BLOCK_DURATION_MS=3600000  # 60 minutes
```

**Important:** Use environment-specific configuration. Never weaken production rate limits!

---

## Prevention During Development

### Best Practices:

1. **Use Test Accounts:**
   - Create separate test accounts for each testing scenario
   - Don't repeatedly fail authentication with the same account

2. **Clear Failed Attempts:**
   - If you know credentials are wrong, fix them before retrying
   - Don't spam the login endpoint

3. **Use Direct Service Testing:**
   - For backend testing, use direct service endpoints (port 3001)
   - Bypass the gateway for API-level tests
   - Use proper test credentials

4. **Monitor Rate Limit Status:**
   ```bash
   # Check current rate limit status for an IP
   redis-cli GET "rate_limit:10.255.20.15"
   ```

5. **Use Different IPs:**
   - Test from `localhost` (127.0.0.1)
   - Test from network IP (10.255.20.15)
   - This distributes the rate limit across multiple IP addresses

---

## Detection: How to Know You're Rate Limited

### Browser Symptoms:
- Login page shows error: "Too many requests" or similar
- HTTP status code: **429 Too Many Requests**
- Network tab shows auth endpoint returning 429

### API Response:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again later.",
    "status": 429,
    "timestamp": "2025-11-07T08:45:00.000Z",
    "request_id": "abc-123",
    "retryAfter": 900  // seconds until unblocked
  }
}
```

### Redis Check:
```bash
# Check if IP is rate limited
redis-cli GET "rate_limit:10.255.20.15"

# If key exists, you're rate limited
# Output: "5" (failed attempts count) or similar
```

---

## Frontend Error Handling

**Fixed in commit 34612d0:**

The frontend now correctly displays rate limit errors as text messages instead of crashing React.

**Before Fix:**
```javascript
setError(err.response?.data?.error);  // ❌ Sets object, React crashes
```

**After Fix:**
```javascript
setError(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed');  // ✅ Extracts string
```

**User Experience:**
- ✅ Clear error message displayed
- ✅ No React crash
- ✅ Page remains functional
- ✅ User can wait and retry

---

## Recommended Configuration

### Development Environment:
```typescript
// auth-service/src/config/rate-limit.config.ts
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 50,                    // 50 requests per window
  message: 'Too many login attempts from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Only count failed attempts
};
```

### Production Environment:
```typescript
// auth-service/src/config/rate-limit.config.ts
export const rateLimitConfig = {
  windowMs: 5 * 60 * 1000,   // 5 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: redisStore,          // Use Redis for distributed rate limiting
};
```

---

## Testing Rate Limits

To verify rate limiting works correctly:

```bash
# Test script to trigger rate limit
for i in {1..10}; do
  echo "Attempt $i:"
  curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' | jq '.error.code'
  sleep 1
done

# Expected output:
# Attempt 1: "UNAUTHORIZED"
# Attempt 2: "UNAUTHORIZED"
# ...
# Attempt 6: "RATE_LIMIT_EXCEEDED" (after threshold)
```

---

## Related Issues

- **Frontend Fix:** Error message rendering fixed in commit 34612d0
- **CORS:** Resolved in commit 65fb7cb
- **Auth Service:** Running correctly (PM2 instance 13)

---

## Summary

**This is NOT a bug** - rate limiting is a critical security feature that:
- ✅ Protects against brute-force attacks
- ✅ Prevents credential stuffing
- ✅ Enhances overall security posture

**For development:**
- Clear rate limits from Redis when needed
- Consider more lenient dev environment configuration
- Use proper test accounts and credentials

**For production:**
- Keep strict rate limits enabled
- Monitor for suspicious activity
- Never disable rate limiting

---

## Additional Resources

- **Auth Service:** `/opt/psa-platform/services/auth-service/`
- **Redis CLI:** `redis-cli` (for inspecting/clearing rate limits)
- **PM2 Logs:** `pm2 logs auth-service` (to see rate limit events)
- **Rate Limit Config:** `/opt/psa-platform/services/auth-service/src/middleware/rate-limit.middleware.ts`

---

**Document Type:** Operational Guide
**Audience:** Development Team, QA Team
**Last Updated:** 2025-11-07 08:50 UTC
**Status:** Working as Designed
