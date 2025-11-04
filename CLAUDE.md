# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PSA-Platform** - Professional Services Automation platform for Managed Service Providers (MSP) in the DACH region (Germany, Austria, Switzerland).

This is a comprehensive enterprise platform that combines CRM, ticketing, project management, billing, asset management, and vCIO features into a unified solution.

## Documentation Structure

### Business Requirements
- `PSA-Platform-BRD.md` - Business Requirements Document (what and why)
- `01-Management-Summary.md` through `14-Erfolgskriterien.md` - Detailed requirements chapters

### Technical Architecture (BDUF)
All technical design documentation is in the **`BDUF/`** folder:
- **BDUF/README.md** - Start here for overview of all chapters
- **BDUF/BDUF-Chapter1.md** - Architecture principles (SOLID, 12-Factor, DDD)
- **BDUF/BDUF-Chapter2.md** - Technology stack (Node.js, PostgreSQL, React)
- **BDUF/BDUF-Chapter3.md** - Data model & database design (CRITICAL)
- **BDUF/BDUF-Chapter4.md** - API design & interfaces
- **BDUF/BDUF-Chapter5.md** - Security architecture
- **BDUF/BDUF-Chapter6.md** - Container architecture (LXC on Proxmox)
- **BDUF/BDUF-Chapter7.md** - Network architecture
- **BDUF/BDUF-Chapter8.md** - Deployment & CI/CD
- **BDUF/BDUF-Chapter9.md** - Monitoring & logging
- **BDUF/BDUF-Chapter10.md** - Backup & disaster recovery
- **BDUF/BDUF-Chapter11.md** - Performance optimization
- **BDUF/BDUF-Chapter12.md** - Scaling strategy
- **BDUF/BDUF-Chapter13.md** - Code organization & standards
- **BDUF/BDUF-Chapter14.md** - Testing strategy
- **BDUF/BDUF-Chapter15.md** - Development workflow

### Implementation Guides
All implementation documentation is in the **`implementation/`** folder:
- **implementation/README.md** - Overview and how to use module guides
- **implementation/00-DEPLOYMENT-STRATEGY.md** - Deployment strategy (single container → production)
- **implementation/01-MODULE-Infrastructure.md** - PostgreSQL, Redis, RabbitMQ, Elasticsearch setup
- **implementation/02-MODULE-Auth.md** - Authentication & Authorization (JWT, MFA, RBAC, SSO)
- **implementation/03-MODULE-API-Gateway.md** - API Gateway & Routing
- **implementation/04-MODULE-CRM.md** - Customer Relationship Management
- **implementation/05-MODULE-Tickets.md** - Ticketing & Service Desk

**Deployment Note:** For MVP, everything runs on a **single LXC container** (Container 200: psa-all-in-one). See deployment strategy document for scaling path.

### Sub-Agent Coordination System
Documentation for working with multiple Claude Code sub-agents in parallel:

**Main Documentation** (`AGENTS/` folder):
- **AGENTS/README.md** - Overview of sub-agent system
- **AGENTS/MASTER-INDEX.md** - Complete index of all agent resources
- **AGENTS/QUICK-START.md** - Quick start guide for sub-agents
- **AGENTS/SUB-AGENT-CONFIG.md** - Configuration guide for sub-agents
- **AGENTS/SUBAGENTS-README.md** - Detailed sub-agent system documentation
- **AGENTS/GIT-INTEGRATION-GUIDE.md** - Git workflow for parallel agent work

**Templates** (`templates/` folder):
- **templates/TEMPLATE-handover.md** - Handover template between agents
- **templates/TEMPLATE-issue.md** - Issue reporting template
- **templates/TEMPLATE-status-update.md** - Status update template

