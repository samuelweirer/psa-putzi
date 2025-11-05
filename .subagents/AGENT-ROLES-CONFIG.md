# PSA-Putzi Agent Roles & AI Model Configuration

**Purpose:** Define roles, responsibilities, and AI model assignments for multi-agent development  
**Version:** 2.0  
**Last Updated:** 2025-11-04

---

## 🎭 Agent Role Hierarchy

```
                    Main Agent
                 (Project Manager)
                  Claude Opus 4
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Senior Devs     Senior Devs    Junior Devs
 (Infrastructure)   (Backend)     (Frontend)
  Sonnet 4.5       Sonnet 4.5     Haiku 4.5
```

---

## 👔 Main Agent: Project Manager

### Role Definition
**AI Model:** Claude Opus 4 (claude-opus-4-20250514)  
**Name:** Main Agent / PM  
**Type:** Coordinator & Decision Maker

### Responsibilities

#### Strategic
- Overall project direction and timeline
- Milestone planning and tracking
- Resource allocation
- Risk management
- Stakeholder communication

#### Tactical
- Daily coordination of sub-agents
- Blocker resolution and escalation
- Cross-agent issue mediation
- Quality gate approval
- Integration oversight

#### Operational
- Review all handover documents
- Approve merges to develop branch
- Maintain project documentation
- Run weekly sync meetings
- Track KPIs and metrics

### Tools & Access
- **Full repository access** (all branches)
- **Administrative permissions** (approve PRs, manage issues)
- **Monitoring dashboards** (project metrics)
- **Documentation authority** (final say on specs)

### Decision Authority
- ✅ Architecture decisions
- ✅ Technology stack changes
- ✅ Timeline adjustments
- ✅ Resource reallocation
- ✅ Quality standard exceptions (rare)

### Daily Routine
```
Morning (09:00):
- Review all agent status files (.subagents/status/)
- Check for 🔴 blockers (.subagents/issues/)
- Prioritize issues
- Update project dashboard
- Note: NO git pull needed (unified branch, same directory)

During Day:
- Respond to escalations (< 2 hours)
- Mediate conflicts
- Approve handovers
- Code review (high-risk changes)
- Monitor agent commits (git log)

End of Day (17:00):
- Update project status
- Ensure all agents pushed to GitHub
- Plan tomorrow's coordination
- Send updates to stakeholders
```

---

## 👨‍💻 Senior Developers

### Role Definition
**AI Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)  
**Type:** Technical Leads on Complex Modules  
**Count:** 4 agents

### Senior Agent 1: Infrastructure Architect
**Module:** Infrastructure (01-MODULE-Infrastructure.md)  
**Complexity:** ⭐⭐⭐⭐⭐ Very High

**Why Senior Developer:**
- Critical foundation for entire system
- Database design and optimization
- Security-critical configurations
- Performance tuning required
- High failure impact

**Responsibilities:**
- PostgreSQL cluster setup and optimization
- Redis caching strategy
- RabbitMQ message architecture
- Elasticsearch configuration
- Monitoring infrastructure
- Backup and recovery systems

**Key Deliverables:**
- Production-ready database schemas
- Optimized connection pooling
- Scalable message queues
- Health check infrastructure
- Comprehensive `.env.template`

**Mentoring Role:**
- Review junior developers' work
- Provide infrastructure guidance
- Share best practices

---

### Senior Agent 2: Security Specialist
**Module:** Authentication & RBAC (02-MODULE-Auth.md)  
**Complexity:** ⭐⭐⭐⭐⭐ Very High

**Why Senior Developer:**
- Security-critical functionality
- Complex JWT implementation (RS256)
- RBAC system design
- MFA integration
- High security standards required

**Responsibilities:**
- JWT authentication with RS256
- User management system
- Role-based access control
- Password policy enforcement
- Session management
- Security audit logging
- MFA/2FA implementation

**Key Deliverables:**
- `@psa/auth-middleware` package
- Secure JWT token generation
- RBAC system (see BDUF Chapter 7)
- User/Role/Permission types
- Security documentation

