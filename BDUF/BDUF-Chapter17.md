# Big Design Up Front (BDUF) - Kapitel 17
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Kapitel:** 17 - Performance Benchmarks

---

## 17. PERFORMANCE BENCHMARKS

### 17.1 Response-Zeit Anforderungen

#### API-Operationen

| Operation | Zielwert (p95) | Maxim

al | Kritisch |
|-----------|----------------|--------|----------|
| API-Call (einfach) | < 100ms | < 500ms | > 1s |
| Ticket-Ansicht | < 200ms | < 1s | > 2s |
| Dashboard-Load | < 500ms | < 2s | > 5s |
| Report-Generierung | < 5s | < 30s | > 60s |
| Knowledge Base Suche | < 300ms | < 1.5s | > 3s |
| Bulk-Import (100 Assets) | < 10s | < 60s | > 120s |

#### Datenbankoperationen

| Operation | Zielwert | Maximal | Kritisch |
|-----------|----------|---------|----------|
| Simple SELECT | < 10ms | < 50ms | > 100ms |
| JOIN (2-3 Tabellen) | < 50ms | < 200ms | > 500ms |
| Complex Query | < 100ms | < 500ms | > 1s |
| INSERT | < 20ms | < 100ms | > 500ms |
| UPDATE | < 30ms | < 150ms | > 500ms |
| Full-Text Search | < 100ms | < 500ms | > 1s |

---

### 17.2 Durchsatz-Anforderungen

#### API-Durchsatz

| Metrik | Single Node | 3-Node Cluster | Enterprise |
|--------|-------------|----------------|------------|
| API Requests/s | 1.000 | 3.000 | 10.000+ |
| Concurrent Users | 100 | 500 | 2.000+ |
| Tickets/Tag | 2.500 | 10.000 | 50.000+ |
| DB Queries/s | 1.000 | 5.000 | 20.000+ |

#### Datenbank-Performance

```sql
-- Performance-Messung: Simple SELECT
EXPLAIN ANALYZE
SELECT * FROM tickets WHERE customer_id = 'uuid-123' LIMIT 100;
-- Ziel: < 10ms

-- Performance-Messung: Complex Query mit JOIN
EXPLAIN ANALYZE
SELECT
    t.id, t.title, c.name, u.first_name, u.last_name,
    COUNT(te.id) as time_entries_count,
    SUM(te.hours * te.billing_rate) as revenue
FROM tickets t
JOIN customers c ON t.customer_id = c.id
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN time_entries te ON te.ticket_id = t.id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, c.name, u.first_name, u.last_name
ORDER BY t.created_at DESC
LIMIT 100;
-- Ziel: < 100ms
```

---

### 17.3 Skalierungsgrenzen

#### Plattform-Kapazität

| Metrik | Single Node | 3-Node Cluster | Enterprise (10+ Nodes) |
|--------|-------------|----------------|------------------------|
| **Mandanten** | 50 | 200 | 1.000+ |
| **Techniker/User** | 100 | 500 | 2.000+ |
| **Tickets/Jahr** | 50.000 | 250.000 | 1M+ |
| **Assets** | 10.000 | 50.000 | 200.000+ |
| **Storage** | 500 GB | 5 TB | 50 TB+ |
| **RAM** | 32 GB | 128 GB | 512 GB+ |
| **CPU Cores** | 16 | 48 | 192+ |

#### Ressourcen pro Container

| Container | CPU (Cores) | RAM | Storage | Skalierung |
|-----------|-------------|-----|---------|------------|
| psa-api-gateway | 2-4 | 4 GB | 10 GB | Horizontal |
| psa-crm | 2 | 4 GB | 20 GB | Horizontal |
| psa-tickets | 4 | 8 GB | 50 GB | Horizontal |
| psa-billing | 2 | 4 GB | 20 GB | Horizontal |
| psa-db-master | 8 | 32 GB | 500 GB | Vertical + Read Replicas |
| psa-redis | 2 | 4 GB | 10 GB | Horizontal (Cluster) |
| psa-elasticsearch | 4 | 16 GB | 200 GB | Horizontal |
| psa-rabbitmq | 2 | 4 GB | 20 GB | Horizontal (Cluster) |

---

### 17.4 Load-Test-Szenarien

#### Szenario 1: Normaler Arbeitstag

**Profil:**
- 500 gleichzeitige Benutzer
- 8:00-18:00 Uhr (Peak-Zeit)
- 2.000 API-Requests/min
- 500 Ticket-Updates/Stunde
- 200 neue Tickets/Tag

**Performance-Ziele:**
- API Response Time (p95): < 200ms
- Error Rate: < 0.1%
- Server CPU: < 70%
- Server RAM: < 80%

**JMeter Test-Plan:**
```xml
<ThreadGroup>
    <numThreads>500</numThreads>
    <rampUp>300</rampUp> <!-- 5 Minuten -->
    <duration>28800</duration> <!-- 8 Stunden -->
</ThreadGroup>
```

#### Szenario 2: Monatsend-Abrechnung

**Profil:**
- 50 gleichzeitige Billing-Admins
- Massenhafte Rechnungserstellung
- 10.000 Zeiteinträge verarbeiten
- 1.000 Rechnungen generieren

