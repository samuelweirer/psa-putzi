# PSA-Putzi Sub-Agent Documentation - Master Index

**Complete guide to multi-agent development for PSA-Platform**  
**Last Updated:** 2025-11-04  
**Version:** 1.0

---

## 📚 Documentation Overview

This folder contains everything you need to coordinate multiple sub-agents working on PSA-Putzi in parallel.

### 🎯 Start Here

1. **[QUICK-START.md](QUICK-START.md)** ⭐ START HERE
   - Get up and running in 5 minutes
   - Essential commands for daily work
   - Checklists and quick reference

2. **[SUBAGENTS-README.md](SUBAGENTS-README.md)** 📖 READ SECOND
   - Overview of the `.subagents/` folder structure
   - How sub-agents coordinate
   - Communication protocols
   - File naming conventions

3. **[SUB-AGENT-CONFIG.md](SUB-AGENT-CONFIG.md)** 🔧 DETAILED CONFIG
   - Complete configuration guide
   - Agent roles and responsibilities
   - Handover procedures
   - Quality standards
   - Best practices

---

## 📋 Templates

### Daily Operations

**[TEMPLATE-status-update.md](TEMPLATE-status-update.md)**
- Daily status reporting template
- Track progress, blockers, decisions
- Update this EVERY DAY you work
- Location: `.subagents/status/agent-{N}-{name}.md`

**Usage:**
```bash
cp TEMPLATE-status-update.md .subagents/status/agent-2-auth.md
# Edit with your daily progress
```

### Coordination

**[TEMPLATE-handover.md](TEMPLATE-handover.md)**
- Handover document template
- Create when completing your work
- Pass knowledge to next agent
- Location: `.subagents/handovers/{NN}-{from}-to-{to}.md`

**Usage:**
```bash
cp TEMPLATE-handover.md .subagents/handovers/02-auth-to-gateway.md
# Fill out all sections before finishing
```

### Issue Tracking

**[TEMPLATE-issue.md](TEMPLATE-issue.md)**
- Issue/question template
- Report bugs, blockers, questions
- Cross-agent coordination
- Location: `.subagents/issues/YYYY-MM-DD-{description}.md`

**Usage:**
```bash
cp TEMPLATE-issue.md .subagents/issues/2025-11-04-jwt-question.md
# @mention relevant agents
```

---

## 🔧 Technical Guides

### [GIT-INTEGRATION-GUIDE.md](GIT-INTEGRATION-GUIDE.md)

**Covers:**
- Branch strategy (agent-{N}/{module})
- Commit message format
- Merge workflow
- Conflict resolution
- Git commands reference

**When to read:**
- Before your first commit
- When you encounter merge conflicts
- When coordinating with other agents

---

## 🗂️ Folder Structure

```
PSA-Putzi Project Root/
│
├── 📄 QUICK-START.md              ⭐ Start here
├── 📄 SUBAGENTS-README.md         📖 Overview
├── 📄 SUB-AGENT-CONFIG.md         🔧 Full config
├── 📄 GIT-INTEGRATION-GUIDE.md    🌳 Git workflow
│
├── 📋 Templates/
│   ├── TEMPLATE-status-update.md  📊 Daily updates
│   ├── TEMPLATE-handover.md       🤝 Knowledge transfer
│   └── TEMPLATE-issue.md          🐛 Issue tracking
│
├── .subagents/                    🤖 Coordination hub
│   ├── README.md                  (Copy of SUBAGENTS-README)
│   ├── status/                    📊 Daily status files
│   │   ├── agent-1-infrastructure.md
│   │   ├── agent-2-auth.md
│   │   └── ...
│   ├── handovers/                 🤝 Handover documents
│   │   ├── 01-infra-to-auth.md
│   │   └── ...
│   ├── shared/                    📦 Shared resources
│   │   ├── .env.template
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── errors.ts
│   └── issues/                    🐛 Cross-agent issues
│       └── YYYY-MM-DD-*.md
│
├── implementation/                📖 Module specs
│   ├── 00-DEPLOYMENT-STRATEGY.md
│   ├── 01-MODULE-Infrastructure.md
│   ├── 02-MODULE-Auth.md
│   └── ...
│
├── services/                      💻 Your code here
│   ├── api-gateway/
│   ├── auth/
│   ├── crm/
│   └── ...
│
└── packages/                      📦 Shared packages
    ├── types/
    ├── auth-middleware/
    └── ...
```

---

## 👥 Agent Team Structure

