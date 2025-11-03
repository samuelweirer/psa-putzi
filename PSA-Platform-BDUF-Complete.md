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

Diese Datei ist bereits sehr lang. Soll ich sie jetzt speichern und dann eine zweite Datei mit dem Rest des BDUF erstellen?