**Mentoring Role:**
- Security code reviews
- Guide juniors on auth integration
- Establish security patterns

---

### Senior Agent 3: Backend Architect
**Module:** CRM + Ticketing (04-MODULE-CRM.md + 05-MODULE-Tickets.md)  
**Complexity:** ⭐⭐⭐⭐ High

**Why Senior Developer:**
- Core business logic
- Complex SLA calculations
- Email integration (SMTP/IMAP)
- Multiple system integrations
- Performance-critical paths

**Responsibilities:**
- Customer relationship management
- Contact and location management
- Complete ticketing system
- SLA calculation engine
- Time tracking system
- Email processing (SMTP/IMAP)
- RabbitMQ event architecture

**Key Deliverables:**
- CRM APIs (Customer, Contact, Location)
- Ticket lifecycle management
- SLA calculation (complex!)
- Email integration
- Time tracking for billing
- Notification system

**Mentoring Role:**
- Review API designs
- Guide on business logic
- Performance optimization tips

---

### Senior Agent 4: Integration Specialist
**Module:** API Gateway + Integrations (03-MODULE-API-Gateway.md)  
**Complexity:** ⭐⭐⭐⭐ High

**Why Senior Developer:**
- Central integration point
- Rate limiting implementation
- Request/response transformation
- Error handling strategy
- Cross-cutting concerns

**Responsibilities:**
- API Gateway implementation
- Service routing and discovery
- Rate limiting and throttling
- Request/response logging
- Error standardization
- CORS configuration
- API versioning strategy

**Key Deliverables:**
- Express-based gateway
- Route all backend services
- Standardized error responses
- OpenAPI documentation hub
- Performance monitoring

**Mentoring Role:**
- API design patterns
- Integration best practices
- Troubleshooting support

---

## 👶 Junior Developers

### Role Definition
**AI Model:** Claude Haiku 4.5 (claude-haiku-4-5-20250929)  
**Type:** Fast Iteration & UI Development  
**Count:** 2 agents

### Why Haiku for Juniors?
- ✅ **Faster responses** - Quick iteration cycles
- ✅ **Cost-effective** - More experimental work
- ✅ **Good for UI** - Frontend components
- ✅ **Rapid prototyping** - Try ideas quickly
- ✅ **Learning-friendly** - Explores multiple approaches

### Junior Agent 5: Frontend Developer
**Module:** React Frontend (13-MODULE-Frontend.md)  
**Complexity:** ⭐⭐⭐ Medium

**Why Junior Developer (Haiku):**
- UI work benefits from rapid iteration
- Visual feedback loop
- Component-based architecture
- Lower risk (no backend impact)
- Great for learning modern frontend

**Responsibilities:**
- React application setup (Vite + TypeScript)
- Design system implementation (Tailwind + shadcn/ui)
- Authentication UI
- CRM pages (Customer list, details)
- Ticket pages (List, detail, create)
- Dashboard and analytics views
- Responsive design

**Key Deliverables:**
- Complete React application
- Reusable component library
- API integration layer
- E2E tests (Playwright)
- Mobile-responsive UI

**Supervision:**
- Senior reviews all API integrations
- PM approves UI/UX decisions
- Security review for auth flows

**Growth Opportunities:**
- Learn from senior code reviews
- Experiment with UI patterns
- Practice API integration
- Build portfolio of components

---

### Junior Agent 6: Auxiliary Developer
**Module:** Billing + Projects + Assets (06, 07, 08-MODULE-*.md)  
**Complexity:** ⭐⭐ Low-Medium

**Why Junior Developer (Haiku):**
- Well-defined CRUD operations
- Simpler business logic
- Good learning modules
- Clear specifications
- Lower criticality (Phase 2)

**Responsibilities:**
- Billing system (invoices, contracts)
- Project management (tasks, milestones)
- Asset management (inventory, licenses)
- DATEV/BMD export functionality
- Report generation

**Key Deliverables:**
- Billing APIs and workflows
- Project tracking system
- Asset inventory management
- Invoice generation
- Export integrations

