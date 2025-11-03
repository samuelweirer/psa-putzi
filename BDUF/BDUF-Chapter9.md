## 9. MONITORING & LOGGING (DETAILLIERT)

### 9.1 Prometheus-Metriken

**Custom-Metriken-Export:**
```typescript
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Active tickets gauge
const activeTicketsGauge = new Gauge({
  name: 'active_tickets_total',
  help: 'Number of active tickets',
  labelNames: ['status', 'priority'],
});

// Database connections
const dbConnectionsGauge = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

// Middleware for metrics
export function prometheusMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Update custom metrics periodically
setInterval(async () => {
  const stats = await getTicketStats();
  
  for (const status of ['new', 'assigned', 'in_progress']) {
    for (const priority of ['low', 'medium', 'high', 'critical']) {
      activeTicketsGauge.set(
        { status, priority },
        stats[status]?.[priority] || 0
      );
    }
  }
  
  const dbStats = await getDbConnectionStats();
  dbConnectionsGauge.set(dbStats.active);
}, 60000); // Every minute
```

### 9.2 Grafana-Dashboards

**API-Performance-Dashboard.json:**
```json
{
  "dashboard": {
    "title": "PSA Platform - API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Tickets",
        "targets": [
          {
            "expr": "active_tickets_total",
            "legendFormat": "{{status}} - {{priority}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### 9.3 ELK-Stack-Konfiguration

**Logstash-Pipeline (logstash.conf):**
```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "psa-api" {
    json {
      source => "message"
    }
    
    # Parse timestamp
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    # Add geo-location for IP
    geoip {
      source => "ip_address"
    }
    
    # Classify log level
    if [level] == "ERROR" or [level] == "FATAL" {
      mutate {
        add_tag => [ "alert" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "psa-logs-%{+YYYY.MM.dd}"
    user => "elastic"
    password => "${ELASTICSEARCH_PASSWORD}"
  }
}
```

**Filebeat-Configuration (filebeat.yml):**
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/psa/*.log
    fields:
      service: psa-api
      environment: production
    json.keys_under_root: true
    json.add_error_key: true

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
```

### 9.4 Alerting-Rules

**Prometheus-Alert-Rules (alerts.yml):**
```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.route }}"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s for {{ $labels.route }}"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: database_connections_active / database_connections_max > 0.9
        for: 5m
        labels:
          severity: critical
          team: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

      # Container down
      - alert: ContainerDown
        expr: up{job="psa-services"} == 0
        for: 2m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Container {{ $labels.instance }} is down"
          description: "Container has been down for more than 2 minutes"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 10m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

**AlertManager-Configuration (alertmanager.yml):**
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
  
  - name: 'critical-alerts'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
  
  - name: 'warning-alerts'
    slack_configs:
      - channel: '#warnings'
        title: '⚠️  WARNING: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---
