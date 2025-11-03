# 2 Ausgangslage und Problemstellung

## 2.1 Markt- und Ist-Situation

Der Markt für Managed Services im deutschsprachigen Raum befindet sich in einer Phase des starken Wachstums und der zunehmenden Professionalisierung.

Viele MSPs sind aus klassischen Systemhäusern hervorgegangen und arbeiten mit einer Vielzahl historisch gewachsener Tools, was zu heterogenen Systemlandschaften führt.

**Typische Werkzeuge im parallelen Einsatz:**
- CRM-Systeme zur Kundenverwaltung
- Separate Ticketing- und Helpdesk-Systeme
- Excel/SharePoint für Projektplanung
- Word-Vorlagen für Angebote/Verträge
- Eigenständige Tools für Zeiterfassung und Abrechnung
- Unabhängige RMM-/Monitoring-Plattformen

## 2.2 Hauptprobleme in der aktuellen Tool-Landschaft

### Datensilos und Redundanz
- Kundendaten in 3-5 verschiedenen Systemen
- Manuelle Synchronisation fehleranfällig
- Inkonsistente Datenstände

### Medienbrüche
- Copy-Paste zwischen Systemen
- Ticket-Daten müssen manuell in Zeiterfassung übertragen werden
- Keine automatische Rechnungsstellung aus Zeiteinträgen

### Fehlende Automatisierung
- Manuelle Ticket-Zuweisung
- Keine automatischen SLA-Warnungen
- Reporting erfordert Daten-Aggregation aus mehreren Quellen

### Compliance-Risiken
- DSGVO-konforme Löschung über mehrere Systeme hinweg schwierig
- Audit-Trail nicht lückenlos
- Keine zentrale Rechteverwaltung

## 2.3 DACH-spezifische Anforderungen

MSPs im deutschsprachigen Raum haben besondere Anforderungen:

- **BMD-Integration** (Österreich): Buchhaltung
- **DATEV-Schnittstelle** (Deutschland): Steuerberater-Integration
- **Umsatzsteuer-Validierung**: UID-Prüfung nach EU-Vorgaben
- **DSGVO**: Datenspeicherung innerhalb DACH-Region
- **Lokale Feiertage**: DE (16 Bundesländer), AT (9), CH (26 Kantone)
- **Rechnungsformate**: ZUGFeRD, XRechnung, ebInterface, Swiss QR

Diese Anforderungen werden von internationalen PSA-Systemen oft nicht oder nur teilweise abgedeckt.

## 2.4 Geschäftliche und operative Ziele

Die PSA-Platform verfolgt das Ziel, eine integrierte, skalierbare und praxisnahe Lösung für alle Kernprozesse eines MSP zu schaffen.

**Zielgrößen:**
- Durchgängige Prozesskette ohne Medienbrüche
- Zentrale Datenhaltung für CRM, Tickets, Projekte, Assets, Finanzen
- Hoher Automatisierungsgrad bei wiederkehrenden Tätigkeiten
- Reduktion von Verwaltungsaufwand
- Nahtlose Integration mit bestehenden Tools

## 2.5 Ausgangslage im technischen Betrieb

Viele MSPs betreiben ihre Infrastruktur auf Proxmox VE und erwarten, dass sich eine PSA-Lösung einfach integrieren lässt.

**Technische Basis:**
- Proxmox VE als Host-Plattform
- LXC-Container als modulare Service-Umgebung
- APIs und Webhooks für externe Systeme
- Keine proprietären Cloud-Abhängigkeiten

## 2.6 Zusammenfassung der Problemstellung

> **"Zu viele Tools, zu wenig Integration, zu viel manuelle Arbeit."**

Die PSA-Platform adressiert dieses Problem durch:
- Vereinheitlichung aller Kernprozesse
- Klare Schnittstellen und definierte Datenflüsse
- Modularität und Skalierbarkeit
- Lokale, sichere und auditierbare Datenhaltung
