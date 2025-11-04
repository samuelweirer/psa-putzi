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

## 👥 Sub-Agent Roles

### Agent 1: Infrastructure Engineer
**Module:** Infrastructure  
**Timeline:** Week 1-2 (5 days)  
**Files:** `01-MODULE-Infrastructure.md`  
**Delivers:** Database, Redis, RabbitMQ, Elasticsearch

**Key Deliverables:**
- PostgreSQL setup with schemas
- Redis configuration
- RabbitMQ exchanges and queues
- `.env.template` with all connection strings
- Health check scripts

**Handover:** → Agent 2 (Auth)

---

### Agent 2: Auth & Security Specialist
**Module:** Authentication & RBAC  
**Timeline:** Week 2-3 (7 days)  
**Files:** `02-MODULE-Auth.md`  
**Depends on:** Agent 1  
**Delivers:** Auth service with JWT & RBAC

**Key Deliverables:**
- JWT authentication (RS256)
- User management APIs
- RBAC system (roles, permissions)
- `@psa/auth-middleware` package
- User/Role/Permission types

**Handover:** → Agent 3 (Gateway)

---

### Agent 3: API Gateway Architect
**Module:** API Gateway  
**Timeline:** Week 3-4 (6 days)  
**Files:** `03-MODULE-API-Gateway.md`  
**Depends on:** Agent 2  
**Delivers:** Central API Gateway

**Key Deliverables:**
- Express-based gateway
- Route all backend services
- Rate limiting
- Request/response logging
- Standardized error responses

**Handover:** → Agent 4 (CRM)

---

### Agent 4: CRM Developer
**Module:** CRM (Customer Relationship Management)  
**Timeline:** Week 4-6 (10 days)  
**Files:** `04-MODULE-CRM.md`  
**Depends on:** Agent 3  
**Delivers:** Customer, Contact, Location management

**Key Deliverables:**
- Customer CRUD APIs
- Contact management
- Location management
- UID validation (VIES)
- Customer/Contact/Location types
- RabbitMQ events

**Handover:** → Agent 5 (Tickets)

---

### Agent 5: Ticketing System Developer
**Module:** Ticketing & Time Tracking  
**Timeline:** Week 6-9 (14 days)  
**Files:** `05-MODULE-Tickets.md`  
**Depends on:** Agent 4  
**Delivers:** Complete ticketing system

**Key Deliverables:**
- Ticket lifecycle management
- SLA calculation engine
- Email integration (SMTP/IMAP)
- Time tracking
- Notifications
- Ticket/TimeEntry types

**Handover:** → Agent 6 (Frontend integration)

---

### Agent 6: Frontend Developer
**Module:** React Frontend  
**Timeline:** Week 3-10 (parallel, 12 days active)  
**Files:** `13-MODULE-Frontend.md`  
**Depends on:** Agent 2+, then others progressively  
**Delivers:** React application

**Key Deliverables:**
- React + Vite + TypeScript setup
- Design system (Tailwind + shadcn/ui)
- Authentication flow
- CRM pages
- Ticket pages
- Dashboard
- E2E tests

**Integrates with:** All backend services

---

## 📅 Timeline Overview

```
Week 1-2:  [Agent-1] Infrastructure ✅
Week 2-3:  [Agent-2] Auth & RBAC 🔄
           [Agent-6] Frontend setup (parallel) 🔄
Week 3-4:  [Agent-3] API Gateway 🔄
           [Agent-6] Login UI (parallel) 🔄
Week 4-6:  [Agent-4] CRM 🔄
           [Agent-6] CRM UI (parallel) 🔄
Week 6-9:  [Agent-5] Tickets 🔄
           [Agent-6] Ticket UI (parallel) 🔄
Week 10:   Integration testing & MVP Alpha 🎯
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
- [ ] Pull latest changes (`git pull origin develop`)
- [ ] Commit and push your work (`git push`)

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
