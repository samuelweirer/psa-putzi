# Git Integration Guide for Sub-Agents

**Purpose:** How to work with Git in a multi-agent environment  
**Last Updated:** 2025-11-04

---

## 🌳 Branch Strategy

### Main Branches

```
main (production-ready)
  └─ develop (integration branch)
      ├─ agent-1/infrastructure
      ├─ agent-2/auth
      ├─ agent-3/gateway
      ├─ agent-4/crm
      ├─ agent-5/tickets
      └─ agent-6/frontend
```

### Branch Naming Convention

```
agent-{N}/{module-name}
  ↑       ↑
  |       └─ Module name (lowercase, hyphenated)
  └───────── Agent number

Examples:
- agent-1/infrastructure
- agent-2/auth
- agent-3/gateway
```

---

## 🚀 Getting Started

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd psa-putzi

# Checkout develop
git checkout develop
git pull

# Create your agent branch
git checkout -b agent-{N}/{module}

# Example for Agent 2 (Auth)
git checkout -b agent-2/auth
```

---

## 📅 Daily Git Workflow

### Morning Routine

```bash
# Start of day: Get latest changes
git checkout agent-{N}/{module}
git pull origin develop  # Sync with integration branch

# If conflicts, resolve them:
git status
# Fix conflicts
git add .
git commit -m "chore(merge): sync with develop"
```

### During Work

```bash
# Make changes to your code
# ... edit files ...

# Check what changed
git status
git diff

# Stage changes
git add path/to/file
# or add all
git add .

# Commit with good message (see format below)
git commit -m "feat(auth): implement JWT validation"
```

### End of Day

```bash
# Push your changes
git push origin agent-{N}/{module}

# Update status file before pushing
git add .subagents/status/agent-{N}-{name}.md
git commit -m "docs(status): update daily progress"
git push
```

---

## 💬 Commit Message Format

### Structure

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons, etc) |
| `refactor` | Code refactoring (no feature change) |
| `test` | Adding/updating tests |
| `chore` | Maintenance (dependencies, config, etc) |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Scope

The module or component affected:

- `auth` - Authentication module
- `crm` - CRM module
- `tickets` - Ticketing module
- `gateway` - API Gateway
- `infra` - Infrastructure
- `types` - Shared types
- `status` - Status files
- `docs` - Documentation

### Examples

**Good Commits:**

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token endpoint"

# Bug fix
git commit -m "fix(crm): resolve customer search pagination issue"

# Documentation
git commit -m "docs(status): update agent-2 daily progress"

# Refactoring
git commit -m "refactor(tickets): extract SLA calculation to service"

# Multiple files, detailed body
git commit -m "feat(auth): implement MFA support

- Add TOTP generation
- Add QR code generation
- Add verification endpoint
- Add tests for MFA flow

Refs: .subagents/issues/2025-11-04-mfa-support.md"
```

**Bad Commits:**

```bash
# Too vague
git commit -m "update code"
git commit -m "fixes"
git commit -m "wip"

# No scope
git commit -m "feat: add stuff"

# Too long subject (keep under 72 chars)
git commit -m "feat(auth): add a super long commit message that goes on and on and on and never stops"
```

---

## 🔄 Syncing with Other Agents

### When Other Agents Update Shared Files

```bash
# You'll see changes in:
# - .subagents/shared/types.ts
# - .subagents/shared/constants.ts
# - .subagents/shared/errors.ts
# - .subagents/shared/.env.template

# Pull latest changes
git checkout agent-{N}/{module}
git pull origin develop

# If there are conflicts in shared files
git status
# Open conflicted files, resolve carefully
# The other agent's changes are important!

git add .subagents/shared/
git commit -m "chore(merge): sync shared types from agent-{X}"
```

### Updating Shared Files Yourself

```bash
# Always add changelog comment at top of file
# Edit .subagents/shared/types.ts

# Commit with clear message
git add .subagents/shared/types.ts
git commit -m "feat(types): add Customer interface for CRM

Added by Agent-4 for CRM module:
- Customer interface
- Contact interface  
- Location interface

Refs: .subagents/status/agent-4-crm.md"

# Push immediately so others can pull
git push origin agent-{N}/{module}

# Notify other agents in your status file
# They should pull and sync
```

