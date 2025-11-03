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

### 2.1 Backend-Stack

**Node.js 20 LTS + TypeScript 5.x**

**Vorteile:**
✅ Non-blocking I/O für hohen Durchsatz
✅ JavaScript/TypeScript auf Frontend + Backend
✅ Große NPM-Ecosystem
✅ Gute Performance für I/O-intensive Apps
✅ Starke Community

**Framework: NestJS 10.x**

Beispiel Controller:
```typescript
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tickets' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query() query: ListTicketsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<TicketDto>> {
    return this.ticketsService.findAll(query, req.user);
  }

  @Post()
  @Roles(Role.Technician, Role.ServiceManager)
  @ApiOperation({ summary: 'Create ticket' })
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
    });
    
    return ticket;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketDto,
  ): Promise<TicketDto> {
    return this.ticketsService.update(id, updateDto);
  }
}
```

**ORM: TypeORM 0.3.x**

Entity-Beispiel:
```typescript
@Entity('tickets')
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

  @Column({ type: 'timestamp', nullable: true })
  sla_response_due: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sla_resolution_due: Date | null;

  @Column({ type: 'boolean', default: false })
  sla_breached: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Computed properties
  get isOverdue(): boolean {
    if (!this.sla_resolution_due) return false;
    return new Date() > this.sla_resolution_due;
  }
}
```

**Service-Layer:**
```typescript
@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepo: Repository<Ticket>,
    private readonly slaService: SlaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateTicketDto,
    user: User,
  ): Promise<Ticket> {
    // Create ticket
    const ticket = this.ticketsRepo.create({
      ...dto,
      status: TicketStatus.NEW,
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

    // Save to database
    const saved = await this.ticketsRepo.save(ticket);

    // Send notification
    await this.notificationService.notifyTicketCreated(saved);

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

    // Apply RBAC
    if (user.role === Role.Technician) {
      qb.andWhere('ticket.assigned_to = :userId', { userId: user.id });
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    // Sorting
    qb.orderBy(`ticket.${query.sort || 'created_at'}`, query.order || 'DESC');

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
```

**Alternative: Python 3.11 + FastAPI** (für KI-Modul)

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import openai

app = FastAPI()

class TicketAnalysisRequest(BaseModel):
    ticket_id: str
    title: str
    description: str

class TicketAnalysisResponse(BaseModel):
    suggested_category: str
    suggested_priority: str
    similar_tickets: List[str]
    solution_suggestions: List[str]
    confidence: float

