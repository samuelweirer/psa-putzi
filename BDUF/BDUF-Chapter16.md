# Big Design Up Front (BDUF) - Kapitel 16
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Kapitel:** 16 - Architecture Decision Records (ADR)

---

## 16. ARCHITECTURE DECISION RECORDS (ADR)

### 16.1 ADR-Template

Architecture Decision Records dokumentieren wichtige Architekturentscheidungen im Projekt.

**Format:**
```markdown
# ADR-XXX: [Titel der Entscheidung]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Datum:** YYYY-MM-DD
**Entscheider:** [Namen]
**Tags:** [Kategorie, z.B. Infrastructure, Security, Data]

## Kontext

Beschreibung des Problems oder der Situation, die eine Entscheidung erfordert.

## Entscheidung

Die getroffene Entscheidung und Begründung.

## Alternativen

Welche anderen Optionen wurden in Betracht gezogen und warum wurden sie verworfen?

## Konsequenzen

### Positiv
- Vorteil 1
- Vorteil 2

### Negativ
- Nachteil 1
- Nachteil 2

### Risiken
- Risiko 1
- Risiko 2

## Implementierung

Wie wird die Entscheidung umgesetzt?

## Referenzen
- Links zu relevanten Dokumenten
```

---

### 16.2 Wichtige Architekturentscheidungen

#### ADR-001: LXC statt Docker

**Status:** Accepted
**Datum:** 2025-10
**Entscheider:** Tech-Lead, DevOps-Team

**Kontext:**
Wahl zwischen Docker/Kubernetes und LXC-Containern auf Proxmox für die PSA-Platform.

**Entscheidung:**
LXC-Container auf Proxmox VE statt Docker/Kubernetes.

**Begründung:**
- Bessere Performance (geringerer Overhead)
- Native Proxmox-Integration
- Einfachere Verwaltung für MSP-Zielgruppe
- Keine zusätzliche Orchestrierungs-Layer nötig
- Bewährte Technologie im MSP-Umfeld

**Alternativen:**
- **Docker + Kubernetes:** Zu komplex für Zielgruppe, höherer Overhead
- **Docker Swarm:** Weniger Adoption, unsichere Zukunft
- **Bare Metal:** Schlechtere Ressourcen-Nutzung, schwieriger zu warten

**Konsequenzen:**
- ✅ Geringerer Ressourcen-Overhead
- ✅ Einfachere Backup/Restore-Prozesse
- ✅ Bewährte Technologie für MSPs
- ⚠️ Weniger Portabilität als Docker
- ⚠️ Kleinere Community als Kubernetes

---

#### ADR-002: PostgreSQL als primäre Datenbank

**Status:** Accepted
**Datum:** 2025-10
**Entscheider:** Tech-Lead, Backend-Team

**Kontext:**
Wahl der primären Datenbank für die PSA-Platform.

**Entscheidung:**
PostgreSQL 15+ als primäre relationale Datenbank.

**Begründung:**
- ACID-Compliance für kritische Geschäftsdaten
- Exzellente JSON/JSONB-Unterstützung
- Leistungsstarke Full-Text-Suche
- Bewährte Stabilität und Performance
- Open Source mit großer Community
- Native Unterstützung für Partitionierung
- Hervorragende Performance bei komplexen Joins

**Alternativen:**
- **MySQL/MariaDB:** Schwächere JSON-Unterstützung, weniger Features
- **MongoDB:** NoSQL nicht geeignet für relationale Geschäftsdaten
- **MSSQL:** Lizenzkosten, Vendor-Lock-in

**Konsequenzen:**
- ✅ Stabile, bewährte Technologie
- ✅ Hervorragende Performance
- ✅ Keine Lizenzkosten
- ✅ JSONB für flexible Datenmodelle
- ⚠️ Komplexere Skalierung als NoSQL

---

#### ADR-003: Multi-Tenancy auf Datenbankebene

**Status:** Accepted
**Datum:** 2025-10
**Entscheider:** Tech-Lead, Security-Team

**Kontext:**
Architektur für Multi-Tenancy: Separate Datenbanken vs. Shared Database mit Tenant-ID.

**Entscheidung:**
Shared Database mit tenant_id-Spalte in allen Tabellen.

**Begründung:**
- Einfachere Verwaltung (eine DB statt hunderte)
- Effizientere Ressourcennutzung
- Einfachere Backups und Updates
- Cross-Tenant-Analytics möglich
- Bewährtes Pattern im SaaS-Bereich

**Alternativen:**
- **Separate Datenbanken pro Tenant:** Zu hoher Overhead, komplexe Verwaltung
- **Separate Schemas:** Kompromiss, aber immer noch komplex

**Konsequenzen:**
- ✅ Einfachere Verwaltung und Skalierung
- ✅ Effiziente Ressourcennutzung
- ✅ Vereinfachte Backups
- ⚠️ Risiko von Daten-Leaks bei Fehler in tenant_id-Filtering
- ⚠️ Row-Level-Security (RLS) erforderlich

**Mitigation:**
- Strikte Row-Level Security (RLS) auf Datenbankebene
- Automatische Tests für Tenant-Isolation
- Code-Reviews mit Fokus auf tenant_id-Filtering

---

#### ADR-004: User-Billing-Rates Tabelle

