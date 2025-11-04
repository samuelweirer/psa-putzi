# Module Implementation Guide: psa-tickets

**Module:** Ticketing & Service Desk
**Phase:** 1 (MVP)
**Priority:** P1 (Core business functionality)
**Port:** 3030
**Dependencies:** psa-auth, psa-crm, psa-db-master, psa-rabbitmq

> **📦 Deployment Note:** For early MVP, this service runs on **Container 200 (psa-all-in-one)** alongside all infrastructure (PostgreSQL, Redis, etc.) and Node.js services, managed by PM2. Everything on localhost. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The Tickets module is the core of the PSA platform, managing all service requests, incidents, and support tickets with SLA tracking, time tracking, and workflow management.

### Key Features
- **Ticket Management** (CRUD operations)
- **SLA Tracking** (Response & Resolution times)
- **Time Entries** with billing rate resolution
- **Comments & Activity Timeline**
- **File Attachments**
- **Status Workflow** (New → Assigned → In Progress → Resolved → Closed)
- **Auto-Assignment** to technicians
- **Email Integration** (Ticket creation via email)
- **Ticket Linking** (Parent/Child relationships)
- **Custom Fields** (JSONB)
- **Full-Text Search**

### Container Specifications
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 50 GB
- **Network:** VLAN 20 (Application)
- **Port:** 3030

---

## 2. DATABASE SCHEMA

### Core Tables (from BDUF-Chapter3)

**tickets**
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_number SERIAL UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Ticket Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled')),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team UUID,
    
    -- SLA
    sla_id UUID REFERENCES slas(id) ON DELETE SET NULL,
    sla_response_due TIMESTAMP,
    sla_resolution_due TIMESTAMP,
    sla_breached BOOLEAN DEFAULT false,
    sla_breach_reason TEXT,
    
    -- Dates
    first_response_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Parent/Child Relationships
    parent_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Search
    search_vector tsvector,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_tickets_tenant ON tickets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_customer ON tickets(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_status ON tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_sla_due ON tickets(sla_resolution_due) WHERE deleted_at IS NULL AND status NOT IN ('resolved', 'closed');
CREATE INDEX idx_tickets_search ON tickets USING gin(search_vector);
```

**time_entries**
```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    project_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Time Details
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
    description TEXT NOT NULL,
    work_type VARCHAR(50), -- 'support', 'project', 'consulting', 'emergency'
    
    -- Billing
    billable BOOLEAN DEFAULT true NOT NULL,
    billed BOOLEAN DEFAULT false NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    billing_rate DECIMAL(8,2) NOT NULL, -- Snapshot from user_billing_rates
    cost_rate DECIMAL(8,2), -- Snapshot from users.internal_cost_rate
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT time_entry_target CHECK (
        ticket_id IS NOT NULL OR project_task_id IS NOT NULL
    )
);

