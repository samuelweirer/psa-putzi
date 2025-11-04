# Module Implementation Guide: psa-reports

**Module:** Reports & Analytics
**Phase:** 2 (Core Platform)
**Priority:** P2
**Port:** 3070
**Dependencies:** psa-auth, ALL other modules

> **📦 Deployment Note:** Runs on **Container 200** with other services. See [00-DEPLOYMENT-STRATEGY.md](00-DEPLOYMENT-STRATEGY.md).

---

## 1. OVERVIEW

### Purpose
Generate business intelligence reports, dashboards, KPIs, and custom analytics for MSP operations.

### Key Features
- Pre-built report templates
- Custom report builder
- Dashboard with KPIs
- Real-time metrics
- Scheduled reports (email delivery)
- Export to PDF, Excel, CSV
- Charts and visualizations
- Profitability analysis
- SLA compliance reports
- Customer health scores

---

## 2. REPORT CATEGORIES

### 1. Ticket Reports
- Ticket volume by period
- SLA compliance rate
- Average response/resolution time
- Tickets by customer/priority/category
- Technician performance
- First-call resolution rate

### 2. Time & Billing Reports
- Billable vs. non-billable hours
- Revenue by customer/technician/service type
- Profitability analysis (revenue - cost)
- Unbilled time entries
- Billing rate utilization
- Time entry trends

### 3. Project Reports
- Project status overview
- Budget vs. actual (all projects)
- Project profitability
- Resource utilization
- Project timeline (Gantt)
- Milestone completion rate

### 4. Financial Reports
- Revenue by month/quarter/year
- Outstanding invoices (AR aging)
- Payment trends
- Customer lifetime value
- Contract renewal forecast
- Revenue recognition

### 5. Asset Reports
- Asset inventory by customer/type
- License compliance
- Warranty expiration
- Asset depreciation
- Software audit

### 6. Customer Reports
- Customer health score
- Customer satisfaction (CSAT)
- Customer activity timeline
- Service consumption
- Contract status
- Upsell opportunities

---

## 3. API ENDPOINTS

### Dashboard
- **GET /reports/dashboard** - Main dashboard with KPIs

### Pre-built Reports
- **GET /reports/tickets/volume** - Ticket volume report
- **GET /reports/tickets/sla** - SLA compliance report
- **GET /reports/billing/revenue** - Revenue report
- **GET /reports/billing/profitability** - Profitability analysis
- **GET /reports/projects/status** - Project status report
- **GET /reports/financial/ar-aging** - AR aging report
- **GET /reports/assets/inventory** - Asset inventory
- **GET /reports/customers/health** - Customer health scores

### Custom Reports
- **POST /reports/custom** - Generate custom report
- **GET /reports/custom/:id** - Get saved custom report
- **PUT /reports/custom/:id** - Update custom report
- **DELETE /reports/custom/:id** - Delete custom report

### Export
- **GET /reports/:id/export/pdf** - Export to PDF
- **GET /reports/:id/export/excel** - Export to Excel
- **GET /reports/:id/export/csv** - Export to CSV

### Scheduled Reports
- **POST /reports/schedule** - Schedule recurring report
- **GET /reports/schedule** - List scheduled reports
- **DELETE /reports/schedule/:id** - Cancel scheduled report

---

## 4. EXAMPLE API RESPONSES

### Dashboard KPIs
```json
{
  "period": "last_30_days",
  "tickets": {
    "total": 342,
    "open": 45,
    "closed": 297,
    "sla_compliance_rate": 94.5,
    "avg_response_time_hours": 1.2,
    "avg_resolution_time_hours": 4.8
  },
  "billing": {
    "total_revenue": 125840.50,
    "billable_hours": 1245.5,
    "non_billable_hours": 142.0,
    "billing_rate_avg": 101.05,
    "profitability_margin": 42.3
  },
  "projects": {
    "active": 12,
    "on_track": 9,
    "at_risk": 2,
    "overdue": 1,
    "completion_avg": 67.5
  },
  "customers": {
    "total_active": 87,
    "health_score_avg": 8.2,
    "churn_risk_count": 3,
    "upsell_opportunities": 12
  }
}
```

