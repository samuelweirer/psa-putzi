# PSA-Putzi Sub-Agent Configuration

**Version:** 1.0  
**Last Updated:** 2025-11-04  
**Project:** PSA-Platform MVP Implementation

---

## 🎯 Overview

This document defines how sub-agents work together on the PSA-Putzi project, including:
- Communication protocols between sub-agents
- Documentation requirements
- File ownership and handover procedures
- Coordination mechanisms

---

## 📁 Project Structure

```
psa-putzi/
├── .subagents/                 # Sub-agent coordination folder
│   ├── README.md              # This file
│   ├── status/                # Status updates
│   │   ├── agent-1-infrastructure.md
│   │   ├── agent-2-auth.md
│   │   ├── agent-3-gateway.md
│   │   ├── agent-4-crm.md
│   │   ├── agent-5-tickets.md
│   │   └── agent-6-frontend.md
│   ├── handovers/             # Handover documents
│   │   ├── 01-infra-to-auth.md
│   │   ├── 02-auth-to-gateway.md
│   │   ├── 03-gateway-to-crm.md
│   │   ├── 04-crm-to-tickets.md
│   │   └── 05-types-to-frontend.md
│   ├── shared/                # Shared resources
│   │   ├── .env.template      # Environment variables
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── constants.ts       # Shared constants
│   │   └── errors.ts          # Error definitions
│   └── issues/                # Cross-agent issues
│       └── YYYY-MM-DD-issue-description.md
├── packages/                  # Monorepo packages
│   ├── types/                 # @psa/types
│   ├── auth-middleware/       # @psa/auth-middleware
│   ├── logger/                # @psa/logger
│   └── config/                # @psa/config
├── services/                  # Backend services
│   ├── api-gateway/           # Port 3000
│   ├── auth/                  # Port 3010
│   ├── crm/                   # Port 3020
│   ├── tickets/               # Port 3030
│   ├── billing/               # Port 3040
│   ├── projects/              # Port 3050
│   ├── assets/                # Port 3060
│   └── reports/               # Port 3070
├── frontend/                  # React application
├── infrastructure/            # Infrastructure code
│   ├── database/              # SQL schemas and migrations
│   ├── docker/                # Docker configs (dev only)
│   └── scripts/               # Setup and utility scripts
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture decisions
│   └── guides/                # Developer guides
└── tests/                     # Integration tests
    └── e2e/                   # End-to-end tests
```

---

## 🤖 Sub-Agent Roles & Responsibilities

### Agent 1: Infrastructure Engineer
**Module:** `01-MODULE-Infrastructure.md`  
**Timeline:** Week 1-2 (5 days)  
**Output:** Database, Redis, RabbitMQ, Elasticsearch setup

**Responsibilities:**
- Set up PostgreSQL database with schemas
- Configure Redis for caching and sessions
- Set up RabbitMQ with exchanges and queues
- Install and configure Elasticsearch
- Create health check scripts
- Document all connection strings

**Deliverables:**
- `.subagents/status/agent-1-infrastructure.md` (daily updates)
- `.subagents/shared/.env.template` (all connection strings)
- `infrastructure/database/init.sql` (database initialization)
- `infrastructure/scripts/health-check.sh` (health checks)
- `.subagents/handovers/01-infra-to-auth.md` (handover document)

---

### Agent 2: Auth & Security Specialist
**Module:** `02-MODULE-Auth.md`  
**Timeline:** Week 2-3 (7 days)  
**Dependencies:** Agent 1 complete  
**Output:** Authentication service with RBAC

**Responsibilities:**
- Implement JWT authentication (RS256)
- Create RBAC system (see BDUF Chapter 7)
- Build auth middleware for other services
- Implement MFA support (TOTP)
- Create user management APIs

**Deliverables:**
- `.subagents/status/agent-2-auth.md` (daily updates)
- `services/auth/` (complete service)
- `packages/auth-middleware/` (reusable middleware)
- `.subagents/shared/types.ts` (User, Role, Permission types)
- `docs/api/auth.openapi.yaml` (API specification)
- `.subagents/handovers/02-auth-to-gateway.md` (handover document)

**Critical Handover to Others:**
- Auth middleware must be published before Gateway starts
- JWT structure must be documented for all services
- RBAC roles must match BDUF Chapter 7

