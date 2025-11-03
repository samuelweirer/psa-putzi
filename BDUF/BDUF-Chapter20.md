# Big Design Up Front (BDUF) - Kapitel 20
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Kapitel:** 20 - Maintenance & Troubleshooting

---

## 20. MAINTENANCE & TROUBLESHOOTING

### 20.1 Regelmäßige Wartungsaufgaben

#### Täglich

**Automatisierte Tasks:**
- [x] Backup-Verifizierung (02:00 Uhr)
- [x] Log-Rotation
- [x] Disk-Space-Check
- [x] Service-Health-Checks

**Manuelle Reviews:**
- [ ] **Monitoring-Dashboard prüfen** (09:00 Uhr)
  - Zabbix Dashboard
  - Grafana Dashboards
  - ELK Stack für Errors

- [ ] **Kritische Logs reviewen**
  ```bash
  # Check for errors in last 24h
  journalctl --since "24 hours ago" --priority=err

  # PostgreSQL Errors
  tail -100 /var/log/postgresql/postgresql-15-main.log | grep ERROR

  # Application Errors
  docker logs psa-api-gateway --since 24h | grep ERROR
  ```

- [ ] **Security-Alerts prüfen**
  - Failed Login Attempts
  - Unusual API Activity
  - Firewall Blocks

#### Wöchentlich

- [ ] **Patch-Status überprüfen (Montag)**
  ```bash
  # Check for available updates
  apt update && apt list --upgradable

  # Check CVE status
  lynis audit system
  ```

- [ ] **Performance-Metriken analysieren**
  - API Response Times (Trend)
  - Database Query Performance
  - Resource Utilization (CPU, RAM, Disk)

- [ ] **Storage-Kapazität prüfen**
  ```bash
  # Disk Usage
  df -h

  # PostgreSQL Database Size
  psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('psa_platform'));"

  # Container Storage
  pct df
  ```

- [ ] **SSL-Zertifikate-Ablauf kontrollieren**
  ```bash
  # Check certificate expiry
  echo | openssl s_client -connect psa-platform.local:443 2>/dev/null | \
    openssl x509 -noout -enddate
  ```

- [ ] **Backup-Rotation prüfen**
  - Grandfather (Monthly) vorhanden?
  - Father (Weekly) vorhanden?
  - Son (Daily) vollständig?

#### Monatlich

- [ ] **Vollständiges Restore-Testing (Erster Sonntag)**
  ```bash
  #!/bin/bash
  # Restore Test Script

  BACKUP_DATE=$(date -d "yesterday" +%Y%m%d)
  TEST_DB="psa_platform_restore_test"

  # Restore Database
  pg_restore -d $TEST_DB /backup/psa_platform_$BACKUP_DATE.dump

  # Verify Data Integrity
  psql -d $TEST_DB -c "SELECT COUNT(*) FROM tickets;"
  psql -d $TEST_DB -c "SELECT COUNT(*) FROM customers;"

  # Cleanup
  dropdb $TEST_DB

  echo "✅ Restore Test successful!"
  ```

- [ ] **Sicherheits-Audit**
  - User-Access-Review
  - Inactive Accounts deaktivieren
  - Password-Policy-Compliance prüfen
  - Firewall-Rules reviewen

- [ ] **Kapazitäts-Planung Review**
  - Storage Growth-Rate berechnen
  - User Growth projizieren
  - Performance-Trends analysieren
  - Hardware-Upgrade-Bedarf?

- [ ] **Update-Planung für nächsten Zyklus**
  - Security-Patches priorisieren
  - Feature-Updates evaluieren
  - Breaking Changes prüfen

#### Quartalsweise

- [ ] **DR-Drill (vollständige Wiederherstellung)**
  - Complete Disaster Scenario
  - Off-Site Restore
  - RTO/RPO-Validation
  - Team-Training

- [ ] **Penetration Testing**
  - External Pentest
  - Internal Pentest
  - Findings remedieren

- [ ] **Archivierung alter Daten**
  - Tickets > 3 Jahre → Archiv-Tabelle
  - Logs > 6 Monate → Cold Storage
  - Audit-Logs > 12 Monate → Archiv

- [ ] **Performance-Tuning**
  - Database-Index-Optimierung
  - Query-Performance-Review
  - Cache-Hit-Ratio analysieren

---

### 20.2 Patch-Management-Prozess

#### 1. Patch-Identifikation

**Quellen:**
- CVE-Datenbanken (NVD, MITRE)
- Vendor-Notifications (Ubuntu Security, Node.js Security)
- Dependency-Scanners (npm audit, Snyk)

**Priorisierung:**
```
Critical (CVSS 9.0-10.0)   → Deploy innerhalb 7 Tage
High (CVSS 7.0-8.9)        → Deploy innerhalb 30 Tage
Medium (CVSS 4.0-6.9)      → Deploy nächstes Wartungsfenster
Low (CVSS 0.1-3.9)         → Deploy nach Bedarf
```

#### 2. Risiko-Bewertung

