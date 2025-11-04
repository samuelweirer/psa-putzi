# PSA-Platform - Implementation Guides

This folder contains detailed implementation guides for each module/service of the PSA-Platform. Each guide is designed to be used by sub-agents for autonomous development.

## Module Overview

### Phase 1: MVP (Months 1-4)

| Module | File | Status | Dependencies | Priority |
|--------|------|--------|--------------|----------|
| Infrastructure | [01-MODULE-Infrastructure.md](01-MODULE-Infrastructure.md) | ✅ Ready | - | P0 |
| Auth & RBAC | [02-MODULE-Auth.md](02-MODULE-Auth.md) | ✅ Ready | Infrastructure | P0 |
| API Gateway | [03-MODULE-API-Gateway.md](03-MODULE-API-Gateway.md) | ✅ Ready | Auth | P0 |
| CRM | [04-MODULE-CRM.md](04-MODULE-CRM.md) | ✅ Ready | Auth, API Gateway | P1 |
| Tickets | [05-MODULE-Tickets.md](05-MODULE-Tickets.md) | 🔄 In Progress | Auth, CRM | P1 |

### Phase 2: Core Platform (Months 5-8)

| Module | File | Status | Dependencies | Priority |
|--------|------|--------|--------------|----------|
| Billing | [06-MODULE-Billing.md](06-MODULE-Billing.md) | 📝 Planned | Auth, Tickets | P2 |
| Projects | [07-MODULE-Projects.md](07-MODULE-Projects.md) | 📝 Planned | Auth, CRM | P2 |
| Assets | [08-MODULE-Assets.md](08-MODULE-Assets.md) | 📝 Planned | Auth, CRM | P2 |
| Reports | [09-MODULE-Reports.md](09-MODULE-Reports.md) | 📝 Planned | Auth, All Services | P2 |

### Phase 3: Advanced (Months 9-12)

| Module | File | Status | Dependencies | Priority |
|--------|------|--------|--------------|----------|
| vCIO | [10-MODULE-vCIO.md](10-MODULE-vCIO.md) | 📝 Planned | Auth, Reports | P3 |
| Workflows | [11-MODULE-Workflows.md](11-MODULE-Workflows.md) | 📝 Planned | Auth, RabbitMQ | P3 |
| AI/LLM | [12-MODULE-AI.md](12-MODULE-AI.md) | 📝 Planned | Auth, Tickets | P3 |

### Continuous

| Module | File | Status | Dependencies | Priority |
|--------|------|--------|--------------|----------|
| Frontend | [13-MODULE-Frontend.md](13-MODULE-Frontend.md) | ✅ Ready | All Modules | P0 |

---

## How to Use with Sub-Agents

### Step 1: Choose a Module

Select a module based on:
- **Phase**: Start with Phase 1 (MVP)
- **Dependencies**: Prerequisites must be completed
- **Team Availability**: Assign to available developers

### Step 2: Launch Sub-Agent

```bash
# Example: Implementing Auth Module
claude-agent create \
  --name "PSA Auth Module" \
  --prompt "$(cat implementation/02-MODULE-Auth.md)" \
  --context "$(cat BDUF/BDUF-Chapter3.md)" \
  --context "$(cat BDUF/BDUF-Chapter5.md)"
```

### Step 3: Sub-Agent Works Autonomously

The sub-agent will:
1. Read the specification
2. Create database schema files
3. Implement API endpoints
4. Write tests (unit + integration)
5. Create API documentation
6. Commit code with proper messages

### Step 4: Review & Integrate

- Code review by Tech Lead
- Integration tests with other modules
- Deploy to staging
- Merge to main branch

---

## Module Guide Structure

Each module guide contains:

### 1. Overview
- Module purpose
- Key features
- Dependencies
- Container specification

### 2. Database Schema
- Table definitions (SQL)
- Indexes
- Constraints
- Migration scripts

### 3. API Specification
- REST endpoints
- Request/Response examples
- Error handling
- OpenAPI schema

### 4. Business Logic
- Core functionalities
- Validation rules
- Business rules
- Rate resolution algorithms

### 5. Testing Requirements
- Unit tests (≥70% coverage)
- Integration tests
- Performance tests
- Test data/fixtures

### 6. Implementation Checklist
- Step-by-step tasks
- Definition of Done
- Acceptance criteria

---

## Development Standards

### Code Structure

```
psa-{module}/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models (ORM)
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── index.ts         # App entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test data
├── migrations/          # Database migrations
├── docs/                # API documentation
├── package.json
├── tsconfig.json
└── README.md
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`)
- **Database**: snake_case (`user_id`, `created_at`)

### Git Commit Messages

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(auth): implement JWT authentication

- Add JWT token generation
- Add token validation middleware
- Add refresh token logic

Closes #123
```

---

## Testing Standards

### Unit Tests

```typescript
// user-service.test.ts
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when ID exists', async () => {
      const user = await userService.getUserById('uuid-123');
      expect(user).toBeDefined();
      expect(user.id).toBe('uuid-123');
    });

    it('should throw error when ID does not exist', async () => {
      await expect(userService.getUserById('invalid'))
        .rejects
        .toThrow('User not found');
    });
  });
});
```

### Integration Tests

```typescript
// auth.integration.test.ts
describe('POST /api/v1/auth/login', () => {
  it('should return JWT token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });
});
```

---

## Documentation Standards

### API Documentation (OpenAPI)

```yaml
paths:
  /api/v1/users/{id}:
    get:
      summary: Get user by ID
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
```

---

## Support

**Questions?** Check:
- [BDUF Documentation](/BDUF/)
- [Project Implementation Plan](/PROJECT-IMPLEMENTATION-PLAN.md)
- [CLAUDE.md](/CLAUDE.md)

**Issues?** Create ticket in project management tool.

---

**Last Updated:** 2025-11-04
**Version:** 1.0
