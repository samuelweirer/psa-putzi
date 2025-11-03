# Business Requirements Document (BRD)
## PSA-Platform für Managed Service Provider

**Version:** 1.0  
**Datum:** November 2025  
**Status:** Draft  
**Autor:** IT-Projektteam  
**Genehmigung:** Ausstehend

---

## Dokumentenhistorie

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 1.0 | Nov 2025 | Projektteam | Initiale Version basierend auf Anforderungskatalog v0.7 |

---

## 1. Executive Summary

### 1.1 Projektübersicht

Die PSA-Platform ist eine vollständig integrierte Professional Services Automation-Lösung für Managed Service Provider (MSP) im deutschsprachigen Raum (DACH). Sie vereint sämtliche Geschäfts- und Technikprozesse – von der Kundenbeziehung über Ticket- und Projektabwicklung bis hin zu Abrechnung, Reporting und strategischer Kundenentwicklung – in einer einheitlichen, skalierbaren Plattform.

### 1.2 Business Case

**Problem:**
- Fragmentierte Systemlandschaften mit 5-10 parallelen Tools
- Datensilos und manuelle Synchronisation
- Medienbrüche zwischen CRM, Ticketing, Zeiterfassung und Abrechnung
- Fehlende DACH-spezifische Features (DATEV, BMD, DSGVO)
- Hoher manueller Verwaltungsaufwand

**Lösung:**
Einheitliche PSA-Platform mit:
- Zentraler Datenhaltung ohne Redundanz
- Durchgängige Prozessketten ohne Medienbrüche
- Native DACH-Integration (DATEV, BMD, ZUGFeRD, ebInterface)
- LXC-basierte Architektur auf Proxmox
- KI-gestützte Automatisierung

**Erwarteter Nutzen:**
- 30% Steigerung der operativen Effizienz
- 50% Reduktion manueller Dateneingaben
- 15-20% mehr abrechenbare Stunden
- ROI innerhalb 18 Monaten
- Verbesserung Kundenzufriedenheit auf >4.5/5.0

### 1.3 Strategische Ziele

1. **Operative Exzellenz:** Standardisierte, automatisierte Prozesse
2. **Kundenfokus:** Transparente Kommunikation, Self-Service, Co-Managed IT
3. **Skalierbarkeit:** Wachstum von 5 auf 500+ Techniker unterstützen
4. **Innovation:** KI-Integration für Automatisierung und Analyse
5. **Compliance:** DSGVO, ISO 27001, ITIL 4 Best Practices

---

## 2. Scope & Zielgruppe

### 2.1 In Scope

**Core-Module (MVP):**
- CRM & Kundenverwaltung
- Service-Desk & Ticketing mit SLA-Management
- Zeiterfassung
- Basis-Reporting & Dashboards
- User-Management mit SSO

**Advanced-Module (Core-Platform):**
- Projektmanagement mit Gantt-Charts
- Billing & Fakturierung
- Asset- & Lizenzmanagement
- Angebotswesen
- RMM-Integration (Datto, N-able, Kaseya)

**Premium-Module (Platform-Maturity):**
- vCIO-Modul (QBR-Automation)
- Co-Managed IT
- Workflow-Engine
- Security/SOC-Integration
- KI & LLM-Integration

**Integrationen:**
- DATEV (Deutschland)
- BMD NTCS (Österreich)
- Infexio (iteas-Eigenentwicklung)
- Hudu (Dokumentation)
- i-doit (CMDB)
- Microsoft 365 / Teams
- RMM-Systeme

### 2.2 Out of Scope

- Eigenentwicklung eines RMM-Systems
- Fertigung/Warenlogistik-Module
- HR-Management (außer Zeiterfassung)
- Eigenständiges ERP-System
- Mobile-App (erst Phase 4)

### 2.3 Zielgruppe

**Primär:**
- Managed Service Provider (5-500 Techniker)
- IT-Systemhäuser mit Service-Geschäft
- Service-Integratoren im DACH-Raum

**Sekundär:**
- Inhouse IT-Abteilungen (Co-Managed IT)
- Kleinere MSPs (<5 Techniker)

---

## 3. Business Requirements

### 3.1 Funktionale Anforderungen (High-Level)

#### 3.1.1 CRM & Kundenverwaltung
- Zentrale Verwaltung aller Kundeninformationen
- Kontaktverwaltung mit Hierarchien
- Vertragsverwaltung mit automatischen Verlängerungen
- Opportunity-Management
- Angebotserstellung aus Katalog
- 360°-Kundenansicht

