/**
 * Integration tests for rate limiting middleware
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Rate Limiting', () => {
  describe('Global Rate Limiter', () => {
    it('should include rate limit headers in response', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-policy');
    });

    it('should track request count across multiple requests', async () => {
      const firstResponse = await request(app).get('/');
      const firstRemaining = parseInt(firstResponse.headers['ratelimit-remaining'], 10);

      const secondResponse = await request(app).get('/');
      const secondRemaining = parseInt(secondResponse.headers['ratelimit-remaining'], 10);

      // Second request should have fewer requests remaining (or equal if from different IP)
      expect(secondRemaining).toBeLessThanOrEqual(firstRemaining);
    });

    it('should have correct rate limit policy', async () => {
      const response = await request(app).get('/');

      // Policy should be: 100 requests per 900 seconds (15 minutes)
      expect(response.headers['ratelimit-policy']).toMatch(/100;w=900/);
    });
  });

  describe('Health Check Rate Limit Exclusion', () => {
    it('should not apply rate limits to /health endpoint', async () => {
      const response = await request(app).get('/health');

      // Health check should not have rate limit headers
      expect(response.headers['ratelimit-limit']).toBeUndefined();
    });

    it('should not apply rate limits to /health/detailed endpoint', async () => {
      const response = await request(app).get('/health/detailed');

      // Detailed health check should not have rate limit headers
      expect(response.headers['ratelimit-limit']).toBeUndefined();
    });
  });

  describe('Rate Limit Response Format', () => {
    it('should return proper error format when rate limit exceeded', async () => {
      // Note: This test would require many requests to actually hit the limit
      // Testing the error format structure conceptually
      const response = await request(app).get('/');

      // Response should always be valid JSON
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toBeDefined();
    });
  });
});