**Supervision:**
- Senior reviews database schemas
- PM approves business logic
- Integration testing with CRM/Tickets

**Growth Opportunities:**
- Learn enterprise integrations
- Practice API design
- Understand billing logic
- Work with external systems

---

## 📊 Agent Comparison Matrix

| Aspect | Main Agent (PM) | Senior Dev | Junior Dev |
|--------|-----------------|------------|------------|
| **AI Model** | Opus 4 | Sonnet 4.5 | Haiku 4.5 |
| **Complexity** | Coordination | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Autonomy** | Full | High | Supervised |
| **Decision Authority** | Strategic | Technical | Tactical |
| **Code Review** | Approves | Required | Required + Mentored |
| **Risk Tolerance** | Low | Medium | High (learning) |
| **Iteration Speed** | N/A | Moderate | Fast |
| **Cost** | High | Medium | Low |

---

## 🎯 Task Assignment Strategy

### Assign to Main Agent (Opus 4) when:
- Strategic decisions needed
- Cross-agent conflict resolution
- Architecture-level questions
- Quality gate approvals
- Timeline/resource decisions
- Stakeholder communication

### Assign to Senior Dev (Sonnet 4.5) when:
- Security-critical work
- Complex algorithms (SLA calculation)
- Database optimization
- Integration architecture
- Performance tuning
- Mentoring required

### Assign to Junior Dev (Haiku 4.5) when:
- UI/UX implementation
- Well-defined CRUD operations
- Component development
- Rapid prototyping needed
- Cost-sensitive iterations
- Learning opportunities

---

## 🔄 Escalation Path

```
Junior Developer
    │
    │ Technical Question / Blocker
    ▼
Senior Developer (Same Domain)
    │
    │ Architecture / Cross-Module
    ▼
Senior Developer (Related Domain)
    │
    │ Decision Required / Resource Issue
    ▼
Main Agent (Project Manager)
    │
    │ Stakeholder Impact
    ▼
Product Owner / CTO
```

### Response Time SLAs

| Escalation Level | Response Time | Resolution Time |
|------------------|---------------|-----------------|
| Junior → Senior | < 2 hours | < 8 hours |
| Senior → Senior | < 4 hours | < 1 day |
| Senior → PM | < 1 hour | < 4 hours |
| PM → Stakeholder | Immediate | Varies |

---

## 🎓 Mentoring Framework

### Senior Developer Responsibilities

**Code Review:**
- All junior code requires senior review
- Focus on security, performance, patterns
- Provide constructive feedback
- Pair program on complex features

**Knowledge Sharing:**
- Weekly tech talks (30 min)
- Documentation of patterns
- Answer questions promptly (< 2 hours)
- Share resources and references

**Growth Planning:**
- Identify learning opportunities
- Assign stretch tasks
- Celebrate achievements
- Provide career guidance

### Junior Developer Expectations

**Learning:**
- Ask questions early and often
- Document learnings in status files
- Experiment safely in feature branches
- Review senior code for patterns

**Communication:**
- Daily status updates (mandatory)
- Request reviews proactively
- Admit when stuck (< 4 hours)
- Share discoveries

**Quality:**
- Follow established patterns
- Write tests (aim for 70%)
- Use linting tools
- Document decisions

---

## 🔐 Access Control by Role

### Main Agent (PM)
```yaml
Repository:
  - admin: true
  - approve_prs: true
  - force_push: true (develop only)
  - manage_issues: true
  - manage_projects: true

Infrastructure:
  - monitoring: read-all
  - logs: read-all
  - metrics: read-all
  - alerts: manage

Documentation:
  - all: read-write
  - approve: true
```

### Senior Developers
```yaml
Repository:
  - write: own-branch
  - read: all-branches
  - create_prs: true
  - review_code: all
  - merge: own-prs (after PM approval)

Infrastructure:
  - monitoring: read-own-services
  - logs: read-own-services
  - metrics: read-own-services
  - deploy: staging

Documentation:
  - own-module: read-write
  - others: read
```

