/**
 * Integration Tests for Customer Routes
 *
 * Tests full HTTP request/response cycle for Customer endpoints
 * Covers: Routes, Controllers, Middleware, Validators
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import * as database from '../../src/utils/database';
import jwt from 'jsonwebtoken';
import config from '../../src/utils/config';

// Mock dependencies
vi.mock('../../src/utils/database');
vi.mock('../../src/utils/logger');
vi.mock('../../src/utils/event-publisher', () => ({
  eventPublisher: {
    publish: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
  },
  createDomainEvent: vi.fn((eventType: string, tenantId: string, data: any, userId?: string) => ({
    eventType,
    eventVersion: '1.0',
    timestamp: new Date().toISOString(),
    tenantId,
    userId,
    data,
  })),
}));

describe('Customer Routes Integration Tests', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';

  let authToken: string;

  const mockCustomer = {
    id: customerId,
    tenant_id: tenantId,
    name: 'Test Company GmbH',
    display_name: 'Test Company',
    customer_number: 'CUS-0001',
    parent_customer_id: null,
    type: 'business',
    tier: 'gold',
    status: 'active',
    email: 'info@testcompany.de',
    phone: '+49 30 12345678',
    website: 'https://testcompany.de',
    address_line1: 'Musterstraße 123',
    address_line2: null,
    city: 'Berlin',
    state: 'Berlin',
    postal_code: '10115',
    country: 'DEU',
    tax_id: 'DE123456789',
    payment_terms: 30,
    currency: 'EUR',
    custom_fields: {},
    tags: ['test'],
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    created_by: userId,
    updated_by: null,
  };

  beforeAll(() => {
    // Generate valid JWT token
    authToken = jwt.sign(
      {
        userId: userId,
        tenant_id: tenantId,
        email: 'test@example.com',
        role: 'admin',
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const createData = {
        name: 'New Company GmbH',
        email: 'info@newcompany.de',
        type: 'business',
        tier: 'gold',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // generateCustomerNumber
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // findByCustomerNumber
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Company GmbH');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid data (missing name)', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toContain('name');
    });

    it('should return 409 for duplicate customer_number', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Company' })
        .expect(409);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should list all customers with pagination', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(50);
    });

    it('should filter customers by status', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const response = await request(app)
        .get('/api/v1/customers?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle pagination parameters', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const response = await request(app)
        .get('/api/v1/customers?page=2&limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(20);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should get customer by ID', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockCustomer],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(customerId);
      expect(response.body.name).toBe('Test Company GmbH');
    });

    it('should return 404 for non-existent customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update customer', async () => {
      const updateData = {
        name: 'Updated Company Name',
        email: 'updated@company.de',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ ...mockCustomer, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      const response = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
    });

    it('should return 404 for non-existent customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should soft delete customer', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/customers/:id/children', () => {
    it('should get customer children', async () => {
      const child1 = { ...mockCustomer, id: 'child1', parent_customer_id: customerId };
      const child2 = { ...mockCustomer, id: 'child2', parent_customer_id: customerId };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [child1, child2], rowCount: 2, command: 'SELECT', oid: 0, fields: [] }); // getChildren

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}/children`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Authentication', () => {
    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: userId, tenant_id: tenantId },
        config.jwt.secret,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      vi.mocked(database.query).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});
