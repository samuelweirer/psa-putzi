# Deployment Strategy: MVP vs Production

**Document Version:** 1.0
**Last Updated:** 2025-11-04
**Status:** Active

---

## Overview

This document outlines the deployment strategy for PSA-Platform, explaining the differences between the MVP (development) deployment and the final Production deployment.

## Key Principle

**Start simple, scale when needed.**

For MVP and initial development, we consolidate all Node.js application services into a single LXC container to reduce complexity, resource usage, and deployment overhead. As we scale, we can split into true microservices.

---

## MVP Deployment Architecture (Phase 1)

### Container Layout

| Container ID | Hostname | Service | CPU | RAM | Storage | IP Address |
|--------------|----------|---------|-----|-----|---------|------------|
| 100 | psa-db-master | PostgreSQL 15 | 8 | 32GB | 500GB | 10.0.30.10 |
| 110 | psa-redis | Redis 7.x | 2 | 4GB | 10GB | 10.0.20.20 |
| 120 | psa-rabbitmq | RabbitMQ 3.12+ | 2 | 4GB | 20GB | 10.0.20.30 |
| 130 | psa-elasticsearch | Elasticsearch 8.x | 4 | 16GB | 200GB | 10.0.20.40 |
| **150** | **psa-app** | **All Node.js Services** | **8** | **16GB** | **100GB** | **10.0.20.50** |

### Container 150: psa-app (Consolidated Application)

This single container runs ALL Node.js application services:

```
psa-app (Container 150)
├── Node.js 20 LTS
├── TypeScript 5.x
├── PM2 (Process Manager)
└── Services:
    ├── psa-auth          (Port 3010)
    ├── psa-api-gateway   (Port 3000)
    ├── psa-crm           (Port 3020)
    ├── psa-tickets       (Port 3030)
    ├── psa-billing       (Port 3040)
    ├── psa-projects      (Port 3050)
    ├── psa-assets        (Port 3060)
    └── psa-reports       (Port 3070)
```

### Directory Structure

```
/opt/psa-platform/
├── services/
│   ├── auth/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-gateway/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── crm/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── tickets/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── billing/
│   ├── projects/
│   ├── assets/
│   └── reports/
├── shared/
│   ├── database/        # Shared DB connection pool
│   ├── redis/           # Shared Redis client
│   ├── rabbitmq/        # Shared MQ connection
│   ├── middleware/      # Shared Express middleware
│   └── utils/           # Shared utilities
├── ecosystem.config.js  # PM2 configuration
└── .env                 # Shared environment variables
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './services/api-gateway/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'auth',
      script: './services/auth/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3010
      }
    },
    {
      name: 'crm',
      script: './services/crm/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3020
      }
    },
    {
      name: 'tickets',
      script: './services/tickets/dist/index.js',
      instances: 4,  // More instances for high-traffic service
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3030
      }
    },
    {
      name: 'billing',
      script: './services/billing/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3040
      }
    },
    {
      name: 'projects',
      script: './services/projects/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3050
      }
    },
    {
      name: 'assets',
      script: './services/assets/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3060
      }
    },
    {
      name: 'reports',
      script: './services/reports/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3070
      }
    }
  ]
};
```

### Container Setup

```bash
# Create application container
pct create 150 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-app \
  --cores 8 \
  --memory 16384 \
  --rootfs local-lvm:100 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.50/24,gw=10.0.20.1 \
  --features nesting=1

pct start 150
pct enter 150

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential git

# Install PM2 globally
npm install -g pm2

# Create directory structure
mkdir -p /opt/psa-platform/{services,shared,logs}
cd /opt/psa-platform

# Clone repository
git clone https://github.com/samuelweirer/psa-putzi.git
cd psa-putzi

# Install dependencies for all services
for service in services/*; do
  if [ -f "$service/package.json" ]; then
    cd "$service"
    npm install
    npm run build
    cd ../..
  fi
done

# Start all services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

---

## Advantages of MVP Deployment

✅ **Simplified Development:**
- Single container to manage
- Easier debugging (all logs in one place)
- Faster deployment

✅ **Resource Efficiency:**
- Lower memory footprint
- No inter-container network overhead
- Shared Node.js runtime and dependencies

✅ **Cost Effective:**
- Fewer containers = lower infrastructure cost
- Suitable for MVP and small deployments (< 50 tenants)

✅ **Easier Monitoring:**
- All services in one PM2 dashboard
- Single log aggregation point
- Simplified health checks

✅ **Code Modularity Maintained:**
- Services are still separate codebases
- Can be split into containers later
- Same microservices architecture

---

## Production Deployment Architecture (Phase 4)

### When to Migrate?

Migrate to separate containers when:
- **> 50 tenants** or **> 1000 tickets/day**
- Need to scale individual services independently
- Want zero-downtime deployments per service
- Require service-level isolation for security/compliance

### Separate Container Layout

| Container ID | Service | Instances | CPU | RAM |
|--------------|---------|-----------|-----|-----|
| 120 | psa-api-gateway | 3 | 2 | 4GB |
| 121 | psa-auth | 3 | 2 | 4GB |
| 130 | psa-crm | 3 | 2 | 4GB |
| 140 | psa-tickets | 5 | 4 | 8GB |
| 150 | psa-billing | 3 | 2 | 4GB |
| 160 | psa-projects | 3 | 2 | 4GB |
| 170 | psa-assets | 2 | 2 | 4GB |
| 180 | psa-reports | 3 | 4 | 8GB |

### Migration Path

```bash
# Step 1: Extract service to separate container
pct create 121 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-auth \
  --cores 2 \
  --memory 4096 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.51/24

