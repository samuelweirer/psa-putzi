# PSA-Platform Project Management Structure

**Version:** 1.0
**Created:** 2025-11-04
**Status:** Active

---

## Overview

This document defines the project management structure, roles, responsibilities, and processes for the PSA-Platform development project. It establishes how work is organized, tracked, and delivered using a hybrid agile approach optimized for AI sub-agent collaboration.

---

## Project Organization

### Project Structure
```
psa-putzi/
├── .subagents/                   # Sub-agent coordination
│   ├── ACTIVE-ASSIGNMENTS.md     # Current work assignments
│   ├── HANDOVER-*.md             # Task handover documents
│   └── STATUS-*.md               # Completion status reports
├── AGENTS/                       # Sub-agent documentation
│   ├── README.md                 # Overview
│   ├── MASTER-INDEX.md           # Complete index
│   └── templates/                # Document templates
├── BDUF/                         # Technical architecture
│   └── BDUF-Chapter*.md          # Design documentation
├── implementation/               # Implementation guides
│   ├── 00-DEPLOYMENT-STRATEGY.md
│   ├── 01-MODULE-Infrastructure.md
│   ├── 02-MODULE-Auth.md
│   └── ...                       # 13 module guides total
├── infrastructure-setup/         # Infrastructure docs
│   ├── SETUP-NOTES.md
│   ├── QUICK-START.md
│   └── health-check.sh
└── project-management/           # This folder
    ├── PROJECT-MANAGEMENT.md     # This file
    ├── SPRINT-PLAN.md            # 16-sprint plan
    ├── MILESTONES.md             # Major milestones
    └── sprint-notes/             # Sprint documentation
        ├── sprint-01/
        │   ├── planning.md
        │   ├── retrospective.md
        │   └── demo-notes.md
        └── sprint-02/
            └── ...
```

---

## Roles & Responsibilities

### Master Agent
**Role:** Project coordinator and architect

**Responsibilities:**
- Overall project coordination
- Architecture decisions and technical direction
- Code review and quality assurance
- Sprint planning and prioritization
- Risk management
- Stakeholder communication
- Integration of sub-agent work

**Deliverables:**
- Architecture decision records (ADRs)
- Integration code and APIs
- Code review feedback
- Sprint reports

---

### Sub-Agents

#### Infrastructure Sub-Agent
**Focus:** DevOps, deployment, monitoring

**Responsibilities:**
- Container setup and management
- Database administration
- CI/CD pipeline setup
- Monitoring and alerting
- Backup and disaster recovery
- Performance optimization
- Security hardening

**Current Status:** ✅ Completed infrastructure setup (Sprint 1)

**Deliverables:**
- Infrastructure-as-code
- Deployment scripts
- Monitoring dashboards
- Backup scripts
- Security audit reports

---

#### Auth Sub-Agent
**Focus:** Authentication & authorization

**Responsibilities:**
- User authentication (JWT, OAuth2, SAML)
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Session management
- Password policies
- Audit logging

**Current Status:** 🟡 Ready to start (Sprint 2)

**Deliverables:**
- Auth service APIs
- RBAC middleware
- OAuth2 integration
- Unit tests (80%+ coverage)
- API documentation

---

#### API Gateway Sub-Agent
**Focus:** API Gateway and routing

**Responsibilities:**
- Request routing
- Rate limiting
- CORS configuration
- Request/response logging
- API documentation aggregation
- Health checks

**Current Status:** ⚪ Pending (Sprint 3)

**Deliverables:**
- Gateway service
- Routing configuration
- Rate limiting rules
- Monitoring integration

---

#### CRM Sub-Agent
**Focus:** Customer relationship management

**Responsibilities:**
- Customer management
- Contact management
- Location management
- Customer relationships
- Contract management
- Customer activity tracking

**Current Status:** ⚪ Pending (Sprint 4, 9)

**Deliverables:**
- CRM service APIs
- Frontend pages
- Customer reports
- Unit + integration tests

---

#### Tickets Sub-Agent
**Focus:** Ticket management system

