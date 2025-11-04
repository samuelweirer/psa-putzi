# Module Implementation Guide: psa-projects

**Module:** Project Management
**Phase:** 2 (Core Platform)
**Priority:** P2 (High priority after MVP)
**Port:** 3050
**Dependencies:** psa-auth, psa-crm, psa-db-master

> **📦 Deployment Note:** For early MVP, this service runs on **Container 200 (psa-all-in-one)** alongside all infrastructure (PostgreSQL, Redis, etc.) and Node.js services, managed by PM2. Everything on localhost. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The Projects module manages all project-related activities including project planning, task management, time tracking, milestone tracking, and project profitability analysis.

### Key Features
- **Project Management** (CRUD operations)
- **Project Templates** for recurring project types
- **Task Management** with dependencies
- **Milestone Tracking** with deadlines
- **Gantt Chart** data generation
- **Time Tracking** per project and task
- **Resource Allocation** and capacity planning
- **Project Status** tracking (Not Started, In Progress, On Hold, Completed)
- **Budget Tracking** (estimated vs. actual hours and costs)
- **Profitability Analysis** (revenue vs. cost)
- **Project Documents** and file attachments
- **Project Collaboration** with customers

### Container Specifications
- **Port:** 3050
- **Instances:** 2 (PM2 cluster mode)
- **Memory:** ~2GB per instance
- **CPU:** 2 cores shared

---

## 2. DATABASE SCHEMA

### Tables (from BDUF-Chapter3)

**projects**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Project Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Timeline
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    
    -- Budget & Billing
    budget_type VARCHAR(50) CHECK (budget_type IN ('fixed_price', 'time_and_materials', 'not_to_exceed')),
    budget_amount DECIMAL(12,2),
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Team
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Progress
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_customer ON projects(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_manager ON projects(project_manager_id) WHERE deleted_at IS NULL;
```

**project_tasks**
```sql
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
    
    -- Task Details
    task_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Timeline
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    
    -- Effort Estimation
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Progress
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    
    -- Dependencies
    depends_on UUID[] DEFAULT '{}',  -- Array of task IDs
    
    -- Metadata
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_tasks_assigned ON project_tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_tasks_parent ON project_tasks(parent_task_id);
```

**project_milestones**
```sql
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Milestone Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    
    -- Metadata
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id) WHERE deleted_at IS NULL;
```

---

## 3. API SPECIFICATION

### Base URL
`https://api.psa-platform.local/api/v1/projects`

### Projects Endpoints