@app.post("/ai/analyze-ticket", response_model=TicketAnalysisResponse)
async def analyze_ticket(
    request: TicketAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    # Use LLM for analysis
    prompt = f"""
    Analyze this support ticket:
    Title: {request.title}
    Description: {request.description}
    
    Provide:
    1. Suggested category
    2. Suggested priority (low/medium/high/critical)
    3. Similar past tickets
    4. Solution suggestions
    """
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse and return
    return TicketAnalysisResponse(
        suggested_category="network",
        suggested_priority="high",
        similar_tickets=["T-2025-00123", "T-2025-00145"],
        solution_suggestions=["Check network cables", "Restart switch"],
        confidence=0.85
    )
```

### 2.2 Frontend-Stack

**React 18 + TypeScript**

Komponenten-Beispiel:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketStore } from '@/stores/ticketStore';

interface TicketListProps {
  customerId?: string;
}

export function TicketList({ customerId }: TicketListProps) {
  const queryClient = useQueryClient();
  
  // Fetch tickets
  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', { customerId }],
    queryFn: () => api.get('/tickets', { params: { customer_id: customerId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: (ticket: CreateTicketDto) => api.post('/tickets', ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create ticket');
    },
  });

  if (isLoading) return <TicketListSkeleton />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tickets</h2>
        <Button onClick={() => setCreateModalOpen(true)}>
          New Ticket
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.data.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <Pagination meta={data?.meta} />
    </div>
  );
}
```

**State-Management: Zustand**
```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface TicketStore {
  filters: TicketFilters;
  selectedTicket: Ticket | null;
  setFilters: (filters: Partial<TicketFilters>) => void;
  selectTicket: (ticket: Ticket | null) => void;
  clearFilters: () => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      filters: {
        status: undefined,
        priority: undefined,
        customer_id: undefined,
      },
      selectedTicket: null,
      
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      
      selectTicket: (ticket) => set({ selectedTicket: ticket }),
      
      clearFilters: () =>
        set({
          filters: {
            status: undefined,
            priority: undefined,
            customer_id: undefined,
          },
        }),
    }),
    {
      name: 'ticket-storage',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
```

**UI-Components: Tailwind + Headless UI**
```typescript
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export function TicketDialog({ isOpen, onClose, ticket }: TicketDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                  {ticket.title}
                </Dialog.Title>
                
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  
                  <div className="prose max-w-none">
                    <p>{ticket.description}</p>
                  </div>
                  
                  <TicketTimeline ticketId={ticket.id} />
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={() => handleAssignToMe(ticket.id)}>
                    Assign to Me
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 2.3 Datenbank-Stack

**PostgreSQL 15+**

postgresql.conf:
```ini
# Connection Settings
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 20MB

# WAL Settings
wal_level = replica
max_wal_size = 2GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 10s

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_duration = off
log_lock_waits = on
log_statement = 'ddl'
log_temp_files = 0
```

**Redis 7.x**

redis.conf:
```ini
# Memory
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300

# Security
requirepass <strong-password>
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

**Elasticsearch 8.x**

elasticsearch.yml:
```yaml
cluster.name: psa-platform
node.name: es-node-1

path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

network.host: 10.0.30.20
http.port: 9200

discovery.seed_hosts: ["10.0.30.20", "10.0.30.21"]
cluster.initial_master_nodes: ["es-node-1"]

xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

### 2.4 Message-Queue

**RabbitMQ 3.12+**

Exchange & Queue Setup:
```typescript
import amqp from 'amqplib';

export class RabbitMQSetup {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async initialize() {
    // Connect
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();

    // Declare exchange
    await this.channel.assertExchange('psa.events', 'topic', {
      durable: true,
    });

    // Declare queues
    const queues = [
      'notifications.email',
      'notifications.teams',
      'analytics.ticket_stats',
      'billing.datev_export',
      'search.index_update',
    ];

    for (const queue of queues) {
      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000,
        },
      });
    }

    // Bind queues to exchange
    await this.channel.bindQueue(
      'notifications.email',
      'psa.events',
      'ticket.*'
    );
    await this.channel.bindQueue(
      'notifications.teams',
      'psa.events',
      'ticket.created'
    );
    await this.channel.bindQueue(
      'analytics.ticket_stats',
      'psa.events',
      'ticket.*'
    );
    await this.channel.bindQueue(
      'billing.datev_export',
      'psa.events',
      'invoice.generated'
    );
  }
}
```

Publisher:
```typescript
export class EventPublisher {
  constructor(private channel: amqp.Channel) {}

  async publish(routingKey: string, message: object) {
    const content = Buffer.from(JSON.stringify(message));
    
    this.channel.publish('psa.events', routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: uuidv4(),
    });
  }
}

// Usage
await eventPublisher.publish('ticket.created', {
  ticketId: ticket.id,
  customerId: ticket.customer_id,
  priority: ticket.priority,
  timestamp: new Date().toISOString(),
});
```

Consumer:
```typescript
export class EmailNotificationConsumer {
  constructor(private channel: amqp.Channel) {}

  async consume() {
    await this.channel.consume(
      'notifications.email',
      async (msg) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString());
          await this.processEvent(event);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Failed to process message:', error);
          // Requeue with delay
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }

  private async processEvent(event: any) {
    // Send email notification
    await emailService.send({
      to: event.recipient,
      subject: `New Ticket: ${event.title}`,
      template: 'ticket-created',
      data: event,
    });
  }
}
```

---

## 3. DATENMODELL & DATENBANK-DESIGN

### 3.1 Vollständiges ER-Diagramm

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Customer    │1   N│   Contact    │     │   Location   │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ customer_id  │     │ customer_id  │
│ uid          │     │ first_name   │     │ address      │
│ tier         │     │ last_name    │     │ city         │
└──────┬───────┘     │ email        │     └──────────────┘
       │             │ is_primary   │
       │             └──────────────┘
       │1
       │
       │N
┌──────▼───────┐     ┌──────────────┐     ┌──────────────┐
│   Ticket     │N   1│     User     │     │   Comment    │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ ticket_number│     │ email        │     │ ticket_id    │
│ customer_id  │     │ role         │     │ user_id      │
│ assigned_to  │     │ hourly_rate  │     │ content      │
│ title        │     └──────────────┘     └──────────────┘
│ description  │
│ status       │
│ priority     │     ┌──────────────┐
└──────┬───────┘     │  TimeEntry   │
       │1            │──────────────│
       │             │ id (PK)      │
       │N            │ ticket_id    │
       └─────────────│ user_id      │
                     │ hours        │
                     │ billable     │
                     │ billed       │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Contract   │1   N│   Invoice    │     │InvoiceItem   │
│──────────────│─────│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ customer_id  │     │ contract_id  │     │ invoice_id   │
│ type         │     │ invoice_number│    │ description  │
│ start_date   │     │ amount       │     │ quantity     │
│ end_date     │     │ status       │     │ unit_price   │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐
│    Asset     │     │    License   │
│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │
│ customer_id  │     │ asset_id     │
│ name         │     │ license_key  │
│ type         │     │ valid_until  │
│ serial       │     │ quantity     │
│ purchase_date│     └──────────────┘
└──────────────┘
```

