# Module Implementation Guide: psa-crm

**Module:** Customer Relationship Management (CRM)
**Phase:** 1 (MVP)
**Priority:** P1 (Core business functionality)
**Port:** 3020
**Dependencies:** psa-auth (Authentication), psa-db-master (PostgreSQL)

> **📦 Deployment Note:** For early MVP, this service runs on **Container 200 (psa-all-in-one)** alongside all infrastructure (PostgreSQL, Redis, etc.) and Node.js services, managed by PM2. Everything on localhost. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The CRM module manages all customer-related data including companies, contacts, locations, and relationships.

### Key Features
- **Customer Management** (Companies)
- **Contact Management** (People)
- **Location Management** (Sites)
- **Customer Hierarchies** (Parent/Child relationships)
- **Multi-Tenant Support**
- **Full-Text Search**
- **Custom Fields** (JSONB)
- **Activity Timeline**
- **Document Attachments**

### Container Specifications
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB
- **Network:** VLAN 20 (Application)
- **Port:** 3020

---

## 2. DATABASE SCHEMA

### Tables (from BDUF-Chapter3)

The following tables are already defined in the database schema:

**customers** - Companies/Organizations
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    customer_number VARCHAR(50) UNIQUE,
    parent_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Classification
    type VARCHAR(50) CHECK (type IN ('business', 'residential', 'nonprofit', 'government')),
    tier VARCHAR(50) CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'trial')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'churned')),
    
    -- Contact Details
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3) DEFAULT 'DEU',
    
    -- Financial
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_parent ON customers(parent_customer_id);
```

**contacts** - People associated with customers
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(50),
    department VARCHAR(100),
    
    -- Contact Details
    email VARCHAR(255),
    phone_office VARCHAR(50),
    phone_mobile VARCHAR(50),
    phone_direct VARCHAR(50),
    
    -- Role
    is_primary BOOLEAN DEFAULT false,
    is_billing BOOLEAN DEFAULT false,
    is_technical BOOLEAN DEFAULT false,
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_customer ON contacts(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL;
```

**locations** - Physical sites for customers
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Location Info
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) CHECK (location_type IN ('headquarters', 'branch', 'datacenter', 'remote')),
    
    -- Address
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(3) DEFAULT 'DEU',
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_locations_tenant ON locations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_customer ON locations(customer_id) WHERE deleted_at IS NULL;
```

---

## 3. API SPECIFICATION

### Base URL
`https://api.psa-platform.local/api/v1`

### Customers Endpoints

#### GET /customers
**Description:** List all customers (with pagination and filtering)

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `status` (string): Filter by status (active, inactive, prospect, churned)
- `tier` (string): Filter by tier (platinum, gold, silver, bronze)
- `search` (string): Full-text search in name, email, customer_number
- `sort` (string): Sort field (default: name)
- `order` (string): Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "tenant_id": "uuid-tenant",
      "name": "Acme Corporation GmbH",
      "display_name": "Acme Corp",
      "customer_number": "CUS-0001",
      "parent_customer_id": null,
      "type": "business",
      "tier": "gold",
      "status": "active",
      "email": "info@acme.de",
      "phone": "+49 30 12345678",
      "website": "https://www.acme.de",
      "address_line1": "Hauptstraße 123",
      "city": "Berlin",
      "postal_code": "10115",
      "country": "DEU",
      "tax_id": "DE123456789",
      "payment_terms": 30,
      "currency": "EUR",
      "tags": ["premium", "enterprise"],
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-11-04T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

