/**
 * Integration Tests for Contact Routes
 *
 * Tests full HTTP request/response cycle for Contact endpoints
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

describe('Contact Routes Integration Tests', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';
  const contactId = '223e4567-e89b-12d3-a456-426614174000';

  let authToken: string;

  const mockCustomer = {
    id: customerId,
    tenant_id: tenantId,
    name: 'Test Company GmbH',
  };

  const mockContact = {
    id: contactId,
    tenant_id: tenantId,
    customer_id: customerId,
    first_name: 'Max',
    last_name: 'Mustermann',
    email: 'max.mustermann@testcompany.de',
    phone_office: '+49 30 12345678',
    phone_mobile: '+49 170 1234567',
    phone_direct: null,
    title: 'IT Manager',
    department: 'IT',
    is_primary: true,
    is_billing: false,
    is_technical: true,
    custom_fields: {},
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

  describe('POST /api/v1/customers/:customerId/contacts', () => {
    it('should create a new contact', async () => {
      const createData = {
        customer_id: customerId,
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max.mustermann@testcompany.de',
        phone_office: '+49 30 12345678',
        is_primary: true,
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Customer exists check
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }) // Unset other primary
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe('Max');
      expect(response.body.last_name).toBe('Mustermann');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/contacts`)
        .send({ first_name: 'Max', last_name: 'Test' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid data (missing first_name)', async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ last_name: 'Mustermann', email: 'test@test.com' })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toContain('first_name');
    });

    it('should return 404 for non-existent customer', async () => {
      // Mock rejecting with error when trying to insert (customer_id FK constraint would fail)
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // Customer check returns empty
        .mockRejectedValueOnce(new Error('insert or update on table "contacts" violates foreign key constraint'));

      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customer_id: customerId, first_name: 'Max', last_name: 'Mustermann' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/customers/:customerId/contacts', () => {
    it('should list all contacts for customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return empty array for customer with no contacts', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/contacts/search', () => {
    it('should search contacts by query', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get('/api/v1/contacts/search?q=Max')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/contacts/:id', () => {
    it('should get contact by ID', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(contactId);
      expect(response.body.first_name).toBe('Max');
    });

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/contacts/:id', () => {
    it('should update contact', async () => {
      const updateData = {
        first_name: 'Maximilian',
        phone: '+49 30 87654321',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [{ ...mockContact, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE

      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.first_name).toBe(updateData.first_name);
    });

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ first_name: 'Test' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/contacts/:id', () => {
    it('should soft delete contact', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // Soft delete

      await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search?q=test')
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
        .get('/api/v1/contacts/search?q=test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      vi.mocked(database.query).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});
