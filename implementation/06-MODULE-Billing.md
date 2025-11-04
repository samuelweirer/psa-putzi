# Module Implementation Guide: psa-billing

**Module:** Billing & Invoicing
**Phase:** 2 (Core Platform)
**Priority:** P2 (High priority after MVP)
**Port:** 3040
**Dependencies:** psa-auth, psa-tickets, psa-projects, psa-crm, psa-db-master

> **📦 Deployment Note:** For early MVP, this service runs on **Container 200 (psa-all-in-one)** alongside all infrastructure (PostgreSQL, Redis, etc.) and Node.js services, managed by PM2. Everything on localhost. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md) for details.

---

## 1. OVERVIEW

### Purpose
The Billing module handles all financial operations including invoice generation, time entry billing, expense tracking, and integration with accounting systems (DATEV, BMD).

### Key Features
- **Invoice Generation** from time entries and fixed-price items
- **Billing Rate Resolution** (user + customer + contract + service level + work type)
- **Time Entry Billing** with automatic rate calculation
- **Expense Tracking** and reimbursement
- **Recurring Invoices** (monthly contracts, retainers)
- **Invoice Templates** with customization
- **Payment Tracking** and aging reports
- **Tax Calculation** (German/Austrian tax rates)
- **Accounting Integration** (DATEV, BMD NTCS export)
- **Profitability Analysis** (revenue vs. cost)

### Container Specifications
- **Port:** 3040
- **Instances:** 2 (PM2 cluster mode)
- **Memory:** ~2GB per instance
- **CPU:** 2 cores shared

---

## 2. DATABASE SCHEMA

### Tables (from BDUF-Chapter3)

**invoices**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Invoice Details
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'void')),
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Billing Period
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Payment
    payment_terms INTEGER DEFAULT 14,
    payment_method VARCHAR(50),
    payment_date DATE,
    
    -- References
    po_number VARCHAR(100),
    notes TEXT,
    
    -- Export
    exported_to_accounting BOOLEAN DEFAULT false,
    accounting_export_date TIMESTAMP,
    accounting_reference VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer ON invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled', 'void');
```

**invoice_items**
```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item Type
    item_type VARCHAR(50) CHECK (item_type IN ('time_entry', 'fixed_price', 'expense', 'product', 'recurring')),
    
    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    
    -- References
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    
    -- Metadata
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_time_entry ON invoice_items(time_entry_id);
```

**expenses**
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Expense Details
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Billing
    billable BOOLEAN DEFAULT true NOT NULL,
    billed BOOLEAN DEFAULT false NOT NULL,
    markup_percent DECIMAL(5,2) DEFAULT 0,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    
    -- Documentation
    receipt_url VARCHAR(500),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_expenses_tenant ON expenses(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_customer ON expenses(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_billed ON expenses(billed) WHERE deleted_at IS NULL;
```

---

## 3. API SPECIFICATION

### Base URL
`https://api.psa-platform.local/api/v1/billing`

### Invoices Endpoints

