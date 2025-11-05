"use strict";
/**
 * Location Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationModel = void 0;
const database_1 = require("../utils/database");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class LocationModel {
    /**
     * Find all locations for a customer
     */
    static async findByCustomer(customerId, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM locations
       WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       ORDER BY name ASC`, [customerId, tenantId]);
        return result.rows;
    }
    /**
     * Find location by ID
     */
    static async findById(id, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM locations
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [id, tenantId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Location with ID ${id} not found`);
        }
        return result.rows[0];
    }
    /**
     * Create new location
     */
    static async create(data, tenantId) {
        // Validate customer exists
        await (0, database_1.query)('SELECT id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [data.customer_id, tenantId]);
        const result = await (0, database_1.query)(`INSERT INTO locations (
        tenant_id, customer_id, name, location_type,
        address_line1, address_line2, city, state, postal_code, country,
        latitude, longitude, phone, email, custom_fields, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`, [
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
        ]);
        logger_1.default.info('Location created', {
            locationId: result.rows[0].id,
            customerId: data.customer_id,
            tenantId,
        });
        return result.rows[0];
    }
    /**
     * Update location
     */
    static async update(id, tenantId, data) {
        // Verify location exists
        await this.findById(id, tenantId);
        const fields = [];
        const params = [];
        let paramIndex = 1;
        // Build dynamic UPDATE query
        const updateFields = [
            'name', 'location_type', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude', 'phone', 'email', 'notes'
        ];
        updateFields.forEach((field) => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramIndex}`);
                params.push(data[field]);
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
        const result = await (0, database_1.query)(`UPDATE locations
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`, params);
        logger_1.default.info('Location updated', { locationId: id, tenantId });
        return result.rows[0];
    }
    /**
     * Soft delete location
     */
    static async softDelete(id, tenantId) {
        // Verify location exists
        await this.findById(id, tenantId);
        await (0, database_1.query)(`UPDATE locations
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        logger_1.default.info('Location soft deleted', { locationId: id, tenantId });
    }
    /**
     * Search locations
     */
    static async search(tenantId, searchQuery, customerId) {
        const params = [tenantId, `%${searchQuery}%`];
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
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
}
exports.LocationModel = LocationModel;
//# sourceMappingURL=location.model.js.map