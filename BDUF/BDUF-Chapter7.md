## 7. NETZWERK-ARCHITEKTUR (DETAILLIERT)

### 7.1 VLAN-Konfiguration

**pfsense VLAN-Setup:**
```
VLAN 10 - Management (10.0.10.0/24)
- Gateway: 10.0.10.1
- DHCP: 10.0.10.100-10.0.10.200
- DNS: 10.0.10.1

VLAN 20 - Services (10.0.20.0/24)
- Gateway: 10.0.20.1
- Static IPs only
- DNS: 10.0.20.1

VLAN 30 - Database (10.0.30.0/24)
- Gateway: 10.0.30.1
- Static IPs only
- No internet access

VLAN 40 - DMZ (10.0.40.0/24)
- Gateway: 10.0.40.1
- Internet-facing services
- Strict firewall rules

VLAN 50 - Backup (10.0.50.0/24)
- Gateway: 10.0.50.1
- Backup traffic only
```

**Firewall-Rules (pfsense):**
```
# VLAN 10 (Management) → VLAN 20 (Services)
allow tcp from 10.0.10.0/24 to 10.0.20.0/24 port 3000-3010

# VLAN 20 (Services) → VLAN 30 (Database)
allow tcp from 10.0.20.0/24 to 10.0.30.10 port 5432  # PostgreSQL
allow tcp from 10.0.20.0/24 to 10.0.30.12 port 6379  # Redis

# VLAN 40 (DMZ) → VLAN 20 (Services)
allow tcp from 10.0.40.10 to 10.0.20.10 port 3000  # API Gateway

# Block all other inter-VLAN traffic
block from any to any
```

### 7.2 HAProxy-Konfiguration

**haproxy.cfg:**
```
global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # SSL/TLS
    ssl-default-bind-ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option forwardfor
    option http-server-close
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

frontend api_frontend
    bind *:443 ssl crt /etc/haproxy/certs/psa-platform.pem
    bind *:80
    redirect scheme https code 301 if !{ ssl_fc }
    
    # Security Headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    http-response set-header X-Frame-Options "DENY"
    http-response set-header X-Content-Type-Options "nosniff"
    http-response set-header X-XSS-Protection "1; mode=block"
    
    # Rate Limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
    
    # ACLs
    acl is_api path_beg /api/
    acl is_health path /health
    
    # Backends
    use_backend api_backend if is_api
    use_backend health_backend if is_health
    default_backend api_backend

backend api_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server api-gw-1 10.0.20.10:3000 check inter 10s fall 3 rise 2
    server api-gw-2 10.0.20.11:3000 check inter 10s fall 3 rise 2 backup

backend health_backend
    server health 127.0.0.1:8080

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats auth admin:secure_password
```

---
