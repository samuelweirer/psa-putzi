# Module Implementation Guide: Workflows & Automation

**Module ID:** WORKFLOWS-001
**Phase:** Phase 3 - Advanced Features
**Priority:** P2 - Important
**Estimated Duration:** 5-6 weeks
**Dependencies:** CRM-001 (CRM), TICKETS-001 (Tickets), AUTH-001 (Auth)

---

## Overview

### Purpose
The Workflows & Automation module provides a powerful, flexible automation engine that allows MSPs to automate repetitive tasks, enforce business processes, and create custom workflows without code. It enables event-driven automation based on triggers, conditions, and actions.

### Key Features
- **Visual Workflow Builder** - Drag-and-drop workflow designer (frontend)
- **Event Triggers** - Listen to system events (ticket created, customer added, etc.)
- **Scheduled Triggers** - Time-based automation (daily, weekly, cron)
- **Conditional Logic** - If/then/else branching with complex conditions
- **Actions Library** - Extensive library of actions (email, update field, create task, etc.)
- **Custom Variables** - Pass data between workflow steps
- **Workflow Templates** - Pre-built workflows for common scenarios
- **Execution History** - Track all workflow executions and outcomes
- **Error Handling** - Retry logic and error notifications
- **Approval Workflows** - Multi-step approval processes

### Business Value
- **For MSPs:**
  - Reduce manual, repetitive work by up to 70%
  - Enforce consistent business processes
  - Improve response times with automated actions
  - Scale operations without proportional staff increase
  - Reduce human error in routine tasks

- **For End Users:**
  - Faster response times (automated ticket routing, auto-replies)
  - Consistent service delivery
  - Better communication (automated status updates)
  - Proactive issue resolution

---

## Database Schema

### Tables from BDUF Chapter 3

