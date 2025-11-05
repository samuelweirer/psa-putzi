/**
 * Unit Tests for Location Model
 *
 * Tests all Location model methods with mocked database and dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocationModel } from '../../../src/models/location.model';
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

describe('LocationModel', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const customerId = '123e4567-e89b-12d3-a456-426614174000';
  const locationId = '789e4567-e89b-12d3-a456-426614174000';

  const mockLocation = {
    id: locationId,
    tenant_id: tenantId,
    customer_id: customerId,
    name: 'Berlin Office',
    location_type: 'headquarters',
    address_line1: 'Musterstraße 123',
    address_line2: '5th Floor',
    city: 'Berlin',
    state: 'Berlin',
    postal_code: '10115',
    country: 'DEU',
    latitude: 52.5200,
    longitude: 13.4050,
    phone: '+49 30 12345678',
    email: 'berlin@company.com',
    custom_fields: { building_code: 'BER-HQ' },
    notes: 'Main headquarters',
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
    it('should return all locations for a customer', async () => {
      const location2 = { ...mockLocation, id: 'location2', name: 'Munich Office' };
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation, location2],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await LocationModel.findByCustomer(customerId, tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(locationId);
      expect(result[1].id).toBe('location2');
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [customerId, tenantId]
      );
    });

    it('should order by name ASC', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await LocationModel.findByCustomer(customerId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        expect.anything()
      );
    });

    it('should return empty array when no locations found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await LocationModel.findByCustomer(customerId, tenantId);

      expect(result).toEqual([]);
    });

    it('should filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await LocationModel.findByCustomer(customerId, tenantId);

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
    it('should return location when found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await LocationModel.findById(locationId, tenantId);

      expect(result).toEqual(mockLocation);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'),
        [locationId, tenantId]
      );
    });

    it('should throw NotFoundError when location not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const promise = LocationModel.findById(locationId, tenantId);
      await expect(promise).rejects.toThrow(NotFoundError);
      await expect(promise).rejects.toThrow(`Location with ID ${locationId} not found`);
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
        LocationModel.findById(locationId, wrongTenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createData = {
      customer_id: customerId,
      name: 'Hamburg Office',
      location_type: 'branch' as const,
      address_line1: 'Teststraße 456',
      city: 'Hamburg',
      postal_code: '20095',
      country: 'DEU',
    };

    it('should create location and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // Validate customer exists
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }); // INSERT

      const result = await LocationModel.create(createData, tenantId);

      expect(result).toEqual(mockLocation);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO locations'),
        expect.arrayContaining([tenantId, customerId, createData.name, createData.location_type])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'location.created',
        expect.objectContaining({
          eventType: 'location.created',
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
        LocationModel.create(createData, tenantId)
      ).rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        customer_id: customerId,
        name: 'Minimal Location',
        address_line1: 'Address',
        city: 'City',
        postal_code: '12345',
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await LocationModel.create(minimalData, tenantId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO locations')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain('DEU'); // default country
      expect(params).toContain(null); // default location_type
    });

    it('should handle coordinates (latitude, longitude)', async () => {
      const dataWithCoordinates = {
        ...createData,
        latitude: 53.5511,
        longitude: 9.9937,
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await LocationModel.create(dataWithCoordinates, tenantId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO locations')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain(53.5511);
      expect(params).toContain(9.9937);
    });

    it('should handle custom_fields', async () => {
      const dataWithCustomFields = {
        ...createData,
        custom_fields: { floor: '3', room: '301' },
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await LocationModel.create(dataWithCustomFields, tenantId);

      const insertCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('INSERT INTO locations')
      );
      const params = insertCall?.[1] || [];

      expect(params).toContain(JSON.stringify(dataWithCustomFields.custom_fields));
    });

    it('should handle all location types', async () => {
      const locationTypes = ['headquarters', 'branch', 'datacenter', 'remote'] as const;

      for (const locationType of locationTypes) {
        vi.clearAllMocks();
        const dataWithType = { ...createData, location_type: locationType };

        vi.mocked(database.query)
          .mockResolvedValueOnce({ rows: [{ id: customerId }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
          .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

        await LocationModel.create(dataWithType, tenantId);

        const insertCall = vi.mocked(database.query).mock.calls.find(
          call => call[0].includes('INSERT INTO locations')
        );
        const params = insertCall?.[1] || [];

        expect(params).toContain(locationType);
      }
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Berlin Office Updated',
      phone: '+49 30 99999999',
    };

    it('should update location and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [{ ...mockLocation, ...updateData }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE

      const result = await LocationModel.update(locationId, tenantId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE locations'),
        expect.arrayContaining([updateData.name, updateData.phone, locationId, tenantId])
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'location.updated',
        expect.objectContaining({
          eventType: 'location.updated',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when location not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        LocationModel.update(locationId, tenantId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should return unchanged location if no fields to update', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const result = await LocationModel.update(locationId, tenantId, {});

      expect(result).toEqual(mockLocation);
      // Should call findById twice (initial validation + return), no UPDATE
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should handle coordinates update', async () => {
      const updateWithCoordinates = {
        latitude: 52.5201,
        longitude: 13.4051,
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await LocationModel.update(locationId, tenantId, updateWithCoordinates);

      const updateCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('UPDATE locations')
      );
      const params = updateCall?.[1] || [];

      expect(params).toContain(52.5201);
      expect(params).toContain(13.4051);
    });

    it('should handle custom_fields update', async () => {
      const updateWithCustomFields = {
        custom_fields: { parking_spaces: '50' },
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await LocationModel.update(locationId, tenantId, updateWithCustomFields);

      const updateCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('UPDATE locations')
      );
      const params = updateCall?.[1] || [];

      expect(params).toContain(JSON.stringify(updateWithCustomFields.custom_fields));
    });

    it('should update location_type', async () => {
      const updateWithType = {
        location_type: 'branch' as const,
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] });

      await LocationModel.update(locationId, tenantId, updateWithType);

      const updateCall = vi.mocked(database.query).mock.calls.find(
        call => call[0].includes('UPDATE locations')
      );
      const params = updateCall?.[1] || [];

      expect(params).toContain('branch');
    });
  });

  describe('softDelete', () => {
    it('should soft delete location and publish event', async () => {
      vi.mocked(database.query)
        .mockResolvedValueOnce({ rows: [mockLocation], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) // findById
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // UPDATE deleted_at

      await LocationModel.softDelete(locationId, tenantId);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE locations'),
        [locationId, tenantId]
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        expect.anything()
      );
      expect(eventPublisher.eventPublisher.publish).toHaveBeenCalledWith(
        'location.deleted',
        expect.objectContaining({
          eventType: 'location.deleted',
          tenantId,
        })
      );
    });

    it('should throw NotFoundError when location not found', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        LocationModel.softDelete(locationId, tenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('search', () => {
    it('should search locations by multiple fields', async () => {
      const location2 = { ...mockLocation, id: 'location2' };
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation, location2],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await LocationModel.search(tenantId, 'Berlin');

      expect(result).toHaveLength(2);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('name ILIKE $2'),
        [tenantId, '%Berlin%']
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('city ILIKE $2'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('address_line1 ILIKE $2'),
        expect.anything()
      );
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('postal_code ILIKE $2'),
        expect.anything()
      );
    });

    it('should filter by customer_id when provided', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await LocationModel.search(tenantId, 'Berlin', customerId);

      expect(result).toHaveLength(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND customer_id = $3'),
        [tenantId, '%Berlin%', customerId]
      );
    });

    it('should limit results to 50', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await LocationModel.search(tenantId, 'test');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.anything()
      );
    });

    it('should order results by name ASC', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await LocationModel.search(tenantId, 'test');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
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

      const result = await LocationModel.search(tenantId, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should filter by tenant_id and deleted_at', async () => {
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [mockLocation],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await LocationModel.search(tenantId, 'test');

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
});
