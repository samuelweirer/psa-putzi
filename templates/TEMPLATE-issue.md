# Issue Template

**Date Created:** YYYY-MM-DD  
**Issue ID:** YYYY-MM-DD-{short-description}  
**Reported By:** Agent {N} - {Name}  
**Severity:** 🔴 Critical | 🟡 Important | 🟢 Minor  
**Type:** 🐛 Bug | 💡 Question | 🔄 Change Request | ⚠️ Blocker | 📖 Documentation  
**Status:** 🆕 New | 🔄 In Progress | ⏸️ On Hold | ✅ Resolved | ❌ Closed

---

## 📋 Summary

**One-Line Description:**
[Clear, concise description of the issue]

**Affected Agents:**
- @Agent-{N}
- @Agent-{M}

**Affected Components:**
- `path/to/component`
- `path/to/another/component`

---

## 🎯 Problem Description

### What's Wrong?
[Detailed description of the issue, bug, or question]

### Why Is This a Problem?
[Explain the impact and why this matters]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

---

## 📊 Impact Assessment

### Severity Justification
**🔴 Critical** - [Why this blocks all work]
**🟡 Important** - [Why this impacts quality/timeline]
**🟢 Minor** - [Why this can wait]

### Who Is Blocked?
- @Agent-{N}: [What they can't do]
- @Agent-{M}: [What they can't do]

### Timeline Impact
- **Without fix:** [What will happen]
- **With fix:** [What becomes possible]
- **Fix urgency:** ASAP | This week | Next sprint | Backlog

---

## 🔍 Steps to Reproduce

### Prerequisites
```bash
# Environment setup needed
npm install
npm run setup
```

### Reproduction Steps
1. [First step]
   ```bash
   # Command if applicable
   ```
2. [Second step]
3. [Third step]

### Actual Result
[What you see/get]

### Expected Result
[What should happen]

---

## 🖼️ Screenshots / Logs

### Error Messages
```
[Paste error messages here]
```

### Stack Trace
```
[Paste stack trace if applicable]
```

### Screenshots
[Attach or link to screenshots if applicable]

---

## 🔧 Technical Details

### Environment
```bash
Node Version: vXX.XX.XX
npm Version: vXX.XX.XX
OS: [Operating System]
Container: [Container ID/Name]
```

### Affected Files
```
services/auth/src/controllers/user.controller.ts:45
services/auth/src/services/jwt.service.ts:123
.subagents/shared/types.ts:89
```

### Related Code
```typescript
// Current implementation
export function problematicFunction() {
  // This causes the issue
  return someValue;
}
```

---

## 💡 Proposed Solution

### Option 1: [Preferred Solution]
**Description:**
[Explain the solution]

**Implementation:**
```typescript
// Proposed fix
export function fixedFunction() {
  // Better approach
  return improvedValue;
}
```

**Pros:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]

**Cons:**
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Effort:** X hours/days

### Option 2: [Alternative Solution]
**Description:**
[Explain alternative]

**Pros:**
- ✅ [Advantage]

**Cons:**
- ❌ [Disadvantage]

**Effort:** X hours/days

### Recommended Approach
[Which option and why]

---

## 🗣️ Discussion

### 2025-11-04 10:00 - @Agent-{N}
[Initial comment or question]

### 2025-11-04 11:30 - @Agent-{M}
[Response or additional info]

**Follow-up questions:**
- [ ] Question 1?
- [ ] Question 2?

### 2025-11-05 09:00 - @Agent-{N}
[Response to questions]

---

## 🎯 Action Items

### Immediate Actions
- [ ] @Agent-{N}: [Specific task]
  - **Deadline:** YYYY-MM-DD
  - **Status:** 🆕 Not Started
- [ ] @Agent-{M}: [Specific task]
  - **Deadline:** YYYY-MM-DD
  - **Status:** 🔄 In Progress

### Follow-up Actions
- [ ] [Task after immediate fix]
- [ ] [Documentation update needed]
- [ ] [Test to add]

---

## 📝 Related Information

### Related Issues
- `.subagents/issues/YYYY-MM-DD-other-issue.md`
- `.subagents/issues/YYYY-MM-DD-another-issue.md`

### Related Documentation
- `implementation/XX-MODULE-Name.md`
- `docs/api/service.openapi.yaml`
- `.subagents/handovers/XX-handover.md`

### External References
- [Link to external documentation]
- [Link to similar issue in other project]
- [Link to Stack Overflow discussion]

---

## 🧪 Testing Requirements

### Test Cases Needed
1. **Test Case 1:** [Description]
   ```typescript
   it('should [expected behavior]', () => {
     // Test implementation
   });
   ```

2. **Test Case 2:** [Description]

### Manual Testing
```bash
# Steps to manually verify fix
npm run test:integration
curl -X POST http://localhost:3010/api/v1/test
```

---

## 📊 Dependencies

### Depends On
- [ ] Issue: `.subagents/issues/YYYY-MM-DD-other.md`
- [ ] Agent-{N} completion of: [Task]
- [ ] Decision from: [Stakeholder]

### Blocks
- [ ] Issue: `.subagents/issues/YYYY-MM-DD-blocked.md`
- [ ] Agent-{M} work on: [Feature]
- [ ] Release: [Version]

---

## ✅ Resolution

**Status:** ✅ Resolved  
**Date Resolved:** YYYY-MM-DD  
**Resolved By:** @Agent-{N}

### What Was Done
[Detailed description of the fix]

### Changes Made
```
Modified:
  path/to/file.ts        (+10, -5)
  path/to/another.ts     (+3, -1)

Added:
  tests/new-test.ts      (+25, -0)
```

### Git Commits
```bash
commit abc123def456
Author: Agent-{N}
Date: YYYY-MM-DD

fix(auth): resolve JWT validation issue

- Updated JWT validation logic
- Added error handling for edge cases
- Added tests for new scenarios

Closes .subagents/issues/YYYY-MM-DD-description.md
```

### Verification
- [x] Tests pass
- [x] Manual testing complete
- [x] Documentation updated
- [x] Other agents notified

### Lessons Learned
**What Caused This:**
[Root cause analysis]

**How to Prevent:**
- [Prevention measure 1]
- [Prevention measure 2]

**Best Practice Added:**
[New guideline or pattern to follow]

---

## 📢 Notifications

### Agents Notified
- ✅ @Agent-{N} - YYYY-MM-DD HH:MM
- ✅ @Agent-{M} - YYYY-MM-DD HH:MM
- ⏳ @Agent-{X} - Pending

### Communication Log
**YYYY-MM-DD HH:MM** - Created issue  
**YYYY-MM-DD HH:MM** - @Agent-{M} responded  
**YYYY-MM-DD HH:MM** - Solution proposed  
**YYYY-MM-DD HH:MM** - Solution approved  
**YYYY-MM-DD HH:MM** - Fix implemented  
**YYYY-MM-DD HH:MM** - Issue closed  

---

## 📚 Post-Mortem (For Critical Issues Only)

### Timeline
| Time | Event |
|------|-------|
| HH:MM | Issue discovered |
| HH:MM | Issue reported |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Fix implemented |
| HH:MM | Fix verified |
| HH:MM | Issue closed |

**Total Duration:** X hours/days

### What Went Well
- ✅ [Something handled well]
- ✅ [Good response]

### What Could Be Improved
- 🔄 [Area for improvement]
- 🔄 [Better process needed]

### Action Items for Process Improvement
- [ ] Update documentation at: [Location]
- [ ] Add preventive measure: [Description]
- [ ] Create automated check: [Description]

---

## 🏷️ Labels

**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)  
**Category:** Backend | Frontend | Database | Infrastructure | Integration  
**Module:** Auth | CRM | Tickets | Billing | Projects | Assets | Reports  
**Phase:** MVP | Core | Advanced  