CREATE INDEX idx_time_entries_tenant ON time_entries(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_ticket ON time_entries(ticket_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_user ON time_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_billed ON time_entries(billed) WHERE deleted_at IS NULL;
```

**comments**
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Comment Details
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_resolution BOOLEAN DEFAULT false,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT comment_target CHECK (
        ticket_id IS NOT NULL OR project_id IS NOT NULL
    )
);

CREATE INDEX idx_comments_ticket ON comments(ticket_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user ON comments(user_id) WHERE deleted_at IS NULL;
```

---

## 3. API SPECIFICATION

### Base URL
`https://api.psa-platform.local/api/v1/tickets`

### Tickets Endpoints

#### GET /tickets
**Description:** List tickets with filtering and pagination

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page (default: 50, max: 100)
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `assigned_to` (uuid): Filter by assigned user
- `customer_id` (uuid): Filter by customer
- `search` (string): Full-text search
- `sla_breached` (boolean): Filter by SLA breach status
- `sort` (string): Sort field
- `order` (string): Sort order (asc/desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "ticket_number": 1042,
      "customer_id": "uuid-customer",
      "customer_name": "Acme Corp",
      "contact_id": "uuid-contact",
      "title": "Email server not responding",
      "description": "Users cannot access emails since 9:00 AM",
      "priority": "high",
      "status": "in_progress",
      "category": "email",
      "assigned_to": "uuid-tech",
      "assigned_to_name": "Max Mustermann",
      "sla_response_due": "2025-11-04T12:00:00Z",
      "sla_resolution_due": "2025-11-04T18:00:00Z",
      "sla_breached": false,
      "first_response_at": "2025-11-04T10:15:00Z",
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:30:00Z",
      "tags": ["urgent", "email"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 324,
    "pages": 7
  }
}
```

---

#### GET /tickets/:id
**Description:** Get single ticket with full details

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "ticket_number": 1042,
  "tenant_id": "uuid-tenant",
  "customer_id": "uuid-customer",
  "contact_id": "uuid-contact",
  "title": "Email server not responding",
  "description": "Users cannot access emails since 9:00 AM. Exchange server appears to be down.",
  "priority": "high",
  "status": "in_progress",
  "category": "email",
  "subcategory": "exchange",
  "assigned_to": "uuid-tech",
  "sla_id": "uuid-sla",
  "sla_response_due": "2025-11-04T12:00:00Z",
  "sla_resolution_due": "2025-11-04T18:00:00Z",
  "sla_breached": false,
  "first_response_at": "2025-11-04T10:15:00Z",
  "resolved_at": null,
  "closed_at": null,
  "custom_fields": {
    "server_name": "EXCH-01",
    "affected_users": 42
  },
  "tags": ["urgent", "email"],
  "created_at": "2025-11-04T10:00:00Z",
  "updated_at": "2025-11-04T10:30:00Z",
  "created_by": "uuid-user",
  
  "_embedded": {
    "customer": {
      "id": "uuid-customer",
      "name": "Acme Corp"
    },
    "contact": {
      "id": "uuid-contact",
      "first_name": "Anna",
      "last_name": "Schmidt",
      "email": "anna.schmidt@acme.de"
    },
    "assigned_to": {
      "id": "uuid-tech",
      "first_name": "Max",
      "last_name": "Mustermann"
    },
    "time_entries": [
      {
        "id": "uuid-te-1",
        "user_id": "uuid-tech",
        "hours": 1.5,
        "description": "Investigated Exchange server logs",
        "billing_rate": 95.00,
        "cost_rate": 55.00,
        "created_at": "2025-11-04T10:30:00Z"
      }
    ],
    "comments": [
      {
        "id": "uuid-comment-1",
        "user_id": "uuid-tech",
        "user_name": "Max Mustermann",
        "content": "Exchange service crashed. Restarting now.",
        "is_internal": true,
        "created_at": "2025-11-04T10:15:00Z"
      }
    ]
  }
}
```

---

#### POST /tickets
**Description:** Create new ticket

**Request:**
```json
{
  "customer_id": "uuid-customer",
  "contact_id": "uuid-contact",
  "title": "Printer not working",
  "description": "HP LaserJet 4000 in office 3.12 is offline",
  "priority": "medium",
  "category": "hardware",
  "subcategory": "printer",
  "tags": ["printer", "office-312"],
  "custom_fields": {
    "printer_model": "HP LaserJet 4000",
    "location": "Office 3.12"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new",
  "ticket_number": 1043,
  "status": "new",
  "sla_response_due": "2025-11-04T14:00:00Z",
  "sla_resolution_due": "2025-11-05T10:00:00Z",
  ...
}
```

**Business Logic:**
- Auto-generate ticket_number (sequential per tenant)
- Auto-assign SLA based on customer contract + priority
- Calculate SLA due dates
- Auto-assign to technician (optional)
- Create audit log entry
- Send email notification to contact
- Publish event to RabbitMQ

---

#### PUT /tickets/:id
**Description:** Update ticket

**Request:**
```json
{
  "status": "in_progress",
  "assigned_to": "uuid-tech",
  "priority": "high"
}
```

**Response (200 OK)**

**Business Logic:**
- Validate status transitions
- Update first_response_at if first assignment
- Check SLA breach on status change
- Create audit log entry
- Send notifications
- Publish event to RabbitMQ

---

#### POST /tickets/:id/resolve
**Description:** Mark ticket as resolved

**Request:**
```json
{
  "resolution_comment": "Exchange server restarted. Email flow restored.",
  "resolution_time_hours": 2.5
}
```

**Response (200 OK)**

**Business Logic:**
- Set status to 'resolved'
- Set resolved_at timestamp
- Create resolution comment
- Optionally create time entry
- Calculate SLA compliance
- Send resolution email to customer
- Update ticket statistics

---

#### POST /tickets/:id/close
**Description:** Close resolved ticket

**Request:**
```json
{
  "close_comment": "Customer confirmed issue is resolved."
}
```

**Response (200 OK)**

**Business Logic:**
- Validate ticket is resolved
- Set status to 'closed'
- Set closed_at timestamp
- Final SLA calculation
- Archive ticket data

---

### Time Entries Endpoints

#### GET /tickets/:ticketId/time-entries
**Description:** Get all time entries for a ticket

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-te-1",
      "ticket_id": "uuid-123",
      "user_id": "uuid-tech",
      "user_name": "Max Mustermann",
      "date": "2025-11-04",
      "hours": 2.5,
      "description": "Troubleshooting and fixing Exchange server",
      "work_type": "support",
      "billable": true,
      "billed": false,
      "billing_rate": 95.00,
      "cost_rate": 55.00,
      "created_at": "2025-11-04T12:00:00Z"
    }
  ],
  "summary": {
    "total_hours": 4.5,
    "billable_hours": 4.5,
    "total_revenue": 427.50,
    "total_cost": 247.50,
    "profit": 180.00,
    "margin_pct": 42.1
  }
}
```

---

#### POST /tickets/:ticketId/time-entries
**Description:** Create time entry for ticket

**Request:**
```json
{
  "date": "2025-11-04",
  "hours": 2.5,
  "description": "Investigated Exchange server logs and restarted service",
  "work_type": "support",
  "billable": true
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new-te",
  "billing_rate": 95.00,
  "cost_rate": 55.00,
  ...
}
```

**Business Logic:**
- Resolve billing_rate using rate resolution hierarchy:
  1. user_billing_rates (user + customer + contract + service_level + work_type)
  2. contracts.hourly_rate (contract default)
  3. users.default_billing_rate (user default)
  4. ERROR if no rate found
- Snapshot cost_rate from users.internal_cost_rate
- Create audit log entry
- Update ticket statistics

---

### Comments Endpoints

#### GET /tickets/:ticketId/comments
**Description:** Get all comments for ticket

**Query Parameters:**
- `include_internal` (boolean): Include internal comments (default: false for customers)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-comment-1",
      "ticket_id": "uuid-123",
      "user_id": "uuid-tech",
      "user_name": "Max Mustermann",
      "user_avatar": "https://...",
      "content": "Checked server logs. Found critical error in Exchange services.",
      "is_internal": true,
      "is_resolution": false,
      "attachments": [
        {
          "filename": "exchange_error.log",
          "url": "https://files.psa-platform.local/attachments/...",
          "size": 15420,
          "mime_type": "text/plain"
        }
      ],
      "created_at": "2025-11-04T10:15:00Z",
      "updated_at": "2025-11-04T10:15:00Z"
    }
  ]
}
```

