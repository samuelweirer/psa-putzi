# Big Design Up Front (BDUF) - Kapitel 18
## PSA-Platform für Managed Service Provider

**Version:** 1.0
**Datum:** November 2025
**Kapitel:** 18 - Security Checklist

---

## 18. SECURITY CHECKLIST

### 18.1 Pre-Deployment Security Checklist

#### Authentifizierung & Autorisierung

- [ ] **Multi-Factor Authentication (MFA) aktiviert**
  - [ ] TOTP (Google Authenticator, Authy) konfiguriert
  - [ ] FIDO2/WebAuthn (YubiKey) Support aktiviert
  - [ ] Backup-Codes generiert und sicher gespeichert
  - [ ] MFA für privilegierte Accounts erzwungen

- [ ] **Single Sign-On (SSO) konfiguriert**
  - [ ] SAML 2.0 Integration getestet
  - [ ] OpenID Connect (OIDC) funktionsfähig
  - [ ] Azure AD / Entra ID Connector geprüft
  - [ ] LDAP/Active Directory Synchronisation läuft
  - [ ] Fallback auf lokale Auth bei SSO-Ausfall

- [ ] **Password Policy implementiert**
  - [ ] Mindestens 12 Zeichen
  - [ ] Komplexitätsanforderungen (Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)
  - [ ] Password-History: Letzte 5 Passwörter nicht wiederverwendbar
  - [ ] Password-Expiry: 90 Tage (für lokale Accounts)
  - [ ] Kein gemeinsames Standard-Passwort

- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Rollen definiert und dokumentiert
  - [ ] Least-Privilege-Prinzip umgesetzt
  - [ ] Rollenhierarchie getestet
  - [ ] Permissions JSONB-Felder validiert
  - [ ] Row-Level Security (RLS) für tenant_id aktiv

#### Verschlüsselung

