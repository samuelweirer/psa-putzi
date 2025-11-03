## 6. CONTAINER-ARCHITEKTUR (LXC)

### 6.1 LXC-Template-Erstellung

**Base-Template (Debian 12):**
```bash
#!/bin/bash
# create-psa-template.sh

# Create base container
pct create 9000 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
    --hostname psa-template \
    --memory 2048 \
    --cores 2 \
    --storage local-lvm \
    --rootfs local-lvm:8 \
    --unprivileged 1 \
    --features nesting=1

# Start container
pct start 9000

# Wait for boot
sleep 10

# Install base packages
pct exec 9000 -- bash -c "
    apt-get update
    apt-get upgrade -y
    apt-get install -y \
        curl \
        wget \
        git \
        vim \
        htop \
        net-tools \
        ca-certificates \
        gnupg \
        lsb-release
"

# Install Node.js 20 LTS
pct exec 9000 -- bash -c "
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g npm@latest
    npm install -g pm2
"

# Create app user
pct exec 9000 -- bash -c "
    useradd -m -s /bin/bash psa
    mkdir -p /opt/psa
    chown psa:psa /opt/psa
"

# Configure systemd service
pct exec 9000 -- bash -c "
    cat > /etc/systemd/system/psa.service <<EOF
[Unit]
Description=PSA Platform Service
After=network.target

[Service]
Type=forking
User=psa
WorkingDirectory=/opt/psa
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable psa.service
"

# Cleanup
pct exec 9000 -- bash -c "
    apt-get clean
    rm -rf /var/lib/apt/lists/*
    history -c
"

# Stop container
pct stop 9000

# Convert to template
vzdump 9000 --compress zstd --mode stop --dumpdir /var/lib/vz/template/cache
mv /var/lib/vz/template/cache/vzdump-lxc-9000*.tar.zst \
   /var/lib/vz/template/cache/psa-base-template.tar.zst

# Remove temporary container
pct destroy 9000

echo "✅ Template created: psa-base-template.tar.zst"
```

### 6.2 Service-Deployment

**CRM-Service-Deployment:**
```bash
#!/bin/bash
# deploy-crm-service.sh

# Create CRM container from template
pct create 101 local:vztmpl/psa-base-template.tar.zst \
    --hostname psa-crm \
    --memory 4096 \
    --cores 2 \
    --storage local-lvm \
    --rootfs local-lvm:30 \
    --net0 name=eth0,bridge=vmbr1,ip=10.0.10.11/24,gw=10.0.10.1 \
    --nameserver 10.0.10.1 \
    --searchdomain psa.local \
    --unprivileged 1

# Start container
pct start 101

# Wait for network
sleep 15

# Deploy application
pct exec 101 -- bash -c "
    cd /opt/psa
    git clone https://gitlab.internal/psa/crm-service.git .
    npm ci --production
    cp .env.production .env
"

# Start service
pct exec 101 -- systemctl start psa.service

# Verify
pct exec 101 -- pm2 status

echo "✅ CRM Service deployed on 10.0.10.11"
```

### 6.3 Container-Monitoring

**Resource-Limits:**
```bash
# Set CPU limit (2 cores)
pct set 101 --cores 2 --cpulimit 2

# Set memory limit (4GB)
pct set 101 --memory 4096 --swap 0

# Set disk I/O limits
pct set 101 --rootfs local-lvm:30,size=30G,iops_rd=1000,iops_wr=1000

# Set network bandwidth limit (100 Mbps)
pct set 101 --net0 name=eth0,bridge=vmbr1,rate=100
```

**Health-Checks:**
```bash
#!/bin/bash
# health-check.sh

CONTAINER_ID=101
SERVICE_URL="http://10.0.10.11:3000/health"

# Check container status
if ! pct status $CONTAINER_ID | grep -q "running"; then
    echo "❌ Container $CONTAINER_ID is not running"
    pct start $CONTAINER_ID
    exit 1
fi

# Check service health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Service health check failed (HTTP $HTTP_CODE)"
    pct exec $CONTAINER_ID -- systemctl restart psa.service
    exit 1
fi

echo "✅ Container $CONTAINER_ID is healthy"
```

---