### 3.2 Kern-Tabellen (SQL)

**customers:**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    uid VARCHAR(20), -- Umsatzsteuer-ID
    tax_number VARCHAR(50),
    
    -- Classification
    industry VARCHAR(100),
    employee_count INTEGER,
    tier VARCHAR(20) CHECK (tier IN ('A', 'B', 'C')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'prospect', 'churned')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT customers_name_unique UNIQUE(name) 
        WHERE deleted_at IS NULL
);

CREATE INDEX idx_customers_status ON customers(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_uid ON customers(uid) 
    WHERE uid IS NOT NULL;
```

**tickets:**
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number SERIAL UNIQUE NOT NULL,
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    status VARCHAR(20) DEFAULT 'new' NOT NULL
        CHECK (status IN ('new', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' NOT NULL
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50),
    tags TEXT[],
    
    -- Source
    source VARCHAR(20) NOT NULL
        CHECK (source IN ('email', 'portal', 'phone', 'rmm_alert', 'api')),
    source_reference VARCHAR(200), -- E.g., email message-id
    
    -- SLA
    sla_response_due TIMESTAMP,
    sla_resolution_due TIMESTAMP,
    sla_breached BOOLEAN DEFAULT false,
    
    -- Lifecycle
    first_response_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('german', 
            coalesce(title, '') || ' ' || 
            coalesce(description, '') || ' ' ||
            coalesce(array_to_string(tags, ' '), '')
        )
    ) STORED
);

-- Indexes
CREATE INDEX idx_tickets_customer ON tickets(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to) 
    WHERE deleted_at IS NULL AND status NOT IN ('closed');
CREATE INDEX idx_tickets_status ON tickets(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX idx_tickets_search ON tickets USING GIN(search_vector);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_response_due, sla_resolution_due) 
    WHERE status NOT IN ('closed') AND deleted_at IS NULL;

-- Partial indexes for performance
CREATE INDEX idx_tickets_open ON tickets(customer_id, priority) 
    WHERE status IN ('new', 'assigned', 'in_progress') 
    AND deleted_at IS NULL;
```

**time_entries:**
```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations (either ticket or project)
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Content
    description TEXT,
    notes TEXT, -- Internal notes
    
    -- Time
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Billing
    billable BOOLEAN DEFAULT true NOT NULL,
    billed BOOLEAN DEFAULT false NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    hourly_rate DECIMAL(8,2), -- Snapshot of rate at time of entry
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT time_entry_reference CHECK (
        (ticket_id IS NOT NULL AND project_id IS NULL) OR
        (ticket_id IS NULL AND project_id IS NOT NULL)
    ),
    CONSTRAINT time_entry_hours_check CHECK (
        hours > 0 AND hours <= 24
    )
);

-- Indexes
CREATE INDEX idx_time_entries_ticket ON time_entries(ticket_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX idx_time_entries_unbilled ON time_entries(user_id, date) 
    WHERE billable = true AND billed = false;

-- Prevent overlapping time entries
CREATE UNIQUE INDEX idx_time_entries_no_overlap 
    ON time_entries(user_id, date, ticket_id, project_id) 
    WHERE ticket_id IS NOT NULL OR project_id IS NOT NULL;
```

**users:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if SSO only
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Role & Permissions
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'system_admin', 'tenant_admin', 'security_admin',
        'service_manager', 
        'technician_l3', 'technician_l2', 'technician_l1',
        'account_manager', 'project_manager', 'billing_manager',
        'customer_admin', 'customer_technician', 'customer_user'
    )),
    permissions JSONB, -- Additional granular permissions
    
    -- Settings
    hourly_rate DECIMAL(8,2),
    language VARCHAR(5) DEFAULT 'de',
    timezone VARCHAR(50) DEFAULT 'Europe/Vienna',
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT false NOT NULL,
    mfa_secret VARCHAR(100),
    mfa_recovery_codes TEXT[],
    
    -- SSO
    sso_provider VARCHAR(50), -- 'azure_ad', 'google', etc.
    sso_identifier VARCHAR(200),
    
    -- Security
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(lower(email)) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_sso ON users(sso_provider, sso_identifier) 
    WHERE sso_provider IS NOT NULL;