**Responsibilities:**
- Ticket CRUD operations
- Ticket workflow (status transitions)
- Comments and attachments
- Time entry tracking
- SLA management
- Email integration
- Search functionality

**Current Status:** ⚪ Pending (Sprint 5-6)

**Deliverables:**
- Tickets service APIs
- Email integration
- SLA tracking
- Frontend pages
- Unit + integration tests

---

#### Projects Sub-Agent
**Focus:** Project management

**Responsibilities:**
- Project management
- Task management with dependencies
- Gantt chart implementation
- Budget and time tracking
- Milestone tracking

**Current Status:** ⚪ Pending (Sprint 7)

**Deliverables:**
- Projects service APIs
- Gantt chart frontend
- Task dependency validation
- Unit + integration tests

---

#### Billing Sub-Agent
**Focus:** Invoicing and payments

**Responsibilities:**
- Invoice generation
- Billing rate resolution
- Payment tracking
- Recurring invoices
- DATEV export for Germany
- Financial reports

**Current Status:** ⚪ Pending (Sprint 8)

**Deliverables:**
- Billing service APIs
- Invoice PDF generation
- DATEV export functionality
- Unit + integration tests

---

#### Assets Sub-Agent
**Focus:** Asset and license management

**Responsibilities:**
- Asset tracking
- License management
- Warranty and EOL tracking
- RMM integration
- License compliance

**Current Status:** ⚪ Pending (Sprint 10)

**Deliverables:**
- Assets service APIs
- RMM integration
- License compliance reports
- Unit + integration tests

---

#### Reports Sub-Agent
**Focus:** Analytics and reporting

**Responsibilities:**
- KPI dashboards
- Statistical reports
- Chart visualization
- Data export (PDF, Excel)
- Scheduled reports
- Customer health scores

**Current Status:** ⚪ Pending (Sprint 11)

**Deliverables:**
- Reports service APIs
- Dashboard frontend
- Export functionality
- Unit + integration tests

---

#### Frontend Sub-Agent
**Focus:** React frontend application

**Responsibilities:**
- React application setup
- UI component library
- Page implementation
- State management
- WebSocket integration
- Responsive design
- Accessibility (WCAG 2.1 AA)

**Current Status:** ⚪ Pending (Sprint 3+)

**Deliverables:**
- React application
- UI components
- All module pages
- Unit + E2E tests
- Storybook documentation

---

#### Workflows Sub-Agent
**Focus:** Automation engine

**Responsibilities:**
- Workflow engine
- Event triggers
- Action library
- Visual workflow builder
- Approval workflows
- Scheduled workflows

**Current Status:** ⚪ Pending (Sprint 13-14)

**Deliverables:**
- Workflow service APIs
- Visual builder frontend
- Workflow templates
- Unit + integration tests

---

#### vCIO Sub-Agent
**Focus:** Virtual CIO features

**Responsibilities:**
- QBR management
- Technology roadmap
- Strategic recommendations
- Budget forecasting
- Risk register
- Executive reports

**Current Status:** ⚪ Pending (Sprint 15)

**Deliverables:**
- vCIO service APIs
- QBR frontend pages
- Roadmap visualization
- Executive report generation
- Unit + integration tests

---

#### AI Sub-Agent
**Focus:** AI and LLM features

**Responsibilities:**
- OpenAI integration
- Ticket classification
- Response generation
- Semantic search
- Predictive analytics
- Cost tracking

**Current Status:** ⚪ Pending (Sprint 16)

**Deliverables:**
- AI service APIs
- OpenAI integration
- Semantic search
- Unit + integration tests

---

## Work Management Process

### Backlog Management

