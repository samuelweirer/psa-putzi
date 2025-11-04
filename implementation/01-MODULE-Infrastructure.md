# Module Implementation Guide: psa-infrastructure

**Module:** Infrastructure & Core Services
**Phase:** 1 (MVP)
**Priority:** P0 (Critical - Foundation for all services)
**Container-IDs:** 100 (PostgreSQL), 101 (Redis), 102 (RabbitMQ), 103 (Elasticsearch)
**Dependencies:** None (this is the foundation)

---

## 1. OVERVIEW

### Purpose
The Infrastructure module provides the foundational data and messaging services for the entire PSA-Platform.

### Key Components
- **PostgreSQL 15+** - Primary relational database with multi-tenancy support
- **Redis 7.x** - Caching and session storage
- **RabbitMQ 3.12+** - Message queue for event-driven architecture
- **Elasticsearch 8.x** - Full-text search and analytics

### High Availability Architecture
- **PostgreSQL**: Master + 2 Read Replicas with streaming replication
- **Redis**: Sentinel configuration (1 master + 2 replicas)
- **RabbitMQ**: 3-node cluster with mirrored queues
- **Elasticsearch**: 3-node cluster with 1 replica per shard

---

## 2. POSTGRESQL DATABASE

### Container Specifications
- **CPU:** 8 cores
- **RAM:** 32 GB
- **Storage:** 500 GB (SSD)
- **Network:** VLAN 30 (Database)
- **Port:** 5432

### Installation & Configuration

**LXC Container Setup:**
```bash
# Create PostgreSQL container
pct create 100 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-db-master \
  --cores 8 \
  --memory 32768 \
  --swap 0 \
  --rootfs local-lvm:500 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.30.10/24,gw=10.0.30.1 \
  --nameserver 10.0.10.1 \
  --features nesting=1

# Start and enter container
pct start 100
pct enter 100

# Install PostgreSQL 15
apt update && apt install -y postgresql-15 postgresql-contrib-15
```

**PostgreSQL Configuration (`/etc/postgresql/15/main/postgresql.conf`):**
```ini
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 500

# Memory Settings
shared_buffers = 8GB                    # 25% of RAM
effective_cache_size = 24GB             # 75% of RAM
maintenance_work_mem = 2GB
work_mem = 20MB

# WAL Settings
wal_level = replica
max_wal_senders = 5
max_replication_slots = 5
wal_keep_size = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Tuning
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200
default_statistics_target = 100

# Parallel Query
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000       # Log slow queries (> 1s)
```

**pg_hba.conf:**
```ini
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections
host    all             all             127.0.0.1/32            md5

# Application VLAN
host    all             psa_app         10.0.20.0/24            scram-sha-256

# Replication connections
host    replication     replicator      10.0.30.11/32           scram-sha-256
host    replication     replicator      10.0.30.12/32           scram-sha-256
```

### Database Initialization

**Create Database and User:**
```sql
-- Create application user
CREATE USER psa_app WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- Create replication user
CREATE USER replicator WITH REPLICATION PASSWORD 'CHANGE_ME_REPLICATION_PASSWORD';

-- Create database
CREATE DATABASE psa_platform
  OWNER psa_app
  ENCODING 'UTF8'
  LC_COLLATE = 'de_DE.UTF-8'
  LC_CTYPE = 'de_DE.UTF-8'
  TEMPLATE template0;

-- Connect to database
\c psa_platform

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";        -- For multi-column indexes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";         -- For encryption functions

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE psa_platform TO psa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO psa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO psa_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO psa_app;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO psa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO psa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO psa_app;
```

### Schema Migration

**Apply Complete Schema from BDUF-Chapter3:**
```bash
# Download schema from BDUF repository
psql -U psa_app -d psa_platform -f /path/to/BDUF-Chapter3-schema.sql

# Verify tables created
psql -U psa_app -d psa_platform -c "\dt"

# Expected: 40+ tables including users, customers, tickets, etc.
```

### Row-Level Security (RLS) for Multi-Tenancy

**Enable RLS on all tenant-scoped tables:**
```sql
-- Example for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON customers
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to application user
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO psa_app;
```

**Apply to all tenant-scoped tables:**
```sql
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'customers', 'contacts', 'locations', 'tickets', 'time_entries',
      'projects', 'project_tasks', 'contracts', 'invoices', 'invoice_items',
      'assets', 'licenses', 'contracts', 'slas', 'knowledge_base_articles'
    )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I
       USING (tenant_id = current_setting(''app.current_tenant_id'')::UUID)',
      table_name
    );
  END LOOP;
END $$;
```

