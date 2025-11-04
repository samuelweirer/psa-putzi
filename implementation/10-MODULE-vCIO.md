# Module Implementation Guide: vCIO (Virtual CIO)

**Module ID:** VCIO-001
**Phase:** Phase 3 - Advanced Features
**Priority:** P2 - Important
**Estimated Duration:** 4-6 weeks
**Dependencies:** CRM-001 (CRM Module), REPORTS-001 (Reports Module)

---

## Overview

### Purpose
The vCIO (Virtual Chief Information Officer) module provides MSPs with tools to deliver strategic IT consulting services to their customers. It enables structured quarterly business reviews (QBRs), technology roadmap planning, budget forecasting, and strategic recommendations.

### Key Features
- **Quarterly Business Reviews (QBR)** - Structured review meetings with customers
- **Technology Roadmap** - Visual technology planning and lifecycle management
- **Budget Forecasting** - Multi-year IT budget planning and forecasting
- **Strategic Recommendations** - Track technology recommendations and their status
- **vCIO Dashboard** - Executive-level customer health and technology metrics
- **Meeting Notes & Action Items** - Structured vCIO meeting documentation
- **Technology Stack Analysis** - Assess current technology environment
- **Risk Assessment** - Identify and track technology risks
- **Executive Reports** - Board-ready reports and presentations

### Business Value
- **For MSPs:**
  - Differentiate with high-value strategic services
  - Increase customer retention through strategic relationships
  - Justify higher billing rates for vCIO services
  - Identify upsell and cross-sell opportunities
  - Demonstrate ROI and business value to customers

- **For Customers:**
  - Get strategic IT guidance without full-time CIO
  - Align technology investments with business goals
  - Proactive planning reduces surprises and downtime
  - Executive-level visibility into IT landscape
  - Clear technology roadmap and budget forecasting

---

## Database Schema

### Tables from BDUF Chapter 3