# Step 2: Copy service code
rsync -avz /opt/psa-platform/services/auth/ root@psa-auth:/opt/psa-auth/

# Step 3: Update API Gateway routing
# Change: http://localhost:3010 → http://10.0.20.51:3010

# Step 4: Start service on new container
pm2 start /opt/psa-auth/dist/index.js --name auth

# Step 5: Stop service on old container
pm2 stop auth
pm2 delete auth

# Step 6: Test and verify
curl http://10.0.20.51:3010/health

# Repeat for each service
```

---

## Shared Components Strategy

### Database Connection Pool

All services share the same PostgreSQL connection pool configuration:

```typescript
// shared/database/pool.ts
import { Pool } from 'pg';

export const db = new Pool({
  host: process.env.POSTGRES_HOST || '10.0.30.10',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'psa_platform',
  user: process.env.POSTGRES_USER || 'psa_app',
  password: process.env.POSTGRES_PASSWORD,
  max: 20,  // Max connections per service
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Redis Client

```typescript
// shared/redis/client.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || '10.0.20.20',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});
```

### RabbitMQ Connection

```typescript
// shared/rabbitmq/client.ts
import amqp from 'amqplib';

let connection: amqp.Connection;
let channel: amqp.Channel;

export async function getRabbitMQChannel(): Promise<amqp.Channel> {
  if (!connection) {
    connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://10.0.20.30:5672'
    );
  }

  if (!channel) {
    channel = await connection.createChannel();
  }

  return channel;
}
```

---

## Service Communication

### Internal API Calls (MVP)

Services communicate via localhost HTTP calls:

```typescript
// In psa-tickets service
import axios from 'axios';

async function getCustomer(customerId: string) {
  const response = await axios.get(
    `http://localhost:3020/api/v1/customers/${customerId}`,
    {
      headers: {
        'X-Internal-Request': 'true',
        'X-Service': 'psa-tickets'
      }
    }
  );
  return response.data;
}
```

### Event-Driven Communication (Recommended)

Use RabbitMQ for async communication:

```typescript
// Publish event
await publishEvent('ticket.created', {
  ticketId: ticket.id,
  customerId: ticket.customer_id,
  tenantId: ticket.tenant_id
});

// Subscribe to events
consumeEvents('ticket.created', async (event) => {
  // Send email notification
  await sendEmailNotification(event);
});
```

---

## Monitoring & Management

### PM2 Commands

```bash
# View all services
pm2 list

# View logs
pm2 logs
pm2 logs auth
pm2 logs tickets --lines 100

# Monitor resources
pm2 monit

# Restart specific service
pm2 restart tickets

# Restart all services
pm2 restart all

# Reload with zero-downtime
pm2 reload tickets

# View service info
pm2 info tickets
```

### Health Checks

```bash
# Check all services
for port in 3000 3010 3020 3030 3040 3050 3060 3070; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health | jq .
done
```

### Monitoring Integration

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7

# Export metrics to Prometheus
pm2 install pm2-prometheus-exporter
```

---

## Backup Strategy

### Application Code Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-psa-app.sh

BACKUP_DIR="/backup/psa-app"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup code and configuration
tar -czf "$BACKUP_DIR/psa-app-$DATE.tar.gz" \
  /opt/psa-platform/services \
  /opt/psa-platform/shared \
  /opt/psa-platform/ecosystem.config.js \
  /opt/psa-platform/.env

# Keep last 7 days
find $BACKUP_DIR -name "psa-app-*.tar.gz" -mtime +7 -delete
```

---

## Performance Considerations

### MVP Deployment Limits

**Recommended Limits:**
- Max tenants: 50
- Max concurrent users: 200
- Max tickets/day: 1,000
- Max API requests/minute: 5,000

**Beyond these limits:** Migrate to separate containers.

### Database Connection Pooling

With all services in one container:
- Total max connections: 160 (8 services × 20 connections)
- PostgreSQL max_connections should be: 500
- Leaves headroom for maintenance and ad-hoc queries

---

## CI/CD for MVP

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Pulling latest code..."
git pull origin master

echo "Installing dependencies..."
for service in services/*; do
  if [ -f "$service/package.json" ]; then
    cd "$service"
    npm install
    npm run build
    cd ../..
  fi
done

echo "Reloading services with zero-downtime..."
pm2 reload all

echo "Deployment complete!"
pm2 status
```

### Git Hook

```bash
# .git/hooks/post-receive
#!/bin/bash
cd /opt/psa-platform/psa-putzi
./deploy.sh
```

---

## Decision Matrix

| Criteria | MVP (Single Container) | Production (Separate Containers) |
|----------|------------------------|----------------------------------|
| Tenants | < 50 | > 50 |
| Tickets/day | < 1,000 | > 1,000 |
| Team size | 1-3 developers | > 3 developers |
| Deployment frequency | Weekly | Daily |
| Uptime requirement | 99% | 99.9% |
| Budget | Limited | Flexible |
| Complexity tolerance | Low | High |

---

## Summary

**For MVP Phase 1-2 (First 6-12 months):**
- ✅ Use single container (Container 150: psa-app)
- ✅ All Node.js services on same host
- ✅ PM2 cluster mode for redundancy
- ✅ Shared dependencies and connections

**For Production Phase 3-4 (After 12 months):**
- Migrate to separate containers
- Independent scaling per service
- Service-level isolation
- Zero-downtime deployments

**The code architecture remains the same** - only the deployment changes!

---

**Last Updated:** 2025-11-04
**Next Review:** When reaching 30 tenants or 500 tickets/day
