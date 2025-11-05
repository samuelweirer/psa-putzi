/**
 * Integration tests for health check endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'psa-api-gateway');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should not be rate limited', async () => {
      // Make multiple requests to verify health check bypasses rate limiting
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
      }
    });

    it('should include X-Request-ID header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(typeof response.headers['x-request-id']).toBe('string');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status with circuit breakers', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service', 'psa-api-gateway');
      expect(response.body).toHaveProperty('circuitBreakers');
      expect(response.body).toHaveProperty('summary');

      // Verify summary structure
      expect(response.body.summary).toHaveProperty('totalCircuits');
      expect(response.body.summary).toHaveProperty('openCircuits');
      expect(response.body.summary).toHaveProperty('halfOpenCircuits');
      expect(response.body.summary).toHaveProperty('closedCircuits');
    });

    it('should show circuit breaker details for each service', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const circuitBreakers = response.body.circuitBreakers;
      expect(typeof circuitBreakers).toBe('object');

      // If there are any circuit breakers, verify their structure
      if (Object.keys(circuitBreakers).length > 0) {
        const firstCircuit = Object.values(circuitBreakers)[0] as any;
        expect(firstCircuit).toHaveProperty('state');
        expect(firstCircuit).toHaveProperty('failures');
        expect(firstCircuit).toHaveProperty('successes');
        expect(firstCircuit).toHaveProperty('totalRequests');
        expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(firstCircuit.state);
      }
    });

    it('should not be rate limited', async () => {
      // Make multiple requests to verify detailed health check bypasses rate limiting
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/health/detailed')
          .expect(200);
      }
    });
  });
});
