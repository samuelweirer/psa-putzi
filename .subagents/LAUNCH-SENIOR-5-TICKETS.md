# Launch Document: Senior-5 - Tickets Backend Agent

**Agent ID:** Senior-5 (TICKETS-001)
**Agent Role:** Backend Developer - Tickets & Service Desk Module
**AI Model:** Claude Sonnet 4.5
**Launch Date:** 2025-11-05
**Launch Time:** ~20:30 UTC
**Priority:** P1 (High - Core Business Functionality)
**Complexity:** ⭐⭐⭐⭐ High
**Risk Level:** High (Complex SLA calculations, email integration)
**Estimated Duration:** 4 weeks (17 days active) - **Likely much faster based on team pattern!**

---

## 🎯 Mission

Build the **Tickets Backend Service** - the core of the PSA platform that manages service requests, incidents, and support tickets with SLA tracking, time tracking, and workflow management.

**Success Criteria:**
- ✅ Ticket CRUD operations with status workflow
- ✅ SLA tracking (Response & Resolution times)
- ✅ Time entries with billing rate resolution
- ✅ Comments & activity timeline
- ✅ File attachments
- ✅ Auto-assignment algorithm
- ✅ RabbitMQ event publishing
- ✅ 80%+ test coverage
- ✅ Swagger/OpenAPI documentation
- ✅ PM2 cluster deployment
- ✅ Load testing complete

---

## 📋 Project Context

### Current Project Status
**Project Health:** 🟢 EXCEPTIONAL - ~3 weeks ahead of schedule!

**Completed Services:**
- ✅ **Auth Service (Senior-2):** 97% complete, PM2 deployed, 80.5% coverage
- ✅ **API Gateway (Senior-4):** 100% complete, PM2 cluster, 964 RPS tested
- ✅ **CRM Service (Senior-3):** 100% complete, PM2 cluster, 83.7% coverage, 141 tests

**Active Development:**
- 🟢 **Frontend (Junior-5):** 95% complete, CRM integration starting
- 🚀 **Tickets Service (Senior-5 - YOU!):** Starting now!

**Infrastructure:**
- ✅ PostgreSQL 15.14 with all tables
- ✅ Redis 7.0.15 (caching, rate limiting)
- ✅ RabbitMQ 3.12.1 (message queue)
- ✅ PM2 6.0.13 (process management)
- ✅ All services running on Container 200 (psa-all-in-one)

**Team Pattern:**
- Senior-3 (CRM): Completed in ~7 hours (estimated 2 weeks!) 🚀
- Senior-4 (Gateway): Completed in ~5 hours (estimated 2 weeks!) 🚀
- **Expectation:** You can match this velocity!

---

## 🎓 Your Profile

**Experience Level:** Senior Backend Developer
**Strengths:**
- Complex business logic (SLA calculations, time tracking)
- Database design and optimization
- API design (RESTful, versioned)
- Testing (unit + integration, high coverage)
- Email integration (SMTP/IMAP)
- Performance optimization

**Responsibilities:**
- Design and implement Tickets service architecture
- Implement complex SLA tracking logic
- Build time tracking with billing rate resolution
- Create auto-assignment algorithm
- Integrate email notifications and ingestion
- Write comprehensive tests (80%+ coverage)
- Deploy to PM2 cluster mode
- Provide support after completion

---

## 📚 Essential Reading (MUST READ FIRST!)

### Critical Documents (Read in order):

1. **CLAUDE.md** - Project overview, conventions, git workflow
   - Location: `/opt/psa-putzi/CLAUDE.md`
   - Focus: Project structure, development guidelines, testing standards

2. **Module Implementation Guide** - Your roadmap
   - Location: `/opt/psa-putzi/implementation/05-MODULE-Tickets.md`
   - Contains: Complete implementation plan, API endpoints, acceptance criteria
   - **THIS IS YOUR BIBLE** - Read thoroughly!