---

## 🔀 Merging to Develop

### When You Complete a Milestone

```bash
# Ensure all tests pass
npm test

# Ensure no linting errors
npm run lint

# Commit any pending changes
git add .
git commit -m "chore: final cleanup before merge"

# Switch to develop
git checkout develop
git pull

# Merge your branch
git merge agent-{N}/{module}

# If conflicts:
git status
# Resolve conflicts
git add .
git commit -m "chore(merge): merge agent-{N}/{module} to develop"

# Push to develop
git push origin develop
```

### Alternative: Create Pull Request

```bash
# Push your branch
git push origin agent-{N}/{module}

# Create PR via GitHub/GitLab UI:
# - Source: agent-{N}/{module}
# - Target: develop
# - Title: "Agent {N}: {Module} - {Milestone}"
# - Description: Link to handover document

# Wait for review from main agent
# Address feedback
# Merge when approved
```

---

## 📦 Committing Specific Files

### Status Updates

```bash
# Daily status updates
git add .subagents/status/agent-{N}-{name}.md
git commit -m "docs(status): update agent-{N} daily progress"
git push
```

### Handover Documents

```bash
# When completing work
git add .subagents/handovers/{NN}-{from}-to-{to}.md
git commit -m "docs(handover): complete agent-{N} to agent-{M} handover"
git push
```

### Issues

```bash
# Creating new issue
git add .subagents/issues/2025-11-04-description.md
git commit -m "docs(issue): create issue for {description}"
git push

# Resolving issue
git add .subagents/issues/2025-11-04-description.md
git commit -m "docs(issue): resolve {description}

Resolution: [what was done]
Refs: commit abc123"
git push
```

### Shared Resources

```bash
# Update shared types
git add .subagents/shared/types.ts
git commit -m "feat(types): add {TypeName} interface

Added by Agent-{N} for {purpose}"
git push

# Update .env.template
git add .subagents/shared/.env.template
git commit -m "chore(env): add {VARIABLE_NAME} for {service}"
git push
```

---

## 🚨 Handling Merge Conflicts

### Conflict in Shared Types

```typescript
// File: .subagents/shared/types.ts
<<<<<<< HEAD
export interface User {
  id: string;
  email: string;
}
=======
export interface User {
  id: string;
  username: string;
}
>>>>>>> agent-2/auth
```

**Resolution:**

```typescript
// Combine both changes
export interface User {
  id: string;
  email: string;      // From HEAD
  username: string;   // From agent-2/auth
}
```

**Or Create Issue If Incompatible:**

```bash
# If changes are incompatible, don't guess!
# Create issue:
.subagents/issues/2025-11-04-user-type-conflict.md

# In issue, @mention both agents:
@Agent-2 @Agent-4: We have conflicting changes to User type.
Agent-2 added username, Agent-4 kept email.
Should we have both fields or choose one?
```

### Conflict in Code Files

```bash
# See what's conflicting
git status

# Open conflicted file
vim path/to/file.ts

# Look for conflict markers:
<<<<<<< HEAD
// Your code
=======
// Other agent's code
>>>>>>> branch-name

# Decide which to keep or combine both
# Remove conflict markers
# Test that code works

git add path/to/file.ts
git commit -m "fix(merge): resolve conflict in {file}"
```

---

## 🏷️ Tagging Releases

### Milestone Tags

```bash
# When a major milestone is reached
git tag -a v0.1.0-mvp-alpha -m "MVP Alpha Release
- Infrastructure complete
- Auth complete  
- Gateway complete
- CRM 80% complete"

git push origin v0.1.0-mvp-alpha
```

### Tag Format

```
v{major}.{minor}.{patch}-{phase}

Examples:
- v0.1.0-mvp-alpha
- v0.2.0-mvp-beta
- v0.3.0-mvp-release
- v1.0.0-core-alpha
```

---

## 🔍 Useful Git Commands

### Viewing History

```bash
# See commits
git log --oneline --graph --all

# See your commits only
git log --author="Agent-{N}"

# See specific file history
git log -- path/to/file.ts

# See what changed in commit
git show abc123
```

### Checking Status

```bash
# What's changed?
git status

# What's different?
git diff

# What's staged?
git diff --staged

# Compare with another branch
git diff develop..agent-{N}/{module}
```

