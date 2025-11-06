/**
 * Time Entry Model
 *
 * CRITICAL: Time entries use the SNAPSHOT pattern for billing rates.
 * When a time entry is created, both billing_rate and cost_rate are resolved
 * and stored in the database. This ensures historical accuracy even if rates
 * change later.
 *
 * Multi-tenancy: All queries MUST filter by tenant_id
 */

import { query } from '../utils/database';
import { TimeEntry, PaginatedResponse } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { eventPublisher, createDomainEvent } from '../utils/event-publisher';
import { BillingRateService } from '../services/billing-rate.service';

export class TimeEntryModel {
  /**
   * Find all time entries for a ticket with pagination
   */
  static async findByTicket(
    ticketId: string,
    tenantId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<TimeEntry>> {
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM time_entries
       WHERE ticket_id = $1 AND tenant_id = $2`,
      [ticketId, tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch data with user info
    const dataResult = await query(
      `SELECT
        te.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email
       FROM time_entries te
       LEFT JOIN users u ON te.user_id = u.id
       WHERE te.ticket_id = $1 AND te.tenant_id = $2
       ORDER BY te.date DESC, te.created_at DESC
       LIMIT $3 OFFSET $4`,
      [ticketId, tenantId, limit, offset]
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
   * Find time entry by ID
   */
  static async findById(id: string, tenantId: string): Promise<TimeEntry> {
    const result = await query(
      `SELECT
        te.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        t.ticket_number,
        t.title as ticket_title
       FROM time_entries te
       LEFT JOIN users u ON te.user_id = u.id
       LEFT JOIN tickets t ON te.ticket_id = t.id
       WHERE te.id = $1 AND te.tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Time entry with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create new time entry with automatic rate resolution
   *
   * CRITICAL: This method resolves billing rates using the 4-level hierarchy
   * and snapshots them in the database.
   */
  static async create(
    data: Partial<TimeEntry>,
    tenantId: string,
    userId: string
  ): Promise<TimeEntry> {
    // Validate required fields
    if (!data.ticket_id && !data.project_task_id) {
      throw new ValidationError('Either ticket_id or project_task_id is required');
    }
    if (!data.hours || data.hours <= 0) {
      throw new ValidationError('Hours must be greater than 0');
    }
    if (!data.description) {
      throw new ValidationError('Description is required');
    }

    // Get customer_id from ticket
    let customerId: string;
    let contractId: string | null = null;

    if (data.ticket_id) {
      const ticketResult = await query(
        `SELECT customer_id, contract_id FROM tickets
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [data.ticket_id, tenantId]
      );

      if (ticketResult.rows.length === 0) {
        throw new NotFoundError(`Ticket ${data.ticket_id} not found`);
      }

      customerId = ticketResult.rows[0].customer_id;
      contractId = ticketResult.rows[0].contract_id;
    } else {
      // For project tasks, we'd need to get customer from project
      // TODO: Implement when project module is ready
      throw new ValidationError('Project task time entries not yet supported');
    }

    // Resolve billing and cost rates using the 4-level hierarchy
    const rates = await BillingRateService.resolveRates(
      userId,
      customerId,
      contractId,
      null, // service_level - can be added later
      data.work_type || null,
      data.date || new Date()
    );

    // Create time entry with snapshotted rates
    const result = await query(
      `INSERT INTO time_entries (
        tenant_id, ticket_id, project_task_id, user_id,
        date, hours, description, notes, work_type,
        billable, billed, billing_rate, cost_rate
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        tenantId,
        data.ticket_id || null,
        data.project_task_id || null,
        userId,
        data.date || new Date(),
        data.hours,
        data.description,
        data.notes || null,
        data.work_type || 'support',
        data.billable !== false, // Default to true
        false, // Always starts as not billed
        rates.billing_rate,
        rates.cost_rate,
      ]
    );

    const timeEntry = result.rows[0];

    // Calculate totals for logging
    const totals = BillingRateService.calculateTotals(
      timeEntry.hours,
      timeEntry.billing_rate,
      timeEntry.cost_rate
    );

    logger.info('Time entry created', {
      timeEntryId: timeEntry.id,
      ticketId: data.ticket_id,
      userId,
      tenantId,
      hours: timeEntry.hours,
      billingRate: timeEntry.billing_rate,
      costRate: timeEntry.cost_rate,
      revenue: totals.revenue,
      profit: totals.profit,
    });

    // Publish time_entry.created event
    await eventPublisher.publish(
      'time_entry.created',
      createDomainEvent('time_entry.created', tenantId, { timeEntry, totals }, userId)
    );

    return timeEntry;
  }

  /**
   * Update time entry
   *
   * NOTE: Billing and cost rates cannot be updated once created (snapshot pattern)
   */
  static async update(
    id: string,
    tenantId: string,
    data: Partial<TimeEntry>,
    userId?: string
  ): Promise<TimeEntry> {
    // Verify time entry exists
    const existing = await this.findById(id, tenantId);

    // Don't allow updating rates (snapshot pattern)
    if (data.billing_rate !== undefined || data.cost_rate !== undefined) {
      throw new ValidationError('Billing and cost rates cannot be updated after creation');
    }

    // Don't allow updating if already billed
    if (existing.billed) {
      throw new ValidationError('Cannot update time entry that has already been billed');
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    const updateFields = ['date', 'hours', 'description', 'notes', 'work_type', 'billable'];

    updateFields.forEach((field) => {
      if (data[field as keyof TimeEntry] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof TimeEntry]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      // No fields to update
      return existing;
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    const result = await query(
      `UPDATE time_entries
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    const timeEntry = result.rows[0];

    logger.info('Time entry updated', { timeEntryId: id, tenantId, changes: data });

    // Publish time_entry.updated event
    await eventPublisher.publish(
      'time_entry.updated',
      createDomainEvent('time_entry.updated', tenantId, { timeEntry, changes: data }, userId)
    );

    return timeEntry;
  }

  /**
   * Delete time entry
   *
   * NOTE: Time entries cannot be deleted if already billed
   */
  static async delete(id: string, tenantId: string, userId?: string): Promise<void> {
    // Verify time entry exists
    const timeEntry = await this.findById(id, tenantId);

    // Don't allow deleting if already billed
    if (timeEntry.billed) {
      throw new ValidationError('Cannot delete time entry that has already been billed');
    }

    await query(
      `DELETE FROM time_entries
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    logger.info('Time entry deleted', { timeEntryId: id, tenantId });

    // Publish time_entry.deleted event
    await eventPublisher.publish(
      'time_entry.deleted',
      createDomainEvent('time_entry.deleted', tenantId, { timeEntryId: id, timeEntry }, userId)
    );
  }

  /**
   * Get time entry summary for a ticket
   */
  static async getTicketSummary(ticketId: string, tenantId: string): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(*) as entry_count,
        SUM(hours) as total_hours,
        SUM(CASE WHEN billable = true THEN hours ELSE 0 END) as billable_hours,
        SUM(CASE WHEN billable = true THEN hours * billing_rate ELSE 0 END) as total_revenue,
        SUM(hours * cost_rate) as total_cost,
        SUM(CASE WHEN billable = true THEN hours * (billing_rate - cost_rate) ELSE 0 END) as total_profit,
        COUNT(CASE WHEN billed = true THEN 1 END) as billed_count,
        COUNT(CASE WHEN billed = false AND billable = true THEN 1 END) as unbilled_count
       FROM time_entries
       WHERE ticket_id = $1 AND tenant_id = $2`,
      [ticketId, tenantId]
    );

    const summary = result.rows[0];

    // Calculate margin percentage
    const totalRevenue = parseFloat(summary.total_revenue || 0);
    const totalProfit = parseFloat(summary.total_profit || 0);
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      entry_count: parseInt(summary.entry_count, 10),
      total_hours: parseFloat(summary.total_hours || 0),
      billable_hours: parseFloat(summary.billable_hours || 0),
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_cost: parseFloat((summary.total_cost || 0).toFixed(2)),
      total_profit: parseFloat(totalProfit.toFixed(2)),
      margin_percent: parseFloat(marginPercent.toFixed(2)),
      billed_count: parseInt(summary.billed_count, 10),
      unbilled_count: parseInt(summary.unbilled_count, 10),
    };
  }

  /**
   * Get unbilled time entries for a tenant
   */
  static async findUnbilled(
    tenantId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<TimeEntry>> {
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM time_entries
       WHERE tenant_id = $1 AND billable = true AND billed = false`,
      [tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch data
    const dataResult = await query(
      `SELECT
        te.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        t.ticket_number,
        c.name as customer_name
       FROM time_entries te
       LEFT JOIN users u ON te.user_id = u.id
       LEFT JOIN tickets t ON te.ticket_id = t.id
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE te.tenant_id = $1 AND te.billable = true AND te.billed = false
       ORDER BY te.date ASC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
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
