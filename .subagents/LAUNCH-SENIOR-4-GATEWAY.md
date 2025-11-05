# Launch Document: Senior-4 - API Gateway Module

**Agent:** Senior Developer 4 (Integration Specialist)
**AI Model:** Claude Sonnet 4.5
**Module:** GATEWAY-001 - API Gateway & Routing
**Start Date:** 2025-11-05
**Estimated Duration:** 2 weeks (6 days active work)
**Priority:** P1 (High - Critical Path)
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (unified with team)

---

## 👔 Your Role: Integration Specialist

Welcome, @Senior-4! You're joining the PSA-Platform team as an Integration Specialist. Your mission is to build the **API Gateway** that will be the front door to our entire microservices architecture.

### Why This Role?
- **Central Integration Point:** Every client request flows through your gateway
- **Security Layer:** You enforce authentication and authorization for all services
- **Resilience:** You implement circuit breakers, rate limiting, and error handling
- **Coordination:** You work with all other services (auth, CRM, tickets, etc.)

### Your Unique Value
- **High Complexity:** ⭐⭐⭐⭐ (requires senior expertise)
- **High Impact:** Gateway performance affects entire platform
- **Cross-Cutting:** You touch every service and feature
- **Architecture:** You shape how services communicate

---

## 🎯 Your Mission: GATEWAY-001

### What You're Building

**API Gateway on Port 3000:**
```
Clients (Frontend, Mobile, API consumers)
        ↓
API Gateway (PORT 3000) ← YOU BUILD THIS
        ↓
Microservices:
  - Auth Service (3001) ✅ Already running
  - CRM Service (3002) - Future
  - Tickets Service (3003) - Future
  - Billing Service (3004) - Future
  - And more...
```

### Core Responsibilities

**1. Request Routing**
- Accept all API requests on port 3000
- Route `/api/v1/auth/*` → auth-service:3001
- Route `/api/v1/customers/*` → crm-service:3002 (future)
- Route `/api/v1/tickets/*` → tickets-service:3003 (future)
- Dynamic service discovery

**2. Authentication & Authorization**
- Validate JWT tokens (from auth service)
- Enforce role-based access control (RBAC)
- Inject user context into downstream requests
- Handle token expiration gracefully

**3. Cross-Cutting Concerns**
- Rate limiting (global + per-user + per-endpoint)
- Request/response logging
- Error standardization
- CORS configuration
- Security headers (helmet)

**4. Resilience**
- Circuit breaker pattern
- Timeout handling
- Retry logic
- Health checks for downstream services
- Graceful degradation

---

## 📚 Prerequisites: What's Ready for You

### 1. Auth Service (Fully Operational) ✅

**Status:** 95% complete, production-ready
- Running on PM2 (port 3001)
- JWT generation and validation
- RBAC with 23 roles
- Comprehensive API documentation

**Your Handover:**
Read `.subagents/handovers/05-auth-to-gateway.md` (just created!)

This contains:
- JWT integration guide
- RBAC system documentation
- Code examples for auth middleware
- Service integration points
- Complete API reference

### 2. Infrastructure ✅

**Container 200 (psa-all-in-one):**
- PostgreSQL 15.14 running
- Redis 7.0.15 available (for rate limiting)
- RabbitMQ 3.12.1 ready (future use)
- Node.js 20.19.5 + PM2 installed

### 3. Documentation ✅

**Module Guide:** `implementation/03-MODULE-API-Gateway.md`
- Complete specification
- Technical requirements
- API design patterns
- Integration examples

**Architecture Docs:**
- `BDUF/BDUF-Chapter4.md` - API Design
- `BDUF/BDUF-Chapter5.md` - Security Architecture
- `BDUF/BDUF-Chapter6.md` - Container Architecture

### 4. Development Environment ✅

**Working Directory:** `/opt/psa-putzi`
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (unified with team)
**PM2:** Already configured and running
**Database:** Connected and operational

---

## 🚀 Getting Started (Day 1)

### Step 1: Read Handover Document (1 hour)
```bash
cd /opt/psa-putzi
cat .subagents/handovers/05-auth-to-gateway.md

# This contains everything about auth service integration
```

### Step 2: Read Module Guide (1 hour)
```bash
cat implementation/03-MODULE-API-Gateway.md

# Your complete specification
```

### Step 3: Create Gateway Project Structure (2 hours)
```bash
cd /opt/psa-putzi/services
mkdir api-gateway
cd api-gateway

# Initialize TypeScript project
npm init -y
npm install express http-proxy-middleware jsonwebtoken cors helmet express-rate-limit
npm install -D typescript @types/node @types/express ts-node nodemon

# Set up TypeScript
npx tsc --init

# Create folder structure
mkdir -p src/{middleware,routes,services,utils,types}
mkdir -p tests/{unit,integration}
```

