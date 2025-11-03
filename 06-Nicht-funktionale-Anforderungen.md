# 6 Nicht-funktionale Anforderungen

Die nicht-funktionalen Anforderungen (NFA) definieren die Qualitäts-, Sicherheits-, Performance- und Betriebsparameter, die für die PSA-Platform verbindlich sind.
Sie gewährleisten Stabilität, Skalierbarkeit und Rechtskonformität der Gesamtlösung.

## 6.1 Performance & Skalierbarkeit

### Response-Zeiten
| Operation | Zielwert | Maximale Latenz |
|-----------|----------|-----------------|
| API-Call (einfach) | < 100ms | < 500ms |
| Ticket-Ansicht | < 200ms | < 1s |
| Dashboard-Load | < 500ms | < 2s |
| Report-Generierung | < 5s | < 30s |
| Suche (Knowledge Base) | < 300ms | < 1.5s |
| Bulk-Import (100 Assets) | < 10s | < 60s |

### Durchsatz
- **API-Requests**: 1000 req/s pro Node
- **Concurrent Users**: 500+ gleichzeitige Benutzer
- **Ticket-Verarbeitung**: 10.000 Tickets/Tag ohne Performance-Degradation
- **Database Queries**: 5000 Queries/s (PostgreSQL Master)

### Skalierungsgrenzen
| Metrik | Single Node | 3-Node Cluster | Enterprise |
|--------|-------------|----------------|------------|
| Mandanten | 50 | 200 | 1000+ |
| Techniker/User | 100 | 500 | 2000+ |
| Tickets/Jahr | 50.000 | 250.000 | 1M+ |
| Assets | 10.000 | 50.000 | 200.000+ |
| Storage | 500 GB | 5 TB | 50 TB+ |

### Performance-Optimierung
- **Connection Pooling**: PostgreSQL max_connections = 500
- **Query-Caching**: Redis mit 2GB RAM
- **CDN**: Statische Assets über CDN (optional)
- **Compression**: Gzip/Brotli für API-Responses
- **Database Indexing**: Optimierte Indizes auf allen Foreign Keys
- **Lazy Loading**: Frontend lädt Daten on-demand
- **Pagination**: Max. 100 Items pro API-Response

### Load-Balancing
- **Round-Robin** für API-Gateway
- **Least-Connections** für Datenbank-Replicas
- **Geo-Routing** bei Multi-Region-Setup
- **Health-Checks**: Alle 10 Sekunden

## 6.2 Verfügbarkeit & Betriebssicherheit

### Service Level Agreements (SLA)

#### Produktionsumgebung
- **Verfügbarkeit**: 99.5% (43.8h Downtime/Jahr)
- **Geplante Wartungsfenster**: 1x monatlich, 2-4h, außerhalb Geschäftszeiten
- **RTO (Recovery Time Objective)**: 2 Stunden
- **RPO (Recovery Point Objective)**: 4 Stunden

#### High-Availability-Umgebung (Optional)
- **Verfügbarkeit**: 99.9% (8.76h Downtime/Jahr)
- **RTO**: 15 Minuten (automatisches Failover)
- **RPO**: 1 Stunde
- **Redundanz**: Alle kritischen Services 2-fach

### Fehlertoleranz
- **Automatisches Failover**: Bei Node-Ausfall in HA-Cluster
- **Database-Replication**: Synchrone Replikation (Master → Standby)
- **Service-Recovery**: Automatischer Neustart fehlgeschlagener Container
- **Circuit Breaker**: Bei Ausfall externer Services (RMM, ERP)
- **Graceful Degradation**: Plattform bleibt funktional bei Teil-Ausfällen

### Disaster Recovery
- **Backup-Strategie**:
  - Täglich: Inkrementell
  - Wöchentlich: Vollbackup
  - Monatlich: Archiv-Backup
- **Offsite-Backup**: WAN-Replikation oder Cloud-Backup
- **DR-Standort**: Separater Proxmox-Cluster (optional)
- **Restore-Test**: Quartalsweise Wiederherstellungstests
- **Dokumentation**: Runbooks für alle Recovery-Szenarien

