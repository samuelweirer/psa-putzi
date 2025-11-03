# 11 Qualitätssicherung & Tests

[Vorhandener Inhalt bis 11.4]

## 11.5 Qualitätssicherung im laufenden Betrieb

### Continuous Monitoring
- **Automatisierte Health-Checks**: Jede Minute für kritische Services
- **Synthetic Monitoring**: Simulierte User-Journeys (Selenium/Playwright)
- **Real-User-Monitoring**: Performance aus Benutzersicht
- **APM (Application Performance Monitoring)**: New Relic, DataDog (optional)

### Performance-Regression-Tests
- **Load-Tests**: Gatling/JMeter vor jedem Major-Release
- **Baseline**: Performance muss min. 95% des Baselines erreichen
- **Alerting**: Bei Performance-Degradation > 20%

### Canary-Deployments
- **Phased Rollout**: 5% → 25% → 50% → 100% der User
- **Monitoring**: Error-Rate, Response-Times pro Phase
- **Auto-Rollback**: Bei Fehlerrate > 1%

### Chaos Engineering (Optional)
- **Controlled Failures**: Simulierte Node-Ausfälle
- **Resilience-Testing**: System-Verhalten bei Teil-Ausfällen
- **Game Days**: Quartalsweise Chaos-Tests mit Team

## 11.6 KPIs zur Qualitätsbewertung

### Technische KPIs
| Metrik | Zielwert | Kritischer Wert |
|--------|----------|-----------------|
| Uptime | > 99.5% | < 99.0% |
| API-Response-Time (p95) | < 200ms | > 500ms |
| Error-Rate | < 0.1% | > 1% |
| Test-Coverage | > 70% | < 50% |
| Bug-Escape-Rate | < 5% | > 15% |
| Mean Time to Recovery (MTTR) | < 2h | > 4h |

### Prozess-KPIs
| Metrik | Zielwert | Kritischer Wert |
|--------|----------|-----------------|
| Deployment-Frequency | 2x/Monat | < 1x/Monat |
| Lead-Time (Feature → Prod) | < 2 Wochen | > 6 Wochen |
| Change-Failure-Rate | < 5% | > 15% |
| Rollback-Rate | < 1% | > 5% |

### User-KPIs
| Metrik | Zielwert | Kritischer Wert |
|--------|----------|-----------------|
| User-Satisfaction (NPS) | > 50 | < 30 |
| Bug-Reports/User/Monat | < 0.5 | > 2 |
| Support-Tickets (QA-bezogen) | < 10/Monat | > 30/Monat |
| Feature-Adoption | > 60% | < 30% |

### Reporting
- **Weekly**: Status-Dashboard für Entwicklungs-Team
- **Monthly**: QA-Report für Management
- **Quarterly**: Trend-Analyse und Verbesserungsvorschläge
