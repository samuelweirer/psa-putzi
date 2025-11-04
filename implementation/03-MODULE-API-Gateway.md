# Module Implementation Guide: psa-api-gateway

**Module:** API Gateway & Routing
**Phase:** 1 (MVP)
**Priority:** P0 (Critical - Entry point for all API requests)
**Port:** 3000
**Dependencies:** psa-auth (Authentication), psa-infrastructure (Redis)

> **📦 Deployment Note:** For MVP (Phase 1-2), this service runs on **Container 150 (psa-app)** alongside all other Node.js services, managed by PM2. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The API Gateway serves as the single entry point for all API requests, providing routing, authentication, rate limiting, and request/response transformation.

### Key Features
- **Reverse Proxy** to microservices
- **JWT Authentication** middleware
- **Rate Limiting** per user/IP
- **Request/Response Logging**
- **CORS Handling**
- **API Versioning** (v1, v2)
- **Load Balancing** across service instances
- **Circuit Breaker** for failing services
- **Request/Response Validation**

### Container Specifications
- **CPU:** 2-4 cores
- **RAM:** 4 GB
- **Storage:** 10 GB
- **Network:** VLAN 100 (DMZ) + VLAN 20 (Application)
- **Port:** 443 (HTTPS), 80 (HTTP redirect)

---

## 2. ARCHITECTURE

### Technology Stack
- **Node.js 20 LTS** with TypeScript 5.x
- **Express.js** as web framework
- **express-gateway** or custom routing
- **helmet** for security headers
- **express-rate-limit** for rate limiting
- **morgan** for request logging
- **http-proxy-middleware** for proxying

### Request Flow

```
Internet → Firewall → API Gateway (HTTPS) → Auth Service → Target Service
                            ↓
                        Redis (rate limiting, cache)
                            ↓
                        Audit Log
```

### Route Mapping

| Route Pattern | Target Service | Auth Required | Rate Limit |
|---------------|----------------|---------------|------------|
| `/api/v1/auth/*` | psa-auth:3010 | No | 10/min |
| `/api/v1/users/*` | psa-auth:3010 | Yes | 100/min |
| `/api/v1/customers/*` | psa-crm:3020 | Yes | 100/min |
| `/api/v1/contacts/*` | psa-crm:3020 | Yes | 100/min |
| `/api/v1/tickets/*` | psa-tickets:3030 | Yes | 100/min |
| `/api/v1/billing/*` | psa-billing:3040 | Yes | 50/min |
| `/api/v1/projects/*` | psa-projects:3050 | Yes | 100/min |
| `/api/v1/assets/*` | psa-assets:3060 | Yes | 100/min |
| `/api/v1/reports/*` | psa-reports:3070 | Yes | 20/min |

---

## 3. DATABASE SCHEMA

### Tables Required

No direct database access. Uses Redis for:
- Rate limiting counters
- JWT blacklist (for logout)
- Response caching

**Redis Key Patterns:**
```
ratelimit:{ip}:{endpoint} → counter (TTL: 60s)
ratelimit:{user_id}:{endpoint} → counter (TTL: 60s)
jwt:blacklist:{token_hash} → "1" (TTL: token expiry)
cache:response:{method}:{path}:{query_hash} → JSON (TTL: varies)
```

---

## 4. API SPECIFICATION

### Base URL
`https://api.psa-platform.local`

### Health Endpoint

#### GET /health
**Description:** Health check for API Gateway

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "psa-api-gateway",
  "version": "1.0.0",
  "uptime": 123456,
  "timestamp": "2025-11-04T10:30:00Z",
  "dependencies": {
    "redis": "healthy",
    "psa-auth": "healthy",
    "psa-crm": "healthy",
    "psa-tickets": "healthy"
  }
}
```

### Error Handling

**Standard Error Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "status": 429,
    "timestamp": "2025-11-04T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Codes:**
- `400 BAD_REQUEST` - Invalid request format
- `401 UNAUTHORIZED` - Missing or invalid authentication
- `403 FORBIDDEN` - Insufficient permissions
- `404 NOT_FOUND` - Resource not found
- `429 RATE_LIMIT_EXCEEDED` - Too many requests
- `500 INTERNAL_SERVER_ERROR` - Server error
- `502 BAD_GATEWAY` - Upstream service unavailable
- `503 SERVICE_UNAVAILABLE` - Gateway overloaded
- `504 GATEWAY_TIMEOUT` - Upstream timeout

---

## 5. BUSINESS LOGIC

### JWT Authentication Middleware

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
  sub: string;  // user_id
  email: string;
  role: string;
  tenantId: string;
  permissions: object;
}

export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authentication required',
        status: 401
      }
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redis.exists(`jwt:blacklist:${hashToken(token)}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
          status: 401
        }
      });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      permissions: payload.permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          status: 401
        }
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
          status: 401
        }
      });
    } else {
      return res.status(500).json({
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error',
          status: 500
        }
      });
    }
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

