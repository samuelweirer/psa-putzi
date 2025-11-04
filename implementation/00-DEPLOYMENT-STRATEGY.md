# Deployment Strategy: Single Container → Production

**Document Version:** 2.0
**Last Updated:** 2025-11-04
**Status:** Active

---

## Overview

This document outlines the deployment strategy for PSA-Platform, starting with the absolute simplest approach and scaling as needed.

## Key Principle

**Start as simple as possible, scale when needed.**

For early MVP development, we run **EVERYTHING on a single LXC container** to minimize complexity and infrastructure overhead. As the platform matures, we progressively split services into separate containers.

---

## Phase 0: Single Container (Early MVP - Recommended Start)

### Container Layout

**ONE CONTAINER FOR EVERYTHING:**

| Container ID | Hostname | Services | CPU | RAM | Storage | IP Address |
|--------------|----------|----------|-----|-----|---------|------------|
| **200** | **psa-all-in-one** | **Everything** | **16** | **64GB** | **1TB** | **10.0.20.100** |

### What Runs on Container 200

```
psa-all-in-one (Container 200)
├── PostgreSQL 15
├── Redis 7.x
├── RabbitMQ 3.12+
├── Elasticsearch 8.x
├── Node.js 20 LTS
├── PM2 (Process Manager)
└── Application Services:
    ├── psa-api-gateway   (Port 3000)
    ├── psa-auth          (Port 3010)
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
├── data/
│   ├── postgresql/      # PostgreSQL data directory
│   ├── redis/           # Redis data directory
│   ├── rabbitmq/        # RabbitMQ data directory
│   └── elasticsearch/   # Elasticsearch data directory
├── services/
│   ├── auth/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-gateway/
│   ├── crm/
│   ├── tickets/
│   ├── billing/
│   ├── projects/
│   ├── assets/
│   └── reports/
├── shared/
│   ├── database/        # Shared DB connection pool
│   ├── redis/           # Shared Redis client
│   ├── rabbitmq/        # Shared MQ connection
│   └── utils/           # Shared utilities
├── logs/
│   ├── postgresql/
│   ├── redis/
│   ├── rabbitmq/
│   ├── elasticsearch/
│   └── services/
├── backups/
├── ecosystem.config.js  # PM2 configuration
└── .env                 # Environment variables
```

---

## Container Setup

### 1. Create LXC Container

```bash
# Create all-in-one container on Proxmox
pct create 200 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname psa-all-in-one \
  --cores 16 \
  --memory 65536 \
  --swap 8192 \
  --rootfs local-lvm:1000 \
  --net0 name=eth0,bridge=vmbr20,ip=10.0.20.100/24,gw=10.0.20.1 \
  --nameserver 10.0.10.1 \
  --features nesting=1 \
  --unprivileged 1

# Start container
pct start 200

# Enter container
pct enter 200
```

### 2. Install PostgreSQL

```bash
# Update system
apt update && apt upgrade -y

# Install PostgreSQL 15
apt install -y postgresql-15 postgresql-contrib-15

# Configure PostgreSQL
cat >> /etc/postgresql/15/main/postgresql.conf << 'EOF'

# PSA Platform Configuration
listen_addresses = 'localhost'
port = 5432
max_connections = 200

# Memory (for 64GB system)
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 20MB

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
EOF

# Restart PostgreSQL
systemctl restart postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE USER psa_app WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE psa_platform OWNER psa_app;
\c psa_platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON DATABASE psa_platform TO psa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO psa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO psa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO psa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO psa_app;
EOF
```

### 3. Install Redis

```bash
# Install Redis
apt install -y redis-server

# Configure Redis
cat > /etc/redis/redis.conf << 'EOF'
bind 127.0.0.1
port 6379
requirepass your_redis_password_here

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHALL ""
rename-command FLUSHDB ""
EOF

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server
```

### 4. Install RabbitMQ

```bash
# Install RabbitMQ
apt install -y rabbitmq-server

# Enable management plugin
rabbitmq-plugins enable rabbitmq_management

# Create admin user
rabbitmqctl add_user admin your_rabbitmq_password_here
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# Delete default guest user
rabbitmqctl delete_user guest

# Create application user
rabbitmqctl add_user psa_app your_app_password_here
rabbitmqctl set_permissions -p / psa_app ".*" ".*" ".*"

# Start RabbitMQ
systemctl enable rabbitmq-server
systemctl start rabbitmq-server
```

### 5. Install Elasticsearch

```bash
# Install dependencies
apt install -y apt-transport-https gnupg

# Add Elasticsearch repository
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list

# Install Elasticsearch
apt update && apt install -y elasticsearch

# Configure Elasticsearch
cat > /etc/elasticsearch/elasticsearch.yml << 'EOF'
cluster.name: psa-platform
node.name: psa-node-1

# Network
network.host: 127.0.0.1
http.port: 9200

# Paths
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# Memory
bootstrap.memory_lock: false

# Single node (no clustering)
discovery.type: single-node

# Security
xpack.security.enabled: false
EOF

# Set JVM heap (4GB for 64GB system)
cat > /etc/elasticsearch/jvm.options.d/heap.options << 'EOF'
-Xms4g
-Xmx4g
EOF

# Start Elasticsearch
systemctl enable elasticsearch
systemctl start elasticsearch
```