**Performance-Ziele:**
- Rechnungserstellung: < 5s pro Rechnung
- Batch-Processing: 100 Rechnungen/min
- Error Rate: < 0.01%

**Test-Kommando:**
```bash
# Gatling Load Test
gatling.sh -s BillingLoadTest \
  -rf reports/billing-load-$(date +%Y%m%d) \
  -rd "Monthly Billing Load Test"
```

#### Szenario 3: Major Incident (Spike)

**Profil:**
- 200 Techniker gleichzeitig online
- 50 Tickets/Minute erstellt
- 500 Kommentare/Minute
- Hohe Last auf Ticket-System

**Performance-Ziele:**
- Ticket-Erstellung: < 500ms
- System bleibt responsiv
- Keine Downtime
- Graceful Degradation bei Overload

---

### 17.5 Benchmark-Tests

#### Baseline Performance Test

**Durchführung:** Vor jedem Major Release

**Testsuite:**
```bash
#!/bin/bash
# Performance Baseline Test

echo "=== API Performance Baseline ==="
ab -n 10000 -c 100 https://api.psa-platform.local/api/v1/tickets
ab -n 5000 -c 50 https://api.psa-platform.local/api/v1/customers
ab -n 2000 -c 20 https://api.psa-platform.local/api/v1/reports/dashboard

echo "=== Database Performance ==="
pgbench -i -s 100 psa_platform
pgbench -c 50 -j 4 -T 300 psa_platform

echo "=== Redis Performance ==="
redis-benchmark -h psa-redis -p 6379 -n 100000 -c 50

echo "=== Elasticsearch Performance ==="
esrally race --track=http_logs --target-hosts=psa-elasticsearch:9200
```

**Akzeptanzkriterien:**
- API p95 < 200ms
- pgbench TPS > 500
- Redis ops/sec > 50.000
- Elasticsearch query latency < 500ms

#### Regression Test

**Vor/Nach jedem Release:**
```javascript
// Playwright Performance Test
import { test, expect } from '@playwright/test';

test('Ticket Dashboard Load Performance', async ({ page }) => {
  await page.goto('https://psa-platform.local/tickets');

  const startTime = Date.now();
  await page.waitForSelector('.ticket-table');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(2000); // < 2s

  // Core Web Vitals
  const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
  console.log('Performance Metrics:', metrics);
});
```

---

### 17.6 Performance-Monitoring

#### Key Performance Indicators (KPIs)

**Echtzeit-Monitoring:**
```prometheus
# API Response Time (p95)
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
) < 0.2

# Error Rate
rate(http_requests_total{status=~"5.."}[5m]) < 0.001

# Database Query Time
histogram_quantile(0.95,
  rate(pg_query_duration_seconds_bucket[5m])
) < 0.1

# CPU Usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) < 70

# Memory Usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
  / node_memory_MemTotal_bytes * 100 < 80
```

#### Alerting-Regeln

**Zabbix Triggers:**
```yaml
- name: "High API Response Time"
  expression: "avg(/api-gateway/http.response_time,5m) > 500ms"
  severity: Warning

- name: "Critical API Response Time"
  expression: "avg(/api-gateway/http.response_time,5m) > 1000ms"
  severity: High

- name: "Database Connection Pool Exhausted"
  expression: "last(/postgres/pg.connections_active) / last(/postgres/pg.connections_max) > 0.9"
  severity: Critical
```

---

### 17.7 Performance-Optimierungen

#### Database Tuning

**PostgreSQL-Konfiguration:**
```ini
# postgresql.conf
max_connections = 500
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200
work_mem = 20MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

#### API-Caching

**Redis-Caching-Strategie:**
```javascript
// Cache-aside Pattern
async function getCustomer(customerId) {
  const cacheKey = `customer:${customerId}`;

  // Check cache first
  let customer = await redis.get(cacheKey);
  if (customer) {
    return JSON.parse(customer);
  }

  // Cache miss - fetch from DB
  customer = await db.customers.findById(customerId);

  // Store in cache (TTL: 5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(customer));

  return customer;
}
```

#### Connection Pooling

**pgBouncer-Konfiguration:**
```ini
[databases]
psa_platform = host=psa-db-master port=5432 dbname=psa_platform

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
```

---

### 17.8 Performance-Regression-Prävention

#### CI/CD Performance-Gates

```yaml
# .gitlab-ci.yml
performance-test:
  stage: test
  script:
    - npm run test:performance
    - |
      if [ $(jq '.p95' performance-report.json) -gt 200 ]; then
        echo "Performance regression detected!"
        exit 1
      fi
  artifacts:
    reports:
      performance: performance-report.json
```

#### Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['https://staging.psa-platform.local/'],
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'first-contentful-paint': ['error', {maxNumericValue: 2000}],
        'interactive': ['error', {maxNumericValue: 3500}],
      },
    },
  },
};
```

---

**Nächstes Kapitel:** [18-Security-Checklist](BDUF-Chapter18.md)

**Zurück zum Inhaltsverzeichnis:** [BDUF README](README.md)
