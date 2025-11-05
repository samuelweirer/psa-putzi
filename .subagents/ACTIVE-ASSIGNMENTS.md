# Active Sub-Agent Assignments

**Last Updated:** 2025-11-04 21:25 UTC
**Main Agent:** Project Manager (Claude Opus 4)
**Project Phase:** Sprint 2 - Auth Module + Frontend Development (Parallel)
**Unified Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (both agents)
**Agent Config:** `.subagents/agent-config.json`

## 🔄 Branch Strategy Update

**Previous:** Each agent on separate branch → merge conflicts later
**Current:** Both agents on unified branch `claude/session-011CUa86VGPkHjf5rHUmwfvG`

**Benefits:**
- ✅ Always in sync with latest code
- ✅ Test integration immediately
- ✅ No merge conflicts
- ✅ Cleaner git history

---

## Agent Hierarchy

```
                Main Agent (PM)
                 Claude Opus 4
               (Strategic Coord)
                      |
        +-------------+-------------+
        |                           |
   Senior Developers           Junior Developers
   Claude Sonnet 4.5          Claude Haiku 4.5
   (Complex/Critical)         (UI/CRUD/Learning)
        |                           |
   +----+----+                  +---+---+
   |    |    |                  |       |
  Infra Auth Backend          Frontend Auxiliary
  (S-1) (S-2) (S-3)            (J-5)    (J-6)
        Gateway
         (S-4)
```

---

## Overview

This document tracks all active sub-agent assignments for PSA-Platform development. Agents work in parallel on different modules while the **Main Agent (Project Manager)** handles strategic coordination and quality oversight.

### Agent Types

- **Main Agent (Opus 4):** Project Manager - Strategic decisions, coordination, quality gates
- **Senior Developers (Sonnet 4.5):** Complex, security-critical, high-risk modules
- **Junior Developers (Haiku 4.5):** UI development, CRUD operations, well-defined tasks

---

## Active Assignments

### 🔴 P0 - Critical Path (Must Complete First)

#### INFRA-001: Infrastructure Setup
- **Status:** ✅ COMPLETED (2025-11-04)
- **Agent Type:** Senior Developer 1 (Infrastructure Architect)
- **AI Model:** Claude Sonnet 4.5
- **Priority:** P0 (Blocker for all development)
- **Complexity:** ⭐⭐⭐⭐⭐ Very High
- **Risk Level:** Critical
- **Actual Duration:** ~2 hours
- **Handover Document:** `.subagents/handovers/01-infra-to-auth.md`
- **Status Report:** `.subagents/status/infrastructure-2025-11-04.md`
- **Branch:** `feature/infrastructure-setup` (merged)
- **Completed Tasks:**
  - ✅ Container 200 (psa-all-in-one) operational
  - ✅ PostgreSQL 15.14 with 17 production tables
  - ✅ Redis 7.0.15 with password auth and persistence
  - ✅ RabbitMQ 3.12.1 with management plugin
  - ✅ Node.js 20.19.5 LTS + PM2 6.0.13
  - ✅ Database schema applied (all tables created)
  - ✅ Health check script created and tested
  - ✅ Backup script created and tested
  - ✅ Complete documentation (SETUP-NOTES.md, QUICK-START.md)
- **Deliverable:** ✅ Fully operational infrastructure container
- **Enabled:** AUTH-001 (in progress), all future modules

---

