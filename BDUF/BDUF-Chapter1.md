## 1. ARCHITEKTUR-PRINZIPIEN & ÜBERSICHT

### 1.1 Architektur-Prinzipien

**SOLID-Prinzipien:**
- **S**ingle Responsibility - Jede Klasse hat eine Verantwortung
- **O**pen/Closed - Offen für Erweiterung, geschlossen für Änderung
- **L**iskov Substitution - Unterklassen ersetzen Basisklassen
- **I**nterface Segregation - Kleine, spezifische Interfaces
- **D**ependency Inversion - Abhängigkeiten zu Abstraktionen

**12-Factor App Prinzipien:**
1. **Codebase** - Ein Repository, viele Deployments
2. **Dependencies** - Explizit deklariert und isoliert
3. **Config** - In Environment-Variables gespeichert
4. **Backing Services** - Als angehängte Ressourcen behandelt
5. **Build/Release/Run** - Strikte Trennung der Stages
6. **Processes** - App als stateless Prozesse
7. **Port Binding** - Services via Port-Binding exportiert
8. **Concurrency** - Scale-out via Prozess-Model
9. **Disposability** - Schneller Start und graceful shutdown
10. **Dev/Prod Parity** - Minimale Unterschiede zwischen Umgebungen
11. **Logs** - Als Event-Streams behandelt
12. **Admin Processes** - Als One-off-Prozesse

**Weitere Architektur-Prinzipien:**
- **API-First Design** - Alle Funktionen über APIs
- **Security by Design** - Security von Anfang an
- **Performance by Design** - Performance-Tests ab Sprint 1
- **Fail-Fast Principle** - Fehler früh erkennen
- **Idempotency** - API-Operationen idempotent
- **Circuit Breaker** - Graceful degradation bei Ausfällen
- **Event-Driven** - Lose Kopplung via Events

### 1.2 High-Level System-Architektur

```
┌─────────────────────────────────────────────┐
│           Internet / WAN                    │
└──────────────────┬──────────────────────────┘
                   │
            ┌──────▼──────┐
            │  Firewall   │
            │  pfsense    │
            └──────┬──────┘
                   │
        ┌──────────▼──────────┐
        │   Load Balancer     │
        │   HAProxy/Traefik   │
        └──────────┬──────────┘
                   │
     ┌─────────────▼─────────────┐
     │      API Gateway          │
     │  - JWT Authentication     │
     │  - Rate Limiting          │
     │  - Request Routing        │
     │  - Logging                │
     └─────────────┬─────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐    ┌───▼────┐    ┌───▼────┐
│  CRM   │    │Tickets │    │Billing │
│Service │    │Service │    │Service │
└───┬────┘    └───┬────┘    └───┬────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
       ┌──────────▼─────────┐
       │   Message Queue    │
       │   RabbitMQ         │
       └──────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────┐
│Projects│   │ Assets │   │Reports │
│Service │   │Service │   │Service │
└───┬────┘   └───┬────┘   └───┬────┘
    │            │            │
    └────────────┼────────────┘
                 │
      ┌──────────▼─────────┐
      │    Data Layer      │
      │ - PostgreSQL (M/R) │
      │ - Redis (Cache)    │
      │ - Elasticsearch    │
      └────────────────────┘
```

### 1.3 Architektur-Patterns

**Microservices-Architektur:**
- Jedes Modul = eigener LXC-Container
- Loose Coupling via REST-APIs
- Independent Deployment
- Service Discovery via DNS
- API-Gateway als Single Entry Point

**Event-Driven Architecture:**
- Asynchrone Kommunikation via RabbitMQ
- Event-Sourcing für Audit-Trail (optional)
- CQRS (Command Query Responsibility Segregation)
- Pub/Sub Pattern für Notifications

**Repository-Pattern:**
- Abstraktion der Datenzugriffe
- Dependency Injection für Testability
- Query-Builder für komplexe Queries
- Transaction-Management

**API-Gateway-Pattern:**
- Zentraler Entry Point
- Cross-Cutting Concerns (Auth, Logging)
- Request/Response-Transformation
- Backend-for-Frontend (BFF) für Mobile

---
