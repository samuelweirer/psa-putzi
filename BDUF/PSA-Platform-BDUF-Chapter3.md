# Big Design Up Front (BDUF) - Kapitel 3
## PSA-Platform für Managed Service Provider

**Version:** 1.0  
**Datum:** November 2025  
**Kapitel:** 3 - Datenmodell & Datenbank-Design

---

## 3. DATENMODELL & DATENBANK-DESIGN

### 3.1 Vollständiges ER-Diagramm

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Customer    │1   N│   Contact    │     │   Location   │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ customer_id  │     │ customer_id  │
│ uid          │     │ first_name   │     │ address      │
│ tier         │     │ last_name    │     │ city         │
└──────┬───────┘     │ email        │     └──────────────┘
       │             │ is_primary   │
       │             └──────────────┘
       │1
       │
       │N
┌──────▼───────┐     ┌──────────────┐     ┌──────────────┐
│   Ticket     │N   1│     User     │     │   Comment    │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ ticket_number│     │ email        │     │ ticket_id    │
│ customer_id  │     │ role         │     │ user_id      │
│ assigned_to  │     │ hourly_rate  │     │ content      │
│ title        │     └──────────────┘     └──────────────┘
│ description  │
│ status       │
│ priority     │     ┌──────────────┐
└──────┬───────┘     │  TimeEntry   │
       │1            │──────────────│
       │             │ id (PK)      │
       │N            │ ticket_id    │
       └─────────────│ user_id      │
                     │ hours        │
                     │ billable     │
                     │ billed       │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Contract   │1   N│   Invoice    │     │InvoiceItem   │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ customer_id  │     │ contract_id  │     │ invoice_id   │
│ type         │     │ invoice_number│    │ description  │
│ start_date   │     │ amount       │     │ quantity     │
│ end_date     │     │ status       │     │ unit_price   │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐
│    Asset     │     │    License   │
│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │
│ customer_id  │     │ asset_id     │
│ name         │     │ license_key  │
│ type         │     │ valid_until  │
│ serial       │     │ quantity     │
│ purchase_date│     └──────────────┘
└──────────────┘
```

### 3.2 Kern-Tabellen (SQL)

**customers:**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    uid VARCHAR(20), -- Umsatzsteuer-ID
    tax_number VARCHAR(50),
    
    -- Classification
    industry VARCHAR(100),
    employee_count INTEGER,
    tier VARCHAR(20) CHECK (tier IN ('A', 'B', 'C')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'prospect', 'churned')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT customers_name_unique UNIQUE(name) 
        WHERE deleted_at IS NULL
);

CREATE INDEX idx_customers_status ON customers(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_uid ON customers(uid) 
    WHERE uid IS NOT NULL;
```

**tickets:**
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number SERIAL UNIQUE NOT NULL,
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    status VARCHAR(20) DEFAULT 'new' NOT NULL
        CHECK (status IN ('new', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' NOT NULL
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50),
    tags TEXT[],
    
    -- Source
    source VARCHAR(20) NOT NULL
        CHECK (source IN ('email', 'portal', 'phone', 'rmm_alert', 'api')),
    source_reference VARCHAR(200), -- E.g., email message-id
    
    -- SLA
    sla_response_due TIMESTAMP,
    sla_resolution_due TIMESTAMP,
    sla_breached BOOLEAN DEFAULT false,
    
    -- Lifecycle
    first_response_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('german', 
            coalesce(title, '') || ' ' || 
            coalesce(description, '') || ' ' ||
            coalesce(array_to_string(tags, ' '), '')
        )
    ) STORED
);

-- Indexes
CREATE INDEX idx_tickets_customer ON tickets(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to) 
    WHERE deleted_at IS NULL AND status NOT IN ('closed');
CREATE INDEX idx_tickets_status ON tickets(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX idx_tickets_search ON tickets USING GIN(search_vector);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_response_due, sla_resolution_due) 
    WHERE status NOT IN ('closed') AND deleted_at IS NULL;

-- Partial indexes for performance
CREATE INDEX idx_tickets_open ON tickets(customer_id, priority) 
    WHERE status IN ('new', 'assigned', 'in_progress') 
    AND deleted_at IS NULL;
```

**time_entries:**
```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations (either ticket or project)
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Content
    description TEXT,
    notes TEXT, -- Internal notes
    
    -- Time
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Billing
    billable BOOLEAN DEFAULT true NOT NULL,
    billed BOOLEAN DEFAULT false NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    hourly_rate DECIMAL(8,2), -- Snapshot of rate at time of entry
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT time_entry_reference CHECK (
        (ticket_id IS NOT NULL AND project_id IS NULL) OR
        (ticket_id IS NULL AND project_id IS NOT NULL)
    ),
    CONSTRAINT time_entry_hours_check CHECK (
        hours > 0 AND hours <= 24
    )
);