### Step 4: Copy Auth Middleware (30 minutes)
```bash
# The auth service already has the middleware you need!
# Copy and adapt:
cp ../auth-service/src/middleware/auth.middleware.ts src/middleware/
cp ../auth-service/src/middleware/rbac.middleware.ts src/middleware/
cp ../auth-service/src/types/index.ts src/types/

# Copy JWT secret from auth service
grep JWT_SECRET ../auth-service/.env > .env
```

### Step 5: Implement Basic Gateway (2 hours)
```typescript
// src/app.ts - Start simple!
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Proxy to auth service
app.use('/api/v1/auth', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
}));

app.listen(3000, () => {
  console.log('Gateway running on port 3000');
});
```

### Step 6: Test Basic Routing (30 minutes)
```bash
# Start gateway
npm run dev

# Test from another terminal
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/auth/health

# Should see auth service response!
```

---

## 📅 Development Timeline

### Week 1: Core Gateway (Days 1-3)

**Day 1: Setup & Basic Routing**
- ✅ Project structure
- ✅ Basic Express app
- ✅ Proxy to auth service
- ✅ Health check endpoint

**Day 2: Authentication Integration**
- JWT validation middleware
- RBAC middleware
- Protected route examples
- Test with real auth tokens

**Day 3: Rate Limiting & Logging**
- Redis-based rate limiting
- Winston request logging
- Error handling middleware
- CORS configuration

### Week 2: Advanced Features (Days 4-6)

**Day 4: Circuit Breaker**
- Implement circuit breaker pattern
- Health check monitoring
- Timeout handling
- Graceful degradation

**Day 5: Testing & Documentation**
- Integration tests
- Unit tests for middleware
- API documentation
- Deployment guide

**Day 6: Production Readiness**
- PM2 deployment
- Load testing
- Performance optimization
- Final code review

---

## 📋 Technical Requirements

### Must Have (Definition of Done)

**Functionality:**
- [x] Routes requests to auth service (port 3001)
- [ ] Validates JWT tokens correctly
- [ ] Enforces RBAC (23 roles)
- [ ] Implements rate limiting (Redis)
- [ ] Logs all requests (Winston)
- [ ] Handles errors gracefully
- [ ] CORS configured
- [ ] Security headers (helmet)

**Quality:**
- [ ] Test coverage ≥80%
- [ ] All tests passing
- [ ] TypeScript strict mode
- [ ] ESLint clean
- [ ] No security vulnerabilities

**Deployment:**
- [ ] Runs on PM2 (port 3000)
- [ ] Auto-restart on failure
- [ ] Health check endpoint
- [ ] Environment configuration
- [ ] Logging to files

**Documentation:**
- [ ] API documentation (Swagger)
- [ ] Architecture diagram
- [ ] Deployment guide
- [ ] Handover to next agent

### Nice to Have (If Time Permits)

- [ ] GraphQL gateway (future)
- [ ] WebSocket support
- [ ] Request caching
- [ ] API versioning strategy
- [ ] Metrics dashboard (Prometheus)

---

## 🎓 Learning Opportunities

### Skills You'll Develop

**Technical:**
- API Gateway patterns
- JWT validation and RBAC
- Circuit breaker implementation
- Rate limiting strategies
- Microservice communication

**Architectural:**
- Service discovery
- Load balancing
- Resilience patterns
- Security best practices
- Observability

**Leadership:**
- Code reviews for Junior-5 (frontend)
- Mentoring on API integration
- Cross-team coordination
- Architecture decisions

---

## 🤝 Team Coordination

### Your Team

**Main Agent (PM):** Project Manager
- **Role:** Strategic coordination, approvals
- **Response SLA:** < 1 hour for blockers
- **Communication:** `.subagents/issues/` for escalations

**Senior-2 (Auth Backend):** Your Peer
- **Role:** Auth service support, code reviews
- **Expertise:** JWT, RBAC, security
- **Communication:** Ask auth integration questions

**Junior-5 (Frontend):** Your Partner
- **Role:** React frontend, auth UI
- **Expertise:** Frontend, API consumption
- **Communication:** Coordinate on API contracts

### Communication Protocol

**Daily:**
```bash
# 1. Update your status
nano .subagents/status/gateway-agent-2025-11-05.md

# 2. Check for blockers
cat .subagents/issues/*.md

# 3. Review other agents' status
cat .subagents/status/frontend-agent-*.md

# 4. Commit and push frequently
git add .
git commit -m "feat(gateway): implement JWT validation"
git push origin claude/session-011CUa86VGPkHjf5rHUmwfvG
```

**Weekly:**
```bash
# Create weekly status report
cp templates/TEMPLATE-status-update.md .subagents/status/gateway-week1.md
```

**Blockers:**
```bash
# Create issue with template
cp templates/TEMPLATE-issue.md .subagents/issues/2025-11-05-gateway-blocker.md
# @mention relevant agents
```