### Read Replicas Setup

**On Replica Servers (10.0.30.11 and 10.0.30.12):**
```bash
# Stop PostgreSQL
systemctl stop postgresql

# Remove existing data
rm -rf /var/lib/postgresql/15/main/*

# Create base backup from master
pg_basebackup -h 10.0.30.10 -D /var/lib/postgresql/15/main \
  -U replicator -P -v -R -X stream -C -S replica_slot_1

# Fix permissions
chown -R postgres:postgres /var/lib/postgresql/15/main

# Start replica
systemctl start postgresql
```

**Verify Replication:**
```sql
-- On Master
SELECT * FROM pg_stat_replication;

-- On Replica
SELECT pg_is_in_recovery();  -- Should return 't' (true)
```

---

## 3. REDIS CACHE

### Container Specifications
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 10 GB
- **Network:** VLAN 20 (Application)
- **Port:** 6379

### Installation & Configuration

**LXC Container Setup:**
```bash
pct create 101 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-redis-master \
  --cores 2 \
  --memory 4096 \
  --rootfs local-lvm:10 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.20/24,gw=10.0.20.1

pct start 101
pct enter 101

# Install Redis
apt update && apt install -y redis-server redis-sentinel
```

**Redis Configuration (`/etc/redis/redis.conf`):**
```ini
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass CHANGE_ME_REDIS_PASSWORD

# Memory
maxmemory 3gb
maxmemory-policy allkeys-lru

# Persistence (AOF + RDB)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

save 900 1
save 300 10
save 60 10000

# Replication (on master)
# (no special config needed on master)

# Security
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG "CONFIG_CHANGE_ME_SECRET"
```

**Sentinel Configuration (`/etc/redis/sentinel.conf`):**
```ini
bind 0.0.0.0
port 26379
sentinel monitor psa-redis-master 10.0.20.20 6379 2
sentinel auth-pass psa-redis-master CHANGE_ME_REDIS_PASSWORD
sentinel down-after-milliseconds psa-redis-master 5000
sentinel parallel-syncs psa-redis-master 1
sentinel failover-timeout psa-redis-master 10000
```

### Redis Use Cases

**1. Session Storage:**
```javascript
// Session key format: session:{session_id}
// TTL: 30 minutes
await redis.setex(
  `session:${sessionId}`,
  1800,
  JSON.stringify({ userId, tenantId, expiresAt })
);
```

**2. API Rate Limiting:**
```javascript
// Rate limit key format: ratelimit:{user_id}:{endpoint}
const key = `ratelimit:${userId}:/api/v1/tickets`;
const requests = await redis.incr(key);
if (requests === 1) {
  await redis.expire(key, 60); // 60 second window
}
if (requests > 100) {
  throw new Error('Rate limit exceeded');
}
```

**3. Cache-Aside Pattern:**
```javascript
async function getCustomer(customerId) {
  const cacheKey = `customer:${customerId}`;

  // Try cache first
  let customer = await redis.get(cacheKey);
  if (customer) {
    return JSON.parse(customer);
  }

  // Cache miss - fetch from DB
  customer = await db.customers.findById(customerId);

  // Store in cache (TTL: 5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(customer));

  return customer;
}
```

**4. Pub/Sub for Real-Time Events:**
```javascript
// Publisher (in ticket service)
await redis.publish('ticket:created', JSON.stringify({
  ticketId: 'uuid-123',
  customerId: 'uuid-456',
  tenantId: 'uuid-789'
}));

// Subscriber (in notification service)
redis.subscribe('ticket:created');
redis.on('message', (channel, message) => {
  const event = JSON.parse(message);
  sendNotification(event);
});
```

---

## 4. RABBITMQ MESSAGE QUEUE

### Container Specifications
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB
- **Network:** VLAN 20 (Application)
- **Ports:** 5672 (AMQP), 15672 (Management UI)

### Installation & Configuration

**LXC Container Setup:**
```bash
pct create 102 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-rabbitmq-1 \
  --cores 2 \
  --memory 4096 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.30/24,gw=10.0.20.1

pct start 102
pct enter 102

# Install RabbitMQ
apt update && apt install -y rabbitmq-server

# Enable management plugin
rabbitmq-plugins enable rabbitmq_management

# Create admin user
rabbitmqctl add_user admin CHANGE_ME_RABBITMQ_PASSWORD
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# Delete default guest user
rabbitmqctl delete_user guest
```