---

### Agent 3: API Gateway Architect
**Module:** `03-MODULE-API-Gateway.md`  
**Timeline:** Week 3-4 (6 days)  
**Dependencies:** Agent 2 complete  
**Output:** Central API Gateway with routing and security

**Responsibilities:**
- Create API Gateway with Express
- Implement routing to all backend services
- Integrate auth middleware
- Set up rate limiting
- Create OpenAPI documentation hub
- Implement request/response logging

**Deliverables:**
- `.subagents/status/agent-3-gateway.md` (daily updates)
- `services/api-gateway/` (complete service)
- `docs/api/gateway.openapi.yaml` (routing documentation)
- `.subagents/shared/errors.ts` (standardized error responses)
- `.subagents/handovers/03-gateway-to-crm.md` (handover document)

**Critical Handover to Others:**
- Error response format must be used by all services
- Rate limiting rules documented
- API versioning strategy defined

---

### Agent 4: CRM Developer
**Module:** `04-MODULE-CRM.md`  
**Timeline:** Week 4-6 (10 days)  
**Dependencies:** Agent 3 complete  
**Output:** Customer Relationship Management system

**Responsibilities:**
- Implement customer, contact, location management
- Create search and filter functionality
- Implement UID validation (VIES API)
- Set up audit trail
- Create RabbitMQ events for customer changes

**Deliverables:**
- `.subagents/status/agent-4-crm.md` (daily updates)
- `services/crm/` (complete service)
- `infrastructure/database/migrations/002_crm_schema.sql`
- `.subagents/shared/types.ts` (Customer, Contact, Location types)
- `docs/api/crm.openapi.yaml` (API specification)
- `.subagents/handovers/04-crm-to-tickets.md` (handover document)

**Critical Handover to Others:**
- Customer types exported for Tickets, Billing, Assets
- RabbitMQ event structure documented
- Elasticsearch index configuration shared

---

### Agent 5: Ticketing System Developer
**Module:** `05-MODULE-Tickets.md`  
**Timeline:** Week 6-9 (14 days)  
**Dependencies:** Agent 4 complete  
**Output:** Ticketing system with SLA tracking

**Responsibilities:**
- Implement ticket lifecycle (New → Closed)
- Create SLA calculation engine
- Implement email integration (SMTP/IMAP)
- Build time tracking system
- Create notification system (Email, RabbitMQ)
- Implement attachment handling

**Deliverables:**
- `.subagents/status/agent-5-tickets.md` (daily updates)
- `services/tickets/` (complete service)
- `infrastructure/database/migrations/003_tickets_schema.sql`
- `.subagents/shared/types.ts` (Ticket, TimeEntry, SLA types)
- `docs/api/tickets.openapi.yaml` (API specification)
- `.subagents/handovers/05-tickets-to-billing.md` (handover document)

**Critical Handover to Others:**
- TimeEntry format must be compatible with Billing
- Ticket status workflow documented
- SLA calculation logic explained (complex!)

---

### Agent 6: Frontend Developer
**Module:** `13-MODULE-Frontend.md`  
**Timeline:** Week 3-10 (parallel, 12 days active work)  
**Dependencies:** Agent 2 (for login), then others for features  
**Output:** React frontend application

**Responsibilities:**
- Set up React + Vite + TypeScript
- Implement design system (Tailwind + shadcn/ui)
- Create authentication flow
- Build pages for CRM, Tickets, Dashboard
- Implement API integration layer
- Write component tests

**Deliverables:**
- `.subagents/status/agent-6-frontend.md` (daily updates)
- `frontend/` (complete React app)
- `frontend/src/types/` (TypeScript definitions)
- `tests/e2e/` (Playwright E2E tests)
- `docs/guides/frontend-setup.md` (developer guide)

**Critical Dependencies:**
- Imports types from `packages/types/`
- Uses API Gateway URL from `.env`
- Waits for each service before building UI

---

## 📝 Documentation Requirements

### Daily Status Updates

Each sub-agent MUST update their status file daily:

**Location:** `.subagents/status/agent-{N}-{name}.md`