- [ ] **Transport Encryption**
  - [ ] TLS 1.3 erzwungen
  - [ ] TLS 1.2 als Minimum
  - [ ] Gültige SSL-Zertifikate (Let's Encrypt oder Commercial)
  - [ ] Auto-Renewal für Zertifikate konfiguriert
  - [ ] HSTS Header gesetzt (`Strict-Transport-Security`)
  - [ ] HTTP → HTTPS Redirect aktiv

- [ ] **Data at Rest Encryption**
  - [ ] PostgreSQL Tablespace Encryption aktiviert (LUKS)
  - [ ] Backup-Encryption mit AES-256
  - [ ] Sensitive Felder in DB verschlüsselt (license_key, password_hash)
  - [ ] Encryption Keys sicher gespeichert (Vault, KMS)

- [ ] **Application-Level Encryption**
  - [ ] Passwörter mit bcrypt/argon2 gehasht
  - [ ] API-Tokens mit HMAC signiert
  - [ ] Sensitive Daten in JSONB-Feldern verschlüsselt

#### Network Security

- [ ] **Firewall-Regeln**
  - [ ] Default Deny für eingehende Verbindungen
  - [ ] Nur notwendige Ports geöffnet
  - [ ] Port 22 (SSH) nur aus Management-VLAN
  - [ ] Port 5432 (PostgreSQL) nicht öffentlich
  - [ ] Port 6379 (Redis) nicht öffentlich
  - [ ] API-Gateway als einziger öffentlicher Endpunkt

- [ ] **VLAN-Segmentierung**
  - [ ] Management VLAN (10.0.10.0/24)
  - [ ] Application VLAN (10.0.20.0/24)
  - [ ] Database VLAN (10.0.30.0/24)
  - [ ] DMZ für API Gateway (10.0.100.0/24)
  - [ ] Inter-VLAN Routing restriktiv

- [ ] **Intrusion Detection/Prevention**
  - [ ] Fail2Ban für SSH aktiv
  - [ ] Zabbix Monitoring für ungewöhnliche Aktivitäten
  - [ ] Log-Aggregation und Alerting (ELK Stack)

#### Application Security

- [ ] **Input Validation**
  - [ ] SQL-Injection-Schutz (Prepared Statements, ORM)
  - [ ] XSS-Schutz (Content-Security-Policy Header)
  - [ ] CSRF-Token für alle State-Changing Requests
  - [ ] Input-Sanitization für alle User-Inputs
  - [ ] File-Upload-Validierung (Typ, Größe, Malware-Scan)

- [ ] **API Security**
  - [ ] Rate Limiting (z.B. 100 req/min pro User)
  - [ ] API-Versionierung aktiv
  - [ ] JWT-Token mit kurzer Expiry (15 Minuten)
  - [ ] Refresh-Token-Rotation implementiert
  - [ ] CORS korrekt konfiguriert
  - [ ] API-Keys sicher gespeichert und rotiert

- [ ] **Session Management**
  - [ ] Session-Timeout: 30 Minuten Inaktivität
  - [ ] Secure und HttpOnly Flags für Cookies
  - [ ] SameSite=Strict für Session-Cookies
  - [ ] Session-Invalidierung bei Logout
  - [ ] Concurrent Session Limiting

#### Dependency Security

- [ ] **Vulnerability Scanning**
  - [ ] npm audit ausgeführt (Backend)
  - [ ] npm audit ausgeführt (Frontend)
  - [ ] Keine kritischen oder hohen Vulnerabilities
  - [ ] Snyk/Dependabot für automatische Scans
  - [ ] Container-Images gescannt (Trivy, Clair)

- [ ] **Supply Chain Security**
  - [ ] Package-Lock-Files committiert
  - [ ] Nur vertrauenswürdige NPM-Packages
  - [ ] GPG-signierte Git-Commits (optional)
  - [ ] Container-Images von offiziellen Sources

---

### 18.2 DSGVO-Compliance Checklist

- [ ] **Betroffenenrechte (Art. 15-20)**
  - [ ] Recht auf Auskunft implementiert
  - [ ] Recht auf Berichtigung implementiert
  - [ ] Recht auf Löschung ("Recht auf Vergessenwerden")
  - [ ] Recht auf Datenportabilität (Export-Funktion)
  - [ ] Recht auf Widerspruch

- [ ] **Datenschutz-Folgenabschätzung (DPIA)**
  - [ ] DPIA durchgeführt für Hochrisiko-Processing
  - [ ] Dokumentation vorhanden

- [ ] **Privacy by Design**
  - [ ] Datenminimierung umgesetzt
  - [ ] Pseudonymisierung wo möglich
  - [ ] Zweckbindung beachtet
  - [ ] Speicherbegrenzung (Retention Policies)

- [ ] **Datenschutzerklärung**
  - [ ] Datenschutzerklärung aktuell und verfügbar
  - [ ] Cookie-Banner (falls nötig)
  - [ ] Verarbeitungsverzeichnis (Art. 30) geführt

- [ ] **Auftragsverarbeitung (AVV)**
  - [ ] AVV mit allen Sub-Processoren abgeschlossen
  - [ ] TOMs (Technische und Organisatorische Maßnahmen) dokumentiert

- [ ] **Meldepflicht**
  - [ ] Prozess für Data Breach Notification (72h)
  - [ ] Datenschutzbeauftragter bestellt (falls erforderlich)

- [ ] **Audit-Log**
  - [ ] Zugriffe auf personenbezogene Daten geloggt
  - [ ] Logs für 12 Monate aufbewahrt
  - [ ] Logs vor unbefugtem Zugriff geschützt

---

### 18.3 ISO 27001 Security Controls (Optional)

#### A.5 Organisatorische Sicherheit

- [ ] Informationssicherheitspolicy dokumentiert
- [ ] Rollen und Verantwortlichkeiten definiert
- [ ] Kontakt zu Behörden und Special Interest Groups

#### A.8 Asset Management

- [ ] Asset-Inventar gepflegt (i-doit, Hudu)
- [ ] Asset-Ownership geklärt
- [ ] Acceptable Use Policy für Assets

#### A.9 Zugangskontrolle

- [ ] Zugriffsrichtlinie dokumentiert
- [ ] User-Registrierungsprozess definiert
- [ ] Privileged Access Management (PAM)
- [ ] Regelmäßiges Access Review

#### A.12 Betriebssicherheit

- [ ] Betriebsverfahren dokumentiert
- [ ] Change Management Prozess
- [ ] Kapazitätsmanagement
- [ ] Malware-Schutz
- [ ] Backup-Prozess
- [ ] Log-Monitoring

#### A.14 System-Akquisition, -Entwicklung und -Wartung

- [ ] Secure Development Lifecycle (SDL)
- [ ] Code-Reviews
- [ ] Security-Tests
- [ ] Patch-Management

#### A.16 Incident Management

- [ ] Incident-Response-Plan
- [ ] Eskalationsprozess
- [ ] Forensik-Fähigkeiten
- [ ] Lessons Learned nach Incidents

#### A.17 Business Continuity

- [ ] Business Continuity Plan (BCP)
- [ ] Disaster Recovery Plan (DRP)
- [ ] Redundanzen vorhanden
- [ ] Regelmäßige DR-Drills

---

### 18.4 Penetration Testing Checklist

#### Vor Prod-Launch

- [ ] **External Penetration Test**
  - [ ] Öffentlich erreichbare Endpunkte getestet
  - [ ] Keine kritischen Findings
  - [ ] Bericht dokumentiert

- [ ] **Internal Penetration Test**
  - [ ] Lateral Movement Testing
  - [ ] Privilege Escalation Testing
  - [ ] Bericht dokumentiert

- [ ] **Web Application Security Test (OWASP Top 10)**
  - [ ] A01: Broken Access Control
  - [ ] A02: Cryptographic Failures
  - [ ] A03: Injection
  - [ ] A04: Insecure Design
  - [ ] A05: Security Misconfiguration
  - [ ] A06: Vulnerable and Outdated Components
  - [ ] A07: Identification and Authentication Failures
  - [ ] A08: Software and Data Integrity Failures
  - [ ] A09: Security Logging and Monitoring Failures
  - [ ] A10: Server-Side Request Forgery (SSRF)

#### Jährlich wiederkehrend

- [ ] Re-Test nach Major-Releases
- [ ] Quartalsweise Vulnerability Scans
- [ ] Bug-Bounty-Programm (optional)

---

### 18.5 Security Monitoring Checklist

- [ ] **Log-Aggregation**
  - [ ] Alle Systeme loggen zu zentralem ELK Stack
  - [ ] Logs enthalten Timestamps, User-IDs, IP-Adressen
  - [ ] Sensitive Daten nicht in Logs (Passwords, Tokens)

- [ ] **Alerting**
  - [ ] Failed Login Attempts > 5/min
  - [ ] Privileged Actions (User-Deletion, Role-Changes)
  - [ ] Ungewöhnlicher Datenabfluss
  - [ ] Security-Event-Korrelation (SIEM)

- [ ] **Incident Response**
  - [ ] On-Call-Rotation für Security-Incidents
  - [ ] Playbooks für häufige Incident-Typen
  - [ ] Forensik-Tools bereit (tcpdump, Volatility)

---

### 18.6 Continuous Security

#### DevSecOps-Pipeline

- [ ] **SAST (Static Application Security Testing)**
  - [ ] SonarQube oder Semgrep in CI/CD
  - [ ] Keine kritischen Security-Hotspots

- [ ] **DAST (Dynamic Application Security Testing)**
  - [ ] OWASP ZAP oder Burp Suite
  - [ ] Automated Scans bei Deployments

- [ ] **Secret-Scanning**
  - [ ] GitGuardian oder TruffleHog
  - [ ] Pre-Commit-Hooks für Secret-Detection

- [ ] **Container Security**
  - [ ] Image-Scanning (Trivy, Clair)
  - [ ] Runtime-Security (Falco)
  - [ ] Non-Root-User in Containern

#### Quarterly Security Review

- [ ] Zugriffsrechte auditieren
- [ ] Veraltete Accounts deaktivieren
- [ ] Patch-Status überprüfen
- [ ] Security-Awareness-Training

---

**Nächstes Kapitel:** [19-Deployment-Checklist](BDUF-Chapter19.md)

**Zurück zum Inhaltsverzeichnis:** [BDUF README](README.md)
