# PSA-Putzi Sub-Agent Quick Start Guide

**Purpose:** Get started in 5 minutes  
**For:** New sub-agents joining the project  
**Last Updated:** 2025-11-04

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Clone and Setup (2 minutes)

```bash
# Clone repository
git clone <repo-url>
cd psa-putzi

# Checkout develop and create your branch
git checkout develop
git pull
git checkout -b agent-{N}/{module-name}

# Example for Agent 2 (Auth):
git checkout -b agent-2/auth
```

### Step 2: Read Your Assignment (2 minutes)

```bash
# Open your module specification
cat implementation/XX-MODULE-{YourModule}.md

# Check dependencies in handovers
ls -la .subagents/handovers/

# Read relevant handover(s)
cat .subagents/handovers/01-infra-to-auth.md
```

### Step 3: Create Your Status File (1 minute)

```bash
# Copy template
cp TEMPLATE-status-update.md .subagents/status/agent-{N}-{name}.md

# Edit with your information
vim .subagents/status/agent-{N}-{name}.md

# Commit
git add .subagents/status/agent-{N}-{name}.md
git commit -m "docs(status): initialize agent-{N} status file"
git push origin agent-{N}/{module}
```

**Done! You're ready to start coding! 🚀**

---

## 📋 Daily Commands

### Morning Routine

```bash
# 1. Get latest changes
git checkout agent-{N}/{module}
git pull origin develop

# 2. Check what others are doing
ls -l .subagents/status/
cat .subagents/status/agent-*.md

# 3. Check for issues affecting you
ls -l .subagents/issues/
cat .subagents/issues/2025-11-*.md

# 4. Pull latest shared resources
cat .subagents/shared/types.ts
cat .subagents/shared/.env.template
```

### During Work

```bash
# Make your changes
vim services/{your-service}/src/...

# Check what changed
git status
git diff

# Test your changes
npm test
npm run lint

# Commit frequently
git add .
git commit -m "feat({module}): {what you did}"
git push origin agent-{N}/{module}
```

### End of Day

```bash
# Update your status
vim .subagents/status/agent-{N}-{name}.md

# Commit status
git add .subagents/status/agent-{N}-{name}.md
git commit -m "docs(status): daily update agent-{N}"
git push origin agent-{N}/{module}

# Ensure all work is pushed
git status  # Should show "nothing to commit"
```

---

## 🔧 Essential Commands by Task

### Creating a New Service

```bash
# Create service folder
mkdir -p services/{service-name}
cd services/{service-name}

# Initialize Node.js project
npm init -y

# Install common dependencies
npm install express typescript @types/express @types/node
npm install -D jest @types/jest ts-jest nodemon

# Create basic structure
mkdir -p src/{controllers,services,models,middleware,utils}
mkdir -p tests/{unit,integration,fixtures}
touch src/index.ts
touch README.md

# Set up TypeScript
npx tsc --init

# Create package.json scripts
# Add: "dev", "build", "test", "lint"
```

### Working with Shared Types

```bash
# View current shared types
cat .subagents/shared/types.ts

# Add new types (always add changelog!)
vim .subagents/shared/types.ts

# Commit shared changes
git add .subagents/shared/types.ts
git commit -m "feat(types): add {TypeName} for {module}

Added by Agent-{N} for {purpose}"
git push origin agent-{N}/{module}
```

### Creating an Issue

```bash
# Copy template
cp TEMPLATE-issue.md .subagents/issues/2025-11-04-{description}.md

# Edit with issue details
vim .subagents/issues/2025-11-04-{description}.md

# Commit
git add .subagents/issues/2025-11-04-{description}.md
git commit -m "docs(issue): create issue for {description}"
git push origin agent-{N}/{module}
```

### Creating Handover Document

```bash
# Copy template
cp TEMPLATE-handover.md .subagents/handovers/{NN}-{you}-to-{next}.md

# Fill out all sections
vim .subagents/handovers/{NN}-{you}-to-{next}.md

# Commit
git add .subagents/handovers/{NN}-{you}-to-{next}.md
git commit -m "docs(handover): complete agent-{N} to agent-{M} handover"
git push origin agent-{N}/{module}
```

---

## 🗂️ File Locations Quick Reference