- [ ] CVSS-Score analysieren
- [ ] Betroffene Systeme identifizieren
- [ ] Auswirkung auf Produktion abschätzen
- [ ] Rollback-Plan erstellen

#### 3. Test-Deployment (Staging)

```bash
# Patch auf Staging
ansible-playbook -i staging patch-system.yml --tags security

# Validation Tests
npm run test:integration
npm run test:e2e

# Performance-Regression-Check
npm run test:performance
```

#### 4. Change-Request

- [ ] Change-Ticket erstellen (z.B. in Infexio)
- [ ] Stakeholder informieren
- [ ] Wartungsfenster planen
- [ ] Genehmigung einholen

#### 5. Produktiv-Deployment

- [ ] Pre-Deployment Backup
- [ ] Deployment während Wartungsfenster
- [ ] Post-Deployment Validation

#### 6. Dokumentation

- [ ] Update-Protokoll in Infexio
- [ ] System-Versionen aktualisieren
- [ ] Lessons Learned (falls Probleme)

---

### 20.3 Incident-Management

#### Severity-Klassifikation

**P1 (Critical):**
- System komplett down
- Datenverlust
- Security Breach
- **Response:** 15 Minuten

**P2 (High):**
- Teilausfälle
- Performance-Degradation > 50%
- Workaround verfügbar
- **Response:** 2 Stunden

**P3 (Medium):**
- Einzelne Features betroffen
- Workaround vorhanden
- **Response:** Nächster Arbeitstag

**P4 (Low):**
- Kosmetische Fehler
- Feature-Requests
- **Response:** Best Effort

#### Incident-Response-Prozess

1. **Detection**
   - Monitoring-Alert
   - User-Meldung
   - Proaktive Entdeckung

2. **Classification**
   ```bash
   # Incident-Template
   Titel: [P1/P2/P3/P4] Kurzbeschreibung
   Entdeckt: YYYY-MM-DD HH:MM
   Gemeldet von: User/System
   Betroffene Systeme: [Liste]
   Symptome: [Beschreibung]
   ```

3. **Response**
   - On-Call übernimmt Ticket
   - Stakeholder informieren (bei P1/P2)
   - War-Room eröffnen (Teams-Call bei P1)

4. **Investigation**
   - Root-Cause-Analysis
   - Logs analysieren
   - Monitoring-Daten prüfen

5. **Resolution**
   - Fix implementieren
   - Testing
   - Deployment

6. **Post-Mortem** (bei P1/P2)
   - Timeline dokumentieren
   - Root-Cause festhalten
   - Preventive Actions definieren
   - Lessons Learned teilen

---

### 20.4 Troubleshooting-Guides

#### Problem: API Response Times hoch

**Symptome:**
- API p95 > 500ms
- User-Beschwerden über Langsamkeit
- Zabbix-Alert "High API Response Time"

**Diagnose:**
```bash
# 1. Check API Gateway Logs
journalctl -u psa-api-gateway -n 100 --no-pager | grep "response_time"

# 2. Check Database Performance
psql -U postgres -d psa_platform <<EOF
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
EOF

# 3. Check Redis
redis-cli --latency

# 4. Check System Resources
top
htop
iotop
```

**Lösung:**
1. Identifiziere Slow Queries → Optimiere oder füge Indizes hinzu
2. Redis Cache-Hit-Ratio niedrig → TTL anpassen
3. CPU/RAM überlastet → Container hochskalieren
4. Database Connection Pool ausgelastet → pgBouncer-Config anpassen

---

#### Problem: Container startet nicht

**Symptome:**
- `pct start 101` schlägt fehl
- "Container start failed" in Proxmox-Log

**Diagnose:**
```bash
# 1. Check Container Status
pct status 101

# 2. Check Logs
pct enter 101  # (falls möglich)
journalctl -xe

# 3. Check Proxmox Logs
tail -100 /var/log/pve/tasks/*

# 4. Check Resources
pct config 101
pvesm status
```

**Häufige Ursachen & Lösungen:**
1. **Quota überschritten:** Storage erweitern
2. **Memory nicht verfügbar:** RAM auf Node freigeben oder Container-RAM reduzieren
3. **Netzwerk-Fehler:** Bridge-Config prüfen
4. **Corrupted Filesystem:** Restore von Backup

---

#### Problem: PostgreSQL Master-Replica Lag

**Symptome:**
- Replica ist >100 MB hinter Master
- Read-Queries auf Replica liefern veraltete Daten

**Diagnose:**
```bash
# On Master
psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# On Replica
psql -U postgres -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn(),
  pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag;"
```

**Lösung:**
1. **Netzwerk-Latenz:** Netzwerk zwischen Master und Replica prüfen
2. **Replica überlastet:** Read-Queries reduzieren oder Replica upgraden
3. **WAL-Shipping slow:** `wal_sender_timeout` und `max_wal_senders` anpassen
4. **Replica wiederherstellen:** Falls Lag zu groß, Replica neu aufsetzen

---

#### Problem: Redis Out of Memory

**Symptome:**
- "OOM command not allowed" Errors
- Cache-Hits sinken drastisch

