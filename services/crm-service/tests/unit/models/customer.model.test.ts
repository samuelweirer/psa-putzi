/**
 * Unit Tests for Customer Model
 *
 * Tests all Customer model methods with mocked database and dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CustomerModel } from '../../../src/models/customer.model';
import { NotFoundError, ConflictError } from '../../../src/utils/errors';
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

describe('CustomerModel', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';

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
    notes: 'Test notes',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    created_by: userId,
    updated_by: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock event publisher by default
    vi.mocked(eventPublisher.eventPublisher.publish).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCustomerNumber', () => {
    it('should generate CUS-0001 for first customer', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.generateCustomerNumber(tenantId);
      expect(result).toBe('CUS-0001');
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT customer_number FROM customers'),
        [tenantId]
      );
    });

    it('should generate CUS-0002 when CUS-0001 exists', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ customer_number: 'CUS-0001' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.generateCustomerNumber(tenantId);
      expect(result).toBe('CUS-0002');
    });

    it('should generate CUS-0100 when CUS-0099 exists', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ customer_number: 'CUS-0099' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.generateCustomerNumber(tenantId);
      expect(result).toBe('CUS-0100');
    });

    it('should only consider numeric customer numbers', async () => {
      // Should filter by regex ^CUS-[0-9]+$
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.generateCustomerNumber(tenantId);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining("customer_number ~ '^CUS-[0-9]+$'"),
        [tenantId]
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with defaults', async () => {
      const mockCountResult = {
        rows: [{ total: '5' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      const mockDataResult = {
        rows: [mockCustomer],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await CustomerModel.findAll(tenantId);

      expect(result).toEqual({
        data: [mockCustomer],
        pagination: {
          page: 1,
          limit: 50,
          total: 5,
          pages: 1,
        },
      });

      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by status', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId, { status: 'active' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $2'),
        expect.arrayContaining([tenantId, 'active'])
      );
    });

    it('should filter by tier', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId, { tier: 'gold' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('tier = $2'),
        expect.arrayContaining([tenantId, 'gold'])
      );
    });

    it('should filter by type', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId, { type: 'business' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $2'),
        expect.arrayContaining([tenantId, 'business'])
      );
    });

    it('should filter by parent_customer_id', async () => {
      const parentId = '999e4567-e89b-12d3-a456-426614174000';
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId, { parent_customer_id: parentId });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('parent_customer_id = $2'),
        expect.arrayContaining([tenantId, parentId])
      );
    });

    it('should perform full-text search', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId, { search: 'Test' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('name ILIKE'),
        expect.arrayContaining([tenantId, '%Test%'])
      );
    });

    it('should handle pagination correctly', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const result = await CustomerModel.findAll(tenantId, {}, 3, 20);

      expect(result.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        pages: 5,
      });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([tenantId, 20, 40]) // offset = (3-1) * 20 = 40
      );
    });

    it('should always filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      await CustomerModel.findAll(tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id = $1'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        expect.anything()
      );
    });
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockCustomer],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.findById(customerId, tenantId);

      expect(result).toEqual(mockCustomer);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [customerId, tenantId]
      );
    });

    it('should throw NotFoundError when customer not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        CustomerModel.findById(customerId, tenantId)
      ).rejects.toThrow(NotFoundError);
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
        CustomerModel.findById(customerId, wrongTenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCustomerNumber', () => {
    it('should return customer when found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockCustomer],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.findByCustomerNumber('CUS-0001', tenantId);

      expect(result).toEqual(mockCustomer);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE customer_number = $1 AND tenant_id = $2'),
        ['CUS-0001', tenantId]
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

      const result = await CustomerModel.findByCustomerNumber('CUS-9999', tenantId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createData = {
      name: 'New Company GmbH',
      email: 'info@newcompany.de',
      type: 'business' as const,
      tier: 'gold' as const,
    };

    it('should create customer with auto-generated customer_number', async () => {
      // Mock generateCustomerNumber
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // generateCustomerNumber
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // findByCustomerNumber (check duplicate)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      const result = await CustomerModel.create(createData, tenantId, userId);

      expect(result).toEqual(mockCustomer);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO customers'),
        expect.arrayContaining([tenantId, createData.name])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'customer.created',
        expect.objectContaining({
          eventType: 'customer.created',
          tenantId,
        })
      );
    });

    it('should create customer with provided customer_number', async () => {
      const dataWithNumber = { ...createData, customer_number: 'CUS-CUSTOM' };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // findByCustomerNumber
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      await CustomerModel.create(dataWithNumber, tenantId, userId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO customers'),
        expect.arrayContaining([tenantId, dataWithNumber.name, expect.anything(), 'CUS-CUSTOM'])
      );
    });

    it('should throw ConflictError when customer_number already exists', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // generateCustomerNumber
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }); // findByCustomerNumber (duplicate!)

      await expect(
        CustomerModel.create(createData, tenantId, userId)
      ).rejects.toThrow(ConflictError);
    });

    it('should validate parent customer if provided', async () => {
      const parentId = '999e4567-e89b-12d3-a456-426614174000';
      const dataWithParent = { ...createData, parent_customer_id: parentId };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // generateCustomerNumber
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // findByCustomerNumber
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: findById
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      await CustomerModel.create(dataWithParent, tenantId, userId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [parentId, tenantId]
      );
    });

    it('should set default values for optional fields', async () => {
      const minimalData = { name: 'Minimal Company' };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await CustomerModel.create(minimalData, tenantId, userId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO customers')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain('business'); // default type
      expect(params).toContain('active'); // default status
      expect(params).toContain('DEU'); // default country
      expect(params).toContain(30); // default payment_terms
      expect(params).toContain('EUR'); // default currency
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Company Name',
      email: 'updated@company.de',
    };

    it('should update customer and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [{ ...mockCustomer, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE

      const result = await CustomerModel.update(customerId, tenantId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE customers'),
        expect.arrayContaining([updateData.name, updateData.email, customerId, tenantId])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'customer.updated',
        expect.objectContaining({
          eventType: 'customer.updated',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when customer not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        CustomerModel.update(customerId, tenantId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should validate parent customer if being changed', async () => {
      const parentId = '999e4567-e89b-12d3-a456-426614174000';
      const updateWithParent = { parent_customer_id: parentId };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (current customer)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: findById (parent)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: check circular
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE

      await CustomerModel.update(customerId, tenantId, updateWithParent);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [parentId, tenantId]
      );
    });

    it('should return unchanged customer if no fields to update', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const result = await CustomerModel.update(customerId, tenantId, {});

      expect(result).toEqual(mockCustomer);
      // Should call findById twice (initial validation + return), but no UPDATE
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should handle custom_fields update', async () => {
      const updateWithCustomFields = {
        custom_fields: { industry: 'IT', size: '50-100' },
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await CustomerModel.update(customerId, tenantId, updateWithCustomFields);

      const updateCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('UPDATE customers')
      );
      const params = updateCall?.[1] || [];

      expect(params).toContain(JSON.stringify(updateWithCustomFields.custom_fields));
    });
  });

  describe('softDelete', () => {
    it('should soft delete customer and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE deleted_at

      await CustomerModel.softDelete(customerId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE customers'),
        [customerId, tenantId]
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        expect.anything()
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'customer.deleted',
        expect.objectContaining({
          eventType: 'customer.deleted',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when customer not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        CustomerModel.softDelete(customerId, tenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateParentCustomer', () => {
    const parentId = '999e4567-e89b-12d3-a456-426614174000';

    it('should validate parent exists', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // generateCustomerNumber
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] }) // findByCustomerNumber (check duplicate)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: findById
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      // Access private method through create/update
      await expect(
        CustomerModel.create({ name: 'Test', parent_customer_id: parentId }, tenantId, userId)
      ).resolves.not.toThrow();
    });

    it('should throw ConflictError for self-reference', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (current)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }); // validateParentCustomer: findById (parent - same as current)

      const promise = CustomerModel.update(customerId, tenantId, { parent_customer_id: customerId });
      await expect(promise).rejects.toThrow(ConflictError);
      await expect(promise).rejects.toThrow('Customer cannot be its own parent');
    });

    it('should detect circular reference', async () => {
      // Customer A -> Customer B -> Customer A (circular)
      const customerA = { ...mockCustomer, id: 'aaa' };
      const customerB = { ...mockCustomer, id: 'bbb', parent_customer_id: 'aaa' };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [customerA], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (current A)
        .mockResolvedValueOnce({ rows: [customerB], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: findById (parent B)
        .mockResolvedValueOnce({ rows: [{ parent_customer_id: 'aaa' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }); // Check B's parent (A - circular!)

      const promise = CustomerModel.update('aaa', tenantId, { parent_customer_id: 'bbb' });
      await expect(promise).rejects.toThrow(ConflictError);
      await expect(promise).rejects.toThrow('Circular parent relationship detected');
    });

    it('should enforce max depth of 3 levels', async () => {
      // Customer A -> B -> C -> D (4 levels, should fail)
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById (current)
        .mockResolvedValueOnce({ rows: [mockCustomer], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // validateParentCustomer: findById (parent)
        .mockResolvedValueOnce({ rows: [{ parent_customer_id: 'level2' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Level 1
        .mockResolvedValueOnce({ rows: [{ parent_customer_id: 'level3' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Level 2
        .mockResolvedValueOnce({ rows: [{ parent_customer_id: 'level4' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }); // Level 3 - too deep!

      const promise = CustomerModel.update(customerId, tenantId, { parent_customer_id: 'level1' });
      await expect(promise).rejects.toThrow(ConflictError);
      await expect(promise).rejects.toThrow('Customer hierarchy cannot exceed 3 levels');
    });
  });

  describe('getChildren', () => {
    it('should return all child customers', async () => {
      const child1 = { ...mockCustomer, id: 'child1', parent_customer_id: customerId };
      const child2 = { ...mockCustomer, id: 'child2', parent_customer_id: customerId };

      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [child1, child2],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.getChildren(customerId, tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('child1');
      expect(result[1].id).toBe('child2');
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_customer_id = $1 AND tenant_id = $2'),
        [customerId, tenantId]
      );
    });

    it('should return empty array when no children', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CustomerModel.getChildren(customerId, tenantId);

      expect(result).toEqual([]);
    });

    it('should filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await CustomerModel.getChildren(customerId, tenantId);

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
});