#### GET /projects
**Description:** List projects with filtering and pagination

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `status` (string): Filter by status
- `customer_id` (uuid): Filter by customer
- `project_manager_id` (uuid): Filter by project manager
- `search` (string): Search in project name and description

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "project_number": "PRJ-2025-001",
      "customer_id": "uuid-customer",
      "customer_name": "Acme Corp",
      "name": "Office 365 Migration",
      "description": "Migrate 50 users from on-prem Exchange to Office 365",
      "status": "in_progress",
      "priority": "high",
      "start_date": "2025-11-01",
      "target_end_date": "2025-12-15",
      "budget_type": "time_and_materials",
      "budget_amount": 50000.00,
      "estimated_hours": 200,
      "actual_hours": 45.5,
      "project_manager_id": "uuid-pm",
      "project_manager_name": "Anna Schmidt",
      "completion_percent": 35,
      "created_at": "2025-10-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 87,
    "pages": 2
  }
}
```

---

#### POST /projects
**Description:** Create new project

**Request:**
```json
{
  "customer_id": "uuid-customer",
  "contract_id": "uuid-contract",
  "name": "Office 365 Migration",
  "description": "Migrate 50 users from on-prem Exchange to Office 365",
  "status": "not_started",
  "priority": "high",
  "start_date": "2025-11-01",
  "target_end_date": "2025-12-15",
  "budget_type": "time_and_materials",
  "budget_amount": 50000.00,
  "estimated_hours": 200,
  "project_manager_id": "uuid-pm",
  "tags": ["migration", "office365"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new",
  "project_number": "PRJ-2025-087",
  "name": "Office 365 Migration",
  "status": "not_started",
  ...
}
```

---

#### GET /projects/:id
**Description:** Get single project with full details

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "project_number": "PRJ-2025-001",
  "customer_id": "uuid-customer",
  "customer": {
    "id": "uuid-customer",
    "name": "Acme Corp"
  },
  "name": "Office 365 Migration",
  "description": "...",
  "status": "in_progress",
  "priority": "high",
  "start_date": "2025-11-01",
  "target_end_date": "2025-12-15",
  "actual_end_date": null,
  "budget_type": "time_and_materials",
  "budget_amount": 50000.00,
  "estimated_hours": 200,
  "actual_hours": 45.5,
  "project_manager_id": "uuid-pm",
  "project_manager": {
    "id": "uuid-pm",
    "first_name": "Anna",
    "last_name": "Schmidt"
  },
  "completion_percent": 35,
  
  "_embedded": {
    "tasks": [...],
    "milestones": [...],
    "team_members": [...],
    "recent_time_entries": [...]
  },
  
  "statistics": {
    "total_tasks": 15,
    "completed_tasks": 5,
    "hours_logged": 45.5,
    "hours_remaining": 154.5,
    "budget_used_percent": 22.75,
    "days_remaining": 44,
    "is_on_track": true
  }
}
```

---

### Tasks Endpoints

#### GET /projects/:projectId/tasks
**Description:** List tasks for a project

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-task-1",
      "project_id": "uuid-123",
      "task_number": "PRJ-2025-001-001",
      "title": "User data migration prep",
      "description": "Prepare user mailbox data for migration",
      "status": "completed",
      "priority": "high",
      "start_date": "2025-11-01",
      "due_date": "2025-11-05",
      "completed_date": "2025-11-04",
      "estimated_hours": 8,
      "actual_hours": 7.5,
      "assigned_to": "uuid-user",
      "assigned_to_name": "Max Mustermann",
      "completion_percent": 100,
      "depends_on": []
    },
    {
      "id": "uuid-task-2",
      "task_number": "PRJ-2025-001-002",
      "title": "Configure Office 365 tenant",
      "status": "in_progress",
      "completion_percent": 60,
      "depends_on": ["uuid-task-1"]
    }
  ]
}
```

---

#### POST /projects/:projectId/tasks
**Description:** Create new task

**Request:**
```json
{
  "title": "Migrate first batch of users",
  "description": "Migrate 10 pilot users to Office 365",
  "status": "not_started",
  "priority": "high",
  "start_date": "2025-11-10",
  "due_date": "2025-11-12",
  "estimated_hours": 16,
  "assigned_to": "uuid-user",
  "depends_on": ["uuid-task-1", "uuid-task-2"],
  "parent_task_id": null
}
```

**Response (201 Created)**

---

#### PUT /projects/:projectId/tasks/:taskId
**Description:** Update task

**Request:**
```json
{
  "status": "completed",
  "completion_percent": 100,
  "completed_date": "2025-11-12",
  "actual_hours": 14.5
}
```

**Response (200 OK)**

---

### Milestones Endpoints

#### GET /projects/:projectId/milestones
**Description:** List milestones for a project

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-milestone-1",
      "project_id": "uuid-123",
      "name": "Phase 1 Complete - Pilot Migration",
      "description": "10 pilot users migrated successfully",
      "due_date": "2025-11-15",
      "completed_date": "2025-11-14",
      "status": "completed"
    },
    {
      "id": "uuid-milestone-2",
      "name": "Phase 2 Complete - Full Migration",
      "due_date": "2025-12-01",
      "completed_date": null,
      "status": "pending"
    }
  ]
}
```

---

### Gantt Chart Data

#### GET /projects/:id/gantt
**Description:** Get Gantt chart data for project visualization

