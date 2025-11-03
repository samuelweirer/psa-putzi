# Big Design Up Front (BDUF)
## PSA-Platform für Managed Service Provider

**Version:** 1.0  
**Datum:** November 2025  
**Status:** Final Draft  
**Autor:** Tech-Lead & Architektur-Team  
**Basierend auf:** BRD v1.0

---

## EXECUTIVE SUMMARY

Dieses BDUF-Dokument definiert die vollständige technische Architektur der PSA-Platform vor Entwicklungsbeginn.

**Kern-Architektur:**
- Microservices mit LXC-Containern auf Proxmox VE
- Node.js/TypeScript Backend + React Frontend
- PostgreSQL, Redis, RabbitMQ, Elasticsearch
- JWT-Authentication + RBAC
- CI/CD mit GitLab
- 3-Node HA-Cluster

**Dokument-Umfang:** 150+ Seiten technische Spezifikationen

---

## INHALTSVERZEICHNIS

1. Architektur-Prinzipien & Übersicht
2. Technologie-Stack (detailliert)
3. Datenmodell & Datenbank-Design
4. API-Design & Schnittstellen
5. Security-Architektur
6. Container-Architektur (LXC)
7. Netzwerk-Architektur
8. Deployment & CI/CD
9. Monitoring & Logging
10. Backup & Disaster Recovery
11. Performance-Optimierung
12. Skalierungs-Strategie
13. Code-Organisation & Standards
14. Testing-Strategie
15. Entwicklungs-Workflow
16. Architecture Decision Records
17. Performance Benchmarks
18. Security Checklist
19. Deployment Checklist
20. Maintenance & Troubleshooting

---

## 1. ARCHITEKTUR-PRINZIPIEN & ÜBERSICHT

### 1.1 Architektur-Prinzipien

**SOLID-Prinzipien:**
- **S**ingle Responsibility - Jede Klasse hat eine Verantwortung
- **O**pen/Closed - Offen für Erweiterung, geschlossen für Änderung
- **L**iskov Substitution - Unterklassen ersetzen Basisklassen
- **I**nterface Segregation - Kleine, spezifische Interfaces
- **D**ependency Inversion - Abhängigkeiten zu Abstraktionen

**12-Factor App Prinzipien:**
1. **Codebase** - Ein Repository, viele Deployments
2. **Dependencies** - Explizit deklariert und isoliert
3. **Config** - In Environment-Variables gespeichert
4. **Backing Services** - Als angehängte Ressourcen behandelt
5. **Build/Release/Run** - Strikte Trennung der Stages
6. **Processes** - App als stateless Prozesse
7. **Port Binding** - Services via Port-Binding exportiert
8. **Concurrency** - Scale-out via Prozess-Model
9. **Disposability** - Schneller Start und graceful shutdown
10. **Dev/Prod Parity** - Minimale Unterschiede zwischen Umgebungen
11. **Logs** - Als Event-Streams behandelt
12. **Admin Processes** - Als One-off-Prozesse

**Weitere Architektur-Prinzipien:**
- **API-First Design** - Alle Funktionen über APIs
- **Security by Design** - Security von Anfang an
- **Performance by Design** - Performance-Tests ab Sprint 1
- **Fail-Fast Principle** - Fehler früh erkennen
- **Idempotency** - API-Operationen idempotent
- **Circuit Breaker** - Graceful degradation bei Ausfällen
- **Event-Driven** - Lose Kopplung via Events

### 1.2 High-Level System-Architektur

```
┌─────────────────────────────────────────────┐
│           Internet / WAN                    │
└──────────────────┬──────────────────────────┘
                   │
            ┌──────▼──────┐
            │  Firewall   │
            │  pfsense    │
            └──────┬──────┘
                   │
        ┌──────────▼──────────┐
        │   Load Balancer     │
        │   HAProxy/Traefik   │
        └──────────┬──────────┘
                   │
     ┌─────────────▼─────────────┐
     │      API Gateway          │
     │  - JWT Authentication     │
     │  - Rate Limiting          │
     │  - Request Routing        │
     │  - Logging                │
     └─────────────┬─────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐    ┌───▼────┐    ┌───▼────┐
│  CRM   │    │Tickets │    │Billing │
│Service │    │Service │    │Service │
└───┬────┘    └───┬────┘    └───┬────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
       ┌──────────▼─────────┐
       │   Message Queue    │
       │   RabbitMQ         │
       └──────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────┐
│Projects│   │ Assets │   │Reports │
│Service │   │Service │   │Service │
└───┬────┘   └───┬────┘   └───┬────┘
    │            │            │
    └────────────┼────────────┘
                 │
      ┌──────────▼─────────┐
      │    Data Layer      │
      │ - PostgreSQL (M/R) │
      │ - Redis (Cache)    │
      │ - Elasticsearch    │
      └────────────────────┘
```

### 1.3 Architektur-Patterns

**Microservices-Architektur:**
- Jedes Modul = eigener LXC-Container
- Loose Coupling via REST-APIs
- Independent Deployment
- Service Discovery via DNS
- API-Gateway als Single Entry Point

**Event-Driven Architecture:**
- Asynchrone Kommunikation via RabbitMQ
- Event-Sourcing für Audit-Trail (optional)
- CQRS (Command Query Responsibility Segregation)
- Pub/Sub Pattern für Notifications

**Repository-Pattern:**
- Abstraktion der Datenzugriffe
- Dependency Injection für Testability
- Query-Builder für komplexe Queries
- Transaction-Management

**API-Gateway-Pattern:**
- Zentraler Entry Point
- Cross-Cutting Concerns (Auth, Logging)
- Request/Response-Transformation
- Backend-for-Frontend (BFF) für Mobile

---

## 2. TECHNOLOGIE-STACK (DETAILLIERT)

### 2.1 Backend-Technologien

**Primary Backend: Node.js 20 LTS + TypeScript 5.x**

**Begründung:**
✅ Non-blocking I/O für hohen Durchsatz
✅ Einheitliche Sprache (JavaScript/TypeScript) auf Frontend + Backend
✅ Großes NPM-Ecosystem mit reifen Libraries
✅ Excellente Performance für I/O-intensive Applikationen
✅ Starke Community und Enterprise-Support
✅ Team-Know-how bereits vorhanden

**Framework: NestJS 10.x**

NestJS bietet:
- Dependency Injection Container
- Decorator-basiertes Design
- TypeScript First-Class Support
- Modular Architecture
- Built-in Testing Support
- OpenAPI/Swagger Integration

**Beispiel Controller:**
```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';

@Controller('tickets')
@ApiTags('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async findAll(
    @Query() query: ListTicketsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<TicketDto>> {
    return this.ticketsService.findAll(query, req.user);
  }

  @Post()
  @Roles(Role.Technician, Role.ServiceManager, Role.Admin)
  @ApiOperation({ summary: 'Create new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createDto: CreateTicketDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TicketDto> {
    const ticket = await this.ticketsService.create(createDto, req.user);
    
    // Emit event for async processing
    this.eventEmitter.emit('ticket.created', {
      ticketId: ticket.id,
      customerId: ticket.customer_id,
      priority: ticket.priority,
      createdBy: req.user.id,
    });
    
    return ticket;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id') id: string): Promise<TicketDto> {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TicketDto> {
    return this.ticketsService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ServiceManager, Role.Admin)
  @ApiOperation({ summary: 'Delete ticket (soft delete)' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.ticketsService.remove(id);
  }
}
```