```
psa-putzi/
├── .subagents/
│   ├── status/                     # Your daily updates go here
│   │   └── agent-{N}-{name}.md    # Update this daily!
│   ├── handovers/                  # Handover docs
│   │   └── {NN}-{from}-to-{to}.md # Create when done
│   ├── shared/                     # Shared resources
│   │   ├── .env.template          # All env variables
│   │   ├── types.ts               # Shared TypeScript types
│   │   ├── constants.ts           # Shared constants
│   │   └── errors.ts              # Error definitions
│   └── issues/                     # Issues and questions
│       └── YYYY-MM-DD-*.md        # Create as needed
│
├── implementation/                 # Module specifications
│   ├── 01-MODULE-Infrastructure.md
│   ├── 02-MODULE-Auth.md
│   └── XX-MODULE-{YourModule}.md  # Read this first!
│
├── services/                       # Your code goes here
│   └── {your-service}/            # Create this
│       ├── src/
│       ├── tests/
│       ├── package.json
│       └── README.md
│
├── packages/                       # Shared packages
│   ├── types/                     # @psa/types
│   ├── auth-middleware/           # @psa/auth-middleware
│   └── logger/                    # @psa/logger
│
└── infrastructure/                 # Database & config
    ├── database/
    │   ├── migrations/
    │   └── seeds/
    └── scripts/
```

---

## 💬 Communication Cheat Sheet

### Need to Ask a Question?

```bash
# 1. Create issue
cp TEMPLATE-issue.md .subagents/issues/2025-11-04-my-question.md

# 2. Fill it out with:
#    - Clear question
#    - Why you need to know
#    - @mention the right agent

# 3. Commit and push
git add .subagents/issues/2025-11-04-my-question.md
git commit -m "docs(issue): question about {topic}"
git push
```

### Found a Bug in Someone's Code?

```bash
# 1. Create issue (use template)
# 2. Mark severity: 🔴 Critical | 🟡 Important | 🟢 Minor
# 3. Include:
#    - Steps to reproduce
#    - Expected vs actual behavior
#    - @mention responsible agent
# 4. Commit and push
```

### Blocked by Another Agent?

```bash
# 1. Update your status to 🔴 Blocked
vim .subagents/status/agent-{N}-{name}.md
# Set: Status: 🔴 Blocked

# 2. Create critical issue
# 3. @mention who can unblock you
# 4. Work on other tasks while waiting
# 5. If >4 hours, escalate to main agent
```

### Sharing a Major Decision?

```bash
# In your status file, add section:
## 🔧 Technical Decisions Made

### Decision: {Name}
- **What:** {What was decided}
- **Why:** {Rationale}
- **Impact:** @Agent-{X}, @Agent-{Y}
- **Reversible:** Yes/No
```

---

## 🧪 Testing Quick Commands

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch

# Single test file
npm test path/to/test.spec.ts
```

### Database Tests

```bash
# Set up test database
npm run db:test:setup

# Run migrations for test DB
NODE_ENV=test npm run migrate:up

# Seed test data
NODE_ENV=test npm run seed

# Reset test database
npm run db:test:reset
```

---

## 🔍 Debugging Commands

### Check Service Health

```bash
# Start your service
npm run dev

# In another terminal, check health
curl http://localhost:{your-port}/health

# Check logs
npm run logs

# Or tail logs in real-time
tail -f logs/app.log
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U psa_admin -d psa_platform

# If connection refused:
sudo systemctl status postgresql
sudo systemctl start postgresql

# Check .env has correct connection string
cat .env | grep DATABASE_URL
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# If connection refused:
sudo systemctl status redis
sudo systemctl start redis

# Check .env has correct Redis URL
cat .env | grep REDIS_URL
```

---

## 📊 Progress Tracking

### Check Your Progress

```bash
# Lines of code written
git log --author="Agent-{N}" --pretty=tformat: --numstat | \
  awk '{ add += $1; subs += $2; loc += $1 - $2 } \
  END { printf "Added: %s Removed: %s Total: %s\n", add, subs, loc }'

# Commits made
git log --author="Agent-{N}" --oneline | wc -l

