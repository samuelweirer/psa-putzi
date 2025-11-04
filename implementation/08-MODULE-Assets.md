# Module Implementation Guide: psa-assets

**Module:** Asset & License Management
**Phase:** 2 (Core Platform)
**Priority:** P2
**Port:** 3060
**Dependencies:** psa-auth, psa-crm, psa-db-master

> **📦 Deployment Note:** Runs on **Container 200** with other services. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md).

---

## 1. OVERVIEW

### Purpose
Track IT assets, software licenses, warranties, and maintenance contracts for customer environments.

### Key Features
- Asset tracking (hardware, software, network devices)
- License management and compliance
- Warranty tracking
- Maintenance schedules
- Asset lifecycle management
- QR code generation for physical assets
- Integration with RMM tools (Datto, N-able, Kaseya)
- Integration with CMDB (i-doit)
- Asset audit reports
- Depreciation calculation

---

## 2. DATABASE SCHEMA

**assets** - From BDUF-Chapter3
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    location_id UUID REFERENCES locations(id),
    
    -- Asset Details
    asset_tag VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) CHECK (asset_type IN ('server', 'workstation', 'laptop', 'mobile', 'network_device', 'printer', 'other')),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen')),
    
    -- Purchase Info
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    
    -- Warranty
    warranty_expiry_date DATE,
    warranty_provider VARCHAR(255),
    
    -- Technical Details
    specifications JSONB DEFAULT '{}',
    ip_address INET,
    mac_address MACADDR,
    
    -- Assignment
    assigned_to_user VARCHAR(255),
    assigned_date DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_assets_customer ON assets(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON assets(asset_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
```

**licenses**
```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- License Details
    software_name VARCHAR(255) NOT NULL,
    license_key VARCHAR(500),
    license_type VARCHAR(50) CHECK (license_type IN ('perpetual', 'subscription', 'trial', 'oem')),
    
    -- Quantity
    seats_total INTEGER NOT NULL CHECK (seats_total > 0),
    seats_used INTEGER DEFAULT 0,
    
    -- Dates
    purchase_date DATE,
    expiry_date DATE,
    renewal_date DATE,
    
    -- Financial
    cost_per_seat DECIMAL(10,2),
    annual_cost DECIMAL(12,2),
    
    -- Vendor
    vendor VARCHAR(255),
    vendor_contact VARCHAR(255),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_licenses_customer ON licenses(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_licenses_expiry ON licenses(expiry_date) WHERE deleted_at IS NULL;
```

---

## 3. API ENDPOINTS

### Assets
- **GET /assets** - List assets with filters (customer, type, status)
- **POST /assets** - Create asset
- **GET /assets/:id** - Get asset details
- **PUT /assets/:id** - Update asset
- **DELETE /assets/:id** - Soft delete
- **GET /assets/:id/qrcode** - Generate QR code for asset tag
- **GET /assets/:id/history** - Get asset history (assignments, maintenance)

### Licenses
- **GET /licenses** - List licenses
- **POST /licenses** - Create license
- **GET /licenses/:id** - Get license details
- **PUT /licenses/:id** - Update license
- **DELETE /licenses/:id** - Soft delete
- **GET /licenses/expiring** - Get licenses expiring soon (30/60/90 days)
- **GET /licenses/compliance** - Check license compliance (seats used vs. available)

### Reports
- **GET /assets/reports/audit** - Asset audit report
- **GET /assets/reports/warranties** - Warranty expiration report
- **GET /assets/reports/depreciation** - Depreciation report
- **GET /licenses/reports/renewal** - License renewal forecast

---

## 4. KEY BUSINESS LOGIC

### Asset Tag Generation
```typescript
async function generateAssetTag(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db.query(`
    SELECT asset_tag FROM assets
    WHERE tenant_id = $1
    AND asset_tag ~ '^ASSET-${year}-[0-9]+$'
    ORDER BY asset_tag DESC LIMIT 1
  `, [tenantId]);

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const current = result.rows[0].asset_tag;
    nextNumber = parseInt(current.split('-')[2]) + 1;
  }

  return `ASSET-${year}-${String(nextNumber).padStart(4, '0')}`;
}
```

### License Compliance Check
```typescript
async function checkLicenseCompliance(licenseId: string): Promise<{
  isCompliant: boolean;
  seatsTotal: number;
  seatsUsed: number;
  seatsAvailable: number;
  overagePercent: number;
}> {
  const license = await db.licenses.findById(licenseId);
  
  const seatsAvailable = license.seats_total - license.seats_used;
  const overagePercent = license.seats_total > 0
    ? ((license.seats_used - license.seats_total) / license.seats_total) * 100
    : 0;

  return {
    isCompliant: license.seats_used <= license.seats_total,
    seatsTotal: license.seats_total,
    seatsUsed: license.seats_used,
    seatsAvailable: Math.max(0, seatsAvailable),
    overagePercent: Math.max(0, overagePercent)
  };
}
```

### Warranty Expiration Alerts
```typescript
async function getExpiringWarranties(days: number = 30): Promise<Asset[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return db.query(`
    SELECT a.*, c.name as customer_name
    FROM assets a
    JOIN customers c ON c.id = a.customer_id
    WHERE a.warranty_expiry_date IS NOT NULL
      AND a.warranty_expiry_date <= $1
      AND a.warranty_expiry_date >= CURRENT_DATE
      AND a.deleted_at IS NULL
      AND a.status = 'active'
    ORDER BY a.warranty_expiry_date ASC
  `, [cutoffDate]);
}
```

---

## 5. INTEGRATIONS

### RMM Integration (Datto/N-able/Kaseya)
```typescript
// Sync assets from RMM
async function syncFromRMM(customerId: string): Promise<void> {
  const rmmClient = getRMMClient(); // Based on customer config
  const devices = await rmmClient.getDevices(customerId);

  for (const device of devices) {
    await upsertAsset({
      customer_id: customerId,
      name: device.hostname,
      asset_type: device.type,
      serial_number: device.serialNumber,
      ip_address: device.ipAddress,
      mac_address: device.macAddress,
      specifications: device.specs,
      source: 'rmm_sync'
    });
  }
}
```

### i-doit CMDB Integration
```typescript
// Export to i-doit
async function exportToIdoit(assetId: string): Promise<void> {
  const asset = await db.assets.findById(assetId);
  const idoitClient = getIdoitClient();

  await idoitClient.createOrUpdateObject({
    type: asset.asset_type,
    title: asset.name,
    category: {
      model: asset.model,
      manufacturer: asset.manufacturer,
      serialNumber: asset.serial_number,
      location: asset.location_id
    }
  });
}
```

---

## 6. TESTING

### Unit Tests
```typescript
describe('Asset Management', () => {
  it('should generate sequential asset tags', async () => { /* ... */ });
  it('should detect license overage', async () => { /* ... */ });
  it('should find expiring warranties', async () => { /* ... */ });
});
```

---

## 7. IMPLEMENTATION CHECKLIST

- [ ] Asset CRUD operations
- [ ] License CRUD operations
- [ ] Asset tag generation
- [ ] QR code generation
- [ ] License compliance checking
- [ ] Warranty expiration alerts
- [ ] RMM integration (at least one provider)
- [ ] Unit tests (≥80% coverage)
- [ ] API documentation

---

## 8. DEFINITION OF DONE

- [ ] All endpoints implemented
- [ ] RMM sync working
- [ ] License compliance checks functional
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation complete
- [ ] Performance: Asset list < 300ms

---

**Last Updated:** 2025-11-04
**Estimated Effort:** 3 weeks (1-2 developers)