**ORM: TypeORM 0.3.x**

TypeORM Features:
- Active Record und Data Mapper Patterns
- Database Migrations
- Relations (One-to-One, One-to-Many, Many-to-Many)
- Query Builder
- Transactions
- Connection Pooling

**Beispiel Entity:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, 
         CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export enum TicketStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('tickets')
@Index(['customer_id', 'status'])
@Index(['assigned_to', 'status'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', unique: true })
  ticket_number: number;

  @Column({ length: 200 })
  @Index()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.NEW,
  })
  @Index()
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @Index()
  priority: Priority;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'uuid' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'varchar', length: 20 })
  source: string;

  @Column({ type: 'timestamp', nullable: true })
  sla_response_due: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sla_resolution_due: Date | null;

  @Column({ type: 'boolean', default: false })
  sla_breached: boolean;

  @Column({ type: 'timestamp', nullable: true })
  first_response_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Virtual/Computed Properties
  get isOverdue(): boolean {
    if (!this.sla_resolution_due || this.status === TicketStatus.CLOSED) {
      return false;
    }
    return new Date() > this.sla_resolution_due;
  }

  get ageInHours(): number {
    return (Date.now() - this.created_at.getTime()) / (1000 * 60 * 60);
  }
}
```

**Service-Layer Beispiel:**
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepo: Repository<Ticket>,
    private readonly slaService: SlaService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateTicketDto, user: User): Promise<Ticket> {
    // Validate customer exists
    const customer = await this.customersRepo.findOne({
      where: { id: dto.customer_id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Create ticket entity
    const ticket = this.ticketsRepo.create({
      ...dto,
      status: TicketStatus.NEW,
      source: 'portal',
      created_by: user.id,
    });

    // Calculate SLA deadlines
    const sla = await this.slaService.getForCustomer(dto.customer_id);
    ticket.sla_response_due = this.slaService.calculateResponseDue(
      sla,
      dto.priority,
    );
    ticket.sla_resolution_due = this.slaService.calculateResolutionDue(
      sla,
      dto.priority,
    );

    // Auto-assign if rules exist
    const assignee = await this.assignmentService.findBestTechnician(
      dto.customer_id,
      dto.category,
      dto.priority,
    );
    if (assignee) {
      ticket.assigned_to = assignee.id;
      ticket.status = TicketStatus.ASSIGNED;
    }

    // Save to database
    const saved = await this.ticketsRepo.save(ticket);

    // Send notifications
    await this.notificationService.notifyTicketCreated(saved);

    // Emit event for async processing
    this.eventEmitter.emit('ticket.created', {
      ticket: saved,
      user: user,
    });

    return saved;
  }

  async findAll(
    query: ListTicketsDto,
    user: User,
  ): Promise<PaginatedResponse<Ticket>> {
    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .where('ticket.deleted_at IS NULL');

    // Apply filters
    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }
    if (query.customer_id) {
      qb.andWhere('ticket.customer_id = :customerId', {
        customerId: query.customer_id,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply RBAC
    if (user.role === Role.Technician) {
      // Technicians only see their own tickets
      qb.andWhere('ticket.assigned_to = :userId', { userId: user.id });
    } else if (user.role === Role.CustomerAdmin) {
      // Customer admins only see their customer's tickets
      qb.andWhere('customer.id = :customerId', {
        customerId: user.customer_id,
      });
    }

    // Pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100
    qb.skip((page - 1) * limit).take(limit);

    // Sorting
    const sortField = query.sort || 'created_at';
    const sortOrder = query.order || 'DESC';
    qb.orderBy(`ticket.${sortField}`, sortOrder as 'ASC' | 'DESC');

    // Execute query
    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      links: {
        self: `/tickets?page=${page}`,
        next: page < Math.ceil(total / limit) ? `/tickets?page=${page + 1}` : null,
        prev: page > 1 ? `/tickets?page=${page - 1}` : null,
      },
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id, deleted_at: null },
      relations: ['customer', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(
    id: string,
    dto: UpdateTicketDto,
    user: User,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Check permissions
    if (
      user.role === Role.Technician &&
      ticket.assigned_to !== user.id
    ) {
      throw new ForbiddenException(
        'You can only update tickets assigned to you',
      );
    }

    // Track status changes
    const oldStatus = ticket.status;
    Object.assign(ticket, dto);

    // Update timestamps based on status changes
    if (dto.status && dto.status !== oldStatus) {
      if (dto.status === TicketStatus.RESOLVED) {
        ticket.resolved_at = new Date();
      } else if (dto.status === TicketStatus.CLOSED) {
        ticket.closed_at = new Date();
      }
    }

    const updated = await this.ticketsRepo.save(ticket);

    // Emit events
    if (dto.status && dto.status !== oldStatus) {
      this.eventEmitter.emit('ticket.status_changed', {
        ticket: updated,
        oldStatus,
        newStatus: dto.status,
        user,
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketsRepo.softRemove(ticket);
    
    this.eventEmitter.emit('ticket.deleted', {
      ticketId: id,
    });
  }
}
```

## 4. API-DESIGN (DETAILLIERT)

### 4.1 REST-API-Konventionen

**Resource-basierte URLs:**
```
GET    /api/v1/tickets          # List tickets
POST   /api/v1/tickets          # Create ticket
GET    /api/v1/tickets/:id      # Get ticket
PATCH  /api/v1/tickets/:id      # Update ticket
DELETE /api/v1/tickets/:id      # Delete ticket

GET    /api/v1/tickets/:id/comments      # Get comments
POST   /api/v1/tickets/:id/comments      # Add comment
GET    /api/v1/tickets/:id/time-entries  # Get time entries
```

**HTTP-Verben:**
- **GET** - Read (idempotent, safe)
- **POST** - Create (not idempotent)
- **PUT** - Replace (idempotent)
- **PATCH** - Update partial (not idempotent)
- **DELETE** - Delete (idempotent)

**Standard-Response-Format:**
```json
{
  "data": {
    "id": "uuid",
    "type": "ticket",
    "attributes": {
      "title": "...",
      "status": "open"
    },
    "relationships": {
      "customer": {
        "data": { "type": "customer", "id": "uuid" }
      }
    }
  },
  "meta": {
    "timestamp": "2025-11-03T10:30:00Z"
  }
}
```

**Pagination:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "links": {
    "self": "/tickets?page=1",
    "next": "/tickets?page=2",
    "prev": null,
    "first": "/tickets?page=1",
    "last": "/tickets?page=8"
  }
}
```

**Filtering:**
```
GET /api/v1/tickets?status=open&priority=high
GET /api/v1/tickets?customer_id=uuid
GET /api/v1/tickets?search=network%20issue
GET /api/v1/tickets?created_after=2025-11-01
```

**Sorting:**
```
GET /api/v1/tickets?sort=created_at&order=desc
GET /api/v1/tickets?sort=priority,created_at&order=desc,asc
```

**Field Selection (Sparse Fieldsets):**
```
GET /api/v1/tickets?fields=id,title,status,priority
```

**Include Related Resources:**
```
GET /api/v1/tickets?include=customer,assigned_to
```

### 4.2 Authentication & Authorization

**JWT-Token-Format:**
```typescript
interface JWTPayload {
  sub: string;          // user_id
  email: string;
  role: string;
  permissions: string[];
  customer_id?: string; // for customer users
  iat: number;
  exp: number;
  jti: string;          // JWT ID for revocation
}
```

**Access Token (1 Stunde):**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Refresh Token (7 Tage):**
```json
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}

