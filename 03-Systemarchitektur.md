# 3 Systemarchitektur und Modularität

## 3.1 Architekturprinzipien

Die PSA-Platform wird als modulare Service-Architektur realisiert.
Jedes Funktionsmodul (z. B. CRM, Ticketing, Billing, Reporting) läuft in einem eigenen LXC-Container innerhalb einer Proxmox VE-Umgebung.
Die Module sind logisch voneinander getrennt, kommunizieren aber über standardisierte REST- bzw. GraphQL-APIs.

### Zentrale Architekturziele:

- **Isolation und Stabilität**: Ausfall eines Moduls beeinträchtigt keine anderen.
- **Skalierbarkeit**: Module können separat auf weitere Proxmox-Nodes verteilt werden.
- **Einheitliche Kommunikation**: Alle internen Services nutzen standardisierte APIs und Message-Queues.
- **Mandantenfähigkeit**: Mehrmandantenfähige Datenstrukturen mit strikter Trennung von Kundendaten.
- **Sicherheit**: RBAC, Audit-Logs, TLS-gesicherte Kommunikation, optionale 2FA/MFA.
- **Erweiterbarkeit**: Neue Module können per LXC-Template hinzugefügt und registriert werden.

## 3.2 Technische Basis

### Host-Plattform
- **Proxmox VE 8.x** als Virtualisierungs- und Container-Host
- **LXC (Linux Containers)** für ressourcenschonende Service-Isolation
- **ZFS oder Ceph** für Storage mit Snapshots und Replikation
- **Clustering** mit mind. 3 Nodes für High Availability

### Container-Basis
- **Debian 12 (Bookworm)** oder **Ubuntu 22.04 LTS** als OS-Base
- **Docker-in-LXC** optional für containerisierte Microservices
- **systemd** für Service-Management
- **fail2ban, AppArmor/SELinux** für gehärtete Sicherheit

### Netzwerk-Architektur
- **VLAN-Segmentierung**: Management, Services, DMZ, Backup
- **Load Balancer**: HAProxy oder Nginx für API-Gateway
- **Firewall**: pfsense/OPNsense oder Proxmox-integriert
- **VPN**: WireGuard oder OpenVPN für sichere Remote-Verwaltung

### Datenbanken
- **PostgreSQL 15+** (Primary) - für transaktionale Daten
- **MariaDB 10.11+** (Optional) - für spezifische Legacy-Integrationen
- **Redis 7.x** - für Caching und Session-Management
- **Elasticsearch 8.x** - für Log-Aggregation und Volltextsuche

### Message Queue & Event Bus
- **RabbitMQ 3.12+** oder **Apache Kafka** für asynchrone Kommunikation
- **Webhook-Server** für externe Event-Trigger
- **NATS.io** (optional) für Real-Time-Kommunikation

### Monitoring & Logging
- **Zabbix 6.x** für System- und Application-Monitoring
- **Prometheus + Grafana** für Metriken und Dashboards
- **ELK Stack** (Elasticsearch, Logstash, Kibana) für zentrale Log-Verwaltung
- **Sentry** oder **Rollbar** für Application Error Tracking

## 3.3 Modularer Aufbau

Die Plattform besteht aus logisch gekapselten Kern-Modulen und optionalen Erweiterungs-Modulen.

### Core-Module (Pflicht)
| Modul | Container | Beschreibung |
|-------|-----------|--------------|
| **API Gateway** | psa-api-gateway | Zentraler Entry-Point, Routing, Auth |
| **CRM** | psa-crm | Kunden-, Kontakt-, Vertragsverwaltung |
| **Ticketing** | psa-tickets | Service-Desk und Incident-Management |
| **Billing** | psa-billing | Abrechnung und Fakturierung |
| **Asset Management** | psa-assets | IT-Asset- und Lizenzverwaltung |
| **User Management** | psa-auth | SSO, RBAC, MFA |
| **Notification Service** | psa-notify | E-Mail, Teams, SMS-Benachrichtigungen |

### Erweiterte Module (Optional)
| Modul | Container | Beschreibung |
|-------|-----------|--------------|
| **Projektmanagement** | psa-projects | Projekt-, Ressourcen-, Gantt-Planung |
| **Reporting** | psa-reports | Dashboards, KPIs, QBR-Reports |
| **Workflow Engine** | psa-workflows | Automatisierung und Prozess-Orchestrierung |
| **vCIO** | psa-vcio | Strategic Planning, IT-Roadmaps |
| **Co-Managed IT** | psa-comanaged | Shared Queues, RACI-Matrix |
| **Security/SOC** | psa-security | SOC-Integration, Alert-Management |
| **KI/LLM** | psa-ai | LLM-Integration, Chatbot, Automatisierung |

### Support-Module
| Modul | Container | Beschreibung |
|-------|-----------|--------------|
| **Integration Hub** | psa-integrations | RMM, ERP, CMDB-Connectors |
| **Backup Service** | psa-backup | Automated Backup Orchestration |
| **Monitoring Agent** | psa-monitor | Health-Checks, Performance-Metriken |