```sql
-- QBR Management
CREATE TABLE qbr_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    fiscal_quarter VARCHAR(10), -- e.g., 'Q1 2025'
    status VARCHAR(50) NOT NULL, -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    location VARCHAR(255),
    attendees_customer JSONB, -- [{name, role, email}]
    attendees_msp JSONB, -- [{user_id, name, role}]
    agenda JSONB, -- [{topic, duration_minutes, presenter}]
    objectives TEXT,
    notes TEXT,
    next_steps TEXT,
    next_qbr_date DATE,
    presentation_url VARCHAR(500), -- Link to PowerPoint/PDF
    recording_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Technology Roadmap Items
CREATE TABLE technology_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    qbr_meeting_id UUID REFERENCES qbr_meetings(id), -- Link to QBR where discussed
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'infrastructure', 'security', 'applications', 'network', 'cloud', 'compliance'
    priority VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    status VARCHAR(50) NOT NULL, -- 'proposed', 'approved', 'in_progress', 'completed', 'cancelled', 'deferred'
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    estimated_hours INTEGER,
    actual_hours INTEGER,
    target_quarter VARCHAR(10), -- e.g., 'Q3 2025'
    target_date DATE,
    completion_date DATE,
    business_justification TEXT,
    risk_if_not_done TEXT,
    roi_analysis TEXT,
    dependencies JSONB, -- [{roadmap_item_id, description}]
    assigned_to UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id), -- Link to project if created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Strategic Recommendations
CREATE TABLE vcio_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    qbr_meeting_id UUID REFERENCES qbr_meetings(id),
    roadmap_item_id UUID REFERENCES technology_roadmap(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL, -- 'security', 'compliance', 'efficiency', 'cost_reduction', 'growth', 'risk_mitigation'
    priority VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    status VARCHAR(50) NOT NULL, -- 'proposed', 'accepted', 'rejected', 'deferred', 'implemented'
    implementation_timeline VARCHAR(100), -- 'immediate', '1-3 months', '3-6 months', '6-12 months', '1+ years'
    estimated_cost DECIMAL(15,2),
    estimated_savings DECIMAL(15,2), -- Annual savings if cost reduction
    estimated_roi_percent DECIMAL(5,2),
    business_impact TEXT,
    technical_details TEXT,
    risks TEXT,
    customer_response TEXT,
    customer_response_date DATE,
    implemented_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Budget Forecasting
CREATE TABLE vcio_budget_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    fiscal_year INTEGER NOT NULL, -- e.g., 2025
    fiscal_quarter VARCHAR(10), -- e.g., 'Q1', 'Q2' or NULL for annual
    category VARCHAR(100) NOT NULL, -- 'hardware', 'software', 'cloud', 'support', 'projects', 'security', 'network'
    subcategory VARCHAR(100),
    description TEXT,
    forecast_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2),
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - forecast_amount) STORED,
    variance_percent DECIMAL(5,2),
    notes TEXT,
    roadmap_item_id UUID REFERENCES technology_roadmap(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, customer_id, fiscal_year, fiscal_quarter, category, subcategory)
);

-- Technology Stack Inventory
CREATE TABLE technology_stack (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    category VARCHAR(100) NOT NULL, -- 'server', 'network', 'security', 'cloud', 'application', 'backup'
    subcategory VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    version VARCHAR(100),
    license_type VARCHAR(100), -- 'perpetual', 'subscription', 'open_source'
    license_count INTEGER,
    annual_cost DECIMAL(15,2),
    eol_date DATE, -- End of life
    eos_date DATE, -- End of support
    risk_level VARCHAR(50), -- 'critical', 'high', 'medium', 'low', 'none'
    health_status VARCHAR(50), -- 'healthy', 'at_risk', 'critical', 'deprecated'
    notes TEXT,
    asset_id UUID REFERENCES assets(id), -- Link to asset if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Risk Register
CREATE TABLE vcio_risk_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    qbr_meeting_id UUID REFERENCES qbr_meetings(id),
    risk_title VARCHAR(255) NOT NULL,
    risk_description TEXT,
    category VARCHAR(100) NOT NULL, -- 'security', 'compliance', 'availability', 'data_loss', 'cost', 'vendor', 'skills'
    probability VARCHAR(50) NOT NULL, -- 'very_low', 'low', 'medium', 'high', 'very_high'
    impact VARCHAR(50) NOT NULL, -- 'very_low', 'low', 'medium', 'high', 'very_high'
    risk_score INTEGER, -- 1-25 (probability * impact)
    status VARCHAR(50) NOT NULL, -- 'identified', 'assessing', 'mitigating', 'accepted', 'resolved'
    mitigation_strategy TEXT,
    mitigation_cost DECIMAL(15,2),
    mitigation_timeline VARCHAR(100),
    residual_risk VARCHAR(50), -- After mitigation
    owner_user_id UUID REFERENCES users(id),
    identified_date DATE NOT NULL,
    target_resolution_date DATE,
    resolved_date DATE,
    roadmap_item_id UUID REFERENCES technology_roadmap(id), -- Link to mitigation project
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Meeting Action Items
CREATE TABLE qbr_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    qbr_meeting_id UUID NOT NULL REFERENCES qbr_meetings(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_to_contact_id UUID REFERENCES contacts(id), -- If assigned to customer contact
    due_date DATE,
    status VARCHAR(50) NOT NULL, -- 'open', 'in_progress', 'completed', 'blocked', 'cancelled'
    priority VARCHAR(50), -- 'high', 'medium', 'low'
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_qbr_meetings_customer ON qbr_meetings(customer_id, meeting_date DESC);
CREATE INDEX idx_qbr_meetings_status ON qbr_meetings(tenant_id, status);
CREATE INDEX idx_technology_roadmap_customer ON technology_roadmap(customer_id, target_date);
CREATE INDEX idx_technology_roadmap_status ON technology_roadmap(tenant_id, status);
CREATE INDEX idx_vcio_recommendations_customer ON vcio_recommendations(customer_id, status);
CREATE INDEX idx_vcio_budget_customer_year ON vcio_budget_forecast(customer_id, fiscal_year, fiscal_quarter);
CREATE INDEX idx_technology_stack_customer ON technology_stack(customer_id, category);
CREATE INDEX idx_vcio_risk_customer ON vcio_risk_register(customer_id, status, risk_score DESC);
CREATE INDEX idx_qbr_action_items_meeting ON qbr_action_items(qbr_meeting_id, status);

-- RLS Policies (Row-Level Security)
ALTER TABLE qbr_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcio_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcio_budget_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcio_risk_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbr_action_items ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their tenant's data
CREATE POLICY qbr_meetings_tenant_isolation ON qbr_meetings USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY technology_roadmap_tenant_isolation ON technology_roadmap USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY vcio_recommendations_tenant_isolation ON vcio_recommendations USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY vcio_budget_forecast_tenant_isolation ON vcio_budget_forecast USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY technology_stack_tenant_isolation ON technology_stack USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY vcio_risk_register_tenant_isolation ON vcio_risk_register USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY qbr_action_items_tenant_isolation ON qbr_action_items USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## API Specifications

### Base URL
```
/api/v1/vcio
```

### Authentication
All endpoints require JWT authentication with appropriate RBAC permissions.

**Required Permissions:**
- `vcio.qbr.read` - View QBRs
- `vcio.qbr.write` - Create/edit QBRs
- `vcio.roadmap.read` - View roadmaps
- `vcio.roadmap.write` - Create/edit roadmaps
- `vcio.recommendations.read` - View recommendations
- `vcio.recommendations.write` - Create/edit recommendations
- `vcio.budget.read` - View budgets
- `vcio.budget.write` - Create/edit budgets
- `vcio.risk.read` - View risks
- `vcio.risk.write` - Create/edit risks

---

### QBR Management

#### 1. Create QBR Meeting
```http
POST /api/v1/vcio/qbr
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "title": "Q1 2025 Quarterly Business Review",
  "meeting_date": "2025-03-15",
  "fiscal_quarter": "Q1 2025",
  "location": "Customer Office - Conference Room A",
  "attendees_customer": [
    {"name": "John Smith", "role": "CEO", "email": "john@customer.com"},
    {"name": "Jane Doe", "role": "CFO", "email": "jane@customer.com"}
  ],
  "attendees_msp": [
    {"user_id": "uuid", "name": "Bob Johnson", "role": "vCIO"}
  ],
  "agenda": [
    {"topic": "Review Q4 2024 Performance", "duration_minutes": 15, "presenter": "Bob Johnson"},
    {"topic": "Technology Roadmap Updates", "duration_minutes": 20, "presenter": "Bob Johnson"},
    {"topic": "Budget Forecast Review", "duration_minutes": 15, "presenter": "Bob Johnson"},
    {"topic": "Security Posture Assessment", "duration_minutes": 20, "presenter": "Bob Johnson"},
    {"topic": "Q&A and Next Steps", "duration_minutes": 10, "presenter": "All"}
  ],
  "objectives": "Review technology health, align on roadmap priorities, and approve Q1 budget."
}

