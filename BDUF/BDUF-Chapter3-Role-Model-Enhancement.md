# BDUF Chapter 3 - Role Model Enhancement

**Issue:** Current role model missing software developer roles and seniority differentiation for technicians.

**Date:** 2025-11-04
**Status:** Proposed Enhancement

---

## Problem Statement

### Current Role Model Issues

1. **No Software Developer Roles**
   - MSPs often have in-house developers
   - No roles for software development team
   - Can't differentiate dev work from support work

2. **No Seniority Levels for Technicians**
   - Can't distinguish junior vs. mid vs. senior technicians
   - All technicians lumped together or only L1/L2/L3
   - Billing rates often differ by seniority

3. **L1/L2/L3 Confusion**
   - Current roles: `technician_l1`, `technician_l2`, `technician_l3`
   - Unclear if L1/L2/L3 means:
     - Support tier (first-line, second-line, third-line support)?
     - OR Seniority level (junior, mid, senior)?
   - `user_billing_rates` table also uses `service_level` with L1/L2/L3

### Real-World Requirements

**MSP Roles in Practice:**
- **Software Developers** (in-house product development)
  - Junior Developer (0-2 years)
  - Developer / Mid-Level Developer (2-5 years)
  - Senior Developer (5+ years)
  - Lead Developer / Tech Lead (8+ years)

- **Support Technicians** (customer-facing support)
  - Junior Technician (0-2 years)
  - Technician / Mid-Level Technician (2-5 years)
  - Senior Technician (5+ years)
  - Support Team Lead

- **Service Levels** (type of work, not seniority)
  - L1 Support: Basic help desk, password resets, user onboarding
  - L2 Support: Advanced troubleshooting, system configuration
  - L3 Support: Complex issues, architecture, integrations

**Key Insight:** A **senior technician** (seniority) can work on **L1 tickets** (service level), and a **junior technician** might occasionally help with **L2 work** under supervision.

---

## Proposed Solution

### Option A: Enhanced Role List (Recommended)

Expand the role enum to include seniority levels and software developers:

**Structure:**
- `{profession}_{seniority}` format
- Clear separation of concerns
- Backwards compatible (keep L1/L2/L3 for migration)

**New Roles:**

```sql
-- Current admins (unchanged)
'system_admin'
'tenant_admin'
'security_admin'
'service_manager'

-- Software Developers (NEW)
'software_developer_lead'       -- Lead Developer / Tech Lead
'software_developer_senior'     -- Senior Developer (5+ years)
'software_developer'            -- Mid-Level Developer (2-5 years)
'software_developer_junior'     -- Junior Developer (0-2 years)

-- Support Technicians with Seniority (NEW)
'technician_lead'               -- Support Team Lead
'technician_senior'             -- Senior Technician (5+ years)
'technician'                    -- Mid-Level Technician (2-5 years)
'technician_junior'             -- Junior Technician (0-2 years)

-- Legacy Support Tier Roles (DEPRECATED - for backwards compatibility)
'technician_l3'                 -- Deprecated: Use 'technician_senior' + service_level='L3' in billing rates
'technician_l2'                 -- Deprecated: Use 'technician' + service_level='L2' in billing rates
'technician_l1'                 -- Deprecated: Use 'technician_junior' + service_level='L1' in billing rates

-- Other roles (unchanged)
'account_manager'
'project_manager'
'billing_manager'

-- Customer roles (unchanged)
'customer_admin'
'customer_technician'
'customer_user'
```

**Total Roles:** 23 (8 new, 15 existing)

---

### Option B: Separate Seniority Field (Alternative)

Add a separate `seniority_level` column:

```sql
-- Add new column
seniority_level VARCHAR(20) CHECK (seniority_level IN (
    'junior',    -- 0-2 years
    'mid',       -- 2-5 years
    'senior',    -- 5+ years
    'lead',      -- 8+ years, team lead
    NULL         -- Not applicable for admin/customer roles
)),

-- Simplified roles
role VARCHAR(50) NOT NULL CHECK (role IN (
    'system_admin', 'tenant_admin', 'security_admin',
    'service_manager',
    'software_developer',  -- NEW
    'technician',          -- Simplified
    'account_manager', 'project_manager', 'billing_manager',
    'customer_admin', 'customer_technician', 'customer_user'
)),
```

**Pros:**
- Cleaner data model
- Easy to query by seniority
- Role and seniority are orthogonal concerns

**Cons:**
- Requires application logic changes
- Two fields instead of one
- Migration more complex

---

## Recommended Solution: Option A

**Rationale:**
- ✅ Simpler migration (just add new roles)
- ✅ Backwards compatible (keep L1/L2/L3 as deprecated)
- ✅ Single role field keeps RBAC simple
- ✅ Clear naming convention
- ✅ No application logic changes needed