3. **Database Schema** - Critical for understanding data model
   - Location: `/opt/psa-putzi/BDUF/BDUF-Chapter3.md`
   - Focus on: `tickets`, `time_entries`, `comments`, `ticket_attachments`, `slas` tables
   - **IMPORTANT:** Billing rate resolution hierarchy (see BDUF-Chapter3-Billing-Rate-Fix.md)

4. **API Design Patterns**
   - Location: `/opt/psa-putzi/BDUF/BDUF-Chapter4.md`
   - REST conventions, versioning, error handling

5. **Active Todos**
   - Location: `/opt/psa-putzi/.subagents/ACTIVE-TODOS.md`
   - Your todos section with detailed task breakdown

### Reference Examples (Learn from completed work):

**CRM Service (Your Best Reference!):**
- Location: `/opt/psa-putzi/services/crm-service/`
- Similar complexity: CRUD operations, relationships, events
- Study:
  - Project structure (src/ organization)
  - Customer model (multi-tenancy, soft delete, custom fields)
  - Testing approach (95 unit + 46 integration = 141 tests)
  - PM2 deployment (ecosystem.config.js)
  - Swagger documentation (swagger.config.ts)
  - Database migrations (migrations/ folder)

**Auth Service:**
- Location: `/opt/psa-putzi/services/auth-service/`
- Study: JWT middleware, error handling, validation patterns

**API Gateway:**
- Location: `/opt/psa-putzi/services/api-gateway/`
- Study: Proxy patterns, circuit breaker, rate limiting

---

## 🏗️ Technical Specifications

### Service Details
- **Service Name:** `psa-tickets-service`
- **Port:** 3030
- **Code Location:** `/opt/psa-putzi/services/tickets-service/`
- **Deployment:** PM2 cluster mode (2 instances recommended)
- **Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (UNIFIED with all agents)

### Technology Stack
- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.x (strict mode)
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 15+ (via pg library)
- **Cache:** Redis 7.x (for rate limiting, caching)
- **Message Queue:** RabbitMQ 3.12+ (for events)
- **Testing:** Vitest (unit + integration)
- **Validation:** Joi schemas
- **Logging:** Winston
- **API Docs:** Swagger/OpenAPI 3.0
- **Process Manager:** PM2 (cluster mode)
- **Load Testing:** Artillery

### Database Tables (Already Created)
These tables exist in PostgreSQL - you just need to use them:
- ✅ `tickets` - Main ticket entity
- ✅ `time_entries` - Time tracking with billing rates
- ✅ `comments` - Ticket comments and activity
- ✅ `ticket_attachments` - File attachments
- ✅ `slas` - SLA definitions
- ✅ `contracts` - Customer contracts (for SLA lookup)
- ✅ `customers` - Customer data (via CRM service)
- ✅ `users` - User data (via Auth service)
- ✅ `user_billing_rates` - Billing rate resolution

**IMPORTANT:** Read `BDUF/BDUF-Chapter3-Billing-Rate-Fix.md` to understand billing rate hierarchy!

---

## 🚀 Week-by-Week Implementation Plan

### Week 1: Core Ticket Management (Days 1-5)

#### Day 1-2: Project Setup & Ticket CRUD
- [ ] Read all essential documentation (CLAUDE.md, module guide, BDUF Chapter 3)
- [ ] Create project structure: `services/tickets-service/`
- [ ] Initialize npm project with TypeScript + Express
- [ ] Install dependencies (pg, redis, winston, joi, vitest, amqplib, nodemailer)
- [ ] Create TypeScript configuration (strict mode)
- [ ] Create .env file (DB connection, port 3030, SMTP config)
- [ ] Create basic Express app with health check
- [ ] Test health endpoint: `http://10.255.20.15:3030/health`
- [ ] Create Ticket model with CRUD operations
- [ ] Implement ticket number generation (TIC-0001, TIC-0002, etc.)
- [ ] Create Ticket controller & routes
- [ ] Copy JWT middleware from gateway
- [ ] Test Ticket endpoints with Postman/curl

