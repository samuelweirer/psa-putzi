# .subagents/ - Sub-Agent Coordination Hub

**Purpose:** Central coordination point for all sub-agents working on PSA-Putzi  
**Version:** 1.0  
**Last Updated:** 2025-11-04

---

## 📁 Folder Structure

```
.subagents/
├── README.md                  # This file - Quick start guide
├── status/                    # Daily status updates
│   ├── agent-1-infrastructure.md
│   ├── agent-2-auth.md
│   ├── agent-3-gateway.md
│   ├── agent-4-crm.md
│   ├── agent-5-tickets.md
│   └── agent-6-frontend.md
├── handovers/                 # Handover documents
│   ├── 01-infra-to-auth.md
│   ├── 02-auth-to-gateway.md
│   ├── 03-gateway-to-crm.md
│   ├── 04-crm-to-tickets.md
│   └── 05-types-to-frontend.md
├── shared/                    # Shared resources
│   ├── .env.template          # Environment variables (ALL services)
│   ├── types.ts               # Shared TypeScript types
│   ├── constants.ts           # Shared constants
│   └── errors.ts              # Error definitions
└── issues/                    # Cross-agent issues
    ├── 2025-11-04-example-issue.md
    └── [more issues as needed]
```

---

## 🚀 Quick Start for Sub-Agents

### I'm a New Sub-Agent, Where Do I Start?

1. **Read Your Assignment**
   - Location: `implementation/XX-MODULE-{YourModule}.md`
   - This defines WHAT you need to build

2. **Check Dependencies**
   - Read: `.subagents/handovers/` from previous agents
   - Get: `.subagents/shared/.env.template`
   - Import: `.subagents/shared/types.ts`

3. **Set Up Your Environment**
   ```bash
   cd /opt/psa-putzi
   git pull
   cp .subagents/shared/.env.template services/{your-service}/.env
   # Edit .env with your values
   cd services/{your-service}
   npm install
   ```

4. **Create Your Status File**
   ```bash
   cp templates/TEMPLATE-status-update.md .subagents/status/{module}-YYYY-MM-DD.md
   # Update with your info
   ```

5. **Start Working**
   - Build your module
   - Update status after each session
   - Ask questions in .subagents/issues/
   - Share changes in .subagents/shared/

6. **Before You Finish**
   ```bash
   cp templates/TEMPLATE-handover.md .subagents/handovers/{NN}-{module}-complete.md
   # Complete all sections
   ```

---

## 📝 Daily Workflow

### Every Day You Work

**Morning (Start of Session):**
```bash
# UNIFIED BRANCH WORKFLOW (all agents on same branch, same directory)
# Changes are immediately visible - no pull needed between local agents!

1. git status                        # Verify you're on unified branch
2. Check .subagents/issues/          # Any blockers for you?
3. Check .subagents/shared/          # Any new types/constants?
4. Review other agents' status       # What are they doing?

# ONLY IF starting fresh session (to sync with GitHub):
# git pull origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**During Work:**
```bash
1. Make changes to your code
2. If adding shared types:
   - Update .subagents/shared/types.ts
   - Add changelog comment at top
3. If you need help:
   - Create issue in .subagents/issues/YYYY-MM-DD-description.md
   - Use TEMPLATE-issue.md as template
```

**End of Session:**
```bash
1. Update or create .subagents/status/{module}-YYYY-MM-DD.md
   - What you accomplished this session
   - What's blocking you (if any)
   - What you'll do next session
2. Commit and push your changes
   - Use conventional commits (feat/fix/docs/test)
3. Notify others if you changed shared files
```

---

## 🤝 Communication Protocols

### When to Create an Issue

Create in `.subagents/issues/` when:

- ❌ **You're blocked** by another agent
- ❓ **You have a question** that affects design
- 🐛 **You found a bug** in someone else's code
- 💡 **You need a decision** from main agent
- ⚠️ **Breaking change** needed in shared code

**Template:** `TEMPLATE-issue.md`

### When to Update Shared Files

Update `.subagents/shared/` when:

- ➕ **Adding new types** that others will use
- 🔧 **Adding environment variables** others need
- 📝 **Defining error codes** for your module
- 🎯 **Adding constants** that are cross-module

**CRITICAL:** Always add changelog comment at top!

### When to Create Handover

Create in `.subagents/handovers/` when:

- ✅ **Your module is complete** (or phase complete)
- 🔄 **Another agent needs your work** to proceed
- 📦 **You're creating shared packages** others will use

**Template:** `TEMPLATE-handover.md`

---

## 📂 File Naming Conventions

### Status Files
```
.subagents/status/agent-{N}-{name}.md
                         ↑      ↑
                         |      └─ Module name (lowercase, hyphenated)
                         └──────── Agent number (1-6)