**Diagnose:**
```bash
redis-cli INFO memory
redis-cli INFO stats
redis-cli --bigkeys
```

**Lösung:**
1. **Maxmemory erhöhen:** `maxmemory 8gb` in redis.conf
2. **Eviction-Policy prüfen:** `maxmemory-policy allkeys-lru`
3. **TTL für Keys reduzieren:** Kürzere Cache-Dauer
4. **Memory-Leaks:** Keys ohne TTL identifizieren und bereinigen

---

#### Problem: Disk Space voll

**Symptome:**
- "No space left on device" Errors
- Backups schlagen fehl
- Logs wachsen nicht mehr

**Diagnose:**
```bash
df -h
du -sh /* | sort -h
ncdu /

# Find large files
find / -type f -size +1G -exec ls -lh {} \;
```

**Lösung:**
1. **Logs bereinigen:** `journalctl --vacuum-size=1G`
2. **Alte Backups löschen:** Retention-Policy prüfen
3. **Docker/LXC-Volumes:** Ungenutzte Images/Volumes löschen
4. **Database Bloat:** `VACUUM FULL` auf großen Tabellen
5. **Storage erweitern:** LVM oder ZFS erweitern

---

### 20.5 Runbooks

#### Runbook: Node-Ausfall im HA-Cluster

**Scenario:** Ein Proxmox-Node fällt aus

**Steps:**
1. Quorum-Status prüfen
   ```bash
   pvecm status
   # Expected: 2/3 Votes → Quorum OK
   ```

2. Container auf anderen Nodes prüfen
   ```bash
   ha-manager status
   # Containers sollten automatisch auf anderen Nodes starten
   ```

3. Wenn Container nicht starten:
   ```bash
   # Manueller Start auf anderem Node
   ha-manager migrate <vmid> <node>
   ```

4. Failed Node später wieder integrieren:
   ```bash
   # Nach Hardware-Fix
   systemctl start pve-cluster
   pvecm status  # Node sollte wieder im Cluster sein
   ```

---

#### Runbook: Complete Database Restore

**Scenario:** Kritischer Datenverlust, vollständiges Restore nötig

**Steps:**
1. **Wartungsmodus aktivieren**
   ```bash
   # Alle App-Container stoppen
   for ct in 100 101 102 103 104 105 106 107 108 109 110; do
     pct stop $ct
   done
   ```

2. **Database Backup finden**
   ```bash
   ls -lh /backup/db/ | tail -5
   # Wähle neuestes Backup
   ```

3. **Restore ausführen**
   ```bash
   # On psa-db-master
   systemctl stop postgresql
   rm -rf /var/lib/postgresql/15/main/*

   # Restore
   pg_restore -U postgres -d psa_platform /backup/db/psa_platform_YYYYMMDD.dump

   systemctl start postgresql
   ```

4. **Validation**
   ```bash
   psql -U postgres -d psa_platform -c "SELECT COUNT(*) FROM tickets;"
   psql -U postgres -d psa_platform -c "SELECT COUNT(*) FROM customers;"
   ```

5. **Replicas neu aufsetzen**
   ```bash
   # On each replica
   pg_basebackup -h psa-db-master -D /var/lib/postgresql/15/main -U replicator -P
   ```

6. **App-Container starten**
   ```bash
   for ct in 100 101 102 103 104 105 106 107 108 109 110; do
     pct start $ct
   done
   ```

7. **Post-Restore Checks**
   - [ ] Login funktioniert
   - [ ] Tickets anzeigbar
   - [ ] Keine Errors in Logs

---

### 20.6 On-Call Prozedur

#### On-Call-Rotation

- **Schichten:** 7 Tage (Mo 09:00 bis Mo 09:00)
- **Verfügbarkeit:** 24/7 für P1-Incidents
- **Response Times:**
  - P1: 15 Minuten
  - P2: 2 Stunden

#### On-Call-Tools

- **PagerDuty / Opsgenie:** Alerting
- **Slack / Teams:** War-Room
- **VPN:** Remote-Zugriff
- **Dokumentation:** Runbooks, Passwords (1Password)

#### Eskalationspfad

```
Level 1: On-Call Engineer
  ↓ (nach 30min bei P1, 2h bei P2)
Level 2: Senior Engineer / Tech-Lead
  ↓ (nach 1h bei P1)
Level 3: CTO / Management
```

---

### 20.7 Betriebsdokumentation

**Alle Prozesse dokumentiert in:**
- **Infexio:** Runbooks, Change-Logs, Incident-Reports
- **Hudu:** Kunden-facing Dokumentation
- **i-doit:** Asset-Inventar, CMDB
- **Confluence/SharePoint:** Team-Wiki (optional)

**Inhalt:**
- Cluster-Topologie
- Netzwerk-Diagramme
- Backup/Restore-Prozeduren
- Disaster-Recovery-Plan
- Kontaktlisten
- Vendor-Support-Informationen

---

**Zurück zum Inhaltsverzeichnis:** [BDUF README](README.md)