```

**audit_log:**
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    
    -- Who
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(200),
    user_role VARCHAR(50),
    
    -- Changes
    changes JSONB, -- { "old": {...}, "new": {...} }
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- When
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE audit_log_y2025m11 PARTITION OF audit_log
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_log_y2025m12 PARTITION OF audit_log
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes on partitions
CREATE INDEX idx_audit_entity_2025m11 ON audit_log_y2025m11(entity_type, entity_id);
CREATE INDEX idx_audit_user_2025m11 ON audit_log_y2025m11(user_id);
CREATE INDEX idx_audit_created_2025m11 ON audit_log_y2025m11(created_at);
```

### 3.3 Datenbank-Optimierungen

**Materialized Views:**
```sql
-- Customer Statistics
CREATE MATERIALIZED VIEW mv_customer_stats AS
SELECT 
    c.id AS customer_id,
    c.name,
    COUNT(DISTINCT t.id) AS total_tickets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('new', 'assigned', 'in_progress')) AS open_tickets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.sla_breached = true) AS sla_breached_tickets,
    AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600) 
        FILTER (WHERE t.resolved_at IS NOT NULL) AS avg_resolution_hours,
    SUM(te.hours) FILTER (WHERE te.date >= NOW() - INTERVAL '30 days') AS hours_last_30_days,
    SUM(te.hours * te.hourly_rate) FILTER (WHERE te.date >= NOW() - INTERVAL '30 days') AS revenue_last_30_days
FROM customers c
LEFT JOIN tickets t ON t.customer_id = c.id
LEFT JOIN time_entries te ON te.ticket_id = t.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name;

CREATE UNIQUE INDEX ON mv_customer_stats(customer_id);

-- Refresh schedule (via cron or pg_cron)
SELECT cron.schedule('refresh-customer-stats', '0 1 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_stats');
```

**Query-Optimization:**
```sql
-- Explain Analyze Example
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT 
    t.*,
    c.name as customer_name,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM tickets t
LEFT JOIN customers c ON c.id = t.customer_id
LEFT JOIN users u ON u.id = t.assigned_to
WHERE t.status = 'open'
  AND t.priority = 'high'
ORDER BY t.created_at DESC
LIMIT 20;

-- Results should show:
-- - Index Scan on idx_tickets_open
-- - Nested Loop Join
-- - Execution Time < 10ms
```

**Stored Procedures:**
```sql
-- Auto-assign ticket based on technician availability
CREATE OR REPLACE FUNCTION auto_assign_ticket(
    p_ticket_id UUID,
    p_priority VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_assigned_to UUID;
    v_min_open_tickets INTEGER;
BEGIN
    -- Find technician with least open tickets and matching skills
    SELECT u.id INTO v_assigned_to
    FROM users u
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as open_count
        FROM tickets
        WHERE status IN ('new', 'assigned', 'in_progress')
          AND deleted_at IS NULL
        GROUP BY assigned_to
    ) t ON t.assigned_to = u.id
    WHERE u.role LIKE 'technician_%'
      AND u.is_active = true
      AND u.deleted_at IS NULL
    ORDER BY COALESCE(t.open_count, 0) ASC, RANDOM()
    LIMIT 1;
    
    -- Update ticket
    UPDATE tickets
    SET assigned_to = v_assigned_to,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN v_assigned_to;
END;
$$ LANGUAGE plpgsql;
```

**Triggers:**
```sql
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validate SLA dates
CREATE OR REPLACE FUNCTION validate_sla_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_response_due IS NOT NULL 
       AND NEW.sla_resolution_due IS NOT NULL 
       AND NEW.sla_response_due > NEW.sla_resolution_due THEN
        RAISE EXCEPTION 'Response due date must be before resolution due date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ticket_sla
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION validate_sla_dates();
```

