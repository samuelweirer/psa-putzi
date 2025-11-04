# Launch Instructions: Frontend Agent (Junior-5)

**Agent:** Junior Developer 5 (Frontend Developer)
**AI Model:** Claude Haiku 4.5 (Fast, cost-effective)
**Module:** FRONTEND-001 - React Application
**Priority:** P2 (Can run in parallel with backend)
**Timeline:** Week 3-10 (6 weeks, parallel development)

---

## 🎯 Mission

Build the React frontend for PSA-Platform, starting with authentication UI. Work in parallel with backend development team.

---

## 🚀 Quick Start

### Step 1: Open New Terminal/Screen Session

```bash
# Option A: New terminal window
# Just open a new terminal

# Option B: Screen session
screen -S frontend-agent
```

### Step 2: Navigate to Project

```bash
cd /opt/psa-putzi
git checkout develop
git pull
```

### Step 3: Create Feature Branch

```bash
git checkout -b feature/frontend-auth-ui
```

### Step 4: Read Your Assignment

```bash
# Main module guide
cat implementation/13-MODULE-Frontend.md

# Handover from Auth team (API specs)
cat .subagents/handovers/03-auth-to-frontend.md
```

### Step 5: Create Your Status File

```bash
cp templates/TEMPLATE-status-update.md .subagents/status/frontend-agent-2025-11-04.md

# Edit with your info
nano .subagents/status/frontend-agent-2025-11-04.md
```

### Step 6: Start Working!

Follow the setup guide in `.subagents/handovers/03-auth-to-frontend.md`

---

## 📋 Your First Week (Week 3)

