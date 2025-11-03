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
