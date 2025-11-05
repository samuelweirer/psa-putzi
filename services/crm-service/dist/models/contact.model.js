"use strict";
/**
 * Contact Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactModel = void 0;
const database_1 = require("../utils/database");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class ContactModel {
    /**
     * Find all contacts for a customer
     */
    static async findByCustomer(customerId, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM contacts
       WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       ORDER BY is_primary DESC, last_name ASC, first_name ASC`, [customerId, tenantId]);
        return result.rows;
    }
    /**
     * Find contact by ID
     */
    static async findById(id, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM contacts
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [id, tenantId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Contact with ID ${id} not found`);
        }
        return result.rows[0];
    }
    /**
     * Find contact by email
     */
    static async findByEmail(email, tenantId, customerId) {
        const params = [email, tenantId];
        let sql = `SELECT * FROM contacts
               WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
        if (customerId) {
            sql += ` AND customer_id = $3`;
            params.push(customerId);
        }
        const result = await (0, database_1.query)(sql, params);
        return result.rows[0] || null;
    }
    /**
     * Create new contact
     */
    static async create(data, tenantId) {
        // Validate customer exists (will throw if not found)
        await (0, database_1.query)('SELECT id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [data.customer_id, tenantId]);
        // If this is set as primary, unset other primary contacts for this customer
        if (data.is_primary) {
            await (0, database_1.query)(`UPDATE contacts
         SET is_primary = false, updated_at = NOW()
         WHERE customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [data.customer_id, tenantId]);
        }
        const result = await (0, database_1.query)(`INSERT INTO contacts (
        tenant_id, customer_id, first_name, last_name, title, department,
        email, phone_office, phone_mobile, phone_direct,
        is_primary, is_billing, is_technical, custom_fields, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *`, [
            tenantId,
            data.customer_id,
            data.first_name,
            data.last_name,
            data.title || null,
            data.department || null,
            data.email || null,
            data.phone_office || null,
            data.phone_mobile || null,
            data.phone_direct || null,
            data.is_primary || false,
            data.is_billing || false,
            data.is_technical || false,
            JSON.stringify(data.custom_fields || {}),
            data.notes || null,
        ]);
        logger_1.default.info('Contact created', {
            contactId: result.rows[0].id,
            customerId: data.customer_id,
            tenantId,
        });
        return result.rows[0];
    }
    /**
     * Update contact
     */
    static async update(id, tenantId, data) {
        // Verify contact exists
        const existing = await this.findById(id, tenantId);
        // If setting as primary, unset other primary contacts for this customer
        if (data.is_primary && !existing.is_primary) {
            await (0, database_1.query)(`UPDATE contacts
         SET is_primary = false, updated_at = NOW()
         WHERE customer_id = $1 AND tenant_id = $2 AND id != $3 AND deleted_at IS NULL`, [existing.customer_id, tenantId, id]);
        }
        const fields = [];
        const params = [];
        let paramIndex = 1;
        // Build dynamic UPDATE query
        const updateFields = [
            'first_name', 'last_name', 'title', 'department',
            'email', 'phone_office', 'phone_mobile', 'phone_direct',
            'is_primary', 'is_billing', 'is_technical', 'notes'
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
            return existing;
        }
        fields.push(`updated_at = NOW()`);
        params.push(id, tenantId);
        const result = await (0, database_1.query)(`UPDATE contacts
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`, params);
        logger_1.default.info('Contact updated', { contactId: id, tenantId });
        return result.rows[0];
    }
    /**
     * Soft delete contact
     */
    static async softDelete(id, tenantId) {
        // Verify contact exists
        await this.findById(id, tenantId);
        await (0, database_1.query)(`UPDATE contacts
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        logger_1.default.info('Contact soft deleted', { contactId: id, tenantId });
    }
    /**
     * Get primary contact for a customer
     */
    static async getPrimaryContact(customerId, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM contacts
       WHERE customer_id = $1 AND tenant_id = $2 AND is_primary = true AND deleted_at IS NULL
       LIMIT 1`, [customerId, tenantId]);
        return result.rows[0] || null;
    }
    /**
     * Search contacts
     */
    static async search(tenantId, searchQuery, customerId) {
        const params = [tenantId, `%${searchQuery}%`];
        let sql = `
      SELECT * FROM contacts
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND (
          first_name ILIKE $2 OR
          last_name ILIKE $2 OR
          email ILIKE $2 OR
          phone_office ILIKE $2 OR
          phone_mobile ILIKE $2
        )
    `;
        if (customerId) {
            sql += ` AND customer_id = $3`;
            params.push(customerId);
        }
        sql += ` ORDER BY is_primary DESC, last_name ASC, first_name ASC LIMIT 50`;
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
}
exports.ContactModel = ContactModel;
//# sourceMappingURL=contact.model.js.map