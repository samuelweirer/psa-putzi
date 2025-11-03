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

**Dokument-Umfang:** 150+ Seiten technische Spezifikationen

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

### Für Security
- **Kapitel 5** definiert die Security-Architektur
- **Kapitel 18** enthält die Security Checklist

### Für Architekten
- **Kapitel 1** erklärt Architektur-Prinzipien
- **Kapitel 16** dokumentiert Architecture Decision Records (ADRs)
- **Kapitel 12** beschreibt Skalierungs-Strategien

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
- Aufteilung in 9 Kapitel für bessere Lesbarkeit
- Billing Rate Model Fix hinzugefügt

---

**© 2025 - PSA-Platform Projektteam - Internes Dokument**
