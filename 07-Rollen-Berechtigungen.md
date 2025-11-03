# 7 Rollen- und Berechtigungskonzept

Die PSA-Platform verwendet ein rollenbasiertes Berechtigungskonzept (RBAC – Role-Based Access Control).
Zugriffe auf Module, Datenobjekte und Aktionen werden anhand von Rollen und Gruppen gesteuert.

## 7.1 Grundprinzipien

### Least Privilege
- Benutzer erhalten nur minimale notwendige Rechte
- Temporäre Rechteerhöhung für spezielle Aufgaben
- Automatischer Rechte-Entzug bei Rollenwechsel

### Separation of Duties
- Kritische Aktionen erfordern Vier-Augen-Prinzip
- Billing-Freigabe ≠ Rechnungs-Erstellung
- Admin-Rechte ≠ Daten-Lesezugriff

### Mandantentrennung
- Strikte Isolation zwischen Kunden-Mandanten
- Keine Cross-Tenant-Zugriffe ohne explizite Freigabe
- Audit-Trail für alle mandantenübergreifenden Aktionen

### Identity Federation
- Integration mit Azure AD / Entra ID
- LDAP/Active Directory Synchronisation
- SAML 2.0 / OpenID Connect Support
- Just-in-Time (JIT) Provisioning

## 7.2 Rollenübersicht

### Administrator-Rollen
| Rolle | Beschreibung | Zugriff |
|-------|--------------|---------|
| **System-Administrator** | Vollzugriff auf Plattform | Alle Module, alle Mandanten, Config |
| **Mandanten-Administrator** | Admin eines Mandanten | Alle Module innerhalb Mandant |
| **Security-Administrator** | Security & Audit | User-Mgmt, Logs, Compliance |

### Fachliche Rollen
| Rolle | Beschreibung | Zugriff |
|-------|--------------|---------|
| **Service Manager** | Leitung Service-Desk | Tickets, SLA, Reporting, Team-Mgmt |
| **Techniker (L1/L2/L3)** | Ticket-Bearbeitung | Tickets (assigned), Assets (read), Zeiterfassung |
| **Projektleiter** | Projekt-Management | Projekte, Ressourcen, Zeiterfassung |
| **Account Manager** | Kundenbetreuu ng | CRM, Opportunities, Angebote, QBR |
| **Billing-Manager** | Abrechnung | Zeiterfassung (read), Rechnungen, Verträge |

### Kunden-Rollen (Co-Managed IT)
| Rolle | Beschreibung | Zugriff |
|-------|--------------|---------|
| **Kunde-Admin** | Kunden-Ansprechpartner | Eigene Tickets, Assets, Reporting |
| **Kunde-Techniker** | Kunden-IT-Mitarbeiter | Eigene Tickets (erstellen/bearbeiten) |
| **Kunde-Endbenutzer** | Ticket-Ersteller | Eigene Tickets (erstellen, Status) |

## 7.3 Rechteebenen

### Objektrechte (CRUD)
- **Create**: Neue Objekte anlegen
- **Read**: Objekte anzeigen
- **Update**: Objekte bearbeiten
- **Delete**: Objekte löschen (oft: Soft-Delete)

### Feldrechte
- **Sichtbar**: Feld wird angezeigt
- **Editierbar**: Feld kann bearbeitet werden
- **Pflichtfeld**: Feld muss ausgefüllt werden
- **Maskiert**: Sensible Felder (z.B. Passwörter)

### Funktionsrechte
- **Export**: Daten exportieren (CSV, Excel, PDF)
- **Import**: Massendaten importieren
- **API-Zugriff**: Programmatischer Zugriff via API
- **Reporting**: Zugriff auf Berichte und Dashboards

## 7.4 Authentifizierung & Identitätsmanagement

### Single Sign-On (SSO)
- **Azure AD / Entra ID**: SAML 2.0 oder OpenID Connect
- **LDAP**: Active Directory, OpenLDAP
- **OAuth 2.1**: Für API-Clients und Third-Party-Apps
- **SCIM**: Automatische User-Provisionierung