**Status:** Accepted
**Datum:** 2025-11
**Entscheider:** Tech-Lead, Product Owner

**Kontext:**
Ursprüngliches Datenmodell hatte nur eine hourly_rate pro User, konnte aber keine kundenspezifischen Abrechnungsraten abbilden.

**Entscheidung:**
Neue Tabelle `user_billing_rates` für kontext-spezifische Abrechnungsraten (Kunde, Vertrag, Service-Level, Arbeitstyp).

**Begründung:**
- Realistische Anforderung: Unterschiedliche Kunden zahlen unterschiedliche Raten
- Service-Level-Differenzierung (L1, L2, L3)
- Zeitliche Flexibilität (valid_from / valid_until)
- Profitabilitäts-Analyse durch Trennung von Billing- und Cost-Rate

**Alternativen:**
- **Eine Rate pro User:** Zu unflexibel
- **Rate nur im Vertrag:** Keine User-spezifische Differenzierung

**Konsequenzen:**
- ✅ Flexible, realitätsnahe Abrechnung
- ✅ Profitabilitäts-Tracking möglich
- ✅ Historische Genauigkeit durch Snapshots
- ⚠️ Komplexere Rate-Resolution-Logik
- ⚠️ Mehr Konfigurationsaufwand

**Implementierung:**
Siehe BDUF-Chapter3-Billing-Rate-Fix.md

---

#### ADR-005: Node.js statt Python für Backend

**Status:** Accepted
**Datum:** 2025-10
**Entscheider:** Tech-Lead, Backend-Team

**Kontext:**
Wahl der Backend-Sprache für API-Services.

**Entscheidung:**
Node.js 20 LTS mit TypeScript 5.x als primäre Backend-Technologie.

**Begründung:**
- Non-blocking I/O für hohen Durchsatz
- Einheitliche Sprache (JavaScript/TypeScript) auf Frontend und Backend
- Großes NPM-Ecosystem
- Hervorragende Performance für I/O-intensive Anwendungen
- Starke Community und Tooling

**Alternativen:**
- **Python (FastAPI):** Gute Option, aber langsamere Performance, weniger Frontend-Synergien
- **Go:** Hervorragende Performance, aber steilere Lernkurve
- **Java/Spring Boot:** Zu heavyweight, hoher Ressourcenverbrauch

**Konsequenzen:**
- ✅ Hohe Performance bei I/O-Operationen
- ✅ Einheitliche Codebasis
- ✅ Große Entwickler-Community
- ⚠️ Callback-Hell (mitigiert durch async/await)
- ⚠️ Weniger streng typisiert als Go/Java (mitigiert durch TypeScript)

---

#### ADR-006: REST API mit optionalem GraphQL

**Status:** Accepted
**Datum:** 2025-10
**Entscheider:** Tech-Lead, Frontend-Team

**Kontext:**
API-Design-Pattern für die PSA-Platform.

**Entscheidung:**
REST API als Standard, GraphQL als optionale Ergänzung für komplexe Queries.

**Begründung:**
- REST ist etabliert, einfach zu verstehen
- Gute Caching-Eigenschaften
- GraphQL bietet Flexibilität für komplexe Frontend-Anforderungen
- Hybridansatz gibt Entwicklern Wahlfreiheit

**Alternativen:**
- **Nur REST:** Zu unflexibel für komplexe UI-Anforderungen
- **Nur GraphQL:** Steile Lernkurve, Caching komplexer
- **gRPC:** Zu komplex für Web-Frontend

**Konsequenzen:**
- ✅ Flexibilität für verschiedene Use Cases
- ✅ REST für einfache CRUD-Operationen
- ✅ GraphQL für komplexe Dashboards
- ⚠️ Zwei API-Paradigmen zu warten
- ⚠️ Zusätzlicher Entwicklungsaufwand

---

### 16.3 ADR-Verwaltung

**Speicherort:**
- ADRs werden im Git-Repository im Ordner `/docs/adr/` gespeichert
- Dateinamen: `ADR-XXX-kurzbeschreibung.md` (z.B. `ADR-001-lxc-statt-docker.md`)

**Prozess:**
1. **Vorschlag:** ADR im Draft-Status erstellen
2. **Review:** Team-Review über Pull Request
3. **Entscheidung:** Akzeptierung oder Ablehnung
4. **Dokumentation:** Status auf "Accepted" setzen
5. **Kommunikation:** Team über Entscheidung informieren

**Änderungen:**
- ADRs sind unveränderlich (immutable)
- Bei Änderungen: Neues ADR erstellen, das das alte "superseded"
- Grund für Änderung dokumentieren

---

### 16.4 Zukünftige ADRs

**Geplante Entscheidungen:**
- ADR-007: Frontend-Framework (React vs. Vue.js)
- ADR-008: State-Management (Redux, Zustand, Pinia)
- ADR-009: CI/CD-Tooling (GitLab CI vs. GitHub Actions)
- ADR-010: Monitoring-Stack Details
- ADR-011: Session-Management (JWT vs. Server-side Sessions)
- ADR-012: File-Storage-Lösung
- ADR-013: Email-Delivery-Service

---

**Nächstes Kapitel:** [17-Performance-Benchmarks](BDUF-Chapter17.md)

**Zurück zum Inhaltsverzeichnis:** [BDUF README](README.md)
