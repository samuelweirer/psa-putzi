/**
 * Notification Helper
 *
 * Helper functions to prepare data for email notifications
 */

import { query } from './database';
import { EmailRecipient, TicketEmailData } from '../services/email.service';
import logger from './logger';

/**
 * Get user email and name by user ID
 */
export async function getUserEmail(userId: string): Promise<EmailRecipient | null> {
  try {
    const result = await query(
      `SELECT email, first_name, last_name
       FROM users
       WHERE id = $1 AND deleted_at IS NULL AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
    };
  } catch (error) {
    logger.error('Failed to fetch user email', { userId, error });
    return null;
  }
}

/**
 * Get customer primary contact email
 */
export async function getCustomerContactEmail(customerId: string): Promise<EmailRecipient | null> {
  try {
    const result = await query(
      `SELECT c.email, c.first_name, c.last_name
       FROM contacts c
       WHERE c.customer_id = $1
         AND c.is_primary = true
         AND c.deleted_at IS NULL
       LIMIT 1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const contact = result.rows[0];
    return {
      email: contact.email,
      name: `${contact.first_name} ${contact.last_name}`.trim(),
    };
  } catch (error) {
    logger.error('Failed to fetch customer contact email', { customerId, error });
    return null;
  }
}

/**
 * Prepare ticket data for email notification
 */
export async function prepareTicketEmailData(ticket: any): Promise<TicketEmailData> {
  let assignedToName: string | undefined;
  let customerName: string | undefined;

  // Get assigned user name
  if (ticket.assigned_to) {
    const result = await query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [ticket.assigned_to]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      assignedToName = `${user.first_name} ${user.last_name}`.trim();
    }
  }

  // Get customer name
  if (ticket.customer_id) {
    const result = await query(
      `SELECT company_name FROM customers WHERE id = $1`,
      [ticket.customer_id]
    );
    if (result.rows.length > 0) {
      customerName = result.rows[0].company_name;
    }
  }

  return {
    ticketNumber: ticket.ticket_number,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    description: ticket.description,
    assignedTo: assignedToName,
    customerName,
    url: `http://localhost:5173/tickets/${ticket.ticket_number}`,
  };
}

/**
 * Get recipients for ticket notification
 * Returns assigned user + customer contact
 */
export async function getTicketNotificationRecipients(
  ticket: any,
  includeCustomer = true
): Promise<EmailRecipient[]> {
  const recipients: EmailRecipient[] = [];

  // Add assigned user
  if (ticket.assigned_to) {
    const assignedUser = await getUserEmail(ticket.assigned_to);
    if (assignedUser) {
      recipients.push(assignedUser);
    }
  }

  // Add customer primary contact
  if (includeCustomer && ticket.customer_id) {
    const customerContact = await getCustomerContactEmail(ticket.customer_id);
    if (customerContact) {
      recipients.push(customerContact);
    }
  }

  return recipients;
}
