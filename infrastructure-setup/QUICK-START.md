# PSA-Platform Quick Start Guide

## For Developers

### 1. Connect to the Container
```bash
# From Proxmox host
pct enter 200  # or ssh root@10.255.20.15
```

### 2. Set Up Your Service
```bash
cd /opt/psa-platform/services
mkdir my-service && cd my-service
npm init -y
npm install express typescript @types/node @types/express
```

### 3. Configure Environment
```bash
cp /opt/psa-platform/.env.template /opt/psa-platform/.env
# Edit .env with your settings
```

### 4. Database Connection
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'psa_platform',
  user: 'psa_app',
  password: 'jsmWYseB8ao7n36f9VTpLiMBFnWyJMtE'
});
```

### 5. Redis Connection
```javascript
const Redis = require('ioredis');
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C'
});
```

### 6. Health Check
```bash
/usr/local/bin/psa-health-check.sh
```

## Service URLs

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ Management: `http://localhost:15672`

## Help

See `/opt/psa-platform/SETUP-NOTES.md` for complete documentation.