Response 201:
{
  "id": "uuid",
  "customer_id": "uuid",
  "title": "Q1 2025 Quarterly Business Review",
  "meeting_date": "2025-03-15",
  "status": "scheduled",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 2. Get QBR Meeting Details
```http
GET /api/v1/vcio/qbr/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "customer_id": "uuid",
  "customer_name": "Acme Corp",
  "title": "Q1 2025 Quarterly Business Review",
  "meeting_date": "2025-03-15",
  "fiscal_quarter": "Q1 2025",
  "status": "completed",
  "location": "Customer Office - Conference Room A",
  "attendees_customer": [...],
  "attendees_msp": [...],
  "agenda": [...],
  "objectives": "...",
  "notes": "Meeting went well. Customer approved all roadmap items.",
  "next_steps": "1. Implement MFA rollout\n2. Schedule security audit\n3. Begin server refresh planning",
  "next_qbr_date": "2025-06-15",
  "presentation_url": "https://...",
  "recording_url": "https://...",
  "action_items": [
    {
      "id": "uuid",
      "title": "Implement MFA for all users",
      "assigned_to": "Bob Johnson",
      "due_date": "2025-04-01",
      "status": "open"
    }
  ],
  "related_roadmap_items": [...],
  "related_recommendations": [...],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-03-15T14:30:00Z"
}
```

#### 3. List QBRs (with filters)
```http
GET /api/v1/vcio/qbr?customer_id=uuid&status=completed&year=2025
Authorization: Bearer <token>

Response 200:
{
  "qbrs": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "customer_name": "Acme Corp",
      "title": "Q1 2025 QBR",
      "meeting_date": "2025-03-15",
      "fiscal_quarter": "Q1 2025",
      "status": "completed",
      "action_items_total": 5,
      "action_items_completed": 3
    }
  ],
  "pagination": {...}
}
```

#### 4. Update QBR Meeting
```http
PATCH /api/v1/vcio/qbr/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "notes": "Detailed meeting notes...",
  "next_steps": "1. ...\n2. ...",
  "next_qbr_date": "2025-06-15",
  "presentation_url": "https://..."
}

Response 200:
{
  "id": "uuid",
  "status": "completed",
  "updated_at": "2025-03-15T14:30:00Z"
}
```

---

### Technology Roadmap

#### 5. Create Roadmap Item
```http
POST /api/v1/vcio/roadmap
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "qbr_meeting_id": "uuid",
  "title": "Server Infrastructure Refresh",
  "description": "Replace aging physical servers with modern virtualized infrastructure",
  "category": "infrastructure",
  "priority": "high",
  "status": "approved",
  "estimated_cost": 45000.00,
  "estimated_hours": 120,
  "target_quarter": "Q3 2025",
  "target_date": "2025-09-30",
  "business_justification": "Current servers are out of warranty and at risk of failure. Virtualization will improve uptime and reduce costs.",
  "risk_if_not_done": "High risk of unplanned downtime and data loss due to hardware failure.",
  "roi_analysis": "Expected 30% reduction in infrastructure costs annually. Payback period: 18 months.",
  "dependencies": [
    {"description": "Network upgrade must be completed first"}
  ],
  "assigned_to": "uuid"
}

Response 201:
{
  "id": "uuid",
  "customer_id": "uuid",
  "title": "Server Infrastructure Refresh",
  "status": "approved",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 6. Get Roadmap for Customer
```http
GET /api/v1/vcio/roadmap?customer_id=uuid&status=approved,in_progress
Authorization: Bearer <token>

Response 200:
{
  "roadmap_items": [
    {
      "id": "uuid",
      "title": "Server Infrastructure Refresh",
      "category": "infrastructure",
      "priority": "high",
      "status": "in_progress",
      "estimated_cost": 45000.00,
      "target_quarter": "Q3 2025",
      "target_date": "2025-09-30",
      "progress_percent": 25,
      "assigned_to": "Bob Johnson",
      "project_id": "uuid"
    }
  ],
  "summary": {
    "total_items": 12,
    "by_status": {
      "proposed": 3,
      "approved": 4,
      "in_progress": 3,
      "completed": 2
    },
    "total_estimated_cost": 245000.00,
    "total_actual_cost": 87000.00
  }
}
```

#### 7. Update Roadmap Item
```http
PATCH /api/v1/vcio/roadmap/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "in_progress",
  "project_id": "uuid",
  "actual_cost": 12000.00,
  "actual_hours": 32
}

Response 200:
{
  "id": "uuid",
  "status": "in_progress",
  "updated_at": "2025-03-20T10:00:00Z"
}
```

---

### Recommendations

#### 8. Create Recommendation
```http
POST /api/v1/vcio/recommendations
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "qbr_meeting_id": "uuid",
  "title": "Implement Multi-Factor Authentication",
  "description": "Deploy MFA solution for all user accounts to enhance security posture",
  "type": "security",
  "priority": "critical",
  "status": "proposed",
  "implementation_timeline": "1-3 months",
  "estimated_cost": 8000.00,
  "business_impact": "Significantly reduce risk of account compromise and data breach",
  "technical_details": "Deploy Microsoft Entra ID MFA or Duo Security. Requires user training and phased rollout.",
  "risks": "Low - some user resistance expected during initial rollout"
}