**Shared Resources** (`.subagents/` folder):
- **.subagents/README.md** - Sub-agent system overview
- **.subagents/shared/** - Shared code, types, constants (TypeScript)
  - `.env.template` - Environment variables template
  - `constants.ts` - Shared constants
  - `errors.ts` - Shared error definitions
  - `types.ts` - Shared TypeScript types

**When to use Sub-Agents:**
- Multiple modules need to be developed in parallel
- Large tasks that can be split into independent subtasks
- Each sub-agent should work on a separate feature branch
- Use handover templates when passing work between agents
- See `AGENTS/QUICK-START.md` for step-by-step instructions

## Architecture Highlights

### Technology Stack
- **Host Platform**: Proxmox VE 8.x with LXC containers (3-node HA cluster)
- **Backend**: Node.js 20 LTS with TypeScript 5.x
- **Frontend**: React or Vue.js (TBD)
- **Databases**: PostgreSQL 15+ (primary), Redis 7.x (cache), Elasticsearch 8.x (search)
- **Message Queue**: RabbitMQ 3.12+
- **Monitoring**: Zabbix 6.x, Prometheus + Grafana, ELK Stack

### Key Architectural Patterns
- Microservices architecture with domain-driven design
- CQRS for complex queries
- Event-driven communication via RabbitMQ
- API-first design with versioning
- Multi-tenancy support

## Critical Data Model Information

### ⚠️ Billing Rate Model (IMPORTANT)

The billing rate model supports **multiple billing rates per user** with different rates based on:
- Customer
- Contract
- Service level (L1, L2, L3)
- Work type (support, project, consulting, emergency)

**Key Tables:**
- `users` - Contains `internal_cost_rate` (MSP's internal cost) and `default_billing_rate` (fallback)
- `user_billing_rates` - Context-specific billing rates per user/customer/contract
- `time_entries` - Snapshots both `billing_rate` (charged to customer) and `cost_rate` (internal cost)

**Rate Resolution Hierarchy:**
1. user_billing_rates (most specific match)
2. contracts.hourly_rate (contract default)
3. users.default_billing_rate (user default)
4. ERROR if no rate found

**See:** `BDUF/BDUF-Chapter3-Billing-Rate-Fix.md` for complete details.

### Multi-User Ticket Support
Multiple users can work on one ticket, each with their own billing and cost rates tracked independently in time_entries.

## Database Schema

The complete database schema is defined in **BDUF/BDUF-Chapter3.md**. Key tables include:

**Core Entities:**
- customers, contacts, locations
- users, user_billing_rates
- tickets, time_entries, comments
- projects, project_tasks
- contracts, invoices
- assets, licenses

**Important:** All tables use UUID primary keys and soft-delete pattern (deleted_at column).

## Development Guidelines

### When Working on Data Model
1. **Always read BDUF/BDUF-Chapter3.md first** - It contains the authoritative schema
2. Respect the billing rate model hierarchy
3. Use snapshot pattern for rates in time_entries (don't reference users.internal_cost_rate directly)
4. Maintain referential integrity constraints
5. Follow soft-delete pattern (never hard delete)

### When Working on APIs
1. **Read BDUF/BDUF-Chapter4.md** for API design patterns
2. Use RESTful conventions
3. Version all APIs (e.g., /api/v1/)
4. Implement proper error handling with standardized error responses
5. Document with OpenAPI 3.0

### When Working on Security
1. **Read BDUF/BDUF-Chapter5.md** for security architecture
2. Always use RBAC for authorization
3. Support SSO (SAML, OIDC, LDAP)
4. Enforce MFA for privileged accounts
5. Log all security-relevant events to audit_log table

## Integrations

The platform integrates with:
- **DATEV** (Germany) - ERP/accounting integration
- **BMD NTCS** (Austria) - ERP/accounting integration
- **Hudu** - Documentation platform
- **i-doit** - CMDB
- **RMM Systems** - Datto, N-able, Kaseya
- **Microsoft 365 / Teams** - Collaboration
- **Infexio** - Custom MSP tool (iteas proprietary)

## Language & Localization

- Primary market: DACH region (Germany, Austria, Switzerland)
- Default language: German (de)
- All documentation is in German
- Support for German accounting standards (DATEV, BMD)
- DSGVO (GDPR) compliance required
- Date format: DD.MM.YYYY (European)
- Currency: EUR (€)

## Common Tasks

### Understanding the Architecture
```bash
# Start with the overview
cat BDUF/README.md

# Read architecture principles
cat BDUF/BDUF-Chapter1.md

# Understand the data model (most important)
cat BDUF/BDUF-Chapter3.md
```

### Database Work
```bash
# View complete schema
grep "CREATE TABLE" BDUF/BDUF-Chapter3.md

# Understand billing rate resolution
cat BDUF/BDUF-Chapter3-Billing-Rate-Fix.md
```

### Before Making Changes
1. Check if it affects the data model → Update BDUF/BDUF-Chapter3.md
2. Check if it adds/changes APIs → Update BDUF/BDUF-Chapter4.md
3. Check if it affects security → Update BDUF/BDUF-Chapter5.md
4. Always maintain backward compatibility

## Project Status

**Current Phase:** Implementation Planning & Setup
- ✅ BRD complete (Business Requirements Document)
- ✅ BDUF documentation complete (20 chapters + Appendix)
- ✅ Data model defined and validated
- ✅ Implementation guides created (5 modules for Phase 1 MVP)
- ✅ Sub-agent coordination system setup
- ✅ Deployment strategy defined (single container → production)
- ⏳ Implementation starting (ready for parallel development)

## Important Notes

1. **This is a greenfield project** - No existing code base yet
2. **BDUF approach** - Complete design before implementation starts
3. **Multi-tenancy** - Platform will support multiple MSP tenants
4. **High availability** - Designed for 99.5% uptime with 3-node cluster
5. **Scalability** - Must support 200+ tenants and 10,000+ tickets/day

## Future Claude Instances

When working on this project:

### First Time Setup
1. **Read this CLAUDE.md file completely** - Start here!
2. **Check BDUF/README.md** to understand the architecture
3. **Review implementation/README.md** for deployment and module guides
4. **If working with other agents:** Read AGENTS/QUICK-START.md

### Understanding the System
1. **Data model (CRITICAL):** BDUF/BDUF-Chapter3.md - Read thoroughly
2. **Billing rate model:** BDUF-Chapter3-Billing-Rate-Fix.md - Complex, study carefully
3. **Deployment strategy:** implementation/00-DEPLOYMENT-STRATEGY.md - Single container MVP
4. **Module you're working on:** implementation/XX-MODULE-YourModule.md

### Working with Sub-Agents
If you're part of a parallel development effort:
1. Read **AGENTS/QUICK-START.md** for coordination guidelines
2. Create your feature branch: `feature/module-name`
3. Use templates from `templates/` folder for handovers and status updates
4. Check **AGENTS/GIT-INTEGRATION-GUIDE.md** for git workflow
5. Update your status regularly using templates

### Important Constraints
1. This is a **German/DACH market product** - respect localization requirements
2. **Security and compliance (DSGVO)** are non-negotiable
3. The architecture is **LXC-based on Proxmox**, not Docker
4. **Multi-tenancy:** All customer data must respect tenant_id isolation
5. **Billing rates:** Use the rate resolution hierarchy - don't take shortcuts!

## Git Workflow

- Main branch: `master`
- Development happens on feature branches
- Use descriptive commit messages
- Reference issue numbers when applicable

## Contact & Support

This is an internal project for the PSA-Platform team.
For questions about architecture decisions, consult the BDUF documentation first.

---

**Last Updated:** 2025-11-04
**Version:** 2.0
**Status:** Implementation Ready - Sub-Agent Coordination System Active