### Wartungsfenster
- **Standard**: Sonntag 02:00-06:00 Uhr MEZ/MESZ
- **Kommunikation**: 7 Tage Vorankündigung via E-Mail/Portal
- **Emergency Maintenance**: Benachrichtigung mind. 4h vorher
- **Change Management**: Alle Änderungen dokumentiert in Infexio

## 6.3 Security & Compliance

### Authentifizierung & Autorisierung
- **Multi-Factor-Authentication (MFA)**: 
  - TOTP (Google Authenticator, Authy)
  - FIDO2/WebAuthn (YubiKey)
  - SMS/E-Mail-Backup-Codes
- **Single Sign-On (SSO)**:
  - SAML 2.0
  - OpenID Connect (OIDC)
  - Azure AD / Entra ID
  - LDAP/Active Directory
- **Password Policy**:
  - Min. 12 Zeichen
  - Komplexitätsanforderung (Groß-, Kleinbuchstaben, Zahlen, Sonderzeichen)
  - Ablauf nach 90 Tagen (konfigurierbar)
  - History: Letzte 5 Passwörter nicht wiederverwendbar
- **Session Management**:
  - Timeout: 30 Minuten Inaktivität
  - Absolute Timeout: 8 Stunden
  - Concurrent Sessions: Max. 3 pro Benutzer

### Verschlüsselung
- **Transport Layer**:
  - TLS 1.3 (min. TLS 1.2)
  - HSTS (HTTP Strict Transport Security)
  - Certificate Pinning für API-Clients
- **At Rest**:
  - Datenbank: PostgreSQL TDE (Transparent Data Encryption)
  - Storage: LUKS-verschlüsselte Volumes
  - Backup: AES-256 verschlüsselt
- **End-to-End**:
  - Sensible Felder (Passwörter, API-Keys): Vault/HSM
  - Customer Data: Optional kundenspezifische Verschlüsselung

### Access Control
- **Principle of Least Privilege**: Minimale notwendige Berechtigungen
- **Role-Based Access Control (RBAC)**: Siehe Kapitel 7
- **API-Token-Scoping**: Tokens mit eingeschränkten Rechten
- **IP-Whitelisting**: Optional für API-Access
- **Geo-Blocking**: Länderspezifische Zugriffsbeschränkungen (optional)

### Audit & Logging
- **Security Events**:
  - Login-Versuche (erfolgreich/fehlgeschlagen)
  - Berechtigungsänderungen
  - Datenzugriffe auf sensible Objekte
  - API-Key-Erstellung/-Löschung
- **Retention**:
  - Security-Logs: 12 Monate
  - Audit-Trail: 7 Jahre (DSGVO Art. 17)
  - Application-Logs: 90 Tage
- **SIEM-Integration**: Export zu Splunk/Elastic SIEM (optional)

### Vulnerability Management
- **Dependency Scanning**: Snyk/Dependabot für alle Libraries
- **Container-Scanning**: Trivy/Clair für LXC-Images
- **Penetration Testing**: Jährlich durch externe Firma
- **Bug Bounty**: Optional für öffentliche APIs
- **Patch Management**:
  - Critical CVEs: < 24h
  - High CVEs: < 7 Tage
  - Medium CVEs: < 30 Tage

### Compliance
#### DSGVO (EU-DSGVO)
- **Rechtsgrundlage**: Art. 6 (Vertrag, berechtigtes Interesse)
- **Betroffenenrechte**:
  - Auskunft (Art. 15)
  - Berichtigung (Art. 16)
  - Löschung (Art. 17)
  - Datenportabilität (Art. 20)
- **Privacy by Design**: Datensparsamkeit in allen Modulen
- **Data Processing Agreements (DPA)**: Mit allen Sub-Processoren
- **Data Protection Impact Assessment (DPIA)**: Für Hochrisiko-Verarbeitung

#### ISO 27001 (Optional)
- **ISMS**: Informationssicherheits-Managementsystem
- **Asset Inventory**: Alle Systeme dokumentiert
- **Risk Management**: Risikobewertung und -behandlung
- **Incident Response**: Definierte Prozesse für Security Incidents

