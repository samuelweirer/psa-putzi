/**
 * Unit Tests for Contact Model
 *
 * Tests all Contact model methods with mocked database and dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContactModel } from '../../../src/models/contact.model';
import { NotFoundError } from '../../../src/utils/errors';
import * as database from '../../../src/utils/database';
import * as eventPublisher from '../../../src/utils/event-publisher';
import logger from '../../../src/utils/logger';

// Mock dependencies
vi.mock('../../../src/utils/database');
vi.mock('../../../src/utils/event-publisher', () => ({
  eventPublisher: {
    publish: vi.fn().mockResolvedValue(undefined),
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
vi.mock('../../../src/utils/logger');

describe('ContactModel', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';
  const contactId = '789e4567-e89b-12d3-a456-426614174000';

  const mockContact = {
    id: contactId,
    tenant_id: tenantId,
    customer_id: customerId,
    first_name: 'John',
    last_name: 'Doe',
    title: 'IT Manager',
    department: 'IT',
    email: 'john.doe@company.com',
    phone_office: '+49 30 12345678',
    phone_mobile: '+49 151 12345678',
    phone_direct: '+49 30 12345679',
    is_primary: true,
    is_billing: false,
    is_technical: true,
    custom_fields: { department_code: 'IT-001' },
    notes: 'Primary technical contact',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findByCustomer', () => {
    it('should return all contacts for a customer', async () => {
      const contact2 = { ...mockContact, id: 'contact2', is_primary: false };
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact, contact2],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findByCustomer(customerId, tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(contactId);
      expect(result[1].id).toBe('contact2');
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [customerId, tenantId]
      );
    });

    it('should order by is_primary DESC, then by name', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await ContactModel.findByCustomer(customerId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_primary DESC, last_name ASC, first_name ASC'),
        expect.anything()
      );
    });

    it('should return empty array when no contacts found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findByCustomer(customerId, tenantId);

      expect(result).toEqual([]);
    });

    it('should filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await ContactModel.findByCustomer(customerId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id = $2'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        expect.anything()
      );
    });
  });

  describe('findById', () => {
    it('should return contact when found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findById(contactId, tenantId);

      expect(result).toEqual(mockContact);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [contactId, tenantId]
      );
    });

    it('should throw NotFoundError when contact not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const promise = ContactModel.findById(contactId, tenantId);
      await expect(promise).rejects.toThrow(NotFoundError);
      await expect(promise).rejects.toThrow(`Contact with ID ${contactId} not found`);
    });

    it('should enforce tenant isolation', async () => {
      const wrongTenantId = '999e8400-e29b-41d4-a716-446655440001';
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        ContactModel.findById(contactId, wrongTenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should return contact when found by email', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findByEmail('john.doe@company.com', tenantId);

      expect(result).toEqual(mockContact);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1 AND tenant_id = $2'),
        ['john.doe@company.com', tenantId]
      );
    });

    it('should filter by customer_id when provided', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findByEmail('john.doe@company.com', tenantId, customerId);

      expect(result).toEqual(mockContact);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND customer_id = $3'),
        ['john.doe@company.com', tenantId, customerId]
      );
    });

    it('should return null when not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.findByEmail('nonexistent@company.com', tenantId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createData = {
      customer_id: customerId,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@company.com',
      is_primary: true,
    };

    it('should create contact and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Validate customer exists
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] }) // Unset other primary
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      const result = await ContactModel.create(createData, tenantId);

      expect(result).toEqual(mockContact);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        expect.arrayContaining([tenantId, customerId, createData.first_name, createData.last_name])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'contact.created',
        expect.objectContaining({
          eventType: 'contact.created',
          tenantId,
        })
      );
    });

    it('should validate customer exists', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        ContactModel.create(createData, tenantId)
      ).rejects.toThrow();
    });

    it('should unset other primary contacts when is_primary=true', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Customer exists
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }) // Unset other primary
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      await ContactModel.create(createData, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts'),
        [customerId, tenantId]
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_primary = false'),
        expect.anything()
      );
    });

    it('should not unset primary contacts when is_primary=false', async () => {
      const dataWithoutPrimary = { ...createData, is_primary: false };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Customer exists
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT (no UPDATE)

      await ContactModel.create(dataWithoutPrimary, tenantId);

      // Should only have 2 queries (no UPDATE for primary)
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        customer_id: customerId,
        first_name: 'Jane',
        last_name: 'Smith',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await ContactModel.create(minimalData, tenantId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO contacts')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain(false); // default is_primary
      expect(params).toContain(false); // default is_billing
      expect(params).toContain(false); // default is_technical
    });

    it('should handle custom_fields', async () => {
      const dataWithCustomFields = {
        ...createData,
        custom_fields: { preferred_language: 'de' },
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await ContactModel.create(dataWithCustomFields, tenantId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO contacts')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain(JSON.stringify(dataWithCustomFields.custom_fields));
    });
  });

  describe('update', () => {
    const updateData = {
      first_name: 'Jane',
      email: 'jane.updated@company.com',
    };

    it('should update contact and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [{ ...mockContact, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE

      const result = await ContactModel.update(contactId, tenantId, updateData);

      expect(result.first_name).toBe(updateData.first_name);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts'),
        expect.arrayContaining([updateData.first_name, updateData.email, contactId, tenantId])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'contact.updated',
        expect.objectContaining({
          eventType: 'contact.updated',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when contact not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        ContactModel.update(contactId, tenantId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should unset other primary contacts when setting is_primary=true', async () => {
      const existingNotPrimary = { ...mockContact, is_primary: false };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [existingNotPrimary], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (not primary)
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }) // Unset other primary
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE contact

      await ContactModel.update(contactId, tenantId, { is_primary: true });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_primary = false'),
        [existingNotPrimary.customer_id, tenantId, contactId]
      );
    });

    it('should not unset primary contacts when contact already primary', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (already primary)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE contact

      await ContactModel.update(contactId, tenantId, { is_primary: true });

      // Should only have 2 queries (no UPDATE for unsetting primary)
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should return unchanged contact if no fields to update', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.update(contactId, tenantId, {});

      expect(result).toEqual(mockContact);
      // Should only call findById, no UPDATE
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should handle custom_fields update', async () => {
      const updateWithCustomFields = {
        custom_fields: { preferred_language: 'en' },
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await ContactModel.update(contactId, tenantId, updateWithCustomFields);

      const updateCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('UPDATE contacts')
      );
      const params = updateCall?.[1] || [];

      expect(params).toContain(JSON.stringify(updateWithCustomFields.custom_fields));
    });
  });

  describe('softDelete', () => {
    it('should soft delete contact and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE deleted_at

      await ContactModel.softDelete(contactId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts'),
        [contactId, tenantId]
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        expect.anything()
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'contact.deleted',
        expect.objectContaining({
          eventType: 'contact.deleted',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when contact not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        ContactModel.softDelete(contactId, tenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPrimaryContact', () => {
    it('should return primary contact when found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.getPrimaryContact(customerId, tenantId);

      expect(result).toEqual(mockContact);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE customer_id = $1 AND tenant_id = $2 AND is_primary = true'),
        [customerId, tenantId]
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        expect.anything()
      );
    });

    it('should return null when no primary contact found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.getPrimaryContact(customerId, tenantId);

      expect(result).toBeNull();
    });

    it('should filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await ContactModel.getPrimaryContact(customerId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id = $2'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        expect.anything()
      );
    });
  });

  describe('search', () => {
    it('should search contacts by multiple fields', async () => {
      const contact2 = { ...mockContact, id: 'contact2' };
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact, contact2],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.search(tenantId, 'John');

      expect(result).toHaveLength(2);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('first_name ILIKE $2'),
        [tenantId, '%John%']
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('last_name ILIKE $2'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('email ILIKE $2'),
        expect.anything()
      );
    });

    it('should filter by customer_id when provided', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.search(tenantId, 'John', customerId);

      expect(result).toHaveLength(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND customer_id = $3'),
        [tenantId, '%John%', customerId]
      );
    });

    it('should limit results to 50', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await ContactModel.search(tenantId, 'test');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.anything()
      );
    });

    it('should order results by primary status and name', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockContact],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await ContactModel.search(tenantId, 'test');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_primary DESC, last_name ASC, first_name ASC'),
        expect.anything()
      );
    });

    it('should return empty array when no matches', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await ContactModel.search(tenantId, 'nonexistent');

      expect(result).toEqual([]);
    });
  });
});