### Rate Limiting Middleware

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!),
  password: process.env.REDIS_PASSWORD
});

// IP-based rate limiting
export const ipRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'ratelimit:ip:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again later.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// User-based rate limiting (after authentication)
export const userRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'ratelimit:user:'
  }),
  windowMs: 60 * 1000,
  max: (req) => {
    // Different limits based on user role
    const role = req.user?.role;
    if (role === 'system_admin') return 1000;
    if (role === 'tenant_admin') return 500;
    return 100;
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      status: 429
    }
  }
});

// Endpoint-specific rate limiting
export function endpointRateLimit(maxRequests: number) {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'ratelimit:endpoint:'
    }),
    windowMs: 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => `${req.user?.id || req.ip}:${req.path}`,
  });
}
```

### Request Logging Middleware

```typescript
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Add request ID to all requests
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Custom morgan token for request ID
morgan.token('request-id', (req: Request) => req.id);

// Custom morgan token for user ID
morgan.token('user-id', (req: Request) => req.user?.id || '-');

// Custom morgan format
export const loggerMiddleware = morgan(
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :request-id :response-time ms',
  {
    stream: {
      write: (message: string) => {
        // Send to logging service
        logger.info(message.trim());
      }
    }
  }
);
```

### Service Routing

```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

const serviceRoutes = {
  '/api/v1/auth': {
    target: 'http://psa-auth:3010',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/users': {
    target: 'http://psa-auth:3010',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/customers': {
    target: 'http://psa-crm:3020',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/contacts': {
    target: 'http://psa-crm:3020',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/tickets': {
    target: 'http://psa-tickets:3030',
    changeOrigin: true,
    timeout: 15000, // Longer timeout for complex queries
  },
  '/api/v1/billing': {
    target: 'http://psa-billing:3040',
    changeOrigin: true,
    timeout: 30000, // Even longer for report generation
  },
  '/api/v1/projects': {
    target: 'http://psa-projects:3050',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/assets': {
    target: 'http://psa-assets:3060',
    changeOrigin: true,
    timeout: 10000,
  },
  '/api/v1/reports': {
    target: 'http://psa-reports:3070',
    changeOrigin: true,
    timeout: 60000, // Very long for complex reports
  }
};

// Apply routing
Object.entries(serviceRoutes).forEach(([route, config]) => {
  app.use(
    route,
    createProxyMiddleware({
      ...config,
      onProxyReq: (proxyReq, req) => {
        // Forward user context
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
        proxyReq.setHeader('X-Request-ID', req.id);
      },
      onError: (err, req, res) => {
        logger.error('Proxy error:', err);
        res.status(502).json({
          error: {
            code: 'BAD_GATEWAY',
            message: 'Upstream service unavailable',
            status: 502,
            request_id: req.id
          }
        });
      }
    })
  );
});
```

### Circuit Breaker

```typescript
import CircuitBreaker from 'opossum';

const circuitBreakerOptions = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10
};

const serviceCircuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(serviceName: string, serviceUrl: string) {
  if (!serviceCircuitBreakers.has(serviceName)) {
    const breaker = new CircuitBreaker(
      async (req: Request) => {
        // Make request to service
        const response = await fetch(`${serviceUrl}${req.path}`, {
          method: req.method,
          headers: req.headers,
          body: req.body
        });
        return response;
      },
      circuitBreakerOptions
    );

    breaker.on('open', () => {
      logger.warn(`Circuit breaker opened for ${serviceName}`);
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker half-open for ${serviceName}`);
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker closed for ${serviceName}`);
    });

    serviceCircuitBreakers.set(serviceName, breaker);
  }

  return serviceCircuitBreakers.get(serviceName)!;
}
```

### CORS Configuration

```typescript
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://psa-platform.local',
      'https://app.psa-platform.local',
      'https://admin.psa-platform.local'
    ];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.psa-platform.local'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));