---

## Updated Schema

### users table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255),

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),

    -- Role & Permissions
    role VARCHAR(50) NOT NULL CHECK (role IN (
        -- System Admins
        'system_admin', 'tenant_admin', 'security_admin',
        'service_manager',

        -- Software Developers (NEW)
        'software_developer_lead',
        'software_developer_senior',
        'software_developer',
        'software_developer_junior',

        -- Support Technicians with Seniority (NEW)
        'technician_lead',
        'technician_senior',
        'technician',
        'technician_junior',

        -- Legacy Support Tier (DEPRECATED)
        'technician_l3', 'technician_l2', 'technician_l1',

        -- Other Internal Roles
        'account_manager', 'project_manager', 'billing_manager',

        -- Customer Roles
        'customer_admin', 'customer_technician', 'customer_user'
    )),
    permissions JSONB,

    -- Settings
    internal_cost_rate DECIMAL(8,2),
    default_billing_rate DECIMAL(8,2),
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
    sso_provider VARCHAR(50),
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
```

---

## Role Hierarchy & Permissions

### Permission Levels

```
System Administrator
├── Tenant Administrator
│   ├── Service Manager
│   │   ├── Technician Lead
│   │   │   ├── Technician Senior
│   │   │   ├── Technician (Mid-Level)
│   │   │   └── Technician Junior
│   │   │
│   │   ├── Software Developer Lead
│   │   │   ├── Software Developer Senior
│   │   │   ├── Software Developer (Mid-Level)
│   │   │   └── Software Developer Junior
│   │   │
│   │   └── Legacy: Technician L3/L2/L1 (Deprecated)
│   │
│   ├── Account Manager
│   ├── Project Manager
│   └── Billing Manager
│
└── Customer Roles
    ├── Customer Admin
    ├── Customer Technician
    └── Customer User
```

---

## Example Use Cases

### Use Case 1: Software Developer Billing

**Scenario:** Senior Developer works on custom integration project for Customer A

```sql
-- User
INSERT INTO users (email, first_name, last_name, role, internal_cost_rate, default_billing_rate)
VALUES (
    'max.mustermann@msp.com',
    'Max',
    'Mustermann',
    'software_developer_senior',
    75.00,  -- Internal cost: €75/hour
    180.00  -- Default billing: €180/hour
);

-- Customer-specific rate (Customer A pays premium)
INSERT INTO user_billing_rates (user_id, customer_id, billing_rate, work_type)
VALUES (
    'uuid-max',
    'uuid-customer-a',
    200.00,  -- €200/hour for custom development
    'development'
);

-- Time entry
INSERT INTO time_entries (
    project_id,
    user_id,
    hours,
    description,
    billing_rate,  -- Charged to customer
    cost_rate,     -- Internal cost
    work_type
) VALUES (
    'project-integration',
    'uuid-max',
    8.0,
    'Implemented DATEV API integration',
    200.00,  -- Customer pays €200/hour
    75.00,   -- Internal cost €75/hour
    'development'
);

-- Profit: (200 - 75) * 8 = €1,000
```

### Use Case 2: Technician with Different Service Levels

**Scenario:** Senior Technician works both L3 (complex) and L1 (simple) tickets

```sql
-- User
INSERT INTO users (email, first_name, last_name, role, internal_cost_rate, default_billing_rate)
VALUES (
    'anna.schmidt@msp.com',
    'Anna',
    'Schmidt',
    'technician_senior',
    55.00,  -- Internal cost
    130.00  -- Default billing
);

-- Customer-specific rates by service level
INSERT INTO user_billing_rates (user_id, customer_id, billing_rate, service_level)
VALUES
    ('uuid-anna', 'uuid-customer-b', 150.00, 'L3'),  -- Complex work
    ('uuid-anna', 'uuid-customer-b', 120.00, 'L2'),  -- Standard work
    ('uuid-anna', 'uuid-customer-b',  90.00, 'L1');  -- Simple work

-- Time entry for L3 work
INSERT INTO time_entries (ticket_id, user_id, hours, description, billing_rate, cost_rate, work_type)
VALUES (
    'ticket-complex',
    'uuid-anna',
    3.0,
    'Troubleshot complex AD replication issue',
    150.00,  -- L3 rate
    55.00,
    'support'
);