---

#### POST /tickets/:ticketId/comments
**Description:** Add comment to ticket

**Request:**
```json
{
  "content": "Server has been restarted. Monitoring for stability.",
  "is_internal": true,
  "attachments": [
    {
      "filename": "screenshot.png",
      "data": "base64_encoded_content"
    }
  ]
}
```

**Response (201 Created)**

**Business Logic:**
- Upload attachments to file storage
- Create audit log entry
- Send email notification (if not internal)
- Update ticket.updated_at
- Update first_response_at if first customer-facing comment

---

## 4. BUSINESS LOGIC

### SLA Calculation

```typescript
interface SLA {
  id: string;
  name: string;
  response_time_hours: number;
  resolution_time_hours: number;
  business_hours_only: boolean;
}

function calculateSLADueDates(
  ticket: Ticket,
  sla: SLA
): { responseDue: Date; resolutionDue: Date } {
  const now = new Date();
  
  if (sla.business_hours_only) {
    // Business hours: Mon-Fri 8:00-18:00
    return {
      responseDue: addBusinessHours(now, sla.response_time_hours),
      resolutionDue: addBusinessHours(now, sla.resolution_time_hours)
    };
  } else {
    // 24/7 support
    return {
      responseDue: new Date(now.getTime() + sla.response_time_hours * 3600 * 1000),
      resolutionDue: new Date(now.getTime() + sla.resolution_time_hours * 3600 * 1000)
    };
  }
}

function addBusinessHours(startDate: Date, hours: number): Date {
  let remainingHours = hours;
  let currentDate = new Date(startDate);
  
  while (remainingHours > 0) {
    const dayOfWeek = currentDate.getDay();
    const hour = currentDate.getHours();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }
    
    // Skip non-business hours
    if (hour < 8) {
      currentDate.setHours(8, 0, 0, 0);
    } else if (hour >= 18) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }
    
    // Add hours
    const hoursToAdd = Math.min(remainingHours, 18 - hour);
    currentDate.setHours(currentDate.getHours() + hoursToAdd);
    remainingHours -= hoursToAdd;
  }
  
  return currentDate;
}
```

### Billing Rate Resolution