Response:
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

**Token-Revocation:**
```typescript
// Redis-basiertes Blacklist-System
await redis.setex(
  `blacklist:${jti}`,
  tokenExpirySeconds,
  'revoked'
);
```

### 4.3 Rate-Limiting

**Rate-Limit-Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699012800
```

**Rate-Limit-Implementierung:**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retry_after: req.rateLimit.resetTime,
      },
    });
  },
});

app.use('/api/', apiLimiter);
```

**Per-User-Rate-Limiting:**
```typescript
const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: async (req) => {
    const user = req.user;
    // Higher limits for paid tiers
    if (user.tier === 'enterprise') return 10000;
    if (user.tier === 'professional') return 5000;
    return 1000;
  },
  keyGenerator: (req) => req.user.id,
});
```

### 4.4 Error-Handling

**Standard-Error-Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "priority",
        "message": "Priority must be one of: low, medium, high, critical"
      }
    ],
    "request_id": "req_1234567890",
    "timestamp": "2025-11-03T10:30:00Z"
  }
}
```

**HTTP-Status-Codes:**
```typescript
// Success
200 OK              // Successful GET, PATCH
201 Created         // Successful POST
204 No Content      // Successful DELETE

// Client Errors
400 Bad Request     // Invalid input
401 Unauthorized    // Missing/invalid auth
403 Forbidden       // No permission
404 Not Found       // Resource not found
409 Conflict        // Resource conflict
422 Unprocessable   // Validation error
429 Too Many Req    // Rate limit

// Server Errors
500 Internal Error  // Unexpected error
502 Bad Gateway     // Upstream error
503 Service Unavail // Maintenance
504 Gateway Timeout // Upstream timeout
```

**Error-Codes:**
```typescript
enum ErrorCode {
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Authorization
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  
  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### 4.5 API-Versioning

**URL-basierte Versionierung:**
```
/api/v1/tickets  # Current stable version
/api/v2/tickets  # New version (beta)
```

**Header-basierte Versionierung (Alternative):**
```
Accept: application/vnd.psa.v1+json
```

**Deprecation-Policy:**
```typescript
// Deprecation-Header
res.setHeader('Deprecation', 'true');
res.setHeader('Sunset', 'Sat, 01 May 2026 00:00:00 GMT');
res.setHeader('Link', '</api/v2/tickets>; rel="successor-version"');
```

**Version-Changelog:**
```markdown
## API v2 (2026-01-01)
**Breaking Changes:**
- `priority` field changed from string to integer enum
- `customer` field renamed to `customer_id`
- Removed deprecated `assignee` field (use `assigned_to`)

**New Features:**
- Added `tags` array field
- Added `/tickets/:id/attachments` endpoint

**Deprecations:**
- `status` field will be removed in v3 (use `workflow_state`)

## API v1 (2025-01-01)
- Initial stable release
```

### 4.6 OpenAPI/Swagger-Spezifikation

**OpenAPI 3.0 Beispiel:**
```yaml
openapi: 3.0.0
info:
  title: PSA-Platform API
  version: 1.0.0
  description: Professional Services Automation Platform API
  contact:
    email: api@psa-platform.example.com
  license:
    name: Proprietary

servers:
  - url: https://api.psa-platform.example.com/v1
    description: Production
  - url: https://staging-api.psa-platform.example.com/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /tickets:
    get:
      summary: List tickets
      tags:
        - Tickets
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: status
          in: query
          schema:
            type: string
            enum: [new, assigned, in_progress, waiting_customer, resolved, closed]
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high, critical]
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Ticket'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
    post:
      summary: Create ticket
      tags:
        - Tickets
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTicket'
      responses:
        '201':
          description: Ticket created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Ticket'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Ticket:
      type: object
      properties:
        id:
          type: string
          format: uuid
        ticket_number:
          type: integer
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [new, assigned, in_progress, waiting_customer, resolved, closed]
        priority:
          type: string
          enum: [low, medium, high, critical]
        customer_id:
          type: string
          format: uuid
        assigned_to:
          type: string
          format: uuid
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CreateTicket:
      type: object
      required:
        - title
        - description
        - customer_id
        - priority
      properties:
        title:
          type: string
          minLength: 3
          maxLength: 200
        description:
          type: string
          minLength: 10
        customer_id:
          type: string
          format: uuid
        priority:
          type: string
          enum: [low, medium, high, critical]
        category:
          type: string

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
```

---

## 5. SECURITY-ARCHITEKTUR (DETAILLIERT)

### 5.1 Multi-Layer-Security

```
┌────────────────────────────────────────┐
│  Layer 1: Network Security             │
│  - Firewall (pfsense)                  │
│  - IDS/IPS (Suricata)                  │
│  - VLAN Segmentation                   │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 2: Application Security         │
│  - Input Validation                    │
│  - CSRF Protection                     │
│  - XSS Prevention                      │
│  - SQL Injection Prevention            │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 3: Authentication               │
│  - JWT Tokens                          │
│  - MFA (TOTP, FIDO2)                   │
│  - SSO (SAML, OIDC)                    │
│  - Password Policy                     │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 4: Authorization                │
│  - RBAC                                │
│  - Granular Permissions                │
│  - Resource-Level Access Control       │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 5: Data Security                │
│  - TLS 1.3 (Transit)                   │
│  - AES-256 (At Rest)                   │
│  - Field-Level Encryption              │
│  - Secure Key Management               │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 6: Monitoring & Audit           │
│  - Security Event Logging              │
│  - SIEM Integration                    │
│  - Intrusion Detection                 │
│  - Anomaly Detection                   │
└────────────────────────────────────────┘
```

### 5.2 Authentication-Implementierung

**Password-Hashing (bcrypt):**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**JWT-Generation:**
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('keys/jwt-private.pem');
const publicKey = fs.readFileSync('keys/jwt-public.pem');

function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    jti: uuidv4(),
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    issuer: 'psa-platform',
    audience: 'psa-api',
  });
}

function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'psa-platform',
    audience: 'psa-api',
  }) as JWTPayload;
}
```

**MFA-Implementierung (TOTP):**
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

async function generateMFASecret(user: User) {
  const secret = speakeasy.generateSecret({
    name: `PSA Platform (${user.email})`,
    issuer: 'PSA Platform',
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
}

function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
}
```

### 5.3 Authorization-Implementierung (RBAC)

**Permission-Checker:**
```typescript
enum Permission {
  // Tickets
  TICKET_VIEW_ALL = 'ticket:view:all',
  TICKET_VIEW_OWN = 'ticket:view:own',
  TICKET_CREATE = 'ticket:create',
  TICKET_UPDATE = 'ticket:update',
  TICKET_DELETE = 'ticket:delete',
  
  // Customers
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  
  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_CREATE = 'billing:create',
  BILLING_APPROVE = 'billing:approve',
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  system_admin: [
    // All permissions
    ...Object.values(Permission),
  ],
  service_manager: [
    Permission.TICKET_VIEW_ALL,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.CUSTOMER_VIEW,
  ],
  technician_l2: [
    Permission.TICKET_VIEW_OWN,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
  ],
  customer_admin: [
    Permission.TICKET_VIEW_OWN,
    Permission.TICKET_CREATE,
  ],
};

function hasPermission(
  user: User,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}
```