-- Indexes
CREATE INDEX idx_time_entries_ticket ON time_entries(ticket_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX idx_time_entries_unbilled ON time_entries(user_id, date) 
    WHERE billable = true AND billed = false;

-- Prevent overlapping time entries
CREATE UNIQUE INDEX idx_time_entries_no_overlap 
    ON time_entries(user_id, date, ticket_id, project_id) 
    WHERE ticket_id IS NOT NULL OR project_id IS NOT NULL;
```

**users:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if SSO only
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Role & Permissions
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'system_admin', 'tenant_admin', 'security_admin',
        'service_manager', 
        'technician_l3', 'technician_l2', 'technician_l1',
        'account_manager', 'project_manager', 'billing_manager',
        'customer_admin', 'customer_technician', 'customer_user'
    )),
    permissions JSONB, -- Additional granular permissions
    
    -- Settings
    hourly_rate DECIMAL(8,2),
    language VARCHAR(5) DEFAULT 'de',
    timezone VARCHAR(50) DEFAULT 'Europe/Vienna',
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT false NOT NULL,
    mfa_secret VARCHAR(100),
    mfa_recovery_codes TEXT[],
    
    -- SSO
    sso_provider VARCHAR(50), -- 'azure_ad', 'google', etc.
    sso_identifier VARCHAR(200),
    
    -- Security
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(lower(email)) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_sso ON users(sso_provider, sso_identifier) 
    WHERE sso_provider IS NOT NULL;
```

**audit_log:**
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    
    -- Who
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(200),
    user_role VARCHAR(50),
    
    -- Changes
    changes JSONB, -- { "old": {...}, "new": {...} }
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- When
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE audit_log_y2025m11 PARTITION OF audit_log
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_log_y2025m12 PARTITION OF audit_log
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes on partitions
CREATE INDEX idx_audit_entity_2025m11 ON audit_log_y2025m11(entity_type, entity_id);
CREATE INDEX idx_audit_user_2025m11 ON audit_log_y2025m11(user_id);
CREATE INDEX idx_audit_created_2025m11 ON audit_log_y2025m11(created_at);
```

### 3.3 Datenbank-Optimierungen

**Materialized Views:**
```sql
-- Customer Statistics
CREATE MATERIALIZED VIEW mv_customer_stats AS
SELECT 
    c.id AS customer_id,
    c.name,
    COUNT(DISTINCT t.id) AS total_tickets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('new', 'assigned', 'in_progress')) AS open_tickets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.sla_breached = true) AS sla_breached_tickets,
    AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600) 
        FILTER (WHERE t.resolved_at IS NOT NULL) AS avg_resolution_hours,
    SUM(te.hours) FILTER (WHERE te.date >= NOW() - INTERVAL '30 days') AS hours_last_30_days,
    SUM(te.hours * te.hourly_rate) FILTER (WHERE te.date >= NOW() - INTERVAL '30 days') AS revenue_last_30_days
FROM customers c
LEFT JOIN tickets t ON t.customer_id = c.id
LEFT JOIN time_entries te ON te.ticket_id = t.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name;

CREATE UNIQUE INDEX ON mv_customer_stats(customer_id);

-- Refresh schedule (via cron or pg_cron)
SELECT cron.schedule('refresh-customer-stats', '0 1 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_stats');
```

**Query-Optimization:**
```sql
-- Explain Analyze Example
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT 
    t.*,
    c.name as customer_name,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM tickets t
LEFT JOIN customers c ON c.id = t.customer_id
LEFT JOIN users u ON u.id = t.assigned_to
WHERE t.status = 'open'
  AND t.priority = 'high'
ORDER BY t.created_at DESC
LIMIT 20;

-- Results should show:
-- - Index Scan on idx_tickets_open
-- - Nested Loop Join
-- - Execution Time < 10ms
```

**Stored Procedures:**
```sql
-- Auto-assign ticket based on technician availability
CREATE OR REPLACE FUNCTION auto_assign_ticket(
    p_ticket_id UUID,
    p_priority VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_assigned_to UUID;
    v_min_open_tickets INTEGER;
BEGIN
    -- Find technician with least open tickets and matching skills
    SELECT u.id INTO v_assigned_to
    FROM users u
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as open_count
        FROM tickets
        WHERE status IN ('new', 'assigned', 'in_progress')
          AND deleted_at IS NULL
        GROUP BY assigned_to
    ) t ON t.assigned_to = u.id
    WHERE u.role LIKE 'technician_%'
      AND u.is_active = true
      AND u.deleted_at IS NULL
    ORDER BY COALESCE(t.open_count, 0) ASC, RANDOM()
    LIMIT 1;
    
    -- Update ticket
    UPDATE tickets
    SET assigned_to = v_assigned_to,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN v_assigned_to;
