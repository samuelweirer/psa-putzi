# Sub-Agent Handover: Infrastructure Setup

**Handover ID:** INFRA-001
**Date:** 2025-11-04
**From:** Master Agent (Planning & Coordination)
**To:** Infrastructure Sub-Agent
**Priority:** P0 (Critical - Blocker for all development)
**Estimated Duration:** 2-4 hours

---

## Task Overview

Set up the complete infrastructure for PSA-Platform on a single LXC container (Container 200: psa-all-in-one) following the deployment strategy.

## Objective

Create a fully functional development environment with all infrastructure services running and tested:
- PostgreSQL 15
- Redis 7.x
- RabbitMQ 3.12+
- Elasticsearch 8.x
- Node.js 20 LTS + PM2

## Reference Documents

**Primary Guide:**
- `implementation/00-DEPLOYMENT-STRATEGY.md` - Complete setup instructions
- `implementation/01-MODULE-Infrastructure.md` - Detailed infrastructure documentation

**Supporting Documents:**
- `BDUF/BDUF-Chapter3.md` - Database schema
- `BDUF/BDUF-Chapter6.md` - Container architecture
- `AGENTS/QUICK-START.md` - Sub-agent coordination guidelines

## Prerequisites

- Proxmox VE host available
- Network access configured (VLAN 20)
- SSH access to Proxmox host

## Tasks Checklist

### 1. Container Creation
- [ ] Create LXC container 200 (16 cores, 64GB RAM, 1TB storage)
- [ ] Configure network (IP: 10.0.20.100/24)
- [ ] Start container and verify access
- [ ] Update system packages

### 2. PostgreSQL Installation
- [ ] Install PostgreSQL 15
- [ ] Configure postgresql.conf (see deployment strategy)
- [ ] Configure pg_hba.conf for local access
- [ ] Create database `psa_platform`
- [ ] Create user `psa_app` with password
- [ ] Enable required extensions (uuid-ossp, pg_trgm, btree_gin, pgcrypto)
- [ ] Apply complete database schema from BDUF-Chapter3.md
- [ ] Verify: `psql -U psa_app -d psa_platform -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"`
- [ ] Expected result: 40+ tables

### 3. Redis Installation
- [ ] Install Redis 7.x
- [ ] Configure redis.conf (bind localhost, set password, memory limits)
- [ ] Enable and start redis-server
- [ ] Verify: `redis-cli -a PASSWORD PING`
- [ ] Expected: PONG

### 4. RabbitMQ Installation
- [ ] Install RabbitMQ server
- [ ] Enable management plugin
- [ ] Create admin user (delete default guest)
- [ ] Create application user `psa_app`
- [ ] Verify: `rabbitmqctl status`
- [ ] Test management UI: http://localhost:15672

### 5. Elasticsearch Installation
- [ ] Install Elasticsearch 8.x
- [ ] Configure elasticsearch.yml (single node, localhost)
- [ ] Set JVM heap (4GB)
- [ ] Enable and start elasticsearch
- [ ] Verify: `curl localhost:9200/_cluster/health?pretty`
- [ ] Expected: status "green" or "yellow"

### 6. Node.js & PM2 Setup
- [ ] Install Node.js 20 LTS
- [ ] Install PM2 globally: `npm install -g pm2`
- [ ] Create directory structure: `/opt/psa-platform/{services,shared,logs,backups,data}`
- [ ] Create .env file with all connection strings
- [ ] Verify: `node --version` (should be v20.x.x)
- [ ] Verify: `pm2 --version`

### 7. Health Checks
- [ ] Create health check script (see deployment strategy)
- [ ] Make executable: `chmod +x /usr/local/bin/health-check.sh`
- [ ] Run health check: `/usr/local/bin/health-check.sh`
- [ ] All services should report "✓ OK"