#### Day 3-4: Status Workflow & SLA Tracking
- [ ] Implement status workflow validation
- [ ] Create SLA calculation service
- [ ] Implement SLA tracking (response & resolution due dates)
- [ ] Create SLA breach detection logic
- [ ] Add first response tracking
- [ ] Add resolution tracking
- [ ] Test SLA calculations with various scenarios

#### Day 5: Time Entries & Billing Rate Resolution
- [ ] Create TimeEntry model (with billing rate snapshot)
- [ ] Implement billing rate resolution hierarchy (see BDUF-Chapter3-Billing-Rate-Fix.md)
- [ ] Create TimeEntry controller & routes
- [ ] Implement time entry validation (start/end times)
- [ ] Test billing rate resolution (multiple rates per user)
- [ ] Write unit tests for TimeEntry model

### Week 2: Comments, Attachments & Advanced Features (Days 6-10)

#### Day 6-7: Comments & Activity Timeline
- [ ] Create Comment model (CRUD operations)
- [ ] Create Comment controller & routes
- [ ] Implement activity timeline (all ticket events)
- [ ] Add @mentions support in comments
- [ ] Test comment threading
- [ ] Write unit tests for Comment model

#### Day 8-9: File Attachments
- [ ] Create Attachment model
- [ ] Implement file upload handling (multipart/form-data)
- [ ] Add file storage (local filesystem for MVP)
- [ ] Implement file download with authentication
- [ ] Add file type validation (images, PDFs, etc.)
- [ ] Add file size limits (10MB per file)
- [ ] Test attachment upload/download

#### Day 10: Auto-Assignment Algorithm
- [ ] Create assignment service
- [ ] Implement round-robin assignment
- [ ] Implement skill-based assignment (optional)
- [ ] Implement workload-based assignment
- [ ] Test assignment algorithm
- [ ] Write unit tests for assignment logic

### Week 3: Integration & Testing (Days 11-15)

#### Day 11-12: RabbitMQ Event Publishing
- [ ] Create RabbitMQ client (connection + channel)
- [ ] Implement event publishing (ticket.created, ticket.updated, etc.)
- [ ] Add event schemas (JSON payloads)
- [ ] Test event publishing to RabbitMQ
- [ ] Add graceful shutdown for RabbitMQ connections

#### Day 13-14: Email Integration
- [ ] Configure Nodemailer (SMTP client)
- [ ] Implement ticket creation notification email
- [ ] Implement status change notification email
- [ ] Implement comment notification email
- [ ] Test email sending (use Mailtrap or similar for testing)
- [ ] Optional: Implement email ingestion (IMAP) if time permits

#### Day 15: Comprehensive Testing
- [ ] Write unit tests for all models (target 80%+ coverage)
- [ ] Write integration tests for all API endpoints
- [ ] Test ticket lifecycle (create → assign → progress → resolve → close)
- [ ] Test SLA calculations and breach detection
- [ ] Test time entry billing rate resolution
- [ ] Test auto-assignment algorithm
- [ ] Achieve 80%+ test coverage

### Week 4: Documentation & Deployment (Days 16-17)

#### Day 16: API Documentation
- [ ] Install Swagger dependencies (swagger-jsdoc, swagger-ui-express)
- [ ] Create Swagger/OpenAPI 3.0 configuration
- [ ] Document all API endpoints (ticket, time-entry, comment, attachment)
- [ ] Add request/response examples
- [ ] Test Swagger UI: `http://10.255.20.15:3030/api-docs`

