# 8 Workflows & Prozessdefinitionen

Dieses Kapitel beschreibt die standardisierten Geschäfts- und Serviceprozesse der PSA-Platform nach ITIL 4-Prinzipien.

Alle Prozesse können mit der integrierten Workflow Engine (Kapitel 4.10) abgebildet, angepasst und über API/Webhook ausgelöst werden.

## 8.1 Ticket-Lifecycle

### Ziel
Durchgängiger Bearbeitungsprozess vom Eingang bis zur Abrechnung.

### Ablauf
1. **Eingang**: E-Mail, Portal, Telefon, RMM-Alert
2. **Zuweisung**: Automatisch nach Skills und Verfügbarkeit
3. **Bearbeitung**: Remote oder Vor-Ort, Zeiterfassung
4. **Lösung**: Rückmeldung an Kunden, SLA-Check
5. **Abrechnung**: Zeiterfassung → Billing-Modul
6. **Schließung**: Status "Closed (Invoiced)"

### Automatisierungen
- "Ticket gelöst" → "Rechnungsvorschlag erstellen"
- "SLA droht" → "Disponenten-Benachrichtigung"
- "Kategorie X" → "vCIO-Roadmap-Eintrag"

## 8.2 Opportunity-Workflow (Sales)

### Phasen
1. Lead-Erfassung (Website, E-Mail, manuell)
2. Qualifizierung (Branche, Größe, Potenzial)
3. Angebotserstellung (aus Katalog)
4. Freigabe (mehrstufig nach Volumen)
5. Abschluss ("Closed Won" → Auftrag/Projekt)
6. Follow-up (bei "Closed Lost")

## 8.3 Projekt-Workflow

### Phasen
1. Projektanlage (aus Angebot/Vorlage)
2. Planung (Phasen, Meilensteine, Ressourcen)
3. Durchführung (Zeit, Fortschritt, Material)
4. Abnahme (Kunde, Dokumentation in Infexio)
5. Abrechnung (Übergabe an Billing)
6. Review (Lessons Learned)

## 8.4 Billing-Prozess

### Prozesskette
1. **Input**: Zeiteinträge, Tickets, Verträge, Lizenzen
2. **Prüfung**: Abgleich mit SLA, Verträgen, Preisen
3. **Freigabe**: Disponent oder Projektleiter
4. **Erstellung**: Automatisiert nach Format (BMD/DATEV)
5. **Export**: Übergabe an Finanzbuchhaltung/ERP
6. **Archivierung**: in CRM/Infexio

## 8.5 Asset-Lifecycle

### Phasen
1. **Beschaffung**: Erfassung oder RMM-Import
2. **Zuweisung**: Gerät/Lizenz → Benutzer/Standort
3. **Betrieb**: Status- und Update-Überwachung
4. **Austausch**: Warnung bei EOL/Garantieablauf
5. **Archivierung**: Historisierung in Infexio/Hudu

## 8.6 vCIO-/QBR-Prozess

### Ablauf
1. Datenaggregation (Tickets, Projekte, Assets, Monitoring, Billing)
2. KPI-Bewertung (SLA, Reaktionszeiten, Lizenzen)
3. Roadmap-Erstellung (technisch & finanziell, 1-3 Jahre)
4. Report-Generierung (PowerPoint/PDF)
5. Präsentation & Maßnahmenplan

## 8.7 Security Incident Workflow (SOC)

### Ablauf
1. Eingang (SOC/XDR/RocketCyber Alert)
2. Kategorisierung (automatisch nach Bedrohungsstufe)
3. Ticket-Erstellung (Security-Modul)
4. Analyse (Techniker oder Security-Team)
5. Isolation/Gegenmaßnahmen (Remote-Aktionen)
6. Abschluss (Dokumentation, Lessons Learned, QBR)

## 8.8 Workflow-Dokumentation

Jeder Workflow kann über die Workflow Engine visualisiert und angepasst werden. Änderungen sind versioniert, exportierbar und auditierbar. Standardprozesse sind als Templates verfügbar und werden in Infexio revisionssicher gespeichert.

## 8.9 Zusammenfassung

Die definierten Prozesse gewährleisten:
- Standardisierte Abläufe über alle Module
- Nahtlose Übergänge zwischen CRM, Ticketing, Billing, Reporting
- Rückverfolgbarkeit und Compliance
- Hohe Automatisierbarkeit über Workflow Engine
