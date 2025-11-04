# Handover Document Template

**Date:** YYYY-MM-DD  
**From:** Agent {N} - {Name}  
**To:** Agent {M} - {Name}  
**Module:** {Module Name}  
**Status:** ✅ Complete | 🔄 Partial | ⏸️ Paused

---

## 📋 Executive Summary

### What Was Delivered
[2-3 sentence overview of what was built and why it matters]

### Key Achievements
- ✅ [Major accomplishment 1]
- ✅ [Major accomplishment 2]
- ✅ [Major accomplishment 3]

### Completion Status
- **Planned Features:** XX/YY (XX%)
- **Tests Written:** XX/YY (XX%)
- **Documentation:** XX/YY (XX%)

---

## 🏗️ What Was Built

### 1. Component/Service: {Name}
**Location:** `path/to/code`  
**Purpose:** [What it does and why]

**Key Features:**
- Feature 1: [Description]
- Feature 2: [Description]
- Feature 3: [Description]

**Entry Point:** `path/to/main/file.ts`  
**Port:** XXXX (if applicable)

**How to Start:**
```bash
cd path/to/service
npm install
npm run dev
```

**Health Check:**
```bash
curl http://localhost:XXXX/health
# Expected: {"status": "healthy"}
```

### 2. Database Schema
**Location:** `infrastructure/database/migrations/`

**Tables Created:**
- `table_name` - Purpose: [Description]
  - Primary Key: `id`
  - Foreign Keys: `other_table_id`
  - Indexes: `idx_field_name`

**Migration Files:**
```sql
-- migrations/XXX_create_tables.sql
-- migrations/XXX_add_indexes.sql
```

**How to Apply:**
```bash
npm run migrate:up
```

**How to Rollback:**
```bash
npm run migrate:down
```

### 3. API Endpoints
**Base URL:** `http://localhost:XXXX/api/v1`

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/resource` | Create new resource | ✅ | ✅ Complete |
| GET | `/resource` | List resources | ✅ | ✅ Complete |
| GET | `/resource/:id` | Get by ID | ✅ | ✅ Complete |
| PUT | `/resource/:id` | Update resource | ✅ | ✅ Complete |
| DELETE | `/resource/:id` | Delete resource | ✅ | ✅ Complete |

**OpenAPI Spec:** `docs/api/{service}.openapi.yaml`

---

## 🗂️ Critical Files

### Core Logic
| File | Purpose | Critical Notes |
|------|---------|----------------|
| `src/controllers/resource.controller.ts` | HTTP request handling | Entry point for all endpoints |
| `src/services/resource.service.ts` | Business logic | Core functionality here |
| `src/models/resource.model.ts` | Database model | TypeORM/Sequelize entity |
| `src/middleware/auth.middleware.ts` | Authentication | MUST use @psa/auth-middleware |

### Configuration
| File | Purpose | Critical Notes |
|------|---------|----------------|
| `.env.example` | Environment template | ALL variables documented |
| `src/config/index.ts` | Config loader | Uses @psa/config |
| `package.json` | Dependencies | Locked versions |

### Testing
| File | Purpose | Coverage |
|------|---------|----------|
| `tests/unit/resource.test.ts` | Unit tests | XX% |
| `tests/integration/api.test.ts` | Integration tests | XX% |
| `tests/fixtures/data.ts` | Test data | Reusable |

---

## 🔧 Environment Variables

### Required Variables
Add these to `.env`:

```bash
# Service Configuration
SERVICE_NAME=psa-{service}
SERVICE_PORT=XXXX
NODE_ENV=development

# Database (from Agent-1)
DATABASE_URL=postgresql://user:pass@localhost:5432/psa_platform
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (from Agent-1)
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# RabbitMQ (from Agent-1)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE={service}_exchange

# Authentication (from Agent-2)
JWT_SECRET=<from Agent-2>
JWT_ALGORITHM=RS256
JWT_PUBLIC_KEY=<from Agent-2>