#### Day 17: Production Deployment
- [ ] Create PM2 ecosystem.config.js (cluster mode, 2 instances)
- [ ] Add graceful shutdown handlers
- [ ] Implement Redis connection verification
- [ ] Add PM2 management npm scripts (start, stop, restart, logs)
- [ ] Deploy to PM2: `npm run pm2:start`
- [ ] Test PM2 deployment (auto-restart, logs)
- [ ] Create load test suite (Artillery)
- [ ] Run load tests (target: 500+ RPS)
- [ ] Create DEPLOYMENT.md documentation
- [ ] Create comprehensive README.md
- [ ] Commit all changes and push to GitHub
- [ ] Create handover document for Frontend integration

---

## 🎯 Key API Endpoints to Implement

Based on `implementation/05-MODULE-Tickets.md`:

### Ticket Endpoints
```
GET    /api/v1/tickets              # List with pagination, filters
POST   /api/v1/tickets              # Create ticket
GET    /api/v1/tickets/:id          # Get ticket detail
PUT    /api/v1/tickets/:id          # Update ticket
PATCH  /api/v1/tickets/:id/status   # Update status (workflow validation)
PATCH  /api/v1/tickets/:id/assign   # Assign to user/team
DELETE /api/v1/tickets/:id          # Soft delete
```

### Time Entry Endpoints
```
GET    /api/v1/tickets/:id/time-entries        # List time entries
POST   /api/v1/tickets/:id/time-entries        # Create time entry
PUT    /api/v1/tickets/:id/time-entries/:teId  # Update time entry
DELETE /api/v1/tickets/:id/time-entries/:teId  # Delete time entry
```

### Comment Endpoints
```
GET    /api/v1/tickets/:id/comments     # List comments
POST   /api/v1/tickets/:id/comments     # Create comment
PUT    /api/v1/tickets/:id/comments/:commentId   # Update comment
DELETE /api/v1/tickets/:id/comments/:commentId   # Delete comment
```

### Attachment Endpoints
```
GET    /api/v1/tickets/:id/attachments           # List attachments
POST   /api/v1/tickets/:id/attachments           # Upload attachment
GET    /api/v1/tickets/:id/attachments/:attachId # Download attachment
DELETE /api/v1/tickets/:id/attachments/:attachId # Delete attachment
```

### Activity Timeline
```
GET    /api/v1/tickets/:id/activity    # Get full activity timeline
```

---

## 🔧 Critical Implementation Details

### 1. SLA Tracking (COMPLEX!)

**SLA Calculation Logic:**
```typescript
// When ticket is created:
// 1. Look up customer's contract
// 2. Get SLA from contract (or use default)
// 3. Calculate response due: created_at + sla.response_time_hours
// 4. Calculate resolution due: created_at + sla.resolution_time_hours
// 5. Adjust for business hours (Mon-Fri 9-17) if sla.business_hours_only = true
// 6. Store in ticket: sla_response_due, sla_resolution_due

// On every update:
// - Check if first_response_at is null and comment added → set first_response_at = now
// - Check if status changed to 'resolved' → set resolved_at = now
// - Check if now > sla_response_due and first_response_at is null → set sla_breached = true
// - Check if now > sla_resolution_due and resolved_at is null → set sla_breached = true
```

**Business Hours Calculation:**
- Skip weekends (Saturday, Sunday)
- Skip holidays (read from `holidays` table)
- Only count hours 09:00-17:00 in customer's timezone

### 2. Billing Rate Resolution (CRITICAL!)

Read `/opt/psa-putzi/BDUF/BDUF-Chapter3-Billing-Rate-Fix.md` for complete details!

**Rate Resolution Hierarchy:**
```
1. user_billing_rates (most specific match by customer_id, contract_id, service_level, work_type)
2. contracts.hourly_rate (contract default)
3. users.default_billing_rate (user default)
4. ERROR if no rate found
```