#### AUTH-001: Authentication & Authorization Module
- **Status:** 🎉 97% COMPLETE - PRODUCTION READY! OAuth2, 80.5% coverage, Swagger, PM2, Redis rate limiting ✅
- **Agent Type:** Senior Developer 2 (Security Specialist)
- **AI Model:** Claude Sonnet 4.5
- **Priority:** P0 (Blocker for all other modules)
- **Complexity:** ⭐⭐⭐⭐⭐ Very High
- **Risk Level:** Critical (Security)
- **Estimated Duration:** 3-4 weeks (Started: 2025-11-04)
- **Current Week:** Week 1 of 3-4 (Sprint 2)
- **Handover Document:** `.subagents/handovers/02-auth-module-handover.md`
- **Implementation Guide:** `implementation/02-MODULE-Auth.md`
- **Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` ⬅️ UNIFIED BRANCH (shared with frontend)
- **Code Location:** `services/auth-service/` (25 TypeScript files + 2 migrations)
- **Deployment:** ✅ Running on PM2 (PID: 120087, port 3001)
- **Last Updated:** 2025-11-05 09:40 UTC
- **Dependencies:** ✅ INFRA-001 (completed)

**✅ Completed Tasks (Week 1) - 97% Complete:**
  - ✅ Project structure created (TypeScript + Express)
  - ✅ All 25 source files fully implemented
  - ✅ ESLint 9 flat config + Prettier configured
  - ✅ Vitest test framework setup
  - ✅ npm dependencies installed (51 packages including OAuth + Passport)
  - ✅ Local authentication (email/password) - COMPLETE
  - ✅ JWT token management (access + refresh with unique jti) - COMPLETE
  - ✅ Multi-Factor Authentication (TOTP + recovery codes) - COMPLETE
  - ✅ Password management (reset, change, validation) - COMPLETE
  - ✅ User profile management - COMPLETE
  - ✅ OAuth2 Google integration - COMPLETE
  - ✅ OAuth2 Microsoft integration - COMPLETE
  - ✅ OAuth database migration applied
  - ✅ RBAC middleware with 23 roles - COMPLETE
  - ✅ **Rate limiting (Redis-based) - DEPLOYED & TESTED!** ⬅️ NEW! (2025-11-05)
  - ✅ Error handling middleware - COMPLETE
  - ✅ All 16 API endpoints implemented - COMPLETE (12 local + 4 OAuth)
  - ✅ Service builds successfully (TypeScript compilation) - COMPLETE
  - ✅ Service starts and connects to PostgreSQL - COMPLETE
  - ✅ .env configuration complete - COMPLETE
  - ✅ Graceful shutdown handling - COMPLETE
  - ✅ Logging with Winston - COMPLETE
  - ✅ **Unit tests:** 145/145 passing (+10 refresh token model tests) ⬅️ NEW!
  - ✅ **Integration tests:** 30/30 passing (including MFA flow)
  - ✅ **Test coverage:** 80.5% (✅ EXCEEDED 80% target!) ⬅️ NEW!
  - ✅ **Swagger/OpenAPI documentation:** Complete for all 16 endpoints ⬅️ NEW!
  - ✅ **PM2 Production Deployment:** Running (PID 55270, auto-restart enabled) ⬅️ NEW!
  - ✅ **Register endpoint verified:** Working correctly ⬅️ NEW!
  - ✅ MFA blocker resolved: Duplicate token hash issue fixed
  - ✅ **Password validation bug fixed:** 8-char minimum (spec-compliant) ⬅️ NEW! (2025-11-05)
  - ✅ **Redis deployed:** Rate limiting active and tested ⬅️ NEW! (2025-11-05)

**📝 Implementation Details:**
  - **Auth Service**: 335 lines - register, login, refresh, logout, password reset/change
  - **JWT Service**: 125 lines - token generation with unique jti, verification, hashing
  - **Password Service**: 97 lines - bcrypt hashing, policy validation
  - **MFA Service**: 89 lines - TOTP setup, QR codes, recovery codes
  - **User Model**: 318 lines - CRUD, MFA, OAuth methods, account locking, pagination
  - **Refresh Token Model**: 98 lines - token lifecycle, cleanup
  - **Auth Controller**: 349 lines - all 12 local auth endpoints
  - **OAuth Controller**: 97 lines - all 4 OAuth endpoints (NEW!)
  - **OAuth Service**: 161 lines - Google + Microsoft strategies (NEW!)
  - **Auth Routes**: 45 lines - all local auth routes
  - **OAuth Routes**: 38 lines - all OAuth routes (NEW!)
  - **Middleware**: 4 files (auth, error, rate-limit, RBAC)
  - **Migrations**: 2 files (initial schema + OAuth columns)
  - **Tests**: 165 tests passing (135 unit + 30 integration)

**🔧 Recent Work (2025-11-05 Morning - NEW!):**
  - ✅ **Password validation bug fixed** (Issue #2025-11-05-auth-password-length-validation)
    - Fixed minimum from 12 → 8 characters (spec-compliant)
    - Updated .env, config.ts, auth.validator.ts
    - Tested: 8 chars ✅, 9 chars ✅, 7 chars rejected ✅
    - Resolved in 25 minutes!
  - ✅ **Redis deployed and operational**
    - Fixed Redis AOF startup issue (disabled for stability)
    - Started Redis service successfully
    - Restarted auth service - now connected to Redis
    - Rate limiting tested and working! (5 attempts → 429 status)
  - ✅ **Status documentation updated**
    - Updated auth-remaining-work.md (75% → 97%)
    - Created comprehensive final status report
    - All git commits pushed to unified branch
  - ✅ **Both frontend issues resolved**
    - Register endpoint issue: ✅ Fixed
    - Password validation issue: ✅ Fixed

**🔧 Previous Work (2025-11-04 Evening):**
  - ✅ OAuth2 Google integration complete (passport strategy)
  - ✅ OAuth2 Microsoft integration complete (passport strategy)
  - ✅ Database migration for OAuth columns (oauth_provider, oauth_provider_id)
  - ✅ User model OAuth methods (find, link, create OAuth users)
  - ✅ 4 new OAuth API endpoints (initiate + callback for each provider)
  - ✅ Integrated with frontend branch (unified development)
  - ✅ **Test coverage improvements: 69% → 80.5% (+11.5%)** ⬅️ COMPLETE!
    - ✅ 28 RBAC middleware tests (0% → 90.36%)
    - ✅ 8 OAuth service tests (36.87% → 61.87%)
    - ✅ 10 Refresh token model tests (60% → 100%)
  - ✅ **Swagger/OpenAPI 3.0 documentation created** ⬅️ NEW!
    - ✅ Interactive Swagger UI: http://localhost:3001/api-docs
    - ✅ All 16 endpoints documented with examples
    - ✅ Complete schemas for User, AuthTokens, Error
    - ✅ Security definitions (Bearer JWT)
  - ✅ **PM2 deployment complete** ⬅️ NEW!
    - ✅ Installed missing passport runtime modules
    - ✅ ecosystem.config.js configured
    - ✅ Service running on port 3001 (PID: 55270)
    - ✅ Auto-restart enabled
    - ✅ Logging to /tmp/auth-service*.log
  - ✅ **Register endpoint issue resolved** ⬅️ NEW!
    - Root cause: Passport modules not installed
    - Verified working with test user creation
    - Frontend can now test registration flow
  - ✅ All commits pushed to GitHub

**⚪ Remaining Tasks (3% - Optional):**
  - ⚪ OAuth client secrets configuration (for production use)
    - Google OAuth client ID/secret
    - Microsoft OAuth client ID/secret
    - Currently: OAuth endpoints exist but not configured
    - Owner: DevOps/Infrastructure team
    - Estimated: 30-60 minutes (configuration only, no code changes)

**📊 Progress:** 🎉 97% complete - PRODUCTION READY!
- **Sprint Status:** ✅ Ahead of schedule! Week 1 complete + Week 2 started
- **Test Status:** ✅ All 175 tests passing (145 unit + 30 integration)
- **Test Coverage:** ✅ 80.5% (exceeded 80% target)
- **Build Status:** ✅ Clean (0 TypeScript errors)
- **Deployment Status:** ✅ Running on PM2 (port 3001, PID: 120087)
- **Redis Status:** ✅ Active and rate limiting working (NEW!)
- **API Documentation:** ✅ Swagger UI available at /api-docs
- **Critical Bugs:** ✅ Zero (all issues resolved)
- **Blockers:** ✅ None - all teams unblocked
- **Branch:** ✅ Unified with frontend agent
- **Frontend Ready:** ✅ Backend operational, both issues resolved

**Deliverable:** Production-ready auth service with JWT, MFA, RBAC, OAuth2

**Completed Steps:**
  1. ✅ Test coverage 80%+ - COMPLETE! (80.5%)
  2. ✅ Swagger API documentation - COMPLETE!
  3. ✅ PM2 deployment - COMPLETE!
  4. ✅ OAuth2 integration - COMPLETE!
  5. ✅ RBAC middleware tests - COMPLETE!
  6. ✅ OAuth service tests - COMPLETE!
  7. ✅ Refresh token model tests - COMPLETE!
  8. ✅ Register endpoint - COMPLETE & VERIFIED!
  9. ✅ Password validation bug - FIXED! (2025-11-05)
  10. ✅ Redis deployment - COMPLETE! (2025-11-05)
  11. ✅ Rate limiting tested - WORKING! (2025-11-05)
  12. ✅ Frontend integration - Backend ready, both issues resolved!
  13. ✅ Enables: GATEWAY-001, CRM-001, TICKETS-001 - READY!

**Current Status:**
  - 🎉 **AUTH-001 is PRODUCTION READY at 97%**
  - ⬅️ Standing by to support Senior-4 (Gateway) and Junior-5 (Frontend)
  - ⚪ Optional: Configure OAuth client secrets (DevOps task)

---

### 🟠 P1 - High Priority (Can Start After P0)

#### GATEWAY-001: API Gateway & Routing
- **Status:** 🟢 ACTIVE - Day 4 COMPLETE! (2025-11-05)
- **Agent Type:** Senior Developer 4 (Integration Specialist)
- **AI Model:** Claude Sonnet 4.5
- **Priority:** P1 (High - Critical Path)
- **Complexity:** ⭐⭐⭐⭐ High
- **Risk Level:** High
- **Estimated Duration:** 2 weeks (6 days active)
- **Start Date:** 2025-11-05
- **Target Completion:** 2025-11-19
- **Module Guide:** `implementation/03-MODULE-API-Gateway.md`
- **Launch Document:** `.subagents/LAUNCH-SENIOR-4-GATEWAY.md`
- **Handover Document:** `.subagents/handovers/05-auth-to-gateway.md`
- **Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` ⬅️ UNIFIED BRANCH
- **Code Location:** `services/api-gateway/` ✅ Created with 2,385 lines of code
- **Port:** 3000 (API Gateway main endpoint)
- **Dependencies:** ✅ AUTH-001 (97% complete), ✅ INFRA-001 (complete)

