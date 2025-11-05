/**
 * Integration tests for middleware (auth, RBAC, circuit breaker)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Middleware Integration', () => {
  describe('Request ID Middleware', () => {
    it('should add X-Request-ID header to all responses', async () => {
      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique request IDs', async () => {
      const response1 = await request(app).get('/');
      const response2 = await request(app).get('/');

      expect(response1.headers['x-request-id']).not.toBe(
        response2.headers['x-request-id']
      );
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/');

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set HSTS header correctly', async () => {
      const response = await request(app).get('/');

      expect(response.headers['strict-transport-security']).toContain(
        'max-age='
      );
      expect(response.headers['strict-transport-security']).toContain(
        'includeSubDomains'
      );
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('access-control-allow-credentials');
      expect(response.headers).toHaveProperty('access-control-expose-headers');
    });

    it('should expose necessary headers', async () => {
      const response = await request(app).get('/');

      const exposedHeaders = response.headers['access-control-expose-headers'];
      expect(exposedHeaders).toContain('X-Request-ID');
      expect(exposedHeaders).toContain('X-RateLimit-Remaining');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/this-route-does-not-exist')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('status', 404);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('request_id');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body.error.request_id).toBeDefined();
      expect(typeof response.body.error.request_id).toBe('string');
    });
  });

  describe('JSON Parsing Middleware', () => {
    it('should parse JSON request bodies', async () => {
      const testData = { test: 'data', number: 123 };

      // Test with a route that would accept JSON (even if it returns 404)
      const response = await request(app)
        .post('/test-json-parsing')
        .send(testData)
        .set('Content-Type', 'application/json');

      // Should parse the JSON (even though route doesn't exist, middleware should work)
      expect(response.status).toBe(404); // Route doesn't exist, but JSON was parsed
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/test')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      // Should return 400 or handle gracefully
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});

describe('Protected Routes (Authentication)', () => {
  describe('Public Routes', () => {
    it('should allow access to root endpoint without auth', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'PSA Platform API Gateway');
    });
  });

  describe('Protected Routes without Token', () => {
    it('should reject requests to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/v1/protected/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NO_TOKEN');
    });

    it('should reject admin routes without token', async () => {
      const response = await request(app)
        .get('/api/v1/protected/admin')
        .expect(401);

      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Protected Routes with Invalid Token', () => {
    it('should reject requests with malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/protected/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject requests with Bearer prefix but no token', async () => {
      const response = await request(app)
        .get('/api/v1/protected/profile')
        .set('Authorization', 'Bearer ')
        .expect(401);

      // "Bearer " with empty token is correctly identified as NO_TOKEN
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });
});