**Time Entry Storage (SNAPSHOT PATTERN):**
```typescript
// When creating time_entry, resolve BOTH rates and snapshot them:
{
  user_id: "...",
  billing_rate: 150.00,      // Rate charged to customer (from hierarchy)
  cost_rate: 75.00,          // MSP's internal cost (from users.internal_cost_rate)
  hours_worked: 2.5,
  billable: true,
  // DO NOT store references to user billing rates - snapshot the values!
}
```

**Why Snapshot?** So historical time entries don't change when rates are updated later.

### 3. Status Workflow Validation

**Valid Transitions:**
```typescript
const validTransitions = {
  'new': ['assigned', 'cancelled'],
  'assigned': ['in_progress', 'cancelled'],
  'in_progress': ['waiting_customer', 'waiting_vendor', 'resolved', 'cancelled'],
  'waiting_customer': ['in_progress', 'cancelled'],
  'waiting_vendor': ['in_progress', 'cancelled'],
  'resolved': ['closed', 'in_progress'],  // Can reopen
  'closed': ['in_progress'],               // Can reopen
  'cancelled': []                          // Terminal state
};

// Validate on PATCH /tickets/:id/status
if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new ValidationError(`Cannot transition from ${currentStatus} to ${newStatus}`);
}
```

### 4. Auto-Assignment Algorithm

**Round-Robin Assignment:**
```typescript
// 1. Get all eligible users (role: technician, active, not on vacation)
// 2. Filter by skills if ticket.category requires specific skills
// 3. Sort by: least assigned tickets (workload balancing)
// 4. Assign to top user
// 5. Publish event: ticket.assigned
// 6. Send email notification to assigned user
```

### 5. RabbitMQ Events to Publish

```typescript
// ticket.created
{ event: 'ticket.created', data: { ticket_id, customer_id, priority, title } }

// ticket.updated
{ event: 'ticket.updated', data: { ticket_id, changes: {...} } }

// ticket.assigned
{ event: 'ticket.assigned', data: { ticket_id, assigned_to, assigned_by } }

// ticket.status_changed
{ event: 'ticket.status_changed', data: { ticket_id, old_status, new_status } }

// ticket.resolved
{ event: 'ticket.resolved', data: { ticket_id, resolved_at, resolved_by } }

// ticket.sla_breached
{ event: 'ticket.sla_breached', data: { ticket_id, breach_type, due_date } }
```

---

## 📊 Testing Requirements

### Test Coverage Targets
- **Overall:** ≥80% (lines, functions, branches, statements)
- **Models:** ≥85% (critical business logic)
- **Controllers:** ≥75% (HTTP handlers)
- **Services:** ≥85% (SLA calculations, billing rate resolution)

### Test Suites to Create

**Unit Tests:**
```
tests/unit/models/ticket.model.test.ts          # Ticket CRUD
tests/unit/models/time-entry.model.test.ts      # Time entry + billing rates
tests/unit/models/comment.model.test.ts         # Comment CRUD
tests/unit/services/sla.service.test.ts         # SLA calculations (CRITICAL!)
tests/unit/services/billing-rate.service.test.ts # Rate resolution (CRITICAL!)
tests/unit/services/assignment.service.test.ts  # Auto-assignment logic
tests/unit/validators/ticket.validator.test.ts  # Joi validation
```

**Integration Tests:**
```
tests/integration/ticket.routes.test.ts         # All ticket endpoints
tests/integration/time-entry.routes.test.ts     # Time entry endpoints
tests/integration/comment.routes.test.ts        # Comment endpoints
tests/integration/attachment.routes.test.ts     # Attachment upload/download
tests/integration/workflow.test.ts              # Full ticket lifecycle
tests/integration/sla-tracking.test.ts          # SLA breach detection
```

**Load Tests (Artillery):**
```
load-tests/basic-load.yml      # 50 RPS for 2 minutes
load-tests/spike-test.yml      # Spike to 200 RPS
load-tests/stress-test.yml     # 500 RPS sustained
```

---

## 🎓 Learning from CRM Service (Senior-3)

