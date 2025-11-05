# Unified Branch Workflow - How It Works

**Purpose:** Explain how multiple agents work on the same branch in the same directory
**Version:** 1.0
**Last Updated:** 2025-11-04
**Status:** ✅ Active Strategy

---

## 🎯 The Key Insight

**All agents work on the same branch (`claude/session-011CUa86VGPkHjf5rHUmwfvG`) in the same directory (`/opt/psa-putzi`).**

This means:
- ✅ Changes are **IMMEDIATELY visible** to all agents
- ✅ **NO `git pull` needed** between agents on the same machine
- ✅ Real-time collaboration without merge conflicts
- ✅ Push to GitHub frequently to save work

---

## 🤔 Why No Git Pull Needed?

### Traditional Multi-Branch Workflow
```
Agent 1: feature/auth-backend  ────┐
                                    ├─→ Must merge later
Agent 2: feature/frontend-ui   ────┘
```
- Each agent on different branch
- Need to `git pull` from other branches
- Merge conflicts happen later
- Integration testing delayed

### Unified Branch Workflow (Current)
```
Both Agents: claude/session-011CUa86VGPkHjf5rHUmwfvG
             /opt/psa-putzi (same directory)
```
- Same branch, same working directory
- File changes instantly visible
- NO pull needed between agents
- Real-time integration testing

---

## 📁 How File System Works

### Same Working Directory
```bash
/opt/psa-putzi/                    # Same directory for all agents
├── .git/                          # Same git repository
├── services/
│   └── auth-service/              # Backend agent works here
└── frontend/                      # Frontend agent works here
```

**Key Point:** When Agent 1 (backend) creates `services/auth-service/dist/index.js`, Agent 2 (frontend) **immediately sees it** in the same directory. No pull needed!

### How Git Status Shows Changes

**Agent 1 (Backend) makes changes:**
```bash
git status
# On branch claude/session-011CUa86VGPkHjf5rHUmwfvG
# Changes not staged for commit:
#   modified:   services/auth-service/package.json

git add .
git commit -m "feat(auth): add passport dependencies"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**Agent 2 (Frontend) immediately sees:**
```bash
git status
# On branch claude/session-011CUa86VGPkHjf5rHUmwfvG
# Your branch is behind 'origin/claude/session-011CUa86VGPkHjf5rHUmwfvG' by 1 commit

# But the FILES are already there in the working directory!
ls services/auth-service/package.json  # ✅ File exists immediately

# Agent 2 works on frontend files - no conflict!
```

---

## 🔄 Daily Workflow for Agents

### Morning (Start of Session)

```bash
# 1. Verify you're on the unified branch
git status
# Should show: On branch claude/session-011CUa86VGPkHjf5rHUmwfvG

