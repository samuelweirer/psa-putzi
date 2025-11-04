#!/bin/bash
# PSA Platform Backup Script
# Location: /usr/local/bin/psa-backup.sh
# Schedule: Daily at 2 AM via cron

BACKUP_DIR="/opt/psa-platform/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting PSA Platform backup at $DATE..."

# 1. PostgreSQL Backup
echo "Backing up PostgreSQL..."
PGPASSWORD='jsmWYseB8ao7n36f9VTpLiMBFnWyJMtE' pg_dump -h localhost -U psa_app psa_platform | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

if [ $? -eq 0 ]; then
  echo "  ✓ PostgreSQL backup complete"
else
  echo "  ✗ PostgreSQL backup failed"
fi

# 2. Redis Backup
echo "Backing up Redis..."
redis-cli -a 'uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C' SAVE > /dev/null 2>&1
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "  ✓ Redis backup complete"
else
  echo "  ✗ Redis backup failed"
fi

# 3. RabbitMQ Backup
echo "Backing up RabbitMQ definitions..."
rabbitmqctl export_definitions "$BACKUP_DIR/rabbitmq_$DATE.json" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "  ✓ RabbitMQ backup complete"
else
  echo "  ✗ RabbitMQ backup failed"
fi

# 4. Configuration Backup
echo "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  /opt/psa-platform/.env 2>/dev/null \
  /etc/postgresql/15/main/postgresql.conf \
  /etc/redis/redis-minimal.conf \
  2>/dev/null

if [ $? -eq 0 ]; then
  echo "  ✓ Configuration backup complete"
else
  echo "  ✗ Configuration backup failed"
fi

# 5. Clean old backups (keep 7 days)
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.json" -mtime +7 -delete

echo "Backup completed at $(date)"
echo "Backup location: $BACKUP_DIR"
echo ""
ls -lh "$BACKUP_DIR" | tail -10