### Revenue Report
```json
{
  "report_type": "revenue_by_month",
  "period": {
    "start": "2025-01-01",
    "end": "2025-10-31"
  },
  "data": [
    {
      "month": "2025-01",
      "revenue": 112450.00,
      "cost": 64820.00,
      "profit": 47630.00,
      "margin_percent": 42.4,
      "billable_hours": 1142.5,
      "invoices_count": 42
    },
    {
      "month": "2025-02",
      "revenue": 98320.00,
      "cost": 56890.00,
      "profit": 41430.00,
      "margin_percent": 42.1,
      "billable_hours": 998.0,
      "invoices_count": 38
    }
    // ... more months
  ],
  "totals": {
    "total_revenue": 1125480.00,
    "total_cost": 648900.00,
    "total_profit": 476580.00,
    "average_margin": 42.3
  }
}
```

---

## 5. KEY BUSINESS LOGIC

### SLA Compliance Calculation
```typescript
async function calculateSLACompliance(
  startDate: Date,
  endDate: Date
): Promise<SLAComplianceReport> {
  const result = await db.query(`
    SELECT
      COUNT(*) as total_tickets,
      COUNT(*) FILTER (WHERE sla_breached = false) as compliant_tickets,
      COUNT(*) FILTER (WHERE sla_breached = true) as breached_tickets,
      AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/3600) as avg_response_hours,
      AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) 
        FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
    FROM tickets
    WHERE created_at BETWEEN $1 AND $2
    AND deleted_at IS NULL
  `, [startDate, endDate]);

  const row = result.rows[0];
  const complianceRate = row.total_tickets > 0
    ? (row.compliant_tickets / row.total_tickets) * 100
    : 0;

  return {
    totalTickets: parseInt(row.total_tickets),
    compliantTickets: parseInt(row.compliant_tickets),
    breachedTickets: parseInt(row.breached_tickets),
    complianceRate: Math.round(complianceRate * 10) / 10,
    avgResponseHours: Math.round(parseFloat(row.avg_response_hours) * 10) / 10,
    avgResolutionHours: Math.round(parseFloat(row.avg_resolution_hours) * 10) / 10
  };
}
```

### Customer Health Score
```typescript
interface CustomerHealthScore {
  customerId: string;
  score: number; // 0-10
  factors: {
    ticketVolume: number;
    slaCompliance: number;
    paymentHistory: number;
    engagement: number;
  };
  risk: 'low' | 'medium' | 'high';
}

async function calculateCustomerHealth(customerId: string): Promise<CustomerHealthScore> {
  // Ticket volume factor (lower is better)
  const ticketCount = await getTicketCount(customerId, 'last_90_days');
  const ticketFactor = Math.max(0, 10 - (ticketCount / 10));

  // SLA compliance factor
  const slaCompliance = await getSLACompliance(customerId);
  const slaFactor = (slaCompliance / 100) * 10;

  // Payment history factor
  const overdueInvoices = await getOverdueInvoices(customerId);
  const paymentFactor = overdueInvoices === 0 ? 10 : Math.max(0, 10 - overdueInvoices);

  // Engagement factor (portal usage, response to surveys)
  const engagementScore = await getEngagementScore(customerId);

  // Weighted average
  const score = (
    ticketFactor * 0.3 +
    slaFactor * 0.3 +
    paymentFactor * 0.2 +
    engagementScore * 0.2
  );

  let risk: 'low' | 'medium' | 'high';
  if (score >= 7) risk = 'low';
  else if (score >= 4) risk = 'medium';
  else risk = 'high';

  return {
    customerId,
    score: Math.round(score * 10) / 10,
    factors: {
      ticketVolume: ticketFactor,
      slaCompliance: slaFactor,
      paymentHistory: paymentFactor,
      engagement: engagementScore
    },
    risk
  };
}
```

### Profitability Analysis
```typescript
async function analyzeProfitability(
  groupBy: 'customer' | 'project' | 'technician',
  period: DateRange
): Promise<ProfitabilityReport[]> {
  let groupColumn: string;
  let nameColumn: string;

  if (groupBy === 'customer') {
    groupColumn = 'c.id';
    nameColumn = 'c.name';
  } else if (groupBy === 'project') {
    groupColumn = 'p.id';
    nameColumn = 'p.name';
  } else { // technician
    groupColumn = 'u.id';
    nameColumn = "u.first_name || ' ' || u.last_name";
  }

  const query = `
    SELECT
      ${groupColumn} as group_id,
      ${nameColumn} as group_name,
      SUM(te.hours) as total_hours,
      SUM(te.hours * te.billing_rate) as revenue,
      SUM(te.hours * te.cost_rate) as cost,
      SUM(te.hours * (te.billing_rate - te.cost_rate)) as profit,
      ROUND(100.0 * SUM(te.hours * (te.billing_rate - te.cost_rate)) /
            NULLIF(SUM(te.hours * te.billing_rate), 0), 2) as margin_percent
    FROM time_entries te
    -- appropriate joins based on groupBy
    WHERE te.date BETWEEN $1 AND $2
    AND te.deleted_at IS NULL
    AND te.billable = true
    GROUP BY ${groupColumn}, ${nameColumn}
    ORDER BY profit DESC
  `;

  const result = await db.query(query, [period.start, period.end]);
  return result.rows;
}
```

