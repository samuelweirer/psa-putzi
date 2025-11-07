/**
 * Email Service
 * Handles SMTP email notifications for ticket events
 */

import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  text: string;
  html?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
}

export interface TicketEmailData {
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  description?: string;
  assignedTo?: string;
  customerName?: string;
  url?: string;
}

export interface CommentEmailData {
  ticketNumber: number;
  ticketTitle: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  url?: string;
}

export interface TimeEntryEmailData {
  ticketNumber: number;
  ticketTitle: string;
  technicianName: string;
  hours: number;
  description: string;
  url?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean;
  private from: string;
  private baseUrl: string;

  constructor() {
    this.enabled = process.env.SMTP_ENABLED === 'true';
    this.from = process.env.SMTP_FROM || 'noreply@psa-platform.local';
    this.baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

    if (this.enabled) {
      this.initializeTransporter();
    } else {
      logger.info('Email service disabled (SMTP_ENABLED=false)');
    }
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD || '',
            }
          : undefined,
      });

      logger.info('Email transporter initialized', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error });
      this.enabled = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      logger.debug('Email not sent (service disabled)', { subject: options.subject });
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', '),
        cc: options.cc?.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', '),
        bcc: options.bcc?.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html || options.text.replace(/\n/g, '<br>'),
      });

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: options.to.map((r) => r.email),
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        subject: options.subject,
        to: options.to.map((r) => r.email),
      });
      return false;
    }
  }

  /**
   * Send ticket created notification
   */
  async sendTicketCreated(
    recipients: EmailRecipient[],
    ticketData: TicketEmailData
  ): Promise<boolean> {
    const url = ticketData.url || `${this.baseUrl}/tickets/${ticketData.ticketNumber}`;

    const subject = `[Ticket #${ticketData.ticketNumber}] Neues Ticket erstellt: ${ticketData.title}`;

    const text = `
Ein neues Ticket wurde erstellt:

Ticket: #${ticketData.ticketNumber}
Titel: ${ticketData.title}
Status: ${ticketData.status}
Priorität: ${ticketData.priority}
${ticketData.assignedTo ? `Zugewiesen an: ${ticketData.assignedTo}` : 'Nicht zugewiesen'}
${ticketData.customerName ? `Kunde: ${ticketData.customerName}` : ''}

${ticketData.description ? `Beschreibung:\n${ticketData.description}` : ''}

Ticket anzeigen: ${url}

---
Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.
    `.trim();

    const html = `
      <h2>Ein neues Ticket wurde erstellt</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ticket:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${ticketData.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Titel:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.title}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.status}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Priorität:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.priority}</td>
        </tr>
        ${
          ticketData.assignedTo
            ? `<tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Zugewiesen an:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.assignedTo}</td>
        </tr>`
            : ''
        }
        ${
          ticketData.customerName
            ? `<tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Kunde:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.customerName}</td>
        </tr>`
            : ''
        }
      </table>
      ${ticketData.description ? `<p><strong>Beschreibung:</strong><br>${ticketData.description.replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ticket anzeigen</a></p>
      <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.</p>
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Send ticket assigned notification
   */
  async sendTicketAssigned(
    recipients: EmailRecipient[],
    ticketData: TicketEmailData
  ): Promise<boolean> {
    const url = ticketData.url || `${this.baseUrl}/tickets/${ticketData.ticketNumber}`;

    const subject = `[Ticket #${ticketData.ticketNumber}] Ihnen zugewiesen: ${ticketData.title}`;

    const text = `
Ein Ticket wurde Ihnen zugewiesen:

Ticket: #${ticketData.ticketNumber}
Titel: ${ticketData.title}
Priorität: ${ticketData.priority}
${ticketData.customerName ? `Kunde: ${ticketData.customerName}` : ''}

${ticketData.description ? `Beschreibung:\n${ticketData.description}` : ''}

Ticket anzeigen: ${url}

---
Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.
    `.trim();

    const html = `
      <h2>Ein Ticket wurde Ihnen zugewiesen</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ticket:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${ticketData.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Titel:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.title}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Priorität:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.priority}</td>
        </tr>
        ${
          ticketData.customerName
            ? `<tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Kunde:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.customerName}</td>
        </tr>`
            : ''
        }
      </table>
      ${ticketData.description ? `<p><strong>Beschreibung:</strong><br>${ticketData.description.replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ticket anzeigen</a></p>
      <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.</p>
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Send ticket status changed notification
   */
  async sendTicketStatusChanged(
    recipients: EmailRecipient[],
    ticketData: TicketEmailData,
    oldStatus: string
  ): Promise<boolean> {
    const url = ticketData.url || `${this.baseUrl}/tickets/${ticketData.ticketNumber}`;

    const subject = `[Ticket #${ticketData.ticketNumber}] Status geändert: ${oldStatus} → ${ticketData.status}`;

    const text = `
Der Status eines Tickets wurde geändert:

Ticket: #${ticketData.ticketNumber}
Titel: ${ticketData.title}
Alter Status: ${oldStatus}
Neuer Status: ${ticketData.status}

Ticket anzeigen: ${url}

---
Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.
    `.trim();

    const html = `
      <h2>Ticket-Status wurde geändert</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ticket:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${ticketData.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Titel:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${ticketData.title}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Alter Status:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${oldStatus}</td>
        </tr>
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Neuer Status:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>${ticketData.status}</strong></td>
        </tr>
      </table>
      <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ticket anzeigen</a></p>
      <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.</p>
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Send comment added notification
   */
  async sendCommentAdded(
    recipients: EmailRecipient[],
    commentData: CommentEmailData
  ): Promise<boolean> {
    const url = commentData.url || `${this.baseUrl}/tickets/${commentData.ticketNumber}`;

    const visibility = commentData.isInternal ? '(Intern)' : '';
    const subject = `[Ticket #${commentData.ticketNumber}] Neuer Kommentar ${visibility}`;

    const text = `
Ein neuer Kommentar wurde zu Ticket #${commentData.ticketNumber} hinzugefügt:

Ticket: #${commentData.ticketNumber} - ${commentData.ticketTitle}
Von: ${commentData.authorName}
${commentData.isInternal ? 'Sichtbarkeit: Intern (nur für Techniker)' : 'Sichtbarkeit: Extern (für Kunden sichtbar)'}

Kommentar:
${commentData.content}

Ticket anzeigen: ${url}

---
Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.
    `.trim();

    const html = `
      <h2>Neuer Kommentar zu Ticket #${commentData.ticketNumber}</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ticket:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${commentData.ticketNumber} - ${commentData.ticketTitle}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Von:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${commentData.authorName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Sichtbarkeit:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${commentData.isInternal ? '<span style="color: #dc2626;">Intern (nur für Techniker)</span>' : '<span style="color: #16a34a;">Extern (für Kunden sichtbar)</span>'}</td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #4F46E5;">
        <p style="margin: 0;"><strong>Kommentar:</strong></p>
        <p style="margin: 10px 0 0 0;">${commentData.content.replace(/\n/g, '<br>')}</p>
      </div>
      <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ticket anzeigen</a></p>
      <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.</p>
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Send time entry logged notification
   */
  async sendTimeEntryLogged(
    recipients: EmailRecipient[],
    timeData: TimeEntryEmailData
  ): Promise<boolean> {
    const url = timeData.url || `${this.baseUrl}/tickets/${timeData.ticketNumber}`;

    const subject = `[Ticket #${timeData.ticketNumber}] Arbeitszeit erfasst: ${timeData.hours}h`;

    const text = `
Arbeitszeit wurde für Ticket #${timeData.ticketNumber} erfasst:

Ticket: #${timeData.ticketNumber} - ${timeData.ticketTitle}
Techniker: ${timeData.technicianName}
Stunden: ${timeData.hours}h
Beschreibung: ${timeData.description}

Ticket anzeigen: ${url}

---
Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.
    `.trim();

    const html = `
      <h2>Arbeitszeit erfasst für Ticket #${timeData.ticketNumber}</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ticket:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${timeData.ticketNumber} - ${timeData.ticketTitle}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Techniker:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${timeData.technicianName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Stunden:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>${timeData.hours}h</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Beschreibung:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${timeData.description}</td>
        </tr>
      </table>
      <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ticket anzeigen</a></p>
      <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch vom PSA-Platform Ticketsystem generiert.</p>
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      logger.warn('Cannot test email - service disabled');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection test successful');
      return true;
    } catch (error) {
      logger.error('Email service connection test failed', { error });
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