### 👔 Main Agent: Project Manager
**AI Model:** 🧠 Claude Opus 4 (claude-opus-4-20250514)  
**Role:** Strategic Coordinator & Decision Maker  
**Authority:** Full project oversight

**Responsibilities:**
- Overall project coordination
- Blocker resolution and escalation
- Quality gate approvals
- Timeline and resource management
- Stakeholder communication
- Cross-agent mediation

**Daily Activities:**
- Review all agent status files (09:00)
- Respond to escalations (< 2 hours)
- Approve handovers and merges
- Update project dashboard
- Conduct weekly planning

**Decision Authority:** Architecture, Timeline, Resources, Quality Standards

---

## 👨‍💻 Senior Developers (Claude Sonnet 4.5)

### Senior Agent 1: Infrastructure Architect
**AI Model:** 🚀 Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)  
**Module:** Infrastructure (01-MODULE-Infrastructure.md)  
**Timeline:** Week 1-2 (5 days)  
**Complexity:** ⭐⭐⭐⭐⭐ Very High  
**Risk Level:** Critical

**Why Senior:**
- Foundation for entire system
- Security-critical configurations
- Performance tuning required
- High failure impact

**Key Deliverables:**
- PostgreSQL cluster with optimized schemas
- Redis caching strategy
- RabbitMQ message architecture
- Elasticsearch configuration
- Monitoring infrastructure
- `.env.template` with all connections

**Mentoring:** Reviews Junior Agent 6 (infrastructure questions)

---

### Senior Agent 2: Security Specialist
**AI Model:** 🚀 Claude Sonnet 4.5  
**Module:** Authentication & RBAC (02-MODULE-Auth.md)  
**Timeline:** Week 2-3 (7 days)  
**Complexity:** ⭐⭐⭐⭐⭐ Very High  
**Risk Level:** Critical

**Why Senior:**
- Security-critical functionality
- Complex JWT implementation (RS256)
- RBAC system design
- MFA integration required

**Key Deliverables:**
- JWT authentication with RS256
- `@psa/auth-middleware` package
- RBAC system (Chapter 7 BDUF)
- User/Role/Permission types
- Security audit logging
- MFA/2FA support

**Mentoring:** Reviews all auth integrations, security code

---

### Senior Agent 3: Backend Architect
**AI Model:** 🚀 Claude Sonnet 4.5  
**Module:** CRM + Tickets (04-MODULE-CRM.md + 05-MODULE-Tickets.md)  
**Timeline:** Week 3-8 (17 days combined)  
**Complexity:** ⭐⭐⭐⭐ High  
**Risk Level:** High

**Why Senior:**
- Core business logic
- Complex SLA calculations
- Email integration (SMTP/IMAP)
- Multiple system integrations

**Key Deliverables:**
- CRM APIs (Customer, Contact, Location)
- Ticket lifecycle management
- SLA calculation engine (complex!)
- Email processing
- Time tracking system
- RabbitMQ event architecture

**Mentoring:** Reviews API designs, business logic, performance

---

### Senior Agent 4: Integration Specialist
**AI Model:** 🚀 Claude Sonnet 4.5  
**Module:** API Gateway (03-MODULE-API-Gateway.md)  
**Timeline:** Week 3-4 (6 days)  
**Complexity:** ⭐⭐⭐⭐ High  
**Risk Level:** High

**Why Senior:**
- Central integration point
- Rate limiting implementation
- Cross-cutting concerns
- Error handling strategy

**Key Deliverables:**
- Express-based API Gateway
- Service routing and discovery
- Rate limiting and throttling
- Standardized error responses
- OpenAPI documentation hub
- Performance monitoring

**Mentoring:** Reviews integration patterns, API designs

---

## 👶 Junior Developers (Claude Haiku 4.5)

### Junior Agent 5: Frontend Developer
**AI Model:** ⚡ Claude Haiku 4.5 (claude-haiku-4-5-20250929)  
**Module:** React Frontend (13-MODULE-Frontend.md)  
**Timeline:** Week 3-10 (parallel, 12 days active)  
**Complexity:** ⭐⭐⭐ Medium  
**Risk Level:** Low-Medium

**Why Junior (Haiku):**
- ✅ Fast iteration for UI development
- ✅ Cost-effective for experimental work
- ✅ Visual feedback loop
- ✅ Component-based architecture
- ✅ Lower risk (no backend impact)