**✅ Completed Tasks (Day 1-4):**
  - ✅ Project structure setup (TypeScript + Express) - Day 1
  - ✅ Basic routing to auth service (port 3001) - Day 1
  - ✅ Health check endpoints - Day 1
  - ✅ Request/response logging (Winston) - Day 1
  - ✅ CORS configuration - Day 1
  - ✅ Security headers (helmet) - Day 1
  - ✅ Error handling middleware - Day 1
  - ✅ Service discovery/registry - Day 1
  - ✅ JWT validation middleware integration - Day 2
  - ✅ RBAC enforcement (23 roles) - Day 2
  - ✅ Protected route examples - Day 2
  - ✅ Testing with real JWT tokens - Day 2
  - ✅ Request ID tracking - Day 1-2
  - ✅ Proxy body forwarding (POST/PUT/PATCH) - Day 1
  - ✅ Rate limiting (Redis-based, 5 limiters) - Day 3
  - ✅ Global rate limiter (100 req/15min) - Day 3
  - ✅ Auth rate limiter (5 req/15min, brute force protection) - Day 3
  - ✅ User rate limiter (1000 req/15min) - Day 3
  - ✅ RateLimit-* headers in responses - Day 3
  - ✅ Circuit breaker pattern (CLOSED/OPEN/HALF_OPEN) - Day 4
  - ✅ Per-service circuit breakers with failure tracking - Day 4
  - ✅ Enhanced health checks with circuit status - Day 4
  - ✅ Automatic failure detection and recovery - Day 4
  - ✅ 503 responses when circuits are OPEN - Day 4