Examples:
- agent-1-infrastructure.md
- agent-2-auth.md
- agent-3-gateway.md
```

### Handover Files
```
.subagents/handovers/{NN}-{from}-to-{to}.md
                      ↑     ↑       ↑
                      |     |       └─ Receiving agent/module
                      |     └───────── Sending agent/module
                      └─────────────── Sequence number (01, 02, 03...)

Examples:
- 01-infra-to-auth.md
- 02-auth-to-gateway.md
- 03-gateway-to-crm.md
```

### Issue Files
```
.subagents/issues/{YYYY-MM-DD}-{short-description}.md
                   ↑            ↑
                   |            └─ Brief description (kebab-case)
                   └────────────── Date created (ISO format)

Examples:
- 2025-11-04-jwt-validation-error.md
- 2025-11-05-database-connection-timeout.md
- 2025-11-06-crm-api-contract-change.md
```

---

## 🎯 Agent Responsibilities Matrix

| Agent | Module | Status File | Creates | Consumes |
|-------|--------|-------------|---------|----------|
| **1** | Infrastructure | `agent-1-infrastructure.md` | DB schemas, .env.template | - |
| **2** | Auth | `agent-2-auth.md` | JWT middleware, User types | .env.template, DB schema |
| **3** | Gateway | `agent-3-gateway.md` | Error types, API routes | Auth middleware |
| **4** | CRM | `agent-4-crm.md` | Customer types, Events | Auth, Gateway, DB |
| **5** | Tickets | `agent-5-tickets.md` | Ticket types, TimeEntry | Auth, Gateway, Customer types |
| **6** | Frontend | `agent-6-frontend.md` | UI components | All backend APIs, All types |

---

## 📊 Current Project Status

### Overall Progress
```
Phase 1 (MVP): [██████░░░░] 60%
├─ Infrastructure:  [██████████] 100% ✅
├─ Auth:            [████████░░] 80% 🔄
├─ Gateway:         [██████░░░░] 60% 🔄
├─ CRM:             [████░░░░░░] 40% 🔄
├─ Tickets:         [░░░░░░░░░░] 0% ⏳
└─ Frontend:        [██░░░░░░░░] 20% 🔄
```

### Active Agents
- 🟢 Agent-1 (Infrastructure): Complete, available for questions
- 🟢 Agent-2 (Auth): Active, on track
- 🟡 Agent-3 (Gateway): Active, waiting for Auth middleware
- 🔴 Agent-4 (CRM): Blocked, needs Gateway completion
- ⏸️ Agent-5 (Tickets): Not started yet
- 🟢 Agent-6 (Frontend): Active, building basic structure

### Next Milestones
- **Week 3:** Auth & Gateway complete, CRM starts
- **Week 6:** CRM complete, Tickets starts
- **Week 10:** MVP complete, integration testing

---

## 🚨 Common Issues & Solutions

### "I can't find a file mentioned in the handover"
**Solution:** Check if it's in a different branch or ask the original agent in an issue.

### "Types from @psa/types are not importing"
**Solution:** 
```bash
cd packages/types
npm run build
npm link
cd ../../services/your-service
npm link @psa/types
```

### "My service can't connect to database"
**Solution:** Check `.subagents/shared/.env.template` for correct connection string.

### "Another agent changed something I depend on"
**Solution:** Check their latest status file and create an issue if it breaks your code.

### "I need to change a shared type but it will break others"
**Solution:** 
1. Create issue explaining the change
2. Propose migration path
3. Wait for main agent approval
4. Coordinate with affected agents

---

## 📞 Emergency Contacts

### Urgent Issues (🔴 Blockers)

1. **Update your status** to 🔴 Blocked
2. **Create critical issue** in `.subagents/issues/`
3. **@mention relevant agent** in the issue
4. **Notify main agent** in chat if >4 hours no response

### Questions (🟡 Important)

1. **Check handover docs** first
2. **Check other agent's status** file
3. **Create issue** if still unclear
4. **@mention the agent**

### Minor Issues (🟢 Low Priority)

1. **Create issue** with details
2. **Continue other work** while waiting
3. **Check back daily** for responses

---

## ✅ Quality Checklist

Before creating handover document:

### Code Quality
- [ ] All tests pass (≥70% coverage)
- [ ] ESLint: 0 errors, 0 warnings
- [ ] TypeScript: 0 errors
- [ ] No console.log in production code
- [ ] All TODOs have issue references

### Documentation
- [ ] Status file up to date
- [ ] Handover document complete
- [ ] API documented (OpenAPI)
- [ ] README.md in service folder
- [ ] Shared types updated
- [ ] .env.template updated

### Integration
- [ ] Service starts without errors
- [ ] Health check passes
- [ ] Connects to all required services
- [ ] Uses auth middleware
- [ ] Emits/consumes correct events

---

## 🎓 Best Practices

### ✅ Do This

```typescript
// Good: Add changelog to shared types
/**
 * CHANGELOG
 * 
 * 2025-11-04 - Agent-2:
 *   - Added User interface
 */