### Undoing Changes

```bash
# Unstage file
git reset HEAD path/to/file.ts

# Discard changes in file
git checkout -- path/to/file.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1
```

### Stashing Work

```bash
# Save work temporarily
git stash

# See stashed changes
git stash list

# Apply stashed changes
git stash apply

# Apply and remove from stash
git stash pop
```

---

## 📋 Commit Checklist

Before committing, check:

- [ ] Code compiles (no TypeScript errors)
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] No `console.log()` in production code
- [ ] Commit message follows format
- [ ] Status file updated (if end of day)
- [ ] Shared files have changelog (if modified)
- [ ] No secrets in code (passwords, API keys)

---

## 🔐 Security Best Practices

### Never Commit

```bash
# NEVER commit these:
.env                    # Environment variables
*.key                   # Private keys
*.pem                   # Certificates
*credentials*           # Credential files
*secret*                # Secret files

# Check .gitignore includes:
.env
.env.local
*.key
*.pem
secrets/
credentials/
```

### If You Accidentally Commit Secrets

```bash
# Remove from history (DANGEROUS)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/secret/file' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first!)
git push origin --force --all

# Better: Rotate the compromised secret immediately
# Then remove file in next commit
```

---

## 🤝 Collaborative Workflow

### Working on Same Module (Rare)

If two agents need to work on same files:

```bash
# Agent A:
git checkout develop
git pull
git checkout -b agent-A/feature-x

# Agent B:
git checkout develop  
git pull
git checkout -b agent-B/feature-y

# Both push to own branches
# Coordinate in .subagents/issues/
# Merge one at a time to develop
# Second agent syncs before merging
```

### Reviewing Other Agent's Code

```bash
# Checkout their branch
git fetch origin
git checkout agent-{N}/{module}

# Review code
# Provide feedback in issue or PR

# Test their code
npm install
npm test
npm run dev

# Leave feedback, then switch back
git checkout agent-{your-number}/{your-module}
```

---

## 📊 Git Statistics

### View Your Contributions

```bash
# Lines changed by you
git log --author="Agent-{N}" --pretty=tformat: --numstat | \
  awk '{ add += $1; subs += $2; loc += $1 - $2 } \
  END { printf "Added: %s Removed: %s Total: %s\n", add, subs, loc }'

# Commits by you
git log --author="Agent-{N}" --oneline | wc -l

# Files changed by you
git log --author="Agent-{N}" --name-only --pretty=format: | \
  sort | uniq -c | sort -rn | head -20
```

---

## 🆘 Emergency Procedures

### You Broke Develop Branch

```bash
# Find last working commit
git log develop

# Reset develop to that commit
git checkout develop
git reset --hard abc123  # last good commit

# Force push (COORDINATE WITH TEAM FIRST!)
git push origin develop --force

# Notify all agents in chat
# They need to reset their branches
```

### You Need to Go Back in Time

```bash
# Create new branch from old commit
git checkout -b agent-{N}/{module}-recovery abc123

# Cherry-pick specific commits
git cherry-pick def456
git cherry-pick ghi789

# Or rebase onto old commit
git rebase --onto abc123 def456 agent-{N}/{module}
```

---

## 📚 Resources

**Git Documentation:**
- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

**Commit Message Convention:**
- [Conventional Commits](https://www.conventionalcommits.org/)

**Internal Resources:**
- `.subagents/README.md` - Sub-agent coordination
- `SUB-AGENT-CONFIG.md` - Full configuration guide

---

## ❓ FAQ

**Q: Should I commit every day?**  
A: Yes! At least commit your status file daily.

**Q: Should I push to develop or my branch?**  
A: Always push to YOUR branch. Only merge to develop at milestones.

**Q: Someone changed a file I'm working on, what do I do?**  
A: Pull latest develop, merge into your branch, resolve conflicts.

**Q: I made a mistake in commit message, can I fix it?**  
A: If not pushed yet: `git commit --amend`. If pushed: leave it or rebase.

**Q: How do I know when to merge to develop?**  
A: When you complete a milestone and main agent approves.

---

**Last Updated:** 2025-11-04  
**Maintained By:** Main Agent