**⚪ Remaining Tasks (Day 5-6):**
  - ⚪ Integration tests - Day 5
  - ⚪ API documentation (Swagger) - Day 5
  - ⚪ PM2 deployment - Day 6
  - ⚪ Load testing - Day 6

**📊 Progress:** 67% complete (Day 1-4 done, 2 days remaining)
- **Sprint Status:** ✅ AHEAD of schedule (Day 4 complete same day!)
- **Code Metrics:** 2,385 lines across 15 files
- **Commits:** 4 (d8281ef, 812ccc0, e357a9d, d33259d) - all pushed to GitHub
- **Next Milestone:** Integration tests & API docs Day 5
- **Blockers:** None
- **Support Available:** Senior-2 (auth), Main Agent (PM)

**Deliverable:** API Gateway routing all requests on port 3000
**Mentoring:** Reviews API designs for Junior-5, integration patterns

**Next Steps:**
  1. Read handover document (05-auth-to-gateway.md)
  2. Read module guide (03-MODULE-API-Gateway.md)
  3. Create project structure
  4. Implement basic Express app with health check
  5. Set up proxy to auth service (port 3001)
  6. Test basic routing
  7. Daily status updates

---

#### CRM-001: Customer Relationship Management
- **Status:** ⚪ Pending - Waiting for GATEWAY-001
- **Agent Type:** Senior Developer 3 (Backend Architect)
- **AI Model:** Claude Sonnet 4.5
- **Priority:** P1
- **Complexity:** ⭐⭐⭐⭐ High
- **Risk Level:** High (Core business logic)
- **Estimated Duration:** 3 weeks (10 days active)
- **Module Guide:** `implementation/04-MODULE-CRM.md`
- **Branch:** `feature/crm-module`
- **Dependencies:** AUTH-001, GATEWAY-001
- **Tasks:**
  - Customer management (CRUD)
  - Contact management (CRUD)
  - Location management (CRUD)
  - Customer hierarchies
  - Full-text search (Elasticsearch)
  - Custom fields (JSONB)
  - Multi-tenancy support
  - RabbitMQ event publishing