#### Weitere Standards
- **ITIL 4**: Service-Management nach Best Practices
- **NIST Cybersecurity Framework**: Identification, Protection, Detection, Response, Recovery
- **BSI IT-Grundschutz**: Für Bundesbehörden (optional)

### Data Residency
- **Primary Data Center**: DACH-Region (DE/AT/CH)
- **Backup-Replikation**: Nur innerhalb EU/EEA
- **Sub-Processors**: Liste aller Dienstleister mit Standort
- **Cloud-Services**: EU-Regionen (Ireland, Frankfurt, Zürich)

## 6.4 Internationalisierung & DACH-Anpassungen

### Sprachen
- **Primär**: Deutsch (DE, AT, CH-Varianten)
- **Sekundär**: Englisch (US/GB)
- **Optional**: Französisch, Italienisch
- **UI**: Vollständig übersetzt (keine Platzhalter)
- **Dokumentation**: DE + EN

### Zeitzonen & Kalender
- **Automatische Zeitzonenkonvertierung**: UTC → lokale Zeit
- **DST-Support**: Automatische Umstellung Sommer-/Winterzeit
- **Feiertage**: 
  - Deutschland: 16 Bundesländer
  - Österreich: 9 Bundesländer
  - Schweiz: 26 Kantone
- **Arbeitszeit-Kalender**: 
  - Standard: Mo-Fr 08:00-17:00
  - Konfigurierbar pro Kunde/Standort
- **SLA-Berechnung**: Berücksichtigt Feiertage und Geschäftszeiten

### Währungen & Steuern
- **Unterstützte Währungen**: EUR (primär), CHF, USD
- **Wechselkurse**: Tagesaktuelle Kurse via EZB-API
- **Umsatzsteuer**:
  - Deutschland: 19% / 7% (ermäßigt)
  - Österreich: 20% / 10% / 13%
  - Schweiz: 8.1% MwSt
- **Reverse-Charge**: Automatisch bei B2B innerhalb EU
- **UID-Validierung**: VIES-Integration für EU-USt-IDs
- **Rechnungsformat**: 
  - Deutschland: ZUGFeRD 2.1 / XRechnung
  - Österreich: ebInterface 6.0
  - Schweiz: Swiss QR-Code

### Formate
| Kategorie | DE | AT | CH |
|-----------|----|----|-----|
| Datum | DD.MM.YYYY | DD.MM.YYYY | DD.MM.YYYY |
| Zeit | 24h-Format | 24h-Format | 24h-Format |
| Dezimal | 1.234,56 | 1.234,56 | 1'234.56 |
| Telefon | +49 | +43 | +41 |
| PLZ-Format | 5-stellig | 4-stellig | 4-stellig |

### Compliance-Spezifika
- **GoBD (DE)**: Aufbewahrungspflichten, Unveränderbarkeit
- **UStG (DE/AT)**: Rechnungsanforderungen, Archivierung
- **DSG (CH)**: Schweizer Datenschutzgesetz
- **AO (DE)**: Abgabenordnung - Aufzeichnungspflichten

## 6.5 Monitoring & Reporting

### System-Monitoring (Zabbix)
- **Hosts**: Proxmox-Nodes, Container, VMs
- **Metriken**:
  - CPU, RAM, Disk I/O
  - Network Traffic
  - Container-Status
  - Service-Health
- **Alerting**:
  - E-Mail an Admin-Team
  - Teams/Slack-Integration
  - SMS bei kritischen Alerts (optional)
- **Dashboards**: Grafana-Integration

### Application-Monitoring
- **Health-Endpoints**: `/health` für alle Services
- **Metriken**: Prometheus-Format
  - Request Rate
  - Error Rate
  - Response Time (p50, p95, p99)
  - Database Query Performance
- **Distributed Tracing**: Jaeger/Zipkin (optional)
- **Error Tracking**: Sentry für Application Errors

