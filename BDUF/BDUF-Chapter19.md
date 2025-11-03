# Big Design Up Front (BDUF) - Kapitel 19
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Kapitel:** 19 - Deployment Checklist

---

## 19. DEPLOYMENT CHECKLIST

### 19.1 Pre-Deployment Checklist

#### Infrastructure

- [ ] **Proxmox Cluster**
  - [ ] 3 Nodes installiert und konfiguriert
  - [ ] HA aktiviert
  - [ ] Quorum konfiguriert (3 Votes)
  - [ ] Fencing konfiguriert (bei Hardware-Ausfall)
  - [ ] Shared Storage (ZFS/Ceph) eingerichtet
  - [ ] Backup-Storage verfügbar

- [ ] **Netzwerk**
  - [ ] VLANs konfiguriert (Management, App, DB, DMZ)
  - [ ] Firewall-Regeln aktiviert
  - [ ] Load Balancer (HAProxy) konfiguriert
  - [ ] DNS-Einträge gesetzt
  - [ ] SSL-Zertifikate installiert
  - [ ] Monitoring-Netzwerk eingerichtet

- [ ] **Storage**
  - [ ] Ausreichend Speicherplatz (min. 5 TB für 3-Node-Cluster)
  - [ ] RAID konfiguriert (RAID10 oder ZFS)
  - [ ] Backup-Destination konfiguriert
  - [ ] Snapshot-Schedule eingerichtet

#### LXC-Container

- [ ] **Alle Container erstellt**
  - [ ] psa-api-gateway (CT-ID: 100)
  - [ ] psa-crm (CT-ID: 101)
  - [ ] psa-tickets (CT-ID: 102)
  - [ ] psa-billing (CT-ID: 103)
  - [ ] psa-projects (CT-ID: 104)
  - [ ] psa-assets (CT-ID: 105)
  - [ ] psa-reports (CT-ID: 106)
  - [ ] psa-vcio (CT-ID: 107)
  - [ ] psa-workflows (CT-ID: 108)
  - [ ] psa-ai (CT-ID: 109)
  - [ ] psa-auth (CT-ID: 110)
  - [ ] psa-db-master (CT-ID: 200)
  - [ ] psa-db-replica-1 (CT-ID: 201)
  - [ ] psa-redis (CT-ID: 210)
  - [ ] psa-rabbitmq (CT-ID: 220)
  - [ ] psa-elasticsearch (CT-ID: 230)

- [ ] **Container-Ressourcen zugewiesen**
  - [ ] CPU-Cores gemäß Spezifikation
  - [ ] RAM gemäß Spezifikation
  - [ ] Storage gemäß Spezifikation
  - [ ] Netzwerk-Interfaces konfiguriert

- [ ] **Container-Autostart**
  - [ ] Abhängigkeiten definiert (DB vor App-Services)
  - [ ] Start-Order konfiguriert
  - [ ] Health-Checks implementiert

#### Datenbank

- [ ] **PostgreSQL Master**
  - [ ] PostgreSQL 15+ installiert
  - [ ] Konfiguration optimiert (siehe BDUF-Chapter3.md)
  - [ ] Datenbank `psa_platform` erstellt
  - [ ] Schema deployed (alle Tabellen, Indizes, Functions)
  - [ ] User & Roles konfiguriert
  - [ ] Connection Pooling (pgBouncer) aktiv
  - [ ] Backup-Job konfiguriert

- [ ] **PostgreSQL Replica**
  - [ ] Streaming Replication konfiguriert
  - [ ] Replication Slots erstellt
  - [ ] WAL-Archiving aktiv
  - [ ] Lag-Monitoring eingerichtet

- [ ] **Redis**
  - [ ] Redis 7.x installiert
  - [ ] Persistence (AOF + RDB) konfiguriert
  - [ ] Maxmemory-Policy: allkeys-lru
  - [ ] Redis Cluster (optional) konfiguriert

- [ ] **Elasticsearch**
  - [ ] Elasticsearch 8.x installiert
  - [ ] Indices erstellt
  - [ ] Index Templates definiert
  - [ ] ILM-Policies konfiguriert