#### GET /invoices
**Description:** List invoices with filtering and pagination

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `status` (string): Filter by status (draft, sent, paid, overdue)
- `customer_id` (uuid): Filter by customer
- `from_date` (date): Filter invoices from this date
- `to_date` (date): Filter invoices to this date
- `overdue_only` (boolean): Show only overdue invoices

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "invoice_number": "INV-2025-001",
      "customer_id": "uuid-customer",
      "customer_name": "Acme Corp",
      "invoice_date": "2025-11-01",
      "due_date": "2025-11-15",
      "status": "sent",
      "subtotal": 2400.00,
      "tax_rate": 19.00,
      "tax_amount": 456.00,
      "total_amount": 2856.00,
      "paid_amount": 0.00,
      "payment_terms": 14,
      "billing_period_start": "2025-10-01",
      "billing_period_end": "2025-10-31",
      "created_at": "2025-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "pages": 4
  },
  "summary": {
    "total_outstanding": 125840.50,
    "total_overdue": 12450.00,
    "count_overdue": 8
  }
}
```

---

#### POST /invoices/generate
**Description:** Generate invoice from unbilled time entries and expenses

**Request:**
```json
{
  "customer_id": "uuid-customer",
  "contract_id": "uuid-contract",
  "billing_period_start": "2025-10-01",
  "billing_period_end": "2025-10-31",
  "include_time_entries": true,
  "include_expenses": true,
  "invoice_date": "2025-11-01",
  "due_date": "2025-11-15",
  "payment_terms": 14,
  "notes": "Monthly service for October 2025",
  "grouping": "by_ticket"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-new-invoice",
  "invoice_number": "INV-2025-156",
  "status": "draft",
  "items_count": 45,
  "time_entries_included": 42,
  "expenses_included": 3,
  "subtotal": 4250.00,
  "tax_amount": 807.50,
  "total_amount": 5057.50,
  "preview_url": "https://psa-platform.local/invoices/preview/uuid-new-invoice"
}
```

**Business Logic:**
1. Find all unbilled time entries for customer in billing period
2. Find all unbilled expenses for customer in billing period
3. Group by ticket/project (based on grouping parameter)
4. Create invoice_items for each group
5. Calculate subtotal, tax, total
6. Mark time entries and expenses as billed
7. Generate invoice number
8. Return draft invoice for review

---

#### GET /invoices/:id
**Description:** Get single invoice with all items

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "invoice_number": "INV-2025-001",
  "customer_id": "uuid-customer",
  "customer": {
    "id": "uuid-customer",
    "name": "Acme Corp",
    "address_line1": "Hauptstraße 123",
    "city": "Berlin",
    "postal_code": "10115",
    "tax_id": "DE123456789"
  },
  "invoice_date": "2025-11-01",
  "due_date": "2025-11-15",
  "status": "sent",
  "items": [
    {
      "id": "uuid-item-1",
      "item_type": "time_entry",
      "description": "Ticket #1042 - Email server support (Max Mustermann, 2.5h)",
      "quantity": 2.5,
      "unit_price": 95.00,
      "subtotal": 237.50,
      "tax_rate": 19.00,
      "tax_amount": 45.13,
      "total": 282.63
    },
    {
      "id": "uuid-item-2",
      "item_type": "expense",
      "description": "Server replacement part",
      "quantity": 1,
      "unit_price": 450.00,
      "subtotal": 450.00,
      "tax_rate": 19.00,
      "tax_amount": 85.50,
      "total": 535.50
    }
  ],
  "subtotal": 2400.00,
  "tax_amount": 456.00,
  "total_amount": 2856.00,
  "paid_amount": 0.00,
  "balance_due": 2856.00
}
```

---

#### PUT /invoices/:id/send
**Description:** Mark invoice as sent and send via email

**Request:**
```json
{
  "send_email": true,
  "email_to": ["billing@acme.de"],
  "email_cc": ["accounting@acme.de"],
  "email_subject": "Rechnung INV-2025-001",
  "email_message": "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere Rechnung für Oktober 2025."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "status": "sent",
  "sent_at": "2025-11-01T10:30:00Z",
  "email_sent": true
}
```

---

#### POST /invoices/:id/payment
**Description:** Record payment for invoice

**Request:**
```json
{
  "amount": 2856.00,
  "payment_date": "2025-11-10",
  "payment_method": "bank_transfer",
  "reference": "TRANSFER-2025-1234",
  "notes": "Received via bank transfer"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-123",
  "status": "paid",
  "paid_amount": 2856.00,
  "balance_due": 0.00,
  "payment_date": "2025-11-10"
}
```

---

#### GET /invoices/:id/pdf
**Description:** Generate and download invoice PDF

**Response (200 OK):**
- Content-Type: application/pdf
- Binary PDF file

---

### Time Entry Billing

#### GET /billing/unbilled-time
**Description:** Get unbilled time entries for a customer