export interface User {
  id: string;
  email: string;
}
```

```typescript
// Good: Use descriptive error messages
throw new Error('User authentication failed: Invalid JWT token');
```

```markdown
<!-- Good: Clear status update -->
## Today's Work
- ✅ Implemented login endpoint
- ✅ Added JWT validation tests
- 🔄 Working on refresh token logic (80% done)
```

### ❌ Don't Do This

```typescript
// Bad: No changelog
export interface User {
  id: string;
}
```

```typescript
// Bad: Vague error
throw new Error('Error');
```

```markdown
<!-- Bad: Vague status -->
## Today's Work
- Did stuff
- Making progress
```

---

## 📚 Templates

All templates are in the project root:

- **Status Update:** `TEMPLATE-status-update.md`
- **Handover:** `TEMPLATE-handover.md`
- **Issue:** `TEMPLATE-issue.md`

Copy the template, fill it out, save to appropriate folder.

---

## 🔄 Version Control

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance

**Example:**
```
feat(auth): implement JWT refresh token

- Add refresh token generation
- Add refresh token validation
- Add token rotation logic

Refs: .subagents/issues/2025-11-04-token-refresh.md
```

---

## 📊 Metrics

Track these in your status file:

**Development Velocity:**
- Story points completed
- Tasks finished vs planned
- Time actual vs estimated

**Code Quality:**
- Test coverage %
- ESLint warnings
- TypeScript errors

**Collaboration:**
- Issues created
- Issues resolved
- Response time to questions

---

## 🎉 Success Criteria

### For Each Agent

Your work is considered complete when:

1. ✅ All features from module spec implemented
2. ✅ Tests written and passing (≥70% coverage)
3. ✅ API documented (OpenAPI spec)
4. ✅ Handover document complete and reviewed
5. ✅ Next agent acknowledges readiness to start
6. ✅ Integration tests pass
7. ✅ No critical issues outstanding
8. ✅ Status file finalized
9. ✅ Main agent approves completion
10. ✅ Knowledge transfer complete

---

## 📖 Additional Resources

**Main Documentation:**
- Project root: `/opt/psa-putzi/`
- Module specs: `implementation/XX-MODULE-*.md`
- Deployment: `implementation/00-DEPLOYMENT-STRATEGY.md`
- Project management: `project-management/PROJECT-MANAGEMENT.md`

**Tools & Guides:**
- Sub-Agent Config: `SUB-AGENT-CONFIG.md`
- Testing Guide: `docs/guides/testing.md`
- API Standards: `docs/guides/api-standards.md`

---

## 💬 Communication Tips

### Writing Good Status Updates

**Good:**
```
- ✅ Implemented user registration (services/auth/register.ts)
- 🔄 Working on email verification (70% done, needs SMTP config)
- ⏳ Will start password reset tomorrow
```

**Bad:**
```
- Made progress
- Did some coding
- Will continue
```

### Writing Good Issues

**Good:**
```markdown
# Issue: JWT validation fails for expired tokens

**Problem:** Token validation doesn't check expiration
**Impact:** Security vulnerability, all agents blocked
**Solution:** Add exp claim validation in jwt.service.ts:45
**Effort:** 2 hours
```

**Bad:**
```markdown
# Issue: JWT broken

Token doesn't work
```

### Asking Good Questions

**Good:**
```
@Agent-2: In your User type (types.ts:45), the `role` field 
is optional. Should it default to 'user' or throw an error 
if not provided? This affects my CRM customer creation logic.
```

**Bad:**
```
@Agent-2: User type question
```

---

## 🔧 Troubleshooting

### Service Won't Start

1. Check `.env` file exists and is complete
2. Verify database is running: `psql -h localhost -U psa_admin`
3. Check port isn't in use: `lsof -i :3010`
4. Review error logs: `npm run logs`

### Tests Failing

1. Ensure test database is set up: `npm run db:test:setup`
2. Check test fixtures are loaded
3. Verify mocks are correct
4. Run single test: `npm test -- test-name`

### Can't Import Shared Types

1. Build types package: `cd packages/types && npm run build`
2. Link package: `npm link`
3. In your service: `npm link @psa/types`
4. Restart TypeScript server in your IDE

---

## 📅 Weekly Routine

### Monday Morning
- [ ] Review all agent status files
- [ ] Check for blockers (🔴)
- [ ] Update project timeline if needed
- [ ] Prioritize issues for the week

### Friday Afternoon
- [ ] Update completion percentages
- [ ] Review week's progress
- [ ] Plan next week
- [ ] Update risk assessment

---

**Need Help?** Create an issue in `.subagents/issues/`  
**Questions about Process?** Ask in main chat  
**Found a Bug in This System?** Create issue with 🐛 Bug tag

---

**Last Updated:** 2025-11-04  
**Maintained By:** Main Agent  
**Version:** 1.0
