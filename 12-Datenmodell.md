# 12 Datenmodell (konzeptionell)

[Vorhandener Inhalt bis 12.1]

## 12.2 Beziehungen der Hauptobjekte

### Entity-Relationship-Übersicht

```
Kunde (1) ──┬──< (N) Vertrag
            ├──< (N) Kontakt
            ├──< (N) Standort
            ├──< (N) Asset
            └──< (N) Ticket

Vertrag (1) ──┬──< (N) Rechnung
              ├──< (N) Lizenz
              └──< (N) SLA-Definition

Ticket (1) ──┬──< (N) Zeiterfassung
             ├──< (N) Kommentar
             ├──< (N) Anhang
             └──> (1) Projekt (optional)

Asset (1) ──┬──< (N) Lizenz-Zuordnung
            ├──< (N) Wartungsvertrag
            └──> (1) Standort

Benutzer (N) ──< (M) Rolle
```

### Kardinalitäten
- **1:1** - One-to-One (z.B. Rechnung ↔ Zahlungseingang)
- **1:N** - One-to-Many (z.B. Kunde → Tickets)
- **N:M** - Many-to-Many (z.B. Benutzer ↔ Rollen)

### Referenzielle Integrität
- **CASCADE DELETE**: Bei Kunde-Löschung → Alle Tickets archiviert
- **RESTRICT**: Vertrag mit Rechnungen kann nicht gelöscht werden
- **SET NULL**: Bei Techniker-Austritt → Tickets.assigned_to = NULL

## 12.4 Erweiterte Entitäten

### SLA-Objekte
```sql
Table: sla_definition
- id: UUID (PK)
- customer_id: UUID (FK → customers)
- name: String (z.B. "Gold SLA")
- response_time_p1: Interval (z.B. 15 Minuten)
- resolution_time_p1: Interval (z.B. 4 Stunden)
- business_hours: JSON (Mo-Fr 08:00-17:00)
- holidays: JSON Array (Feiertage)
```

### Lizenz-Management
```sql
Table: licenses
- id: UUID (PK)
- asset_id: UUID (FK → assets)
- contract_id: UUID (FK → contracts)
- license_key: String (encrypted)
- license_type: Enum (User, Device, Concurrent)
- quantity: Integer
- valid_from: Date
- valid_until: Date
- auto_renew: Boolean
```

### Audit-Log
```sql
Table: audit_log
- id: UUID (PK)
- entity_type: String (z.B. "ticket")
- entity_id: UUID
- action: Enum (CREATE, UPDATE, DELETE, VIEW)
- user_id: UUID (FK → users)
- timestamp: Timestamp
- changes: JSONB (Old vs New Values)
- ip_address: INET
```

## 12.6 Datenvalidierung & Integrität

### Validation-Rules
- **E-Mail**: RFC 5322 konform
- **Telefon**: E.164-Format (z.B. +43 664 1234567)
- **UID (Umsatzsteuer-ID)**: VIES-Validierung via EU-API
- **IBAN**: ISO 13616-konform, Prüfziffer-Validierung
- **Postleitzahl**: Länder-spezifisch (DE: 5-stellig, AT: 4-stellig)

### Constraints
```sql
-- Unique Constraints
UNIQUE (customer_id, email) -- Keine doppelten E-Mails pro Kunde

-- Check Constraints
CHECK (priority BETWEEN 1 AND 4) -- Nur P1-P4
CHECK (response_time > 0) -- Positive Zeitwerte
CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')

-- Foreign Key mit Custom Action
FOREIGN KEY (assigned_to) REFERENCES users(id) 
  ON DELETE SET NULL
  ON UPDATE CASCADE
```

### Daten-Archivierung
- **Soft-Delete**: `deleted_at` Timestamp statt physischer Löschung
- **Archivierungs-Job**: Läuft nächtlich
  - Tickets > 3 Jahre → Archiv-Tabelle
  - Rechnungen > 7 Jahre → Cold-Storage
- **Retention-Policies**: Pro Entity-Type konfigurierbar

## 12.8 Zugriffsschichten

### Data Access Layer (DAL)
```
┌─────────────────────────────────┐
│   Application Layer (API)       │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Business Logic Layer          │
│   - Validierung                 │
│   - Workflow-Logik              │
│   - Berechtigungsprüfung        │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Data Access Layer (ORM)       │
│   - SQLAlchemy / TypeORM        │
│   - Query-Builder               │
│   - Connection-Pooling          │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Database Layer                │
│   - PostgreSQL Master/Replica   │
└─────────────────────────────────┘
```

### Repository-Pattern
```python
class TicketRepository:
    def create(ticket: Ticket) -> Ticket:
        # Validierung
        # Audit-Log
        # DB-Insert
        # Event-Publishing
        
    def find_by_customer(customer_id: UUID) -> List[Ticket]:
        # RBAC-Check
        # Query mit Caching
```

### Caching-Strategie
- **L1-Cache**: Application-Level (Redis)
  - TTL: 5 Minuten
  - Entities: Customers, Users, SLA-Definitions
- **L2-Cache**: Database-Level (PostgreSQL Shared Buffers)
- **Cache-Invalidierung**: Bei UPDATE/DELETE Events