# Service-Specific
SPECIFIC_VAR=value  # Purpose: [Explanation]
ANOTHER_VAR=value   # Purpose: [Explanation]

# External APIs (if applicable)
EXTERNAL_API_KEY=xxx
EXTERNAL_API_URL=https://api.example.com
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json # json, pretty

# Features
FEATURE_FLAG_NAME=true  # Enable experimental feature
```

---

## 📦 Dependencies

### NPM Packages Installed

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "package-name": "^1.0.0"
  },
  "devDependencies": {
    "package-name": "^1.0.0"
  }
}
```

### Internal Packages Used

```json
{
  "@psa/types": "^1.0.0",
  "@psa/auth-middleware": "^1.0.0",
  "@psa/logger": "^1.0.0",
  "@psa/config": "^1.0.0"
}
```

**How to Install:**
```bash
npm install
# or
npm install @psa/package-name
```

---

## 🔗 Shared Types & Interfaces

### Location
`.subagents/shared/types.ts`

### Types Added/Modified

```typescript
/**
 * Added by Agent-{N} on YYYY-MM-DD
 * Purpose: [Explanation]
 */
export interface ResourceType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Modified by Agent-{N} on YYYY-MM-DD
 * Changes: Added newField for [purpose]
 */
export interface ExistingType {
  existingField: string;
  newField: string; // Added for [purpose]
}
```

### Constants Added
`.subagents/shared/constants.ts`

```typescript
/**
 * Added by Agent-{N} on YYYY-MM-DD
 */
export const RESOURCE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted'
} as const;

export type ResourceStatus = typeof RESOURCE_STATUS[keyof typeof RESOURCE_STATUS];
```

### Errors Defined
`.subagents/shared/errors.ts`

```typescript
/**
 * Added by Agent-{N} on YYYY-MM-DD
 */
export class ResourceNotFoundError extends Error {
  constructor(id: string) {
    super(`Resource not found: ${id}`);
    this.name = 'ResourceNotFoundError';
  }
}
```

---

## 🗄️ Database Changes

### Schema
**Migration File:** `migrations/XXX_create_resource_tables.sql`

```sql
-- Tables created
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Indexes created
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_created_at ON resources(created_at);
```

### Data Seeding
**Seed File:** `infrastructure/database/seeds/XXX_resources.sql`

```sql
INSERT INTO resources (name, status) VALUES
  ('Test Resource 1', 'active'),
  ('Test Resource 2', 'active');
```

**How to Seed:**
```bash
npm run seed:dev
```

### Important Queries

```sql
-- Get active resources
SELECT * FROM resources 
WHERE status = 'active' AND deleted_at IS NULL;

-- Soft delete
UPDATE resources 
SET deleted_at = NOW() 
WHERE id = ?;
```

---

## 🔌 RabbitMQ Events

### Events Emitted

```typescript
// Event: resource.created
{
  event: 'resource.created',
  timestamp: '2025-11-04T10:00:00Z',
  data: {
    id: 'uuid',
    name: 'Resource Name',
    createdBy: 'user-id'
  }
}

// Event: resource.updated
{
  event: 'resource.updated',
  timestamp: '2025-11-04T10:00:00Z',
  data: {
    id: 'uuid',
    changes: {
      name: { old: 'Old Name', new: 'New Name' }
    },
    updatedBy: 'user-id'
  }
}
```

### Events Consumed

```typescript
// Listening to: customer.created (from Agent-4)
rabbitMQ.subscribe('customer.created', async (message) => {
  // Handle customer creation
});
```

### Queue Configuration
```typescript
const queueConfig = {
  exchange: 'psa_exchange',
  exchangeType: 'topic',
  routingKey: 'resource.*',
  queue: 'psa-resource-service',
  durable: true
};
```

---

## 🧪 Testing

### Test Coverage
- **Overall:** XX%
- **Controllers:** XX%
- **Services:** XX%
- **Models:** XX%

### How to Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Data
**Location:** `tests/fixtures/`