```typescript
async function resolveBillingRate(
  userId: string,
  customerId: string,
  contractId: string | null,
  workType: string
): Promise<{ billingRate: number; costRate: number }> {
  // Get user's internal cost rate
  const user = await db.users.findById(userId);
  const costRate = user.internal_cost_rate;
  
  // Try to find specific billing rate
  const userBillingRate = await db.query(`
    SELECT billing_rate
    FROM user_billing_rates
    WHERE user_id = $1
      AND (customer_id = $2 OR customer_id IS NULL)
      AND (contract_id = $3 OR contract_id IS NULL)
      AND (work_type = $4 OR work_type IS NULL)
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    ORDER BY
      (customer_id IS NOT NULL)::int DESC,
      (contract_id IS NOT NULL)::int DESC,
      (work_type IS NOT NULL)::int DESC
    LIMIT 1
  `, [userId, customerId, contractId, workType]);
  
  if (userBillingRate.rows.length > 0) {
    return {
      billingRate: userBillingRate.rows[0].billing_rate,
      costRate
    };
  }
  
  // Try contract default rate
  if (contractId) {
    const contract = await db.contracts.findById(contractId);
    if (contract && contract.hourly_rate) {
      return {
        billingRate: contract.hourly_rate,
        costRate
      };
    }
  }
  
  // Fall back to user's default billing rate
  if (user.default_billing_rate) {
    return {
      billingRate: user.default_billing_rate,
      costRate
    };
  }
  
  // No rate found - error
  throw new Error(`No billing rate found for user ${userId} and customer ${customerId}`);
}
```

### Auto-Assignment

```typescript
async function autoAssignTicket(ticketId: string, priority: string): Promise<string> {
  const result = await db.query(`
    SELECT u.id
    FROM users u
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as open_count
      FROM tickets
      WHERE status IN ('new', 'assigned', 'in_progress')
        AND deleted_at IS NULL
      GROUP BY assigned_to
    ) t ON t.assigned_to = u.id
    WHERE u.role IN ('technician_lead', 'technician_senior', 'technician', 'technician_junior')
      AND u.is_active = true
      AND u.deleted_at IS NULL
    ORDER BY COALESCE(t.open_count, 0) ASC, RANDOM()
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    throw new Error('No available technicians found');
  }
  
  const assignedTo = result.rows[0].id;
  
  await db.tickets.update(ticketId, {
    assigned_to: assignedTo,
    status: 'assigned'
  });
  
  return assignedTo;
}
```

### Status Workflow Validation

```typescript
const ALLOWED_TRANSITIONS = {
  'new': ['assigned', 'in_progress', 'cancelled'],
  'assigned': ['in_progress', 'waiting_customer', 'cancelled'],
  'in_progress': ['waiting_customer', 'waiting_vendor', 'resolved', 'cancelled'],
  'waiting_customer': ['in_progress', 'resolved', 'cancelled'],
  'waiting_vendor': ['in_progress', 'resolved', 'cancelled'],
  'resolved': ['closed', 'in_progress'], // Can reopen
  'closed': [], // Cannot transition from closed
  'cancelled': []
};