---

## 6. CHART DATA FORMATS

### Time Series (Line/Area Charts)
```json
{
  "chart_type": "line",
  "series": [
    {
      "name": "Revenue",
      "data": [
        { "x": "2025-01", "y": 112450 },
        { "x": "2025-02", "y": 98320 }
      ]
    },
    {
      "name": "Cost",
      "data": [
        { "x": "2025-01", "y": 64820 },
        { "x": "2025-02", "y": 56890 }
      ]
    }
  ]
}
```

### Pie/Donut Charts
```json
{
  "chart_type": "pie",
  "data": [
    { "label": "Open", "value": 45, "color": "#3B82F6" },
    { "label": "In Progress", "value": 78, "color": "#F59E0B" },
    { "label": "Resolved", "value": 156, "color": "#10B981" },
    { "label": "Closed", "value": 297, "color": "#6B7280" }
  ]
}
```

---

## 7. PDF GENERATION

```typescript
import PDFDocument from 'pdfkit';

async function generateReportPDF(reportData: any): Promise<Buffer> {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on('data', buffers.push.bind(buffers));

  // Header
  doc.fontSize(20).text('PSA-Platform Report', { align: 'center' });
  doc.moveDown();

  // Report content
  doc.fontSize(12).text(`Report Type: ${reportData.type}`);
  doc.text(`Period: ${reportData.period.start} to ${reportData.period.end}`);
  doc.moveDown();

  // Table
  for (const row of reportData.data) {
    doc.text(`${row.label}: ${row.value}`);
  }

  doc.end();

  return Buffer.concat(buffers);
}
```

---

## 8. SCHEDULED REPORTS

```typescript
interface ScheduledReport {
  id: string;
  reportType: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  enabled: boolean;
}

// Run by cron job
async function executeScheduledReports(): Promise<void> {
  const schedules = await db.query(`
    SELECT * FROM scheduled_reports
    WHERE enabled = true
    AND next_run_at <= NOW()
  `);

  for (const schedule of schedules.rows) {
    try {
      const report = await generateReport(schedule.report_type, schedule.parameters);
      const file = await exportReport(report, schedule.format);

      await sendEmail({
        to: schedule.recipients,
        subject: `Scheduled Report: ${schedule.report_name}`,
        body: 'Please find the attached report.',
        attachments: [{ filename: `report.${schedule.format}`, content: file }]
      });

      // Update next run time
      await db.query(`
        UPDATE scheduled_reports
        SET next_run_at = next_run_at + INTERVAL '${schedule.interval}'
        WHERE id = $1
      `, [schedule.id]);
    } catch (error) {
      logger.error(`Failed to execute scheduled report ${schedule.id}:`, error);
    }
  }
}
```

---

## 9. IMPLEMENTATION CHECKLIST

- [ ] Dashboard API with real-time KPIs
- [ ] 10+ pre-built report templates
- [ ] SLA compliance calculations
- [ ] Profitability analysis
- [ ] Customer health score
- [ ] Chart data generation
- [ ] PDF export (PDFKit)
- [ ] Excel export (xlsx)
- [ ] CSV export
- [ ] Scheduled reports (cron)
- [ ] Email delivery
- [ ] Unit tests (≥80% coverage)
- [ ] API documentation

---

## 10. DEFINITION OF DONE

- [ ] Dashboard API functional
- [ ] All pre-built reports working
- [ ] PDF/Excel/CSV export working
- [ ] Scheduled reports functional
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation complete
- [ ] Performance: Report generation < 5s (p95)

---

## 11. DEPENDENCIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "pdfkit": "^0.14.0",
    "xlsx": "^0.18.5",
    "csv-stringify": "^6.4.5",
    "date-fns": "^2.30.0",
    "node-cron": "^3.0.3"
  }
}
```

---

**Last Updated:** 2025-11-04
**Estimated Effort:** 4 weeks (1-2 developers)