#### Product Backlog
- **Owner:** Master Agent
- **Location:** GitHub Issues or Jira
- **Format:** User stories with acceptance criteria
- **Prioritization:** MoSCoW (Must have, Should have, Could have, Won't have)

**User Story Template:**
```markdown
## User Story
As a [role]
I want [feature]
So that [benefit]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
- API endpoints: ...
- Database changes: ...
- Dependencies: ...

## Estimation
Story Points: 5
Complexity: Medium
Risk: Low

## Definition of Ready
- [ ] Story is clearly written
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Design mockups (if UI)
- [ ] API contracts defined
- [ ] Story estimated
- [ ] Story prioritized
```

---

#### Sprint Backlog
- **Owner:** Sub-agents (self-organizing)
- **Location:** GitHub Projects board
- **Columns:** To Do → In Progress → Code Review → Testing → Done
- **Commitment:** Team commits during sprint planning

---

### GitHub Projects Board

**Board Structure:**

```
┌─────────────┬──────────────┬─────────────┬─────────────┬──────────┐
│   Backlog   │    To Do     │ In Progress │ Code Review │   Done   │
├─────────────┼──────────────┼─────────────┼─────────────┼──────────┤
│ Future work │ Sprint ready │ Active work │ PR review   │ Complete │
│             │              │             │             │          │
│ • Story A   │ • Story B    │ • Story C   │ • Story D   │ • Story E│
│ • Story F   │ • Story G    │             │             │ • Story H│
│ ...         │ ...          │             │             │ ...      │
└─────────────┴──────────────┴─────────────┴─────────────┴──────────┘
```

**Card Format:**
- Title: [MODULE] Story title
- Labels: priority, module, type (feature/bug/tech-debt)
- Assigned to: Sub-agent name
- Estimate: Story points
- Sprint: Sprint number

---

## Git Workflow

### Branch Strategy

```
master (protected)
├── feature/auth-module
├── feature/crm-module
├── feature/tickets-module
├── bugfix/ticket-status-bug
└── hotfix/critical-security-fix
```

**Branch Naming:**
- `feature/module-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-issue` - Production hotfixes
- `docs/documentation-update` - Documentation only

---

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): Add JWT token refresh endpoint

Implement automatic token refresh to improve UX. Tokens are refreshed
30 seconds before expiration.

Closes #123
```

---

### Pull Request Process

**PR Template:**
```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] Added tests
- [ ] All tests pass
- [ ] No new warnings

## Testing
Describe testing performed

## Screenshots (if applicable)
```

**Review Process:**
1. Sub-agent creates PR
2. Master Agent reviews code
3. Automated tests run (CI)
4. Code review feedback addressed
5. Master Agent approves and merges
6. Branch deleted after merge

---

## Quality Assurance

### Testing Strategy

#### Unit Tests
- **Coverage Target:** ≥ 80%
- **Framework:** Vitest (backend), Vitest + React Testing Library (frontend)
- **Run:** On every commit (pre-commit hook)
- **Location:** `tests/unit/`

#### Integration Tests
- **Coverage:** All API endpoints
- **Framework:** Supertest
- **Run:** Before merge to master
- **Location:** `tests/integration/`

#### E2E Tests
- **Coverage:** Critical user journeys
- **Framework:** Playwright or Cypress
- **Run:** Before release
- **Location:** `tests/e2e/`

#### Performance Tests
- **Tool:** k6 or Apache JMeter
- **Run:** Weekly
- **Targets:**
  - API response time: p95 < 200ms
  - Database queries: < 100ms
  - Frontend load time: < 3 seconds

---

### Code Quality

#### Linting
- **Backend:** ESLint with TypeScript rules
- **Frontend:** ESLint + Prettier
- **Run:** Pre-commit hook
- **CI:** Fail build on linting errors

#### Code Review Checklist
- [ ] Code follows style guide
- [ ] No hardcoded secrets or credentials
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Tests cover new code
- [ ] Documentation updated
- [ ] Performance considered
- [ ] Security reviewed (no SQL injection, XSS, etc.)
- [ ] Accessibility considered (if UI)

---

## CI/CD Pipeline

### Continuous Integration (GitHub Actions)

**Workflow: `.github/workflows/ci.yml`**

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
```

---

### Continuous Deployment

**Environments:**
- **Development:** Auto-deploy on merge to `develop` branch
- **Staging:** Auto-deploy on merge to `staging` branch
- **Production:** Manual approval required

