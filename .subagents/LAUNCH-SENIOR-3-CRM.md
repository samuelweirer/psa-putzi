# Launch Document: Senior-3 - CRM Module

**Agent:** Senior Developer 3 (Backend Architect)
**AI Model:** Claude Sonnet 4.5
**Module:** CRM-001 - Customer Relationship Management
**Start Date:** TBD (when Gateway reaches 80%)
**Estimated Duration:** 3 weeks (10 days active work)
**Priority:** P1 (High - Core Business Logic)
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (unified with team)

---

## 👔 Your Role: Backend Architect

Welcome, @Senior-3! You're joining the PSA-Platform team as a Backend Architect. Your mission is to build the **Customer Relationship Management (CRM) module** - the heart of our MSP platform.

### Why This Role?
- **Core Business Data:** Customers, Contacts, Locations are central to everything
- **Complex Relationships:** Customer hierarchies, multi-location support, custom fields
- **High Data Volume:** Must scale to thousands of customers per tenant
- **Integration Hub:** CRM data feeds into Tickets, Projects, Billing, Assets

### Your Unique Value
- **High Complexity:** ⭐⭐⭐⭐ (requires senior expertise for data modeling)
- **High Impact:** Every other module depends on your CRM data
- **Business Logic:** Customer hierarchies, custom fields, full-text search
- **Architecture:** You shape how business data is stored and accessed

---

## 🎯 Your Mission: CRM-001

### What You're Building

**CRM Service on Port 3002:**
```
API Gateway (PORT 3000)
        ↓
CRM Service (PORT 3002) ← YOU BUILD THIS
        ↓
PostgreSQL (customers, contacts, locations, custom_fields)
Elasticsearch (full-text search)
RabbitMQ (events: customer.created, customer.updated, etc.)
```

### Core Responsibilities

**1. Customer Management**
- CRUD operations for customers (companies)
- Customer hierarchies (parent/child relationships)
- Customer status workflow (lead → prospect → active → inactive)
- Custom fields (JSONB for extensibility)
- Multi-tenancy with RLS (Row Level Security)
- Full-text search (Elasticsearch or PostgreSQL FTS)

**2. Contact Management**
- Contacts belong to customers
- Multiple contacts per customer
- Contact roles (primary, billing, technical, etc.)
- Contact communication preferences
- Email/phone validation

**3. Location Management**
- Locations belong to customers
- Multiple locations per customer
- Address standardization
- Geocoding (optional - for future mapping features)

**4. Integration & Events**
- Publish events to RabbitMQ (customer.created, customer.updated, etc.)
- Consume events from other services if needed
- API versioning (/api/v1/customers)

---

## 📚 Prerequisites: What's Ready for You

### 1. Database Schema ✅

**Customers Table** (from BDUF/BDUF-Chapter3.md):
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  customer_number VARCHAR(50),
  parent_customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'active',
  type VARCHAR(50) DEFAULT 'customer',
  industry VARCHAR(100),
  website VARCHAR(255),
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_parent ON customers(parent_customer_id);
CREATE INDEX idx_customers_slug ON customers(slug) WHERE deleted_at IS NULL;
```

**Contacts Table:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  role VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_contacts_customer ON contacts(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL;
```