**Response (200 OK):**
```json
{
  "project": {
    "id": "uuid-123",
    "name": "Office 365 Migration",
    "start_date": "2025-11-01",
    "end_date": "2025-12-15"
  },
  "tasks": [
    {
      "id": "uuid-task-1",
      "name": "User data migration prep",
      "start": "2025-11-01",
      "end": "2025-11-05",
      "progress": 100,
      "dependencies": []
    },
    {
      "id": "uuid-task-2",
      "name": "Configure Office 365 tenant",
      "start": "2025-11-01",
      "end": "2025-11-08",
      "progress": 60,
      "dependencies": ["uuid-task-1"]
    },
    {
      "id": "uuid-task-3",
      "name": "Migrate first batch",
      "start": "2025-11-10",
      "end": "2025-11-12",
      "progress": 0,
      "dependencies": ["uuid-task-1", "uuid-task-2"]
    }
  ],
  "milestones": [
    {
      "id": "uuid-milestone-1",
      "name": "Phase 1 Complete",
      "date": "2025-11-15"
    }
  ]
}
```

---

## 4. BUSINESS LOGIC

### Project Number Generation

```typescript
async function generateProjectNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  const result = await db.query(`
    SELECT project_number FROM projects
    WHERE tenant_id = $1
    AND project_number ~ '^PRJ-${year}-[0-9]+$'
    ORDER BY project_number DESC
    LIMIT 1
  `, [tenantId]);

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const currentNumber = result.rows[0].project_number;
    const numPart = parseInt(currentNumber.split('-')[2]);
    nextNumber = numPart + 1;
  }

  return `PRJ-${year}-${String(nextNumber).padStart(3, '0')}`;
}
```

### Project Completion Calculation

```typescript
async function calculateProjectCompletion(projectId: string): Promise<number> {
  const result = await db.query(`
    SELECT
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
    FROM project_tasks
    WHERE project_id = $1
    AND deleted_at IS NULL
  `, [projectId]);

  const { total_tasks, completed_tasks } = result.rows[0];

  if (total_tasks === 0) return 0;

  return Math.round((completed_tasks / total_tasks) * 100);
}

// Auto-update project completion when tasks change
async function updateProjectCompletion(projectId: string): Promise<void> {
  const completion = await calculateProjectCompletion(projectId);

  await db.projects.update(projectId, {
    completion_percent: completion
  });

  // Update status based on completion
  if (completion === 100) {
    await db.projects.update(projectId, {
      status: 'completed',
      actual_end_date: new Date()
    });
  }
}
```

### Budget Tracking

```typescript
interface ProjectBudgetStatus {
  budgetAmount: number;
  estimatedHours: number;
  actualHours: number;
  actualCost: number;
  actualRevenue: number;
  budgetUsedPercent: number;
  hoursRemainingPercent: number;
  isOverBudget: boolean;
  profit: number;
  marginPercent: number;
}

async function getProjectBudgetStatus(projectId: string): Promise<ProjectBudgetStatus> {
  const project = await db.projects.findById(projectId);

  // Get time entries for project
  const timeEntries = await db.query(`
    SELECT
      SUM(hours) as total_hours,
      SUM(hours * billing_rate) as total_revenue,
      SUM(hours * cost_rate) as total_cost
    FROM time_entries
    WHERE project_task_id IN (
      SELECT id FROM project_tasks WHERE project_id = $1
    )
    AND deleted_at IS NULL
  `, [projectId]);

  const { total_hours, total_revenue, total_cost } = timeEntries.rows[0];

  const actualHours = parseFloat(total_hours) || 0;
  const actualRevenue = parseFloat(total_revenue) || 0;
  const actualCost = parseFloat(total_cost) || 0;

  const budgetUsedPercent = project.budget_amount > 0
    ? (actualRevenue / project.budget_amount) * 100
    : 0;

  const hoursRemainingPercent = project.estimated_hours > 0
    ? ((project.estimated_hours - actualHours) / project.estimated_hours) * 100
    : 0;

  return {
    budgetAmount: project.budget_amount,
    estimatedHours: project.estimated_hours,
    actualHours,
    actualCost,
    actualRevenue,
    budgetUsedPercent: Math.round(budgetUsedPercent * 10) / 10,
    hoursRemainingPercent: Math.round(hoursRemainingPercent * 10) / 10,
    isOverBudget: actualRevenue > project.budget_amount,
    profit: actualRevenue - actualCost,
    marginPercent: actualRevenue > 0 ? ((actualRevenue - actualCost) / actualRevenue) * 100 : 0
  };
}
```

