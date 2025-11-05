# API Gateway Deployment Guide

## Overview

The PSA Platform API Gateway is production-ready with PM2 process management and load testing validated.

## Prerequisites

- Node.js 20 LTS or higher
- npm 9+ or yarn 1.22+
- PM2 installed globally: `npm install -g pm2`
- Redis 5+ running and accessible
- Port 3000 available (or configure PORT environment variable)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables:
   ```env
   NODE_ENV=production
   PORT=3000
   SERVICE_NAME=psa-api-gateway

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password

   # Security
   JWT_SECRET=your_jwt_secret_here
   ALLOWED_ORIGINS=https://your-frontend.com,https://your-admin.com

   # Backend Services
   AUTH_SERVICE_URL=http://localhost:3001
   CRM_SERVICE_URL=http://localhost:3002
   TICKETS_SERVICE_URL=http://localhost:3003
   ```

## Building for Production

Build the TypeScript code to JavaScript:

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

## Deployment with PM2

### Start the Application

**Production:**
```bash
npm run pm2:start
```

**Development:**
```bash
npm run pm2:start:dev
```

### PM2 Management Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:status` | Check application status |
| `npm run pm2:logs` | View real-time logs |
| `npm run pm2:monit` | Open PM2 monitoring dashboard |
| `npm run pm2:restart` | Restart application |
| `npm run pm2:reload` | Zero-downtime reload (rebuild + reload) |
| `npm run pm2:stop` | Stop application |
| `npm run pm2:delete` | Remove from PM2 |

### PM2 Configuration

The PM2 configuration is in `ecosystem.config.js`:

- **Instances**: 2 (cluster mode for load balancing)
- **Max Memory**: 500MB per instance
- **Auto-restart**: Enabled
- **Graceful shutdown**: 5 second timeout
- **Logs**: Stored in `./logs/` directory

## Load Testing

### Quick Load Test

Run a quick 1000-request test:
```bash
npm run loadtest:quick
```

### Basic Load Test (2 minutes)

Test normal traffic patterns:
```bash
npm run loadtest:basic
```

**Specifications:**
- Duration: 2 minutes
- Virtual users: 10-20 concurrent
- Request rate: 10-20 RPS
- Scenarios: Health checks, API calls, 404s

### Spike Test (3 minutes)

Test sudden traffic spikes:
```bash
npm run loadtest:spike
```

**Specifications:**
- Duration: 3 minutes
- Peak: 100 RPS (10x normal)
- Tests: Recovery behavior and circuit breaker activation

### Stress Test (5 minutes)

Find maximum capacity:
```bash
npm run loadtest:stress
```

**Specifications:**
- Duration: 5 minutes
- Ramp up: 20 → 200 RPS
- Purpose: Identify breaking point

## Performance Benchmarks

Based on load testing results (single container, 2 PM2 instances):

| Metric | Value |
|--------|-------|
| **Throughput** | 964 requests/second |
| **Mean Response Time** | 1.2ms |
| **Median Response Time** | 1ms |
| **95th Percentile (p95)** | 3ms |
| **99th Percentile (p99)** | 4ms |
| **Error Rate** | 0% |

### Performance Targets

- ✅ Mean response time < 50ms
- ✅ p95 < 200ms
- ✅ p99 < 500ms
- ✅ Error rate < 1%
- ✅ Throughput > 100 RPS

## Health Checks