**Permission-Guard (NestJS):**
```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.some((permission) =>
      hasPermission(user, permission)
    );
  }
}

// Usage
@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  @Get()
  @RequirePermissions(Permission.TICKET_VIEW_ALL)
  async findAll() {
    // ...
  }

  @Post()
  @RequirePermissions(Permission.TICKET_CREATE)
  async create() {
    // ...
  }
}
```

### 5.4 Input-Validation

**DTO-Validation (class-validator):**
```typescript
import { IsString, IsEmail, IsEnum, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsUUID()
  customer_id: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  category?: string;
}
```

**SQL-Injection-Prevention (ORM):**
```typescript
// ✅ SAFE - Using ORM
const tickets = await this.ticketsRepo.find({
  where: {
    customer_id: customerId,
    status: status,
  },
});

// ✅ SAFE - Parameterized query
const tickets = await this.ticketsRepo.query(
  'SELECT * FROM tickets WHERE customer_id = $1 AND status = $2',
  [customerId, status]
);

// ❌ UNSAFE - String concatenation
const tickets = await this.ticketsRepo.query(
  `SELECT * FROM tickets WHERE customer_id = '${customerId}'`
);
```

**XSS-Prevention:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// Usage
const sanitizedDescription = sanitizeHtml(ticket.description);
```

**CSRF-Protection:**
```typescript
import csurf from 'csurf';

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

app.use(csrfProtection);

// Send token to frontend
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 5.5 Data-Encryption

**Encryption-at-Rest (Field-Level):**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage in Entity
@Entity()
export class License {
  @Column({
    type: 'text',
    transformer: {
      to: (value: string) => encrypt(value),
      from: (value: string) => decrypt(value),
    },
  })
  license_key: string;
}
```

**TLS-Configuration (Nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name api.psa-platform.example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/psa-platform.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/psa-platform.example.com/privkey.pem;

    # TLS Configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    location / {
        proxy_pass http://api-gateway:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.6 Security-Monitoring

**Audit-Logging:**
```typescript
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    userId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const auditLog = this.auditRepo.create({
      ...params,
      request_id: getCurrentRequestId(),
      created_at: new Date(),
    });

    await this.auditRepo.save(auditLog);
  }
}

// Usage in Service
async update(id: string, dto: UpdateTicketDto, user: User) {
  const ticket = await this.findOne(id);
  const oldValues = { ...ticket };

  Object.assign(ticket, dto);
  const updated = await this.ticketsRepo.save(ticket);

  // Log audit
  await this.auditLogService.log({
    entityType: 'ticket',
    entityId: id,
    action: 'UPDATE',
    userId: user.id,
    changes: {
      old: oldValues,
      new: updated,
    },
  });

  return updated;
}
```

**Failed-Login-Tracking:**
```typescript
@Injectable()
export class LoginAttemptService {
  constructor(private redis: Redis) {}

  async recordFailedAttempt(email: string, ip: string) {
    const key = `login:failed:${email}`;
    const attempts = await this.redis.incr(key);
    await this.redis.expire(key, 900); // 15 minutes

    if (attempts >= 5) {
      // Lock account
      await this.lockAccount(email, 900); // 15 minutes
      await this.notifySecurityTeam(email, ip);
    }

    return attempts;
  }

  async resetFailedAttempts(email: string) {
    await this.redis.del(`login:failed:${email}`);
  }

  async isAccountLocked(email: string): Promise<boolean> {
    return await this.redis.exists(`account:locked:${email}`) === 1;
  }
}
```

---

## 6. CONTAINER-ARCHITEKTUR (LXC)

### 6.1 LXC-Template-Erstellung

**Base-Template (Debian 12):**
```bash
#!/bin/bash
# create-psa-template.sh

# Create base container
pct create 9000 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
    --hostname psa-template \
    --memory 2048 \
    --cores 2 \
    --storage local-lvm \
    --rootfs local-lvm:8 \
    --unprivileged 1 \
    --features nesting=1

# Start container
pct start 9000

# Wait for boot
sleep 10

# Install base packages
pct exec 9000 -- bash -c "
    apt-get update
    apt-get upgrade -y
    apt-get install -y \
        curl \
        wget \
        git \
        vim \
        htop \
        net-tools \
        ca-certificates \
        gnupg \
        lsb-release
"

# Install Node.js 20 LTS
pct exec 9000 -- bash -c "
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g npm@latest
    npm install -g pm2
"

# Create app user
pct exec 9000 -- bash -c "
    useradd -m -s /bin/bash psa
    mkdir -p /opt/psa
    chown psa:psa /opt/psa
"

# Configure systemd service
pct exec 9000 -- bash -c "
    cat > /etc/systemd/system/psa.service <<EOF
[Unit]
Description=PSA Platform Service
After=network.target

[Service]
Type=forking
User=psa
WorkingDirectory=/opt/psa
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable psa.service
"

