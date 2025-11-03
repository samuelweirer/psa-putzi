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