END;
$$ LANGUAGE plpgsql;
```

**Triggers:**
```sql
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validate SLA dates
CREATE OR REPLACE FUNCTION validate_sla_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_response_due IS NOT NULL 
       AND NEW.sla_resolution_due IS NOT NULL 
       AND NEW.sla_response_due > NEW.sla_resolution_due THEN
        RAISE EXCEPTION 'Response due date must be before resolution due date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ticket_sla
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION validate_sla_dates();
```

**Full-Text Search:**
```sql
-- Search tickets
CREATE OR REPLACE FUNCTION search_tickets(
    p_search_query TEXT,
    p_customer_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    ticket_id UUID,
    ticket_number INTEGER,
    title VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.ticket_number,
        t.title,
        ts_rank(t.search_vector, websearch_to_tsquery('german', p_search_query)) as rank
    FROM tickets t
    WHERE t.search_vector @@ websearch_to_tsquery('german', p_search_query)
      AND (p_customer_id IS NULL OR t.customer_id = p_customer_id)
      AND t.deleted_at IS NULL
    ORDER BY rank DESC, t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM search_tickets('netzwerk drucker problem');
```

### 3.4 Erweiterte Tabellen

**contacts:**
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Position
    title VARCHAR(100), -- Job title
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_technical BOOLEAN DEFAULT false,
    is_billing BOOLEAN DEFAULT false,
    
    -- Notifications
    notify_ticket_created BOOLEAN DEFAULT true,
    notify_ticket_resolved BOOLEAN DEFAULT true,
    notify_invoice BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT contacts_email_format CHECK (
        email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
);

CREATE INDEX idx_contacts_customer ON contacts(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(lower(email)) 
    WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_primary ON contacts(customer_id, is_primary) 
    WHERE is_primary = true AND deleted_at IS NULL;
```

**contracts:**
```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Contract Details
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Type
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'managed_services',
        'project',
        'retainer',
        'time_and_material',
        'fixed_price'
    )),
    
    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    renewal_period VARCHAR(20) CHECK (renewal_period IN ('monthly', 'quarterly', 'yearly')),
    notice_period_days INTEGER,
    
    -- Billing
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    monthly_value DECIMAL(10,2),
    included_hours INTEGER, -- For retainer contracts
    hourly_rate DECIMAL(8,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'expired', 'terminated', 'cancelled'
    )),
    
    -- Documents
    signed_document_url VARCHAR(500),
    signed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contracts_customer ON contracts(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
```

**invoices:**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Invoice Details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- Austria default
    tax_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'paid', 'overdue', 'cancelled', 'credited'
    )),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Export
    exported_to_erp BOOLEAN DEFAULT false,
    exported_at TIMESTAMP,
    export_reference VARCHAR(100), -- DATEV/BMD reference
    
    -- Documents
    pdf_url VARCHAR(500),
    zugferd_xml TEXT, -- ZUGFeRD 2.1 XML
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT invoice_due_after_invoice CHECK (due_date >= invoice_date),
    CONSTRAINT invoice_total_correct CHECK (
        total = subtotal + tax_amount
    )
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_dates ON invoices(invoice_date DESC, due_date);
CREATE INDEX idx_invoices_overdue ON invoices(due_date) 
    WHERE status IN ('sent', 'overdue') AND deleted_at IS NULL;
```

**projects:**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Project Details
    project_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    estimated_hours DECIMAL(8,2),
    
    -- Budget
    budget DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN (
        'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
    )),
    health VARCHAR(20) CHECK (health IN ('green', 'yellow', 'red')),
    
    -- Progress
    completion_percentage INTEGER DEFAULT 0 CHECK (
        completion_percentage >= 0 AND completion_percentage <= 100
    ),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_customer ON projects(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_manager ON projects(project_manager_id) 
    WHERE deleted_at IS NULL;
```

**assets:**
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    assigned_to_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Asset Details
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN (
        'server', 'workstation', 'laptop', 'printer', 
        'network_device', 'mobile', 'software', 'other'
    )),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Purchase
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    supplier VARCHAR(200),
    
    -- Warranty
    warranty_expires DATE,
    warranty_type VARCHAR(50),
    
    -- Lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'maintenance', 'retired', 'disposed'
    )),
    eol_date DATE, -- End of Life
    
    -- Technical
    ip_address INET,
    mac_address MACADDR,
    hostname VARCHAR(200),
    operating_system VARCHAR(100),
    
    -- RMM Integration
    rmm_id VARCHAR(100), -- ID in RMM system
    rmm_last_seen TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_assets_customer ON assets(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON assets(asset_type) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warranty ON assets(warranty_expires) 
    WHERE warranty_expires IS NOT NULL AND status = 'active';
CREATE INDEX idx_assets_rmm ON assets(rmm_id) 
    WHERE rmm_id IS NOT NULL;
```

---

**ENDE KAPITEL 3**

*Dieses Kapitel beschreibt das vollständige Datenmodell der PSA-Platform inkl. ER-Diagramm, Tabellendefinitionen, Indizes, Constraints, Stored Procedures, Triggers und Query-Optimierungen.*

**Fortsetzung in:**
- PSA-Platform-BDUF-Part2.md (Kapitel 4-9)
- PSA-Platform-BDUF-Part3.md (Kapitel 10-15)