# Cleanup
pct exec 9000 -- bash -c "
    apt-get clean
    rm -rf /var/lib/apt/lists/*
    history -c
"

# Stop container
pct stop 9000

# Convert to template
vzdump 9000 --compress zstd --mode stop --dumpdir /var/lib/vz/template/cache
mv /var/lib/vz/template/cache/vzdump-lxc-9000*.tar.zst \
   /var/lib/vz/template/cache/psa-base-template.tar.zst

# Remove temporary container
pct destroy 9000

echo "✅ Template created: psa-base-template.tar.zst"
```

### 6.2 Service-Deployment

**CRM-Service-Deployment:**
```bash
#!/bin/bash
# deploy-crm-service.sh

# Create CRM container from template
pct create 101 local:vztmpl/psa-base-template.tar.zst \
    --hostname psa-crm \
    --memory 4096 \
    --cores 2 \
    --storage local-lvm \
    --rootfs local-lvm:30 \
    --net0 name=eth0,bridge=vmbr1,ip=10.0.10.11/24,gw=10.0.10.1 \
    --nameserver 10.0.10.1 \
    --searchdomain psa.local \
    --unprivileged 1

# Start container
pct start 101

# Wait for network
sleep 15

# Deploy application
pct exec 101 -- bash -c "
    cd /opt/psa
    git clone https://gitlab.internal/psa/crm-service.git .
    npm ci --production
    cp .env.production .env
"

# Start service
pct exec 101 -- systemctl start psa.service

# Verify
pct exec 101 -- pm2 status

echo "✅ CRM Service deployed on 10.0.10.11"
```

### 6.3 Container-Monitoring

**Resource-Limits:**
```bash
# Set CPU limit (2 cores)
pct set 101 --cores 2 --cpulimit 2

# Set memory limit (4GB)
pct set 101 --memory 4096 --swap 0

# Set disk I/O limits
pct set 101 --rootfs local-lvm:30,size=30G,iops_rd=1000,iops_wr=1000

# Set network bandwidth limit (100 Mbps)
pct set 101 --net0 name=eth0,bridge=vmbr1,rate=100
```

**Health-Checks:**
```bash
#!/bin/bash
# health-check.sh

CONTAINER_ID=101
SERVICE_URL="http://10.0.10.11:3000/health"

# Check container status
if ! pct status $CONTAINER_ID | grep -q "running"; then
    echo "❌ Container $CONTAINER_ID is not running"
    pct start $CONTAINER_ID
    exit 1
fi

# Check service health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Service health check failed (HTTP $HTTP_CODE)"
    pct exec $CONTAINER_ID -- systemctl restart psa.service
    exit 1
fi

echo "✅ Container $CONTAINER_ID is healthy"
```

---

## 7. NETZWERK-ARCHITEKTUR (DETAILLIERT)

### 7.1 VLAN-Konfiguration

**pfsense VLAN-Setup:**
```
VLAN 10 - Management (10.0.10.0/24)
- Gateway: 10.0.10.1
- DHCP: 10.0.10.100-10.0.10.200
- DNS: 10.0.10.1

VLAN 20 - Services (10.0.20.0/24)
- Gateway: 10.0.20.1
- Static IPs only
- DNS: 10.0.20.1

VLAN 30 - Database (10.0.30.0/24)
- Gateway: 10.0.30.1
- Static IPs only
- No internet access

VLAN 40 - DMZ (10.0.40.0/24)
- Gateway: 10.0.40.1
- Internet-facing services
- Strict firewall rules

VLAN 50 - Backup (10.0.50.0/24)
- Gateway: 10.0.50.1
- Backup traffic only
```

**Firewall-Rules (pfsense):**
```
# VLAN 10 (Management) → VLAN 20 (Services)
allow tcp from 10.0.10.0/24 to 10.0.20.0/24 port 3000-3010

# VLAN 20 (Services) → VLAN 30 (Database)
allow tcp from 10.0.20.0/24 to 10.0.30.10 port 5432  # PostgreSQL
allow tcp from 10.0.20.0/24 to 10.0.30.12 port 6379  # Redis

# VLAN 40 (DMZ) → VLAN 20 (Services)
allow tcp from 10.0.40.10 to 10.0.20.10 port 3000  # API Gateway

# Block all other inter-VLAN traffic
block from any to any
```

### 7.2 HAProxy-Konfiguration

**haproxy.cfg:**
```
global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # SSL/TLS
    ssl-default-bind-ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option forwardfor
    option http-server-close
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

frontend api_frontend
    bind *:443 ssl crt /etc/haproxy/certs/psa-platform.pem
    bind *:80
    redirect scheme https code 301 if !{ ssl_fc }
    
    # Security Headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    http-response set-header X-Frame-Options "DENY"
    http-response set-header X-Content-Type-Options "nosniff"
    http-response set-header X-XSS-Protection "1; mode=block"
    
    # Rate Limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
    
    # ACLs
    acl is_api path_beg /api/
    acl is_health path /health
    
    # Backends
    use_backend api_backend if is_api
    use_backend health_backend if is_health
    default_backend api_backend

backend api_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server api-gw-1 10.0.20.10:3000 check inter 10s fall 3 rise 2
    server api-gw-2 10.0.20.11:3000 check inter 10s fall 3 rise 2 backup

backend health_backend
    server health 127.0.0.1:8080

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats auth admin:secure_password
```

---

## 8. CI/CD-PIPELINE (DETAILLIERT)

### 8.1 GitLab CI Configuration

**.gitlab-ci.yml:**
```yaml
stages:
  - build
  - test
  - security
  - package
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  NODE_VERSION: "20"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

before_script:
  - node --version
  - npm --version

# ===== BUILD STAGE =====
build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day
  only:
    - branches

# ===== TEST STAGE =====
test:unit:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  only:
    - branches

test:integration:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: psa_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: test_password
    DATABASE_URL: postgres://postgres:test_password@postgres:5432/psa_test
    REDIS_URL: redis://redis:6379
  script:
    - npm ci
    - npm run test:integration
  only:
    - branches

test:e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm ci
    - npx playwright install
    - npm run test:e2e
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
    expire_in: 7 days
  only:
    - merge_requests
    - main
    - develop

# ===== SECURITY STAGE =====
security:sast:
  stage: security
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm audit --production --audit-level=high
  allow_failure: true
  only:
    - branches

security:dependency-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy fs --severity HIGH,CRITICAL --no-progress .
  allow_failure: true
  only:
    - merge_requests
    - main

security:secrets-scan:
  stage: security
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog filesystem . --only-verified
  allow_failure: false
  only:
    - branches

# ===== PACKAGE STAGE =====
package:lxc-template:
  stage: package
  script:
    - ./scripts/create-lxc-template.sh
  artifacts:
    paths:
      - dist/psa-service.tar.zst
    expire_in: 30 days
  only:
    - main
    - develop

# ===== DEPLOY STAGE =====
deploy:staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging-api.psa-platform.example.com
  script:
    - ./scripts/deploy-to-staging.sh
  only:
    - develop
  when: manual

deploy:production:
  stage: deploy
  environment:
    name: production
    url: https://api.psa-platform.example.com
  script:
    - ./scripts/deploy-to-production.sh
  only:
    - main
  when: manual
  needs:
    - test:unit
    - test:integration
    - test:e2e
    - security:sast
```

### 8.2 Deployment-Scripts

**deploy-to-production.sh:**
```bash
#!/bin/bash
set -euo pipefail

SERVICE_NAME="crm"
CONTAINER_ID=101
BACKUP_DIR="/backup/pre-deployment"
DEPLOYMENT_DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment of $SERVICE_NAME to production..."

# 1. Pre-deployment checks
echo "📋 Running pre-deployment checks..."
./scripts/pre-deployment-checks.sh || exit 1

# 2. Create backup
echo "💾 Creating backup..."
vzdump $CONTAINER_ID --compress zstd --mode snapshot --dumpdir $BACKUP_DIR
BACKUP_FILE=$(ls -t $BACKUP_DIR/vzdump-lxc-$CONTAINER_ID-* | head -1)
echo "✅ Backup created: $BACKUP_FILE"

# 3. Stop service
echo "⏸️  Stopping service..."
pct exec $CONTAINER_ID -- systemctl stop psa.service

# 4. Deploy new version
echo "📦 Deploying new version..."
pct exec $CONTAINER_ID -- bash -c "
    cd /opt/psa
    git fetch origin
    git checkout $CI_COMMIT_SHA
    npm ci --production
    npm run db:migrate
"

# 5. Start service
echo "▶️  Starting service..."
pct exec $CONTAINER_ID -- systemctl start psa.service

# 6. Health check
echo "🏥 Running health checks..."
sleep 10
for i in {1..30}; do
    if curl -f http://10.0.10.11:3000/health > /dev/null 2>&1; then
        echo "✅ Service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        echo "🔄 Rolling back..."
        pct exec $CONTAINER_ID -- systemctl stop psa.service
        pct restore $CONTAINER_ID $BACKUP_FILE --force
        pct start $CONTAINER_ID
        exit 1
    fi
    echo "Waiting for service to be healthy... ($i/30)"
    sleep 2
done

# 7. Smoke tests
echo "🧪 Running smoke tests..."
./scripts/smoke-tests.sh || {
    echo "❌ Smoke tests failed, rolling back..."
    pct exec $CONTAINER_ID -- systemctl stop psa.service
    pct restore $CONTAINER_ID $BACKUP_FILE --force
    pct start $CONTAINER_ID
    exit 1
}

# 8. Cleanup old backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "vzdump-lxc-$CONTAINER_ID-*" -mtime +7 -delete

echo "✅ Deployment completed successfully!"
echo "📊 Deployment summary:"
echo "  - Service: $SERVICE_NAME"
echo "  - Container: $CONTAINER_ID"
echo "  - Commit: $CI_COMMIT_SHA"
echo "  - Backup: $BACKUP_FILE"
echo "  - Date: $DEPLOYMENT_DATE"

# 9. Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    -H 'Content-Type: application/json' \
    -d "{
        \"text\": \"✅ Deployment successful: $SERVICE_NAME @ $CI_COMMIT_SHA\",
        \"attachments\": [{
            \"color\": \"good\",
            \"fields\": [
                {\"title\": \"Service\", \"value\": \"$SERVICE_NAME\", \"short\": true},
                {\"title\": \"Commit\", \"value\": \"$CI_COMMIT_SHA\", \"short\": true},
                {\"title\": \"Date\", \"value\": \"$DEPLOYMENT_DATE\", \"short\": true}
            ]
        }]
    }"
```

---

## 9. MONITORING & LOGGING (DETAILLIERT)

### 9.1 Prometheus-Metriken

**Custom-Metriken-Export:**
```typescript
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Active tickets gauge
const activeTicketsGauge = new Gauge({
  name: 'active_tickets_total',
  help: 'Number of active tickets',
  labelNames: ['status', 'priority'],
});

// Database connections
const dbConnectionsGauge = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

// Middleware for metrics
export function prometheusMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Update custom metrics periodically
setInterval(async () => {
  const stats = await getTicketStats();
  
  for (const status of ['new', 'assigned', 'in_progress']) {
    for (const priority of ['low', 'medium', 'high', 'critical']) {
      activeTicketsGauge.set(
        { status, priority },
        stats[status]?.[priority] || 0
      );
    }
  }
  
  const dbStats = await getDbConnectionStats();
  dbConnectionsGauge.set(dbStats.active);
}, 60000); // Every minute
```

### 9.2 Grafana-Dashboards

**API-Performance-Dashboard.json:**
```json
{
  "dashboard": {
    "title": "PSA Platform - API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Tickets",
        "targets": [
          {
            "expr": "active_tickets_total",
            "legendFormat": "{{status}} - {{priority}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### 9.3 ELK-Stack-Konfiguration

**Logstash-Pipeline (logstash.conf):**
```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "psa-api" {
    json {
      source => "message"
    }
    
    # Parse timestamp
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    # Add geo-location for IP
    geoip {
      source => "ip_address"
    }
    
    # Classify log level
    if [level] == "ERROR" or [level] == "FATAL" {
      mutate {
        add_tag => [ "alert" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "psa-logs-%{+YYYY.MM.dd}"
    user => "elastic"
    password => "${ELASTICSEARCH_PASSWORD}"
  }
}
```

**Filebeat-Configuration (filebeat.yml):**
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/psa/*.log
    fields:
      service: psa-api
      environment: production
    json.keys_under_root: true
    json.add_error_key: true

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
```

### 9.4 Alerting-Rules

**Prometheus-Alert-Rules (alerts.yml):**
```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.route }}"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s for {{ $labels.route }}"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: database_connections_active / database_connections_max > 0.9
        for: 5m
        labels:
          severity: critical
          team: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

      # Container down
      - alert: ContainerDown
        expr: up{job="psa-services"} == 0
        for: 2m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Container {{ $labels.instance }} is down"
          description: "Container has been down for more than 2 minutes"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 10m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

**AlertManager-Configuration (alertmanager.yml):**
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
  
  - name: 'critical-alerts'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
  
  - name: 'warning-alerts'
    slack_configs:
      - channel: '#warnings'
        title: '⚠️  WARNING: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## 10. BACKUP & DISASTER-RECOVERY

### 10.1 Backup-Strategie (GFS-Schema)

**Grandfather-Father-Son (GFS):**
```
Grandfather (Monthly)
├── Retention: 12 Monate
├── Schedule: 1. Sonntag im Monat, 02:00 Uhr
└── Storage: Offsite/Cloud

Father (Weekly)
├── Retention: 4 Wochen
├── Schedule: Jeden Sonntag, 02:00 Uhr
└── Storage: Onsite (Separate NAS)

Son (Daily)
├── Retention: 7 Tage
├── Schedule: Täglich, 02:00 Uhr
└── Storage: Local (Proxmox Storage)
```

**Backup-Script (backup-all.sh):**
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d)
DOW=$(date +%u) # 1=Monday, 7=Sunday
DOM=$(date +%d)

# Determine backup type
if [ "$DOM" -le 7 ] && [ "$DOW" -eq 7 ]; then
    BACKUP_TYPE="grandfather"
    RETENTION_DAYS=365
elif [ "$DOW" -eq 7 ]; then
    BACKUP_TYPE="father"
    RETENTION_DAYS=28
else
    BACKUP_TYPE="son"
    RETENTION_DAYS=7
fi

echo "🔄 Starting $BACKUP_TYPE backup ($DATE)..."

# 1. Backup LXC containers
echo "📦 Backing up containers..."
for CT_ID in 101 102 103 104 105 110 111 112; do
    echo "  - Container $CT_ID"
    vzdump $CT_ID \
        --compress zstd \
        --mode snapshot \
        --dumpdir "$BACKUP_DIR/containers/$BACKUP_TYPE" \
        --quiet
done

# 2. Backup PostgreSQL
echo "💾 Backing up PostgreSQL..."
pct exec 110 -- sudo -u postgres pg_dumpall | \
    zstd > "$BACKUP_DIR/database/$BACKUP_TYPE/postgresql-$DATE.sql.zst"

# 3. Backup Redis
echo "💾 Backing up Redis..."
pct exec 112 -- redis-cli --rdb /tmp/dump.rdb
pct exec 112 -- cat /tmp/dump.rdb | \
    zstd > "$BACKUP_DIR/redis/$BACKUP_TYPE/redis-$DATE.rdb.zst"

# 4. Backup Configs
echo "📝 Backing up configs..."
tar -czf "$BACKUP_DIR/configs/$BACKUP_TYPE/configs-$DATE.tar.gz" \
    /etc/pve \
    /etc/haproxy \
    /etc/pfsense

# 5. Backup Application Code (Git)
echo "📂 Backing up application repos..."
for SERVICE in crm ticketing billing projects; do
    pct exec 10$((${#SERVICE})) -- bash -c "
        cd /opt/psa
        git bundle create /tmp/$SERVICE-$DATE.bundle --all
    "
    pct exec 10$((${#SERVICE})) -- cat /tmp/$SERVICE-$DATE.bundle | \
        zstd > "$BACKUP_DIR/repos/$BACKUP_TYPE/$SERVICE-$DATE.bundle.zst"
done

# 6. Cleanup old backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR/containers/$BACKUP_TYPE" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/database/$BACKUP_TYPE" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/redis/$BACKUP_TYPE" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/configs/$BACKUP_TYPE" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/repos/$BACKUP_TYPE" -mtime +$RETENTION_DAYS -delete

# 7. Verify backups
echo "✅ Verifying backups..."
for FILE in "$BACKUP_DIR"/**/$BACKUP_TYPE/*-$DATE.*; do
    if [ -f "$FILE" ]; then
        if ! zstd -t "$FILE" 2>/dev/null; then
            echo "❌ Backup verification failed: $FILE"
            exit 1
        fi
    fi
done

# 8. Upload to offsite (if grandfather)
if [ "$BACKUP_TYPE" = "grandfather" ]; then
    echo "☁️  Uploading to offsite storage..."
    rclone sync "$BACKUP_DIR" "s3:psa-backups-offsite/" --progress
fi

echo "✅ Backup completed successfully!"
echo "📊 Backup summary:"
du -sh "$BACKUP_DIR"/*/$BACKUP_TYPE
```

### 10.2 Disaster-Recovery-Prozess

**DR-Playbook:**
```markdown
# Disaster Recovery Playbook