# Test coverage
npm run test:coverage
# Check coverage/index.html
```

### Check Project Progress

```bash
# View all agent status files
for file in .subagents/status/*.md; do
  echo "=== $file ==="
  grep "Progress:" $file
  grep "Status:" $file
  echo
done
```

---

## 🚨 Emergency Commands

### Undo Last Commit (Not Pushed Yet)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit (CAREFUL!)
git reset --hard HEAD~1
```

### Discard All Local Changes

```bash
# Nuclear option - start fresh from remote
git fetch origin
git reset --hard origin/agent-{N}/{module}
```

### Sync with Latest Develop

```bash
# Get latest develop changes
git checkout develop
git pull

# Merge into your branch
git checkout agent-{N}/{module}
git merge develop

# If conflicts, resolve then:
git add .
git commit -m "chore(merge): sync with develop"
```

---

## 📚 Reference Documents

### Quick Links

```bash
# Your module spec
cat implementation/XX-MODULE-{YourModule}.md

# Full sub-agent config
cat SUB-AGENT-CONFIG.md

# Sub-agents README
cat .subagents/README.md

# Git guide
cat GIT-INTEGRATION-GUIDE.md

# Templates
ls -l TEMPLATE-*.md
```

### BDUF Documentation

```bash
# System architecture
cat /mnt/project/03-Systemarchitektur.md

# Functional requirements  
cat /mnt/project/04-Funktionale-Anforderungen.md

# Roles & permissions
cat /mnt/project/07-Rollen-Berechtigungen.md

# Security & compliance
cat /mnt/project/06-Nicht-funktionale-Anforderungen.md
```

---

## ✅ Daily Checklist

### Every Morning

- [ ] `git pull origin develop` - Get latest changes
- [ ] Check `.subagents/issues/` - Any blockers?
- [ ] Check other agent status files - What's happening?
- [ ] Check `.subagents/shared/` - Any new types/constants?

### Every Evening

- [ ] All tests pass - `npm test`
- [ ] No linting errors - `npm run lint`
- [ ] Update status file - What did you do?
- [ ] Commit and push - `git push`
- [ ] Review tomorrow's plan - Ready to go?

### Every Week

- [ ] Update completion percentage in status
- [ ] Review handover document progress
- [ ] Check for outdated issues
- [ ] Sync with develop branch

---

## 🎯 Milestone Checklist

### Before Creating Handover

- [ ] All features from spec implemented
- [ ] Tests written (≥70% coverage)
- [ ] All tests pass
- [ ] ESLint: 0 errors, 0 warnings
- [ ] TypeScript: 0 errors
- [ ] API documented (OpenAPI spec)
- [ ] README.md in service folder
- [ ] .env.template updated
- [ ] Shared types updated (if applicable)
- [ ] Status file finalized
- [ ] Handover document complete

### After Creating Handover

- [ ] Commit handover document
- [ ] Push to your branch
- [ ] Notify next agent (in their status file or issue)
- [ ] Notify main agent in chat
- [ ] Wait for review
- [ ] Address feedback
- [ ] Merge to develop (when approved)

---

## 💡 Pro Tips

### Speed Up Development

```bash
# Use nodemon for auto-restart on changes
npm install -D nodemon
# Add to package.json scripts:
# "dev": "nodemon --exec ts-node src/index.ts"

# Use watch mode for tests
npm run test:watch

# Use git aliases
git config alias.st status
git config alias.co checkout
git config alias.cm 'commit -m'
# Now: git st, git co, git cm "message"
```

### Better Code Quality

```bash
# Set up pre-commit hooks
npm install -D husky lint-staged
npx husky install

# Add to package.json:
# "lint-staged": {
#   "*.ts": ["eslint --fix", "prettier --write"]
# }

# Auto-format on save in VS Code
# .vscode/settings.json:
# "editor.formatOnSave": true
```

### Faster Debugging

```bash
# Use VS Code debugger
# Create .vscode/launch.json:
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Service",
      "program": "${workspaceFolder}/services/{service}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/services/{service}/dist/**/*.js"]
    }
  ]
}
```

---

## ❓ Common Questions

**Q: Where do I put my code?**  
A: `services/{your-service}/src/`

**Q: Where do I put my tests?**  
A: `services/{your-service}/tests/`

**Q: Where do I update my daily progress?**  
A: `.subagents/status/agent-{N}-{name}.md`

**Q: How do I ask another agent a question?**  
A: Create issue in `.subagents/issues/` and @mention them

**Q: How do I know what others are doing?**  
A: Read their status files in `.subagents/status/`

**Q: Where are shared types?**  
A: `.subagents/shared/types.ts`

**Q: Where's the environment config?**  
A: `.subagents/shared/.env.template` (template)  
A: `services/{service}/.env` (your actual config)

**Q: When do I merge to develop?**  
A: When you complete a milestone and get approval

**Q: How do I know if I'm done?**  
A: Check the milestone checklist above

---

## 🆘 Get Help

### If You're Stuck

1. **Check documentation:**
   - Your module spec
   - Handover from previous agent
   - BDUF chapters

2. **Search for similar issues:**
   ```bash
   grep -r "your search term" .subagents/
   ```

3. **Create an issue:**
   ```bash
   cp TEMPLATE-issue.md .subagents/issues/2025-11-04-help-needed.md
   # Fill it out, @mention relevant agent
   ```

4. **If critical, ping main agent in chat**

---

## 🎓 Learn More

**Full Documentation:**
- `SUB-AGENT-CONFIG.md` - Complete configuration
- `GIT-INTEGRATION-GUIDE.md` - Git workflow details
- `.subagents/README.md` - Coordination hub overview

**Templates:**
- `TEMPLATE-status-update.md` - Daily status
- `TEMPLATE-handover.md` - Handover document
- `TEMPLATE-issue.md` - Issue reporting

**BDUF Specs:**
- `/mnt/project/*.md` - Complete system specification

---

**Remember:** Ask questions early, update status daily, commit often! 

**Good luck! 🚀**

---

**Last Updated:** 2025-11-04  
**Version:** 1.0
