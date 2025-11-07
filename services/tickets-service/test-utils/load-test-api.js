/**
 * Comprehensive API Load Test for Tickets Service
 * Tests actual API operations with authentication
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 3003,
  totalRequests: 500,
  concurrency: 25,

  // Mock JWT token for testing (replace with real token in production)
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJ0ZW5hbnRfaWQiOiJ0ZXN0LXRlbmFudCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ0ZWNobmljaWFuIiwiaWF0IjoxNzAwMDAwMDAwfQ.test',
};

// Test scenarios
const scenarios = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    requiresAuth: false,
    weight: 10, // 10% of requests
  },
  {
    name: 'List Tickets (Pagination)',
    method: 'GET',
    path: '/api/v1/tickets?page=1&limit=20',
    requiresAuth: true,
    weight: 30, // 30% of requests
  },
  {
    name: 'Get Ticket Details',
    method: 'GET',
    path: '/api/v1/tickets/test-ticket-id',
    requiresAuth: true,
    weight: 25, // 25% of requests
  },
  {
    name: 'Get Ticket Activity',
    method: 'GET',
    path: '/api/v1/tickets/test-ticket-id/activity',
    requiresAuth: true,
    weight: 15, // 15% of requests
  },
  {
    name: 'List Time Entries',
    method: 'GET',
    path: '/api/v1/tickets/test-ticket-id/time-entries',
    requiresAuth: true,
    weight: 10, // 10% of requests
  },
  {
    name: 'List Comments',
    method: 'GET',
    path: '/api/v1/tickets/test-ticket-id/comments',
    requiresAuth: true,
    weight: 10, // 10% of requests
  },
];

class APILoadTester {
  constructor(config, scenarios) {
    this.config = config;
    this.scenarios = scenarios;
    this.results = {
      byScenario: {},
      overall: {
        total: 0,
        success: 0,
        errors: 0,
        responseTimes: [],
        errorDetails: {},
        statusCodes: {},
      },
    };

    // Initialize scenario results
    scenarios.forEach(scenario => {
      this.results.byScenario[scenario.name] = {
        total: 0,
        success: 0,
        errors: 0,
        responseTimes: [],
        errorDetails: {},
        statusCodes: {},
      };
    });
  }

  selectScenario() {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const scenario of this.scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }

    return this.scenarios[0];
  }

  async makeRequest(scenario) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const headers = {
        'Content-Type': 'application/json',
      };

      if (scenario.requiresAuth) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: scenario.path,
        method: scenario.method,
        headers,
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const scenarioResults = this.results.byScenario[scenario.name];

          // Update scenario-specific results
          scenarioResults.total++;
          scenarioResults.responseTimes.push(responseTime);
          scenarioResults.statusCodes[res.statusCode] =
            (scenarioResults.statusCodes[res.statusCode] || 0) + 1;

          // Update overall results
          this.results.overall.total++;
          this.results.overall.responseTimes.push(responseTime);
          this.results.overall.statusCodes[res.statusCode] =
            (this.results.overall.statusCodes[res.statusCode] || 0) + 1;

          if (res.statusCode >= 200 && res.statusCode < 400) {
            scenarioResults.success++;
            this.results.overall.success++;
          } else {
            scenarioResults.errors++;
            this.results.overall.errors++;

            const errorKey = `HTTP ${res.statusCode}`;
            scenarioResults.errorDetails[errorKey] =
              (scenarioResults.errorDetails[errorKey] || 0) + 1;
            this.results.overall.errorDetails[errorKey] =
              (this.results.overall.errorDetails[errorKey] || 0) + 1;
          }

          resolve({ statusCode: res.statusCode, responseTime, scenario: scenario.name });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        const scenarioResults = this.results.byScenario[scenario.name];

        scenarioResults.total++;
        scenarioResults.errors++;
        scenarioResults.responseTimes.push(responseTime);

        this.results.overall.total++;
        this.results.overall.errors++;
        this.results.overall.responseTimes.push(responseTime);

        const errorKey = error.code || 'UNKNOWN_ERROR';
        scenarioResults.errorDetails[errorKey] =
          (scenarioResults.errorDetails[errorKey] || 0) + 1;
        this.results.overall.errorDetails[errorKey] =
          (this.results.overall.errorDetails[errorKey] || 0) + 1;

        resolve({ error: error.message, responseTime, scenario: scenario.name });
      });

      req.end();
    });
  }

  async runBatch(count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      const scenario = this.selectScenario();
      promises.push(this.makeRequest(scenario));
    }
    return Promise.all(promises);
  }

  calculateStats(responseTimes) {
    if (responseTimes.length === 0) {
      return { avg: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...responseTimes].sort((a, b) => a - b);
    return {
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: Math.min(...sorted),
      max: Math.max(...sorted),
    };
  }

  async runLoadTest() {
    console.log('🚀 Starting Comprehensive API Load Test');
    console.log('='.repeat(70));
    console.log(`Host:             ${this.config.host}:${this.config.port}`);
    console.log(`Total Requests:   ${this.config.totalRequests}`);
    console.log(`Concurrency:      ${this.config.concurrency}`);
    console.log(`Scenarios:        ${this.scenarios.length}`);
    console.log('='.repeat(70));
    console.log('');

    console.log('📋 Test Scenarios:');
    this.scenarios.forEach(scenario => {
      console.log(`   ${scenario.weight}% - ${scenario.name} (${scenario.method} ${scenario.path})`);
    });
    console.log('');

    const startTime = Date.now();
    const batches = Math.ceil(this.config.totalRequests / this.config.concurrency);

    for (let i = 0; i < batches; i++) {
      const batchSize = Math.min(
        this.config.concurrency,
        this.config.totalRequests - (i * this.config.concurrency)
      );
      await this.runBatch(batchSize);

      const progress = Math.floor((this.results.overall.total / this.config.totalRequests) * 100);
      process.stdout.write(`\r   Progress: ${progress}% (${this.results.overall.total}/${this.config.totalRequests} requests)`);
    }

    const duration = (Date.now() - startTime) / 1000;
    this.printResults(duration);
  }

  printResults(duration) {
    console.log('\n');
    console.log('='.repeat(70));
    console.log('📊 OVERALL RESULTS');
    console.log('='.repeat(70));
    console.log('');

    const stats = this.calculateStats(this.results.overall.responseTimes);
    const rps = (this.results.overall.total / duration).toFixed(2);
    const errorRate = ((this.results.overall.errors / this.results.overall.total) * 100).toFixed(2);

    console.log(`Duration:         ${duration.toFixed(2)}s`);
    console.log('');
    console.log('Requests:');
    console.log(`  Total:          ${this.results.overall.total}`);
    console.log(`  Success:        ${this.results.overall.success} (${(100 - parseFloat(errorRate)).toFixed(2)}%)`);
    console.log(`  Errors:         ${this.results.overall.errors} (${errorRate}%)`);
    console.log(`  Requests/sec:   ${rps}`);
    console.log('');
    console.log('Response Times (ms):');
    console.log(`  Min:            ${stats.min.toFixed(2)}`);
    console.log(`  Avg:            ${stats.avg.toFixed(2)}`);
    console.log(`  Median:         ${stats.median.toFixed(2)}`);
    console.log(`  P95:            ${stats.p95.toFixed(2)}`);
    console.log(`  P99:            ${stats.p99.toFixed(2)}`);
    console.log(`  Max:            ${stats.max.toFixed(2)}`);
    console.log('');

    console.log('Status Code Distribution:');
    Object.entries(this.results.overall.statusCodes)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([code, count]) => {
        const percentage = ((count / this.results.overall.total) * 100).toFixed(1);
        console.log(`  ${code}: ${count} (${percentage}%)`);
      });

    if (this.results.overall.errors > 0) {
      console.log('');
      console.log('Error Details:');
      Object.entries(this.results.overall.errorDetails).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('📈 RESULTS BY SCENARIO');
    console.log('='.repeat(70));
    console.log('');

    this.scenarios.forEach(scenario => {
      const results = this.results.byScenario[scenario.name];
      if (results.total === 0) return;

      const scenarioStats = this.calculateStats(results.responseTimes);
      const scenarioErrorRate = ((results.errors / results.total) * 100).toFixed(2);

      console.log(`${scenario.name}:`);
      console.log(`  Requests: ${results.total} (${results.success} success, ${results.errors} errors)`);
      console.log(`  Error Rate: ${scenarioErrorRate}%`);
      console.log(`  Avg Response: ${scenarioStats.avg.toFixed(2)}ms`);
      console.log(`  P95: ${scenarioStats.p95.toFixed(2)}ms`);

      if (results.errors > 0) {
        console.log(`  Errors: ${Object.entries(results.errorDetails).map(([k, v]) => `${k}(${v})`).join(', ')}`);
      }
      console.log('');
    });

    console.log('='.repeat(70));
    this.assessPerformance(stats.avg, errorRate, rps);
  }

  assessPerformance(avgResponseTime, errorRate, rps) {
    console.log('');
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

    if (errorRate === 0 || errorRate === '0.00') {
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
    console.log('📝 NOTES:');
    console.log('  - All non-200 responses (401, 404) are counted as errors in this test');
    console.log('  - This is expected for endpoints without valid test data');
    console.log('  - The important metric is response time and throughput');
    console.log('  - For accurate success rates, use real test data and authentication');
    console.log('');
  }
}

// Run the load test
const tester = new APILoadTester(config, scenarios);
tester.runLoadTest().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