- **Deliverable:** CRM service with REST API
- **Mentoring:** Reviews business logic, API design, performance

---

#### TICKETS-001: Ticketing & Service Desk
- **Status:** ⚪ Pending - Waiting for CRM-001
- **Agent Type:** Senior Developer 3 (Backend Architect)
- **AI Model:** Claude Sonnet 4.5
- **Priority:** P1
- **Complexity:** ⭐⭐⭐⭐ High
- **Risk Level:** High (Complex SLA calculations)
- **Estimated Duration:** 4 weeks (17 days active)
- **Module Guide:** `implementation/05-MODULE-Tickets.md`
- **Branch:** `feature/tickets-module`
- **Dependencies:** AUTH-001, CRM-001
- **Tasks:**
  - Ticket lifecycle management
  - SLA tracking (response & resolution times)
  - Time entries with billing rate resolution
  - Comments & attachments
  - Auto-assignment algorithm
  - Status workflow validation
  - Email notifications (SMTP)
  - Email ingestion (IMAP)
  - RabbitMQ event publishing
- **Deliverable:** Tickets service with full SLA tracking
- **Mentoring:** Reviews SLA calculations, email integration

---

### 🟡 P2 - Medium Priority (UI Development - Can Run in Parallel)

#### FRONTEND-001: React Application
- **Status:** 🟡 15% COMPLETE - Project setup done, auth UI in progress
- **Agent Type:** Junior Developer 5 (Frontend Developer)
- **AI Model:** Claude Haiku 4.5 (parallel with Senior-2)
- **Priority:** P0 (Parallel development with AUTH-001)
- **Complexity:** ⭐⭐⭐ Medium
- **Risk Level:** Low-Medium
- **Estimated Duration:** Weeks 1-10 (Started: 2025-11-04, parallel)
- **Module Guide:** `implementation/13-MODULE-Frontend.md`
- **Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` ⬅️ UNIFIED BRANCH (shared with auth)
- **Code Location:** `frontend/` (React + Vite + TypeScript project)
- **Dependencies:** ✅ AUTH-001 (16 endpoints ready for integration)
**✅ Completed Tasks (Week 1 - Day 1):**
  - ✅ React + Vite + TypeScript project initialized
  - ✅ Tailwind CSS configured for styling
  - ✅ Project structure organized (components, pages, contexts, lib)
  - ✅ API client configured (axios, connects to localhost:3001)
  - ✅ Type definitions created (auth.types.ts)
  - ✅ Environment configuration (.env, .env.example)
  - ✅ ESLint + package.json setup

**⚪ In Progress (Week 1 - Day 2):**
  - 🔄 Login page UI implementation
  - ⚪ AuthContext for global auth state
  - ⚪ Register page
  - ⚪ MFA verification UI
  - ⚪ Password reset flow
  - ⚪ Protected routes component

**📊 Progress:** 15% complete (setup phase)
- **Sprint Status:** On track with Day 1 plan
- **Next:** Build Login page with real API integration
- **Branch:** ✅ Unified with auth backend (real-time sync)

**Remaining Tasks:**
  - Design system components (shadcn/ui)
  - Authentication UI completion (login, register, MFA)
  - CRM pages (Customer list, details, create)
  - Ticket pages (List, detail, create)
  - Dashboard and analytics views
  - Responsive design (mobile-first)
  - E2E tests (Playwright)

**Deliverable:** Complete React application with responsive UI
- **Supervision:**
  - Senior-2 (Security) reviews auth flows
  - Senior-3 (Backend) reviews API integrations
  - Main Agent approves UI/UX decisions
- **Growth Opportunities:** API integration, state management, testing patterns

---

### 🟢 P3 - Low Priority (Phase 2 - After MVP)

#### BILLING-001: Billing & Invoicing
- **Status:** ⚪ Pending - Phase 2 (Week 10+)
- **Agent Type:** Junior Developer 6 (Auxiliary Developer)
- **AI Model:** Claude Haiku 4.5
- **Priority:** P3
- **Complexity:** ⭐⭐ Low-Medium
- **Risk Level:** Low
- **Module Guide:** `implementation/06-MODULE-Billing.md`
- **Branch:** `feature/billing-module`
- **Dependencies:** CRM-001, TICKETS-001
- **Supervision:** Senior-1 (database schemas), Senior-3 (business logic)

#### PROJECTS-001: Project Management
- **Status:** ⚪ Pending - Phase 2 (Week 11+)
- **Agent Type:** Junior Developer 6 (Auxiliary Developer)
- **AI Model:** Claude Haiku 4.5
- **Priority:** P3
- **Complexity:** ⭐⭐ Low-Medium
- **Risk Level:** Low
- **Module Guide:** `implementation/07-MODULE-Projects.md`
- **Supervision:** Senior-3 (business logic), Main Agent (approvals)

#### ASSETS-001: Asset Management
- **Status:** ⚪ Pending - Phase 2 (Week 12+)
- **Agent Type:** Junior Developer 6 (Auxiliary Developer)
- **AI Model:** Claude Haiku 4.5
- **Priority:** P3
- **Complexity:** ⭐⭐ Low-Medium
- **Risk Level:** Low
- **Module Guide:** `implementation/08-MODULE-Assets.md`
- **Supervision:** Senior-1 (database), Senior-3 (business logic)

---

## Main Agent Tasks (Ongoing)

**Current Focus:** Sprint 2 coordination, AUTH-001 completion, documentation

### ✅ Completed by Main Agent
- [x] BDUF documentation (20 chapters)
- [x] Implementation guides (Phase 1: 5 modules)
- [x] Sub-agent coordination system setup
- [x] Deployment strategy (single container → production)
- [x] Git workflow documentation
- [x] Handover templates created
- [x] Agent roles configuration (agent-config.json)
- [x] Resolved MFA integration test blocker (1 hour)
- [x] Enhanced CLAUDE.md with practical commands
- [x] Created comprehensive PM status report

### 🔄 In Progress by Main Agent
- [ ] Monitor Sprint 2 progress (AUTH-001)
- [ ] Coordinate test coverage improvements (69% → 80%)
- [ ] Plan OAuth2 integration approach
- [ ] Review and approve handovers
- [ ] Quality gate reviews
- [ ] Weekly status reporting

### 🗓️ Planned by Main Agent
- [ ] Create remaining Phase 2 module guides (4 modules)
  - Billing (BILLING-001)
  - Projects (PROJECTS-001)
  - Assets (ASSETS-001)
  - Reports (REPORTS-001)
- [ ] Create Phase 3 module guides (3 modules)
  - vCIO (VCIO-001)
  - Workflows (WORKFLOWS-001)
  - AI/LLM (AI-001)
- [ ] Detailed sprint planning documentation
- [ ] Milestone tracking system
- [ ] Risk management documentation
- [ ] Quality assurance process definition

---

## Timeline & Dependencies

```
Week 1-2: Infrastructure + Auth Development
├── INFRA-001 (2-4 hours) ────────────────┐
└── AUTH-001 (Week 1-4) ──────────────────┤ (75% complete)
                                          │