### Basic Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "psa-api-gateway",
  "version": "1.0.0",
  "uptime": 1234,
  "timestamp": "2025-11-05T12:00:00.000Z",
  "dependencies": {}
}
```

### Detailed Health Check (with Circuit Breakers)

```bash
curl http://localhost:3000/health/detailed
```

Response includes circuit breaker status for all backend services.

## Graceful Shutdown

The application handles graceful shutdown on:
- `SIGTERM` - Sent by PM2 reload
- `SIGINT` - Ctrl+C in terminal
- PM2 `shutdown` message

Shutdown sequence:
1. Stop accepting new connections
2. Wait for active requests to complete
3. Close Redis connection
4. Exit process (max 10 seconds)

## Monitoring

### PM2 Monitoring

Real-time monitoring dashboard:
```bash
npm run pm2:monit
```

### Logs

View logs in real-time:
```bash
npm run pm2:logs
```

Log files are stored in:
- `logs/error.log` - Error logs
- `logs/access.log` - Access logs
- `logs/combined.log` - Combined logs

### Circuit Breaker Status

Check circuit breaker health:
```bash
curl http://localhost:3000/health/detailed | jq '.circuitBreakers'
```

Circuit states:
- **CLOSED**: Normal operation
- **HALF_OPEN**: Testing recovery
- **OPEN**: Service unavailable (503 responses)

## Scaling

### Horizontal Scaling (More Instances)

Edit `ecosystem.config.js`:
```javascript
instances: 4, // or 'max' for all CPU cores
```

Then reload:
```bash
npm run pm2:reload
```

### Load Balancing

PM2 cluster mode automatically load balances across instances.

For multiple servers, use nginx or HAProxy:
```nginx
upstream api_gateway {
    server 192.168.1.200:3000;
    server 192.168.1.201:3000;
    server 192.168.1.202:3000;
}
```

## Troubleshooting

### Application Won't Start

1. Check port availability:
   ```bash
   lsof -i:3000
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   ```

3. Check logs:
   ```bash
   npm run pm2:logs
   ```

### High Memory Usage

1. Check PM2 status:
   ```bash
   npm run pm2:status
   ```

2. Restart if needed:
   ```bash
   npm run pm2:restart
   ```

3. Adjust max memory in `ecosystem.config.js`

### Circuit Breaker Stuck Open

1. Check detailed health:
   ```bash
   curl http://localhost:3000/health/detailed
   ```

2. Verify backend service is running
3. Circuit will auto-recover in 30 seconds if service is healthy

### Rate Limit Exceeded

Rate limits (per 15 minutes):
- Global: 100 requests per IP
- Auth: 5 failed login attempts per IP
- Authenticated: 1000 requests per user

Clear Redis to reset:
```bash
redis-cli FLUSHDB
```

## Security Checklist

- [ ] JWT_SECRET set to strong random value
- [ ] ALLOWED_ORIGINS configured for your domains
- [ ] Redis password set (REDIS_PASSWORD)
- [ ] HTTPS enabled (via nginx/reverse proxy)
- [ ] Firewall rules configured (only ports 80/443 public)
- [ ] PM2 logs rotated (logrotate)
- [ ] Rate limiting tested and working
- [ ] Backend service URLs use internal network

## Production Deployment Checklist

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] Environment variables configured
- [ ] Redis connection verified
- [ ] PM2 started: `npm run pm2:start`
- [ ] Health check responds: `curl http://localhost:3000/health`
- [ ] Load test completed successfully
- [ ] Logs are being written
- [ ] Circuit breakers tested
- [ ] Rate limiting validated
- [ ] Monitoring configured

## Rollback Procedure

If deployment fails:

1. Stop current version:
   ```bash
   npm run pm2:stop
   ```

2. Checkout previous version:
   ```bash
   git checkout <previous-commit>
   ```

3. Rebuild and restart:
   ```bash
   npm run build
   npm run pm2:start
   ```

## Support

For issues:
1. Check logs: `npm run pm2:logs`
2. Check health: `curl http://localhost:3000/health/detailed`
3. Review troubleshooting section above
4. Contact PSA Platform Team

## Related Documentation

- [API Documentation](http://localhost:3000/api-docs)
- [OpenAPI Spec](http://localhost:3000/api-docs.json)
- [Architecture Documentation](../../BDUF/BDUF-Chapter2.md)
- [Security Documentation](../../BDUF/BDUF-Chapter5.md)
