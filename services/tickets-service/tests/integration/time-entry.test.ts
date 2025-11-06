/**
 * Integration tests for Time Entry endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import * as database from '../../src/utils/database';
import * as eventPublisher from '../../src/utils/event-publisher';

// Mock dependencies
vi.mock('../../src/utils/database');
vi.mock('../../src/utils/event-publisher', () => ({
  eventPublisher: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
  createDomainEvent: vi.fn((type, tenantId, data, userId) => ({
    type,
    tenantId,
    data,
    userId,
    timestamp: new Date(),
  })),
}));

// Mock JWT middleware
vi.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      id: 'user-123',
      tenant_id: 'tenant-abc',
      email: 'test@example.com',
      role: 'technician',
    };
    next();
  },
}));

describe('Time Entry Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/tickets/:ticketId/time-entries', () => {
    it('should create time entry with automatic rate resolution', async () => {
      const ticketId = 'ticket-123';

      // Mock database queries in order:
      // 1. Get ticket with customer info
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: ticketId,
            customer_id: 'customer-456',
            contract_id: 'contract-789',
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // 2. getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // 3. findSpecificBillingRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ billing_rate: '150.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // 4. Insert time entry
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: 'time-entry-001',
            tenant_id: 'tenant-abc',
            ticket_id: ticketId,
            user_id: 'user-123',
            date: new Date('2025-11-05'),
            hours: 2.5,
            description: 'Fixed server issue',
            work_type: 'support',
            billing_rate: '150.00',
            cost_rate: '50.00',
            billable: true,
            billed: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticketId}/time-entries`)
        .send({
          date: '2025-11-05',
          hours: 2.5,
          description: 'Fixed server issue',
          work_type: 'support',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: 'time-entry-001',
        hours: 2.5,
        billing_rate: '150.00',
        cost_rate: '50.00',
        billable: true,
      });

      // Verify event was published
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'time_entry.created',
        expect.objectContaining({
          type: 'time_entry.created',
          tenantId: 'tenant-abc',
        })
      );
    });

    it('should validate required fields', async () => {
      const ticketId = 'ticket-123';

      const response = await request(app)
        .post(`/api/v1/tickets/${ticketId}/time-entries`)
        .send({
          // Missing hours and description
          date: '2025-11-05',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate hours range (0.25 to 24)', async () => {
      const ticketId = 'ticket-123';

      // Test hours too small
      let response = await request(app)
        .post(`/api/v1/tickets/${ticketId}/time-entries`)
        .send({
          date: '2025-11-05',
          hours: 0.1, // Below minimum
          description: 'Test',
        })
        .expect(400);

      expect(response.body.error).toContain('hours');

      // Test hours too large
      response = await request(app)
        .post(`/api/v1/tickets/${ticketId}/time-entries`)
        .send({
          date: '2025-11-05',
          hours: 25, // Above maximum
          description: 'Test',
        })
        .expect(400);

      expect(response.body.error).toContain('hours');
    });

    it('should handle missing billing rate gracefully', async () => {
      const ticketId = 'ticket-123';

      // Mock get ticket
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: ticketId,
            customer_id: 'customer-456',
            contract_id: null,
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getUserDefaultRate - no default
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticketId}/time-entries`)
        .send({
          date: '2025-11-05',
          hours: 2.5,
          description: 'Test',
        })
        .expect(400);

      expect(response.body.error).toContain('No billing rate configured');
    });
  });

  describe('GET /api/v1/tickets/:ticketId/time-entries', () => {
    it('should list time entries for ticket', async () => {
      const ticketId = 'ticket-123';

      // Mock count query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ total: '2' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock data query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: 'time-entry-001',
            ticket_id: ticketId,
            hours: 2.5,
            billing_rate: '150.00',
            cost_rate: '50.00',
            user_name: 'John Doe',
            created_at: new Date(),
          },
          {
            id: 'time-entry-002',
            ticket_id: ticketId,
            hours: 1.0,
            billing_rate: '150.00',
            cost_rate: '50.00',
            user_name: 'Jane Smith',
            created_at: new Date(),
          },
        ],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/tickets/${ticketId}/time-entries`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 50,
        total: 2,
        pages: 1,
      });
    });

    it('should support pagination', async () => {
      const ticketId = 'ticket-123';

      // Mock count query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ total: '25' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock data query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: Array(10).fill({
          id: 'time-entry-001',
          ticket_id: ticketId,
          hours: 1.0,
        }),
        rowCount: 10,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/tickets/${ticketId}/time-entries`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      });
    });
  });

  describe('GET /api/v1/tickets/:ticketId/time-entries/summary', () => {
    it('should return financial summary for ticket', async () => {
      const ticketId = 'ticket-123';

      // Mock summary query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            total_hours: '10.5',
            billable_hours: '10.0',
            total_revenue: '1500.00',
            total_cost: '500.00',
            total_profit: '1000.00',
            margin_percent: '66.67',
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/tickets/${ticketId}/time-entries/summary`)
        .expect(200);

      expect(response.body).toMatchObject({
        total_hours: 10.5,
        billable_hours: 10,
        total_revenue: 1500,
        total_cost: 500,
        total_profit: 1000,
        margin_percent: 66.67,
      });
    });
  });

  describe('GET /api/v1/time-entries/:id', () => {
    it('should get time entry by ID', async () => {
      const timeEntryId = 'time-entry-001';

      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            ticket_id: 'ticket-123',
            hours: 2.5,
            billing_rate: '150.00',
            cost_rate: '50.00',
            user_name: 'John Doe',
            ticket_number: 1043,
            ticket_title: 'Server issue',
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get(`/api/v1/time-entries/${timeEntryId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: timeEntryId,
        hours: 2.5,
        user_name: 'John Doe',
      });
    });

    it('should return 404 for non-existent time entry', async () => {
      const timeEntryId = 'nonexistent';

      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await request(app)
        .get(`/api/v1/time-entries/${timeEntryId}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/time-entries/:id', () => {
    it('should update time entry', async () => {
      const timeEntryId = 'time-entry-001';

      // Mock findById
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            tenant_id: 'tenant-abc',
            billed: false,
            hours: 2.5,
            description: 'Old description',
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock update
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            hours: 3.0,
            description: 'Updated description',
            updated_at: new Date(),
          },
        ],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .put(`/api/v1/time-entries/${timeEntryId}`)
        .send({
          hours: 3.0,
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: timeEntryId,
        hours: 3,
        description: 'Updated description',
      });
    });

    it('should prevent updating billed time entry', async () => {
      const timeEntryId = 'time-entry-001';

      // Mock findById - entry is billed
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            tenant_id: 'tenant-abc',
            billed: true, // Already billed
            hours: 2.5,
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await request(app)
        .put(`/api/v1/time-entries/${timeEntryId}`)
        .send({
          hours: 3.0,
        })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/time-entries/:id', () => {
    it('should delete unbilled time entry', async () => {
      const timeEntryId = 'time-entry-001';

      // Mock findById
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            tenant_id: 'tenant-abc',
            billed: false,
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock delete
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: [],
      });

      await request(app)
        .delete(`/api/v1/time-entries/${timeEntryId}`)
        .expect(204);

      // Verify delete event published
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'time_entry.deleted',
        expect.any(Object)
      );
    });

    it('should prevent deleting billed time entry', async () => {
      const timeEntryId = 'time-entry-001';

      // Mock findById - entry is billed
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [
          {
            id: timeEntryId,
            tenant_id: 'tenant-abc',
            billed: true, // Already billed
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await request(app)
        .delete(`/api/v1/time-entries/${timeEntryId}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/time-entries/unbilled', () => {
    it('should list all unbilled time entries for tenant', async () => {
      // Mock count query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ total: '15' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock data query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: Array(15).fill({
          id: 'time-entry-001',
          is_billed: false,
          billable: true,
        }),
        rowCount: 15,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const response = await request(app)
        .get('/api/v1/time-entries/unbilled')
        .expect(200);

      expect(response.body.data).toHaveLength(15);
      expect(response.body.pagination.total).toBe(15);
    });
  });
});