```typescript
// tests/fixtures/resources.ts
export const mockResource = {
  id: 'test-uuid',
  name: 'Test Resource',
  status: 'active'
};
```

### Integration Test Example
```typescript
describe('POST /api/v1/resources', () => {
  it('should create a new resource', async () => {
    const response = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Resource' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

---

## 🚨 Known Issues & Technical Debt

### 🔴 Critical Issues
**Issue 1: [Description]**
- **Impact:** [Who/what is affected]
- **Workaround:** [Temporary solution]
- **Permanent Fix:** [What needs to be done]
- **Estimated Effort:** X days
- **Issue Tracker:** `.subagents/issues/YYYY-MM-DD-issue.md`

### 🟡 Non-Critical Issues
**Issue 2: [Description]**
- **Impact:** Minor performance degradation
- **Can be addressed in:** Phase 2
- **Notes:** [Additional context]

### 📝 Technical Debt
- **TODO 1:** Refactor [component] for better performance
  - **Location:** `src/services/resource.service.ts:45`
  - **Reason:** Current implementation works but not optimal
  - **Priority:** Low

---

## ⚙️ Configuration for Next Agent

### Service Discovery
```typescript
// Add to your service configuration
const upstreamServices = {
  auth: 'http://localhost:3010',
  resource: 'http://localhost:XXXX'  // This service
};
```

### API Integration Example
```typescript
// How to call this service from another service
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:XXXX/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const resource = await client.get('/resources/123');
```

### Required Middleware
```typescript
// MUST use these in your service
import { authMiddleware } from '@psa/auth-middleware';
import { loggerMiddleware } from '@psa/logger';
import { errorHandler } from '@psa/error-handler';