### Multi-Factor Authentication (MFA)
- **TOTP**: Google Authenticator, Authy, Microsoft Authenticator
- **FIDO2/WebAuthn**: Hardware-Keys (YubiKey, Titan)
- **Push-Benachrichtigung**: Mobile App (optional)
- **SMS/E-Mail**: Backup-Methode
- **Recovery-Codes**: Für MFA-Verlust

### Password Policy
- **Komplexität**: Mind. 12 Zeichen, Groß-/Kleinschreibung, Zahlen, Sonderzeichen
- **Ablauf**: 90 Tage (konfigurierbar: 60/90/180/nie)
- **Historie**: Letzte 5 Passwörter nicht wiederverwendbar
- **Lockout**: 5 Fehlversuche → 15 Minuten Sperre
- **Passwort-Reset**: Self-Service via E-Mail-Token

### Session Management
- **Inaktivitäts-Timeout**: 30 Minuten (konfigurierbar)
- **Absolute Timeout**: 8 Stunden
- **Concurrent Sessions**: Max. 3 pro User
- **Device-Bindung**: Optional für erhöhte Sicherheit
- **Session-Revocation**: Sofortiges Abmelden möglich

## 7.5 Rollenverwaltung & Delegation

### Rollenerstellung
- **Template-basiert**: Vordefinierte Rollen-Templates
- **Custom-Rollen**: Individuelle Rechtezusammenstellung
- **Vererbung**: Rollen können von anderen erben
- **Zeitlich begrenzt**: Temporäre Rechtezuweisung

### Delegation
- **Team-Leads**: Können Tickets in ihrem Team zuweisen
- **Projekt-Admins**: Rechte innerhalb ihres Projekts
- **Mandanten-Delegation**: Kunde-Admin verwaltet eigene User

### Rollenmapping (SSO)
```yaml
Azure AD Group -> PSA Role
-----------------------------
"PSA-Admins" -> System-Administrator
"PSA-Technicians-L2" -> Techniker (L2)
"PSA-Billing" -> Billing-Manager
```

## 7.6 Portalzugriff (Co-Managed IT)

### Kunden-Portal
- **Eigener Zugang**: Separate Login-URL (portal.psa.example.com)
- **Sichtbarkeit**: Nur eigene Mandanten-Daten
- **Funktionen**:
  - Tickets erstellen/einsehen
  - Assets anzeigen
  - SLA-Status prüfen
  - Knowledge Base durchsuchen
  - Reports herunterladen

### Shared Queues
- **Geteilte Tickets**: MSP und Kunde sehen gleiche Tickets
- **Verantwortlichkeiten**: RACI-Matrix definiert Zuständigkeiten
- **Benachrichtigungen**: Beide Seiten erhalten Updates
- **Interne Notizen**: Nur für MSP-Techniker sichtbar

## 7.7 Rechteverwaltung im API-Kontext

### API-Keys
- **Service-Accounts**: Dedizierte Accounts für Integrationen
- **Scoped Tokens**: Keys mit eingeschränkten Berechtigungen
  - Read-Only
  - Specific Resources (z.B. nur `/tickets`)
  - Time-Limited (z.B. 24h)
- **Rotation**: Automatische Key-Rotation alle 90 Tage
- **Revocation**: Sofortiges Widerrufen möglich

### OAuth2-Scopes
```
tickets:read - Tickets lesen
tickets:write - Tickets erstellen/ändern
customers:read - Kunden-Daten lesen
billing:write - Rechnungen erstellen
admin:all - Vollzugriff (nur für System-Admins)
```

### Rate Limiting
- **Per API-Key**: 1000 Requests/Stunde (Standard)
- **Per IP**: 5000 Requests/Stunde
- **Erhöhung**: Auf Antrag für automatisierte Prozesse

## 7.8 Zusammenfassung

Das Rollen- und Berechtigungskonzept sorgt für:
- ✅ Transparente, nachvollziehbare Zugriffsstrukturen
- ✅ Sichere Mandantentrennung
- ✅ Zentral administrierbare Rechte über SSO / AD
- ✅ Automatisierbare Rechteverwaltung via API
- ✅ Compliance mit Audit-Anforderungen
