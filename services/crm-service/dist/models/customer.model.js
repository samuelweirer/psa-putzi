"use strict";
/**
 * Customer Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
const database_1 = require("../utils/database");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class CustomerModel {
    /**
     * Generate next customer number for tenant
     */
    static async generateCustomerNumber(tenantId) {
        const result = await (0, database_1.query)(`SELECT customer_number FROM customers
       WHERE tenant_id = $1
       AND customer_number ~ '^CUS-[0-9]+$'
       AND deleted_at IS NULL
       ORDER BY customer_number DESC
       LIMIT 1`, [tenantId]);
        let nextNumber = 1;
        if (result.rows.length > 0) {
            const currentNumber = result.rows[0].customer_number;
            const numPart = parseInt(currentNumber.split('-')[1], 10);
            nextNumber = numPart + 1;
        }
        return `CUS-${String(nextNumber).padStart(4, '0')}`;
    }
    /**
     * Find all customers for tenant with filters and pagination
     */
    static async findAll(tenantId, filters = {}, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const conditions = ['tenant_id = $1', 'deleted_at IS NULL'];
        const params = [tenantId];
        let paramIndex = 2;
        // Apply filters
        if (filters.status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(filters.status);
            paramIndex++;
        }
        if (filters.tier) {
            conditions.push(`tier = $${paramIndex}`);
            params.push(filters.tier);
            paramIndex++;
        }
        if (filters.type) {
            conditions.push(`type = $${paramIndex}`);
            params.push(filters.type);
            paramIndex++;
        }
        if (filters.parent_customer_id) {
            conditions.push(`parent_customer_id = $${paramIndex}`);
            params.push(filters.parent_customer_id);
            paramIndex++;
        }
        // Full-text search
        if (filters.search) {
            conditions.push(`(
        name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        customer_number ILIKE $${paramIndex}
      )`);
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        const whereClause = conditions.join(' AND ');
        // Count total
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].total, 10);
        // Fetch data
        const dataParams = [...params, limit, offset];
        const dataResult = await (0, database_1.query)(`SELECT * FROM customers
       WHERE ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, dataParams);
        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Find customer by ID
     */
    static async findById(id, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM customers
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [id, tenantId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Customer with ID ${id} not found`);
        }
        return result.rows[0];
    }
    /**
     * Find customer by customer_number
     */
    static async findByCustomerNumber(customerNumber, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM customers
       WHERE customer_number = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [customerNumber, tenantId]);
        return result.rows[0] || null;
    }
    /**
     * Create new customer
     */
    static async create(data, tenantId, userId) {
        // Generate customer number if not provided
        const customerNumber = data.customer_number || await this.generateCustomerNumber(tenantId);
        // Check for duplicate customer_number
        const existing = await this.findByCustomerNumber(customerNumber, tenantId);
        if (existing) {
            throw new errors_1.ConflictError(`Customer with number ${customerNumber} already exists`);
        }
        // Validate parent customer if provided
        if (data.parent_customer_id) {
            await this.validateParentCustomer(data.parent_customer_id, tenantId);
        }
        const result = await (0, database_1.query)(`INSERT INTO customers (
        tenant_id, name, display_name, customer_number, parent_customer_id,
        type, tier, status, email, phone, website,
        address_line1, address_line2, city, state, postal_code, country,
        tax_id, payment_terms, currency, custom_fields, tags, notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *`, [
            tenantId,
            data.name,
            data.display_name || null,
            customerNumber,
            data.parent_customer_id || null,
            data.type || 'business',
            data.tier || null,
            data.status || 'active',
            data.email || null,
            data.phone || null,
            data.website || null,
            data.address_line1 || null,
            data.address_line2 || null,
            data.city || null,
            data.state || null,
            data.postal_code || null,
            data.country || 'DEU',
            data.tax_id || null,
            data.payment_terms || 30,
            data.currency || 'EUR',
            JSON.stringify(data.custom_fields || {}),
            data.tags || [],
            data.notes || null,
            userId,
        ]);
        logger_1.default.info('Customer created', {
            customerId: result.rows[0].id,
            tenantId,
            customerNumber,
        });
        return result.rows[0];
    }
    /**
     * Update customer
     */
    static async update(id, tenantId, data) {
        // Verify customer exists
        await this.findById(id, tenantId);
        // Validate parent customer if being changed
        if (data.parent_customer_id !== undefined) {
            if (data.parent_customer_id) {
                await this.validateParentCustomer(data.parent_customer_id, tenantId, id);
            }
        }
        const fields = [];
        const params = [];
        let paramIndex = 1;
        // Build dynamic UPDATE query
        const updateFields = [
            'name', 'display_name', 'parent_customer_id', 'type', 'tier', 'status',
            'email', 'phone', 'website', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country', 'tax_id', 'payment_terms',
            'currency', 'tags', 'notes'
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
        const result = await (0, database_1.query)(`UPDATE customers
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`, params);
        logger_1.default.info('Customer updated', { customerId: id, tenantId });
        return result.rows[0];
    }
    /**
     * Soft delete customer
     */
    static async softDelete(id, tenantId) {
        // Verify customer exists
        await this.findById(id, tenantId);
        // Check if customer has active contracts or tickets
        // TODO: Add validation when those modules are implemented
        await (0, database_1.query)(`UPDATE customers
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        logger_1.default.info('Customer soft deleted', { customerId: id, tenantId });
    }
    /**
     * Validate parent customer exists and prevent circular references
     */
    static async validateParentCustomer(parentId, tenantId, currentCustomerId) {
        // Check parent exists
        await this.findById(parentId, tenantId);
        // Prevent self-reference
        if (currentCustomerId && parentId === currentCustomerId) {
            throw new errors_1.ConflictError('Customer cannot be its own parent');
        }
        // Check for circular reference (walk up the tree)
        if (currentCustomerId) {
            let current = parentId;
            const visited = new Set([currentCustomerId]);
            let depth = 0;
            const MAX_DEPTH = 3;
            while (current) {
                if (visited.has(current)) {
                    throw new errors_1.ConflictError('Circular parent relationship detected');
                }
                visited.add(current);
                depth++;
                if (depth > MAX_DEPTH) {
                    throw new errors_1.ConflictError(`Customer hierarchy cannot exceed ${MAX_DEPTH} levels`);
                }
                const parent = await (0, database_1.query)('SELECT parent_customer_id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [current, tenantId]);
                if (parent.rows.length === 0)
                    break;
                current = parent.rows[0].parent_customer_id;
            }
        }
    }
    /**
     * Get customer hierarchy (children)
     */
    static async getChildren(customerId, tenantId) {
        const result = await (0, database_1.query)(`SELECT * FROM customers
       WHERE parent_customer_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       ORDER BY name ASC`, [customerId, tenantId]);
        return result.rows;
    }
}
exports.CustomerModel = CustomerModel;
//# sourceMappingURL=customer.model.js.map