app.use(loggerMiddleware);
app.use(authMiddleware);
// ... your routes
app.use(errorHandler);
```

---

## ⚠️ Critical Notes

### 🚨 MUST READ
- **Security:** Never log sensitive data (passwords, tokens, API keys)
- **Database:** Always use parameterized queries (SQL injection prevention)
- **Auth:** All endpoints MUST use auth middleware except `/health`
- **CORS:** Configured for localhost only (update for production)
- **Rate Limiting:** Currently 100 req/min (adjust per endpoint)

### 💡 Important Tips
- **Tip 1:** [Helpful advice based on experience]
- **Tip 2:** [Watch out for this common mistake]
- **Tip 3:** [Performance optimization tip]

### 🐛 Known Bugs & Workarounds
**Bug 1: [Description]**
```typescript
// Workaround
if (condition) {
  // Do this instead of the obvious approach
}
```

---

## 📖 Documentation

### API Documentation
**Location:** `docs/api/{service}.openapi.yaml`

**View Online:**
```bash
npm run docs:serve
# Open http://localhost:8080
```

### Code Documentation
- **JSDoc:** All public functions documented
- **README:** `services/{service}/README.md`
- **Architecture Decisions:** `docs/architecture/ADR-XXX.md`

### Developer Guide
**Location:** `docs/guides/{service}-setup.md`

**Covers:**
- Local development setup
- Common tasks
- Troubleshooting
- Best practices

---

## ✅ Verification Checklist

Before considering this handover complete, verify:

### Functional
- [ ] Service starts without errors
- [ ] Health check endpoint responds
- [ ] All API endpoints work as documented
- [ ] Database migrations apply successfully
- [ ] Tests pass (unit + integration)

### Integration
- [ ] Connects to PostgreSQL
- [ ] Connects to Redis
- [ ] Connects to RabbitMQ
- [ ] Authenticated with Auth service
- [ ] Uses shared types from @psa/types

### Documentation
- [ ] README.md complete
- [ ] API documented (OpenAPI)
- [ ] Environment variables documented
- [ ] Known issues listed
- [ ] Handover document complete

### Code Quality
- [ ] ESLint passes (0 errors, 0 warnings)
- [ ] TypeScript compiles (0 errors)
- [ ] Test coverage ≥ 70%
- [ ] No console.log in production code
- [ ] All TODOs have issue references

---

## 🎯 Next Steps for Receiving Agent

### Immediate Actions
1. [ ] Read this entire handover document
2. [ ] Review critical files listed above
3. [ ] Run health checks to verify everything works
4. [ ] Update `.env` with all required variables
5. [ ] Run `npm install` to install dependencies
6. [ ] Run `npm test` to verify tests pass
7. [ ] Start service and test API endpoints

### Integration Tasks
1. [ ] Import types from `.subagents/shared/types.ts`
2. [ ] Use auth middleware from `@psa/auth-middleware`
3. [ ] Subscribe to relevant RabbitMQ events
4. [ ] Set up your own RabbitMQ events
5. [ ] Test integration with this service

### First Week Focus
1. **Day 1:** Setup and verification
2. **Day 2-3:** Implement core features
3. **Day 4:** Write tests
4. **Day 5:** Integration testing

---

## 🤝 Support & Questions

### If You Need Help

**For questions about:**
- **This service:** Review files in `services/{service}/`
- **Database schema:** Check `infrastructure/database/migrations/`
- **API usage:** See `docs/api/{service}.openapi.yaml`
- **Integration:** Create issue in `.subagents/issues/`

**Contact Information:**
- **Agent:** Agent-{N} ({Name})
- **Module:** {Module Name}
- **Availability:** [Hours/timezone]

### Creating Issues
If you find problems:
```markdown
1. Create: .subagents/issues/YYYY-MM-DD-description.md
2. Use template from SUB-AGENT-CONFIG.md
3. @mention me (Agent-{N})
4. Mark severity (🔴/🟡/🟢)
```

---

## 📊 Metrics & Performance

### Current Performance
- **Avg Response Time:** XXms
- **Database Query Time:** XXms
- **Memory Usage:** XXMB
- **CPU Usage:** XX%

### Optimization Opportunities
- [ ] Add caching for frequently accessed resources
- [ ] Optimize database query at `src/services/resource.service.ts:123`
- [ ] Consider pagination for large result sets

---

## 🎓 Lessons Learned

### What Went Well
- ✅ [Something that worked great]
- ✅ [Good decision that paid off]
- ✅ [Effective approach]

### What Could Be Improved
- 🔄 [Challenge faced]
- 🔄 [What I'd do differently]
- 🔄 [Area for improvement]

### Recommendations
- 💡 [Advice for next agent]
- 💡 [Pattern to follow]
- 💡 [Pitfall to avoid]

---

## 🔐 Security Considerations

### Implemented Security Measures
- ✅ JWT authentication on all endpoints
- ✅ Input validation with Joi/Zod
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet.js security headers

### Security TODO for Next Agent
- [ ] Add request signing for service-to-service calls
- [ ] Implement API key rotation
- [ ] Add audit logging for sensitive operations

---

## 📅 Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| YYYY-MM-DD | Started work | ✅ |
| YYYY-MM-DD | Database schema complete | ✅ |
| YYYY-MM-DD | Core API implemented | ✅ |
| YYYY-MM-DD | Tests written | ✅ |
| YYYY-MM-DD | Documentation complete | ✅ |
| YYYY-MM-DD | Handover to Agent-{M} | ✅ |

**Total Time:** XX days  
**Estimated:** YY days  
**Variance:** +/-Z days

---

## 🎉 Acknowledgments

### Dependencies on Other Agents
- **Agent-1 (Infrastructure):** Database, Redis, RabbitMQ setup
- **Agent-2 (Auth):** Authentication middleware
- **Agent-{X}:** [Other dependencies]

### Collaboration Notes
- Worked closely with @Agent-{X} on [topic]
- Special thanks to @Agent-{Y} for help with [issue]

---

**Handover Completed:** YYYY-MM-DD  
**Verified By:** Agent-{M} ({Next Agent})  
**Status:** ✅ Accepted | 🔄 Questions | ⚠️ Issues Found

---

**Digital Signature:**
```
Agent-{N} ({Name})
Date: YYYY-MM-DD
Module: {Module Name}
Commit Hash: abc123def456
```
