# Active Agent Todo Lists

**Last Updated:** 2025-11-05 10:25 UTC
**Updated By:** Main Agent (PM)

This document tracks the current todos for all active agents. Each agent should check this file at the start of their work session.

---

## 🟢 Senior-2 - Auth Backend Agent (Support Mode)

**Status:** ✅ 97% Complete - Standing By
**Mode:** Support/Monitoring
**Last Update:** 2025-11-05 09:40 UTC

### Active Todos:

- [x] Core auth features complete (97%)
- [x] Redis deployed and rate limiting operational
- [x] All frontend issues resolved
- [x] Handover to Gateway complete
- [ ] **CHECK ISSUES EVERY 10 MINUTES:** Monitor `.subagents/issues/` directory
- [ ] Respond to Senior-4 (Gateway) JWT/RBAC questions (SLA: < 1 hour)
- [ ] Respond to Junior-5 (Frontend) API questions (SLA: < 2 hours)
- [ ] Optional: Configure OAuth client secrets when DevOps provides credentials

**Current Task:** Monitoring for issues, standing by to support team

---

## 🟢 Senior-4 - API Gateway Agent (Active Development)

**Status:** 🔄 Day 2 In Progress (12.5% complete)
**Mode:** Active Development
**Last Update:** 2025-11-05 09:36 UTC

### Day 2 Todos (In Progress):

#### JWT Authentication Middleware
- [ ] Copy `auth.middleware.ts` from auth service (`services/auth-service/src/middleware/auth.middleware.ts`)
- [ ] Adapt JWT validation for gateway use
- [ ] Copy JWT secret from auth service `.env`
- [ ] Copy shared types from auth service (`src/types/index.ts`)
- [ ] Test JWT validation with real tokens from auth service
- [ ] Integrate into proxy routes

#### RBAC Middleware
- [ ] Copy `rbac.middleware.ts` from auth service (`services/auth-service/src/middleware/rbac.middleware.ts`)
- [ ] Ensure all 23 roles are supported
- [ ] Implement role hierarchy checks
- [ ] Test role-based access control

#### Protected Routes
- [ ] Add authentication to appropriate routes
- [ ] Test with real JWT tokens from auth service
- [ ] Verify user context forwarding to downstream services
- [ ] Test unauthorized access (401 responses)
- [ ] Test forbidden access (403 responses)

#### Rate Limiting
- [ ] Install rate-limit dependencies (`express-rate-limit`, `rate-limit-redis`)
- [ ] Configure Redis connection (localhost:6379)
- [ ] Implement global rate limiting (per IP)
- [ ] Implement per-user rate limiting (authenticated)
- [ ] Implement per-endpoint rate limiting
- [ ] Test 429 Too Many Requests responses
- [ ] Add rate limit headers to responses

#### Day 2 Completion
- [ ] All authentication integrated and tested
- [ ] All rate limiting working
- [ ] Update status file with Day 2 completion
- [ ] Commit and push all changes
- [ ] Plan Day 3 work (Circuit Breaker pattern)

**Current Task:** JWT authentication middleware integration

**Support Available:**
- @Senior-2 for JWT/RBAC implementation questions
- @Main-Agent for architecture decisions

---

## 🟢 Junior-5 - Frontend Agent (Active Development)

**Status:** 🚀 55% Complete - Ahead of Schedule
**Mode:** Active Development
**Last Update:** 2025-11-05 09:00 UTC

### Current Sprint Todos:

#### Backend Integration Updates
- [ ] **URGENT:** Revert password minimum from 12 → 8 characters (backend now accepts 8+)
  - Update `RegisterPage.tsx` password validation
  - Update password requirements checklist UI
  - Test registration with 8-character password
- [ ] Update password requirements text to reflect 8-char minimum
- [ ] Remove workaround comments from code

#### Dashboard & CRM UI (Next Phase)
- [ ] Build main Dashboard page with stats/widgets
- [ ] Create CustomerList page (CRM)
- [ ] Create CustomerDetail page (CRM)
- [ ] Create CreateCustomer page (CRM)
- [ ] Design customer data table component
- [ ] Implement search and filter for customers
- [ ] Add pagination for customer list

#### Testing & Quality
- [ ] End-to-end test of full auth flow (register → login → MFA → dashboard)
- [ ] Test password reset flow completely
- [ ] Test MFA setup and verification flow
- [ ] Verify all error states display correctly
- [ ] Check responsive design on mobile
- [ ] Test all navigation and routing

#### Integration with Gateway (Future)
- [ ] Update API base URL when gateway is ready (port 3000 vs 3001)
- [ ] Test through gateway proxy
- [ ] Verify CORS works through gateway

**Current Task:** Building CRM UI pages

**Support Available:**
- @Senior-2 for auth API questions
- @Senior-4 for gateway integration (when ready)
- @Main-Agent for UI/UX decisions

---

## 📊 Todo Summary

| Agent | Active Todos | Status | Priority |
|-------|--------------|--------|----------|
| Senior-2 | 4 (3 monitoring) | ✅ Complete, standing by | P2 - Support |
| Senior-4 | 20+ (Day 2 work) | 🔄 In progress | P1 - Critical path |
| Junior-5 | 15+ | 🔄 In progress | P1 - Parallel work |

---

## 🔔 Issue Monitoring Protocol

### For Agents in Support Mode (Senior-2):

**Check `.subagents/issues/` every 10 minutes:**

```bash
# Every 10 minutes, run:
ls -lt /opt/psa-putzi/.subagents/issues/*.md | head -5

# Check for new issues created in last 10 minutes:
find /opt/psa-putzi/.subagents/issues -name "*.md" -mmin -10

# Read any new issues:
cat /opt/psa-putzi/.subagents/issues/YYYY-MM-DD-*.md
```

**Response SLA:**
- 🔴 Critical blockers: < 1 hour
- 🟡 Important issues: < 2 hours
- 🟢 Normal questions: < 4 hours

**If no issues found:**
- Continue monitoring every 10 minutes
- Review other agents' status files for updates
- Check PM2 service health (`pm2 status`)
- Optional: Work on OAuth client secrets configuration

---

## 📝 How to Use This File

### For Sub-Agents:
1. **Start of session:** Read your section in this file
2. **During work:** Update progress by marking `[x]` completed items
3. **Blocked?** Create issue in `.subagents/issues/` and @mention relevant agent
4. **End of session:** Update your status file with progress

### For Main Agent (PM):
1. Update this file when priorities change
2. Add new todos when scope expands
3. Remove completed todos periodically
4. Monitor that agents are making progress

---

## 🎯 Current Sprint Goals

**Week 2 Focus:** Gateway + Frontend + Auth Support

- **Senior-2:** Support mode, 97% complete ✅
- **Senior-4:** Complete Day 2 (JWT/RBAC) by end of today
- **Junior-5:** Continue auth UI, start dashboard/CRM pages

**Target for End of Week:**
- Gateway 40% complete (Day 2-3 done)
- Frontend 70% complete (dashboard + basic CRM)
- Auth service 100% stable in production

---

**Next Update:** 2025-11-05 17:00 UTC (end of day check)
**Maintained By:** Main Agent (Project Manager)
