/**
 * Location Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */

import { query } from '../utils/database';
import { Location } from '../types';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { eventPublisher, createDomainEvent } from '../utils/event-publisher';

export class LocationModel {
  /**
   * Find all locations for a customer
   */
  static async findByCustomer(
    customerId: string,
    tenantId: string
  ): Promise<Location[]> {
    const result = await query(
      `SELECT * FROM locations
       WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       ORDER BY name ASC`,
      [customerId, tenantId]
    );

    return result.rows;
  }

  /**
   * Find location by ID
   */
  static async findById(id: string, tenantId: string): Promise<Location> {
    const result = await query(
      `SELECT * FROM locations
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Location with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create new location
   */
  static async create(data: Partial<Location>, tenantId: string): Promise<Location> {
    // Validate customer exists
    await query(
      'SELECT id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [data.customer_id, tenantId]
    );

    const result = await query(
      `INSERT INTO locations (
        tenant_id, customer_id, name, location_type,
        address_line1, address_line2, city, state, postal_code, country,
        latitude, longitude, phone, email, custom_fields, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
        tenantId,
        data.customer_id,
        data.name,
        data.location_type || null,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.state || null,
        data.postal_code,
        data.country || 'DEU',
        data.latitude || null,
        data.longitude || null,
        data.phone || null,
        data.email || null,
        JSON.stringify(data.custom_fields || {}),
        data.notes || null,
      ]
    );

    const location = result.rows[0];

    logger.info('Location created', {
      locationId: location.id,
      customerId: data.customer_id,
      tenantId,
    });

    // Publish location.created event
    await eventPublisher.publish(
      'location.created',
      createDomainEvent('location.created', tenantId, { location })
    );

    return location;
  }

  /**
   * Update location
   */
  static async update(id: string, tenantId: string, data: Partial<Location>): Promise<Location> {
    // Verify location exists
    await this.findById(id, tenantId);

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    const updateFields = [
      'name', 'location_type', 'address_line1', 'address_line2',
      'city', 'state', 'postal_code', 'country',
      'latitude', 'longitude', 'phone', 'email', 'notes'
    ];

    updateFields.forEach((field) => {
      if (data[field as keyof Location] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof Location]);
        paramIndex++;
      }
    });

    // Handle custom_fields separately (JSONB)
    if (data.custom_fields !== undefined) {
      fields.push(`custom_fields = $${paramIndex}`);
      params.push(JSON.stringify(data.custom_fields));
      paramIndex++;
    }

    if (fields.length === 0) {
      // No fields to update
      return this.findById(id, tenantId);
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    const result = await query(
      `UPDATE locations
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      params
    );

    const location = result.rows[0];

    logger.info('Location updated', { locationId: id, tenantId });

    // Publish location.updated event
    await eventPublisher.publish(
      'location.updated',
      createDomainEvent('location.updated', tenantId, { location, changes: data })
    );

    return location;
  }

  /**
   * Soft delete location
   */
  static async softDelete(id: string, tenantId: string): Promise<void> {
    // Verify location exists
    const location = await this.findById(id, tenantId);

    await query(
      `UPDATE locations
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    logger.info('Location soft deleted', { locationId: id, tenantId });

    // Publish location.deleted event
    await eventPublisher.publish(
      'location.deleted',
      createDomainEvent('location.deleted', tenantId, { locationId: id, location })
    );
  }

  /**
   * Search locations
   */
  static async search(
    tenantId: string,
    searchQuery: string,
    customerId?: string
  ): Promise<Location[]> {
    const params: any[] = [tenantId, `%${searchQuery}%`];
    let sql = `
      SELECT * FROM locations
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND (
          name ILIKE $2 OR
          city ILIKE $2 OR
          address_line1 ILIKE $2 OR
          postal_code ILIKE $2
        )
    `;

    if (customerId) {
      sql += ` AND customer_id = $3`;
      params.push(customerId);
    }

    sql += ` ORDER BY name ASC LIMIT 50`;

    const result = await query(sql, params);
    return result.rows;
  }
}
