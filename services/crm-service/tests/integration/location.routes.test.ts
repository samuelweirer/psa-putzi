/**
 * Integration Tests for Location Routes
 *
 * Tests full HTTP request/response cycle for Location endpoints
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

describe('Location Routes Integration Tests', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';
  const locationId = '323e4567-e89b-12d3-a456-426614174000';

  let authToken: string;

  const mockCustomer = {
    id: customerId,
    tenant_id: tenantId,
    name: 'Test Company GmbH',
  };

  const mockLocation = {
    id: locationId,
    tenant_id: tenantId,
    customer_id: customerId,
    location_name: 'Headquarters',
    location_type: 'headquarters',
    address_line1: 'Musterstraße 123',
    address_line2: null,
    city: 'Berlin',
    state: 'Berlin',
    postal_code: '10115',
    country: 'DEU',
    phone: '+49 30 12345678',
    email: 'info@testcompany.de',
    is_primary: true,
    is_billing: true,
    is_shipping: false,
    custom_fields: {},
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    created_by: userId,
    updated_by: null,
  };

  beforeAll(() => {
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

  describe('POST /api/v1/customers/:customerId/locations', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/locations`)
        .send({ location_name: 'Test', location_type: 'branch' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/locations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ city: 'Berlin' })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/customers/:customerId/locations', () => {
    it('should list all locations for customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}/locations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/locations/search', () => {
    it('should search locations', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get('/api/v1/locations/search?q=Berlin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/locations/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/locations/:id', () => {
    it('should get location by ID', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(locationId);
      expect(response.body.location_name).toBe('Headquarters');
    });

    it('should return 404 for non-existent location', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/locations/:id', () => {
    it('should update location', async () => {
      const updateData = {
        location_name: 'Updated HQ',
        phone: '+49 30 87654321',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ ...mockLocation, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      const response = await request(app)
        .put(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.location_name).toBe(updateData.location_name);
    });
  });

  describe('DELETE /api/v1/locations/:id', () => {
    it('should soft delete location', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await request(app)
        .delete(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent location', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .delete(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/locations/search?q=test')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      vi.mocked(database.query).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});