**Key Deliverables:**
- React + Vite + TypeScript setup
- Design system (Tailwind + shadcn/ui)
- Authentication UI
- CRM pages (List, Detail, Create)
- Ticket pages (List, Detail, Create)
- Dashboard and analytics
- E2E tests (Playwright)

**Supervision:**
- Senior Agent 2 reviews auth flows
- Senior Agent 3 reviews API integrations
- PM approves UI/UX decisions

**Growth:** Learns API integration, state management, testing

---

### Junior Agent 6: Auxiliary Developer
**AI Model:** ⚡ Claude Haiku 4.5  
**Module:** Billing + Projects + Assets (06, 07, 08-MODULE-*.md)  
**Timeline:** Phase 2 (Week 10+)  
**Complexity:** ⭐⭐ Low-Medium  
**Risk Level:** Low

**Why Junior (Haiku):**
- ✅ Well-defined CRUD operations
- ✅ Simpler business logic
- ✅ Good learning modules
- ✅ Clear specifications
- ✅ Lower criticality (Phase 2)

**Key Deliverables:**
- Billing system (invoices, contracts)
- Project management (tasks, milestones)
- Asset management (inventory, licenses)
- DATEV/BMD export functionality
- Report generation

**Supervision:**
- Senior Agent 1 reviews database schemas
- Senior Agent 3 reviews business logic
- PM approves integrations

**Growth:** Learns enterprise integrations, billing logic, export formats

---

## 🤖 AI Model Usage Strategy

### Model Selection Rationale

```
                    Claude Opus 4
                 (Project Manager)
                        │
                   Coordination
                    Decisions
                     Quality
                        │
        ┌───────────────┼───────────────┐
        │                               │
   Sonnet 4.5                      Haiku 4.5
  (Senior Devs)                  (Junior Devs)
        │                               │
   Complex Logic                    Fast UI
   Security Critical               Prototyping
   Architecture                    Learning
   High Risk                       Cost-Effective
```

### When to Use Each Model

**🧠 Opus 4 (Main Agent - PM):**
- Strategic decisions
- Cross-agent coordination
- Quality gate approvals
- Architecture reviews
- Conflict resolution
- Stakeholder communication

**🚀 Sonnet 4.5 (Senior Developers):**
- Security-critical code (Auth)
- Complex algorithms (SLA calculation)
- Database optimization
- System architecture
- Performance tuning
- Code review and mentoring

**⚡ Haiku 4.5 (Junior Developers):**
- UI/UX development
- Component libraries
- Well-defined CRUD operations
- Rapid prototyping
- Cost-sensitive iterations
- Learning and experimentation

### Cost-Benefit Analysis

| Scenario | Opus 4 | Sonnet 4.5 | Haiku 4.5 |
|----------|--------|------------|-----------|
| Security code | - | ✅ Best | ❌ Too risky |
| UI components | - | ❌ Overkill | ✅ Best |
| Complex logic | ✅ If strategic | ✅ Best | ❌ Too simple |
| CRUD APIs | - | ✅ Better | ✅ Acceptable |
| Architecture | ✅ Best | ✅ Good | ❌ Too junior |
| Prototyping | - | ❌ Too slow | ✅ Best |

---

## 📅 Timeline Overview

```
Week 1-2:  [Senior-1] Infrastructure (Sonnet 4.5) ✅
Week 2-3:  [Senior-2] Auth & RBAC (Sonnet 4.5) 🔄
           [Junior-5] Frontend setup (Haiku 4.5, parallel) 🔄
Week 3-4:  [Senior-4] API Gateway (Sonnet 4.5) 🔄
           [Junior-5] Login UI (Haiku 4.5, parallel) 🔄
Week 4-6:  [Senior-3] CRM (Sonnet 4.5) 🔄
           [Junior-5] CRM UI (Haiku 4.5, parallel) 🔄
Week 6-9:  [Senior-3] Tickets (Sonnet 4.5) 🔄
           [Junior-5] Ticket UI (Haiku 4.5, parallel) 🔄
Week 10:   Integration testing & MVP Alpha 🎯

Throughout: [Main Agent] PM coordination (Opus 4) 👔
```

---

## 🎯 Milestones

### M1: Infrastructure Complete (End Week 2)
- ✅ PostgreSQL running
- ✅ Redis running
- ✅ RabbitMQ running
- ✅ Elasticsearch running
- ✅ Health checks working
- ✅ `.env.template` complete
- ✅ Agent 1 → Agent 2 handover