- [ ] **RabbitMQ**
  - [ ] RabbitMQ 3.12+ installiert
  - [ ] Management-Plugin aktiviert
  - [ ] Queues erstellt
  - [ ] Users & VHosts konfiguriert
  - [ ] Cluster-Modus (optional) konfiguriert

####Application

- [ ] **Backend-Services**
  - [ ] Node.js 20 LTS installiert
  - [ ] NPM-Dependencies installiert
  - [ ] Environment-Variables gesetzt
  - [ ] Service-Dateien (systemd) konfiguriert
  - [ ] Health-Check-Endpoints funktionsfähig

- [ ] **Frontend**
  - [ ] Build erstellt (`npm run build`)
  - [ ] Static Assets auf CDN (optional)
  - [ ] Nginx/Apache konfiguriert
  - [ ] Gzip/Brotli-Compression aktiv

- [ ] **API Gateway**
  - [ ] Routing-Regeln konfiguriert
  - [ ] Rate-Limiting aktiv
  - [ ] CORS-Headers gesetzt
  - [ ] API-Versionierung funktioniert

#### Configuration

- [ ] **Environment Variables**
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` gesetzt
  - [ ] `REDIS_URL` gesetzt
  - [ ] `RABBITMQ_URL` gesetzt
  - [ ] `JWT_SECRET` generiert (sicher!)
  - [ ] `ENCRYPTION_KEY` generiert (sicher!)
  - [ ] `API_BASE_URL` gesetzt

- [ ] **Secrets Management**
  - [ ] Secrets nicht in Git
  - [ ] `.env`-Files sicher gespeichert
  - [ ] Vault oder KMS konfiguriert (optional)

- [ ] **Feature Flags**
  - [ ] Kritische Features über Flags steuerbar
  - [ ] Rollback-Möglichkeit über Flags

---

### 19.2 Deployment Process

#### Schritt 1: Pre-Deployment Tests

```bash
#!/bin/bash
# Pre-Deployment Test Suite

echo "=== Running Pre-Deployment Tests ==="

# Unit Tests
npm run test
if [ $? -ne 0 ]; then
  echo "Unit tests failed!"
  exit 1
fi

# Integration Tests
npm run test:integration
if [ $? -ne 0 ]; then
  echo "Integration tests failed!"
  exit 1
fi

# E2E Tests
npm run test:e2e
if [ $? -ne 0 ]; then
  echo "E2E tests failed!"
  exit 1
fi

# Security Scan
npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
  echo "Security vulnerabilities found!"
  exit 1
fi

# Build Test
npm run build
if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

echo "✅ All pre-deployment tests passed!"
```

#### Schritt 2: Database Migration

- [ ] Backup vor Migration erstellen
- [ ] Migration auf Staging testen
- [ ] Migration Rollback-Plan bereit

```bash
# Database Migration
npm run migrate
```

#### Schritt 3: Blue-Green Deployment

**Blue Environment (aktuell aktiv):**
- psa-api-gateway-blue (Port 3000)
- psa-crm-blue, psa-tickets-blue, etc.

**Green Environment (neues Release):**
- psa-api-gateway-green (Port 3001)
- psa-crm-green, psa-tickets-green, etc.

**Deployment-Steps:**
1. Green Environment deployen
2. Health-Checks auf Green
3. Smoke-Tests auf Green
4. Load-Balancer auf Green umschalten (50/50 Split)
5. Monitoring für 10 Minuten
6. Vollständig auf Green umschalten
7. Blue Environment als Rollback bereithalten

```bash
# HAProxy Switch
# Aktuelle Gewichtung prüfen
echo "show stat" | socat stdio /var/run/haproxy.sock

# Auf Green umschalten
echo "set weight backend/blue 0" | socat stdio /var/run/haproxy.sock
echo "set weight backend/green 100" | socat stdio /var/run/haproxy.sock
```

#### Schritt 4: Post-Deployment Verification

- [ ] **Health-Checks**
  ```bash
  curl https://api.psa-platform.local/health
  # Expected: {"status": "healthy", "version": "1.2.3"}
  ```

- [ ] **Smoke Tests**
  ```bash
  npm run test:smoke
  ```

- [ ] **Monitoring prüfen**
  - [ ] Keine Fehler in Logs
  - [ ] API Response Times im Normalbereich
  - [ ] CPU/RAM im Normalbereich
  - [ ] Keine Datenbank-Errors

- [ ] **Funktionale Tests**
  - [ ] Login funktioniert
  - [ ] Ticket erstellen funktioniert
  - [ ] Dashboard lädt
  - [ ] Reports generieren

#### Schritt 5: Rollback Plan

**Falls Fehler auftreten:**

```bash
#!/bin/bash
# Rollback Script