```

---

## 6. TESTING REQUIREMENTS

### Unit Tests

```typescript
// tests/unit/auth-middleware.test.ts
import { authenticateJWT } from '../../src/middleware/auth';

describe('authenticateJWT middleware', () => {
  it('should reject requests without Authorization header', async () => {
    const req = { headers: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid JWT token', async () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'test@example.com', role: 'technician' },
      process.env.JWT_SECRET!
    );

    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as any;
    const res = {} as any;
    const next = jest.fn();

    await authenticateJWT(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });

  it('should reject expired tokens', async () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'test@example.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' }
    );

    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'TOKEN_EXPIRED' })
      })
    );
  });
});
```

### Integration Tests

```typescript
// tests/integration/gateway.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('API Gateway Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    authToken = response.body.access_token;
  });

  it('should proxy requests to auth service', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
  });

  it('should proxy requests to CRM service', async () => {
    const response = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should enforce rate limiting', async () => {
    const requests = [];
    for (let i = 0; i < 150; i++) {
      requests.push(
        request(app)
          .get('/api/v1/tickets')
          .set('Authorization', `Bearer ${authToken}`)
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  it('should add request ID to all responses', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
```

### Load Testing

```javascript
// load-test.js (using k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const token = 'YOUR_AUTH_TOKEN';

  const res = http.get('https://api.psa-platform.local/api/v1/tickets', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 7. IMPLEMENTATION CHECKLIST

### Setup
- [ ] LXC container created
- [ ] Node.js 20 LTS installed
- [ ] TypeScript project initialized
- [ ] Dependencies installed (express, helmet, morgan, etc.)

### Core Functionality
- [ ] Express app bootstrapped
- [ ] JWT authentication middleware implemented
- [ ] Rate limiting middleware configured
- [ ] Request logging middleware setup
- [ ] CORS configuration applied
- [ ] Security headers configured (helmet)

### Routing
- [ ] Service routing table defined
- [ ] Proxy middleware configured for each service
- [ ] Circuit breaker implemented
- [ ] Timeout handling configured
- [ ] Error handling middleware

### Monitoring
- [ ] Health check endpoint implemented
- [ ] Metrics collection (Prometheus)
- [ ] Request/response logging
- [ ] Error tracking (Sentry)

### Security
- [ ] HTTPS/TLS configured
- [ ] Rate limiting tested
- [ ] JWT validation tested
- [ ] CORS tested
- [ ] Security headers verified

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests
- [ ] Load tests
- [ ] Security tests (OWASP)

### Documentation
- [ ] OpenAPI specification
- [ ] README with setup instructions
- [ ] Environment variables documented

---

## 8. DEFINITION OF DONE

- [ ] All endpoints proxying correctly
- [ ] JWT authentication working
- [ ] Rate limiting enforced
- [ ] CORS configured correctly
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] Load test targets met (p95 < 500ms)
- [ ] API documentation complete
- [ ] Security scan passed
- [ ] Deployed to staging
- [ ] Manual QA completed

---

## 9. DEPENDENCIES & LIBRARIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "opossum": "^8.1.0",
    "prom-client": "^15.1.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2"
  }
}
```

---

## 10. ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=production
PORT=3000

# Redis
REDIS_HOST=10.0.20.20
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars

# Service URLs
AUTH_SERVICE_URL=http://psa-auth:3010
CRM_SERVICE_URL=http://psa-crm:3020
TICKETS_SERVICE_URL=http://psa-tickets:3030
BILLING_SERVICE_URL=http://psa-billing:3040
PROJECTS_SERVICE_URL=http://psa-projects:3050
ASSETS_SERVICE_URL=http://psa-assets:3060
REPORTS_SERVICE_URL=http://psa-reports:3070

# CORS
ALLOWED_ORIGINS=https://psa-platform.local,https://app.psa-platform.local

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=10000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

---

## 11. DEPLOYMENT

### Dockerfile/LXC Container

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/index.js"]
```

### Health Check Script

```javascript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => process.exit(1));
req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 2 weeks (1 developer)