#### 3.1.2 Service-Desk & Ticketing
- Multi-Channel-Eingang
- Automatische Kategorisierung und Routing
- SLA-Management mit Eskalationen
- Knowledge Base
- Zeiterfassung am Ticket
- Kundenportal

#### 3.1.3 Projektmanagement
- Projekt-Templates
- Gantt-Diagramme
- Zeit- und Materialerfassung
- Meilenstein-Tracking
- Budget-Überwachung

#### 3.1.4 Billing & Abrechnung
- Automatische Rechnungserstellung
- Vertragsbasierte Abrechnung
- DATEV/BMD-Integration
- Elektronische Formate
- Mahnwesen

#### 3.1.5 Asset- & Lizenzmanagement
- Zentrale Asset-Datenbank
- Lizenz-Tracking
- EOL/EOS-Warnungen
- Garantie-Management
- RMM-Integration

#### 3.1.6 vCIO-Modul
- QBR-Automation
- IT-Roadmaps (1-3 Jahre)
- Budget-Planung
- KPI-Dashboards
- PowerPoint/PDF-Export

#### 3.1.7 KI & LLM-Integration
- Intelligente Ticket-Kategorisierung
- Automatische Lösungsvorschläge
- Chatbot für First-Level-Support
- Semantische Suche
- Automatische QBR-Generierung
- Predictive Analytics

### 3.2 Nicht-funktionale Anforderungen

#### 3.2.1 Performance
- API Response Time: <200ms (p95)
- Page Load Time: <2s
- Concurrent Users: 500+
- Ticket-Verarbeitung: 10.000/Tag

#### 3.2.2 Verfügbarkeit
- Uptime: ≥99.5%
- RTO: 2 Stunden
- RPO: 4 Stunden
- Automatisches Failover

#### 3.2.3 Skalierbarkeit
- 200 Mandanten (3-Node-Cluster)
- 10.000 Tickets/Tag
- 50.000 Assets
- 5 TB Storage

#### 3.2.4 Security
- MFA (TOTP, FIDO2)
- SSO (SAML, OIDC, LDAP)
- TLS 1.3
- AES-256 Encryption
- RBAC
- Audit-Trail

#### 3.2.5 Compliance
- DSGVO-konform
- ISO 27001 Ready
- ITIL 4
- GoBD-konform
- Daten-Residency: DACH/EU

---

## 4. Technische Architektur

### 4.1 Technology Stack

**Host-Plattform:**
- Proxmox VE 8.x
- LXC Containers
- ZFS/Ceph Storage
- 3-Node HA-Cluster

**Datenbanken:**
- PostgreSQL 15+
- Redis 7.x
- Elasticsearch 8.x

**Backend:**
- Node.js 20 LTS / Python 3.11+
- FastAPI / Express.js

**Frontend:**
- React / Vue.js
- Responsive Design
- PWA

**Message Queue:**
- RabbitMQ 3.12+ / Kafka

**Monitoring:**
- Zabbix 6.x
- Prometheus + Grafana
- ELK Stack

### 4.2 Modulübersicht

| Modul | Container | Funktion |
|-------|-----------|----------|
| API Gateway | psa-api-gateway | Routing, Auth |
| CRM | psa-crm | Kundenverwaltung |
| Ticketing | psa-tickets | Service-Desk |
| Billing | psa-billing | Abrechnung |
| Projects | psa-projects | Projektmanagement |
| Assets | psa-assets | Asset-Management |
| Reporting | psa-reports | Dashboards |
| vCIO | psa-vcio | QBR-Automation |
| Workflows | psa-workflows | Workflow-Engine |
| AI/LLM | psa-ai | KI-Integration |
| Auth | psa-auth | SSO, MFA, RBAC |
| PostgreSQL | psa-db-master | Datenbank |
| Redis | psa-redis | Cache |
| RabbitMQ | psa-rabbitmq | Message Queue |

---

## 5. Integrationen

### 5.1 ERP-Integrationen

**DATEV (Deutschland):**
- DATEVconnect online
- Rechnungsexport
- Zahlungseingänge
- Kontenstammdaten

**BMD NTCS (Österreich):**
- REST-API Version 2023+
- Rechnungsexport
- Artikelstamm-Sync
- Kundenstamm-Sync

