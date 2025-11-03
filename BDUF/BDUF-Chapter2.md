# Big Design Up Front (BDUF) - Kapitel 2
## PSA-Platform für Managed Service Provider

**Version:** 1.0  
**Datum:** November 2025  
**Kapitel:** 2 - Technologie-Stack (Detailliert)

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

**ENDE KAPITEL 2**

*Dieses Kapitel beschreibt den vollständigen Technologie-Stack der PSA-Platform inkl. Backend (Node.js/NestJS), Frontend (React), Datenbank (PostgreSQL/Redis/Elasticsearch) und Message-Queue (RabbitMQ) mit detaillierten Code-Beispielen.*

**Fortsetzung in:**
- PSA-Platform-BDUF-Part2.md (Kapitel 3.3-9)
- PSA-Platform-BDUF-Part3.md (Kapitel 10-15)