Response 201:
{
  "id": "uuid",
  "customer_id": "uuid",
  "title": "Implement Multi-Factor Authentication",
  "status": "proposed",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 9. Get Recommendations for Customer
```http
GET /api/v1/vcio/recommendations?customer_id=uuid&status=proposed,accepted
Authorization: Bearer <token>

Response 200:
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Implement Multi-Factor Authentication",
      "type": "security",
      "priority": "critical",
      "status": "accepted",
      "estimated_cost": 8000.00,
      "estimated_roi_percent": 250.00,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "summary": {
    "total": 15,
    "by_status": {
      "proposed": 5,
      "accepted": 7,
      "implemented": 3
    },
    "total_estimated_cost": 125000.00
  }
}
```

---

### Budget Forecasting

#### 10. Create/Update Budget Forecast
```http
POST /api/v1/vcio/budget
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "fiscal_year": 2025,
  "forecasts": [
    {
      "category": "hardware",
      "subcategory": "servers",
      "description": "Server infrastructure refresh",
      "forecast_amount": 45000.00,
      "fiscal_quarter": "Q3"
    },
    {
      "category": "software",
      "subcategory": "microsoft365",
      "description": "Microsoft 365 licenses",
      "forecast_amount": 24000.00,
      "fiscal_quarter": null
    },
    {
      "category": "security",
      "subcategory": "mfa",
      "description": "MFA solution implementation",
      "forecast_amount": 8000.00,
      "fiscal_quarter": "Q2"
    }
  ]
}

Response 201:
{
  "customer_id": "uuid",
  "fiscal_year": 2025,
  "total_forecast": 77000.00,
  "forecasts_created": 3
}
```

#### 11. Get Budget Forecast
```http
GET /api/v1/vcio/budget?customer_id=uuid&fiscal_year=2025
Authorization: Bearer <token>

Response 200:
{
  "customer_id": "uuid",
  "customer_name": "Acme Corp",
  "fiscal_year": 2025,
  "forecasts": [
    {
      "id": "uuid",
      "category": "hardware",
      "subcategory": "servers",
      "fiscal_quarter": "Q3",
      "forecast_amount": 45000.00,
      "actual_amount": 47500.00,
      "variance_amount": 2500.00,
      "variance_percent": 5.56
    }
  ],
  "summary": {
    "total_forecast": 245000.00,
    "total_actual": 187500.00,
    "total_variance": -57500.00,
    "variance_percent": -23.47,
    "by_category": {
      "hardware": {"forecast": 95000.00, "actual": 78000.00},
      "software": {"forecast": 68000.00, "actual": 65000.00},
      "security": {"forecast": 42000.00, "actual": 44500.00},
      "cloud": {"forecast": 40000.00, "actual": 0.00}
    }
  }
}
```

---

### Risk Register

#### 12. Create Risk
```http
POST /api/v1/vcio/risks
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "risk_title": "Aging firewall reaching end-of-life",
  "risk_description": "Current firewall will reach end-of-support in Q3 2025. No security updates after that date.",
  "category": "security",
  "probability": "high",
  "impact": "high",
  "mitigation_strategy": "Budget and plan for firewall replacement in Q2 2025",
  "mitigation_cost": 15000.00,
  "mitigation_timeline": "3-6 months",
  "owner_user_id": "uuid",
  "identified_date": "2025-01-15",
  "target_resolution_date": "2025-06-30"
}

Response 201:
{
  "id": "uuid",
  "customer_id": "uuid",
  "risk_title": "Aging firewall reaching end-of-life",
  "risk_score": 16,
  "status": "identified",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### 13. Get Risk Register
```http
GET /api/v1/vcio/risks?customer_id=uuid&status=identified,assessing,mitigating
Authorization: Bearer <token>

Response 200:
{
  "risks": [
    {
      "id": "uuid",
      "risk_title": "Aging firewall reaching end-of-life",
      "category": "security",
      "probability": "high",
      "impact": "high",
      "risk_score": 16,
      "status": "mitigating",
      "owner": "Bob Johnson",
      "target_resolution_date": "2025-06-30"
    }
  ],
  "summary": {
    "total_risks": 8,
    "by_status": {
      "identified": 2,
      "assessing": 1,
      "mitigating": 4,
      "resolved": 1
    },
    "average_risk_score": 12.5,
    "critical_risks": 3
  }
}
```

---

### Technology Stack Analysis

#### 14. Get Technology Stack
```http
GET /api/v1/vcio/technology-stack?customer_id=uuid
Authorization: Bearer <token>

Response 200:
{
  "customer_id": "uuid",
  "customer_name": "Acme Corp",
  "stack_items": [
    {
      "id": "uuid",
      "category": "server",
      "name": "VMware ESXi",
      "version": "8.0",
      "vendor": "VMware",
      "eol_date": "2028-10-15",
      "eos_date": "2031-10-15",
      "health_status": "healthy",
      "risk_level": "low",
      "annual_cost": 12000.00
    },
    {
      "id": "uuid",
      "category": "security",
      "name": "Fortigate Firewall",
      "version": "6.4.8",
      "vendor": "Fortinet",
      "eol_date": "2025-09-30",
      "eos_date": "2025-09-30",
      "health_status": "at_risk",
      "risk_level": "high",
      "annual_cost": 4500.00
    }
  ],
  "summary": {
    "total_items": 47,
    "by_health": {
      "healthy": 32,
      "at_risk": 12,
      "critical": 3
    },
    "total_annual_cost": 87500.00,
    "items_near_eol": 8
  }
}
```

---

### vCIO Dashboard & Reports

#### 15. Get vCIO Dashboard
```http
GET /api/v1/vcio/dashboard?customer_id=uuid
Authorization: Bearer <token>

Response 200:
{
  "customer_id": "uuid",
  "customer_name": "Acme Corp",
  "last_qbr": {
    "date": "2024-12-15",
    "title": "Q4 2024 QBR",
    "status": "completed"
  },
  "next_qbr": {
    "date": "2025-03-15",
    "title": "Q1 2025 QBR",
    "status": "scheduled"
  },
  "roadmap_summary": {
    "total_items": 12,
    "in_progress": 4,
    "completed_this_quarter": 2,
    "total_budget": 245000.00,
    "spent_ytd": 87500.00
  },
  "recommendations": {
    "total": 15,
    "pending_customer_response": 3,
    "accepted_not_implemented": 5,
    "implemented_this_quarter": 2
  },
  "risk_summary": {
    "total_risks": 8,
    "critical": 2,
    "high": 3,
    "average_score": 12.5
  },
  "technology_health": {
    "total_systems": 47,
    "healthy": 32,
    "at_risk": 12,
    "critical": 3,
    "near_eol": 8
  },
  "action_items": {
    "total": 15,
    "overdue": 2,
    "due_this_week": 4,
    "completed_this_month": 8
  }
}
```

#### 16. Generate Executive Report
```http
POST /api/v1/vcio/reports/executive
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": "uuid",
  "report_type": "qbr_summary",
  "qbr_meeting_id": "uuid",
  "format": "pdf",
  "include_sections": [
    "executive_summary",
    "performance_metrics",
    "roadmap_status",
    "budget_forecast",
    "risk_assessment",
    "recommendations"
  ]
}