**Deployment Process:**
1. Tests pass on CI
2. Build artifacts created
3. Deploy to environment
4. Run smoke tests
5. Health check verification
6. Notify team on Slack/Teams

---

## Monitoring & Alerting

### Health Checks
- **Frequency:** Every 60 seconds
- **Script:** `/usr/local/bin/psa-health-check.sh`
- **Alerts:** Slack/email if service down > 2 minutes

### Metrics
- **Tool:** Prometheus + Grafana
- **Metrics:**
  - Request rate
  - Error rate
  - Response time (p50, p95, p99)
  - CPU and memory usage
  - Database connection pool
  - Queue depth (RabbitMQ)

### Logs
- **Tool:** ELK Stack (Elasticsearch, Logstash, Kibana) or Grafana Loki
- **Log Levels:**
  - ERROR: Critical issues requiring immediate attention
  - WARN: Potential issues
  - INFO: General information
  - DEBUG: Detailed debugging (dev/staging only)

### Alerts
- **Critical:** Page on-call engineer immediately
- **High:** Notify within 15 minutes
- **Medium:** Notify within 1 hour
- **Low:** Daily digest

---

## Documentation Standards

### Code Documentation
- **Inline Comments:** Explain "why", not "what"
- **Function Docs:** JSDoc format for TypeScript
- **Complex Logic:** Add comments explaining approach

**Example:**
```typescript
/**
 * Resolves billing rate for a user based on context.
 *
 * Resolution order:
 * 1. user_billing_rates (most specific)
 * 2. contracts.hourly_rate (contract default)
 * 3. users.default_billing_rate (user default)
 *
 * @param userId - User ID
 * @param customerId - Customer ID
 * @param contractId - Contract ID (optional)
 * @returns Billing rate and cost rate
 * @throws Error if no rate found
 */
async function resolveBillingRate(
  userId: string,
  customerId: string,
  contractId: string | null
): Promise<{ billingRate: number; costRate: number }> {
  // Implementation...
}
```

---

### API Documentation
- **Tool:** Swagger/OpenAPI 3.0
- **Auto-generated:** From TypeScript decorators
- **Location:** `/api-docs` endpoint
- **Update:** Before each sprint demo

---

### User Documentation
- **Location:** `/docs` folder in git
- **Format:** Markdown
- **Content:**
  - User guides
  - Feature documentation
  - FAQs
  - Troubleshooting

---

## Risk Management

### Risk Register

| Risk ID | Description | Probability | Impact | Mitigation | Owner | Status |
|---------|-------------|-------------|--------|------------|-------|--------|
| RISK-001 | OAuth2 integration complexity | Medium | High | Use Passport.js library | Auth Agent | Open |
| RISK-002 | Email integration failure | Low | Medium | Use SendGrid service | Tickets Agent | Open |
| RISK-003 | File storage scalability | Medium | High | Use S3-compatible storage | Infrastructure Agent | Open |
| RISK-004 | DATEV export format compliance | High | High | Consult DATEV docs early | Billing Agent | Open |
| RISK-005 | AI API cost overrun | Medium | Medium | Implement rate limiting | AI Agent | Open |

### Risk Review
- **Frequency:** Every sprint retrospective
- **Process:**
  1. Review existing risks
  2. Update risk status
  3. Identify new risks
  4. Update mitigation strategies

---

## Communication Protocols

### Synchronous Communication
- **Daily Standups:** 9:00 AM (15 minutes)
- **Sprint Planning:** First day of sprint (2-4 hours)
- **Sprint Review:** Last day of sprint (1 hour)
- **Sprint Retrospective:** Last day of sprint (1 hour)

### Asynchronous Communication
- **Code Reviews:** GitHub PR comments
- **Questions:** GitHub Issues
- **Updates:** Status reports in `.subagents/STATUS-*.md`
- **Documentation:** Markdown files in git

### Status Updates
**Format:**
```markdown
## Status Update - [Module Name] - [Date]

### Completed This Week
- Task 1
- Task 2

### In Progress
- Task 3 (50% complete, blocked by dependency)

### Planned Next Week
- Task 4
- Task 5

### Blockers
- Blocker 1: Waiting for API documentation from CRM module
- Blocker 2: Need design mockups for ticket list page

### Questions/Help Needed
- Question about billing rate resolution logic
```