#### GET /customers/:id
**Description:** Get single customer by ID

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "tenant_id": "uuid-tenant",
  "name": "Acme Corporation GmbH",
  "display_name": "Acme Corp",
  "customer_number": "CUS-0001",
  "parent_customer_id": null,
  "type": "business",
  "tier": "gold",
  "status": "active",
  "email": "info@acme.de",
  "phone": "+49 30 12345678",
  "website": "https://www.acme.de",
  "address_line1": "Hauptstraße 123",
  "address_line2": "5. OG",
  "city": "Berlin",
  "state": "Berlin",
  "postal_code": "10115",
  "country": "DEU",
  "tax_id": "DE123456789",
  "payment_terms": 30,
  "currency": "EUR",
  "custom_fields": {
    "industry": "Manufacturing",
    "employee_count": 500,
    "annual_revenue": 50000000
  },
  "tags": ["premium", "enterprise"],
  "notes": "VIP customer - 24/7 support",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-11-04T10:30:00Z",
  "created_by": "uuid-user",
  
  "_embedded": {
    "contacts": [...],
    "locations": [...],
    "active_contracts": [...],
    "recent_tickets": [...]
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Customer not found

---

#### POST /customers
**Description:** Create new customer

**Request:**
```json
{
  "name": "New Company GmbH",
  "display_name": "New Company",
  "type": "business",
  "tier": "silver",
  "status": "prospect",
  "email": "info@newcompany.de",
  "phone": "+49 40 98765432",
  "website": "https://www.newcompany.de",
  "address_line1": "Musterstraße 456",
  "city": "Hamburg",
  "postal_code": "20095",
  "country": "DEU",
  "tax_id": "DE987654321",
  "payment_terms": 14,
  "tags": ["new-lead"],
  "custom_fields": {
    "source": "trade_show",
    "referred_by": "Partner A"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new",
  "tenant_id": "uuid-tenant",
  "name": "New Company GmbH",
  "customer_number": "CUS-0151",
  ...
}
```

**Errors:**
- `400 BAD_REQUEST` - Validation error
- `409 CONFLICT` - Customer with same tax_id already exists

---

#### PUT /customers/:id
**Description:** Update existing customer

**Request:**
```json
{
  "tier": "gold",
  "status": "active",
  "payment_terms": 30,
  "tags": ["upgraded", "premium"]
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  ...
}
```

---

#### DELETE /customers/:id
**Description:** Soft-delete customer

**Response (204 No Content)**

**Errors:**
- `400 BAD_REQUEST` - Cannot delete customer with active contracts/tickets
- `404 NOT_FOUND` - Customer not found

---

### Contacts Endpoints

#### GET /customers/:customerId/contacts
**Description:** List all contacts for a customer

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-contact-1",
      "customer_id": "uuid-123",
      "first_name": "Max",
      "last_name": "Mustermann",
      "title": "CTO",
      "department": "IT",
      "email": "max.mustermann@acme.de",
      "phone_office": "+49 30 12345678",
      "phone_mobile": "+49 170 1234567",
      "is_primary": true,
      "is_technical": true,
      "is_billing": false,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /customers/:customerId/contacts
**Description:** Create new contact for customer

**Request:**
```json
{
  "first_name": "Anna",
  "last_name": "Schmidt",
  "title": "IT Manager",
  "department": "IT",
  "email": "anna.schmidt@acme.de",
  "phone_office": "+49 30 12345679",
  "phone_mobile": "+49 171 9876543",
  "is_primary": false,
  "is_technical": true,
  "is_billing": false,
  "notes": "Responsible for network infrastructure"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new-contact",
  "customer_id": "uuid-123",
  ...
}
```

---

#### PUT /contacts/:id
**Description:** Update contact

**Request:**
```json
{
  "title": "Senior IT Manager",
  "phone_mobile": "+49 171 1111111"
}
```

**Response (200 OK)**

---

#### DELETE /contacts/:id
**Description:** Soft-delete contact

**Response (204 No Content)**

---

### Locations Endpoints

#### GET /customers/:customerId/locations
**Description:** List all locations for a customer

#### POST /customers/:customerId/locations
**Description:** Create new location

#### PUT /locations/:id
**Description:** Update location

#### DELETE /locations/:id
**Description:** Soft-delete location

---

## 4. BUSINESS LOGIC

### Customer Number Generation

```typescript
async function generateCustomerNumber(tenantId: string): Promise<string> {
  // Get the highest customer number for tenant
  const result = await db.query(`
    SELECT customer_number FROM customers
    WHERE tenant_id = $1
    AND customer_number ~ '^CUS-[0-9]+$'
    ORDER BY customer_number DESC
    LIMIT 1
  `, [tenantId]);

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const currentNumber = result.rows[0].customer_number;
    const numPart = parseInt(currentNumber.split('-')[1]);
    nextNumber = numPart + 1;
  }

  return `CUS-${String(nextNumber).padStart(4, '0')}`;
}
```

### Customer Hierarchy Validation

```typescript
async function validateCustomerHierarchy(
  customerId: string,
  parentCustomerId: string | null
): Promise<void> {
  if (!parentCustomerId) return;

  // Prevent circular references
  let current = parentCustomerId;
  const visited = new Set<string>([customerId]);

  while (current) {
    if (visited.has(current)) {
      throw new Error('Circular parent relationship detected');
    }
    visited.add(current);

    const parent = await db.customers.findById(current);
    if (!parent) {
      throw new Error('Parent customer not found');
    }

    current = parent.parent_customer_id;
  }

  // Prevent more than 3 levels of hierarchy
  if (visited.size > 3) {
    throw new Error('Customer hierarchy cannot exceed 3 levels');
  }
}
```

### Full-Text Search

```typescript
async function searchCustomers(
  tenantId: string,
  searchQuery: string,
  options: SearchOptions
): Promise<SearchResult> {
  const sql = `
    SELECT
      c.*,
      ts_rank(
        to_tsvector('german', coalesce(c.name, '') || ' ' ||
                              coalesce(c.email, '') || ' ' ||
                              coalesce(c.customer_number, '')),
        plainto_tsquery('german', $2)
      ) AS rank
    FROM customers c
    WHERE c.tenant_id = $1
      AND c.deleted_at IS NULL
      AND (
        to_tsvector('german', coalesce(c.name, '') || ' ' ||
                              coalesce(c.email, '') || ' ' ||
                              coalesce(c.customer_number, ''))
        @@ plainto_tsquery('german', $2)
      )
    ORDER BY rank DESC, c.name ASC
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

### Custom Fields Validation

```typescript
import Joi from 'joi';

const customFieldsSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.array(),
    Joi.object()
  )
);

function validateCustomFields(customFields: any): void {
  const { error } = customFieldsSchema.validate(customFields);
  if (error) {
    throw new Error(`Invalid custom fields: ${error.message}`);
  }
}
```

---

## 5. TESTING REQUIREMENTS

### Unit Tests

```typescript
// tests/unit/customer-service.test.ts
describe('CustomerService', () => {
  describe('generateCustomerNumber', () => {
    it('should generate CUS-0001 for first customer', async () => {
      const number = await customerService.generateCustomerNumber('tenant-123');
      expect(number).toBe('CUS-0001');
    });

    it('should increment customer number', async () => {
      await createCustomer({ customer_number: 'CUS-0042' });
      const number = await customerService.generateCustomerNumber('tenant-123');
      expect(number).toBe('CUS-0043');
    });
  });

  describe('validateCustomerHierarchy', () => {
    it('should reject circular parent relationships', async () => {
      const customer1 = await createCustomer();
      const customer2 = await createCustomer({ parent_customer_id: customer1.id });

      await expect(
        customerService.validateCustomerHierarchy(customer1.id, customer2.id)
      ).rejects.toThrow('Circular parent relationship');
    });

    it('should reject hierarchies deeper than 3 levels', async () => {
      const level1 = await createCustomer();
      const level2 = await createCustomer({ parent_customer_id: level1.id });
      const level3 = await createCustomer({ parent_customer_id: level2.id });

      await expect(
        customerService.create({
          name: 'Level 4',
          parent_customer_id: level3.id
        })
      ).rejects.toThrow('hierarchy cannot exceed 3 levels');
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/customers.test.ts
describe('GET /api/v1/customers', () => {
  it('should return paginated list of customers', async () => {
    await createCustomers(75); // Create 75 test customers

    const response = await request(app)
      .get('/api/v1/customers?page=2&limit=50')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(25);
    expect(response.body.pagination.total).toBe(75);
    expect(response.body.pagination.page).toBe(2);
  });

  it('should filter by status', async () => {
    await createCustomer({ status: 'active' });
    await createCustomer({ status: 'inactive' });

    const response = await request(app)
      .get('/api/v1/customers?status=active')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every(c => c.status === 'active')).toBe(true);
  });

  it('should search customers', async () => {
    await createCustomer({ name: 'Acme Corporation' });
    await createCustomer({ name: 'Beta Industries' });

    const response = await request(app)
      .get('/api/v1/customers?search=Acme')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Acme Corporation');
  });
});

describe('POST /api/v1/customers', () => {
  it('should create new customer with generated customer_number', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Company GmbH',
        type: 'business',
        email: 'info@newcompany.de'
      });

    expect(response.status).toBe(201);
    expect(response.body.customer_number).toMatch(/^CUS-\d{4}$/);
  });

  it('should reject duplicate tax_id', async () => {
    await createCustomer({ tax_id: 'DE123456789' });

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Another Company',
        tax_id: 'DE123456789'
      });

    expect(response.status).toBe(409);
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

### Core Models
- [ ] Customer model (ORM entity)
- [ ] Contact model (ORM entity)
- [ ] Location model (ORM entity)
- [ ] Data validation schemas (Joi/Zod)

### API Endpoints
- [ ] GET /customers (list with pagination)
- [ ] GET /customers/:id
- [ ] POST /customers
- [ ] PUT /customers/:id
- [ ] DELETE /customers/:id
- [ ] GET /customers/:id/contacts
- [ ] POST /customers/:id/contacts
- [ ] PUT /contacts/:id
- [ ] DELETE /contacts/:id
- [ ] GET /customers/:id/locations
- [ ] POST /customers/:id/locations
- [ ] PUT /locations/:id
- [ ] DELETE /locations/:id

### Business Logic
- [ ] Customer number generation
- [ ] Customer hierarchy validation
- [ ] Full-text search implementation
- [ ] Custom fields validation
- [ ] Soft-delete implementation

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests
- [ ] Performance tests

### Documentation
- [ ] OpenAPI specification
- [ ] README with setup
- [ ] Environment variables documented

---

## 7. DEFINITION OF DONE

- [ ] All endpoints implemented and tested
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] Customer hierarchy validation working
- [ ] Full-text search functional
- [ ] API documentation complete (OpenAPI)
- [ ] Code review approved
- [ ] Performance: List endpoint < 200ms (p95)
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
    "ioredis": "^5.3.2",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1"
  }
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://psa_app:password@psa-db-master:5432/psa_platform
REDIS_URL=redis://:password@psa-redis:6379
NODE_ENV=production
PORT=3020
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 3 weeks (1-2 developers)
