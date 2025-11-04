/**
 * Rate limiting middleware using Redis
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import config from '../utils/config';
import logger from '../utils/logger';
import { TooManyRequestsError } from '../utils/errors';

let redis: Redis | null = null;

/**
 * Get Redis client
 */
function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err });
    });
  }

  return redis;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    keyGenerator = (req: Request) => {
      // Default: use IP address
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `rate-limit:${keyGenerator(req)}`;
      const redisClient = getRedisClient();

      // Connect if not connected
      if (redisClient.status !== 'ready') {
        await redisClient.connect();
      }

      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        const ttl = await redisClient.ttl(key);
        const resetTime = new Date(Date.now() + ttl * 1000);

        res.set('X-RateLimit-Limit', maxRequests.toString());
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', resetTime.toISOString());

        throw new TooManyRequestsError(
          `Too many requests. Try again in ${ttl} seconds`,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // Increment counter
      await redisClient.incr(key);

      // Set expiry if this is the first request
      if (count === 0) {
        await redisClient.pexpire(key, windowMs);
      }

      // Set rate limit headers
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', (maxRequests - count - 1).toString());

      // If skipSuccessfulRequests is true, decrement on successful response
      if (skipSuccessfulRequests) {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await redisClient.decr(key);
          }
        });
      }

      next();
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      // If Redis fails, log but don't block the request
      logger.error('Rate limit error', { error });
      next();
    }
  };
}

/**
 * Login-specific rate limiter
 * More strict limits for login attempts
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req: Request) => {
    // Rate limit by email + IP
    const email = req.body.email || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `login:${email}:${ip}`;
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Global API rate limiter
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req: Request) => {
    // Rate limit by IP
    return `api:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  },
});

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}