---

## 🎯 Success Metrics

### Your Performance Indicators

**Delivery:**
- Gateway routes requests correctly
- Authentication integration works
- All tests passing
- Documentation complete
- PM2 deployment successful

**Quality:**
- Test coverage ≥80%
- Zero security issues
- Response times < 100ms overhead
- No memory leaks
- Clean code reviews

**Collaboration:**
- Frontend agent unblocked
- Code reviews for juniors
- Proactive communication
- Issue resolution < 4 hours

---

## 🚨 Common Challenges & Solutions

### Challenge 1: JWT Validation Errors
**Solution:** Check JWT_SECRET matches auth service
```bash
# Compare secrets
diff <(grep JWT_SECRET ../auth-service/.env) <(grep JWT_SECRET .env)
```

### Challenge 2: CORS Issues
**Solution:** Configure CORS properly
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://10.255.20.15:5173'],
  credentials: true
}));
```

### Challenge 3: Rate Limiting Not Working
**Solution:** Ensure Redis is running
```bash
sudo systemctl status redis
# If not running:
sudo systemctl start redis
```

### Challenge 4: Proxy Timeout
**Solution:** Increase timeout settings
```typescript
timeout: 30000,  // 30 seconds
proxyTimeout: 30000
```

---

## 📚 Required Reading (Before Coding)

### Must Read (Essential)
1. `.subagents/handovers/05-auth-to-gateway.md` ← **START HERE**
2. `implementation/03-MODULE-API-Gateway.md`
3. `BDUF/BDUF-Chapter4.md` (API Design)
4. `.subagents/UNIFIED-BRANCH-WORKFLOW.md` (Git workflow)

### Should Read (Important)
5. `BDUF/BDUF-Chapter5.md` (Security)
6. `services/auth-service/src/middleware/auth.middleware.ts` (Example code)
7. `.subagents/AGENT-ROLES-CONFIG.md` (Your role)

### Nice to Read (Reference)
8. `BDUF/BDUF-Chapter6.md` (Container architecture)
9. `.subagents/handovers/04-auth-backend-ready-for-frontend.md` (Context)

---

## ✅ Pre-Launch Checklist

### Before You Start Coding

- [ ] Read handover document (05-auth-to-gateway.md)
- [ ] Read module guide (03-MODULE-API-Gateway.md)
- [ ] Understand JWT validation flow
- [ ] Review RBAC system (23 roles)
- [ ] Check auth service is running (curl localhost:3001/health)
- [ ] Verify Redis is available
- [ ] Read unified branch workflow guide
- [ ] Update `.subagents/status/gateway-agent-2025-11-05.md`

### First Day Deliverables

- [ ] Project structure created
- [ ] Basic Express app running
- [ ] Health check endpoint working
- [ ] Proxy to auth service functional
- [ ] First commit pushed to GitHub
- [ ] Status file updated

---

## 🎉 Welcome to the Team!

You're joining at an exciting time:
- ✅ Auth service is production-ready (95% complete)
- ✅ Frontend is building UI (parallel work)
- ✅ Infrastructure is solid and tested
- ✅ Documentation is comprehensive

**Your gateway will:**
- Enable all future services (CRM, Tickets, Billing)
- Provide centralized security and rate limiting
- Make the frontend's life easier (single endpoint)
- Shape the architecture for the entire platform

**You have:**
- Complete autonomy within your module
- Full support from PM and Senior-2
- Clear specifications and requirements
- All infrastructure ready to use

**Expectations:**
- High quality code (≥80% coverage)
- Proactive communication
- Daily status updates
- Completion in 2 weeks (6 active days)

---

## 🚀 Ready, Set, Go!

**Your first task:** Read the handover document
**Your first commit:** Basic Express app with health check
**Your first milestone:** Proxy working to auth service

**Questions?** Ask in `.subagents/issues/`
**Blocked?** @mention @Main-Agent (< 1 hour response)
**Winning?** Document and share your learnings!

---

**Launch Date:** 2025-11-05 08:30 UTC
**Launched By:** Main Agent (Project Manager)
**Status:** 🟢 Active - Auth Dependencies Met
**Next Milestone:** Basic routing by end of Day 1

---

**Welcome aboard, Senior-4! Let's build something amazing! 🚀**

---

## 📞 Quick Contacts

- **PM (Me):** Coordination, approvals, blockers
- **Senior-2:** Auth integration questions
- **Junior-5:** Frontend API needs
- **All Team:** `.subagents/issues/` for discussions

**Your Status:** `.subagents/status/gateway-agent-YYYY-MM-DD.md`
**Your Code:** `services/api-gateway/`
**Your Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG` (unified)
**Your Port:** 3000

**Let's make this gateway ROCK! 🎸**