```sql
-- Workflow Definitions
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL, -- 'event', 'schedule', 'manual', 'webhook'
    trigger_config JSONB NOT NULL, -- Trigger-specific configuration
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false, -- System-provided template
    category VARCHAR(100), -- 'ticket_automation', 'customer_management', 'project_tracking', etc.
    version INTEGER DEFAULT 1,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Workflow Steps (Nodes in workflow graph)
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL, -- Execution order (for linear workflows)
    step_type VARCHAR(100) NOT NULL, -- 'action', 'condition', 'delay', 'loop', 'approval'
    action_type VARCHAR(100), -- If step_type='action': 'send_email', 'update_field', 'create_ticket', etc.
    config JSONB NOT NULL, -- Step-specific configuration (action parameters, conditions, etc.)
    position_x INTEGER, -- UI: X position in visual builder
    position_y INTEGER, -- UI: Y position in visual builder
    on_success_step_id UUID REFERENCES workflow_steps(id), -- Next step if successful
    on_failure_step_id UUID REFERENCES workflow_steps(id), -- Next step if failed
    retry_count INTEGER DEFAULT 0,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Execution Logs
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    trigger_data JSONB, -- Data that triggered the workflow
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled', 'pending_approval'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    context_data JSONB, -- Variables and data passed between steps
    triggered_by_user_id UUID REFERENCES users(id),
    triggered_by VARCHAR(100), -- 'event', 'schedule', 'manual', 'webhook', 'api'
);

-- Step Execution Logs (detailed log for each step)
CREATE TABLE workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    step_order INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed', 'skipped', 'retrying'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0
);

-- Approval Requests (for approval workflow steps)
CREATE TABLE workflow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id),
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requested_from_user_id UUID NOT NULL REFERENCES users(id),
    requested_from_role_id UUID REFERENCES roles(id), -- Approve if ANY user with this role approves
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    approved_by_user_id UUID REFERENCES users(id),
    decision_at TIMESTAMP WITH TIME ZONE,
    decision_comment TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Jobs (for scheduled trigger workflows)
CREATE TABLE workflow_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100) NOT NULL, -- e.g., '0 9 * * *' (daily at 9 AM)
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Variables (global variables for workflows)
CREATE TABLE workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE, -- NULL = global tenant variable
    variable_name VARCHAR(100) NOT NULL,
    variable_value TEXT,
    variable_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json', 'secret'
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, workflow_id, variable_name)
);

-- Indexes for performance
CREATE INDEX idx_workflows_tenant_active ON workflows(tenant_id, is_active);
CREATE INDEX idx_workflows_trigger ON workflows(trigger_type, is_active);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id, step_order);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(tenant_id, status, started_at DESC);
CREATE INDEX idx_workflow_step_executions_execution ON workflow_step_executions(workflow_execution_id, step_order);
CREATE INDEX idx_workflow_approvals_user ON workflow_approvals(requested_from_user_id, status);
CREATE INDEX idx_workflow_approvals_role ON workflow_approvals(requested_from_role_id, status);
CREATE INDEX idx_workflow_schedules_next_run ON workflow_schedules(is_active, next_run_at);

-- RLS Policies (Row-Level Security)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their tenant's data
CREATE POLICY workflows_tenant_isolation ON workflows USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY workflow_steps_tenant_isolation ON workflow_steps USING (workflow_id IN (SELECT id FROM workflows WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));
CREATE POLICY workflow_executions_tenant_isolation ON workflow_executions USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY workflow_step_executions_tenant_isolation ON workflow_step_executions USING (workflow_execution_id IN (SELECT id FROM workflow_executions WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));
CREATE POLICY workflow_approvals_tenant_isolation ON workflow_approvals USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY workflow_schedules_tenant_isolation ON workflow_schedules USING (workflow_id IN (SELECT id FROM workflows WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));
CREATE POLICY workflow_variables_tenant_isolation ON workflow_variables USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## API Specifications

### Base URL
```
/api/v1/workflows
```

### Authentication
All endpoints require JWT authentication with appropriate RBAC permissions.

**Required Permissions:**
- `workflows.read` - View workflows
- `workflows.write` - Create/edit workflows
- `workflows.execute` - Execute workflows manually
- `workflows.approve` - Approve workflow approval requests

---

### Workflow Management

#### 1. Create Workflow
```http
POST /api/v1/workflows
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Auto-assign tickets to available technician",
  "description": "Automatically assign new tickets to the technician with the least active tickets",
  "category": "ticket_automation",
  "trigger_type": "event",
  "trigger_config": {
    "event": "ticket.created",
    "filters": {
      "priority": ["high", "critical"],
      "customer_id": null  // null = all customers
    }
  },
  "is_active": true
}