## Scenario 1: Single Container Failure

1. **Identify failed container**
   ```bash
   pct list | grep stopped
   ```

2. **Check logs**
   ```bash
   journalctl -u pct@101.service -n 100
   ```

3. **Attempt restart**
   ```bash
   pct start 101
   ```

4. **If restart fails, restore from backup**
   ```bash
   LATEST_BACKUP=$(ls -t /backup/containers/son/vzdump-lxc-101-* | head -1)
   pct restore 101 $LATEST_BACKUP --force
   pct start 101
   ```

5. **Verify service**
   ```bash
   curl http://10.0.10.11:3000/health
   ```

## Scenario 2: Database Corruption

1. **Stop all services**
   ```bash
   for CT in 101 102 103 104 105; do pct exec $CT -- systemctl stop psa.service; done
   ```

2. **Stop database**
   ```bash
   pct exec 110 -- systemctl stop postgresql
   ```

3. **Restore database backup**
   ```bash
   LATEST_DB_BACKUP=$(ls -t /backup/database/son/postgresql-*.sql.zst | head -1)
   zstd -d $LATEST_DB_BACKUP | pct exec 110 -- sudo -u postgres psql
   ```

4. **Start database**
   ```bash
   pct exec 110 -- systemctl start postgresql
   ```

5. **Start services**
   ```bash
   for CT in 101 102 103 104 105; do pct exec $CT -- systemctl start psa.service; done
   ```

