## 4. API-DESIGN (DETAILLIERT)

### 4.1 REST-API-Konventionen

**Resource-basierte URLs:**
```
GET    /api/v1/tickets          # List tickets
POST   /api/v1/tickets          # Create ticket
GET    /api/v1/tickets/:id      # Get ticket
PATCH  /api/v1/tickets/:id      # Update ticket
DELETE /api/v1/tickets/:id      # Delete ticket

GET    /api/v1/tickets/:id/comments      # Get comments
POST   /api/v1/tickets/:id/comments      # Add comment
GET    /api/v1/tickets/:id/time-entries  # Get time entries
```

**HTTP-Verben:**
- **GET** - Read (idempotent, safe)
- **POST** - Create (not idempotent)
- **PUT** - Replace (idempotent)
- **PATCH** - Update partial (not idempotent)
- **DELETE** - Delete (idempotent)

**Standard-Response-Format:**
```json
{
  "data": {
    "id": "uuid",
    "type": "ticket",
    "attributes": {
      "title": "...",
      "status": "open"
    },
    "relationships": {
      "customer": {
        "data": { "type": "customer", "id": "uuid" }
      }
    }
  },
  "meta": {
    "timestamp": "2025-11-03T10:30:00Z"
  }
}
```

**Pagination:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "links": {
    "self": "/tickets?page=1",
    "next": "/tickets?page=2",
    "prev": null,
    "first": "/tickets?page=1",
    "last": "/tickets?page=8"
  }
}
```

**Filtering:**
```
GET /api/v1/tickets?status=open&priority=high
GET /api/v1/tickets?customer_id=uuid
GET /api/v1/tickets?search=network%20issue
GET /api/v1/tickets?created_after=2025-11-01
```

**Sorting:**
```
GET /api/v1/tickets?sort=created_at&order=desc
GET /api/v1/tickets?sort=priority,created_at&order=desc,asc
```

**Field Selection (Sparse Fieldsets):**
```
GET /api/v1/tickets?fields=id,title,status,priority
```

**Include Related Resources:**
```
GET /api/v1/tickets?include=customer,assigned_to
```

### 4.2 Authentication & Authorization

**JWT-Token-Format:**
```typescript
interface JWTPayload {
  sub: string;          // user_id
  email: string;
  role: string;
  permissions: string[];
  customer_id?: string; // for customer users
  iat: number;
  exp: number;
  jti: string;          // JWT ID for revocation
}
```

**Access Token (1 Stunde):**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Refresh Token (7 Tage):**
```json
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}

Response:
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

**Token-Revocation:**
```typescript
// Redis-basiertes Blacklist-System
await redis.setex(
  `blacklist:${jti}`,
  tokenExpirySeconds,
  'revoked'
);
```

### 4.3 Rate-Limiting

**Rate-Limit-Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699012800
```

**Rate-Limit-Implementierung:**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retry_after: req.rateLimit.resetTime,
      },
    });
  },
});

app.use('/api/', apiLimiter);
```

**Per-User-Rate-Limiting:**
```typescript
const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: async (req) => {
    const user = req.user;
    // Higher limits for paid tiers
    if (user.tier === 'enterprise') return 10000;
    if (user.tier === 'professional') return 5000;
    return 1000;
  },
  keyGenerator: (req) => req.user.id,
});
```

### 4.4 Error-Handling

**Standard-Error-Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "priority",
        "message": "Priority must be one of: low, medium, high, critical"
      }
    ],
    "request_id": "req_1234567890",
    "timestamp": "2025-11-03T10:30:00Z"
  }
}
```

**HTTP-Status-Codes:**
```typescript
// Success
200 OK              // Successful GET, PATCH
201 Created         // Successful POST
204 No Content      // Successful DELETE

// Client Errors
400 Bad Request     // Invalid input
401 Unauthorized    // Missing/invalid auth
403 Forbidden       // No permission
404 Not Found       // Resource not found
409 Conflict        // Resource conflict
422 Unprocessable   // Validation error
429 Too Many Req    // Rate limit

// Server Errors
500 Internal Error  // Unexpected error
502 Bad Gateway     // Upstream error
503 Service Unavail // Maintenance
504 Gateway Timeout // Upstream timeout
```

**Error-Codes:**
```typescript
enum ErrorCode {
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Authorization
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  
  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### 4.5 API-Versioning

**URL-basierte Versionierung:**
```
/api/v1/tickets  # Current stable version
/api/v2/tickets  # New version (beta)
```

**Header-basierte Versionierung (Alternative):**
```
Accept: application/vnd.psa.v1+json
```

**Deprecation-Policy:**
```typescript
// Deprecation-Header
res.setHeader('Deprecation', 'true');
res.setHeader('Sunset', 'Sat, 01 May 2026 00:00:00 GMT');
res.setHeader('Link', '</api/v2/tickets>; rel="successor-version"');
```

**Version-Changelog:**
```markdown
## API v2 (2026-01-01)
**Breaking Changes:**
- `priority` field changed from string to integer enum
- `customer` field renamed to `customer_id`
- Removed deprecated `assignee` field (use `assigned_to`)

**New Features:**
- Added `tags` array field
- Added `/tickets/:id/attachments` endpoint

**Deprecations:**
- `status` field will be removed in v3 (use `workflow_state`)

## API v1 (2025-01-01)
- Initial stable release
```

### 4.6 OpenAPI/Swagger-Spezifikation

**OpenAPI 3.0 Beispiel:**
```yaml
openapi: 3.0.0
info:
  title: PSA-Platform API
  version: 1.0.0
  description: Professional Services Automation Platform API
  contact:
    email: api@psa-platform.example.com
  license:
    name: Proprietary

servers:
  - url: https://api.psa-platform.example.com/v1
    description: Production
  - url: https://staging-api.psa-platform.example.com/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /tickets:
    get:
      summary: List tickets
      tags:
        - Tickets
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: status
          in: query
          schema:
            type: string
            enum: [new, assigned, in_progress, waiting_customer, resolved, closed]
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high, critical]
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Ticket'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
    post:
      summary: Create ticket
      tags:
        - Tickets
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTicket'
      responses:
        '201':
          description: Ticket created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Ticket'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Ticket:
      type: object
      properties:
        id:
          type: string
          format: uuid
        ticket_number:
          type: integer
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [new, assigned, in_progress, waiting_customer, resolved, closed]
        priority:
          type: string
          enum: [low, medium, high, critical]
        customer_id:
          type: string
          format: uuid
        assigned_to:
          type: string
          format: uuid
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CreateTicket:
      type: object
      required:
        - title
        - description
        - customer_id
        - priority
      properties:
        title:
          type: string
          minLength: 3
          maxLength: 200
        description:
          type: string
          minLength: 10
        customer_id:
          type: string
          format: uuid
        priority:
          type: string
          enum: [low, medium, high, critical]
        category:
          type: string

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
```

---