Week 3-4: Gateway + Frontend Start        │
├── GATEWAY-001 (Week 3-4) ───────────────┤─ Depends on AUTH-001
├── FRONTEND-001 (starts Week 3) ─────────┤─ Parallel development
└── Main Agent: Planning & Coordination   │
                                          │
Week 5-7: CRM Development                 │
├── CRM-001 (Week 5-7) ───────────────────┤─ Depends on GATEWAY-001
├── FRONTEND-001 (CRM UI) ────────────────┤─ Parallel with backend
└── Main Agent: Quality gates             │
                                          │
Week 8-11: Tickets Development            │
├── TICKETS-001 (Week 8-11) ──────────────┤─ Depends on CRM-001
├── FRONTEND-001 (Ticket UI) ─────────────┤─ Parallel with backend
└── Main Agent: Integration oversight     │
                                          │
Week 12+: Phase 2 Modules                 │
└── (Billing, Projects, Assets, Reports)  │
```

---

## Communication Protocol

### Daily Updates
All agents should:
- ✅ Update status files daily (`.subagents/status/agent-{id}-{name}.md`)
- ✅ Push code at end of day
- ✅ Check for blockers in other agents' status files
- ✅ Respond to `@mentions` in issues within SLA

### Weekly Status Reports
Every Friday, create status update:
```bash
cp templates/TEMPLATE-status-update.md .subagents/status/{agent}-week{N}.md
# Fill in template with week's progress
git add .subagents/status/{agent}-week{N}.md
git commit -m "docs: weekly status update for {agent}"
git push
```

### Issue Reporting
For blockers or questions:
```bash
cp templates/TEMPLATE-issue.md .subagents/issues/YYYY-MM-DD-{description}.md
# Fill in template with severity (🔴/🟡/🟢)
# @mention relevant agents
git add .subagents/issues/YYYY-MM-DD-{description}.md
git commit -m "docs: report issue - {description}"
git push
```

### Handovers
When completing work that others depend on:
```bash
cp templates/TEMPLATE-handover.md .subagents/handovers/{NN}-{from}-to-{to}.md
# Fill in with setup instructions, API docs, gotchas
git add .subagents/handovers/{NN}-{from}-to-{to}.md
git commit -m "docs: handover to {next} agent"
git push
```

---

## Resource Allocation

### Container Resources (Container 200: psa-all-in-one)
- **Total:** 16 cores, 64GB RAM, 1TB storage
- **PostgreSQL:** ~4GB RAM, 4 cores
- **Redis:** ~2GB RAM, 1 core
- **RabbitMQ:** ~2GB RAM, 1 core
- **Elasticsearch:** ~4GB RAM, 4 cores (deferred for MVP)
- **Node.js services:** ~20GB RAM, 6 cores (PM2 managed)
- **System/OS:** ~32GB RAM remaining

### Agent Capacity
- **Main Agent (PM):** Full-time coordination (always available)
- **Senior Developers:** 1 agent active at a time (sequential)
- **Junior Developers:** Can work in parallel with seniors
- **Parallel Work:** Frontend + Backend can be developed simultaneously

### Development Branches
Each agent works on their own feature branch:
- **Infrastructure:** `feature/infrastructure-setup` (✅ merged)
- **Auth:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (🟡 active)
- **Gateway:** `feature/api-gateway` (⚪ pending)
- **CRM:** `feature/crm-module` (⚪ pending)
- **Tickets:** `feature/tickets-module` (⚪ pending)
- **Frontend:** `feature/frontend` (⚪ pending)
- **Phase 2:** TBD

**Merge Criteria:**
- ✅ All tests pass (≥70% coverage for juniors, ≥80% for seniors)
- ✅ Code review approved (senior review for juniors, PM review for seniors)
- ✅ Definition of Done met (see agent-config.json)
- ✅ Integration tests with other modules pass
- ✅ Main Agent (PM) final approval

---

## Success Metrics

### Phase 1 (MVP) Completion Criteria
- [ ] Infrastructure operational (INFRA-001) ✅
- [ ] Auth module production-ready (AUTH-001) 🟡 75%
- [ ] API Gateway routing all requests (GATEWAY-001) ⚪
- [ ] CRM module functional (CRM-001) ⚪
- [ ] Tickets module with SLA tracking (TICKETS-001) ⚪
- [ ] Frontend with responsive UI (FRONTEND-001) ⚪
- [ ] All modules deployed on Container 200
- [ ] All modules running on PM2
- [ ] Integration tests passing
- [ ] End-to-end flow working (create customer → create ticket → log time)
- [ ] Health checks green
- [ ] Backups configured
- [ ] Documentation complete

**Target Date:** 2025-12-31 (3 months from 2025-10-01)

**Current Progress:** 15% overall (1.5 of 10 weeks complete)

---

## Questions & Support

- **Architecture questions:** Review BDUF documentation first, then create issue
- **Implementation questions:** Check module guide, then ask assigned senior
- **Git workflow questions:** See `.subagents/GIT-INTEGRATION-GUIDE.md`
- **Blockers:** Create critical issue (🔴) and @mention Main Agent
- **Coordination:** Update status documents regularly, check others' status

---

## Emergency Escalation

**Response Time SLAs:**
- 🔴 **Critical Blocker:** Main Agent responds < 1 hour
- 🟡 **Important Issue:** Senior responds < 4 hours
- 🟢 **Normal Question:** Any agent responds < 24 hours

**Escalation Path:**
1. Junior → Senior (same domain)
2. Senior → Senior (cross-domain)
3. Senior → Main Agent (PM)
4. Main Agent → Stakeholders (if needed)

---

**Main Agent Contact:** Available 09:00-17:00 UTC daily
**Project Repository:** https://github.com/samuelweirer/psa-putzi.git
**Branch Strategy:** Feature branches → Develop → Master (after review)
**CI/CD:** TBD (will be configured during GATEWAY-001)
**Agent Configuration:** `.subagents/agent-config.json`

---

**Last Updated:** 2025-11-05 08:30 UTC by Main Agent (PM)
**Next Review:** 2025-11-06 09:00 UTC (Daily standup)
**Critical Update:**
- ✅ AUTH-001 95% complete - Production ready
- 🚀 GATEWAY-001 Launched - Senior-4 active
- 🔄 FRONTEND-001 15% complete - Auth UI in progress