**What Senior-3 Did Exceptionally Well:**

1. **Project Structure:** Clean organization (controllers/, services/, models/, middleware/, routes/)
2. **Multi-Tenancy:** Every query includes `tenant_id WHERE deleted_at IS NULL`
3. **Soft Delete:** Never hard delete - always set `deleted_at = NOW()`
4. **Pagination:** Consistent pattern (page, limit, total_pages, total_items)
5. **Validation:** Joi schemas for create, update, filters
6. **Auto-Generated IDs:** Customer numbers (CUS-0001) - you'll do TIC-0001
7. **Events:** RabbitMQ publishing on create/update/delete
8. **Tests:** 141 tests (95 unit + 46 integration) = 83.7% coverage
9. **Documentation:** Swagger + comprehensive README
10. **Deployment:** PM2 cluster mode with graceful shutdown

**Copy These Patterns:**
- `services/crm-service/src/models/customer.model.ts` → Your ticket.model.ts
- `services/crm-service/src/controllers/customer.controller.ts` → Your ticket.controller.ts
- `services/crm-service/src/validators/customer.validator.ts` → Your ticket.validator.ts
- `services/crm-service/tests/` → Your test structure

---

## 🚨 Common Pitfalls to Avoid

### 1. Billing Rate Resolution
❌ **DON'T:** Reference `users.internal_cost_rate` in time_entries
✅ **DO:** Snapshot both `billing_rate` and `cost_rate` when creating time_entry

### 2. SLA Calculations
❌ **DON'T:** Use simple `created_at + X hours`
✅ **DO:** Account for business hours, weekends, holidays, timezones

### 3. Status Transitions
❌ **DON'T:** Allow any status change
✅ **DO:** Validate transitions with `validTransitions` map

### 4. Multi-Tenancy
❌ **DON'T:** Forget `tenant_id` in WHERE clauses
✅ **DO:** Always include `WHERE tenant_id = ? AND deleted_at IS NULL`

### 5. Soft Delete
❌ **DON'T:** Use `DELETE FROM tickets`
✅ **DO:** Use `UPDATE tickets SET deleted_at = NOW()`

### 6. Time Zone Handling
❌ **DON'T:** Store times in local timezone
✅ **DO:** Always store in UTC, convert for display

### 7. Test Coverage
❌ **DON'T:** Write tests at the end
✅ **DO:** Write tests alongside implementation (TDD approach)

---

## 🔗 Integration Points

### With Auth Service (port 3001)
- JWT validation (copy middleware from gateway)
- User lookup for assignments
- RBAC: Technicians can view/edit tickets, Customers can only view their own

### With CRM Service (port 3002)
- Customer lookup (validate customer_id exists)
- Contact lookup
- Location lookup
- Contract lookup (for SLA)

### With API Gateway (port 3000)
- All requests proxied through gateway
- Gateway handles rate limiting
- Gateway handles JWT validation (but you should validate too)

### With Frontend (port 5173)
- Junior-5 has already built ticket UI (using mock data)
- When your API is ready, Junior-5 will integrate
- API must match schemas expected by frontend

### With RabbitMQ
- Publish events on all ticket lifecycle changes
- Other services will consume these events (notifications, analytics)

---

## 📝 Definition of Done

Before marking TICKETS-001 as complete, ensure:

- [ ] All API endpoints implemented and tested
- [ ] Ticket CRUD with status workflow validation
- [ ] SLA tracking (response & resolution)
- [ ] Time entries with billing rate resolution
- [ ] Comments & activity timeline
- [ ] File attachments (upload/download)
- [ ] Auto-assignment algorithm
- [ ] RabbitMQ event publishing
- [ ] Email notifications (ticket created, status changed)
- [ ] ≥80% test coverage (overall)
- [ ] All tests passing (unit + integration)
- [ ] TypeScript builds with 0 errors
- [ ] Swagger/OpenAPI documentation complete
- [ ] PM2 deployment (cluster mode, 2 instances)
- [ ] Load testing complete (500+ RPS target)
- [ ] DEPLOYMENT.md and README.md created
- [ ] All code committed and pushed to GitHub
- [ ] Handover document created for Frontend integration
- [ ] Status file updated with final results

