# BDUF Chapter 3 - Billing Rate Model Fix

**Issue:** Current data model doesn't support multiple billing rates per user based on customer/contract/service level.

**Date:** 2025-11-03
**Status:** Proposed Fix

---

## Problem Statement

### Current Model Issues

1. **`users.hourly_rate`** - Single rate per user (ambiguous: billing or cost?)
2. **`time_entries.hourly_rate`** - Snapshot, but no clear rate hierarchy
3. **`contracts.hourly_rate`** - Single rate per contract (doesn't account for user skill levels)

### Real-World Requirements

- **Multiple Billing Rates per User:**
  - User A (L3) bills Customer X at €120/hour
  - User A (L3) bills Customer Y at €150/hour
  - User B (L1) bills Customer X at €80/hour
  - Rates can vary by: customer, contract, service level, work type

- **Single Internal Cost per User:**
  - User A costs the MSP €50/hour (internal)
  - User B costs the MSP €35/hour (internal)
  - Used for profitability analysis

---

## Proposed Solution

### 1. New Table: `user_billing_rates`

This table defines context-specific billing rates for users.

```sql
CREATE TABLE user_billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Context (at least one must be specified)
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,

    -- Rate Details
    billing_rate DECIMAL(8,2) NOT NULL CHECK (billing_rate > 0),

    -- Optional: Service Level Override
    service_level VARCHAR(20) CHECK (service_level IN ('L1', 'L2', 'L3', 'project', 'consulting')),

    -- Optional: Work Type
    work_type VARCHAR(50), -- e.g., 'support', 'project', 'consulting', 'emergency'

    -- Validity Period
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,

    -- Constraints
    CONSTRAINT user_rate_context CHECK (
        customer_id IS NOT NULL OR contract_id IS NOT NULL
    ),
    CONSTRAINT user_rate_valid_period CHECK (
        valid_until IS NULL OR valid_until >= valid_from
    )
);

-- Indexes
CREATE INDEX idx_user_billing_rates_user ON user_billing_rates(user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_user_billing_rates_customer ON user_billing_rates(customer_id)
    WHERE customer_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_billing_rates_contract ON user_billing_rates(contract_id)
    WHERE contract_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_billing_rates_lookup ON user_billing_rates(
    user_id, customer_id, contract_id, service_level, work_type
) WHERE is_active = true AND deleted_at IS NULL;

-- Prevent duplicate rate definitions
CREATE UNIQUE INDEX idx_user_billing_rates_unique ON user_billing_rates(
    user_id,
    COALESCE(customer_id::text, 'NULL'),
    COALESCE(contract_id::text, 'NULL'),
    COALESCE(service_level, 'NULL'),
    COALESCE(work_type, 'NULL'),
    valid_from
) WHERE deleted_at IS NULL;
```

### 2. Update: `users` Table

Rename `hourly_rate` to clearly indicate it's the **internal cost rate**.

```sql
-- OLD:
hourly_rate DECIMAL(8,2),

-- NEW:
internal_cost_rate DECIMAL(8,2), -- MSP's cost for this user
default_billing_rate DECIMAL(8,2), -- Fallback if no specific rate defined
```

**Migration:**
```sql
ALTER TABLE users RENAME COLUMN hourly_rate TO internal_cost_rate;
ALTER TABLE users ADD COLUMN default_billing_rate DECIMAL(8,2);
UPDATE users SET default_billing_rate = internal_cost_rate * 2.5; -- Example multiplier
```

### 3. Update: `time_entries` Table

Add both billing and cost rates for complete financial tracking.

```sql
-- OLD:
hourly_rate DECIMAL(8,2), -- Snapshot of rate at time of entry

-- NEW:
billing_rate DECIMAL(8,2) NOT NULL, -- Rate charged to customer
cost_rate DECIMAL(8,2), -- Internal cost (snapshot from user)
work_type VARCHAR(50), -- For rate lookup context
```

**Migration:**
```sql
ALTER TABLE time_entries RENAME COLUMN hourly_rate TO billing_rate;
ALTER TABLE time_entries ADD COLUMN cost_rate DECIMAL(8,2);
ALTER TABLE time_entries ADD COLUMN work_type VARCHAR(50);

-- Backfill cost_rate from users.internal_cost_rate
UPDATE time_entries te
SET cost_rate = u.internal_cost_rate
FROM users u
WHERE te.user_id = u.id AND te.cost_rate IS NULL;
```

### 4. Update: `contracts` Table

Keep contract-level default rate, but clarify its purpose.

```sql
-- Keep existing field, but add comment:
hourly_rate DECIMAL(8,2), -- Default billing rate for this contract (can be overridden by user_billing_rates)
```

---

## Rate Resolution Logic

When creating a time entry, resolve the billing rate using this hierarchy:

```
1. user_billing_rates (most specific match)
   ├─> user + contract + service_level + work_type
   ├─> user + contract + service_level
   ├─> user + contract + work_type
   ├─> user + contract
   ├─> user + customer + service_level + work_type
   ├─> user + customer + service_level
   ├─> user + customer + work_type
   └─> user + customer

2. contracts.hourly_rate (if time entry is contract-based)

3. users.default_billing_rate (user's default rate)

4. ERROR: No billing rate configured
```

### Implementation Example (SQL Function)

```sql
CREATE OR REPLACE FUNCTION get_billing_rate(
    p_user_id UUID,
    p_customer_id UUID,
    p_contract_id UUID DEFAULT NULL,
    p_service_level VARCHAR(20) DEFAULT NULL,
    p_work_type VARCHAR(50) DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(8,2) AS $$
DECLARE
    v_rate DECIMAL(8,2);
BEGIN
    -- Try user_billing_rates (most specific to least specific)
    SELECT billing_rate INTO v_rate
    FROM user_billing_rates
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND is_active = true
      AND valid_from <= p_date
      AND (valid_until IS NULL OR valid_until >= p_date)
      AND (
          -- Perfect match
          (contract_id = p_contract_id AND service_level = p_service_level AND work_type = p_work_type) OR
          (contract_id = p_contract_id AND service_level = p_service_level AND work_type IS NULL) OR
          (contract_id = p_contract_id AND service_level IS NULL AND work_type = p_work_type) OR
          (contract_id = p_contract_id AND service_level IS NULL AND work_type IS NULL) OR
          -- Customer-level match
          (customer_id = p_customer_id AND service_level = p_service_level AND work_type = p_work_type) OR
          (customer_id = p_customer_id AND service_level = p_service_level AND work_type IS NULL) OR
          (customer_id = p_customer_id AND service_level IS NULL AND work_type = p_work_type) OR
          (customer_id = p_customer_id AND service_level IS NULL AND work_type IS NULL)
      )
    ORDER BY
        -- Prioritize more specific matches
        (CASE WHEN contract_id IS NOT NULL THEN 1 ELSE 2 END),
        (CASE WHEN service_level IS NOT NULL THEN 1 ELSE 2 END),
        (CASE WHEN work_type IS NOT NULL THEN 1 ELSE 2 END),
        created_at DESC
    LIMIT 1;

    -- If found, return it
    IF v_rate IS NOT NULL THEN
        RETURN v_rate;
    END IF;

    -- Try contract default rate
    IF p_contract_id IS NOT NULL THEN
        SELECT hourly_rate INTO v_rate
        FROM contracts
        WHERE id = p_contract_id
          AND hourly_rate IS NOT NULL
          AND deleted_at IS NULL;

        IF v_rate IS NOT NULL THEN
            RETURN v_rate;
        END IF;
    END IF;

    -- Try user default rate
    SELECT default_billing_rate INTO v_rate
    FROM users
    WHERE id = p_user_id
      AND default_billing_rate IS NOT NULL
      AND deleted_at IS NULL;

    IF v_rate IS NOT NULL THEN
        RETURN v_rate;
    END IF;

    -- No rate found
    RAISE EXCEPTION 'No billing rate configured for user % on customer/contract', p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Example Data

### Setup

```sql
-- User internal costs
UPDATE users SET internal_cost_rate = 50.00, default_billing_rate = 100.00
WHERE email = 'senior@msp.com';

UPDATE users SET internal_cost_rate = 35.00, default_billing_rate = 80.00
WHERE email = 'junior@msp.com';

-- Customer-specific rates
INSERT INTO user_billing_rates (user_id, customer_id, billing_rate, service_level) VALUES
  ('uuid-senior', 'uuid-customer-a', 120.00, 'L3'),
  ('uuid-senior', 'uuid-customer-b', 150.00, 'L3'),
  ('uuid-junior', 'uuid-customer-a', 80.00, 'L1'),
  ('uuid-junior', 'uuid-customer-b', 90.00, 'L2');
```

### Time Entry Creation

```sql
-- Senior technician works on Customer A ticket
INSERT INTO time_entries (
    ticket_id,
    user_id,
    hours,
    description,
    billing_rate,
    cost_rate,
    work_type
) VALUES (
    'ticket-123',
    'uuid-senior',
    2.5,
    'Fixed server issue',
    get_billing_rate('uuid-senior', 'uuid-customer-a', NULL, 'L3', 'support'), -- Returns 120.00
    (SELECT internal_cost_rate FROM users WHERE id = 'uuid-senior'), -- Returns 50.00
    'support'
);
```

### Profitability Query

```sql
-- Calculate profit per ticket
SELECT
    t.id,
    t.title,
    c.name AS customer,
    SUM(te.hours * te.billing_rate) AS revenue,
    SUM(te.hours * te.cost_rate) AS cost,
    SUM(te.hours * (te.billing_rate - te.cost_rate)) AS profit,
    ROUND(100.0 * SUM(te.hours * (te.billing_rate - te.cost_rate)) / NULLIF(SUM(te.hours * te.billing_rate), 0), 2) AS margin_pct
FROM tickets t
JOIN customers c ON t.customer_id = c.id
LEFT JOIN time_entries te ON te.ticket_id = t.id
WHERE te.billable = true
GROUP BY t.id, t.title, c.name
ORDER BY profit DESC;
```

---

## Benefits

1. ✅ **Flexible Billing:** Different rates per customer/contract/service level
2. ✅ **Cost Tracking:** Separate internal cost from billing rate
3. ✅ **Profitability:** Easy calculation of margins
4. ✅ **Historical Accuracy:** Time entries snapshot rates at creation time
5. ✅ **Rate Changes:** Update rates without affecting historical data
6. ✅ **Audit Trail:** Track when rates were valid
7. ✅ **Multiple Users per Ticket:** Each user's time billed at their appropriate rate

---

## Migration Checklist

- [ ] Create `user_billing_rates` table
- [ ] Update `users` table (rename + add column)
- [ ] Update `time_entries` table (rename + add columns)
- [ ] Create rate resolution function `get_billing_rate()`
- [ ] Migrate existing data
- [ ] Update API endpoints to use new rate logic
- [ ] Update UI to manage user billing rates
- [ ] Add validation rules
- [ ] Update documentation
- [ ] Test profitability reports

---

## Related Files

- `/BDUF/BDUF-Chapter3.md` - Main data model
- `/PSA-Platform-BRD.md` - Business requirements
- `/04-Funktionale-Anforderungen.md` - Billing module requirements