6. **Verify all services**
   ```bash
   ./scripts/health-check-all.sh
   ```

## Scenario 3: Complete Node Failure

1. **Identify failed node**
   ```bash
   pvecm status
   ```

2. **Migrate containers to healthy nodes**
   ```bash
   pct migrate 101 pve02 --online
   pct migrate 102 pve02 --online
   pct migrate 103 pve03 --online
   ```

3. **Update load balancer**
   ```bash
   # Update HAProxy backend IPs
   vim /etc/haproxy/haproxy.cfg
   systemctl reload haproxy
   ```

4. **Investigate failed node**
   ```bash
   ssh pve01
   # Check logs, hardware, etc.
   ```

5. **Repair and re-add node to cluster**
   ```bash
   pvecm add pve01
   ```

## Scenario 4: Complete Cluster Failure (DR)

**RTO: 2 Hours | RPO: 4 Hours**

1. **Activate DR site**
   - Power on DR Proxmox cluster
   - Restore network connectivity

2. **Restore from offsite backups**
   ```bash
   rclone sync "s3:psa-backups-offsite/" /backup/ --progress
   ```

3. **Restore containers**
   ```bash
   for BACKUP in /backup/containers/grandfather/*; do
     CT_ID=$(echo $BACKUP | grep -oP '(?<=lxc-)\d+')
     pct restore $CT_ID $BACKUP
     pct start $CT_ID
   done
   ```

4. **Restore database**
   ```bash
   LATEST_DB=$(ls -t /backup/database/grandfather/*.sql.zst | head -1)
   zstd -d $LATEST_DB | pct exec 110 -- sudo -u postgres psql
   ```

5. **Update DNS records**
   ```bash
   # Point api.psa-platform.example.com to DR IP
   ```

6. **Verify all services**
   ```bash
   ./scripts/health-check-all.sh
   ```

7. **Notify team and customers**
   ```bash
   ./scripts/notify-dr-activation.sh
   ```
```

### 10.3 Backup-Verification

**Automated Restore-Test:**
```bash
#!/bin/bash
# restore-test.sh - Run monthly

echo "🧪 Starting automated restore test..."

TEST_CT_ID=900
TEST_BACKUP=$(ls -t /backup/containers/father/vzdump-lxc-101-* | head -1)

# 1. Restore to test container
pct restore $TEST_CT_ID $TEST_BACKUP --force

# 2. Start container
pct start $TEST_CT_ID

# 3. Wait for boot
sleep 30

# 4. Test service
if pct exec $TEST_CT_ID -- systemctl is-active psa.service; then
    echo "✅ Service is active"
else
    echo "❌ Service failed to start"
    exit 1
fi

# 5. Test database connectivity
if pct exec $TEST_CT_ID -- curl -f http://localhost:3000/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# 6. Cleanup
pct stop $TEST_CT_ID
pct destroy $TEST_CT_ID

echo "✅ Restore test completed successfully!"
```

---

## 11. PERFORMANCE-OPTIMIERUNG

### 11.1 Database-Performance

**PostgreSQL-Tuning:**
```sql
-- Analyze slow queries
SELECT 
    pid,
    now() - query_start as duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;

-- Find missing indexes
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND seq_tup_read / seq_scan > 10000
ORDER BY seq_tup_read DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Vacuum analysis
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

**Connection-Pooling (PgBouncer):**
```ini
[databases]
psa_platform = host=10.0.30.10 port=5432 dbname=psa_platform

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3

# Connection limits
max_db_connections = 100
max_user_connections = 100

# Timeouts
server_lifetime = 3600
server_idle_timeout = 600
```

### 11.2 Caching-Strategie

**Redis-Caching-Layer:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: '10.0.30.12',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'psa:',
});

// Cache decorator
function Cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    };

    return descriptor;
  };
}