### 5.2 Dokumentations-Integrationen

**Hudu:**
- API v2
- Bi-direktionale Synchronisation
- Automatische Dokumentation

**i-doit:**
- API 1.14+
- CMDB-Synchronisation
- Asset-Import/Export

**Infexio:**
- Custom REST/GraphQL API
- Zentrale Datendrehscheibe
- OAuth2

### 5.3 RMM-Integrationen

**Datto RMM:**
- API v3
- Alert-to-Ticket
- Asset-Import

**N-able RMM:**
- API v2
- Alert-Integration
- Device-Management

**Kaseya VSA:**
- REST API
- Ticket-Synchronisation

### 5.4 Collaboration

**Microsoft 365 / Teams:**
- Graph API v1.0
- Teams-Benachrichtigungen
- Calendar-Sync

**Slack:**
- Webhook-Benachrichtigungen
- Slash-Commands

---

## 6. Rollen & Berechtigungen

### 6.1 Rollenhierarchie

```
System-Administrator
├── Mandanten-Administrator
│   ├── Service Manager
│   │   ├── Techniker L3
│   │   ├── Techniker L2
│   │   └── Techniker L1
│   ├── Account Manager
│   ├── Projektleiter
│   └── Billing-Manager
└── Kunde-Rollen
    ├── Kunde-Admin
    ├── Kunde-Techniker
    └── Kunde-Endbenutzer
```

### 6.2 Authentifizierung

- MFA (TOTP, FIDO2, SMS)
- SSO (Azure AD, LDAP, SAML 2.0)
- API-Key-Management
- Session-Timeout: 30min
- Password-Policy: Min. 12 Zeichen

---

## 7. Workflows & Prozesse

### 7.1 Ticket-Lifecycle

```
Eingang → Kategorisierung → Routing → 
Bearbeitung → Lösung → Abrechnung → Schließung
```

### 7.2 Projekt-Workflow

```
Anlage → Planung → Durchführung → 
Abnahme → Abrechnung → Review
```

### 7.3 Billing-Prozess

```
Input → Prüfung → Freigabe → 
Erstellung → Export → Archivierung
```

---

## 8. Roadmap & Phasen

### Phase 1: MVP (Monate 1-4)
**Features:**
- Core-CRM
- Basic-Ticketing
- Zeiterfassung
- User-Management + SSO

**Erfolgskriterien:**
- 80% User-Adoption
- <10 Support-Tickets/Monat
- API <200ms

### Phase 2: Core-Platform (Monate 5-8)
**Features:**
- Erweiterte Ticketing
- Projektmanagement
- Billing
- Asset-Management

**Erfolgskriterien:**
- 5-10 Kunden produktiv
- Uptime ≥99.5%
- 30% Effizienzgewinn

### Phase 3: Advanced (Monate 9-12)
**Features:**
- vCIO-Modul
- Co-Managed IT
- Workflow-Engine
- KI Phase 1

**Erfolgskriterien:**
- 20+ Kunden
- KI reduziert Tickets um 30%
- QBR <30min

### Phase 4: Platform-Maturity (Monate 13-18)
**Features:**
- KI Phase 2
- Mobile-App
- Advanced-Reporting
- API-Marketplace

**Erfolgskriterien:**
- 50+ Kunden
- ROI erreicht
- Referenzkunden DE/AT/CH

---

## 9. Erfolgskriterien & KPIs

### 9.1 Technisch

| Kriterium | Zielwert |
|-----------|----------|
| Uptime | ≥99.5% |
| API Response | <200ms |
| Page Load | <2s |
| Test Coverage | ≥70% |
| MTTR | <2h |

### 9.2 Wirtschaftlich

| Kriterium | Zielwert |
|-----------|----------|
| ROI | +18 Monate |
| Kosten/Tech | <50€/Mon |
| Effizienz | +30% |
| Umsatz | +15% |

### 9.3 User

| Kriterium | Zielwert |
|-----------|----------|
| Adoption | 90% |
| Satisfaction | ≥4.0/5.0 |
| NPS | ≥40 |
| Onboarding | <8h |

---

## 10. Risiken & Mitigation

### 10.1 Technische Risiken

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Performance-Probleme | Hoch | Load-Tests, Caching |
| RMM-Inkompatibilität | Mittel | Adapter-Pattern |
| DB-Bottleneck | Hoch | Sharding, Replicas |