### 8. Backup Setup
- [ ] Create backup script (see deployment strategy)
- [ ] Make executable: `chmod +x /usr/local/bin/backup-psa.sh`
- [ ] Test backup: `/usr/local/bin/backup-psa.sh`
- [ ] Schedule daily backups: `crontab -e` (2 AM daily)

## Deliverables

1. **Container 200 fully operational** with all services running
2. **Database schema applied** - All 40+ tables created
3. **Health check script** passing for all services
4. **Backup script** configured and tested
5. **Documentation:** Create `/opt/psa-platform/SETUP-NOTES.md` with:
   - IP address and access details
   - All passwords (use secure password manager)
   - Connection strings for each service
   - Any deviations from the deployment guide
   - Known issues or warnings

## Testing Criteria

Run these commands to verify setup:

```bash
# PostgreSQL
sudo -u postgres psql -c "SELECT version();"
psql -U psa_app -d psa_platform -c "\dt"

# Redis
redis-cli -a YOUR_PASSWORD PING

# RabbitMQ
rabbitmqctl status
curl -u admin:YOUR_PASSWORD http://localhost:15672/api/overview

# Elasticsearch
curl http://localhost:9200/_cluster/health?pretty

# Node.js & PM2
node --version
npm --version
pm2 list

# Complete health check
/usr/local/bin/health-check.sh
```

**Success Criteria:** All commands execute successfully with expected output.

## Handover to Next Agent

Once infrastructure setup is complete:

1. **Document everything** in `/opt/psa-platform/SETUP-NOTES.md`
2. **Commit configuration files** (not passwords!) to git
3. **Create handover document** for Auth module development
4. **Update this handover** with actual results and any issues encountered
5. **Notify master agent** that infrastructure is ready

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/infrastructure-setup

# Commit configuration files
git add implementation/SETUP-NOTES.md
git commit -m "feat(infra): Complete infrastructure setup for Container 200"

# Push to remote
git push -u origin feature/infrastructure-setup

# Create status update
cp templates/TEMPLATE-status-update.md .subagents/STATUS-infrastructure-setup.md
# Fill in the template and commit
```

## Environment Variables Template

Save to `/opt/psa-platform/.env`:

```env
NODE_ENV=development

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

# Email (optional for now)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@psa-platform.local
SMTP_PASSWORD=smtp_password
```

## Troubleshooting Guide

**PostgreSQL won't start:**
- Check logs: `journalctl -u postgresql -n 50`
- Verify disk space: `df -h`
- Check config: `sudo -u postgres psql -c "SHOW config_file;"`

**Redis connection refused:**
- Check if running: `systemctl status redis-server`
- Verify bind address in `/etc/redis/redis.conf`
- Check firewall: `iptables -L`

**RabbitMQ management UI not accessible:**
- Check plugin enabled: `rabbitmq-plugins list`
- Verify port: `netstat -tulpn | grep 15672`
- Check logs: `journalctl -u rabbitmq-server -n 50`

**Elasticsearch not starting:**
- Check JVM heap settings: `/etc/elasticsearch/jvm.options.d/heap.options`
- Verify memory: `free -h`
- Check logs: `tail -f /var/log/elasticsearch/psa-platform.log`

## Support

If you encounter issues:
1. Check the troubleshooting section in `implementation/00-DEPLOYMENT-STRATEGY.md`
2. Review `implementation/01-MODULE-Infrastructure.md` for detailed guidance
3. Create an issue using `templates/TEMPLATE-issue.md`
4. Tag master agent for assistance

## Next Steps (After Completion)

The following sub-agents can start their work once infrastructure is ready:
1. **Auth Module Sub-Agent** - Can start immediately
2. **API Gateway Sub-Agent** - Depends on Auth
3. **CRM Module Sub-Agent** - Depends on Auth + API Gateway
4. **Tickets Module Sub-Agent** - Depends on Auth + CRM

---

**Status:** 🟡 Assigned - Waiting to start
**Last Updated:** 2025-11-04
**Assigned To:** Infrastructure Sub-Agent
**Estimated Completion:** 2025-11-04 EOD
