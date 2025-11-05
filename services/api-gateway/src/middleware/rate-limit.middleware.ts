/**
 * Rate Limiting middleware for API Gateway
 * Implements global, per-user, and per-endpoint rate limiting
 * Uses Redis for distributed rate limiting across multiple gateway instances
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { createClient } from 'redis';
import { Request } from 'express';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

// Create Redis client for rate limiting
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Connect to Redis
redisClient.on('error', (err: Error) => {
  logger.error('Redis rate limit client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis rate limit client connected');
});

let redisConnected = false;

// Initialize Redis connection
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

/**
 * Simple Redis-backed store implementation for express-rate-limit
 * Compatible with redis v4+
 */
class RedisRateLimitStore {
  prefix: string; // Must be public to match Store interface

  constructor(options: { prefix: string }) {
    this.prefix = options.prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    if (!redisConnected) {
      // Fallback to allowing request if Redis is down
      return { totalHits: 1, resetTime: undefined };
    }

    const redisKey = `${this.prefix}${key}`;
    const ttl = 900; // 15 minutes in seconds

    try {
      const result = await redisClient.multi()
        .incr(redisKey)
        .expire(redisKey, ttl)
        .exec();

      // Extract the incr result from the multi response
      const incrResult = result?.[0];
      const totalHits = typeof incrResult === 'number' ? incrResult : 1;
      const resetTime = new Date(Date.now() + ttl * 1000);

      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Redis increment error', { error: error instanceof Error ? error.message : String(error) });
      return { totalHits: 1, resetTime: undefined };
    }
  }

  async decrement(key: string): Promise<void> {
    if (!redisConnected) return;

    const redisKey = `${this.prefix}${key}`;
    try {
      await redisClient.decr(redisKey);
    } catch (error) {
      logger.error('Redis decrement error', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async resetKey(key: string): Promise<void> {
    if (!redisConnected) return;

    const redisKey = `${this.prefix}${key}`;
    try {
      await redisClient.del(redisKey);
    } catch (error) {
      logger.error('Redis reset error', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Key generator for authenticated users
 * Uses user ID instead of IP for more accurate rate limiting
 */
function authenticatedKeyGenerator(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user && authReq.user.id) {
    return `user:${authReq.user.id}`;
  }
  // Fallback to IP if not authenticated
  return req.ip || 'unknown';
}

/**
 * Key generator for IP-based rate limiting
 */
function ipKeyGenerator(req: Request): string {
  return req.ip || 'unknown';
}

/**
 * Custom handler for rate limit exceeded
 * Returns standardized error response
 */
function rateLimitHandler(req: Request, res: any): void {
  const authReq = req as AuthenticatedRequest;
  logger.warn('Rate limit exceeded', {
    requestId: authReq.id,
    ip: req.ip,
    path: req.path,
    userId: authReq.user?.id,
  });

  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      status: 429,
      timestamp: new Date().toISOString(),
      request_id: authReq.id,
    },
  });
}

/**
 * Global rate limiter - applies to all requests by IP
 * Prevents abuse from single IP addresses
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const globalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisRateLimitStore({ prefix: 'rl:global:' }),
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/health/detailed' || req.path === '/api/v1/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/password endpoints
 *
 * Limits: 5 requests per 15 minutes per IP
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore({ prefix: 'rl:auth:' }),
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Only count failed login attempts
});

/**
 * Per-user rate limiter for authenticated requests
 * Limits authenticated users to prevent API abuse
 *
 * Limits: 1000 requests per 15 minutes per user
 */
export const userRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each user to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore({ prefix: 'rl:user:' }),
  keyGenerator: authenticatedKeyGenerator,
  handler: rateLimitHandler,
});

/**
 * API endpoint rate limiter for general API calls
 * More generous than auth endpoints but still prevents abuse
 *
 * Limits: 60 requests per minute per IP
 */
export const apiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore({ prefix: 'rl:api:' }),
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
});

/**
 * Admin endpoint rate limiter
 * Stricter limits for administrative operations
 *
 * Limits: 20 requests per minute per user
 */
export const adminRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit admin operations to 20 per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore({ prefix: 'rl:admin:' }),
  keyGenerator: authenticatedKeyGenerator,
  handler: rateLimitHandler,
});

/**
 * Create custom rate limiter with specific options
 * Useful for endpoint-specific rate limiting
 *
 * @param options - Rate limit options
 * @returns RateLimitRequestHandler
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
  useUserId?: boolean;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisRateLimitStore({ prefix: `rl:${options.prefix}:` }),
    keyGenerator: options.useUserId ? authenticatedKeyGenerator : ipKeyGenerator,
    handler: rateLimitHandler,
  });
}

/**
 * Export Redis client for testing and health checks
 */
export { redisClient };