### M2: Auth Complete (End Week 3)
- ✅ JWT authentication working
- ✅ User management APIs
- ✅ RBAC implemented
- ✅ Auth middleware package published
- ✅ Agent 2 → Agent 3 handover

### M3: Gateway Complete (End Week 4)
- ✅ API Gateway routing all services
- ✅ Rate limiting active
- ✅ Auth integrated
- ✅ Error handling standardized
- ✅ Agent 3 → Agent 4 handover

### M4: CRM Complete (End Week 6)
- ✅ Customer management working
- ✅ Contact management working
- ✅ Location management working
- ✅ Search & filters functional
- ✅ RabbitMQ events emitting
- ✅ Agent 4 → Agent 5 handover

### M5: Tickets Complete (End Week 9)
- ✅ Ticket lifecycle working
- ✅ SLA calculation accurate
- ✅ Email integration functional
- ✅ Time tracking working
- ✅ Agent 5 → Agent 6 handover

### M6: MVP Alpha (End Week 10)
- ✅ All services integrated
- ✅ Frontend functional
- ✅ End-to-end tests passing
- ✅ Ready for pilot testing

---

## 📞 Communication Matrix

### Questions About...

| Topic | Ask | Location |
|-------|-----|----------|
| Infrastructure setup | Agent-1 | `.subagents/issues/` |
| Authentication/JWT | Agent-2 | `.subagents/issues/` |
| API routing | Agent-3 | `.subagents/issues/` |
| Customer data | Agent-4 | `.subagents/issues/` |
| Tickets/SLA | Agent-5 | `.subagents/issues/` |
| Frontend/UI | Agent-6 | `.subagents/issues/` |
| Shared types | Original creator | `.subagents/issues/` |
| Git workflow | See GIT-INTEGRATION-GUIDE | - |
| Project direction | Main agent | Chat |

### Response Time Expectations

- 🔴 **Critical (Blocker):** < 4 hours
- 🟡 **Important:** < 24 hours
- 🟢 **Normal:** < 48 hours

---

## ✅ Daily Checklist

### For All Agents

**Every Day:**
- [ ] Update your status file (`.subagents/status/`)
- [ ] Check other agents' status files
- [ ] Check for issues affecting you (`.subagents/issues/`)
- [ ] Verify branch (`git status` - should show unified branch)
- [ ] Commit and push your work (`git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG`)

**Note:** With unified branch strategy, NO pull needed between local agents (same directory, same branch). Only pull when starting NEW Claude Code session to sync from GitHub.

**Every Week:**
- [ ] Update completion percentage
- [ ] Review handover document progress
- [ ] Sync with develop branch
- [ ] Check for outdated issues

---

## 🚨 Emergency Procedures

### You're Blocked

1. **Update status** to 🔴 Blocked
2. **Create critical issue** in `.subagents/issues/`
3. **@mention** who can unblock
4. **Work on** non-blocked tasks
5. **Escalate** to main agent if >4 hours

### You Found a Bug

1. **Create issue** with reproduction steps
2. **Mark severity:** 🔴 Critical | 🟡 Important | 🟢 Minor
3. **@mention** responsible agent
4. **DO NOT** fix without coordination (unless explicitly your code)

### Breaking Change Needed

1. **Create issue** explaining change
2. **List affected agents**
3. **Propose migration path**
4. **Wait for approval** from main agent
5. **Coordinate** with affected agents
6. **Update** all documentation

---

## 📊 Progress Tracking

### Check Project Status

```bash
# View all agent status
cat .subagents/status/*.md | grep "Progress:"

# Check for blockers
cat .subagents/status/*.md | grep "🔴"

# See recent commits
git log --oneline --graph --all --since="1 week ago"
```

### Check Your Progress

```bash
# Lines written
git log --author="Your Name" --pretty=tformat: --numstat | \
  awk '{ add += $1 } END { print add }'

# Commits made
git log --author="Your Name" --oneline | wc -l

# Test coverage
cd services/{your-service}
npm run test:coverage
```

---

## 🎓 Best Practices Summary

### Do's ✅

1. **Communicate early and often**
   - Update status daily
   - Ask questions immediately
   - Share decisions proactively

2. **Document everything**
   - Why you made decisions
   - How things work
   - What could go wrong

3. **Test thoroughly**
   - Unit tests (≥70%)
   - Integration tests
   - Manual testing

4. **Follow conventions**
   - Git commit format
   - File naming
   - Code style