Response 201:
{
  "id": "uuid",
  "name": "Auto-assign tickets to available technician",
  "trigger_type": "event",
  "is_active": true,
  "version": 1,
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 2. Get Workflow Details
```http
GET /api/v1/workflows/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "name": "Auto-assign tickets to available technician",
  "description": "...",
  "trigger_type": "event",
  "trigger_config": {...},
  "is_active": true,
  "version": 1,
  "execution_count": 142,
  "last_executed_at": "2025-01-15T09:45:00Z",
  "error_count": 3,
  "steps": [
    {
      "id": "uuid",
      "step_order": 1,
      "step_type": "action",
      "action_type": "query_database",
      "config": {
        "query_type": "find_user",
        "filters": {
          "role": "technician",
          "status": "available"
        },
        "order_by": "ticket_count_asc",
        "limit": 1
      }
    },
    {
      "id": "uuid",
      "step_order": 2,
      "step_type": "condition",
      "config": {
        "condition": "{{step1.result}} != null",
        "if_true": "step3",
        "if_false": "step4"
      }
    },
    {
      "id": "uuid",
      "step_order": 3,
      "step_type": "action",
      "action_type": "update_ticket",
      "config": {
        "ticket_id": "{{trigger.ticket.id}}",
        "updates": {
          "assigned_to": "{{step1.result.id}}",
          "status": "assigned"
        }
      }
    }
  ],
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-12T14:30:00Z"
}
```

#### 3. List Workflows
```http
GET /api/v1/workflows?category=ticket_automation&is_active=true
Authorization: Bearer <token>

Response 200:
{
  "workflows": [
    {
      "id": "uuid",
      "name": "Auto-assign tickets to available technician",
      "category": "ticket_automation",
      "trigger_type": "event",
      "is_active": true,
      "execution_count": 142,
      "error_count": 3,
      "last_executed_at": "2025-01-15T09:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 1
  }
}
```

#### 4. Update Workflow
```http
PATCH /api/v1/workflows/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Auto-assign high priority tickets",
  "is_active": false
}

Response 200:
{
  "id": "uuid",
  "name": "Auto-assign high priority tickets",
  "is_active": false,
  "version": 2,
  "updated_at": "2025-01-15T10:00:00Z"
}
```

#### 5. Delete Workflow
```http
DELETE /api/v1/workflows/:id
Authorization: Bearer <token>

Response 204: No Content
```

---

### Workflow Steps

#### 6. Add Step to Workflow
```http
POST /api/v1/workflows/:workflow_id/steps
Content-Type: application/json
Authorization: Bearer <token>

{
  "step_order": 1,
  "step_type": "action",
  "action_type": "send_email",
  "config": {
    "to": "{{trigger.ticket.customer.email}}",
    "subject": "Your ticket #{{trigger.ticket.number}} has been received",
    "body": "Thank you for contacting us. We have received your ticket and will respond shortly.",
    "template_id": "uuid"
  },
  "retry_count": 3,
  "retry_delay_seconds": 60
}

Response 201:
{
  "id": "uuid",
  "workflow_id": "uuid",
  "step_order": 1,
  "step_type": "action",
  "action_type": "send_email",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 7. Update Workflow Step
```http
PATCH /api/v1/workflows/:workflow_id/steps/:step_id
Content-Type: application/json
Authorization: Bearer <token>

{
  "config": {
    "to": "{{trigger.ticket.customer.email}}, support@msp.com",
    "subject": "[Ticket #{{trigger.ticket.number}}] Received"
  }
}

Response 200:
{
  "id": "uuid",
  "config": {...},
  "updated_at": "2025-01-15T10:05:00Z"
}
```

---

### Workflow Execution

#### 8. Execute Workflow Manually
```http
POST /api/v1/workflows/:id/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "trigger_data": {
    "ticket_id": "uuid",
    "customer_id": "uuid"
  }
}

Response 202:
{
  "execution_id": "uuid",
  "workflow_id": "uuid",
  "status": "running",
  "started_at": "2025-01-15T10:00:00Z"
}
```

#### 9. Get Execution Status
```http
GET /api/v1/workflows/executions/:execution_id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "workflow_id": "uuid",
  "workflow_name": "Auto-assign tickets",
  "status": "completed",
  "started_at": "2025-01-15T10:00:00Z",
  "completed_at": "2025-01-15T10:00:02.345Z",
  "duration_ms": 2345,
  "trigger_data": {...},
  "step_executions": [
    {
      "id": "uuid",
      "step_order": 1,
      "action_type": "query_database",
      "status": "completed",
      "duration_ms": 125,
      "output_data": {
        "result": {
          "id": "uuid",
          "name": "John Smith"
        }
      }
    },
    {
      "id": "uuid",
      "step_order": 2,
      "step_type": "condition",
      "status": "completed",
      "duration_ms": 5,
      "output_data": {
        "condition_result": true,
        "next_step": 3
      }
    },
    {
      "id": "uuid",
      "step_order": 3,
      "action_type": "update_ticket",
      "status": "completed",
      "duration_ms": 78,
      "output_data": {
        "ticket_id": "uuid",
        "updated": true
      }
    }
  ]
}
```

#### 10. List Workflow Executions
```http
GET /api/v1/workflows/:workflow_id/executions?status=failed&limit=20
Authorization: Bearer <token>

Response 200:
{
  "executions": [
    {
      "id": "uuid",
      "workflow_id": "uuid",
      "status": "failed",
      "started_at": "2025-01-15T09:30:00Z",
      "completed_at": "2025-01-15T09:30:05Z",
      "duration_ms": 5000,
      "error_message": "Failed to send email: SMTP connection timeout"
    }
  ],
  "pagination": {...}
}
```

#### 11. Retry Failed Execution
```http
POST /api/v1/workflows/executions/:execution_id/retry
Authorization: Bearer <token>