### Task Dependency Validation

```typescript
async function validateTaskDependencies(
  taskId: string,
  dependsOn: string[]
): Promise<void> {
  if (dependsOn.length === 0) return;

  // Check for circular dependencies
  const visited = new Set<string>([taskId]);
  
  async function checkCircular(currentId: string): Promise<void> {
    const task = await db.project_tasks.findById(currentId);
    
    for (const depId of task.depends_on || []) {
      if (visited.has(depId)) {
        throw new Error('Circular dependency detected');
      }
      visited.add(depId);
      await checkCircular(depId);
    }
  }

  for (const depId of dependsOn) {
    await checkCircular(depId);
  }

  // Check that dependencies are in same project
  const task = await db.project_tasks.findById(taskId);
  const dependencies = await db.query(`
    SELECT id, project_id FROM project_tasks
    WHERE id = ANY($1)
  `, [dependsOn]);

  for (const dep of dependencies.rows) {
    if (dep.project_id !== task.project_id) {
      throw new Error('Task dependencies must be in same project');
    }
  }
}
```

---

## 5. TESTING REQUIREMENTS

### Unit Tests

```typescript
describe('Project Management', () => {
  it('should generate sequential project numbers', async () => {
    const num1 = await projectService.generateProjectNumber('tenant-123');
    const num2 = await projectService.generateProjectNumber('tenant-123');

    expect(num1).toMatch(/^PRJ-\d{4}-\d{3}$/);
    expect(num2).toMatch(/^PRJ-\d{4}-\d{3}$/);
    
    const n1 = parseInt(num1.split('-')[2]);
    const n2 = parseInt(num2.split('-')[2]);
    expect(n2).toBe(n1 + 1);
  });

  it('should calculate project completion correctly', async () => {
    const project = await createProject();
    await createTask({ project_id: project.id, status: 'completed' });
    await createTask({ project_id: project.id, status: 'completed' });
    await createTask({ project_id: project.id, status: 'in_progress' });
    await createTask({ project_id: project.id, status: 'not_started' });

    const completion = await projectService.calculateProjectCompletion(project.id);
    expect(completion).toBe(50); // 2 of 4 tasks completed
  });

  it('should detect circular dependencies', async () => {
    const task1 = await createTask();
    const task2 = await createTask({ depends_on: [task1.id] });

    await expect(
      projectService.updateTask(task1.id, { depends_on: [task2.id] })
    ).rejects.toThrow('Circular dependency');
  });
});
```

---

## 6. IMPLEMENTATION CHECKLIST

### Setup
- [ ] Initialize TypeScript project
- [ ] Install dependencies
- [ ] Configure database connection

### Core Features
- [ ] Project CRUD operations
- [ ] Project number generation
- [ ] Task CRUD operations
- [ ] Milestone CRUD operations
- [ ] Project completion calculation
- [ ] Budget tracking
- [ ] Task dependency validation
- [ ] Gantt chart data generation

### API Endpoints
- [ ] GET /projects
- [ ] POST /projects
- [ ] GET /projects/:id
- [ ] PUT /projects/:id
- [ ] DELETE /projects/:id
- [ ] GET /projects/:id/tasks
- [ ] POST /projects/:id/tasks
- [ ] PUT /projects/:id/tasks/:taskId
- [ ] DELETE /projects/:id/tasks/:taskId
- [ ] GET /projects/:id/milestones
- [ ] POST /projects/:id/milestones
- [ ] GET /projects/:id/gantt

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests

---

## 7. DEFINITION OF DONE

- [ ] All endpoints implemented
- [ ] Project and task CRUD functional
- [ ] Budget tracking working
- [ ] Gantt chart data generation working
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] API documentation (OpenAPI)
- [ ] Performance: Project list < 300ms (p95)

---

## 8. DEPENDENCIES & LIBRARIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "joi": "^17.11.0",
    "date-fns": "^2.30.0"
  }
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://psa_app:password@127.0.0.1:5432/psa_platform
NODE_ENV=production
PORT=3050
PROJECT_PREFIX=PRJ
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 3 weeks (1-2 developers)