5. **Help others succeed**
   - Write clear handovers
   - Answer questions promptly
   - Review others' work

### Don'ts ❌

1. **Don't work in silence**
   - Always update status
   - Ask when unsure
   - Report blockers

2. **Don't skip documentation**
   - Future you will thank you
   - Next agent depends on it
   - Main agent needs visibility

3. **Don't make breaking changes alone**
   - Always coordinate
   - Create issues first
   - Wait for approval

4. **Don't reinvent the wheel**
   - Check shared packages
   - Reuse utilities
   - Follow patterns

5. **Don't leave TODOs**
   - Fix or create issue
   - Link to issue number
   - Don't commit unfinished work

---

## 📚 Additional Resources

### External Documentation

- **TypeScript:** https://www.typescriptlang.org/docs/
- **Node.js:** https://nodejs.org/docs/
- **Express:** https://expressjs.com/
- **React:** https://react.dev/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Git:** https://git-scm.com/doc

### Internal Documentation

- **BDUF Specs:** `/mnt/project/*.md`
- **Module Specs:** `implementation/*.md`
- **Deployment:** `implementation/00-DEPLOYMENT-STRATEGY.md`

---

## 🎯 Definition of Done

### For Each Agent

Work is complete when:

1. ✅ All features implemented per spec
2. ✅ Tests written (unit + integration, ≥70%)
3. ✅ All tests pass
4. ✅ Code linted (0 errors, 0 warnings)
5. ✅ TypeScript compiles (0 errors)
6. ✅ API documented (OpenAPI)
7. ✅ README.md complete
8. ✅ Handover document complete
9. ✅ Status file finalized
10. ✅ Next agent acknowledges
11. ✅ Main agent approves
12. ✅ Merged to develop

---

## 🎉 Success Metrics

Track these in your status:

**Velocity:**
- Story points / week
- Tasks completed / planned
- Actual vs estimated time

**Quality:**
- Test coverage %
- Bug count
- Code review feedback

**Collaboration:**
- Issues created/resolved
- Response time
- Handover quality

---

## ❓ FAQ

**Q: Where do I start?**  
A: Read [QUICK-START.md](QUICK-START.md) first!

**Q: How do I coordinate with others?**  
A: Use `.subagents/` folder - status files, issues, handovers.

**Q: What if I'm blocked?**  
A: Update status to 🔴, create critical issue, work on other tasks.

**Q: How often should I commit?**  
A: Frequently! At least daily with status update.

**Q: When do I create a handover?**  
A: When you complete your work and next agent needs to start.

**Q: How do I ask questions?**  
A: Create issue in `.subagents/issues/`, @mention relevant agent.

**Q: What if I find a bug?**  
A: Create issue, mark severity, @mention responsible agent.

**Q: Can I change another agent's code?**  
A: No! Create issue, propose solution, let them fix or get permission.

---

## 📞 Getting Help

### Process

1. **Check documentation** first
   - Your module spec
   - Handover from previous agent
   - Templates and guides

2. **Search existing issues**
   ```bash
   grep -r "search term" .subagents/
   ```

3. **Create new issue**
   - Use template
   - Be specific
   - @mention relevant agent

4. **Escalate if critical**
   - Update status to 🔴
   - Notify main agent
   - Continue on other work

---

## 🔄 Document Maintenance

This documentation is maintained by:
- **Main Agent:** Overall coordination
- **All Agents:** Contribute improvements

### Suggesting Changes

```bash
# Create issue
cp TEMPLATE-issue.md .subagents/issues/2025-11-04-doc-improvement.md

# Describe improvement
# @mention main agent

# Or directly propose change
# Edit file, commit with prefix: docs(meta):
git commit -m "docs(meta): improve Quick Start clarity"
```

---

## 🎓 Final Notes

### Remember

- **Communication is key** - Don't work in silence
- **Documentation matters** - Write for future you
- **Quality over speed** - Do it right the first time
- **Help each other** - We succeed together
- **Ask questions** - There are no dumb questions

### You've Got This! 🚀

Everything you need is in these documents:
1. Start with QUICK-START.md
2. Reference SUBAGENTS-README.md daily
3. Use templates for consistency
4. Follow GIT-INTEGRATION-GUIDE.md
5. Read SUB-AGENT-CONFIG.md for details

**Good luck with your implementation!**

---

**Last Updated:** 2025-11-04  
**Version:** 1.0  
**Maintained By:** Main Agent

**Questions?** Create an issue in `.subagents/issues/`