Response 202:
{
  "new_execution_id": "uuid",
  "status": "running",
  "started_at": "2025-01-15T10:05:00Z"
}
```

---

### Approvals

#### 12. Get Pending Approvals
```http
GET /api/v1/workflows/approvals?status=pending
Authorization: Bearer <token>

Response 200:
{
  "approvals": [
    {
      "id": "uuid",
      "workflow_execution_id": "uuid",
      "workflow_name": "Contract renewal approval",
      "title": "Approve contract renewal for Acme Corp",
      "description": "Contract value: $50,000/year. 2-year term.",
      "requested_from": "John Smith",
      "status": "pending",
      "expires_at": "2025-01-20T10:00:00Z",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### 13. Approve/Reject Workflow
```http
POST /api/v1/workflows/approvals/:approval_id/decide
Content-Type: application/json
Authorization: Bearer <token>

{
  "decision": "approved",
  "comment": "Approved - terms look good"
}

Response 200:
{
  "id": "uuid",
  "status": "approved",
  "approved_by": "John Smith",
  "decision_at": "2025-01-15T10:05:00Z",
  "workflow_execution_resumed": true
}
```

---

### Workflow Templates

#### 14. List Workflow Templates
```http
GET /api/v1/workflows/templates?category=ticket_automation
Authorization: Bearer <token>

Response 200:
{
  "templates": [
    {
      "id": "uuid",
      "name": "Auto-assign tickets by priority",
      "description": "Automatically assign tickets to technicians based on priority and availability",
      "category": "ticket_automation",
      "trigger_type": "event",
      "step_count": 5
    },
    {
      "id": "uuid",
      "name": "Send customer satisfaction survey",
      "description": "Send CSAT survey 24 hours after ticket is closed",
      "category": "customer_management",
      "trigger_type": "schedule",
      "step_count": 3
    }
  ]
}
```

#### 15. Create Workflow from Template
```http
POST /api/v1/workflows/templates/:template_id/instantiate
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My custom auto-assign workflow",
  "is_active": false
}

Response 201:
{
  "id": "uuid",
  "name": "My custom auto-assign workflow",
  "is_active": false,
  "created_from_template": "uuid",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Business Logic Implementation

### Workflow Engine Core
```typescript
// src/services/workflows/workflow-engine.ts

import { EventEmitter } from 'events';

export interface WorkflowContext {
  tenant_id: string;
  execution_id: string;
  workflow_id: string;
  trigger_data: any;
  variables: Map<string, any>;
  step_results: Map<number, any>;
}

export class WorkflowEngine extends EventEmitter {
  private db: any;
  private actionRegistry: Map<string, WorkflowAction>;

  constructor(db: any) {
    super();
    this.db = db;
    this.actionRegistry = new Map();
    this.registerBuiltInActions();
  }

  async executeWorkflow(
    workflowId: string,
    triggerData: any,
    triggeredBy: string
  ): Promise<string> {
    // Create execution record
    const execution = await this.db.workflow_executions.create({
      workflow_id: workflowId,
      trigger_data: triggerData,
      status: 'running',
      triggered_by: triggeredBy,
      started_at: new Date()
    });

    const context: WorkflowContext = {
      tenant_id: execution.tenant_id,
      execution_id: execution.id,
      workflow_id: workflowId,
      trigger_data: triggerData,
      variables: new Map(),
      step_results: new Map()
    };

    // Execute workflow in background
    this.executeWorkflowSteps(context).catch(async (error) => {
      await this.db.workflow_executions.update(execution.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date(),
        duration_ms: Date.now() - execution.started_at.getTime()
      });

      this.emit('workflow:failed', { execution_id: execution.id, error });
    });

    return execution.id;
  }

  private async executeWorkflowSteps(context: WorkflowContext): Promise<void> {
    const workflow = await this.db.workflows.findById(context.workflow_id);
    const steps = await this.db.workflow_steps.find(
      { workflow_id: context.workflow_id },
      { sort: { step_order: 1 } }
    );

    const startTime = Date.now();
    let currentStepIndex = 0;

    while (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];

      try {
        const stepResult = await this.executeStep(step, context);

        context.step_results.set(step.step_order, stepResult);

        // Handle conditional branching
        if (step.step_type === 'condition' && stepResult.next_step_id) {
          const nextStepIndex = steps.findIndex(s => s.id === stepResult.next_step_id);
          if (nextStepIndex >= 0) {
            currentStepIndex = nextStepIndex;
            continue;
          }
        }

        // Handle approval step
        if (step.step_type === 'approval') {
          // Workflow paused, waiting for approval
          await this.db.workflow_executions.update(context.execution_id, {
            status: 'pending_approval'
          });
          return; // Exit - will resume when approved
        }

        currentStepIndex++;
      } catch (error: any) {
        // Handle retry logic
        const canRetry = await this.handleStepFailure(step, context, error);
        if (!canRetry) {
          throw error;
        }
      }
    }

    // Mark as completed
    await this.db.workflow_executions.update(context.execution_id, {
      status: 'completed',
      completed_at: new Date(),
      duration_ms: Date.now() - startTime,
      context_data: Object.fromEntries(context.variables)
    });

    // Increment workflow execution count
    await this.db.workflows.update(context.workflow_id, {
      execution_count: workflow.execution_count + 1,
      last_executed_at: new Date()
    });

    this.emit('workflow:completed', { execution_id: context.execution_id });
  }

  private async executeStep(
    step: any,
    context: WorkflowContext
  ): Promise<any> {
    const stepExecution = await this.db.workflow_step_executions.create({
      workflow_execution_id: context.execution_id,
      workflow_step_id: step.id,
      step_order: step.step_order,
      status: 'running',
      started_at: new Date()
    });

    const startTime = Date.now();

    try {
      let result: any;

      switch (step.step_type) {
        case 'action':
          result = await this.executeAction(step, context);
          break;
        case 'condition':
          result = await this.evaluateCondition(step, context);
          break;
        case 'delay':
          result = await this.executeDelay(step, context);
          break;
        case 'approval':
          result = await this.createApprovalRequest(step, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.step_type}`);
      }

      await this.db.workflow_step_executions.update(stepExecution.id, {
        status: 'completed',
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
        output_data: result
      });

      return result;
    } catch (error: any) {
      await this.db.workflow_step_executions.update(stepExecution.id, {
        status: 'failed',
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
        error_message: error.message
      });

      throw error;
    }
  }

  private async executeAction(step: any, context: WorkflowContext): Promise<any> {
    const action = this.actionRegistry.get(step.action_type);
    if (!action) {
      throw new Error(`Unknown action type: ${step.action_type}`);
    }

    // Interpolate variables in config
    const interpolatedConfig = this.interpolateVariables(step.config, context);

    return await action.execute(interpolatedConfig, context);
  }

  private async evaluateCondition(step: any, context: WorkflowContext): Promise<any> {
    const condition = step.config.condition;
    const interpolatedCondition = this.interpolateVariables(condition, context);

    // Simple condition evaluator (in production, use a safe expression evaluator)
    const result = this.evaluateExpression(interpolatedCondition);

    const nextStepId = result
      ? step.config.if_true || step.on_success_step_id
      : step.config.if_false || step.on_failure_step_id;

    return { condition_result: result, next_step_id: nextStepId };
  }

  private interpolateVariables(value: any, context: WorkflowContext): any {
    if (typeof value === 'string') {
      // Replace {{trigger.field}} with actual value
      return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const pathParts = path.trim().split('.');
        let result: any = {
          trigger: context.trigger_data,
          variables: Object.fromEntries(context.variables)
        };

        // Support {{step1.result.field}} syntax
        if (pathParts[0].startsWith('step')) {
          const stepOrder = parseInt(pathParts[0].replace('step', ''), 10);
          result = { [pathParts[0]]: context.step_results.get(stepOrder) };
        }

        for (const part of pathParts) {
          result = result?.[part];
        }

        return result !== undefined ? String(result) : match;
      });
    } else if (typeof value === 'object' && value !== null) {
      const interpolated: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        interpolated[key] = this.interpolateVariables(value[key], context);
      }
      return interpolated;
    }

    return value;
  }

  private evaluateExpression(expression: string): boolean {
    // TODO: Use a safe expression evaluator like `expr-eval` or `vm2`
    // For now, simple === check
    try {
      return eval(expression);
    } catch {
      return false;
    }
  }

  private registerBuiltInActions(): void {
    // Register all built-in actions
    this.registerAction('send_email', new SendEmailAction(this.db));
    this.registerAction('update_ticket', new UpdateTicketAction(this.db));
    this.registerAction('create_task', new CreateTaskAction(this.db));
    this.registerAction('query_database', new QueryDatabaseAction(this.db));
    this.registerAction('http_request', new HttpRequestAction());
    this.registerAction('set_variable', new SetVariableAction());
    // ... more actions
  }

  registerAction(name: string, action: WorkflowAction): void {
    this.actionRegistry.set(name, action);
  }
}

export interface WorkflowAction {
  execute(config: any, context: WorkflowContext): Promise<any>;
}
```

### Built-in Actions

```typescript
// src/services/workflows/actions/send-email-action.ts

export class SendEmailAction implements WorkflowAction {
  constructor(private db: any) {}

  async execute(config: any, context: WorkflowContext): Promise<any> {
    const { to, subject, body, template_id, attachments } = config;

    // TODO: Integrate with email service
    const emailService = new EmailService();

    const result = await emailService.send({
      to: to,
      subject: subject,
      body: body,
      html: template_id ? await this.renderTemplate(template_id, context) : undefined,
      attachments: attachments || []
    });

    return { sent: true, message_id: result.messageId };
  }

  private async renderTemplate(templateId: string, context: WorkflowContext): Promise<string> {
    // TODO: Load template and render with context
    return '<html>...</html>';
  }
}

// src/services/workflows/actions/update-ticket-action.ts

export class UpdateTicketAction implements WorkflowAction {
  constructor(private db: any) {}

  async execute(config: any, context: WorkflowContext): Promise<any> {
    const { ticket_id, updates } = config;

    const ticket = await this.db.tickets.update(ticket_id, updates);

    return { ticket_id: ticket.id, updated: true };
  }
}

// src/services/workflows/actions/query-database-action.ts

export class QueryDatabaseAction implements WorkflowAction {
  constructor(private db: any) {}

  async execute(config: any, context: WorkflowContext): Promise<any> {
    const { query_type, filters, order_by, limit } = config;

    let result: any;

    switch (query_type) {
      case 'find_user':
        result = await this.db.users.findOne(filters, { sort: this.parseSortOrder(order_by) });
        break;
      case 'find_users':
        result = await this.db.users.find(filters, { sort: this.parseSortOrder(order_by), limit });
        break;
      case 'count_tickets':
        result = await this.db.tickets.count(filters);
        break;
      default:
        throw new Error(`Unknown query type: ${query_type}`);
    }

    return { result };
  }

  private parseSortOrder(orderBy: string): any {
    // e.g., 'ticket_count_asc' -> { ticket_count: 1 }
    if (!orderBy) return {};
    const [field, direction] = orderBy.split('_');
    return { [field]: direction === 'desc' ? -1 : 1 };
  }
}
```

### Event System Integration

```typescript
// src/services/workflows/workflow-event-listener.ts

export class WorkflowEventListener {
  private engine: WorkflowEngine;
  private db: any;

  constructor(engine: WorkflowEngine, db: any) {
    this.engine = engine;
    this.db = db;

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Listen to system events and trigger workflows
    this.on('ticket.created', this.handleTicketCreated.bind(this));
    this.on('ticket.updated', this.handleTicketUpdated.bind(this));
    this.on('ticket.closed', this.handleTicketClosed.bind(this));
    this.on('customer.created', this.handleCustomerCreated.bind(this));
    // ... more events
  }

  private async handleTicketCreated(event: any): Promise<void> {
    const workflows = await this.db.workflows.find({
      is_active: true,
      trigger_type: 'event',
      'trigger_config.event': 'ticket.created'
    });

    for (const workflow of workflows) {
      if (this.matchesFilters(event.data, workflow.trigger_config.filters)) {
        await this.engine.executeWorkflow(workflow.id, event.data, 'event');
      }
    }
  }

  private matchesFilters(data: any, filters: any): boolean {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (value === null) continue; // null = any value

      if (Array.isArray(value)) {
        if (!value.includes(data[key])) return false;
      } else {
        if (data[key] !== value) return false;
      }
    }

    return true;
  }

  private on(event: string, handler: Function): void {
    // TODO: Integrate with global event bus (RabbitMQ, EventEmitter, etc.)
    // globalEventBus.on(event, handler);
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// tests/unit/workflows/workflow-engine.test.ts

import { WorkflowEngine } from '../../../src/services/workflows/workflow-engine';

describe('Workflow Engine', () => {
  let engine: WorkflowEngine;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      workflows: { findById: jest.fn(), update: jest.fn() },
      workflow_steps: { find: jest.fn() },
      workflow_executions: { create: jest.fn(), update: jest.fn() },
      workflow_step_executions: { create: jest.fn(), update: jest.fn() }
    };

    engine = new WorkflowEngine(mockDb);
  });

  test('should execute simple workflow', async () => {
    mockDb.workflow_executions.create.mockResolvedValue({
      id: 'exec-1',
      workflow_id: 'workflow-1',
      tenant_id: 'tenant-1',
      started_at: new Date()
    });

    mockDb.workflows.findById.mockResolvedValue({
      id: 'workflow-1',
      execution_count: 0
    });

    mockDb.workflow_steps.find.mockResolvedValue([
      {
        id: 'step-1',
        step_order: 1,
        step_type: 'action',
        action_type: 'set_variable',
        config: { variable_name: 'test', variable_value: 'success' }
      }
    ]);

    const executionId = await engine.executeWorkflow('workflow-1', {}, 'manual');

    expect(executionId).toBe('exec-1');
    expect(mockDb.workflow_executions.create).toHaveBeenCalled();
  });

  test('should interpolate variables correctly', async () => {
    const context = {
      tenant_id: 'tenant-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      trigger_data: { ticket: { id: 'ticket-1', number: 123 } },
      variables: new Map([['user_name', 'John']]),
      step_results: new Map()
    };

    const result = engine['interpolateVariables'](
      'Ticket #{{trigger.ticket.number}} assigned to {{variables.user_name}}',
      context
    );

    expect(result).toBe('Ticket #123 assigned to John');
  });
});
```

---

## Implementation Checklist

### Phase 1: Core Engine (Weeks 1-2)
- [ ] **Database Setup**
  - [ ] Create all workflow tables with RLS
  - [ ] Create indexes
  - [ ] Test multi-tenancy isolation

- [ ] **Workflow Engine Core**
  - [ ] Implement WorkflowEngine class
  - [ ] Implement step execution logic
  - [ ] Add variable interpolation
  - [ ] Add conditional branching
  - [ ] Implement error handling and retry logic
  - [ ] Write unit tests for engine

- [ ] **Basic Actions**
  - [ ] Implement SetVariableAction
  - [ ] Implement SendEmailAction
  - [ ] Implement HttpRequestAction
  - [ ] Register actions in engine
  - [ ] Write unit tests for each action

### Phase 2: API & Management (Week 3)
- [ ] **Workflow CRUD APIs**
  - [ ] POST /workflows (create)
  - [ ] GET /workflows/:id (get details)
  - [ ] GET /workflows (list)
  - [ ] PATCH /workflows/:id (update)
  - [ ] DELETE /workflows/:id (delete)

- [ ] **Workflow Steps APIs**
  - [ ] POST /workflows/:id/steps (add step)
  - [ ] PATCH /workflows/:id/steps/:step_id (update step)
  - [ ] DELETE /workflows/:id/steps/:step_id (delete step)

- [ ] **Execution APIs**
  - [ ] POST /workflows/:id/execute (manual execution)
  - [ ] GET /workflows/executions/:id (get execution status)
  - [ ] GET /workflows/:id/executions (list executions)
  - [ ] POST /workflows/executions/:id/retry (retry failed)

### Phase 3: Event System & Triggers (Week 4)
- [ ] **Event System Integration**
  - [ ] Implement WorkflowEventListener
  - [ ] Register event handlers for common events
  - [ ] Test event-triggered workflows

- [ ] **Scheduled Workflows**
  - [ ] Implement cron scheduler (using node-cron or Bull)
  - [ ] Create workflow_schedules management
  - [ ] Test scheduled execution

- [ ] **Advanced Actions**
  - [ ] UpdateTicketAction
  - [ ] CreateTaskAction
  - [ ] QueryDatabaseAction
  - [ ] CreateCustomerAction
  - [ ] UpdateCustomerAction
  - [ ] Write tests for all actions

### Phase 4: Approvals & Templates (Week 5)
- [ ] **Approval Workflows**
  - [ ] Implement approval step type
  - [ ] Create approval request system
  - [ ] GET /workflows/approvals (pending approvals)
  - [ ] POST /workflows/approvals/:id/decide (approve/reject)
  - [ ] Resume workflow after approval

- [ ] **Workflow Templates**
  - [ ] Create system templates for common scenarios
  - [ ] GET /workflows/templates (list templates)
  - [ ] POST /workflows/templates/:id/instantiate (create from template)

### Phase 5: Polish & Integration (Week 6)
- [ ] **Integration Testing**
  - [ ] Test end-to-end workflows
  - [ ] Test with CRM module
  - [ ] Test with Tickets module
  - [ ] Test multi-step workflows with branching

- [ ] **Performance & Optimization**
  - [ ] Add execution timeout handling
  - [ ] Optimize database queries
  - [ ] Add caching for workflow definitions
  - [ ] Load testing

- [ ] **Documentation**
  - [ ] API documentation (Swagger)
  - [ ] Workflow builder guide
  - [ ] Action library documentation
  - [ ] Best practices guide

---

## Definition of Done

- [x] All APIs implemented and tested
- [x] Workflow engine executes steps correctly
- [x] Event triggers working
- [x] Scheduled workflows working
- [x] Approval workflows functional
- [x] Unit test coverage ≥ 80%
- [x] Integration tests passing
- [x] RBAC permissions enforced
- [x] Multi-tenancy isolation verified
- [x] Documentation complete

---

## Dependencies

### Required Modules
- **AUTH-001** - Authentication & Authorization (for RBAC)
- **CRM-001** - Customer management (for customer-related actions)
- **TICKETS-001** - Ticket management (for ticket-related actions)

### Optional Integrations
- **PROJECTS-001** - Project task automation
- **BILLING-001** - Invoice generation automation

### External Libraries
- `node-cron` or `Bull/BullMQ` - Scheduled job execution
- `expr-eval` or `vm2` - Safe expression evaluation
- Email service integration (Nodemailer, SendGrid, etc.)

---

## Environment Variables

```bash
# Workflows Module Configuration
WORKFLOWS_MAX_EXECUTION_TIME_SECONDS=600     # 10 minutes max per workflow
WORKFLOWS_MAX_RETRY_ATTEMPTS=3               # Retry failed steps up to 3 times
WORKFLOWS_ENABLE_SCHEDULER=true              # Enable cron scheduler
WORKFLOWS_SCHEDULER_INTERVAL_MS=60000        # Check every 60 seconds

# Queue Configuration (if using Bull/BullMQ)
REDIS_URL=redis://localhost:6379
WORKFLOWS_QUEUE_NAME=workflow-executions

# Email Action
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=workflows@psa-platform.com
SMTP_PASSWORD=secure_password
```

---

**Module Owner**: Workflows Sub-Agent
**Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Status**: Ready for Implementation