---

## 📅 Timeline

**Created:** YYYY-MM-DD HH:MM  
**Updated:** YYYY-MM-DD HH:MM  
**Target Resolution:** YYYY-MM-DD  
**Actual Resolution:** YYYY-MM-DD  
**Status Changed:** YYYY-MM-DD HH:MM

---

## 🔗 Quick Links

- **Module Spec:** `implementation/XX-MODULE-Name.md`
- **Status Update:** `.subagents/status/agent-{N}-{name}.md`
- **Handover Doc:** `.subagents/handovers/XX-handover.md`
- **Related Code:** `services/{service}/src/...`
- **Tests:** `tests/unit/{service}/...`

---

**Last Updated:** YYYY-MM-DD HH:MM  
**Last Updated By:** @Agent-{N}

---

## 📋 Checklist for Issue Creator

Before submitting:
- [ ] Title is clear and descriptive
- [ ] Severity is justified
- [ ] Steps to reproduce are clear
- [ ] Expected vs actual behavior defined
- [ ] Impact is explained
- [ ] Proposed solution included (if applicable)
- [ ] Relevant agents @mentioned
- [ ] Related files listed
- [ ] Related issues linked

---

## 📋 Checklist for Issue Resolver

Before closing:
- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Other agents notified
- [ ] Handover/status documents updated
- [ ] Lessons learned documented
- [ ] Prevention measures added (if applicable)
