/**
 * Simple Load Test Script for Tickets Service
 * Tests health endpoint and basic API performance
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 3003,
  totalRequests: 1000,
  concurrency: 50,
  endpoints: [
    { path: '/health', method: 'GET', description: 'Health check' },
  ],
};

class LoadTester {
  constructor(config) {
    this.config = config;
    this.results = {
      total: 0,
      success: 0,
      errors: 0,
      responseTimes: [],
      errorDetails: {},
    };
  }

  async makeRequest(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          this.results.total++;
          this.results.responseTimes.push(responseTime);

          if (res.statusCode === 200) {
            this.results.success++;
          } else {
            this.results.errors++;
            const errorKey = `HTTP ${res.statusCode}`;
            this.results.errorDetails[errorKey] = (this.results.errorDetails[errorKey] || 0) + 1;
          }

          resolve({ statusCode: res.statusCode, responseTime });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.results.total++;
        this.results.errors++;
        this.results.responseTimes.push(responseTime);

        const errorKey = error.code || 'UNKNOWN_ERROR';
        this.results.errorDetails[errorKey] = (this.results.errorDetails[errorKey] || 0) + 1;

        resolve({ error: error.message, responseTime });
      });

      req.end();
    });
  }

  async runBatch(endpoint, count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.makeRequest(endpoint));
    }
    return Promise.all(promises);
  }

  async runLoadTest() {
    console.log('🚀 Starting Load Test');
    console.log('='.repeat(60));
    console.log(`Host: ${this.config.host}:${this.config.port}`);
    console.log(`Total Requests: ${this.config.totalRequests}`);
    console.log(`Concurrency: ${this.config.concurrency}`);
    console.log('='.repeat(60));
    console.log('');

    for (const endpoint of this.config.endpoints) {
      console.log(`\n📊 Testing: ${endpoint.method} ${endpoint.path}`);
      console.log(`   ${endpoint.description}`);
      console.log('');

      this.results = {
        total: 0,
        success: 0,
        errors: 0,
        responseTimes: [],
        errorDetails: {},
      };

      const startTime = Date.now();
      const batches = Math.ceil(this.config.totalRequests / this.config.concurrency);

      for (let i = 0; i < batches; i++) {
        const batchSize = Math.min(
          this.config.concurrency,
          this.config.totalRequests - (i * this.config.concurrency)
        );
        await this.runBatch(endpoint, batchSize);

        // Progress indicator
        const progress = Math.floor((this.results.total / this.config.totalRequests) * 100);
        process.stdout.write(`\r   Progress: ${progress}% (${this.results.total}/${this.config.totalRequests} requests)`);
      }

      const duration = (Date.now() - startTime) / 1000;
      this.printResults(endpoint, duration);
    }
  }

  printResults(endpoint, duration) {
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const avg = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const min = Math.min(...sortedTimes);
    const max = Math.max(...sortedTimes);
    const rps = (this.results.total / duration).toFixed(2);
    const errorRate = ((this.results.errors / this.results.total) * 100).toFixed(2);

    console.log('\n');
    console.log('='.repeat(60));
    console.log('📈 RESULTS');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Endpoint:          ${endpoint.method} ${endpoint.path}`);
    console.log(`Duration:          ${duration.toFixed(2)}s`);
    console.log('');
    console.log('Requests:');
    console.log(`  Total:           ${this.results.total}`);
    console.log(`  Success:         ${this.results.success} (${(100 - parseFloat(errorRate)).toFixed(2)}%)`);
    console.log(`  Errors:          ${this.results.errors} (${errorRate}%)`);
    console.log(`  Requests/sec:    ${rps}`);
    console.log('');
    console.log('Response Times (ms):');
    console.log(`  Min:             ${min.toFixed(2)}`);
    console.log(`  Avg:             ${avg.toFixed(2)}`);
    console.log(`  Median:          ${median.toFixed(2)}`);
    console.log(`  P95:             ${p95.toFixed(2)}`);
    console.log(`  P99:             ${p99.toFixed(2)}`);
    console.log(`  Max:             ${max.toFixed(2)}`);

    if (this.results.errors > 0) {
      console.log('');
      console.log('Errors:');
      Object.entries(this.results.errorDetails).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
    }

    console.log('');
    console.log('='.repeat(60));

    // Performance assessment
    console.log('\n');
    this.assessPerformance(avg, errorRate, rps);
  }

  assessPerformance(avgResponseTime, errorRate, rps) {
    console.log('✨ PERFORMANCE ASSESSMENT:');
    console.log('');

    let status = '✅ EXCELLENT';
    if (avgResponseTime > 100 || errorRate > 1 || rps < 100) {
      status = '⚠️  NEEDS IMPROVEMENT';
    }
    if (avgResponseTime > 500 || errorRate > 5 || rps < 50) {
      status = '🔴 POOR';
    }

    console.log(`Overall Status: ${status}`);
    console.log('');

    if (avgResponseTime < 50) {
      console.log('✅ Response Time: Excellent (< 50ms avg)');
    } else if (avgResponseTime < 100) {
      console.log('✅ Response Time: Good (< 100ms avg)');
    } else if (avgResponseTime < 500) {
      console.log('⚠️  Response Time: Acceptable (< 500ms avg)');
    } else {
      console.log('🔴 Response Time: Poor (> 500ms avg)');
    }

    if (errorRate === 0) {
      console.log('✅ Error Rate: Perfect (0% errors)');
    } else if (errorRate < 1) {
      console.log('✅ Error Rate: Excellent (< 1%)');
    } else if (errorRate < 5) {
      console.log('⚠️  Error Rate: Acceptable (< 5%)');
    } else {
      console.log('🔴 Error Rate: High (> 5%)');
    }

    if (rps > 500) {
      console.log('✅ Throughput: Excellent (> 500 RPS)');
    } else if (rps > 100) {
      console.log('✅ Throughput: Good (> 100 RPS)');
    } else if (rps > 50) {
      console.log('⚠️  Throughput: Acceptable (> 50 RPS)');
    } else {
      console.log('🔴 Throughput: Low (< 50 RPS)');
    }

    console.log('');
  }
}

// Run the load test
const tester = new LoadTester(config);
tester.runLoadTest().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