### Business-Monitoring
- **KPIs**: Über Reporting-Modul
  - Ticket-Volumen
  - SLA-Performance
  - User-Aktivität
  - API-Usage
  - Umsatz-Metriken
- **Alerting**: Bei Anomalien (z.B. 50% mehr Tickets als Durchschnitt)
- **Forecasting**: Trend-Prognosen für Kapazitätsplanung

### Compliance-Dashboards
- **Verfügbarkeit**: Uptime letzten 30/90/365 Tage
- **Security**: Failed Logins, Vulnerability-Status
- **Performance**: SLA-Einhaltung, Response-Zeiten
- **DSGVO**: Audit-Log-Vollständigkeit, Lösch-Requests

## 6.6 Wartbarkeit & Erweiterbarkeit

### Code-Qualität
- **Standards**:
  - PEP 8 (Python)
  - PSR-12 (PHP)
  - Airbnb Style Guide (JavaScript/TypeScript)
- **Linting**: ESLint, Pylint, PHP CS Fixer
- **Code Reviews**: Pflicht für alle Merge-Requests
- **Test-Coverage**: Min. 70% für Core-Module

### Modularität
- **Loose Coupling**: Module kommunizieren nur über APIs
- **High Cohesion**: Jedes Modul hat klar definierte Verantwortung
- **Dependency Injection**: Für testbare Komponenten
- **Plugin-System**: Erweiterungen ohne Core-Änderungen

### API-Design
- **Versioning**: URL-basiert (`/v1/`, `/v2/`)
- **RESTful**: Ressourcen-orientiert
- **GraphQL**: Für flexible Queries (optional)
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Deprecation Policy**: 6 Monate Vorankündigung

### Update-Strategie
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Rolling Updates**: Ohne Downtime bei Minor/Patch
- **Blue-Green-Deployment**: Für Major-Versions
- **Feature Flags**: Neue Features optional aktivierbar
- **Rollback-Plan**: Automatisierte Rollbacks bei Fehlern

### Template-System
- **LXC-Templates**: Versioniert und getestet
- **Infrastructure as Code**: Ansible/Terraform
- **Configuration Management**: SaltStack/Puppet (optional)
- **Immutable Infrastructure**: Container als Einheiten deployen

## 6.7 Benutzerfreundlichkeit & Zugänglichkeit

### User Experience (UX)
- **Konsistenz**: Einheitliches Design über alle Module
- **Intuitivität**: Max. 3 Klicks zu häufigen Aktionen
- **Feedback**: Unmittelbare Rückmeldung bei Benutzeraktionen
- **Error Messages**: Verständlich, mit Lösungsvorschlägen
- **Help System**: Kontext-sensitive Hilfe, Video-Tutorials

### Responsive Design
- **Desktop**: Optimiert für 1920x1080+
- **Tablet**: Angepasst für iPad/Android-Tablets
- **Mobile**: Touch-optimiert für Smartphone-Nutzung
- **Progressive Web App (PWA)**: Offline-Funktionalität (optional)

### Accessibility (WCAG 2.1 Level AA)
- **Keyboard Navigation**: Alle Funktionen ohne Maus nutzbar
- **Screen Reader**: ARIA-Labels für assistive Technologien
- **Kontrast**: Min. 4.5:1 für Text, 3:1 für UI-Komponenten
- **Font-Skalierung**: Unterstützt bis 200% Vergrößerung
- **Farbblindheit**: Keine rein farbbasierte Information

### Themes & Customization
- **Dark Mode**: Augenschonendes Design
- **Light Mode**: Standard-Theme
- **High Contrast**: Für Sehbeeinträchtigungen
- **Custom Branding**: Logo, Farben pro Mandant
- **Dashboard-Personalisierung**: Widgets drag & drop

### Performance (Frontend)
- **Initial Load**: < 2 Sekunden
- **Time to Interactive**: < 3 Sekunden
- **Bundle Size**: < 500 KB (initial JS)
- **Lazy Loading**: Module on-demand
- **Service Worker**: Caching für schnellere Ladezeiten

## 6.8 Protokollierung & Nachvollziehbarkeit

