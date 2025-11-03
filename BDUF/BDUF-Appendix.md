## ANHANG A: NÜTZLICHE BEFEHLE

### Proxmox
```bash
# Container verwalten
pct list
pct start 101
pct stop 101
pct enter 101
pct config 101
pct snapshot 101 pre-update
pct rollback 101 pre-update

# Backup/Restore
vzdump 101 --compress zstd --mode snapshot
pct restore 101 /backup/vzdump-lxc-101.tar.zst

# Resources
pct set 101 --cores 4 --memory 8192
pct status 101
pveperf
```

### PostgreSQL
```bash
# Datenbank-Management
psql -U postgres -d psa_platform
\l                           # List databases
\dt                          # List tables
\d tickets                   # Describe table
\di                          # List indexes

# Performance-Analyse
EXPLAIN ANALYZE SELECT ...;
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_user_tables;

# Maintenance
VACUUM ANALYZE;
REINDEX DATABASE psa_platform;
```

### Git
```bash
# Workflow
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-123-description
git add .
git commit -m "feat(ticketing): add SLA notifications"
git push origin feature/TICKET-123-description

# Cleanup
git branch -d feature/TICKET-123-description
git fetch --prune

# Stash
git stash save "WIP: feature"
git stash list
git stash pop
```

---

## ANHANG B: GLOSSAR

| Begriff | Bedeutung |
|---------|-----------|
| BDUF | Big Design Up Front |
| BRD | Business Requirements Document |
| CQRS | Command Query Responsibility Segregation |
| DTO | Data Transfer Object |
| GFS | Grandfather-Father-Son (Backup-Schema) |
| HA | High Availability |
| LXC | Linux Containers |
| MFA | Multi-Factor Authentication |
| MSP | Managed Service Provider |
| MTTR | Mean Time To Recovery |
| ORM | Object-Relational Mapping |
| PSA | Professional Services Automation |
| RBAC | Role-Based Access Control |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| SLA | Service Level Agreement |
| SSO | Single Sign-On |

---

## ANHANG C: EXTERNE RESSOURCEN

**Dokumentation:**
- NestJS: https://docs.nestjs.com/
- TypeORM: https://typeorm.io/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/docs/
- Proxmox VE: https://pve.proxmox.com/wiki/

**Best Practices:**
- 12-Factor App: https://12factor.net/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- API Design Guide: https://cloud.google.com/apis/design

---

## DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | Tech-Team | Final complete BDUF |

---

## CONCLUSION

✅ **Vollständiges BDUF erstellt**

Dieses 3-teilige BDUF-Dokument umfasst:
- **Teil 1:** Architektur-Prinzipien, Tech-Stack, Datenmodell
- **Teil 2:** API-Design, Security, Container, Netzwerk, CI/CD, Monitoring
- **Teil 3:** Backup/DR, Performance, Skalierung, Code-Organisation, Testing, Workflow

**Gesamtumfang:** ~150 Seiten technische Spezifikationen

**Nächste Schritte:**
1. Stakeholder-Approval einholen
2. Entwicklungs-Team Onboarding
3. Sprint 0: Infrastructure-Setup starten
4. MVP-Entwicklung beginnen

**Kritischer Erfolgsfaktor:**
> "Architecture ohne Implementation ist wertlos. Implementation ohne Architecture ist unmöglich."

---

**ENDE DES BDUF-DOKUMENTS (KOMPLETT)**

*Version 1.0 | November 2025*  
*PSA-Platform Technical Team*