**Template:**
```markdown
# Agent {N}: {Name} - Status Update

**Date:** YYYY-MM-DD  
**Status:** 🟢 On Track | 🟡 Minor Issues | 🔴 Blocked  
**Progress:** XX%

## Today's Work
- ✅ Completed: [task description]
- 🔄 In Progress: [task description]
- ⏳ Planned: [task description]

## Blockers
- [Issue description] - Waiting for: [agent/resource]
- [Issue description] - Need help with: [specific question]

## Tomorrow's Plan
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

## Questions for Other Agents
- @Agent-{N}: [specific question]

## Deliverables Completed Today
- [File/Feature name] - [Description]

## Technical Decisions Made
- **Decision:** [What was decided]
- **Rationale:** [Why this approach]
- **Alternatives Considered:** [What else was considered]
- **Impact:** [Who/what is affected]
```

---

### Handover Documents

When a sub-agent completes their work, they MUST create a handover document:

**Location:** `.subagents/handovers/{NN}-{from}-to-{to}.md`

**Template:**
```markdown
# Handover: {From Agent} → {To Agent}

**Date:** YYYY-MM-DD  
**From:** Agent {N} - {Name}  
**To:** Agent {M} - {Name}  
**Status:** ✅ Complete

## Summary
[Brief overview of what was delivered]

## What Was Built
1. **Component/Service Name**
   - Location: `path/to/code`
   - Purpose: [What it does]
   - Key Features: [List main features]

2. **Component/Service Name**
   - Location: `path/to/code`
   - Purpose: [What it does]
   - Key Features: [List main features]

## Critical Files
| File | Purpose | Notes |
|------|---------|-------|
| `path/to/file.ts` | [Purpose] | [Important notes] |
| `path/to/file.sql` | [Purpose] | [Important notes] |

## Environment Variables
```bash
# Add these to .env
VARIABLE_NAME=value  # Purpose: [explanation]
ANOTHER_VAR=value    # Purpose: [explanation]
```

## Shared Types/Interfaces
```typescript
// Location: .subagents/shared/types.ts
export interface TypeName {
  field: string;
  // Documentation
}
```

## Dependencies Installed
```bash
npm install package-name@version  # Purpose
```

## Database Changes
- **New Tables:** [List tables]
- **Migrations:** [Path to migration files]
- **Indexes:** [Important indexes created]

## API Endpoints Created
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/v1/resource` | [Purpose] | Yes |
| GET | `/api/v1/resource/:id` | [Purpose] | Yes |

## Testing
- **Test Coverage:** XX%
- **Test Files:** `tests/**/*.test.ts`
- **How to Run:** `npm test`
- **Integration Tests:** [Description]

## Known Issues / Technical Debt
1. **Issue:** [Description]
   - **Workaround:** [How to handle]
   - **Future Fix:** [When/how to resolve]

## Configuration Required by Next Agent
```yaml
# Example configuration
service:
  port: 3000
  database:
    host: localhost
    # ...
```

## Important Notes
- ⚠️ **CRITICAL:** [Something absolutely essential to know]
- 💡 **TIP:** [Helpful suggestion]
- 🐛 **BUG:** [Known bug, workaround]

## Questions to Ask Me
If you have questions about:
- [Topic]: Check [file/documentation]
- [Topic]: Ask @Agent-{N} in issues folder

## Health Check
```bash
# Verify everything works
npm run health-check
# Expected output: [description]
```

## Next Steps for Receiving Agent
1. [ ] Review this handover document
2. [ ] Run health checks
3. [ ] Read critical files listed above
4. [ ] Update .env with new variables
5. [ ] Run integration tests
6. [ ] Start your module implementation
```

---

## 🔄 Change Communication Protocol

### When to Communicate Changes

Sub-agents MUST notify others when:

1. **Breaking Changes**
   - API contract changes
   - Database schema changes
   - Type definitions change
   - Environment variables added/changed

2. **New Shared Resources**
   - New shared types
   - New utility functions
   - New constants
   - New error codes

3. **Blockers**
   - Waiting for another agent
   - Cannot proceed without decision
   - Found a bug in previous agent's work

---

### Communication Channels

#### 1. Shared Files (Primary)

**Location:** `.subagents/shared/`

**Files:**
- `.env.template` - All environment variables
- `types.ts` - TypeScript type definitions
- `constants.ts` - Shared constants
- `errors.ts` - Error code definitions

**Update Protocol:**
```typescript
// At top of file, maintain a changelog
/**
 * CHANGELOG
 * 
 * 2025-11-04 - Agent-2 (Auth):
 *   - Added User, Role, Permission interfaces
 *   - Added JWT payload structure
 * 
 * 2025-11-05 - Agent-4 (CRM):
 *   - Added Customer, Contact, Location interfaces
 *   - Updated User interface with customerId field
 */