-- Time entry for L1 work
INSERT INTO time_entries (ticket_id, user_id, hours, description, billing_rate, cost_rate, work_type)
VALUES (
    'ticket-simple',
    'uuid-anna',
    0.5,
    'Password reset and user training',
    90.00,   -- L1 rate
    55.00,
    'support'
);
```

### Use Case 3: Junior Developer Learning

**Scenario:** Junior Developer works under senior's supervision, billed at junior rate

```sql
-- Junior Developer
INSERT INTO users (email, first_name, last_name, role, internal_cost_rate, default_billing_rate)
VALUES (
    'lisa.neu@msp.com',
    'Lisa',
    'Neu',
    'software_developer_junior',
    35.00,  -- Lower internal cost
    80.00   -- Lower billing rate
);

-- Time entry (supervised work)
INSERT INTO time_entries (project_id, user_id, hours, description, billing_rate, cost_rate, work_type)
VALUES (
    'project-integration',
    'uuid-lisa',
    6.0,
    'Implemented unit tests under Max supervision',
    80.00,   -- Junior rate
    35.00,
    'development'
);
```

---

## Migration Strategy

### Phase 1: Add New Roles

```sql
-- No data migration needed, just update schema
ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
    'system_admin', 'tenant_admin', 'security_admin',
    'service_manager',
    'software_developer_lead', 'software_developer_senior',
    'software_developer', 'software_developer_junior',
    'technician_lead', 'technician_senior',
    'technician', 'technician_junior',
    'technician_l3', 'technician_l2', 'technician_l1',  -- Keep for backwards compatibility
    'account_manager', 'project_manager', 'billing_manager',
    'customer_admin', 'customer_technician', 'customer_user'
));
```

### Phase 2: Migrate Existing Users (Optional)

```sql
-- Map old L1/L2/L3 to new seniority-based roles
-- This is optional and can be done gradually

UPDATE users
SET role = 'technician_senior'
WHERE role = 'technician_l3';

UPDATE users
SET role = 'technician'
WHERE role = 'technician_l2';

UPDATE users
SET role = 'technician_junior'
WHERE role = 'technician_l1';
```

### Phase 3: Update Billing Rates

```sql
-- Update user_billing_rates to use service_level explicitly
-- (Already supported in current schema)

-- Example: Senior technician with L1/L2/L3 rates
INSERT INTO user_billing_rates (user_id, customer_id, billing_rate, service_level)
VALUES
    ('uuid-senior-tech', 'uuid-customer-x', 150.00, 'L3'),
    ('uuid-senior-tech', 'uuid-customer-x', 120.00, 'L2'),
    ('uuid-senior-tech', 'uuid-customer-x',  90.00, 'L1');
```

---

## Documentation Updates

### Role Descriptions

| Role | Description | Typical Experience | Billing Rate Range |
|------|-------------|-------------------|-------------------|
| **Software Developers** | | | |
| `software_developer_lead` | Tech Lead, Architecture decisions | 8+ years | €150-250/hour |
| `software_developer_senior` | Senior Developer, Mentoring | 5+ years | €120-200/hour |
| `software_developer` | Mid-Level Developer | 2-5 years | €80-150/hour |
| `software_developer_junior` | Junior Developer, Learning | 0-2 years | €50-100/hour |
| **Support Technicians** | | | |
| `technician_lead` | Support Team Lead | 8+ years | €120-180/hour |
| `technician_senior` | Senior Technician, L2/L3 focus | 5+ years | €90-150/hour |
| `technician` | Mid-Level Technician, L1/L2 | 2-5 years | €70-120/hour |
| `technician_junior` | Junior Technician, L1 focus | 0-2 years | €50-90/hour |

**Note:** Actual billing rates depend on customer, contract, and service level (see `user_billing_rates`).

---

## Benefits

1. ✅ **Software developers properly represented** in system
2. ✅ **Clear seniority progression** for career development
3. ✅ **Flexible billing** based on role, seniority, and service level
4. ✅ **Backwards compatible** with existing L1/L2/L3 roles
5. ✅ **Clearer HR/recruiting** - well-defined job titles
6. ✅ **Better profitability tracking** - cost vs. billing by seniority
7. ✅ **Service level flexibility** - senior techs can do L1 work, juniors can learn L2

---

## Related Files

- `BDUF/BDUF-Chapter3.md` - Data model (users table)
- `BDUF/BDUF-Chapter3-Billing-Rate-Fix.md` - Billing rate resolution
- `BDUF/BDUF-Chapter5.md` - RBAC permissions
- `07-Rollen-Berechtigungen.md` - Role hierarchy documentation
- `PSA-Platform-BRD.md` - Business requirements

---

**Next Steps:**
1. Review and approve enhanced role model
2. Update BDUF-Chapter3.md with new roles
3. Update RBAC documentation in BDUF-Chapter5.md
4. Update BRD role hierarchy section
5. Implement migration script
6. Update frontend role dropdowns
7. Update documentation and training materials