**Locations Table:**
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_locations_customer ON locations(customer_id) WHERE deleted_at IS NULL;
```

**Schema is already created in PostgreSQL!** ✅

### 2. Gateway Ready ✅

**Gateway Status:** 12.5% complete (Day 2 in progress)
- Will have JWT authentication and RBAC ready for you
- Will proxy `/api/v1/customers/*` → `localhost:3002`
- Target Gateway completion: 80% (~5 days from now)

### 3. Frontend Working in Parallel 🔄

**Frontend Status:** 55% complete
- Junior-5 already started building CRM UI pages!
- `CustomerDetailPage.tsx` already created
- Can start testing your APIs immediately when ready

### 4. Documentation ✅

**Module Guide:** `implementation/04-MODULE-CRM.md`
- Complete specification for CRM module
- API design patterns
- Data model relationships
- Integration requirements

**Architecture Docs:**
- `BDUF/BDUF-Chapter3.md` - Complete database schema
- `BDUF/BDUF-Chapter4.md` - API design patterns
- `BDUF/BDUF-Chapter5.md` - Security (RBAC, multi-tenancy)

### 5. Team Support ✅

- **Senior-2 (Auth):** In support mode, can help with RBAC integration
- **Senior-4 (Gateway):** Will add your service to gateway routing
- **Junior-5 (Frontend):** Ready to test your APIs
- **Main Agent (PM):** Available for architecture decisions

---

## 🚀 Getting Started (Day 1)

### Step 1: Read Module Guide (1 hour)
```bash
cd /opt/psa-putzi
cat implementation/04-MODULE-CRM.md
```

### Step 2: Review Database Schema (30 minutes)
```bash
# Check tables exist
psql -h localhost -U psa_admin -d psa_platform -c "\d customers"
psql -h localhost -U psa_admin -d psa_platform -c "\d contacts"
psql -h localhost -U psa_admin -d psa_platform -c "\d locations"
```

### Step 3: Create CRM Service Project (2 hours)
```bash
cd /opt/psa-putzi/services
mkdir crm-service
cd crm-service

# Initialize TypeScript project
npm init -y
npm install express pg jsonwebtoken cors helmet express-rate-limit
npm install -D typescript @types/node @types/express ts-node nodemon

# Set up TypeScript
npx tsc --init

# Create folder structure
mkdir -p src/{controllers,services,models,middleware,routes,utils,types,validators}
mkdir -p tests/{unit,integration}
```

### Step 4: Copy Shared Code from Auth Service (30 minutes)
```bash
# Copy authentication middleware (gateway will forward user context)
cp ../auth-service/src/middleware/auth.middleware.ts src/middleware/
cp ../auth-service/src/types/index.ts src/types/

# Copy database pool configuration
cp ../auth-service/src/config/database.ts src/config/

# Copy environment template
cp ../auth-service/.env.example .env
# Edit .env: PORT=3002, DATABASE_URL=...
```

### Step 5: Implement Basic Customer Model (2 hours)
```typescript
// src/models/customer.model.ts
import { query } from '../config/database';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  customer_number?: string;
  parent_customer_id?: string;
  status: string;
  type: string;
  industry?: string;
  website?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export class CustomerModel {
  static async findAll(tenant_id: string, filters?: any) {
    const result = await query(
      'SELECT * FROM customers WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name',
      [tenant_id]
    );
    return result.rows;
  }

  static async findById(id: string, tenant_id: string) {
    const result = await query(
      'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenant_id]
    );
    return result.rows[0];
  }

  static async create(data: Partial<Customer>) {
    const result = await query(
      `INSERT INTO customers (tenant_id, name, slug, customer_number, status, type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.tenant_id, data.name, data.slug, data.customer_number, data.status || 'active', data.type || 'customer']
    );
    return result.rows[0];
  }

  static async update(id: string, tenant_id: string, data: Partial<Customer>) {
    const result = await query(
      'UPDATE customers SET name = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [data.name, id, tenant_id]
    );
    return result.rows[0];
  }

  static async softDelete(id: string, tenant_id: string) {
    const result = await query(
      'UPDATE customers SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenant_id]
    );
    return result.rows[0];
  }
}
```

### Step 6: Basic Health Check (30 minutes)
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'psa-crm-service' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`CRM service listening on port ${PORT}`);
});
```

---

## 📅 Development Timeline

### Week 1: Core CRM (Days 1-3)

**Day 1: Setup & Customer CRUD**
- ✅ Project structure
- ✅ Customer model
- ✅ Customer controller
- ✅ GET /customers, GET /customers/:id
- ✅ POST /customers
- ✅ Health check endpoint

**Day 2: Contacts & Locations**
- Contact model & CRUD APIs
- Location model & CRUD APIs
- Customer → Contacts relationship
- Customer → Locations relationship
- Validation with Joi

**Day 3: Customer Relationships & Search**
- Parent/child customer relationships
- Customer hierarchy validation (prevent circular refs)
- Full-text search (PostgreSQL FTS or Elasticsearch)
- Custom fields support (JSONB)

### Week 2: Advanced Features (Days 4-6)

**Day 4: Business Logic & Events**
- Customer status workflow
- Activity log integration
- RabbitMQ event publishing
- Integration with auth service (tenant context)

**Day 5: Testing**
- Unit tests for models (≥80% coverage)
- Integration tests for API endpoints
- Test customer hierarchies
- Test multi-tenancy isolation

**Day 6: Documentation & Polish**
- Swagger/OpenAPI documentation
- PM2 deployment configuration
- Performance optimization (indexes, query tuning)
- Code review and cleanup

### Week 3: Production Readiness (Days 7-10)

**Day 7-8: Advanced Search & Filters**
- Elasticsearch integration (optional)
- Advanced filtering (by status, type, industry)
- Pagination with cursor-based navigation
- Export to CSV

**Day 9: Integration Testing**
- Test with Gateway proxy
- Test with Frontend UI
- End-to-end customer creation flow
- Test multi-tenant isolation (critical!)

**Day 10: Production Deployment**
- Deploy to PM2
- Load testing
- Performance tuning
- Create handover to Tickets module

---

## 📋 Technical Requirements

### Must Have (Definition of Done)

**Functionality:**
- [x] Customers CRUD (create, read, update, soft delete)
- [ ] Contacts CRUD
- [ ] Locations CRUD
- [ ] Customer hierarchies (parent/child)
- [ ] Custom fields (JSONB)
- [ ] Full-text search
- [ ] Multi-tenancy with RLS
- [ ] Activity logging
- [ ] RabbitMQ event publishing

**Quality:**
- [ ] Test coverage ≥80%
- [ ] All tests passing
- [ ] TypeScript strict mode
- [ ] ESLint clean
- [ ] No security vulnerabilities

**Deployment:**
- [ ] Runs on PM2 (port 3002)
- [ ] Auto-restart on failure
- [ ] Health check endpoint
- [ ] Environment configuration
- [ ] Logging to files

**Documentation:**
- [ ] Swagger/OpenAPI documentation
- [ ] API usage examples
- [ ] Deployment guide
- [ ] Handover to Tickets module

### Nice to Have (If Time Permits)

- [ ] Elasticsearch integration (advanced search)
- [ ] Customer import from CSV
- [ ] Customer merge functionality
- [ ] Customer deduplication
- [ ] Address geocoding
- [ ] Customer health score calculation

---

## 🤝 Team Coordination

### Your Team

**Main Agent (PM):** Project Manager
- **Role:** Strategic coordination, approvals
- **Response SLA:** < 1 hour for blockers
- **Communication:** `.subagents/issues/` for escalations

**Senior-2 (Auth):** Your Peer
- **Role:** Support for RBAC, multi-tenancy questions
- **Expertise:** JWT, RBAC, tenant isolation
- **Communication:** Ask auth integration questions

**Senior-4 (Gateway):** Your Integration Partner
- **Role:** Add CRM service to gateway routing
- **Expertise:** Service discovery, proxy configuration
- **Communication:** Coordinate on service registration

**Junior-5 (Frontend):** Your Customer
- **Role:** Consume your APIs, provide UI feedback
- **Expertise:** React, user experience
- **Communication:** API contract discussions

### Communication Protocol

**Daily:**
```bash
# 1. Update your status
nano .subagents/status/crm-agent-2025-11-XX.md

# 2. Check for blockers
cat .subagents/issues/*.md

# 3. Commit and push frequently
git add .
git commit -m "feat(crm): implement customer CRUD"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

---

## 🎯 Success Metrics

### Your Performance Indicators

**Delivery:**
- CRM service routes requests correctly
- All CRUD operations work
- Tests passing (≥80% coverage)
- Documentation complete
- PM2 deployment successful

**Quality:**
- Zero multi-tenancy data leaks (CRITICAL!)
- Response times < 100ms for simple queries
- No memory leaks
- Clean code reviews

**Collaboration:**
- Frontend agent unblocked with APIs
- Gateway integration smooth
- Proactive communication
- Issue resolution < 4 hours

---

## 🚨 Common Challenges & Solutions

### Challenge 1: Multi-Tenancy Data Leaks
**Solution:** Always filter by tenant_id in every query
```typescript
// WRONG - exposes all tenants' data
const customers = await query('SELECT * FROM customers');

// RIGHT - filtered by tenant
const customers = await query(
  'SELECT * FROM customers WHERE tenant_id = $1',
  [user.tenant_id]
);
```

### Challenge 2: Circular Customer References
**Solution:** Validate parent-child hierarchy
```typescript
async function validateParent(customerId: string, parentId: string) {
  // Check parent is not self
  if (customerId === parentId) {
    throw new Error('Customer cannot be its own parent');
  }

  // Check for circular reference (walk up the tree)
  let current = parentId;
  while (current) {
    if (current === customerId) {
      throw new Error('Circular reference detected');
    }
    const parent = await CustomerModel.findById(current);
    current = parent?.parent_customer_id;
  }
}
```

### Challenge 3: JSONB Custom Fields
**Solution:** Define schema for custom fields
```typescript
interface CustomField {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date';
}

// Store in JSONB
custom_fields: {
  "field_1": { "key": "Account Manager", "value": "John Doe", "type": "string" },
  "field_2": { "key": "Contract Value", "value": 50000, "type": "number" }
}
```

---

## 📚 Required Reading (Before Coding)

### Must Read (Essential)
1. `implementation/04-MODULE-CRM.md` ← **START HERE**
2. `BDUF/BDUF-Chapter3.md` (Database schema)
3. `.subagents/UNIFIED-BRANCH-WORKFLOW.md` (Git workflow)

### Should Read (Important)
4. `BDUF/BDUF-Chapter4.md` (API design)
5. `services/auth-service/src/models/user.model.ts` (Example model code)
6. `.subagents/AGENT-ROLES-CONFIG.md` (Your role)

---

## ✅ Pre-Launch Checklist

### Before You Start Coding

- [ ] Gateway at 80%+ completion (prerequisite)
- [ ] Read module guide (04-MODULE-CRM.md)
- [ ] Understand database schema (BDUF-Chapter3.md)
- [ ] Verify tables exist in PostgreSQL
- [ ] Auth service operational (for RBAC middleware)
- [ ] Read unified branch workflow guide
- [ ] Create initial status file

### First Day Deliverables

- [ ] Project structure created
- [ ] Basic Express app running
- [ ] Health check endpoint working
- [ ] Customer model implemented
- [ ] Database connection working
- [ ] First commit pushed to GitHub

---

## 🎉 Welcome to the Team!

You're joining at a great time:
- ✅ Auth service production-ready (97% complete)
- ✅ Gateway Day 2 in progress (will be ready soon)
- ✅ Frontend 55% complete (actively building CRM UI!)
- ✅ Infrastructure solid and tested
- ✅ Documentation comprehensive

**Your CRM module will:**
- Become the foundation for Tickets, Projects, Billing
- Store all customer and contact data
- Enable powerful search and filtering
- Support complex customer hierarchies
- Scale to thousands of customers per tenant

**You have:**
- Complete autonomy within your module
- Full support from PM and Senior agents
- Clear specifications and requirements
- Database schema already created
- Frontend ready to test your APIs

**Expectations:**
- High quality code (≥80% coverage)
- Multi-tenancy security (CRITICAL!)
- Proactive communication
- Daily status updates
- Completion in 3 weeks (10 active days)

---

## 🚀 Ready, Set, Wait!

**Your launch trigger:** Gateway reaches 80% completion (~5 days)
**Your first task:** Read the module guide and database schema
**Your first commit:** Basic Express app with health check
**Your first milestone:** Customer CRUD working

**Questions?** Ask in `.subagents/issues/`
**Blocked?** @mention @Main-Agent (< 1 hour response)
**Excited?** We are too! 🚀

---

**Launch Date:** TBD (when GATEWAY-001 reaches 80%)
**Created By:** Main Agent (Project Manager)
**Status:** 🟡 Draft - Awaiting Gateway Completion
**Next Check:** Monitor gateway-agent status for 80% milestone

---

**Looking forward to having you on the team, Senior-3! 🎉**