### Junior Developers
```yaml
Repository:
  - write: own-branch
  - read: all-branches
  - create_prs: true
  - review_code: no
  - merge: no

Infrastructure:
  - monitoring: read-own-services
  - logs: read-own-services
  - metrics: no
  - deploy: no

Documentation:
  - own-module: read-write
  - others: read
```

---

## 📋 Daily Standup Format

### For Main Agent (PM)

```markdown
# Daily Standup - Main Agent

**Date:** YYYY-MM-DD

## Project Status
- Overall Progress: XX%
- Blockers: X (🔴 critical)
- Risk Level: 🟢 Low | 🟡 Medium | 🔴 High

## Agent Status Review
- Agent-1 (Infra): [Status summary]
- Agent-2 (Auth): [Status summary]
- Agent-3 (Backend): [Status summary]
- Agent-4 (Gateway): [Status summary]
- Agent-5 (Frontend): [Status summary]
- Agent-6 (Auxiliary): [Status summary]

## Today's Focus
- [ ] Priority 1: [Task]
- [ ] Priority 2: [Task]
- [ ] Priority 3: [Task]

## Decisions Made
- **Decision:** [What]
- **Rationale:** [Why]
- **Impact:** [Who/What]

## Escalations
- [Issue description] - Status: [Resolved/Pending]
```

### For Senior Developers

```markdown
# Daily Update - Senior Developer

**Agent:** Agent-{N} - {Name}
**Module:** {Module}
**Date:** YYYY-MM-DD

## Yesterday
- ✅ [Completed task]
- ✅ [Completed task]

## Today
- [ ] [Planned task]
- [ ] [Planned task]

## Blockers
- [None / Description]

## Junior Support
- Reviewed: [PR/Code]
- Mentored: [Topic]
- Unblocked: [Junior on X]

## Technical Decisions
- [Decision with rationale]
```

### For Junior Developers

```markdown
# Daily Update - Junior Developer

**Agent:** Agent-{N} - {Name}
**Module:** {Module}
**Date:** YYYY-MM-DD

## Yesterday
- ✅ [What I built]
- 📚 [What I learned]

## Today
- [ ] [What I'll build]
- [ ] [What I'll learn]

## Blockers / Questions
- [None / Question for @Senior]

## Learnings
- 💡 [Interesting discovery]
- ⚠️ [Mistake to avoid]
```

---

## 🎯 Success Metrics by Role

### Main Agent (PM)

**Delivery:**
- On-time milestone completion: > 90%
- Scope creep: < 10%
- Budget variance: < 5%

**Team:**
- Agent satisfaction: > 4.0/5.0
- Blocker resolution time: < 4 hours
- Communication clarity: > 4.5/5.0

**Quality:**
- Bugs escaped to production: < 5%
- Technical debt: Decreasing
- Test coverage: > 70%

### Senior Developers

**Delivery:**
- Story points velocity: Consistent
- Code review turnaround: < 8 hours
- Mentoring hours: > 3/week

**Quality:**
- Bugs in own code: < 2%
- Code review feedback: Positive
- Pattern adherence: > 95%

**Leadership:**
- Junior developer growth: Measurable
- Knowledge sharing: Weekly
- Team contribution: High

### Junior Developers

**Delivery:**
- Tasks completed: > 80% of planned
- PR size: < 500 lines
- Rework rate: < 20%

**Learning:**
- Questions asked: > 5/week
- Patterns learned: Documented
- Code reviews received: Incorporated

**Quality:**
- Test coverage: > 60%
- Linting errors: 0
- Documentation: Complete

---

## 🔧 Workflow Adaptations

### Code Review Process

```
Junior Developer:
  1. Create PR
  2. Self-review checklist
  3. Assign to Senior Developer
  
Senior Developer:
  4. Review code (< 8 hours)
  5. Provide feedback
  6. Approve or request changes
  7. Assign to PM if architectural
  
Main Agent (PM):
  8. Final approval (if needed)
  9. Merge to develop
```

### Architecture Decision Process