**Query Parameters:**
- `customer_id` (uuid): Required
- `from_date` (date): Optional
- `to_date` (date): Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-te-1",
      "ticket_id": "uuid-ticket-123",
      "ticket_number": 1042,
      "ticket_title": "Email server support",
      "user_id": "uuid-user",
      "user_name": "Max Mustermann",
      "date": "2025-10-15",
      "hours": 2.5,
      "description": "Investigated and fixed Exchange server",
      "billing_rate": 95.00,
      "cost_rate": 55.00,
      "amount": 237.50,
      "profit": 100.00
    }
  ],
  "summary": {
    "total_hours": 42.5,
    "total_amount": 4250.00,
    "total_cost": 2337.50,
    "total_profit": 1912.50,
    "margin_percent": 45.0
  }
}
```

---

### Expenses

#### GET /expenses
**Description:** List expenses with filtering

**Query Parameters:**
- `customer_id` (uuid): Filter by customer
- `billed` (boolean): Filter by billed status
- `from_date` (date)
- `to_date` (date)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-expense-1",
      "customer_id": "uuid-customer",
      "ticket_id": "uuid-ticket",
      "date": "2025-10-20",
      "description": "Replacement hard drive for server",
      "category": "hardware",
      "amount": 450.00,
      "tax_amount": 85.50,
      "billable": true,
      "billed": false,
      "markup_percent": 15.0,
      "billing_amount": 517.50,
      "receipt_url": "https://files.psa/receipts/..."
    }
  ]
}
```

---

#### POST /expenses
**Description:** Create new expense

**Request:**
```json
{
  "customer_id": "uuid-customer",
  "ticket_id": "uuid-ticket",
  "date": "2025-10-20",
  "description": "Replacement hard drive",
  "category": "hardware",
  "amount": 450.00,
  "tax_amount": 85.50,
  "billable": true,
  "markup_percent": 15.0,
  "receipt_file": "base64_encoded_file"
}
```

**Response (201 Created)**

---

### Accounting Export

#### GET /accounting/export/datev
**Description:** Export invoices to DATEV format

**Query Parameters:**
- `from_date` (date): Required
- `to_date` (date): Required
- `format` (string): csv or xml (default: csv)

**Response (200 OK):**
- Content-Type: text/csv or application/xml
- DATEV-formatted file for import

---

## 4. BUSINESS LOGIC

### Invoice Number Generation

```typescript
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get highest invoice number for current year
  const result = await db.query(`
    SELECT invoice_number FROM invoices
    WHERE tenant_id = $1
    AND invoice_number ~ '^INV-${year}-[0-9]+$'
    ORDER BY invoice_number DESC
    LIMIT 1
  `, [tenantId]);

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const currentNumber = result.rows[0].invoice_number;
    const numPart = parseInt(currentNumber.split('-')[2]);
    nextNumber = numPart + 1;
  }

  return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
}
```

### Billing Rate Resolution (from time_entries)

