# 10 Betrieb & Wartung

[Vorhandener Inhalt aus Original bis 10.5]

## 10.6 Wartungsprozesse

### Regelmäßige Wartungsaufgaben

#### Täglich
- Backup-Verifizierung (automatisiert)
- Log-Review (kritische Errors)
- Monitoring-Dashboard-Check
- Security-Alert-Review

#### Wöchentlich
- Patch-Status überprüfen
- Performance-Metriken analysieren
- Storage-Kapazität prüfen
- SSL-Zertifikate-Ablauf kontrollieren

#### Monatlich
- Vollständiges Restore-Testing
- Sicherheits-Audit
- Kapazitäts-Planung Review
- Update-Planung für nächsten Zyklus

#### Quartalsweise
- DR-Drill (vollständige Wiederherstellung)
- Penetration Testing
- Archivierung alter Daten
- Performance-Tuning

### Patch-Management-Prozess
1. **Patch-Identifikation**: CVE-Scanning, Vendor-Notifications
2. **Risiko-Bewertung**: CVSS-Score, Betroffene Systeme
3. **Test-Deployment**: Auf Staging-Umgebung
4. **Change-Request**: Dokumentation und Freigabe
5. **Produktiv-Deployment**: Während Wartungsfenster
6. **Verifizierung**: Funktions- und Performance-Tests
7. **Dokumentation**: Update-Protokoll in Infexio

### Backup-Rotation (GFS-Schema)
- **Grandfather**: Monatlich, Retention 12 Monate
- **Father**: Wöchentlich (Sonntag), Retention 4 Wochen
- **Son**: Täglich, Retention 7 Tage

## 10.8 Betriebsverantwortlichkeiten

### RACI-Matrix

| Aufgabe | System-Admin | App-Admin | User | Externer Dienstleister |
|---------|--------------|-----------|------|------------------------|
| Proxmox-Verwaltung | **R, A** | I | - | C |
| Container-Deployment | **R, A** | C | - | - |
| Backup-Management | **R, A** | I | - | - |
| Application-Updates | I | **R, A** | - | C |
| User-Support | C | **R, A** | I | - |
| Security-Monitoring | **R, A** | I | - | C |
| DR-Execution | **R, A** | I | - | C |

**Legende**: R=Responsible (Durchführung), A=Accountable (Verantwortlich), C=Consulted (Beratend), I=Informed

### On-Call-Rotation
- **Bereitschaft**: 24/7 für P1-Incidents
- **Eskalation**: Level 1 → Level 2 → Management
- **Response-Zeiten**:
  - P1 (Critical): 15 Minuten
  - P2 (High): 2 Stunden
  - P3 (Medium): Nächster Arbeitstag
  - P4 (Low): Best Effort

### Incident-Management
1. **Detection**: Monitoring-Alert oder User-Meldung
2. **Classification**: Severity-Einstufung (P1-P4)
3. **Response**: Verantwortlicher übernimmt Ticket
4. **Investigation**: Root-Cause-Analysis
5. **Resolution**: Fix implementieren
6. **Post-Mortem**: Lessons Learned dokumentieren

## 10.9 Dokumentation

Alle Betriebs- und Wartungsprozesse werden in **Infexio** dokumentiert:

### Inhalt der Betriebsdokumentation
- **Cluster-Topologie**: Nodes, Container-Verteilung, Netzwerk-Diagram
- **Runbooks**: Step-by-Step für Standard-Aufgaben
- **Troubleshooting-Guides**: Bekannte Probleme und Lösungen
- **Change-Log**: Alle Änderungen an der Plattform
- **Backup-/Restore-Pläne**: Detaillierte Verfahren
- **DR-Pläne**: Disaster-Recovery-Prozesse
- **Kontaktlisten**: On-Call, Eskalation, Vendor-Support
- **SLA-Definitionen**: Service-Level-Agreements

### Synchronisation
- **Hudu**: Kunden-facing Dokumentation
- **i-doit**: CMDB-Abgleich für Assets
- **SharePoint/Confluence**: Team-Wikis (optional)