---

## Success Criteria

### Project Success Metrics
- **On-Time Delivery:** 90% of sprints delivered on time
- **Quality:** < 5 critical bugs in production
- **Performance:** API p95 response time < 200ms
- **Test Coverage:** ≥ 80% unit test coverage
- **Customer Satisfaction:** NPS ≥ 8/10

### Sprint Success Metrics
- **Velocity:** Story points completed per sprint (track trend)
- **Predictability:** Actual vs committed story points within 20%
- **Quality:** Zero critical bugs introduced
- **Code Review Time:** PRs reviewed within 24 hours

---

## Escalation Process

### Issue Escalation
1. **Level 1:** Sub-agent attempts to resolve (1 day)
2. **Level 2:** Escalate to Master Agent (2 days)
3. **Level 3:** Escalate to stakeholders (3 days)

### Blocker Resolution
- **Critical Blockers:** Resolve within 4 hours
- **High-Priority Blockers:** Resolve within 1 day
- **Medium-Priority Blockers:** Resolve within 3 days

---

## Change Management

### Scope Changes
- **Process:**
  1. Change request submitted (GitHub Issue)
  2. Master Agent reviews impact (effort, timeline, risk)
  3. Stakeholders approve/reject
  4. Backlog updated
  5. Team notified

### Architecture Changes
- **Process:**
  1. Create Architecture Decision Record (ADR)
  2. Master Agent reviews
  3. Team discussion in sprint planning
  4. Decision documented in `/docs/adr/`
  5. Affected modules updated

---

## Handover Process

### Module Handover (Between Sub-Agents)

**Steps:**
1. **Completing Agent:**
   - Create STATUS document in `.subagents/`
   - Document all completed work
   - List any known issues or tech debt
   - Update ACTIVE-ASSIGNMENTS.md

2. **Receiving Agent:**
   - Read HANDOVER document
   - Read STATUS document
   - Ask clarifying questions (GitHub Issues)
   - Acknowledge handover

**Handover Document Template:**
See `AGENTS/templates/handover-template.md`

---

## Project Milestones

See `project-management/MILESTONES.md` for detailed milestone definitions.

**Major Milestones:**
- **M1:** Foundation Complete (End of Sprint 6)
  - Auth, CRM, Tickets modules operational

- **M2:** Core Business Features (End of Sprint 12)
  - Projects, Billing, Contracts, Assets, Reports complete

- **M3:** Advanced Features (End of Sprint 16)
  - Workflows, vCIO, AI features complete

- **M4:** Production Launch (End of Sprint 16 + 2 weeks)
  - All testing complete, production deployment

---

## Continuous Improvement

### Retrospective Action Items
- **Owner:** Each sub-agent owns their action items
- **Review:** First 15 minutes of next sprint planning
- **Tracking:** GitHub Issues with label "retrospective-action"

### Process Improvements
- **Quarterly Review:** Review and update this document
- **Feedback:** Always welcome via GitHub Issues
- **Experimentation:** Try new approaches, measure results, keep what works

---

## Appendices

### Appendix A: Useful Links
- **Repository:** https://github.com/samuelweirer/psa-putzi
- **CI/CD:** GitHub Actions
- **Monitoring:** [Zabbix URL]
- **Documentation:** `/docs` folder

### Appendix B: Glossary
- **DoR:** Definition of Ready
- **DoD:** Definition of Done
- **MVP:** Minimum Viable Product
- **PR:** Pull Request
- **CI/CD:** Continuous Integration/Continuous Deployment
- **RLS:** Row-Level Security
- **RBAC:** Role-Based Access Control

---

## Document Control

**Document Owner:** Master Agent
**Last Updated:** 2025-11-04
**Next Review:** 2025-12-04 (quarterly)
**Version History:**
- v1.0 (2025-11-04): Initial version

---

**End of Document**
