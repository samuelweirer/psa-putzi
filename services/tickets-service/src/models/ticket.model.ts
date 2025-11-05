/**
 * Ticket Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */

import { query } from '../utils/database';
import { Ticket, TicketFilters, PaginatedResponse } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { eventPublisher, createDomainEvent } from '../utils/event-publisher';

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'new': ['assigned', 'in_progress', 'cancelled'],
  'assigned': ['in_progress', 'waiting_customer', 'cancelled'],
  'in_progress': ['waiting_customer', 'waiting_vendor', 'resolved', 'cancelled'],
  'waiting_customer': ['in_progress', 'resolved', 'cancelled'],
  'waiting_vendor': ['in_progress', 'resolved', 'cancelled'],
  'resolved': ['closed', 'in_progress'], // Can reopen
  'closed': [], // Cannot transition from closed
  'cancelled': []
};

export class TicketModel {
  /**
   * Generate next ticket number for tenant
   */
  static async generateTicketNumber(tenantId: string): Promise<number> {
    const result = await query(
      `SELECT ticket_number FROM tickets
       WHERE tenant_id = $1
       AND deleted_at IS NULL
       ORDER BY ticket_number DESC
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return 1;
    }

    return result.rows[0].ticket_number + 1;
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
    }
  }

  /**
   * Find all tickets for tenant with filters and pagination
   */
  static async findAll(
    tenantId: string,
    filters: TicketFilters = {},
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Ticket>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['t.tenant_id = $1', 't.deleted_at IS NULL'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (filters.status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      conditions.push(`t.priority = $${paramIndex}`);
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.assigned_to) {
      conditions.push(`t.assigned_to = $${paramIndex}`);
      params.push(filters.assigned_to);
      paramIndex++;
    }

    if (filters.customer_id) {
      conditions.push(`t.customer_id = $${paramIndex}`);
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.sla_breached !== undefined) {
      conditions.push(`t.sla_breached = $${paramIndex}`);
      params.push(filters.sla_breached);
      paramIndex++;
    }

    if (filters.created_from) {
      conditions.push(`t.created_at >= $${paramIndex}`);
      params.push(filters.created_from);
      paramIndex++;
    }

    if (filters.created_to) {
      conditions.push(`t.created_at <= $${paramIndex}`);
      params.push(filters.created_to);
      paramIndex++;
    }

    // Full-text search
    if (filters.search) {
      conditions.push(`(
        t.title ILIKE $${paramIndex} OR
        t.description ILIKE $${paramIndex} OR
        CAST(t.ticket_number AS TEXT) ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM tickets t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch data with customer info
    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT
        t.*,
        c.name as customer_name,
        u.email as assigned_to_email,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
       FROM tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

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
   * Find ticket by ID
   */
  static async findById(id: string, tenantId: string): Promise<Ticket> {
    const result = await query(
      `SELECT
        t.*,
        c.name as customer_name,
        u.email as assigned_to_email,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
       FROM tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Ticket with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Find ticket by ticket_number
   */
  static async findByTicketNumber(ticketNumber: number, tenantId: string): Promise<Ticket | null> {
    const result = await query(
      `SELECT * FROM tickets
       WHERE ticket_number = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [ticketNumber, tenantId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new ticket
   */
  static async create(data: Partial<Ticket>, tenantId: string, userId: string): Promise<Ticket> {
    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(tenantId);

    // Default values
    const priority = data.priority || 'medium';
    const status = data.status || 'new';
    const source = data.source || 'portal';

    const result = await query(
      `INSERT INTO tickets (
        tenant_id, ticket_number, customer_id, contact_id, location_id, contract_id,
        title, description, priority, status, category, subcategory,
        assigned_to, assigned_team, custom_fields, tags, source, source_reference,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        tenantId,
        ticketNumber,
        data.customer_id,
        data.contact_id || null,
        data.location_id || null,
        data.contract_id || null,
        data.title,
        data.description || null,
        priority,
        status,
        data.category || null,
        data.subcategory || null,
        data.assigned_to || null,
        data.assigned_team || null,
        JSON.stringify(data.custom_fields || {}),
        data.tags || [],
        source,
        data.source_reference || null,
        userId,
      ]
    );

    const ticket = result.rows[0];

    logger.info('Ticket created', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      tenantId,
      customerId: ticket.customer_id,
    });

    // Publish ticket.created event
    await eventPublisher.publish(
      'ticket.created',
      createDomainEvent('ticket.created', tenantId, { ticket }, userId)
    );

    return ticket;
  }

  /**
   * Update ticket
   */
  static async update(id: string, tenantId: string, data: Partial<Ticket>, userId?: string): Promise<Ticket> {
    // Verify ticket exists and get current state
    const currentTicket = await this.findById(id, tenantId);

    // Validate status transition if status is being changed
    if (data.status && data.status !== currentTicket.status) {
      this.validateStatusTransition(currentTicket.status, data.status);
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    const updateFields = [
      'title', 'description', 'priority', 'status', 'category', 'subcategory',
      'assigned_to', 'assigned_team', 'contact_id', 'location_id', 'contract_id',
      'tags', 'source', 'source_reference', 'parent_ticket_id'
    ];

    updateFields.forEach((field) => {
      if (data[field as keyof Ticket] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof Ticket]);
        paramIndex++;
      }
    });

    // Handle custom_fields separately (JSONB)
    if (data.custom_fields !== undefined) {
      fields.push(`custom_fields = $${paramIndex}`);
      params.push(JSON.stringify(data.custom_fields));
      paramIndex++;
    }

    // Handle status-specific timestamp updates
    if (data.status) {
      if (data.status === 'resolved' && !currentTicket.resolved_at) {
        fields.push(`resolved_at = NOW()`);
      }
      if (data.status === 'closed' && !currentTicket.closed_at) {
        fields.push(`closed_at = NOW()`);
      }
    }

    if (fields.length === 0) {
      // No fields to update
      return currentTicket;
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    const result = await query(
      `UPDATE tickets
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      params
    );

    const ticket = result.rows[0];

    logger.info('Ticket updated', { ticketId: id, tenantId, changes: data });

    // Publish ticket.updated event
    await eventPublisher.publish(
      'ticket.updated',
      createDomainEvent('ticket.updated', tenantId, { ticket, changes: data }, userId)
    );

    // Publish specific events for important state changes
    if (data.status === 'resolved') {
      await eventPublisher.publish(
        'ticket.resolved',
        createDomainEvent('ticket.resolved', tenantId, { ticket }, userId)
      );
    }

    if (data.assigned_to && data.assigned_to !== currentTicket.assigned_to) {
      await eventPublisher.publish(
        'ticket.assigned',
        createDomainEvent('ticket.assigned', tenantId, {
          ticket,
          assignedTo: data.assigned_to,
          previousAssignee: currentTicket.assigned_to,
        }, userId)
      );
    }

    return ticket;
  }

  /**
   * Soft delete ticket
   */
  static async softDelete(id: string, tenantId: string, userId?: string): Promise<void> {
    // Verify ticket exists
    const ticket = await this.findById(id, tenantId);

    await query(
      `UPDATE tickets
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    logger.info('Ticket deleted', { ticketId: id, tenantId });

    // Publish ticket.deleted event
    await eventPublisher.publish(
      'ticket.deleted',
      createDomainEvent('ticket.deleted', tenantId, { ticketId: id, ticket }, userId)
    );
  }

  /**
   * Get ticket statistics for tenant
   */
  static async getStatistics(tenantId: string): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'new') as new_tickets,
        COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress')) as open_tickets,
        COUNT(*) FILTER (WHERE status = 'waiting_customer') as waiting_customer,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
        COUNT(*) FILTER (WHERE sla_breached = true) as sla_breached,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical_priority,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority
       FROM tickets
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    );

    return result.rows[0];
  }

  /**
   * Get tickets assigned to a user
   */
  static async findByAssignedUser(
    userId: string,
    tenantId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Ticket>> {
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM tickets
       WHERE assigned_to = $1 AND tenant_id = $2 AND deleted_at IS NULL
       AND status NOT IN ('closed', 'cancelled')`,
      [userId, tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch data
    const dataResult = await query(
      `SELECT t.*, c.name as customer_name
       FROM tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.assigned_to = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
       AND t.status NOT IN ('closed', 'cancelled')
       ORDER BY t.priority DESC, t.created_at ASC
       LIMIT $3 OFFSET $4`,
      [userId, tenantId, limit, offset]
    );

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
}