# 2. Check status of other agents
cat .subagents/status/*.md
cat .subagents/issues/*.md

# 3. ONLY pull if starting a NEW Claude Code session
#    (to sync commits from GitHub that you don't have yet)
# git pull origin claude/session-011CUa86VGPkHjf5rHUmwfvG

# 4. Start working - all files from other agents are already visible!
```

**When to Pull:**
- ✅ Starting a brand new Claude Code session
- ✅ After other agent pushed to GitHub
- ❌ NOT needed between agents working simultaneously

### During Work

```bash
# Make your changes
nano frontend/src/components/Login.tsx

# Check what you changed
git status
git diff

# Commit frequently (every 30-60 minutes)
git add .
git commit -m "feat(frontend): add login form validation"

# Push IMMEDIATELY to save to GitHub
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**Key Practices:**
- ✅ Commit small, logical changes
- ✅ Push after each commit (save to GitHub)
- ✅ Use descriptive commit messages
- ✅ Work in your own directory (backend vs frontend)

### End of Session

```bash
# 1. Final status check
git status

# 2. Commit any remaining work
git add .
git commit -m "feat(frontend): complete login page styling"

# 3. Push to GitHub
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG

# 4. Update your status file
nano .subagents/status/frontend-agent-2025-11-04.md
git add .subagents/status/frontend-agent-2025-11-04.md
git commit -m "docs(status): frontend agent daily update"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

---

## 🎭 Example: Two Agents Working Simultaneously

### Scenario
- **Agent 1 (Backend):** Implementing auth service (9:00 - 11:00)
- **Agent 2 (Frontend):** Building login UI (10:00 - 12:00)
- **Overlap:** 10:00 - 11:00 (both working simultaneously)

### Timeline

**9:00 - Backend Agent Starts**
```bash
cd /opt/psa-putzi
git status  # Already on unified branch

# Work on auth service
nano services/auth-service/src/controllers/auth.controller.ts

# Commit
git add services/auth-service/
git commit -m "feat(auth): implement login endpoint"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**10:00 - Frontend Agent Starts (Backend still working)**
```bash
cd /opt/psa-putzi
git status  # Same branch, same directory

# Backend's files are ALREADY visible!
ls services/auth-service/src/controllers/auth.controller.ts  # ✅ Exists!

# Frontend works on different files - no conflict
nano frontend/src/pages/auth/LoginPage.tsx

# Commit
git add frontend/
git commit -m "feat(frontend): create login page UI"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**10:30 - Backend Agent Continues**
```bash
# Backend continues work
git status  # Shows: Your branch is behind by 1 commit (frontend's commit)

# But the frontend files are ALREADY in the working directory!
ls frontend/src/pages/auth/LoginPage.tsx  # ✅ Exists!

# Backend continues with auth work - no conflict
nano services/auth-service/tests/integration/auth.test.ts
git add services/auth-service/
git commit -m "test(auth): add integration tests"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**11:00 - Backend Finishes, Frontend Continues**
```bash
# Frontend sees ALL backend work immediately
ls services/auth-service/tests/integration/auth.test.ts  # ✅ Exists!

# Frontend can test against running backend service
curl http://localhost:3001/api/v1/auth/login  # ✅ Works immediately!
```

---

## 🚫 Common Misconceptions

### ❌ Misconception 1: "I need to git pull to see other agent's work"
**Reality:** Files are immediately visible in the same working directory. Git pull only updates your local commit history, but the FILES are already there!

### ❌ Misconception 2: "We'll have merge conflicts"
**Reality:** Each agent works in different directories (backend vs frontend). No file conflicts!

### ❌ Misconception 3: "Git status shows 'behind origin', so I can't work"
**Reality:** "Behind origin" just means you don't have the other agent's COMMITS in your git history. The FILES are already in your working directory. Keep working!

### ❌ Misconception 4: "I should wait for the other agent to finish"
**Reality:** Both agents can work simultaneously. Just push frequently so work is saved to GitHub.

---

## 🎯 Benefits of This Approach

### ✅ Real-Time Integration
- Backend changes visible to frontend immediately
- Frontend can test against backend instantly
- Integration problems caught early

### ✅ No Merge Conflicts
- Each agent works in separate directories
- Backend: `services/auth-service/`
- Frontend: `frontend/`
- Shared files: `.subagents/` (coordination)

### ✅ Simplified Workflow
- No branch management
- No pull requests between agents
- No merge conflict resolution
- One branch to track

### ✅ Faster Iteration
- Test integration continuously
- Catch API mismatches early
- Adjust both sides quickly

---

## 🔧 Troubleshooting

### Q: Git says "Your branch is behind origin"
**A:** That's normal! It means the other agent pushed commits. The FILES are already in your working directory. You can:
- Continue working (files are there!)
- Optionally: `git pull` to update your commit history (not required)

### Q: I see the other agent's files in my working directory
**A:** Perfect! That's exactly how it should work. Those files are part of the shared codebase.

### Q: Should I create a new branch for my feature?
**A:** No! Stay on the unified branch `claude/session-011CUa86VGPkHjf5rHUmwfvG`. We're intentionally working together on the same branch.

### Q: When should I actually run `git pull`?
**A:** Only when:
1. Starting a NEW Claude Code session (to sync from GitHub)
2. You want to update your local commit history (optional)
3. You're working alone and want to see what was pushed to GitHub

### Q: What if I accidentally modify the other agent's files?
**A:** Communicate via `.subagents/issues/` and resolve. But this should be rare since:
- Backend works in `services/`
- Frontend works in `frontend/`
- Shared coordination in `.subagents/`

---

## 📝 Best Practices

### ✅ DO:
- Work in your designated directory (backend vs frontend)
- Push frequently (every commit)
- Use descriptive commit messages
- Update status files regularly
- Check `.subagents/issues/` daily
- Communicate via handover documents

### ❌ DON'T:
- Don't wait to push (push immediately after commit)
- Don't modify other agent's code without coordination
- Don't create new branches (stay on unified branch)
- Don't worry about "behind origin" messages
- Don't pull unnecessarily (files are already there)

---

## 🎓 For New Agents

When you join the project:

1. **Verify Branch:**
   ```bash
   cd /opt/psa-putzi
   git status  # Should show unified branch
   ```

2. **Check Existing Work:**
   ```bash
   ls -la services/     # Backend work
   ls -la frontend/     # Frontend work
   ls -la .subagents/   # Coordination files
   ```

3. **Start Working:**
   ```bash
   # Work in your designated area
   # Commit frequently
   # Push after each commit
   ```

4. **Communicate:**
   ```bash
   # Check other agents' status
   cat .subagents/status/*.md

   # Report issues
   cp templates/TEMPLATE-issue.md .subagents/issues/YYYY-MM-DD-description.md
   ```

---

## 📊 Success Metrics

**This workflow is working well when:**
- ✅ Both agents push multiple times per day
- ✅ Integration tests pass continuously
- ✅ No merge conflicts occur
- ✅ Agents can test each other's work immediately
- ✅ Changes are visible within minutes

**Warning signs:**
- ⚠️ Agent not pushing for hours (work not saved!)
- ⚠️ Merge conflicts (agents editing same files)
- ⚠️ Agents working in silos (not testing integration)

---

## 🔗 Related Documentation

- **ACTIVE-ASSIGNMENTS.md** - Unified branch noted in AUTH-001
- **FRONTEND-BRANCH-SWITCH.md** - How frontend switched to unified branch
- **AGENT-ROLES-CONFIG.md** - Daily routines updated
- **README.md** - Daily workflow updated
- **MASTER-INDEX.md** - Daily checklist updated

---

**Key Takeaway:** With unified branch strategy, think of it like multiple developers working at the same desk with the same codebase open. Changes appear immediately - no need to "sync" because you're already looking at the same files!

---

**Last Updated:** 2025-11-04 22:00 UTC
**Maintained By:** Main Agent (Project Manager)
**Status:** ✅ Active and working well in Sprint 2