**RabbitMQ Configuration (`/etc/rabbitmq/rabbitmq.conf`):**
```ini
# Clustering
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@psa-rabbitmq-1
cluster_formation.classic_config.nodes.2 = rabbit@psa-rabbitmq-2
cluster_formation.classic_config.nodes.3 = rabbit@psa-rabbitmq-3

# Memory
vm_memory_high_watermark.relative = 0.6
vm_memory_high_watermark_paging_ratio = 0.75

# Disk
disk_free_limit.absolute = 5GB

# Network
listeners.tcp.default = 5672
management.tcp.port = 15672

# Logging
log.file.level = info
log.console = true
```

### Queue Topology

**Create Virtual Host and Exchanges:**
```bash
# Create vhost for PSA Platform
rabbitmqctl add_vhost psa-platform

# Create application user
rabbitmqctl add_user psa_app CHANGE_ME_APP_PASSWORD
rabbitmqctl set_permissions -p psa-platform psa_app ".*" ".*" ".*"
```

**Exchange and Queue Setup:**
```javascript
const amqp = require('amqplib');

async function setupQueues() {
  const connection = await amqp.connect('amqp://psa_app:password@10.0.20.30:5672/psa-platform');
  const channel = await connection.createChannel();

  // Topic exchange for events
  await channel.assertExchange('psa.events', 'topic', { durable: true });

  // Queues for different services
  const queues = [
    { name: 'psa.tickets.created', pattern: 'ticket.created' },
    { name: 'psa.tickets.updated', pattern: 'ticket.updated' },
    { name: 'psa.tickets.assigned', pattern: 'ticket.assigned' },
    { name: 'psa.billing.invoice.created', pattern: 'invoice.created' },
    { name: 'psa.notifications.email', pattern: 'notification.email' },
    { name: 'psa.notifications.teams', pattern: 'notification.teams' },
  ];

  for (const queue of queues) {
    await channel.assertQueue(queue.name, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
        'x-max-length': 10000,
      }
    });
    await channel.bindQueue(queue.name, 'psa.events', queue.pattern);
  }

  console.log('RabbitMQ queues created successfully');
}
```

### Event Publishing Pattern

**Publisher:**
```javascript
async function publishEvent(eventType, payload) {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange('psa.events', 'topic', { durable: true });

  const message = {
    eventId: uuidv4(),
    eventType,
    timestamp: new Date().toISOString(),
    tenantId: payload.tenantId,
    data: payload
  };

  channel.publish(
    'psa.events',
    eventType,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );

  console.log(`Published event: ${eventType}`);

  await channel.close();
  await connection.close();
}

// Usage
await publishEvent('ticket.created', {
  tenantId: 'uuid-123',
  ticketId: 'uuid-456',
  customerId: 'uuid-789',
  title: 'Server Down'
});
```

**Consumer:**
```javascript
async function consumeEvents(queueName, handler) {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });
  channel.prefetch(10); // Process 10 messages at a time

  channel.consume(queueName, async (msg) => {
    if (msg !== null) {
      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        // Reject and requeue (max 3 retries)
        channel.nack(msg, false, msg.fields.deliveryTag < 3);
      }
    }
  });
}

// Usage
consumeEvents('psa.tickets.created', async (event) => {
  console.log('New ticket:', event.data.ticketId);
  await sendNotification(event.data);
});
```

---

## 5. ELASTICSEARCH SEARCH

### Container Specifications
- **CPU:** 4 cores
- **RAM:** 16 GB
- **Storage:** 200 GB
- **Network:** VLAN 20 (Application)
- **Ports:** 9200 (HTTP), 9300 (Transport)

### Installation & Configuration

**LXC Container Setup:**
```bash
pct create 103 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-elasticsearch-1 \
  --cores 4 \
  --memory 16384 \
  --rootfs local-lvm:200 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.40/24,gw=10.0.20.1

pct start 103
pct enter 103

# Install Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
apt update && apt install -y elasticsearch

# Configure JVM heap
echo "-Xms8g" >> /etc/elasticsearch/jvm.options.d/heap.options
echo "-Xmx8g" >> /etc/elasticsearch/jvm.options.d/heap.options
```