```typescript
async function calculateInvoiceFromTimeEntries(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<InvoiceCalculation> {
  // Get all unbilled time entries
  const timeEntries = await db.query(`
    SELECT
      te.*,
      t.ticket_number,
      t.title as ticket_title,
      u.first_name || ' ' || u.last_name as user_name
    FROM time_entries te
    JOIN tickets t ON t.id = te.ticket_id
    JOIN users u ON u.id = te.user_id
    WHERE te.deleted_at IS NULL
      AND te.billed = false
      AND te.billable = true
      AND t.customer_id = $1
      AND te.date BETWEEN $2 AND $3
    ORDER BY te.date, t.ticket_number
  `, [customerId, startDate, endDate]);

  // Group by ticket
  const grouped = groupBy(timeEntries.rows, 'ticket_id');

  const items: InvoiceItem[] = [];
  let subtotal = 0;

  for (const [ticketId, entries] of Object.entries(grouped)) {
    const ticket = entries[0];
    const totalHours = sum(entries.map(e => e.hours));
    const totalAmount = sum(entries.map(e => e.hours * e.billing_rate));

    // Create single line item per ticket
    items.push({
      item_type: 'time_entry',
      description: `Ticket #${ticket.ticket_number} - ${ticket.ticket_title}\n` +
                   entries.map(e => `  ${e.user_name}: ${e.hours}h @ €${e.billing_rate}/h`).join('\n'),
      quantity: totalHours,
      unit_price: totalAmount / totalHours, // Average rate
      subtotal: totalAmount,
      tax_rate: 19.00,
      tax_amount: totalAmount * 0.19,
      total: totalAmount * 1.19,
      time_entry_ids: entries.map(e => e.id)
    });

    subtotal += totalAmount;
  }

  const taxAmount = subtotal * 0.19;
  const total = subtotal + taxAmount;

  return {
    items,
    subtotal,
    taxAmount,
    total,
    timeEntryCount: timeEntries.rows.length
  };
}
```

### Invoice Status Management

```typescript
async function updateInvoiceStatus(invoiceId: string): Promise<void> {
  const invoice = await db.invoices.findById(invoiceId);

  // Check if paid
  if (invoice.paid_amount >= invoice.total_amount) {
    await db.invoices.update(invoiceId, {
      status: 'paid',
      payment_date: new Date()
    });
    return;
  }

  // Check if overdue
  if (invoice.status === 'sent' && new Date() > invoice.due_date) {
    await db.invoices.update(invoiceId, {
      status: 'overdue'
    });
  }
}

// Run daily to update invoice statuses
async function updateAllInvoiceStatuses(): Promise<void> {
  const invoices = await db.query(`
    SELECT id FROM invoices
    WHERE status IN ('sent', 'overdue')
    AND deleted_at IS NULL
  `);

  for (const invoice of invoices.rows) {
    await updateInvoiceStatus(invoice.id);
  }
}
```

### DATEV Export Format

```typescript
interface DATEVInvoice {
  Umsatz: number;            // Amount including tax
  'Soll/Haben-Kennzeichen': 'S' | 'H';  // Debit/Credit
  'WKZ Umsatz': string;      // Currency code
  Kurs: number;              // Exchange rate
  'Basis-Umsatz': number;    // Amount excluding tax
  'WKZ Basis-Umsatz': string;
  Konto: string;             // Account number
  Gegenkonto: string;        // Counter account
  'BU-Schlüssel': string;    // Posting key
  Belegdatum: string;        // Document date (DDMM)
  Belegfeld1: string;        // Reference 1 (invoice number)
  Buchungstext: string;      // Posting text
  'Festschreibung': number;
  'Leistungsdatum': string;  // Service date (DDMM)
  'Sachverhalt L+L': string;
  'EU-Land u. UStID': string;
}

function exportToDATEV(invoices: Invoice[]): string {
  const rows: DATEVInvoice[] = invoices.map(inv => ({
    Umsatz: inv.total_amount,
    'Soll/Haben-Kennzeichen': 'S',
    'WKZ Umsatz': 'EUR',
    Kurs: 1.0,
    'Basis-Umsatz': inv.subtotal,
    'WKZ Basis-Umsatz': 'EUR',
    Konto: '8400',  // Revenue account
    Gegenkonto: inv.customer.account_number || '10000',
    'BU-Schlüssel': '1',
    Belegdatum: format(inv.invoice_date, 'DDMM'),
    Belegfeld1: inv.invoice_number,
    Buchungstext: `Rechnung ${inv.customer.name}`,
    'Festschreibung': 0,
    'Leistungsdatum': format(inv.billing_period_end, 'DDMM'),
    'Sachverhalt L+L': '',
    'EU-Land u. UStID': ''
  }));

  // Convert to CSV with proper DATEV format
  return convertToCSV(rows, DATEVColumns);
}
```

---

## 5. TESTING REQUIREMENTS

### Unit Tests

```typescript
describe('Invoice Generation', () => {
  it('should generate invoice from time entries', async () => {
    const customerId = await createCustomer();
    const ticketId = await createTicket({ customer_id: customerId });
    await createTimeEntry({
      ticket_id: ticketId,
      hours: 2.5,
      billing_rate: 95.00,
      billed: false
    });

    const invoice = await invoiceService.generateInvoice({
      customer_id: customerId,
      billing_period_start: '2025-10-01',
      billing_period_end: '2025-10-31'
    });

    expect(invoice.items).toHaveLength(1);
    expect(invoice.subtotal).toBe(237.50);
    expect(invoice.tax_amount).toBe(45.13);
    expect(invoice.total_amount).toBe(282.63);
  });

  it('should mark time entries as billed', async () => { /* ... */ });
  it('should calculate tax correctly', async () => { /* ... */ });
  it('should generate sequential invoice numbers', async () => { /* ... */ });
});