// Usage
class CustomersService {
  @Cacheable(600) // 10 minutes
  async findOne(id: string): Promise<Customer> {
    return this.customersRepo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const result = await this.customersRepo.update(id, dto);
    
    // Invalidate cache
    await redis.del(`findOne:["${id}"]`);
    
    return result;
  }
}
```

**HTTP-Caching-Headers:**
```typescript
@Controller('customers')
export class CustomersController {
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=300') // 5 minutes
  @Header('ETag', '')
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);
    return customer;
  }

  @Get(':id/stats')
  @Header('Cache-Control', 'private, max-age=60') // 1 minute
  async getStats(@Param('id') id: string) {
    const stats = await this.customersService.getStats(id);
    return stats;
  }
}
```

### 11.3 Frontend-Performance

**Code-Splitting:**
```typescript
// Lazy-load routes
const TicketList = lazy(() => import('./pages/TicketList'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const CustomerList = lazy(() => import('./pages/CustomerList'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/customers" element={<CustomerList />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

**React-Query-Optimierung:**
```typescript
// Prefetch data
const queryClient = useQueryClient();

function CustomerRow({ customer }) {
  return (
    <tr
      onMouseEnter={() => {
        // Prefetch customer details on hover
        queryClient.prefetchQuery({
          queryKey: ['customer', customer.id],
          queryFn: () => api.get(`/customers/${customer.id}`),
        });
      }}
    >
      <td>{customer.name}</td>
    </tr>
  );
}
```

**Image-Optimization:**
```typescript
import Image from 'next/image';

function Avatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

---

## 12. SKALIERUNGS-STRATEGIE

### 12.1 Horizontal-Scaling

**Service-Replikation:**
```bash
# Replicate API Gateway
pct clone 100 120 --hostname psa-api-gateway-2
pct set 120 --net0 name=eth0,bridge=vmbr1,ip=10.0.10.20/24
pct start 120

# Update HAProxy
cat >> /etc/haproxy/haproxy.cfg <<EOF
    server api-gw-2 10.0.10.20:3000 check inter 10s
EOF

systemctl reload haproxy
```

**Database-Read-Replicas:**
```bash
# Setup PostgreSQL Streaming Replication
# On Master (10.0.30.10)
cat >> /etc/postgresql/15/main/postgresql.conf <<EOF
wal_level = replica
max_wal_senders = 3
EOF

cat >> /etc/postgresql/15/main/pg_hba.conf <<EOF
host replication replicator 10.0.30.11/32 md5
EOF

systemctl restart postgresql

# On Replica (10.0.30.11)
pg_basebackup -h 10.0.30.10 -D /var/lib/postgresql/15/main -U replicator -P -v -R -X stream -C -S replica1

systemctl start postgresql
```

**Application-Load-Balancing:**
```typescript
// Connection pooling with read replicas
const masterPool = new Pool({
  host: '10.0.30.10',
  database: 'psa_platform',
  max: 20,
});

const replicaPool = new Pool({
  host: '10.0.30.11',
  database: 'psa_platform',
  max: 50, // More connections for read-only
});

// Read-write splitting
async function query(sql: string, params: any[], readonly = false) {
  const pool = readonly ? replicaPool : masterPool;
  return pool.query(sql, params);
}

// Usage
const customers = await query('SELECT * FROM customers', [], true); // Read from replica
await query('INSERT INTO customers ...', [data], false); // Write to master
```

### 12.2 Vertical-Scaling

**Resource-Anpassung:**
```bash
# Increase CPU
pct set 101 --cores 4

# Increase RAM
pct set 101 --memory 8192

# Increase Disk
lvextend -L +20G /dev/pve/vm-101-disk-0
pct exec 101 -- resize2fs /dev/sda1

# Apply changes
pct shutdown 101
pct start 101
```

### 12.3 Auto-Scaling (Zukunft)

**Auto-Scaling-Konzept:**
```yaml
# Hypothetical auto-scaling configuration
apiVersion: v1
kind: AutoScaler
metadata:
  name: psa-crm-autoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  scaleUpPolicy:
    stabilizationWindowSeconds: 60
    policies:
      - type: Percent
        value: 50
        periodSeconds: 60
  scaleDownPolicy:
    stabilizationWindowSeconds: 300
    policies:
      - type: Percent
        value: 25
        periodSeconds: 60
```

---

## 13. CODE-ORGANISATION & STANDARDS

### 13.1 Monorepo-Struktur

```
psa-platform/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── crm/
│   ├── ticketing/
│   ├── billing/
│   └── web/           # Frontend
├── libs/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── dto/
│   │   │   ├── interfaces/
│   │   │   └── utils/
│   │   └── package.json
│   ├── database/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── package.json
│   └── auth/
│       ├── src/
│       │   ├── guards/
│       │   ├── decorators/
│       │   └── strategies/
│       └── package.json
├── tools/
│   ├── scripts/
│   └── generators/
├── docs/
│   ├── api/
│   ├── architecture/
│   └── deployment/
├── .github/
│   └── workflows/
├── package.json
├── tsconfig.base.json
├── nx.json
└── README.md
```

### 13.2 Coding-Standards

**ESLint-Configuration (.eslintrc.json):**
```json
{
  "extends": [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "max-lines-per-function": ["warn", 50],
    "complexity": ["warn", 10],
    "no-console": "warn"
  }
}
```

**Prettier-Configuration (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**TypeScript-Configuration (tsconfig.base.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@psa/shared": ["libs/shared/src"],
      "@psa/database": ["libs/database/src"],
      "@psa/auth": ["libs/auth/src"]
    }
  }
}
```

### 13.3 Git-Workflow

**Branch-Strategy:**
```
main (production)
  ↑
develop (staging)
  ↑
feature/TICKET-123-add-new-feature
bugfix/TICKET-456-fix-login-issue
hotfix/critical-security-patch
```

**Commit-Message-Convention:**
```
<type>(<scope>): <subject>

<body>

<footer>

Types: feat, fix, docs, style, refactor, perf, test, chore
Scope: crm, ticketing, billing, etc.

Examples:
feat(ticketing): add SLA breach notifications
fix(auth): prevent token refresh race condition
docs(api): update authentication endpoints
```

**Pre-Commit-Hook (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm run test:affected
```

---

## 14. TESTING-STRATEGIE

### 14.1 Test-Pyramid

```
           ╱╲
          ╱E2E╲         10% - Playwright
         ╱━━━━━╲
        ╱Integration╲    30% - Supertest
       ╱━━━━━━━━━━━╲
      ╱   Unit Tests  ╲  60% - Jest
     ╱━━━━━━━━━━━━━━━╲
```

### 14.2 Unit-Tests (Jest)

**Example: TicketsService.spec.ts**
```typescript
describe('TicketsService', () => {
  let service: TicketsService;
  let repository: MockRepository<Ticket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    repository = module.get(getRepositoryToken(Ticket));
  });

  describe('create', () => {
    it('should create a ticket with valid data', async () => {
      const createDto: CreateTicketDto = {
        title: 'Network issue',
        description: 'Cannot connect to printer',
        customer_id: 'uuid',
        priority: Priority.HIGH,
      };

      const expectedTicket = {
        id: 'uuid',
        ticket_number: 1234,
        ...createDto,
        status: TicketStatus.NEW,
      };

      repository.create.mockReturnValue(expectedTicket);
      repository.save.mockResolvedValue(expectedTicket);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(expectedTicket);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          status: TicketStatus.NEW,
        })
      );
    });

    it('should throw error for invalid customer', async () => {
      const createDto: CreateTicketDto = {
        title: 'Test',
        description: 'Test',
        customer_id: 'invalid',
        priority: Priority.LOW,
      };

      repository.save.mockRejectedValue(new Error('Customer not found'));

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        'Customer not found'
      );
    });
  });
});
```

### 14.3 Integration-Tests

**Example: tickets.e2e-spec.ts**
```typescript
describe('Tickets API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tickets', () => {
    it('should create a ticket', async () => {
      const createDto = {
        title: 'Test ticket',
        description: 'This is a test',
        customer_id: 'uuid',
        priority: 'high',
      };

      return request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createDto.title);
          expect(res.body.status).toBe('new');
        });
    });

    it('should return 400 for invalid data', async () => {
      return request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'T' }) // Too short
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    it('should return 401 without auth', async () => {
      return request(app.getHttpServer())
        .post('/tickets')
        .send({ title: 'Test' })
        .expect(401);
    });
  });
});
```

### 14.4 E2E-Tests (Playwright)

**Example: tickets.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/tickets');
    await page.click('button:has-text("New Ticket")');

    await page.fill('[name="title"]', 'Network issue');
    await page.fill('[name="description"]', 'Cannot connect to printer');
    await page.selectOption('[name="priority"]', 'high');
    
    await page.click('button:has-text("Create")');

    await expect(page.locator('.toast-success')).toContainText(
      'Ticket created successfully'
    );
    
    await expect(page).toHaveURL(/\/tickets\/\d+/);
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/tickets');
    
    await page.selectOption('[name="status"]', 'open');
    await page.waitForLoadState('networkidle');

    const tickets = page.locator('.ticket-row');
    const count = await tickets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const status = await tickets.nth(i).locator('.status-badge').textContent();
      expect(status).toContain('Open');
    }
  });
});
```

---

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
