# Agent Status Update Template

**Date:** YYYY-MM-DD  
**Agent:** Agent {N} - {Name}  
**Module:** {Module Name}  
**Status:** 🟢 On Track | 🟡 Minor Issues | 🔴 Blocked  
**Progress:** XX%  
**Estimated Completion:** YYYY-MM-DD

---

## 📊 Today's Work

### ✅ Completed
- [Task description with details]
  - Files: `path/to/file.ts`
  - Impact: [Who/what is affected]
- [Another completed task]

### 🔄 In Progress
- [Task description]
  - Current status: [Brief status]
  - Estimated completion: [Date/time]
  - Blockers: [None/List if any]

### ⏳ Planned
- [ ] [Next task]
- [ ] [Another task]

---

## 🚧 Blockers & Issues

### 🔴 Critical Blockers
- **Issue:** [Clear description]
  - **Waiting for:** @Agent-{N} / [Resource]
  - **Impact:** [What can't be done]
  - **Created Issue:** `.subagents/issues/YYYY-MM-DD-description.md`

### 🟡 Minor Issues
- **Issue:** [Description]
  - **Workaround:** [How handling it]
  - **Resolution planned:** [When]

---

## 💬 Questions for Other Agents

### @Agent-{N}
- **Question:** [Specific question]
- **Context:** [Why you need this]
- **Urgency:** 🔴 Critical | 🟡 Important | 🟢 Normal

### @Agent-{M}
- **Question:** [Another question]

---

## 📅 Tomorrow's Plan

### High Priority
- [ ] [Critical task]
- [ ] [Important task]

### Normal Priority
- [ ] [Task that affects others]
- [ ] [Regular task]

### Dependencies
- Waiting for: [What/who]
- Will unblock: @Agent-{N}

---

## 📦 Deliverables Completed Today

| Deliverable | Status | Location | Notes |
|-------------|--------|----------|-------|
| Database schema | ✅ Complete | `infrastructure/database/schema.sql` | Reviewed and tested |
| API endpoint | 🔄 In progress | `services/auth/controllers/login.ts` | 80% done |
| Tests | ⏳ Planned | `tests/unit/auth.test.ts` | Starting tomorrow |

---

## 🔧 Technical Decisions Made

### Decision 1: [Decision Name]
- **What:** [What was decided]
- **Why:** [Rationale]
- **Alternatives:** [What else was considered]
- **Impact:** [Who/what is affected]
- **Reversible:** Yes/No
- **Documentation:** [Where documented]

### Decision 2: [Another Decision]
- **What:** [Decision]
- **Why:** [Reason]
- **Affects:** @Agent-{N}, @Agent-{M}

---

## 📝 Files Changed Today

```
Modified:
  .subagents/shared/types.ts         (+15, -2)
  services/auth/controllers/user.ts  (+45, -0)
  infrastructure/database/init.sql   (+23, -5)

Added:
  services/auth/middleware/jwt.ts    (+120, -0)
  tests/unit/auth/jwt.test.ts        (+85, -0)

Deleted:
  services/auth/old-approach.ts      (-45)
```

---

## 🔄 Updates to Shared Resources

### .env.template
```bash
# Added by Agent-{N} on YYYY-MM-DD
NEW_VARIABLE=default_value  # Purpose: [Explanation]
```

### types.ts
```typescript
// Added by Agent-{N} on YYYY-MM-DD
export interface NewType {
  field: string;
  // Purpose: [Explanation]
}
```

### Notification
⚠️ **Other agents:** Please pull latest `.subagents/shared/` files!

---

## 📈 Metrics

### Test Coverage
- **Current:** XX%
- **Target:** 70%
- **Trend:** ⬆️ Improving / ⬇️ Decreasing / → Stable

### Performance
- **API Response Time:** XXms (target: <200ms)
- **Database Query Time:** XXms (target: <50ms)
- **Build Time:** XXs

### Code Quality
- **ESLint Warnings:** X (target: 0)
- **TypeScript Errors:** X (target: 0)
- **Security Vulnerabilities:** X (target: 0)

---

## 💡 Learnings & Notes

### What Went Well
- [Something that worked great]
- [Good decision made]

### What Could Be Better
- [Challenge faced]
- [How to improve]

### Tips for Next Agent
- [Helpful tip based on experience]
- [Watch out for: potential issue]

---

## 🔗 Related Links

- **Module Spec:** `implementation/XX-MODULE-Name.md`
- **API Docs:** `docs/api/service.openapi.yaml`
- **Related Issues:** `.subagents/issues/YYYY-MM-DD-*.md`
- **Previous Status:** `.subagents/status/agent-{N}-{name}-YYYY-MM-DD.md`

---

## ⏭️ Next Session Focus

**Priority 1:** [Most important task]  
**Priority 2:** [Second priority]  
**Priority 3:** [Third priority]

**Estimated Time:**
- Priority 1: X hours
- Priority 2: X hours
- Priority 3: X hours

**Risk Factor:** 🟢 Low | 🟡 Medium | 🔴 High

---

**Last Updated:** YYYY-MM-DD HH:MM  
**Next Update:** YYYY-MM-DD (tomorrow)