Response 202:
{
  "report_id": "uuid",
  "status": "generating",
  "estimated_completion": "2025-03-15T10:05:00Z",
  "download_url": null
}

# Later: GET /api/v1/vcio/reports/:report_id
Response 200:
{
  "report_id": "uuid",
  "status": "completed",
  "download_url": "https://cdn.psa-platform.com/reports/exec-report-uuid.pdf",
  "expires_at": "2025-03-22T10:00:00Z"
}
```

---

## Business Logic Implementation

### Risk Score Calculation
```typescript
// src/services/vcio/risk-calculator.ts

enum RiskProbability {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

enum RiskImpact {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

interface RiskCalculation {
  risk_score: number; // 1-25
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
}

export function calculateRiskScore(
  probability: string,
  impact: string
): RiskCalculation {
  const probValue = RiskProbability[probability.toUpperCase() as keyof typeof RiskProbability];
  const impactValue = RiskImpact[impact.toUpperCase() as keyof typeof RiskImpact];

  const score = probValue * impactValue;

  let risk_level: 'low' | 'medium' | 'high' | 'critical';
  let color: string;

  if (score <= 4) {
    risk_level = 'low';
    color = '#4CAF50'; // green
  } else if (score <= 10) {
    risk_level = 'medium';
    color = '#FFC107'; // yellow
  } else if (score <= 16) {
    risk_level = 'high';
    color = '#FF9800'; // orange
  } else {
    risk_level = 'critical';
    color = '#F44336'; // red
  }

  return { risk_score: score, risk_level, color };
}
```

### Technology Health Assessment
```typescript
// src/services/vcio/technology-health.ts

interface TechnologyHealthAssessment {
  health_status: 'healthy' | 'at_risk' | 'critical' | 'deprecated';
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  recommendations: string[];
}

export function assessTechnologyHealth(
  eolDate: Date | null,
  eosDate: Date | null,
  version: string | null,
  annualCost: number
): TechnologyHealthAssessment {
  const now = new Date();
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const twelveMonths = new Date();
  twelveMonths.setMonth(twelveMonths.getMonth() + 12);

  const issues: string[] = [];
  const recommendations: string[] = [];
  let health_status: 'healthy' | 'at_risk' | 'critical' | 'deprecated' = 'healthy';
  let risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';

  // Check end-of-support
  if (eosDate) {
    if (eosDate <= now) {
      health_status = 'deprecated';
      risk_level = 'critical';
      issues.push('Already past end-of-support date - no security updates available');
      recommendations.push('URGENT: Replace immediately - security risk');
    } else if (eosDate <= sixMonths) {
      health_status = 'critical';
      risk_level = 'high';
      issues.push(`End-of-support in ${Math.ceil((eosDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`);
      recommendations.push('Plan replacement within next 3 months');
    } else if (eosDate <= twelveMonths) {
      health_status = 'at_risk';
      risk_level = 'medium';
      issues.push(`End-of-support in ${Math.ceil((eosDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`);
      recommendations.push('Include in roadmap for replacement');
    }
  }

  // Check end-of-life (earlier than EOS)
  if (eolDate && eolDate <= now && health_status === 'healthy') {
    health_status = 'at_risk';
    risk_level = 'low';
    issues.push('Product is end-of-life (no new features, but still supported)');
  }

  return { health_status, risk_level, issues, recommendations };
}
```

### Roadmap Dependency Validation
```typescript
// src/services/vcio/roadmap-validator.ts

interface RoadmapItem {
  id: string;
  dependencies: Array<{ roadmap_item_id?: string; description: string }>;
  target_date: Date;
  status: string;
}

export async function validateRoadmapDependencies(
  roadmapItem: RoadmapItem,
  allRoadmapItems: RoadmapItem[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (!roadmapItem.dependencies || roadmapItem.dependencies.length === 0) {
    return { valid: true, errors: [] };
  }

  for (const dep of roadmapItem.dependencies) {
    if (!dep.roadmap_item_id) continue;

    const dependencyItem = allRoadmapItems.find(item => item.id === dep.roadmap_item_id);

    if (!dependencyItem) {
      errors.push(`Dependency not found: ${dep.roadmap_item_id}`);
      continue;
    }

    // Check if dependency target date is before or same as this item
    if (dependencyItem.target_date > roadmapItem.target_date) {
      errors.push(
        `Dependency "${dependencyItem.id}" has target date ` +
        `(${dependencyItem.target_date.toISOString().split('T')[0]}) ` +
        `after this item's target date ` +
        `(${roadmapItem.target_date.toISOString().split('T')[0]})`
      );
    }

    // Check if dependency is completed if this item is in progress
    if (roadmapItem.status === 'in_progress' &&
        dependencyItem.status !== 'completed') {
      errors.push(
        `Dependency "${dependencyItem.id}" must be completed ` +
        `before this item can be in progress`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### QBR Preparation Automation
```typescript
// src/services/vcio/qbr-preparation.ts

interface QBRPreparationData {
  qbr_meeting_id: string;
  customer_summary: {
    ticket_stats: any;
    sla_compliance: number;
    recent_projects: any[];
    financial_summary: any;
  };
  technology_health: any;
  risk_summary: any;
  roadmap_progress: any;
  recommendations_status: any;
  action_items_from_last_qbr: any[];
}

export async function prepareQBRData(
  qbrMeetingId: string,
  customerId: string,
  db: any
): Promise<QBRPreparationData> {
  const qbr = await db.qbr_meetings.findById(qbrMeetingId);

  // Get previous QBR for comparison
  const lastQBR = await db.qbr_meetings.findOne({
    customer_id: customerId,
    meeting_date: { $lt: qbr.meeting_date },
    status: 'completed'
  }, { sort: { meeting_date: -1 } });

  // Calculate date range (since last QBR or last 90 days)
  const startDate = lastQBR ? lastQBR.meeting_date : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  // Gather ticket statistics
  const tickets = await db.tickets.aggregate([
    {
      $match: {
        customer_id: customerId,
        created_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avg_resolution_hours: { $avg: { $subtract: ['$closed_at', '$created_at'] } }
      }
    }
  ]);

  // Calculate SLA compliance
  const slaCompliance = await calculateSLACompliance(customerId, startDate, endDate, db);

  // Get recent projects
  const recentProjects = await db.projects.find({
    customer_id: customerId,
    updated_at: { $gte: startDate }
  }).limit(10);

  // Technology health summary
  const technologyHealth = await db.technology_stack.aggregate([
    { $match: { customer_id: customerId } },
    { $group: { _id: '$health_status', count: { $sum: 1 } } }
  ]);

  // Risk summary
  const risks = await db.vcio_risk_register.find({
    customer_id: customerId,
    status: { $in: ['identified', 'assessing', 'mitigating'] }
  });

  // Roadmap progress
  const roadmapItems = await db.technology_roadmap.find({
    customer_id: customerId,
    status: { $in: ['approved', 'in_progress', 'completed'] }
  });

  // Recommendations status
  const recommendations = await db.vcio_recommendations.aggregate([
    { $match: { customer_id: customerId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Action items from last QBR
  const actionItemsFromLastQBR = lastQBR ? await db.qbr_action_items.find({
    qbr_meeting_id: lastQBR.id
  }) : [];

  return {
    qbr_meeting_id: qbrMeetingId,
    customer_summary: {
      ticket_stats: tickets,
      sla_compliance: slaCompliance,
      recent_projects: recentProjects,
      financial_summary: {} // TODO: calculate from invoices
    },
    technology_health: technologyHealth,
    risk_summary: risks,
    roadmap_progress: roadmapItems,
    recommendations_status: recommendations,
    action_items_from_last_qbr: actionItemsFromLastQBR
  };
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// tests/unit/vcio/risk-calculator.test.ts

import { calculateRiskScore } from '../../../src/services/vcio/risk-calculator';

describe('Risk Score Calculator', () => {
  test('should calculate low risk correctly', () => {
    const result = calculateRiskScore('low', 'low');
    expect(result.risk_score).toBe(4);
    expect(result.risk_level).toBe('low');
  });

  test('should calculate critical risk correctly', () => {
    const result = calculateRiskScore('very_high', 'very_high');
    expect(result.risk_score).toBe(25);
    expect(result.risk_level).toBe('critical');
  });

  test('should handle mixed probability and impact', () => {
    const result = calculateRiskScore('high', 'medium');
    expect(result.risk_score).toBe(12);
    expect(result.risk_level).toBe('high');
  });
});

// tests/unit/vcio/technology-health.test.ts

import { assessTechnologyHealth } from '../../../src/services/vcio/technology-health';

describe('Technology Health Assessment', () => {
  test('should mark as deprecated if past EOS', () => {
    const pastDate = new Date('2024-01-01');
    const result = assessTechnologyHealth(pastDate, pastDate, '1.0', 1000);

    expect(result.health_status).toBe('deprecated');
    expect(result.risk_level).toBe('critical');
    expect(result.issues).toContain('Already past end-of-support date - no security updates available');
  });

  test('should mark as critical if EOS within 6 months', () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const result = assessTechnologyHealth(futureDate, futureDate, '2.0', 5000);

    expect(result.health_status).toBe('critical');
    expect(result.risk_level).toBe('high');
  });

  test('should mark as healthy if EOS > 12 months away', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const result = assessTechnologyHealth(futureDate, futureDate, '3.0', 2000);

    expect(result.health_status).toBe('healthy');
    expect(result.risk_level).toBe('none');
  });
});
```

### Integration Tests
```typescript
// tests/integration/vcio/qbr.test.ts

import request from 'supertest';
import app from '../../../src/app';

describe('QBR API', () => {
  let authToken: string;
  let customerId: string;

  beforeAll(async () => {
    // Setup test data and auth
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'vcio@test.com', password: 'test123' });
    authToken = loginResponse.body.token;

    // Create test customer
    const customerResponse = await request(app)
      .post('/api/v1/crm/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Customer for QBR', industry: 'Technology' });
    customerId = customerResponse.body.id;
  });

  test('should create QBR meeting', async () => {
    const response = await request(app)
      .post('/api/v1/vcio/qbr')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: customerId,
        title: 'Q1 2025 QBR',
        meeting_date: '2025-03-15',
        fiscal_quarter: 'Q1 2025'
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('scheduled');
  });

  test('should list QBRs for customer', async () => {
    const response = await request(app)
      .get(`/api/v1/vcio/qbr?customer_id=${customerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.qbrs).toBeInstanceOf(Array);
  });
});
```

---

## Implementation Checklist

### Phase 1: Core QBR & Roadmap (Weeks 1-2)
- [ ] **Database Setup**
  - [ ] Create all vCIO tables with RLS policies
  - [ ] Create indexes for performance
  - [ ] Set up audit triggers
  - [ ] Test multi-tenancy isolation

- [ ] **QBR Management**
  - [ ] Implement POST /vcio/qbr (create)
  - [ ] Implement GET /vcio/qbr/:id (details)
  - [ ] Implement GET /vcio/qbr (list with filters)
  - [ ] Implement PATCH /vcio/qbr/:id (update)
  - [ ] Add QBR action items CRUD
  - [ ] Write unit tests for QBR service
  - [ ] Write integration tests for QBR APIs

- [ ] **Technology Roadmap**
  - [ ] Implement POST /vcio/roadmap (create item)
  - [ ] Implement GET /vcio/roadmap (get customer roadmap)
  - [ ] Implement PATCH /vcio/roadmap/:id (update)
  - [ ] Implement dependency validation
  - [ ] Add project linking (create project from roadmap item)
  - [ ] Write unit tests for roadmap service
  - [ ] Write integration tests for roadmap APIs

### Phase 2: Recommendations & Budget (Weeks 3-4)
- [ ] **Recommendations**
  - [ ] Implement POST /vcio/recommendations (create)
  - [ ] Implement GET /vcio/recommendations (list for customer)
  - [ ] Implement PATCH /vcio/recommendations/:id (update status)
  - [ ] Add roadmap item linking
  - [ ] Write unit tests
  - [ ] Write integration tests

- [ ] **Budget Forecasting**
  - [ ] Implement POST /vcio/budget (create/update)
  - [ ] Implement GET /vcio/budget (get forecast)
  - [ ] Add variance calculations
  - [ ] Add budget vs actual reporting
  - [ ] Write unit tests
  - [ ] Write integration tests

### Phase 3: Risk & Technology Stack (Week 5)
- [ ] **Risk Register**
  - [ ] Implement POST /vcio/risks (create)
  - [ ] Implement GET /vcio/risks (list)
  - [ ] Implement PATCH /vcio/risks/:id (update)
  - [ ] Implement risk score calculator
  - [ ] Add roadmap item linking for mitigation
  - [ ] Write unit tests for risk calculator
  - [ ] Write integration tests

- [ ] **Technology Stack**
  - [ ] Implement POST /vcio/technology-stack (add/update)
  - [ ] Implement GET /vcio/technology-stack (get for customer)
  - [ ] Implement technology health assessment
  - [ ] Add EOL/EOS monitoring
  - [ ] Link to assets module (if available)
  - [ ] Write unit tests for health assessment
  - [ ] Write integration tests

### Phase 4: Dashboard & Reports (Week 6)
- [ ] **vCIO Dashboard**
  - [ ] Implement GET /vcio/dashboard
  - [ ] Aggregate data from all vCIO modules
  - [ ] Add customer health scoring
  - [ ] Add trend analysis
  - [ ] Write integration tests

- [ ] **Executive Reports**
  - [ ] Implement POST /vcio/reports/executive
  - [ ] Create QBR summary report template
  - [ ] Create roadmap status report
  - [ ] Create risk assessment report
  - [ ] Add PDF generation (using library like Puppeteer or pdfmake)
  - [ ] Add Excel export for budget forecasts
  - [ ] Write integration tests

- [ ] **QBR Automation**
  - [ ] Implement QBR preparation data gathering
  - [ ] Create QBR reminder system (integrate with notifications)
  - [ ] Auto-generate QBR presentation outline
  - [ ] Add email templates for QBR invitations
  - [ ] Write unit tests

### Phase 5: Integration & Polish (Week 6+)
- [ ] **Module Integrations**
  - [ ] Integrate with CRM module (customer data)
  - [ ] Integrate with Projects module (roadmap → project)
  - [ ] Integrate with Tickets module (ticket stats for QBR)
  - [ ] Integrate with Reports module (customer health)
  - [ ] Integrate with Assets module (link technology stack)

- [ ] **RBAC & Security**
  - [ ] Define vCIO-specific permissions
  - [ ] Test permission enforcement
  - [ ] Ensure tenant isolation

- [ ] **Documentation**
  - [ ] API documentation (OpenAPI/Swagger)
  - [ ] User guide for vCIO features
  - [ ] Best practices for QBR process

- [ ] **Performance & Optimization**
  - [ ] Optimize dashboard queries
  - [ ] Add caching for frequently accessed data
  - [ ] Load testing for report generation

---

## Definition of Done

### Functional Completeness
- [x] All API endpoints implemented and tested
- [x] QBR lifecycle management (schedule → conduct → follow-up)
- [x] Technology roadmap with dependencies
- [x] Budget forecasting with variance tracking
- [x] Risk register with scoring
- [x] Technology stack health monitoring
- [x] vCIO dashboard with KPIs
- [x] Executive report generation (PDF)

### Quality Standards
- [x] Unit test coverage ≥ 80%
- [x] Integration test coverage for all APIs
- [x] All tests passing
- [x] No critical or high security vulnerabilities
- [x] Code review completed
- [x] API documentation complete (Swagger)

### Non-Functional Requirements
- [x] Response time < 200ms for dashboard
- [x] Report generation < 30 seconds for QBR report
- [x] Multi-tenancy isolation verified
- [x] RBAC permissions enforced
- [x] Audit logging for all changes
- [x] Input validation and error handling

### Documentation
- [x] API documentation (OpenAPI 3.0)
- [x] Database schema documented
- [x] User guide for vCIO features
- [x] QBR process guide
- [x] Deployment instructions

### Integration
- [x] Integrated with CRM module
- [x] Integrated with Projects module (optional)
- [x] Integrated with Reports module
- [x] Tested end-to-end with other modules

---

## Dependencies

### Required Modules (Must be complete)
- **CRM-001** - Customer and contact management
- **REPORTS-001** - Customer health metrics and analytics

### Optional Integrations (Enhance functionality)
- **PROJECTS-001** - Link roadmap items to projects
- **TICKETS-001** - Include ticket stats in QBR preparation
- **ASSETS-001** - Link technology stack to asset inventory
- **BILLING-001** - Include financial data in QBR

### External Services
- PDF generation library (Puppeteer, pdfmake, or similar)
- Excel export library (exceljs or similar)
- Email service (for QBR reminders and invitations)

---

## Environment Variables

```bash
# vCIO Module Configuration
VCIO_QBR_REMINDER_DAYS=14          # Send QBR reminder 14 days before meeting
VCIO_EOL_WARNING_MONTHS=12         # Warn when technology within 12 months of EOL
VCIO_REPORT_STORAGE_PATH=/opt/psa-platform/reports/vcio
VCIO_MAX_REPORT_SIZE_MB=50         # Max PDF report size

# PDF Generation (if using Puppeteer)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_HEADLESS=true

# Email Integration (for QBR invitations)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=vcio@psa-platform.com
SMTP_PASSWORD=secure_password
SMTP_FROM=vCIO Team <vcio@psa-platform.com>
```

---

## Performance Considerations

### Database Optimization
- **Indexes**: All foreign keys indexed for joins
- **Partitioning**: Not needed initially (small dataset per tenant)
- **Materialized Views**: Consider for dashboard aggregations if performance degrades

### Caching Strategy
```typescript
// Cache vCIO dashboard data for 1 hour
const cacheKey = `vcio:dashboard:${customerId}`;
let dashboardData = await redis.get(cacheKey);

if (!dashboardData) {
  dashboardData = await generateDashboardData(customerId);
  await redis.set(cacheKey, JSON.stringify(dashboardData), 'EX', 3600);
}
```

### Report Generation
- Generate reports asynchronously (queue with Bull/BullMQ)
- Store generated reports in S3-compatible storage or local filesystem
- Provide download link once complete
- Expire reports after 7 days

---

## Notes for Sub-Agent

### Critical Business Logic
1. **Risk Scoring**: Use probability × impact (1-5 scale each) to get 1-25 score
2. **Technology Health**: Automatically assess based on EOL/EOS dates
3. **QBR Preparation**: Auto-gather data from last QBR period for comparison
4. **Roadmap Dependencies**: Validate dates and completion status before allowing progress
5. **Budget Variance**: Track forecast vs actual, highlight >10% variance

### Key User Workflows
1. **Prepare for QBR**:
   - Create QBR meeting 2-4 weeks in advance
   - System auto-gathers customer data (tickets, projects, financial)
   - vCIO reviews technology health and risks
   - vCIO prepares recommendations and roadmap updates
   - System generates presentation outline

2. **Conduct QBR**:
   - Present customer performance metrics
   - Review roadmap progress
   - Discuss risks and recommendations
   - Get customer feedback and approvals
   - Document action items

3. **Post-QBR Follow-up**:
   - Update roadmap statuses based on customer decisions
   - Create projects from approved roadmap items
   - Assign action items to team members
   - Schedule next QBR
   - Send follow-up email with summary

### UI/UX Considerations (for future frontend)
- **Visual Roadmap**: Gantt-chart style view with dependencies
- **Risk Heat Map**: Color-coded grid (probability vs impact)
- **Technology Health Dashboard**: Traffic light system (green/yellow/red)
- **QBR Timeline**: Visual timeline of past and future QBRs
- **Budget Charts**: Forecast vs actual bar charts by category

---

**Module Owner**: vCIO Sub-Agent
**Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Status**: Ready for Implementation
