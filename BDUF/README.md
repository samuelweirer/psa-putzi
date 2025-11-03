# Big Design Up Front (BDUF)
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Status:** Final Draft
**Autor:** Tech-Lead & Architektur-Team
**Basierend auf:** BRD v1.0

---

## EXECUTIVE SUMMARY

Dieses BDUF-Dokument definiert die vollständige technische Architektur der PSA-Platform vor Entwicklungsbeginn.

**Kern-Architektur:**
- Microservices mit LXC-Containern auf Proxmox VE
- Node.js/TypeScript Backend + React Frontend
- PostgreSQL, Redis, RabbitMQ, Elasticsearch
- JWT-Authentication + RBAC
- CI/CD mit GitLab
- 3-Node HA-Cluster

**Dokument-Umfang:** 20 Kapitel + Appendix mit 200+ Seiten technische Spezifikationen

---

## KAPITEL-STRUKTUR

Die BDUF-Dokumentation ist in folgende Kapitel aufgeteilt:

### [Kapitel 1: Architektur-Prinzipien & Übersicht](BDUF-Chapter1.md)
- SOLID-Prinzipien
- 12-Factor App Prinzipien
- Domain-Driven Design (DDD)
- Architektur-Übersicht

### [Kapitel 2: Technologie-Stack](BDUF-Chapter2.md)
- Backend-Stack (Node.js, TypeScript, FastAPI)
- Frontend-Stack (React, Vue.js)
- Datenbanken (PostgreSQL, Redis, Elasticsearch)
- Message Queues (RabbitMQ)
- Monitoring & Observability

### [Kapitel 3: Datenmodell & Datenbank-Design](BDUF-Chapter3.md)
- Vollständiges ER-Diagramm
- Kern-Tabellen (SQL)
- Billing Rate Resolution Logic
- Datenbank-Optimierungen
- Erweiterte Tabellen

### [Kapitel 4: API-Design & Schnittstellen](BDUF-Chapter4.md)
- RESTful API-Design
- GraphQL-Integration
- API-Versionierung
- Error-Handling
- API-Dokumentation (OpenAPI)

### [Kapitel 5: Security-Architektur](BDUF-Chapter5.md)
- Authentifizierung (SSO, MFA)
- Autorisierung (RBAC)
- Verschlüsselung (TLS, AES-256)
- Compliance (DSGVO, ISO 27001)
- Security Best Practices

### [Kapitel 6: Container-Architektur (LXC)](BDUF-Chapter6.md)
- LXC vs. Docker Vergleich
- Container-Orchestrierung auf Proxmox
- Ressourcen-Management
- Networking & Storage

### [Kapitel 7: Netzwerk-Architektur](BDUF-Chapter7.md)
- Netzwerk-Topologie
- VLAN-Segmentierung
- Firewall-Regeln
- Load Balancing

### [Kapitel 8: Deployment & CI/CD](BDUF-Chapter8.md)
- GitLab CI/CD Pipelines
- Deployment-Strategien
- Blue-Green Deployment
- Rollback-Mechanismen

### [Kapitel 9: Monitoring & Logging](BDUF-Chapter9.md)
- Monitoring-Stack (Zabbix, Prometheus, Grafana)
- Logging (ELK Stack)
- Alerting & On-Call
- Metrics & KPIs

### [Kapitel 10: Backup & Disaster Recovery](BDUF-Chapter10.md)
- Backup-Strategie (GFS-Schema)
- Disaster Recovery-Plan
- RTO/RPO-Ziele
- Backup-Testing

### [Kapitel 11: Performance-Optimierung](BDUF-Chapter11.md)
- Database-Performance-Tuning
- API-Optimierungen
- Caching-Strategien
- Query-Optimierung

### [Kapitel 12: Skalierungs-Strategie](BDUF-Chapter12.md)
- Horizontal vs. Vertical Scaling
- Database Read-Replicas
- Service-Replikation
- Load Balancing

### [Kapitel 13: Code-Organisation & Standards](BDUF-Chapter13.md)
- Monorepo-Struktur
- Coding-Standards
- Code-Review-Prozess
- Git-Workflow

### [Kapitel 14: Testing-Strategie](BDUF-Chapter14.md)
- Test-Pyramid
- Unit/Integration/E2E-Tests
- Performance-Tests
- Security-Tests