### 10.2 Geschäftliche Risiken

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Verzögerter Pilot | Mittel | Internes Dogfooding |
| Feature-Creep | Hoch | MVP-Fokus |
| Ressourcen-Engpass | Hoch | Externe Entwickler |

---

## 11. Budget & Ressourcen

### 11.1 Team

| Rolle | Anzahl | Phase |
|-------|--------|-------|
| Produktmanager | 1 | 1-4 |
| Tech-Lead | 1 | 1-4 |
| Backend-Dev | 2-3 | 1-4 |
| Frontend-Dev | 2 | 1-4 |
| DevOps | 1 | 1-4 |
| QA-Engineer | 1 | 2-4 |

### 11.2 Infrastruktur

**Entwicklung:**
- 3x Proxmox Nodes: ~€3.000
- Storage (5TB): ~€2.000
- Netzwerk: ~€1.500

**Produktion:**
- 3x Proxmox Nodes: ~€15.000
- Storage (20TB): ~€8.000
- Netzwerk: ~€3.000
- Backup: ~€5.000

**Laufend (jährlich):**
- Strom/Kühlung: ~€3.000
- Support: ~€2.000
- Lizenzen: ~€5.000
- LLM-APIs: ~€2-5.000/Monat

---

## 12. Qualitätssicherung

### 12.1 Test-Strategie

- **Unit-Tests:** ≥70% Coverage
- **Integration-Tests:** API, DB, Queue
- **E2E-Tests:** Selenium/Playwright
- **Performance-Tests:** JMeter/Gatling
- **Security-Tests:** OWASP, Penetration

### 12.2 Monitoring

- Synthetics (jede Minute)
- Real-User Monitoring
- APM (Query Performance)
- Error-Tracking (Sentry)

---

## 13. Compliance

### 13.1 DSGVO

- Art. 15-20: Betroffenenrechte
- Encryption at Rest & Transit
- Audit-Logs (12 Monate)
- DPA mit Kunden
- DPIA für Hochrisiko

### 13.2 ISO 27001 (Optional)

- ISMS-Komponenten
- Asset-Inventory
- Risk-Assessment
- Externe Audits

---

## 14. Support & Wartung

### 14.1 Support

**Kanäle:**
- Portal (24/7)
- E-Mail
- Teams/Slack
- Telefon (Mo-Fr 08-17)

**Response:**
- P1: 15min
- P2: 2h
- P3: Nächster Tag
- P4: Best Effort

### 14.2 Wartung

**Täglich:**
- Backup-Verifizierung
- Log-Review
- Monitoring-Check

**Wöchentlich:**
- Patch-Status
- Performance-Analyse
- Storage-Check

**Monatlich:**
- Restore-Testing
- Security-Audit
- Kapazitäts-Planung

**Quartalsweise:**
- DR-Drill
- Penetration-Testing
- Performance-Tuning

---

## 15. Dokumentation

### 15.1 Technisch

- Architecture Decision Records
- API-Dokumentation (OpenAPI)
- Database-Schema
- Deployment-Guides
- Runbooks

### 15.2 Anwender

- User-Guides
- Video-Tutorials
- FAQ / Knowledge Base
- Shortcuts & Tipps

### 15.3 Schulung

**Techniker:** 4h Basis + 2h Advanced  
**Administratoren:** 8h Komplett  
**Refresher:** Quartalsweise

---

## 16. Genehmigung

| Rolle | Name | Datum | Unterschrift |
|-------|------|-------|--------------|
| Geschäftsführung | | | |
| Produktmanager | | | |
| Tech-Lead | | | |
| Finance-Controller | | | |

---

## 17. Glossar

| Begriff | Definition |
|---------|------------|
| API | Application Programming Interface |
| DACH | Deutschland, Österreich, Schweiz |
| DSGVO | Datenschutz-Grundverordnung |
| HA | High Availability |
| LXC | Linux Containers |
| MSP | Managed Service Provider |
| PSA | Professional Services Automation |
| QBR | Quarterly Business Review |
| RBAC | Role-Based Access Control |
| RMM | Remote Monitoring Management |
| ROI | Return on Investment |
| SLA | Service Level Agreement |
| SSO | Single Sign-On |
| vCIO | Virtual Chief Information Officer |

---

**Ende des Business Requirements Document**

*Version 1.0 | November 2025 | PSA-Platform Projektteam*