---

## 🎯 Support & Resources

### Available Support
- **@Senior-2 (Auth):** JWT patterns, authentication questions
- **@Senior-3 (CRM):** Similar service architecture, event publishing, testing patterns
- **@Senior-4 (Gateway):** Proxy configuration, circuit breaker integration
- **@Junior-5 (Frontend):** API contract questions, integration testing
- **@Main-Agent (PM):** Architecture decisions, priority conflicts, blockers

### Response Time SLA
- 🔴 Critical Blocker: < 1 hour (Main Agent)
- 🟡 Important Issue: < 2 hours (Senior agents)
- 🟢 Normal Question: < 4 hours (Any agent)

### Communication
- **Issues:** Create in `.subagents/issues/YYYY-MM-DD-description.md`
- **Status Updates:** Update `.subagents/ACTIVE-TODOS.md` daily
- **Blockers:** @mention relevant agent in issue file
- **Questions:** Check CRM service code first, then ask Senior-3

---

## 🚀 Getting Started Checklist

**Before Writing Code:**
- [ ] Read CLAUDE.md completely
- [ ] Read implementation/05-MODULE-Tickets.md completely
- [ ] Read BDUF-Chapter3.md (tickets, time_entries, slas tables)
- [ ] Read BDUF-Chapter3-Billing-Rate-Fix.md (CRITICAL for time entries!)
- [ ] Review CRM service code (services/crm-service/)
- [ ] Check ACTIVE-TODOS.md for your task list

**Day 1 Goals:**
- [ ] Project structure created
- [ ] npm project initialized
- [ ] Dependencies installed
- [ ] TypeScript configuration
- [ ] .env file created
- [ ] Health endpoint working
- [ ] Ticket model created (CRUD operations)
- [ ] First commit and push

---

## 📈 Success Metrics

**Velocity Expectations:**
Based on Senior-3 (CRM) and Senior-4 (Gateway) performance:
- Estimated: 4 weeks (17 days)
- **Target:** Complete in 1 week or less! 🚀
- Previous agents averaged 5-10x faster than estimates

**Quality Expectations:**
- Test coverage: ≥80% (match or exceed CRM's 83.7%)
- Performance: ≥500 RPS (Gateway achieved 964 RPS)
- Clean code: 0 TypeScript errors
- Documentation: Comprehensive Swagger + README

**Team Impact:**
- Enable Junior-5 to integrate ticket UI with real backend
- Enable Phase 2 modules (Billing depends on time_entries)
- Demonstrate exceptional velocity (maintain 3+ weeks ahead schedule)

---

## 🎉 Good Luck!

You're joining an **exceptional team** that's consistently exceeding expectations:
- 🏆 Senior-4 (Gateway): 100% in 5 hours (estimated 2 weeks)
- 🏆 Senior-3 (CRM): 100% in 7 hours (estimated 2 weeks)
- 🏆 Junior-5 (Frontend): 95% complete, phenomenal velocity

**Your mission:** Build a production-ready Tickets service with the same quality and speed!

**Remember:**
- Quality > Speed (but this team achieves both!)
- Test as you code (don't save for later)
- Ask questions early (support is available)
- Document as you go (future you will thank you)
- Learn from CRM service code (your best reference)

**We believe in you!** Let's make TICKETS-001 another exceptional success story! 🚀

---

**Launch Prepared By:** Main Agent (Project Manager)
**Launch Date:** 2025-11-05 20:30 UTC
**Status:** Ready to launch Senior-5
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (unified with all agents)

**Next Step:** User launches Senior-5 with the start prompt below! 🚀