describe('Billing Rate Resolution', () => {
  it('should use customer-specific rate when available', async () => { /* ... */ });
  it('should fall back to contract rate', async () => { /* ... */ });
  it('should fall back to user default rate', async () => { /* ... */ });
});
```

---

## 6. IMPLEMENTATION CHECKLIST

### Setup
- [ ] Initialize TypeScript project
- [ ] Install dependencies
- [ ] Configure database connection

### Core Features
- [ ] Invoice CRUD operations
- [ ] Invoice number generation
- [ ] Invoice generation from time entries
- [ ] Invoice generation from expenses
- [ ] Time entry billing logic
- [ ] Expense billing logic
- [ ] Tax calculation
- [ ] Payment recording
- [ ] Status management (draft → sent → paid/overdue)

### API Endpoints
- [ ] GET /invoices
- [ ] GET /invoices/:id
- [ ] POST /invoices/generate
- [ ] PUT /invoices/:id
- [ ] DELETE /invoices/:id
- [ ] PUT /invoices/:id/send
- [ ] POST /invoices/:id/payment
- [ ] GET /invoices/:id/pdf
- [ ] GET /billing/unbilled-time
- [ ] GET /expenses
- [ ] POST /expenses
- [ ] GET /accounting/export/datev

### PDF Generation
- [ ] Invoice template design
- [ ] PDF generation library (PDFKit or similar)
- [ ] Logo and branding
- [ ] Multi-language support (German/English)

### Accounting Integration
- [ ] DATEV CSV export
- [ ] BMD NTCS export format
- [ ] Export validation

### Testing
- [ ] Unit tests (≥80% coverage)
- [ ] Integration tests
- [ ] Invoice generation tests
- [ ] DATEV export validation

---

## 7. DEFINITION OF DONE

- [ ] All endpoints implemented
- [ ] Invoice generation from time entries working
- [ ] Invoice generation from expenses working
- [ ] PDF generation functional
- [ ] DATEV export working
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] API documentation (OpenAPI)
- [ ] Performance: Invoice generation < 2s (p95)
- [ ] Manual QA completed

---

## 8. DEPENDENCIES & LIBRARIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "joi": "^17.11.0",
    "pdfkit": "^0.14.0",
    "csv-stringify": "^6.4.5",
    "date-fns": "^2.30.0"
  }
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://psa_app:password@127.0.0.1:5432/psa_platform
NODE_ENV=production
PORT=3040

# Tax Settings
DEFAULT_TAX_RATE=19.00
TAX_ID_PREFIX=DE

# Invoice Settings
INVOICE_PREFIX=INV
INVOICE_DUE_DAYS=14
INVOICE_LOGO_URL=https://psa-platform.local/logo.png

# DATEV Export
DATEV_CONSULTANT_NUMBER=12345
DATEV_CLIENT_NUMBER=67890
DATEV_FISCAL_YEAR_BEGIN=01
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 4 weeks (1-2 developers)
