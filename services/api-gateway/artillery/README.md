# Load Testing Configuration

This directory contains Artillery load testing configurations for the PSA Platform API Gateway.

## Test Scenarios

### 1. Basic Load Test (`load-test-basic.yml`)

Tests normal API Gateway traffic patterns.

**Configuration:**
- Duration: 2 minutes
- Virtual users: 5-10 concurrent
- Request rate: 10-20 RPS
- Scenarios: Health checks, API calls, 404s, mixed traffic

**Performance Targets:**
- Max error rate: 1%
- p95: < 200ms
- p99: < 500ms

**Run:**
```bash
npm run loadtest:basic
```

**Scenarios (weighted):**
- 20% Health checks
- 30% Root endpoint
- 15% Protected routes (401s)
- 10% 404 errors
- 10% Detailed health
- 5% API docs
- 5% OpenAPI spec
- 5% Mixed traffic

### 2. Spike Test (`load-test-spike.yml`)

Tests API Gateway behavior under sudden traffic spikes.

**Configuration:**
- Duration: 3 minutes
- Phases: Normal (10 RPS) → Spike (100 RPS) → Normal → Spike (80 RPS)
- Tests: Circuit breaker activation and recovery

**Performance Targets:**
- Max error rate: 5% (lenient for spikes)
- p95: < 500ms
- p99: < 2s

**Run:**
```bash
npm run loadtest:spike
```

**Purpose:**
- Validate circuit breaker triggers correctly
- Test rate limiting under load
- Verify graceful degradation
- Ensure recovery after spike

### 3. Stress Test (`load-test-stress.yml`)

Tests API Gateway maximum capacity and breaking point.

**Configuration:**
- Duration: 5 minutes
- Ramp up: 20 → 50 → 100 → 150 → 200 RPS
- Peak: 200 RPS sustained for 1 minute
- Purpose: Find breaking point

**Performance Targets:**
- Max error rate: 10% (stress allows failures)
- p95: < 1s
- p99: < 5s

**Run:**
```bash
npm run loadtest:stress
```

**Purpose:**
- Identify maximum throughput
- Find resource bottlenecks
- Test system under extreme load
- Validate error handling at capacity

### 4. Quick Test

Quick 1000-request test for rapid validation.

**Run:**
```bash
npm run loadtest:quick
```

## Interpreting Results

### Key Metrics

**Request Rate:**
- Actual requests per second achieved
- Should match or exceed configured `arrivalRate`

**Response Time:**
- `mean`: Average response time (should be < 50ms)
- `median`: 50th percentile (should be < 20ms)
- `p95`: 95th percentile (should be < 200ms)
- `p99`: 99th percentile (should be < 500ms)

**Error Rate:**
- `http.codes.XXX`: Count of each HTTP status code
- `vusers.failed`: Number of failed virtual users
- Target: < 1% for normal load, < 5% for spikes

**Throughput:**
- `http.requests`: Total requests completed
- `http.request_rate`: Requests per second
- Target: > 100 RPS sustained

### Sample Good Result

```
http.codes.200: ................................ 1000
http.request_rate: .............................. 964/sec
http.response_time:
  mean: ......................................... 1.2ms
  median: ....................................... 1ms
  p95: .......................................... 3ms
  p99: .......................................... 4ms
vusers.failed: .................................. 0
```

### Warning Signs

**High Response Times:**
- p95 > 200ms: CPU or I/O bottleneck
- p99 > 1s: Database or external service slow

**High Error Rates:**
- > 1% errors: Check logs for issues
- 5xx errors: Backend service problems
- 429 errors: Rate limiting triggered (expected under load)

**Low Throughput:**
- < 100 RPS: May indicate resource constraints
- Check CPU, memory, Redis performance

## Custom Test Configuration

Create a custom test by copying an existing configuration:

```bash
cp load-test-basic.yml load-test-custom.yml
```

Edit the configuration:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 20
      name: "Custom load"

scenarios:
  - name: "Your scenario"
    flow:
      - get:
          url: "/your-endpoint"
          expect:
            - statusCode: 200
```

Run custom test:
```bash
artillery run artillery/load-test-custom.yml
```

## Advanced Features

### Environment Variables

Override target URL:
```bash
artillery run -e production load-test-basic.yml
```

In YAML:
```yaml
config:
  environments:
    production:
      target: "https://api.production.com"
    staging:
      target: "https://api.staging.com"
```

### Custom Plugins

Artillery supports plugins for extended functionality:
- `metrics-by-endpoint`: Track metrics per endpoint
- `expect`: Validate responses
- `publish-metrics`: Send to external monitoring

### Output Formats

**JSON Report:**
```bash
artillery run load-test-basic.yml -o report.json
```

**HTML Report:**
```bash
npm install -g artillery-plugin-html-report
artillery run load-test-basic.yml -o report.json
artillery report report.json
```

## CI/CD Integration

Run load tests in CI/CD pipeline:

```yaml
# .github/workflows/loadtest.yml
- name: Run load tests
  run: |
    npm run loadtest:basic
    if [ $? -ne 0 ]; then
      echo "Load tests failed"
      exit 1
    fi
```

## Continuous Load Testing

Run tests continuously for long-duration testing:

```bash
# Run basic test in loop
while true; do
  npm run loadtest:basic
  sleep 300  # 5 minutes between runs
done
```

## Performance Baselines

Establish baselines by running tests regularly:

```bash
# Daily baseline test
artillery run load-test-basic.yml -o baseline-$(date +%Y%m%d).json
```

Compare results over time to detect performance regressions.

## Troubleshooting

### High Error Rates

1. Check API Gateway logs:
   ```bash
   npm run pm2:logs
   ```

2. Check detailed health:
   ```bash
   curl http://localhost:3000/health/detailed
   ```

3. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

### Low Throughput

1. Check CPU usage:
   ```bash
   top
   ```

2. Increase PM2 instances in `ecosystem.config.js`:
   ```javascript
   instances: 4  // or 'max'
   ```

3. Check for rate limiting (429 errors)

### Connection Errors

1. Verify API Gateway is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check port availability:
   ```bash
   lsof -i:3000
   ```

3. Increase connection limits if needed

## Best Practices

1. **Start Small**: Begin with quick test, then basic, then spike/stress
2. **Monitor Resources**: Watch CPU, memory, Redis during tests
3. **Baseline First**: Establish baseline before making changes
4. **Test Regularly**: Run tests after every significant change
5. **Document Results**: Keep records of test results for comparison
6. **Realistic Scenarios**: Mirror production traffic patterns
7. **Gradual Ramps**: Use rampTo instead of sudden jumps
8. **Clean Between Tests**: Clear Redis rate limits between runs

## References

- [Artillery Documentation](https://www.artillery.io/docs)
- [API Gateway Documentation](../README.md)
- [Deployment Guide](../DEPLOYMENT.md)