### Audit-Trail
- **Datenänderungen**: Who, What, When, Where
- **Zugriffe**: Alle Lese-/Schreibzugriffe auf sensible Daten
- **Login-Events**: Erfolgreiche/fehlgeschlagene Anmeldungen
- **API-Calls**: Request/Response für kritische Endpunkte
- **System-Changes**: Konfigurationsänderungen, Updates

### Versionierung
- **Daten-Versionierung**: Historie für CRM, Tickets, Assets
- **Document-Versioning**: Verträge, Angebote, Reports
- **Rollback-Capability**: Wiederherstellung alter Versionen
- **Diff-View**: Änderungen visuell vergleichen

### Integrität
- **Checksums**: SHA-256 für kritische Daten
- **Digital Signatures**: Für Rechnungen, Verträge
- **Tamper-Detection**: Erkennung nachträglicher Änderungen
- **Blockchain (optional)**: Unveränderbare Audit-Logs

### Export & Reporting
- **Audit-Reports**: Filterable, exportierbar (PDF/CSV/Excel)
- **DSGVO-Auskunft**: Automatisch generierbar
- **Compliance-Reports**: Für Audits vorbereitet
- **Real-Time-Dashboard**: Live-Ansicht aktueller Änderungen

## 6.9 Kompatibilität & Abhängigkeiten

### Betriebssysteme
| Komponente | Unterstützt |
|------------|-------------|
| LXC-Container | Debian 12, Ubuntu 22.04/24.04 |
| Proxmox VE | 8.0+ |
| Clients (Browser) | Chrome 120+, Firefox 120+, Edge 120+, Safari 17+ |
| Mobile | iOS 16+, Android 12+ |

### Schnittstellen
- **BMD NTCS**: REST-API, Version 2023+
- **DATEV**: DATEVconnect online
- **Hudu**: API v2
- **i-doit**: API 1.14+
- **Infexio**: Custom REST/GraphQL API
- **Microsoft 365**: Graph API v1.0
- **RMM-Systeme**:
  - Datto RMM: API v3
  - N-able RMM: API v2
  - Kaseya VSA: REST API

### Dependencies
- **Runtime**: Node.js 20 LTS, Python 3.11+
- **Database**: PostgreSQL 15+, Redis 7.x
- **Message Queue**: RabbitMQ 3.12+
- **Search**: Elasticsearch 8.x
- **Monitoring**: Zabbix 6.x, Prometheus 2.x

### Browser-Requirements
- **JavaScript**: ES2022
- **WebAssembly**: Supported
- **WebSocket**: Für Real-Time-Features
- **Service Worker**: Für PWA (optional)
- **Local Storage**: Min. 10 MB

## 6.10 Nicht-funktionale Zielwerte (Übersicht)

| Kategorie | Metrik | Zielwert |
|-----------|--------|----------|
| **Performance** | API Response Time | < 100ms (p95) |
| | Page Load Time | < 2s |
| | Concurrent Users | 500+ |
| **Verfügbarkeit** | Uptime | 99.5% (99.9% HA) |
| | RTO | 2h (15min HA) |
| | RPO | 4h (1h HA) |
| **Security** | Password Complexity | Min. 12 Zeichen |
| | Session Timeout | 30min Inaktivität |
| | Encryption | TLS 1.3, AES-256 |
| **Skalierung** | Max. Mandanten | 200 (1000+ Enterprise) |
| | Max. Tickets/Jahr | 250k (1M+ Enterprise) |
| | Storage | 5 TB (50 TB+ Enterprise) |
| **Compliance** | DSGVO | Vollständig konform |
| | Audit-Retention | 12 Monate (Security) |
| | Backup-Retention | 30 Tage (90 Tage Archiv) |

Dieses Kapitel definiert die verbindlichen Rahmenparameter, an denen Architektur, Betrieb und Qualitätssicherung gemessen werden.
Die Anforderungen sind so gewählt, dass sie auf Proxmox VE-Cluster-Basis realistisch umsetzbar und gleichzeitig MSP-typischen SLA-Erwartungen gerecht werden.