### 6. Install Node.js and Application

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential git

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/psa-platform/{services,shared,logs,backups,data}

# Clone repository (or create your own structure)
cd /opt/psa-platform
git clone https://github.com/samuelweirer/psa-putzi.git repo

# Create .env file
cat > /opt/psa-platform/.env << 'EOF'
NODE_ENV=production

# Database
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=psa_platform
POSTGRES_USER=psa_app
POSTGRES_PASSWORD=your_secure_password_here

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# RabbitMQ
RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=psa_app
RABBITMQ_PASSWORD=your_app_password_here
RABBITMQ_VHOST=/

# Elasticsearch
ELASTICSEARCH_HOST=127.0.0.1
ELASTICSEARCH_PORT=9200

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_long

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@psa-platform.local
SMTP_PASSWORD=smtp_password
EOF

chmod 600 /opt/psa-platform/.env
```

### 7. PM2 Configuration

```javascript
// /opt/psa-platform/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './services/api-gateway/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_file: '.env',
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
      env_file: '.env',
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
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3020
      }
    },
    {
      name: 'tickets',
      script: './services/tickets/dist/index.js',
      instances: 4,
      exec_mode: 'cluster',
      env_file: '.env',
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
      env_file: '.env',
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
      env_file: '.env',
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
      env_file: '.env',
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
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3070
      }
    }
  ]
};
```

### 8. Build and Start Services

```bash
# Build all services
cd /opt/psa-platform