## 3.4 Vorteile der LXC-basierten Architektur

### Ressourceneffizienz
- **Geringer Overhead**: LXC nutzt Host-Kernel, kein voller VM-Overhead
- **Schneller Start**: Container starten in Sekunden statt Minuten
- **Hohe Dichte**: 10-20 Container pro Node ohne Performance-Verlust
- **Memory-Sharing**: Effiziente Nutzung durch gemeinsame Kernel-Strukturen

### Betriebliche Vorteile
- **Template-basiertes Deployment**: Neue Module per Template in Minuten deployen
- **Snapshot & Rollback**: Instant-Snapshots vor Updates
- **Live-Migration**: Container zwischen Nodes verschieben ohne Downtime
- **Ressourcen-Limits**: CPU/RAM pro Container definierbar
- **Netzwerk-Isolation**: Dedizierte VLANs und Firewall-Rules pro Container

### Security-Vorteile
- **Isolation**: Kompromittierter Container beeinflusst nicht das Host-System
- **AppArmor/SELinux**: Mandatory Access Control pro Container
- **Read-Only-Mounts**: Systempartitionen können als read-only gemountet werden
- **User-Namespaces**: Container-Root ist nicht Host-Root

### Skalierbarkeit
- **Horizontal Scaling**: Einfaches Hinzufügen neuer Nodes zum Cluster
- **Load Distribution**: Container über mehrere Nodes verteilen
- **Service-Replikation**: Kritische Services mehrfach instanziieren
- **Auto-Scaling**: (mit zusätzlichem Orchestrator wie Kubernetes möglich)

### Wartbarkeit
- **Atomare Updates**: Jedes Modul individuell updatebar
- **Blue-Green-Deployment**: Neues Container-Template parallel testen
- **Versionierung**: Multiple Versionen parallel betreibbar
- **Einfaches Troubleshooting**: Logs und Metriken pro Container isoliert

## 3.5 Integrations- und Kommunikationsprinzip

### API-Gateway
- Alle Module registrieren sich am zentralen Integration Service
- **Kong** oder **Traefik** als API-Gateway
- **OAuth 2.1 / OpenID Connect** für Authentifizierung
- **Rate Limiting**: 1000 Requests/Minute pro API-Key (konfigurierbar)
- **API-Versionierung**: `/v1/`, `/v2/` in URL-Path
- **Request/Response Logging** für Audit-Trail

### Event Handling
Systeminterne Ereignisse (Ticket erstellt, Zeit gebucht, Rechnung freigegeben) werden als Webhooks oder Queue-Events bereitgestellt:

- **RabbitMQ Topics**: `ticket.created`, `invoice.generated`, `asset.eol`
- **Webhook-Subscriptions**: Externe Systeme können Events abonnieren
- **Retry-Mechanismus**: Fehlerhafte Webhook-Calls werden 3x wiederholt
- **Dead Letter Queue**: Nicht zustellbare Events werden archiviert

### Extern zugängliche APIs

#### REST API
```
https://psa.example.com/api/v1/
├── /customers      # CRM
├── /tickets        # Ticketing
├── /projects       # Projektmanagement
├── /assets         # Asset Management
├── /invoices       # Billing
├── /users          # User Management
└── /reports        # Reporting
```

#### GraphQL API (Optional)
```graphql
https://psa.example.com/graphql

query {
  customer(id: "123") {
    name
    tickets(status: "open") {
      id
      title
      priority
    }
    assets {
      name
      type
    }
  }
}
```

### Infexio-Integration

**Bidirektionale Synchronisation** von:
- Kunden-, Asset- und Vertragsdaten
- Datenaggregation aus PSA, RMM und ERP
- Webhooks für Echtzeit-Sync (z. B. Ticket → Dokumentation)
- RBAC-basierter Zugriff auf Objekte

**Technische Implementierung**:
```yaml
Sync-Intervall: 5 Minuten (konfigurierbar)
Protokoll: REST API + Webhooks
Authentifizierung: OAuth2 Service Account
Konfliktauflösung: "Last Write Wins" mit Audit-Log
```

## 3.6 Deployment-Szenarien

### Szenario 1: Single-Node (Entwicklung/Test)
- **1 Proxmox Host** mit allen Containern
- **Lokaler Storage** (ZFS)
- **Geeignet für**: POC, Entwicklung, kleine MSPs (<10 User)

```
┌─────────────────────────────────────┐
│     Proxmox VE Host (Single)        │
├─────────────────────────────────────┤
│ [CRM] [Tickets] [Billing] [Assets] │
│ [Projects] [Reporting] [Auth]       │
│ [PostgreSQL] [Redis] [RabbitMQ]     │
└─────────────────────────────────────┘
```

### Szenario 2: 3-Node HA-Cluster (Produktion)
- **3 Proxmox Hosts** mit Quorum
- **Ceph-Storage** über alle Nodes
- **Container-Replikation** für kritische Services
- **Geeignet für**: Mittelgroße bis große MSPs (10-100+ User)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Proxmox PVE1 │  │ Proxmox PVE2 │  │ Proxmox PVE3 │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ API Gateway  │  │ API Gateway  │  │ Monitoring   │
│ CRM          │  │ Tickets      │  │ Backup       │
│ PostgreSQL-M │  │ PostgreSQL-S │  │ PostgreSQL-S │
│ Billing      │  │ Assets       │  │ Reports      │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                  │
       └─────────────────┴──────────────────┘
              Ceph Shared Storage
