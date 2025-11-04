#!/bin/bash
# PSA Platform Health Check Script
# Location: /usr/local/bin/psa-health-check.sh

echo "=== PSA Platform Health Check ==="
echo "Date: $(date)"
echo ""

# PostgreSQL
echo -n "PostgreSQL: "
if PGPASSWORD='jsmWYseB8ao7n36f9VTpLiMBFnWyJMtE' psql -h localhost -U psa_app -d psa_platform -c "SELECT 1" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
fi

# Redis
echo -n "Redis: "
if redis-cli -a 'uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C' PING 2>/dev/null | grep -q PONG; then
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

# Node.js
echo -n "Node.js: "
if command -v node > /dev/null 2>&1; then
  echo "✓ OK ($(node --version))"
else
  echo "✗ FAILED"
fi

# PM2
echo -n "PM2: "
if command -v pm2 > /dev/null 2>&1; then
  echo "✓ OK ($(pm2 --version))"
else
  echo "✗ FAILED"
fi

echo ""
echo "=== Resource Usage ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "RAM: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo ""
echo "=== Database Info ==="
echo "Tables: $(PGPASSWORD='jsmWYseB8ao7n36f9VTpLiMBFnWyJMtE' psql -h localhost -U psa_app -d psa_platform -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")"