function validateStatusTransition(currentStatus: string, newStatus: string): void {
  if (!ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    );
  }
}
```

### Full-Text Search

```typescript
async function searchTickets(
  tenantId: string,
  searchQuery: string,
  options: SearchOptions
): Promise<SearchResult> {
  const sql = `
    SELECT
      t.*,
      c.name as customer_name,
      u.first_name || ' ' || u.last_name as assigned_to_name,
      ts_rank(t.search_vector, websearch_to_tsquery('german', $2)) as rank
    FROM tickets t
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.tenant_id = $1
      AND t.deleted_at IS NULL
      AND t.search_vector @@ websearch_to_tsquery('german', $2)
    ORDER BY rank DESC, t.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  
  const result = await db.query(sql, [
    tenantId,
    searchQuery,
    options.limit,
    options.offset
  ]);
  
  return {
    data: result.rows,
    total: result.rowCount
  };
}
```

---

## 5. TESTING REQUIREMENTS

### Unit Tests

```typescript
describe('SLA Calculation', () => {
  it('should calculate SLA due dates for 24/7 support', () => {
    const sla = {
      response_time_hours: 2,
      resolution_time_hours: 8,
      business_hours_only: false
    };
    
    const now = new Date('2025-11-04T10:00:00Z');
    const dueDates = calculateSLADueDates({ created_at: now }, sla);
    
    expect(dueDates.responseDue).toEqual(new Date('2025-11-04T12:00:00Z'));
    expect(dueDates.resolutionDue).toEqual(new Date('2025-11-04T18:00:00Z'));
  });
  
  it('should skip weekends for business hours SLA', () => {
    const sla = {
      response_time_hours: 4,
      resolution_time_hours: 24,
      business_hours_only: true
    };
    
    // Friday 16:00
    const now = new Date('2025-11-07T16:00:00Z');
    const dueDates = calculateSLADueDates({ created_at: now }, sla);
    
    // Should be Monday 12:00 (2 hours Friday + 2 hours Monday)
    expect(dueDates.responseDue.getDay()).toBe(1); // Monday
  });
});

describe('Billing Rate Resolution', () => {
  it('should use customer-specific rate when available', async () => {
    await createUserBillingRate({
      user_id: 'user-123',
      customer_id: 'customer-456',
      billing_rate: 120.00
    });
    
    const rates = await resolveBillingRate('user-123', 'customer-456', null, 'support');
    
    expect(rates.billingRate).toBe(120.00);
  });
  
  it('should fall back to user default rate', async () => {
    await createUser({
      id: 'user-123',
      default_billing_rate: 95.00
    });
    
    const rates = await resolveBillingRate('user-123', 'customer-789', null, 'support');
    
    expect(rates.billingRate).toBe(95.00);
  });
});
```

### Integration Tests

```typescript
describe('POST /api/v1/tickets', () => {
  it('should create ticket with auto-assigned SLA', async () => {
    const customer = await createCustomer({ tier: 'gold' });
    const contract = await createContract({
      customer_id: customer.id,
      sla_id: 'sla-gold'
    });
    
    const response = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: customer.id,
        title: 'Test ticket',
        priority: 'high'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.sla_id).toBe('sla-gold');
    expect(response.body.sla_response_due).toBeDefined();
  });
  
  it('should auto-assign ticket to available technician', async () => {
    const tech1 = await createUser({ role: 'technician' });
    const tech2 = await createUser({ role: 'technician' });
    
    // Tech1 has 5 open tickets, Tech2 has 2
    await createTickets(5, { assigned_to: tech1.id, status: 'in_progress' });
    await createTickets(2, { assigned_to: tech2.id, status: 'in_progress' });
    
    const response = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: 'customer-123',
        title: 'Auto-assign test',
        auto_assign: true
      });
    
    expect(response.body.assigned_to).toBe(tech2.id); // Should assign to tech with fewer tickets
  });
});
```

---

## 6. IMPLEMENTATION CHECKLIST

### Setup
- [ ] LXC container created
- [ ] Node.js 20 LTS installed
- [ ] TypeScript project initialized
- [ ] Database connection configured
- [ ] RabbitMQ connection configured

### Core Models
- [ ] Ticket model with all fields
- [ ] TimeEntry model
- [ ] Comment model
- [ ] Data validation schemas

### API Endpoints
- [ ] GET /tickets (list with filters)
- [ ] GET /tickets/:id
- [ ] POST /tickets
- [ ] PUT /tickets/:id
- [ ] DELETE /tickets/:id
- [ ] POST /tickets/:id/resolve
- [ ] POST /tickets/:id/close
- [ ] POST /tickets/:id/reopen
- [ ] GET /tickets/:id/time-entries
- [ ] POST /tickets/:id/time-entries
- [ ] GET /tickets/:id/comments
- [ ] POST /tickets/:id/comments

### Business Logic
- [ ] SLA calculation (24/7 and business hours)
- [ ] Billing rate resolution
- [ ] Auto-assignment algorithm
- [ ] Status workflow validation
- [ ] Full-text search
- [ ] Email notifications

### Event Publishing
- [ ] ticket.created event
- [ ] ticket.updated event
- [ ] ticket.assigned event
- [ ] ticket.resolved event
- [ ] ticket.sla_breached event

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests
- [ ] SLA calculation tests
- [ ] Billing rate resolution tests

---

## 7. DEFINITION OF DONE

- [ ] All endpoints implemented and tested
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] SLA calculation working correctly
- [ ] Billing rate resolution working
- [ ] Auto-assignment functional
- [ ] Email notifications working
- [ ] RabbitMQ events publishing
- [ ] API documentation complete (OpenAPI)
- [ ] Performance: Ticket list < 200ms (p95)
- [ ] Deployed to staging
- [ ] Manual QA completed

---

## 8. DEPENDENCIES & LIBRARIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "joi": "^17.11.0",
    "amqplib": "^0.10.3",
    "ioredis": "^5.3.2",
    "nodemailer": "^6.9.7",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.1"
  }
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://psa_app:password@psa-db-master:5432/psa_platform
REDIS_URL=redis://:password@psa-redis:6379
RABBITMQ_URL=amqp://psa_app:password@psa-rabbitmq:5672/psa-platform
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@psa-platform.local
SMTP_PASSWORD=smtp-password
NODE_ENV=production
PORT=3030
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 4 weeks (2 developers)