export interface User {
  id: string;
  email: string;
  // ... fields
  customerId?: string; // Added by Agent-4, 2025-11-05
}
```

#### 2. Issues (For Problems)

**Location:** `.subagents/issues/`

**Filename:** `YYYY-MM-DD-short-description.md`

**Template:**
```markdown
# Issue: {Short Description}

**Date:** YYYY-MM-DD  
**Reported By:** Agent {N} - {Name}  
**Severity:** 🔴 Critical | 🟡 Important | 🟢 Minor  
**Status:** 🆕 New | 🔄 In Progress | ✅ Resolved

## Problem Description
[Clear description of the issue]

## Impact
- **Affected Agents:** [List agents]
- **Affected Components:** [List components]
- **Blocks Work:** [Yes/No, details]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Proposed Solution
[Your suggestion for fixing this]

## Discussion
**2025-11-04 @Agent-{N}:**
[Comment]

**2025-11-05 @Agent-{M}:**
[Response]

## Resolution
- **Decision:** [What was decided]
- **Implemented By:** Agent {N}
- **Date Resolved:** YYYY-MM-DD
- **Changes Made:** [List changes]
```

#### 3. Status Updates (For Progress)

Daily updates in `.subagents/status/agent-{N}-{name}.md` with:
- `@Agent-{N}:` mentions for questions
- Clear status indicators (🟢🟡🔴)
- Tomorrow's plan that affects others

---

## 📦 Package Management

### Shared Packages

**Location:** `packages/`

These are internal packages that multiple services use:

#### @psa/types
```json
{
  "name": "@psa/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

**Maintained By:** All agents contribute  
**Update Protocol:**
1. Add types to `packages/types/src/index.ts`
2. Run `npm run build` to compile
3. Update version in `package.json` (semver)
4. Update CHANGELOG in `.subagents/shared/types.ts`
5. Notify other agents in daily status update

#### @psa/auth-middleware
**Maintained By:** Agent 2 (Auth)  
**Used By:** Agents 3, 4, 5 (All services)

**Critical:** This must be completed before other services start!

#### @psa/logger
**Maintained By:** Agent 1 (Infrastructure)  
**Used By:** All agents

#### @psa/config
**Maintained By:** Agent 1 (Infrastructure)  
**Used By:** All agents

---

## 🎯 Coordination Checkpoints

### Weekly Sync Points

**Every Monday (Start of Week):**
- Main agent reviews all status files
- Identifies blockers
- Updates project timeline
- Creates coordination issues if needed

**Every Friday (End of Week):**
- All agents update completion percentage
- Highlight risks for next week
- Update handover documents if transitioning

### Milestone Reviews

**After Each Agent Completion:**
1. Agent creates handover document
2. Main agent reviews deliverables
3. Integration test between modules
4. Next agent acknowledges handover
5. Go/No-Go decision for next phase

---

## 🔐 Code Review Requirements

### Before Handover

Each agent must:

1. **Self-Review Checklist**
   - [ ] All tests pass (unit + integration)
   - [ ] Code coverage ≥ 70%
   - [ ] No console.log() in production code
   - [ ] All TODO comments have issue numbers
   - [ ] TypeScript strict mode enabled
   - [ ] ESLint passes with no warnings
   - [ ] API documented in OpenAPI spec
   - [ ] README.md updated
   - [ ] Environment variables documented
   - [ ] Health check endpoint works

2. **Documentation Checklist**
   - [ ] Status file updated
   - [ ] Handover document complete
   - [ ] Shared types updated
   - [ ] API documentation complete
   - [ ] Architecture decisions recorded

3. **Integration Checklist**
   - [ ] Integrates with dependent services
   - [ ] Uses shared types from @psa/types
   - [ ] Follows error handling conventions
   - [ ] Emits correct RabbitMQ events
   - [ ] Health check passes

---

## 🚨 Emergency Protocols

### What to Do If...

#### You Find a Critical Bug in Previous Work
1. Create issue in `.subagents/issues/`
2. Mark as 🔴 Critical
3. @ mention the responsible agent
4. Do NOT attempt to fix without coordination
5. Wait for main agent to coordinate

#### You Need to Make Breaking Changes
1. Document the change in issue
2. List all affected agents
3. Propose migration path
4. Wait for main agent approval
5. Update all shared documentation
6. Notify all affected agents

#### You're Blocked
1. Update status to 🔴 Blocked
2. Create issue explaining blocker
3. @ mention who can unblock
4. Work on non-blocked tasks
5. Escalate to main agent if >1 day

#### You Need to Change Another Agent's Code
**DON'T!** Instead:
1. Create issue describing needed change
2. @ mention responsible agent
3. Propose solution
4. Let them implement OR get explicit permission

---

## 📊 Success Metrics

### Agent Performance

Track in weekly status:

**Velocity:**
- Story points completed per week
- Actual vs. estimated time

**Quality:**
- Test coverage percentage
- Bugs found in your code by others
- Code review feedback

**Collaboration:**
- Response time to questions (< 24h)
- Handover document quality
- Documentation completeness

---

## 🎓 Best Practices

### Do's ✅

1. **Communicate Early & Often**
   - Update status daily
   - Ask questions immediately
   - Share decisions proactively

2. **Document Everything**
   - Why, not just what
   - Include examples
   - Keep updated

3. **Think About Others**
   - How will next agent use this?
   - What will they need to know?
   - What could go wrong?

4. **Test Thoroughly**
   - Unit tests
   - Integration tests
   - Happy path & edge cases

5. **Follow Conventions**
   - Use established patterns
   - Match existing code style
   - Reuse shared components

### Don'ts ❌

1. **Don't Work in Silence**
   - If stuck, ask
   - If unsure, confirm
   - If changing course, notify

2. **Don't Skip Documentation**
   - Future you will thank you
   - Next agent depends on it
   - Main agent needs visibility

3. **Don't Make Assumptions**
   - Clarify requirements
   - Verify integrations
   - Validate with tests

4. **Don't Break Contracts**
   - API changes need coordination
   - Type changes need migration
   - Database changes need versioning

5. **Don't Reinvent**
   - Check shared packages first
   - Reuse utilities
   - Follow established patterns

---

## 📞 Getting Help

### Who to Ask

| Question Type | Ask | Location |
|--------------|-----|----------|
| Project direction | Main Agent | Chat |
| Technical implementation | Responsible Agent | `.subagents/issues/` |
| Shared resource question | Original Creator | `.subagents/issues/` |
| Integration problem | Both Agents | `.subagents/issues/` |
| Urgent blocker | Main Agent | Status file (🔴) |

### Response Time Expectations

- **Critical (🔴):** < 4 hours
- **Important (🟡):** < 24 hours
- **Normal (🟢):** < 48 hours

---

## 🎉 Definition of Done

### For Each Agent

Before marking work complete:

#### Code
- [x] All features implemented per module spec
- [x] Code follows style guide
- [x] No linting errors
- [x] No console.log in production code
- [x] All TODOs resolved or linked to issues

#### Tests
- [x] Unit tests written (≥70% coverage)
- [x] Integration tests written
- [x] All tests pass
- [x] Performance tests pass (if applicable)

#### Documentation
- [x] Status file finalized
- [x] Handover document complete
- [x] API documented (OpenAPI)
- [x] README.md updated
- [x] Shared types updated
- [x] Environment variables documented

#### Integration
- [x] Works with dependent services
- [x] Health check passes
- [x] Database migrations tested
- [x] No breaking changes (or coordinated)

#### Deployment
- [x] Service can start from scratch
- [x] Configuration documented
- [x] Monitoring/logging implemented
- [x] Error handling complete

---

## 📚 Reference Documents

- **BDUF Documentation:** `/mnt/project/*.md`
- **Module Specifications:** `implementation/*-MODULE-*.md`
- **Deployment Strategy:** `implementation/00-DEPLOYMENT-STRATEGY.md`
- **Project Plan:** `PROJECT-IMPLEMENTATION-PLAN.md`

---

## 🔄 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-04 | Initial creation | Main Agent |

---

**Questions about this process?**
Create an issue in `.subagents/issues/` with your question!