for service in services/*; do
  if [ -f "$service/package.json" ]; then
    echo "Building $service..."
    cd "$service"
    npm install
    npm run build
    cd ../..
  fi
done

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command that PM2 outputs

# View status
pm2 status
pm2 logs
```

---

## Advantages of Single Container

✅ **Maximum Simplicity:**
- Only ONE container to manage
- All services on localhost
- No network complexity
- Single point of configuration

✅ **Lowest Resource Overhead:**
- No inter-container network
- Shared memory and CPU
- Single OS instance

✅ **Easiest Development:**
- All logs in one place
- Simple debugging
- Fast service communication (localhost)
- No firewall/network issues

✅ **Rapid Prototyping:**
- Setup in 30 minutes
- Perfect for POC/MVP
- Easy to reset and rebuild

✅ **Cost Effective:**
- Minimal infrastructure
- Can run on single physical/virtual machine
- Lower licensing costs (if applicable)

---

## Recommended Limits (Single Container)

**Safe Operation Range:**
- Max tenants: **10-20**
- Max concurrent users: **50-100**
- Max tickets/day: **200-500**
- Max API requests/minute: **1,000**

**Hardware Requirements:**
- CPU: 16 cores (or 8 cores minimum)
- RAM: 64GB (or 32GB minimum)
- Storage: 1TB SSD (or 500GB minimum)

**Beyond these limits:** Migrate to Phase 1 (separate infrastructure containers)

---

## Migration Path

### Phase 1: Separate Infrastructure (5-20 tenants)

When you outgrow the single container, split infrastructure first:

```
Container 100: PostgreSQL (8 cores, 32GB RAM)
Container 110: Redis (2 cores, 4GB RAM)
Container 120: RabbitMQ (2 cores, 4GB RAM)
Container 130: Elasticsearch (4 cores, 16GB RAM)
Container 150: All Node.js services (8 cores, 16GB RAM)
```

**Migration Steps:**

```bash
# 1. Create PostgreSQL container
pct create 100 ... # (see Infrastructure module guide)

# 2. Dump database from Container 200
pg_dump -U psa_app psa_platform > /backup/psa_platform.sql

# 3. Import to new PostgreSQL container
psql -h 10.0.30.10 -U psa_app psa_platform < /backup/psa_platform.sql

# 4. Update .env
POSTGRES_HOST=10.0.30.10

# 5. Restart services
pm2 restart all

# 6. Stop PostgreSQL on Container 200
systemctl stop postgresql
systemctl disable postgresql

# Repeat for Redis, RabbitMQ, Elasticsearch
```

### Phase 2: Separate Application Services (20-50 tenants)

Split Node.js services into separate containers:

```
Container 120: API Gateway (2 cores, 4GB)
Container 121: Auth (2 cores, 4GB)
Container 130: CRM (2 cores, 4GB)
Container 140: Tickets (4 cores, 8GB)
Container 150: Billing (2 cores, 4GB)
Container 160: Projects (2 cores, 4GB)
Container 170: Assets (2 cores, 4GB)
Container 180: Reports (4 cores, 8GB)
```

### Phase 3: High Availability (50+ tenants)

Add redundancy:
- PostgreSQL: Master + 2 replicas
- Redis: Sentinel (3 nodes)
- RabbitMQ: Cluster (3 nodes)
- Elasticsearch: Cluster (3 nodes)
- Load balancer for application services

---

## Monitoring & Management

### Service Status

```bash
# Check all services
systemctl status postgresql
systemctl status redis-server
systemctl status rabbitmq-server
systemctl status elasticsearch
pm2 status

# View logs
journalctl -u postgresql -f
journalctl -u redis-server -f
journalctl -u rabbitmq-server -f
journalctl -u elasticsearch -f
pm2 logs

# Resource usage
htop
df -h
```

### Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

echo "=== PSA Platform Health Check ==="
echo ""

# PostgreSQL
echo -n "PostgreSQL: "
if sudo -u postgres psql -c "SELECT 1" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
fi

# Redis
echo -n "Redis: "
if redis-cli -a "$REDIS_PASSWORD" PING > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
fi

# RabbitMQ
echo -n "RabbitMQ: "
if rabbitmqctl status > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
fi

# Elasticsearch
echo -n "Elasticsearch: "
if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
fi

# Application services
echo ""
echo "Application Services:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"'

echo ""
echo "=== Resource Usage ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "RAM: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
```

---

## Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-psa.sh

BACKUP_DIR="/opt/psa-platform/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $DATE..."

# 1. PostgreSQL
echo "Backing up PostgreSQL..."
sudo -u postgres pg_dump psa_platform | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# 2. Redis
echo "Backing up Redis..."
redis-cli -a "$REDIS_PASSWORD" SAVE
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 3. RabbitMQ
echo "Backing up RabbitMQ..."
rabbitmqctl export_definitions "$BACKUP_DIR/rabbitmq_$DATE.json"

# 4. Elasticsearch
echo "Backing up Elasticsearch..."
curl -X PUT "localhost:9200/_snapshot/psa_backup/snapshot_$DATE?wait_for_completion=true"

# 5. Application code
echo "Backing up application..."
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /opt/psa-platform/services /opt/psa-platform/shared

# 6. Configuration
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  /opt/psa-platform/.env \
  /opt/psa-platform/ecosystem.config.js \
  /etc/postgresql/15/main/postgresql.conf \
  /etc/redis/redis.conf

# 7. Clean old backups (keep 7 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.json" -mtime +7 -delete

echo "Backup completed at $(date)"
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-psa.sh >> /var/log/psa-backup.log 2>&1
```

---

## Quick Reference

### Connection Strings

```bash
# PostgreSQL
postgresql://psa_app:password@localhost:5432/psa_platform

# Redis
redis://:password@localhost:6379

# RabbitMQ
amqp://psa_app:password@localhost:5672/

# Elasticsearch
http://localhost:9200

# Application URLs (internal)
http://localhost:3000  # API Gateway
http://localhost:3010  # Auth
http://localhost:3020  # CRM
http://localhost:3030  # Tickets
http://localhost:3040  # Billing
http://localhost:3050  # Projects
http://localhost:3060  # Assets
http://localhost:3070  # Reports
```

### Common Commands

```bash
# Restart everything
systemctl restart postgresql redis-server rabbitmq-server elasticsearch
pm2 restart all

# View all logs
pm2 logs

# Database console
sudo -u postgres psql psa_platform

# Redis console
redis-cli -a "$REDIS_PASSWORD"

# RabbitMQ management
http://localhost:15672  # Username: admin

# Elasticsearch status
curl localhost:9200/_cluster/health?pretty

# Full system status
/usr/local/bin/health-check.sh
```

---

## Decision Matrix

| Criteria | Single Container | Separate Infrastructure | Full Microservices |
|----------|-----------------|------------------------|-------------------|
| Tenants | 1-10 | 10-50 | 50+ |
| Users | < 50 | 50-200 | 200+ |
| Tickets/day | < 200 | 200-1000 | 1000+ |
| Development | POC/MVP | Active development | Production |
| Team size | 1-2 | 2-5 | 5+ |
| Uptime SLA | Best effort | 99% | 99.9% |
| Setup time | 30 min | 2 hours | 1 day |
| Complexity | ⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## Summary

**Start Here (Phase 0):**
- ✅ Single container (Container 200)
- ✅ All services on localhost
- ✅ Perfect for MVP, POC, development
- ✅ Up and running in 30 minutes

**Scale When Needed:**
- Phase 1: Separate infrastructure containers (10+ tenants)
- Phase 2: Separate application containers (20+ tenants)
- Phase 3: High availability clusters (50+ tenants)

**The code stays the same** - only deployment changes!

---

**Last Updated:** 2025-11-04
**Recommended For:** Early MVP development (first 3-6 months)
**Next Review:** When reaching 10 tenants or 200 tickets/day