echo "=== ROLLBACK INITIATED ==="

# Switch back to Blue
echo "set weight backend/green 0" | socat stdio /var/run/haproxy.sock
echo "set weight backend/blue 100" | socat stdio /var/run/haproxy.sock

# Database Rollback (if needed)
npm run migrate:rollback

# Restart Blue Environment
for container in psa-api-gateway-blue psa-crm-blue psa-tickets-blue; do
  pct restart $container
done

echo "✅ Rollback complete. System should be stable now."
echo "📋 Please review logs and create post-mortem."
```

---

### 19.3 Wartungsfenster-Deployment

#### Vorbereitung (7 Tage vorher)

- [ ] Wartungsfenster ankündigen (E-Mail, Portal-Banner)
- [ ] Backup-Zeitpunkt festlegen
- [ ] Rollback-Plan dokumentieren
- [ ] Team informieren und Rollen zuweisen

#### Wartungsfenster-Ablauf

**T-60min:** Vorbereitung
- [ ] Final Backup erstellen
- [ ] Deployment-Artifacts bereitstellen
- [ ] Team im War-Room (Teams-Call)

**T-30min:** System in Wartungsmodus
- [ ] Maintenance-Page aktivieren
- [ ] User-Benachrichtigung
- [ ] No new sessions allowed

**T-0min:** Deployment Start
- [ ] Database-Migration
- [ ] Container-Updates
- [ ] Configuration-Updates
- [ ] Service-Restarts

**T+30min:** Testing
- [ ] Health-Checks
- [ ] Smoke-Tests
- [ ] Spot-Checks durch Team

**T+45min:** System Online
- [ ] Maintenance-Page deaktivieren
- [ ] User-Benachrichtigung (System verfügbar)
- [ ] Monitoring intensiv für 2 Stunden

**T+120min:** Wrap-Up
- [ ] Status-Update an Stakeholder
- [ ] Deployment-Log dokumentieren
- [ ] On-Call für nächste 24h bereit

---

### 19.4 Continuous Deployment (CI/CD)

#### GitLab CI/CD Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2

# Stage 1: Tests
test:
  stage: test
  script:
    - npm install
    - npm run lint
    - npm run test
    - npm audit --audit-level=moderate
  coverage: '/Statements\s*:\s*([^%]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# Stage 2: Build
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

# Stage 3: Deploy to Staging
deploy-staging:
  stage: deploy-staging
  environment:
    name: staging
    url: https://staging.psa-platform.local
  script:
    - ./deploy.sh staging
  only:
    - develop

# Stage 4: Deploy to Production
deploy-production:
  stage: deploy-production
  environment:
    name: production
    url: https://psa-platform.local
  script:
    - ./deploy.sh production
  when: manual
  only:
    - main
```

---

### 19.5 Post-Deployment Monitoring

#### First 24 Hours

- [ ] **Stündliche Checks**
  - [ ] Error-Rate < 0.1%
  - [ ] API Response Times normal
  - [ ] CPU/RAM/Disk im Normalbereich
  - [ ] Keine ungewöhnlichen Logs

- [ ] **User-Feedback**
  - [ ] Support-Tickets monitoren
  - [ ] User-Satisfaction-Survey
  - [ ] Social Media / Community-Feedback

- [ ] **Performance**
  - [ ] Load-Test nach Deployment
  - [ ] Performance-Regression-Check
  - [ ] Database-Query-Performance

#### First Week

- [ ] **Täglicher Status-Call**
- [ ] **Weekly Deployment-Review**
- [ ] **Lessons Learned dokumentieren**

---

**Nächstes Kapitel:** [20-Maintenance-Troubleshooting](BDUF-Chapter20.md)

**Zurück zum Inhaltsverzeichnis:** [BDUF README](README.md)