### [Kapitel 15: Entwicklungs-Workflow](BDUF-Chapter15.md)
- Feature-Development
- Branch-Strategy
- Merge-Requests
- Release-Prozess

### [Kapitel 16: Architecture Decision Records (ADR)](BDUF-Chapter16.md)
- ADR-Template
- Wichtige Architekturentscheidungen
- ADR-Verwaltungsprozess
- Dokumentierte Entscheidungen (LXC, PostgreSQL, etc.)

### [Kapitel 17: Performance Benchmarks](BDUF-Chapter17.md)
- Response-Zeit-Anforderungen
- Durchsatz-Benchmarks
- Skalierungsgrenzen
- Load-Test-Szenarien

### [Kapitel 18: Security Checklist](BDUF-Chapter18.md)
- Pre-Deployment Security Checklist
- DSGVO-Compliance Checklist
- ISO 27001 Controls
- Penetration Testing

### [Kapitel 19: Deployment Checklist](BDUF-Chapter19.md)
- Pre-Deployment Checklist
- Deployment-Prozess
- Blue-Green Deployment
- Rollback-Prozedur

### [Kapitel 20: Maintenance & Troubleshooting](BDUF-Chapter20.md)
- Regelmäßige Wartungsaufgaben
- Patch-Management
- Incident-Management
- Troubleshooting-Guides

### [Appendix: Nützliche Befehle](BDUF-Appendix.md)
- Proxmox-Befehle
- PostgreSQL-Befehle
- Docker/LXC-Befehle
- Troubleshooting-Commands

---

## VERWENDUNG

### Für Entwickler
- Lesen Sie **Kapitel 1-4** für Architektur- und API-Verständnis
- **Kapitel 3** ist essentiell für Datenbank-Entwicklung
- **Kapitel 13** definiert Code-Organisation und Standards

### Für DevOps
- **Kapitel 6-9** beschreiben Infrastructure, Deployment und Monitoring
- **Kapitel 10** behandelt Backup & Disaster Recovery
- **Kapitel 19** enthält die Deployment Checklist
- **Kapitel 20** enthält Maintenance & Troubleshooting Guides

### Für Security
- **Kapitel 5** definiert die Security-Architektur
- **Kapitel 18** enthält die Security Checklist

### Für Architekten
- **Kapitel 1** erklärt Architektur-Prinzipien
- **Kapitel 16** dokumentiert Architecture Decision Records (ADRs)
- **Kapitel 12** beschreibt Skalierungs-Strategien
- **Kapitel 17** enthält Performance Benchmarks

---

## WICHTIGE HINWEISE

### Billing Rate Model (Kapitel 3)
**WICHTIG:** Das Billing-Modell wurde überarbeitet, um mehrere Abrechnungsraten pro Benutzer zu unterstützen:
- `users.internal_cost_rate` - Interne Kosten des MSP für den Mitarbeiter
- `users.default_billing_rate` - Standard-Abrechnungsrate (Fallback)
- `user_billing_rates` - Kundenspezifische Abrechnungsraten (neue Tabelle)
- `time_entries.billing_rate` - Dem Kunden berechnete Rate (Snapshot)
- `time_entries.cost_rate` - Interne Kosten (Snapshot)

Siehe [BDUF-Chapter3-Billing-Rate-Fix.md](BDUF-Chapter3-Billing-Rate-Fix.md) für Details.

---

## RELATED DOCUMENTS

- [../PSA-Platform-BRD.md](../PSA-Platform-BRD.md) - Business Requirements Document
- [../PSA-Platform-BDUF-Complete.md](../PSA-Platform-BDUF-Complete.md) - Vollständiges BDUF-Dokument (alle Kapitel zusammen)
- [../README.md](../README.md) - Projekt-Übersicht

---

## CHANGELOG

### Version 1.0 (November 2025)
- Initial BDUF-Dokumentation
- Vollständige Aufteilung in 20 Kapitel + Appendix
- Billing Rate Model Fix hinzugefügt (Kapitel 3)
- Architecture Decision Records hinzugefügt (Kapitel 16)
- Performance Benchmarks hinzugefügt (Kapitel 17)
- Security Checklist hinzugefügt (Kapitel 18)
- Deployment Checklist hinzugefügt (Kapitel 19)
- Maintenance & Troubleshooting hinzugefügt (Kapitel 20)

---

**© 2025 - PSA-Platform Projektteam - Internes Dokument**