**Elasticsearch Configuration (`/etc/elasticsearch/elasticsearch.yml`):**
```yaml
cluster.name: psa-platform
node.name: psa-elasticsearch-1

# Network
network.host: 10.0.20.40
http.port: 9200

# Discovery (for clustering)
discovery.seed_hosts: ["10.0.20.40", "10.0.20.41", "10.0.20.42"]
cluster.initial_master_nodes: ["psa-elasticsearch-1", "psa-elasticsearch-2", "psa-elasticsearch-3"]

# Paths
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# Memory
bootstrap.memory_lock: true

# Security
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

### Index Templates

**Tickets Index:**
```json
PUT /_index_template/psa-tickets
{
  "index_patterns": ["psa-tickets-*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "german_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "german_stop", "german_stemmer"]
          }
        },
        "filter": {
          "german_stop": {
            "type": "stop",
            "stopwords": "_german_"
          },
          "german_stemmer": {
            "type": "stemmer",
            "language": "german"
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "ticket_id": { "type": "keyword" },
        "tenant_id": { "type": "keyword" },
        "title": {
          "type": "text",
          "analyzer": "german_analyzer",
          "fields": {
            "keyword": { "type": "keyword" }
          }
        },
        "description": {
          "type": "text",
          "analyzer": "german_analyzer"
        },
        "status": { "type": "keyword" },
        "priority": { "type": "keyword" },
        "created_at": { "type": "date" },
        "updated_at": { "type": "date" },
        "customer_name": {
          "type": "text",
          "analyzer": "german_analyzer",
          "fields": {
            "keyword": { "type": "keyword" }
          }
        },
        "assigned_to_name": { "type": "text" },
        "tags": { "type": "keyword" }
      }
    }
  }
}
```

**Knowledge Base Index:**
```json
PUT /_index_template/psa-knowledge-base
{
  "index_patterns": ["psa-kb-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "german_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "german_stop", "german_stemmer"]
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "article_id": { "type": "keyword" },
        "tenant_id": { "type": "keyword" },
        "title": {
          "type": "text",
          "analyzer": "german_analyzer"
        },
        "content": {
          "type": "text",
          "analyzer": "german_analyzer"
        },
        "category": { "type": "keyword" },
        "tags": { "type": "keyword" },
        "created_at": { "type": "date" },
        "view_count": { "type": "integer" }
      }
    }
  }
}
```

### Search Query Examples

**Full-Text Search:**
```javascript
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://10.0.20.40:9200' });

async function searchTickets(query, tenantId) {
  const result = await client.search({
    index: 'psa-tickets-*',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['title^3', 'description', 'customer_name'],
                fuzziness: 'AUTO'
              }
            },
            {
              term: { tenant_id: tenantId }
            }
          ]
        }
      },
      highlight: {
        fields: {
          title: {},
          description: {}
        }
      },
      size: 20
    }
  });

  return result.hits.hits.map(hit => ({
    id: hit._source.ticket_id,
    title: hit._source.title,
    highlights: hit.highlight
  }));
}
```

---

## 6. MONITORING & HEALTH CHECKS

### Health Check Endpoints

**PostgreSQL Health:**
```bash
#!/bin/bash
# /usr/local/bin/check_postgres_health.sh

psql -U psa_app -d psa_platform -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "PostgreSQL: HEALTHY"
  exit 0
else
  echo "PostgreSQL: UNHEALTHY"
  exit 1
fi
```

**Redis Health:**
```bash
#!/bin/bash
# /usr/local/bin/check_redis_health.sh

redis-cli -a "$REDIS_PASSWORD" PING > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Redis: HEALTHY"
  exit 0
else
  echo "Redis: UNHEALTHY"
  exit 1
fi
```

**RabbitMQ Health:**
```bash
#!/bin/bash
rabbitmqctl status > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "RabbitMQ: HEALTHY"
  exit 0
else
  echo "RabbitMQ: UNHEALTHY"
  exit 1
fi
```

**Elasticsearch Health:**
```bash
#!/bin/bash
curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green"'
if [ $? -eq 0 ]; then
  echo "Elasticsearch: HEALTHY"
  exit 0
else
  echo "Elasticsearch: UNHEALTHY"
  exit 1
fi
```

---

## 7. BACKUP STRATEGY

### PostgreSQL Backups

**Daily Full Backup:**
```bash
#!/bin/bash
# /usr/local/bin/backup_postgres.sh

BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/psa_platform_$DATE.sql.gz"

# Create backup
pg_dump -U psa_app psa_platform | gzip > "$BACKUP_FILE"

# Encrypt backup
gpg --encrypt --recipient backup@psa-platform.local "$BACKUP_FILE"

# Upload to S3/B2
rclone copy "$BACKUP_FILE.gpg" remote:psa-backups/postgresql/

# Keep only last 30 days locally
find $BACKUP_DIR -name "*.sql.gz*" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Crontab:**
```cron
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup_postgres.sh
```

### Redis Backups

Redis automatically creates RDB snapshots based on config. Additionally:
```bash
# Manual backup
redis-cli -a "$REDIS_PASSWORD" BGSAVE

# Copy RDB file to backup location
cp /var/lib/redis/dump.rdb /backup/redis/dump_$(date +%Y%m%d).rdb
```

### RabbitMQ Backups

```bash
#!/bin/bash
# Backup RabbitMQ definitions (exchanges, queues, bindings)
rabbitmqctl export_definitions /backup/rabbitmq/definitions_$(date +%Y%m%d).json
```

---

## 8. IMPLEMENTATION CHECKLIST

### PostgreSQL
- [ ] LXC container created and configured
- [ ] PostgreSQL 15 installed
- [ ] postgresql.conf optimized
- [ ] pg_hba.conf configured
- [ ] Database and users created
- [ ] Extensions enabled (uuid-ossp, pg_trgm, btree_gin, pgcrypto)
- [ ] Complete schema applied from BDUF-Chapter3
- [ ] Row-Level Security (RLS) enabled
- [ ] Read replicas configured (2x)
- [ ] Streaming replication verified
- [ ] Backup script created and scheduled
- [ ] Monitoring configured

### Redis
- [ ] LXC container created
- [ ] Redis 7.x installed
- [ ] redis.conf configured
- [ ] Redis Sentinel configured
- [ ] Replica nodes setup (2x)
- [ ] Password authentication enabled
- [ ] Dangerous commands disabled
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### RabbitMQ
- [ ] LXC container created
- [ ] RabbitMQ 3.12+ installed
- [ ] Management plugin enabled
- [ ] Admin user created
- [ ] Virtual host created
- [ ] Application user created
- [ ] Exchanges and queues created
- [ ] Cluster configured (3 nodes)
- [ ] Mirrored queues enabled
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### Elasticsearch
- [ ] LXC container created
- [ ] Elasticsearch 8.x installed
- [ ] JVM heap configured
- [ ] elasticsearch.yml configured
- [ ] Cluster configured (3 nodes)
- [ ] Index templates created
- [ ] German analyzer configured
- [ ] Security enabled
- [ ] Backup strategy implemented
- [ ] Monitoring configured

---

## 9. DEFINITION OF DONE

- [ ] All containers running and accessible
- [ ] PostgreSQL master + 2 replicas operational
- [ ] Redis master + 2 replicas with Sentinel
- [ ] RabbitMQ 3-node cluster operational
- [ ] Elasticsearch 3-node cluster operational
- [ ] Complete database schema applied and verified
- [ ] Row-Level Security (RLS) tested
- [ ] Backup scripts created and tested
- [ ] Health check scripts working
- [ ] Monitoring integrated with Zabbix
- [ ] Documentation complete
- [ ] Performance benchmarks run
- [ ] Disaster recovery tested

---

## 10. ENVIRONMENT VARIABLES

```env
# PostgreSQL
POSTGRES_HOST=10.0.30.10
POSTGRES_PORT=5432
POSTGRES_DB=psa_platform
POSTGRES_USER=psa_app
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_REPLICA_1=10.0.30.11
POSTGRES_REPLICA_2=10.0.30.12

# Redis
REDIS_HOST=10.0.20.20
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_SENTINEL_HOSTS=10.0.20.20:26379,10.0.20.21:26379,10.0.20.22:26379

# RabbitMQ
RABBITMQ_URL=amqp://psa_app:CHANGE_ME_APP_PASSWORD@10.0.20.30:5672/psa-platform
RABBITMQ_MANAGEMENT_URL=http://10.0.20.30:15672

# Elasticsearch
ELASTICSEARCH_URL=http://10.0.20.40:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=CHANGE_ME_ES_PASSWORD
```

---

**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
**Estimated Effort:** 3 weeks (1 DevOps engineer)
