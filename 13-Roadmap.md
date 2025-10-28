# 13 Roadmap & Priorisierung

## 13.1 Phasenübersicht

### Phase 1: MVP (Monate 1-4)
**Ziel**: Minimal funktionsfähige Plattform für Pilot-Kunden

**Features**:
- Core-CRM (Kunden, Kontakte, Standorte)
- Basic-Ticketing (E-Mail, Portal, SLA)
- Zeiterfassung
- Simple-Reporting (Dashboards)
- User-Management + SSO

**Technisch**:
- Single-Node Proxmox-Setup
- PostgreSQL + Redis
- REST-API (v1)
- Basic-UI (React)

**Deliverable**: Funktionierendes System für 1-2 Pilotkunden

### Phase 2: Core-Platform (Monate 5-8)
**Ziel**: Produktionsreife Kernfunktionen

**Features**:
- Erweiterte Ticketing (RMM-Integration, Workflows)
- Projektmanagement (Gantt, Ressourcen)
- Billing (Rechnungen, Verträge, DATEV/BMD-Export)
- Asset-Management (inkl. Lizenz-Tracking)
- Angebotswesen

**Technisch**:
- 3-Node-Cluster (HA)
- RabbitMQ für Events
- Elasticsearch für Suche
- Infexio-Integration

**Deliverable**: Vollständige PSA-Lösung für produktiven Betrieb

### Phase 3: Advanced-Features (Monate 9-12)
**Ziel**: Differenzierungs-Features und Automatisierung

**Features**:
- vCIO-Modul (QBR, Roadmaps)
- Co-Managed-IT
- Workflow-Engine
- Security/SOC-Integration
- KI-Integration (Phase 1: Ticket-Kategorisierung)

**Technisch**:
- API-Gateway (Kong/Traefik)
- Multi-Tenant-Optimierung
- Performance-Tuning
- Monitoring-Ausbau (Grafana)

**Deliverable**: Premium-Features für Enterprise-Kunden

### Phase 4: Platform-Maturity (Monate 13-18)
**Ziel**: Skalierung, KI-Features, Marktreife

**Features**:
- KI-Integration (Phase 2: Chatbot, Dokumentation, Analytics)
- Mobile-App (iOS/Android)
- Advanced-Reporting (Power BI Connector)
- Contract-True-Up-Automatisierung
- API-Marketplace (Third-Party-Integrationen)

**Technisch**:
- Multi-Region-Support
- Geo-Loadbalancing
- Advanced-Security (SIEM-Integration)
- Performance-Optimierung auf 10.000+ Users

**Deliverable**: Marktführende MSP-Plattform für DACH-Raum

## 13.2 Priorisierung nach Geschäftswert

### High-Priority (Must-Have)
| Feature | Business-Value | Complexity | Phase |
|---------|----------------|------------|-------|
| Ticketing | 10/10 | Medium | MVP |
| CRM | 9/10 | Low | MVP |
| Billing | 9/10 | High | Core |
| Zeiterfassung | 8/10 | Low | MVP |
| SLA-Management | 8/10 | Medium | Core |
| RMM-Integration | 8/10 | Medium | Core |

### Medium-Priority (Should-Have)
| Feature | Business-Value | Complexity | Phase |
|---------|----------------|------------|-------|
| Projektmanagement | 7/10 | Medium | Core |
| Asset-Management | 7/10 | Medium | Core |
| Reporting | 7/10 | Medium | Core |
| Workflow-Engine | 7/10 | High | Advanced |
| vCIO-Modul | 6/10 | Medium | Advanced |

### Low-Priority (Nice-to-Have)
| Feature | Business-Value | Complexity | Phase |
|---------|----------------|------------|-------|
| KI-Integration | 8/10 | Very High | Advanced/Platform |
| Mobile-App | 5/10 | High | Platform |
| Co-Managed-IT | 6/10 | Medium | Advanced |
| Security-Integration | 7/10 | Medium | Advanced |

## 13.3 Meilensteine

### M1: MVP-Alpha (Ende Monat 2)
- Core-CRM + Ticketing functional
- Intern testbar
- Single-Node-Setup

### M2: MVP-Beta (Ende Monat 3)
- Zeiterfassung, Reporting
- 2-3 Test-User
- Bug-Fixing

### M3: MVP-Release (Ende Monat 4)
- Pilot-Kunde live
- Dokumentation vollständig
- Support-Prozesse etabliert

### M4: Core-Alpha (Ende Monat 6)
- Billing + Projektmanagement
- 3-Node-Cluster produktiv
- Infexio-Integration

### M5: Core-Release (Ende Monat 8)
- 5-10 Kunden produktiv
- RMM-Integrationen
- DATEV/BMD-Export

### M6: Advanced-Release (Ende Monat 12)
- vCIO + Workflows
- 20+ Kunden
- KI-Features (Phase 1)

### M7: Platform-Release (Ende Monat 18)
- 50+ Kunden
- KI-Features (Phase 2)
- Marktreife

## 13.5 Risikomanagement und Abhängigkeiten

### Technische Risiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Performance-Probleme bei Skalierung | Mittel | Hoch | Load-Tests ab Phase 2, Caching-Strategie |
| RMM-API-Inkompatibilität | Hoch | Mittel | Adapter-Pattern, frühzeitige Tests |
| LXC-Limitierungen | Niedrig | Hoch | Kubernetes-Fallback-Option evaluieren |
| Datenbank-Bottleneck | Mittel | Hoch | Sharding-Strategie, Read-Replicas |

### Geschäftliche Risiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Verzögerter Pilot-Kunde | Mittel | Mittel | Internes Dogfooding, 3 Backup-Piloten |
| Feature-Creep | Hoch | Hoch | Strenge Roadmap-Kontrolle, MVP-Fokus |
| Ressourcen-Engpass | Mittel | Hoch | Externe Entwickler, Priorisierung |
| Konkurrenz-Produkt-Launch | Mittel | Mittel | Schnelle Iteration, USP-Fokussierung |

### Abhängigkeiten
- **Externe APIs**: DATEV, BMD, RMM-Hersteller
- **Hardware**: Proxmox-Cluster-Beschaffung
- **Team**: Verfügbarkeit Entwickler, QA
- **Pilotkunden**: Bereitschaft zur Teilnahme

## 13.7 Governance & Entscheidungsstruktur

### Steering Committee
- **Frequenz**: Monatlich
- **Teilnehmer**: 
  - Geschäftsführung
  - Produktmanager
  - Tech-Lead
  - Sales-Leiter
- **Verantwortung**:
  - Budget-Freigabe
  - Roadmap-Anpassungen
  - Go/No-Go-Entscheidungen

### Product Board
- **Frequenz**: Wöchentlich
- **Teilnehmer**:
  - Produktmanager
  - Tech-Lead
  - UX-Designer
- **Verantwortung**:
  - Feature-Priorisierung
  - Sprint-Planung
  - Bug-Triage

### Change Advisory Board (CAB)
- **Frequenz**: Bei Bedarf (vor größeren Releases)
- **Teilnehmer**:
  - Tech-Lead
  - Operations
  - QA
- **Verantwortung**:
  - Änderungsfreigabe
  - Risikobewertung
  - Rollback-Planung