### Day 1: Project Setup (4-6 hours)
- [ ] Create React + Vite + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Set up project structure (pages, components, lib, contexts)
- [ ] Create API client with axios
- [ ] Test auth service connection (http://localhost:3001)
- [ ] Commit setup: "feat(frontend): initialize React project with Vite and Tailwind"

### Day 2: Login Page (4-6 hours)
- [ ] Create AuthContext for global auth state
- [ ] Build Login page UI
- [ ] Implement login form with validation
- [ ] Connect to POST /api/v1/auth/login
- [ ] Handle success (store tokens, redirect)
- [ ] Handle errors (display to user)
- [ ] Test with real auth service
- [ ] Commit: "feat(frontend): implement login page with API integration"

### Day 3: Register Page (4-6 hours)
- [ ] Build Register page UI
- [ ] Implement registration form with validation
- [ ] Password strength indicator
- [ ] Connect to POST /api/v1/auth/register
- [ ] Handle success (auto-login, redirect)
- [ ] Handle errors (display to user)
- [ ] Add "already have account" link to login
- [ ] Commit: "feat(frontend): implement registration page"

### Day 4: MFA Flow (4-6 hours)
- [ ] Create MFA Setup page (QR code display)
- [ ] Create MFA Verify page (6-digit code input)
- [ ] Display recovery codes
- [ ] Connect to POST /api/v1/auth/mfa/setup
- [ ] Connect to POST /api/v1/auth/mfa/verify
- [ ] Handle MFA required during login
- [ ] Commit: "feat(frontend): implement MFA setup and verification"

### Day 5: Password Reset & Profile (4-6 hours)
- [ ] Create Forgot Password page
- [ ] Create Reset Password page
- [ ] Create User Profile page
- [ ] Connect to password reset endpoints
- [ ] Connect to GET /api/v1/auth/me
- [ ] Connect to PATCH /api/v1/auth/me
- [ ] Add Change Password in profile
- [ ] Commit: "feat(frontend): implement password reset and user profile"

### Day 6: Protected Routes & Testing (4-6 hours)
- [ ] Create ProtectedRoute component
- [ ] Build main navigation/sidebar
- [ ] Create Dashboard skeleton (placeholder)
- [ ] Implement token refresh logic
- [ ] Add logout functionality
- [ ] Write unit tests for auth components
- [ ] Write E2E test for login flow (Playwright)
- [ ] Commit: "feat(frontend): add protected routes and navigation"

---

## 🔌 Backend Services

### Auth Service (Ready Now)
- **URL:** http://localhost:3001
- **Endpoints:** 12 endpoints ready (see handover doc)
- **Status:** ✅ Running, tested, 137 tests passing

**To start:**
```bash
cd /opt/psa-putzi/services/auth-service
npm run dev
```

### API Gateway (Week 4)
- **URL:** http://localhost:3000 (TBD)
- **Status:** ⚪ Not started yet
- **Your Impact:** For now, connect directly to auth-service:3001

### Other Services (Week 5+)
- CRM, Tickets, etc. will come online later
- You'll add pages for them as they're ready

---

## 📁 Project Structure

Create this structure in `frontend/`:

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Auth-specific components
│   │   ├── layout/          # Layout components (nav, sidebar)
│   │   └── common/          # Shared components
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   └── MFASetupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ProfilePage.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts           # Axios client
│   │   └── utils.ts         # Helper functions
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── types/
│   │   └── auth.types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 📝 Daily Workflow

### Morning (Start of Day)
```bash
# Get latest changes
git pull origin develop

# Check for backend updates
cat .subagents/status/auth-remaining-work.md

# Check for issues
ls -la .subagents/issues/
```

### During Work
```bash
# Make changes
# Test locally (npm run dev)
# Commit frequently

git add .
git commit -m "feat(frontend): <what you did>"
git push origin feature/frontend-auth-ui
```

### End of Day
```bash
# Update status file
nano .subagents/status/frontend-agent-2025-11-04.md

# Commit status
git add .subagents/status/frontend-agent-2025-11-04.md
git commit -m "docs(status): frontend agent daily update"
git push
```

---

## 🤝 Getting Help

### Questions about Auth Endpoints?
1. Check: `.subagents/handovers/03-auth-to-frontend.md`
2. Test endpoint with curl/Postman first
3. Create issue: `.subagents/issues/2025-11-04-your-question.md`
4. @mention Senior-2 (Security Specialist)

### Questions about UI/UX?
1. Check: `implementation/13-MODULE-Frontend.md`
2. Create issue
3. @mention Main-Agent

### Blocked?
1. Update status to 🔴 Blocked
2. Create critical issue
3. Work on other tasks while waiting
4. If >4 hours, escalate to Main-Agent

---

## ✅ Definition of Done (Week 3)

Your work for Week 3 is complete when:

- [ ] Login page functional with real API
- [ ] Register page functional with real API
- [ ] Password reset flow working
- [ ] MFA setup and verification working
- [ ] Protected routes implemented
- [ ] User profile page working
- [ ] Logout functional
- [ ] Token refresh automatic
- [ ] Responsive design (mobile + desktop)
- [ ] No console errors
- [ ] Unit tests ≥60% coverage
- [ ] At least 1 E2E test passing
- [ ] Status file up to date
- [ ] All commits pushed

---

## 📊 Success Metrics

Track these in your status file:

- **Features Completed:** X / Y planned
- **Components Created:** Number of components
- **Test Coverage:** X%
- **Bugs Found:** X (create issues)
- **Commits Made:** X
- **Response Time to Questions:** < 24 hours

---

## 🎓 Learning Opportunities

As a Junior Developer, focus on:

1. **React Best Practices**
   - Functional components + hooks
   - Context API for state management
   - Custom hooks for reusability

2. **TypeScript**
   - Strong typing for API responses
   - Interface definitions
   - Type guards

3. **API Integration**
   - Axios interceptors for auth
   - Token refresh logic
   - Error handling

4. **Testing**
   - Unit tests with Vitest
   - E2E tests with Playwright
   - Component testing

5. **UI/UX**
   - Responsive design
   - Accessibility
   - Loading states
   - Error messages

---

## 🚨 Common Pitfalls

### 1. Auth Service Not Running
**Symptom:** API calls fail with "Connection refused"
**Solution:**
```bash
cd /opt/psa-putzi/services/auth-service
npm run dev
```

### 2. CORS Errors
**Symptom:** Browser blocks requests
**Solution:** Auth service already has CORS enabled for localhost:5173 (Vite default)

### 3. Token Expiration
**Symptom:** User logged out unexpectedly
**Solution:** Implement token refresh logic (see handover doc)

### 4. Rate Limiting
**Symptom:** Login blocked after multiple attempts
**Solution:** Wait 15 minutes or flush Redis

---

## 🎯 Week 2 Preview (Week 4)

After completing auth UI:

- [ ] Build CRM pages (customer list, details)
- [ ] Create ticket list page
- [ ] Build dashboard with charts
- [ ] Integrate with API Gateway (when ready)
- [ ] Add search and filters

---

## 📞 Contacts

- **Your Supervisor:** Main Agent (Project Manager)
- **Auth Questions:** Senior-2 (Security Specialist)
- **API Questions:** Senior-4 (Integration Specialist, when active)
- **Code Reviews:** Senior-2 or Main Agent

---

## 🎉 Welcome to the Team!

You're building the user interface that customers will interact with daily. Your work directly impacts user experience and product success.

**Remember:**
- Ask questions early
- Commit often
- Test thoroughly
- Update status daily
- Have fun! 🚀

---

**Good Luck!**

**Last Updated:** 2025-11-04
**Your Branch:** `feature/frontend-auth-ui`
**Your Status File:** `.subagents/status/frontend-agent-2025-11-04.md`