**Full-Text Search:**
```sql
-- Search tickets
CREATE OR REPLACE FUNCTION search_tickets(
    p_search_query TEXT,
    p_customer_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    ticket_id UUID,
    ticket_number INTEGER,
    title VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.ticket_number,
        t.title,
        ts_rank(t.search_vector, websearch_to_tsquery('german', p_search_query)) as rank
    FROM tickets t
    WHERE t.search_vector @@ websearch_to_tsquery('german', p_search_query)
      AND (p_customer_id IS NULL OR t.customer_id = p_customer_id)
      AND t.deleted_at IS NULL
    ORDER BY rank DESC, t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM search_tickets('netzwerk drucker problem');
```

### 3.4 Erweiterte Tabellen

**contacts:**
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Position
    title VARCHAR(100), -- Job title
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_technical BOOLEAN DEFAULT false,
    is_billing BOOLEAN DEFAULT false,
    
    -- Notifications
    notify_ticket_created BOOLEAN DEFAULT true,
    notify_ticket_resolved BOOLEAN DEFAULT true,
    notify_invoice BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT contacts_email_format CHECK (
        email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
);

CREATE INDEX idx_contacts_customer ON contacts(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(lower(email)) 
    WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_primary ON contacts(customer_id, is_primary) 
    WHERE is_primary = true AND deleted_at IS NULL;
```

**contracts:**
```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Contract Details
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Type
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'managed_services',
        'project',
        'retainer',
        'time_and_material',
        'fixed_price'
    )),
    
    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    renewal_period VARCHAR(20) CHECK (renewal_period IN ('monthly', 'quarterly', 'yearly')),
    notice_period_days INTEGER,
    
    -- Billing
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    monthly_value DECIMAL(10,2),
    included_hours INTEGER, -- For retainer contracts
    hourly_rate DECIMAL(8,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'expired', 'terminated', 'cancelled'
    )),
    
    -- Documents
    signed_document_url VARCHAR(500),
    signed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contracts_customer ON contracts(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
```

**invoices:**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Invoice Details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- Austria default
    tax_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'paid', 'overdue', 'cancelled', 'credited'
    )),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Export
    exported_to_erp BOOLEAN DEFAULT false,
    exported_at TIMESTAMP,
    export_reference VARCHAR(100), -- DATEV/BMD reference
    
    -- Documents
    pdf_url VARCHAR(500),
    zugferd_xml TEXT, -- ZUGFeRD 2.1 XML
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT invoice_due_after_invoice CHECK (due_date >= invoice_date),
    CONSTRAINT invoice_total_correct CHECK (
        total = subtotal + tax_amount
    )
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_dates ON invoices(invoice_date DESC, due_date);
CREATE INDEX idx_invoices_overdue ON invoices(due_date) 
    WHERE status IN ('sent', 'overdue') AND deleted_at IS NULL;
```

**projects:**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Project Details
    project_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    estimated_hours DECIMAL(8,2),
    
    -- Budget
    budget DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN (
        'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
    )),
    health VARCHAR(20) CHECK (health IN ('green', 'yellow', 'red')),
    
    -- Progress
    completion_percentage INTEGER DEFAULT 0 CHECK (
        completion_percentage >= 0 AND completion_percentage <= 100
    ),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_customer ON projects(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_manager ON projects(project_manager_id) 
    WHERE deleted_at IS NULL;
```

**assets:**
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    assigned_to_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Asset Details
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN (
        'server', 'workstation', 'laptop', 'printer', 
        'network_device', 'mobile', 'software', 'other'
    )),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Purchase
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    supplier VARCHAR(200),
    
    -- Warranty
    warranty_expires DATE,
    warranty_type VARCHAR(50),
    
    -- Lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'maintenance', 'retired', 'disposed'
    )),
    eol_date DATE, -- End of Life
    
    -- Technical
    ip_address INET,
    mac_address MACADDR,
    hostname VARCHAR(200),
    operating_system VARCHAR(100),
    
    -- RMM Integration
    rmm_id VARCHAR(100), -- ID in RMM system
    rmm_last_seen TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_assets_customer ON assets(customer_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON assets(asset_type) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warranty ON assets(warranty_expires) 
    WHERE warranty_expires IS NOT NULL AND status = 'active';
CREATE INDEX idx_assets_rmm ON assets(rmm_id) 
    WHERE rmm_id IS NOT NULL;
```

---


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