```

### Szenario 3: Multi-Region (Enterprise)
- **Mehrere 3-Node-Cluster** in verschiedenen Regionen
- **WAN-Replikation** für DR (Disaster Recovery)
- **Geo-Load-Balancing**
- **Geeignet für**: Große MSPs, Multi-Tenant-Betrieb

```
┌─────────────────────────────────┐
│    Region 1 (Primary)           │
│  3-Node Cluster + Ceph          │
└─────────────────┬───────────────┘
                  │ WAN Replication
                  │
┌─────────────────▼───────────────┐
│    Region 2 (DR/Failover)       │
│  3-Node Cluster + Ceph          │
└─────────────────────────────────┘
```

### Szenario 4: Hybrid (On-Prem + Cloud)
- **On-Premise**: Core-Services (CRM, Ticketing, DB)
- **Cloud**: Reporting, Analytics, Backup-Replikation
- **Geeignet für**: Compliance-Anforderungen + Cloud-Skalierbarkeit

## 3.7 Architekturdiagramm

### High-Level Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / WAN                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │  Firewall   │
              │ (pfsense)   │
              └──────┬──────┘
                     │
         ┌───────────▼────────────┐
         │   Load Balancer/Proxy  │
         │   (HAProxy/Traefik)    │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │    API Gateway         │
         │  (Kong/Custom)         │
         │  - Authentication      │
         │  - Rate Limiting       │
         │  - Routing             │
         └───────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────┐    ┌─────────┐     ┌──────────┐
│   CRM   │    │Ticketing│     │ Billing  │
│Container│    │Container│     │Container │
└────┬────┘    └────┬────┘     └────┬─────┘
     │              │               │
     └──────────────┼───────────────┘
                    │
         ┌──────────▼──────────┐
         │   Message Queue     │
         │   (RabbitMQ/Kafka)  │
         └──────────┬──────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│Projects │   │ Assets   │   │Reporting │
│Container│   │Container │   │Container │
└────┬────┘   └────┬─────┘   └────┬─────┘
     │             │              │
     └─────────────┼──────────────┘
                   │
         ┌─────────▼─────────┐
         │   PostgreSQL DB   │
         │  (Master/Replica) │
         └───────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Redis (Cache)    │
         └───────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐   ┌─────────┐   ┌──────────┐
│  Hudu  │   │ i-doit  │   │ Infexio  │
│ (ext)  │   │  (ext)  │   │  (ext)   │
└────────┘   └─────────┘   └──────────┘
```

### Container-Detail-Ansicht (Proxmox Node)

```
┌────────────────────────────────────────────────────────────┐
│              Proxmox VE Host (pve01.domain.local)          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LXC: psa-api-gateway (CT-100)                       │ │
│  │  - Nginx/Traefik                                     │ │
│  │  - Auth Middleware                                   │ │
│  │  - Rate Limiter                                      │ │
│  │  Network: vmbr0 (10.0.10.10)                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LXC: psa-crm (CT-101)                               │ │
│  │  - Node.js/Python FastAPI                            │ │
│  │  - REST API                                          │ │
│  │  Network: vmbr1 (10.0.10.11)                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LXC: psa-tickets (CT-102)                           │ │
│  │  - Django/Rails                                      │ │
│  │  - WebSocket Support                                 │ │
│  │  Network: vmbr1 (10.0.10.12)                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LXC: psa-db-master (CT-110)                         │ │
│  │  - PostgreSQL 15                                     │ │
│  │  - Replication to pve02                              │ │
│  │  Network: vmbr2 (10.0.20.10) - DB-VLAN               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Storage: Ceph RBD Pool "psa-data"                        │
│  Backup: Proxmox Backup Server (PBS)                     │
└────────────────────────────────────────────────────────────┘
```

## 3.8 Zusammenfassung

Die gewählte Architektur vereint die Vorteile lokaler Kontrolle und Cloud-Flexibilität.

Durch die LXC-basierten Container auf Proxmox wird ein hochperformanter, sicherer und skalierbarer Betrieb ermöglicht, der trotz Modularität eine gemeinsame Plattformlogik beibehält.

Gleichzeitig erlaubt die offene API-Struktur eine breite Integration mit bestehenden MSP-Systemen und kundenspezifischen Lösungen wie Infexio.

**Kernvorteile**:
- ✅ Volle Datenkontrolle (keine Cloud-Abhängigkeit)
- ✅ Hohe Performance durch natives LXC
- ✅ Einfache Skalierung durch Cluster-Architektur
- ✅ Geringe Betriebskosten (keine Lizenzgebühren für VM-Hypervisor)
- ✅ Schnelles Deployment durch Template-System
- ✅ Maximale Flexibilität durch modularen Aufbau
