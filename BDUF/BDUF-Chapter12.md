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
