## 15. ENTWICKLUNGS-WORKFLOW

### 15.1 Feature-Development

```mermaid
graph TD
    A[Ticket erstellen] --> B[Feature-Branch]
    B --> C[Code + Tests schreiben]
    C --> D[Pre-commit Hooks]
    D --> E{Tests passing?}
    E -->|No| C
    E -->|Yes| F[Push to GitLab]
    F --> G[CI Pipeline]
    G --> H{Pipeline passing?}
    H -->|No| C
    H -->|Yes| I[Merge Request]
    I --> J[Code Review]
    J --> K{Approved?}
    K -->|No| C
    K -->|Yes| L[Merge to develop]
    L --> M[Deploy to Staging]
    M --> N[QA Testing]
    N --> O{QA Passed?}
    O -->|No| C
    O -->|Yes| P[Merge to main]
    P --> Q[Deploy to Production]
```

### 15.2 Definition of Done

**Feature ist "Done" wenn:**
- [ ] Code geschrieben und reviewed
- [ ] Unit-Tests geschrieben (≥70% Coverage)
- [ ] Integration-Tests geschrieben
- [ ] E2E-Tests aktualisiert (wenn nötig)
- [ ] Documentation aktualisiert
- [ ] API-Dokumentation aktualisiert (OpenAPI)
- [ ] Migration-Scripts geschrieben (wenn DB-Änderungen)
- [ ] Security-Review durchgeführt
- [ ] Performance-Tests durchgeführt
- [ ] Deployed to Staging
- [ ] QA-Approved
- [ ] Changelog aktualisiert
- [ ] Release-Notes erstellt (für User-facing Features)

### 15.3 Code-Review-Checklist

**Reviewer checkt:**
- [ ] Code folgt Coding-Standards (ESLint/Prettier)
- [ ] Tests vorhanden und sinnvoll
- [ ] Keine Security-Probleme (SQL-Injection, XSS, etc.)
- [ ] Keine Performance-Probleme (N+1 Queries, Memory-Leaks)
- [ ] Error-Handling korrekt implementiert
- [ ] Logging angemessen (keine sensitiven Daten)
- [ ] API-Backwards-Compatibility gewahrt
- [ ] Documentation vollständig
- [ ] No console.log() in Production-Code
- [ ] Keine TODO/FIXME ohne zugehöriges Ticket

---