```
Any Developer:
  1. Create issue in .subagents/issues/
  2. Describe problem and options
  
Senior Developer(s):
  3. Discuss and recommend
  4. Document pros/cons
  
Main Agent (PM):
  5. Make final decision
  6. Document in ADR (Architecture Decision Record)
  7. Update relevant documentation
```

### Emergency Hotfix Process

```
Any Developer (discovers bug):
  1. Create critical issue (🔴)
  2. Notify all agents
  
Senior Developer (owner):
  3. Assess impact (< 30 min)
  4. Create hotfix branch
  5. Implement fix
  6. Get peer review
  
Main Agent (PM):
  7. Approve hotfix (< 1 hour)
  8. Deploy to production
  9. Post-mortem scheduled
```

---

## 📚 Training & Development

### For Junior Developers

**Week 1-2: Onboarding**
- Read all documentation
- Set up development environment
- Complete 2 small tasks
- Pair program with senior

**Month 1: Fundamentals**
- Master git workflow
- Learn codebase structure
- Complete assigned module
- Daily questions encouraged

**Month 2-3: Independence**
- Take larger features
- Review others' code
- Contribute to documentation
- Present learnings

**Month 3+: Growth**
- Lead small features
- Mentor new juniors
- Propose improvements
- Consider senior path

### For Senior Developers

**Ongoing:**
- Stay current with tech stack
- Lead architecture discussions
- Mentor 1-2 junior developers
- Contribute to process improvements

**Quarterly:**
- Present tech talk
- Lead retrospective
- Review and update standards
- Evaluate junior progress

---

## 🎉 Recognition & Rewards

### Agent of the Sprint

**Criteria:**
- Exceptional quality
- Outstanding collaboration
- Significant learning
- Problem-solving excellence

**Recognition:**
- Mentioned in project updates
- Highlighted in documentation
- First choice for interesting tasks
- Input on future assignments

### Promotion Path

**Junior → Senior Transition:**
- 3+ months of consistent delivery
- Demonstrated technical depth
- Positive peer reviews
- Successfully mentored others
- PM recommendation

**Indicators:**
- Complex features completed independently
- Security-conscious code
- Proactive problem identification
- Strong communication
- Team contribution

---

## 📞 Contact & Coordination

### Synchronous Communication

**Daily Standup:** 09:00-09:15 (All agents)  
**Weekly Planning:** Monday 10:00-11:00 (All agents)  
**Weekly Retro:** Friday 16:00-17:00 (All agents)

**Office Hours:**
- Main Agent (PM): 09:00-17:00 (always available)
- Senior Devs: 10:00-16:00 (guaranteed response)
- Junior Devs: Flexible (with notice)

### Asynchronous Communication

**Primary:** `.subagents/` folder system  
**Secondary:** Git comments, PR discussions  
**Emergency:** Direct PM escalation

---

## ✅ Checklist: Setting Up Roles

### Main Agent (PM) Setup

- [ ] Read all documentation thoroughly
- [ ] Set up project dashboard
- [ ] Create agent assignment matrix
- [ ] Schedule recurring meetings
- [ ] Establish communication channels
- [ ] Define success metrics
- [ ] Create escalation procedures

### Senior Developer Setup

- [ ] Review assigned module spec
- [ ] Read previous agent handovers
- [ ] Set up mentoring schedule
- [ ] Define code review criteria
- [ ] Establish patterns and standards
- [ ] Create knowledge sharing plan

### Junior Developer Setup

- [ ] Complete onboarding checklist
- [ ] Set up development environment
- [ ] Read relevant documentation
- [ ] Schedule pairing sessions
- [ ] Identify learning goals
- [ ] Connect with assigned mentor

---

**This role-based system enables:**
- ✅ Clear responsibility distribution
- ✅ Appropriate AI model selection
- ✅ Effective mentoring structure
- ✅ Risk-appropriate task assignment
- ✅ Cost optimization (Haiku for UI)
- ✅ Quality assurance (Senior reviews)

**Next:** Update MASTER-INDEX.md with new role assignments!

---

**Version:** 2.0  
**Last Updated:** 2025-11-04  
**Maintained By:** Main Agent (Project Manager)
