/**
 * Email Ingestion Service (IMAP)
 *
 * Polls IMAP mailbox for incoming emails and creates tickets/comments.
 * Supports:
 * - Creating new tickets from incoming emails
 * - Adding comments to existing tickets (reply detection via ticket number)
 * - Attachment handling
 * - Thread tracking
 */

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { query } from '../utils/database';
import { TicketModel } from '../models/ticket.model';
import { CommentModel } from '../models/comment.model';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface EmailIngestionConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  pollInterval: number; // milliseconds
  mailbox: string; // e.g., 'INBOX'
  processedMailbox?: string; // Move processed emails here (e.g., 'INBOX/Processed')
}

export class EmailIngestionService {
  private config: EmailIngestionConfig;
  private imap: Imap | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    this.config = {
      enabled: process.env.IMAP_ENABLED === 'true',
      host: process.env.IMAP_HOST || 'localhost',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASSWORD || '',
      tls: process.env.IMAP_TLS !== 'false',
      pollInterval: parseInt(process.env.IMAP_POLL_INTERVAL || '60000', 10), // 1 minute
      mailbox: process.env.IMAP_MAILBOX || 'INBOX',
      processedMailbox: process.env.IMAP_PROCESSED_MAILBOX,
    };

    if (this.config.enabled) {
      this.start();
    } else {
      logger.info('Email ingestion disabled (IMAP_ENABLED=false)');
    }
  }

  /**
   * Start email ingestion polling
   */
  start(): void {
    if (this.pollingTimer) {
      logger.warn('Email ingestion already started');
      return;
    }

    logger.info('Starting email ingestion service', {
      host: this.config.host,
      port: this.config.port,
      mailbox: this.config.mailbox,
      pollInterval: this.config.pollInterval,
    });

    // Initial poll
    this.poll();

    // Start periodic polling
    this.pollingTimer = setInterval(() => {
      this.poll();
    }, this.config.pollInterval);
  }

  /**
   * Stop email ingestion polling
   */
  stop(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      logger.info('Email ingestion service stopped');
    }

    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }

  /**
   * Poll IMAP mailbox for new emails
   */
  private async poll(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Email ingestion already processing, skipping poll');
      return;
    }

    this.isProcessing = true;

    try {
      await this.processMailbox();
    } catch (error) {
      logger.error('Error during email polling', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process mailbox - fetch and process unseen emails
   */
  private async processMailbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.imap = new Imap({
          user: this.config.user,
          password: this.config.password,
          host: this.config.host,
          port: this.config.port,
          tls: this.config.tls,
          tlsOptions: { rejectUnauthorized: false },
        });

        this.imap.once('ready', () => {
          logger.debug('IMAP connection ready');

          this.imap!.openBox(this.config.mailbox, false, (err, box) => {
            if (err) {
              logger.error('Failed to open mailbox', { error: err, mailbox: this.config.mailbox });
              this.imap!.end();
              reject(err);
              return;
            }

            logger.debug('Mailbox opened', { mailbox: this.config.mailbox, messages: box.messages.total });

            // Search for unseen messages
            this.imap!.search(['UNSEEN'], async (searchErr, results) => {
              if (searchErr) {
                logger.error('IMAP search failed', { error: searchErr });
                this.imap!.end();
                reject(searchErr);
                return;
              }

              if (results.length === 0) {
                logger.debug('No new emails found');
                this.imap!.end();
                resolve();
                return;
              }

              logger.info('Found new emails', { count: results.length });

              const fetch = this.imap!.fetch(results, { bodies: '', markSeen: true });

              const emailPromises: Promise<void>[] = [];

              fetch.on('message', (msg, seqno) => {
                emailPromises.push(this.processMessage(msg, seqno));
              });

              fetch.once('error', (fetchErr) => {
                logger.error('Fetch error', { error: fetchErr });
                reject(fetchErr);
              });

              fetch.once('end', async () => {
                logger.debug('Fetch complete, processing emails');
                try {
                  await Promise.all(emailPromises);
                  logger.info('All emails processed successfully', { count: results.length });
                } catch (processErr) {
                  logger.error('Error processing some emails', { error: processErr });
                }
                this.imap!.end();
                resolve();
              });
            });
          });
        });

        this.imap.once('error', (imapErr: Error) => {
          logger.error('IMAP connection error', { error: imapErr });
          reject(imapErr);
        });

        this.imap.once('end', () => {
          logger.debug('IMAP connection ended');
        });

        this.imap.connect();
      } catch (error) {
        logger.error('Exception in processMailbox', { error });
        reject(error);
      }
    });
  }

  /**
   * Process individual email message
   */
  private async processMessage(msg: any, seqno: number): Promise<void> {
    return new Promise((resolve, reject) => {
      msg.on('body', async (stream: any) => {
        try {
          const parsed = await simpleParser(stream);
          logger.info('Processing email', {
            seqno,
            from: parsed.from?.text,
            subject: parsed.subject,
          });

          await this.handleEmail(parsed);
          resolve();
        } catch (error) {
          logger.error('Failed to parse email', { seqno, error });
          reject(error);
        }
      });

      msg.once('error', (err: Error) => {
        logger.error('Message error', { seqno, error: err });
        reject(err);
      });
    });
  }

  /**
   * Handle parsed email - create ticket or add comment
   */
  private async handleEmail(email: ParsedMail): Promise<void> {
    try {
      // Extract ticket number from subject if present (e.g., [Ticket #123] or Re: [Ticket #123])
      const ticketNumber = this.extractTicketNumber(email.subject || '');

      if (ticketNumber) {
        // This is a reply to an existing ticket
        await this.addCommentToTicket(ticketNumber, email);
      } else {
        // This is a new ticket
        await this.createTicketFromEmail(email);
      }
    } catch (error) {
      logger.error('Failed to handle email', {
        from: email.from?.text,
        subject: email.subject,
        error,
      });
      throw error;
    }
  }

  /**
   * Extract ticket number from email subject
   * Matches: [Ticket #123], Re: [Ticket #123], etc.
   */
  private extractTicketNumber(subject: string): number | null {
    const match = subject.match(/\[Ticket #(\d+)\]/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Create ticket from incoming email
   */
  private async createTicketFromEmail(email: ParsedMail): Promise<void> {
    try {
      const fromAddress = email.from?.value[0]?.address;
      if (!fromAddress) {
        logger.warn('Email has no from address, skipping', { subject: email.subject });
        return;
      }

      // Find customer/contact by email
      const { customerId, contactId, tenantId } = await this.findCustomerByEmail(fromAddress);

      if (!customerId || !tenantId) {
        logger.warn('No customer found for email address', { email: fromAddress, subject: email.subject });
        // TODO: Create customer or assign to default tenant
        return;
      }

      // Extract email body (prefer text, fallback to HTML)
      const description = email.text || email.html || '';

      // Create ticket
      const ticket = await TicketModel.create(
        {
          customer_id: customerId,
          contact_id: contactId || undefined,
          title: email.subject || 'No Subject',
          description,
          priority: 'medium',
          status: 'new',
          source: 'email',
          source_reference: email.messageId,
        },
        tenantId,
        contactId || 'system' // created_by
      );

      logger.info('Ticket created from email', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        from: fromAddress,
        subject: email.subject,
      });

      // Handle attachments
      if (email.attachments && email.attachments.length > 0) {
        await this.saveAttachments(email.attachments, ticket.id, tenantId);
      }
    } catch (error) {
      logger.error('Failed to create ticket from email', { error });
      throw error;
    }
  }

  /**
   * Add comment to existing ticket from email reply
   */
  private async addCommentToTicket(ticketNumber: number, email: ParsedMail): Promise<void> {
    try {
      const fromAddress = email.from?.value[0]?.address;
      if (!fromAddress) {
        logger.warn('Email has no from address, skipping', { subject: email.subject });
        return;
      }

      // Find ticket by ticket number
      const ticketResult = await query(
        `SELECT id, tenant_id FROM tickets WHERE ticket_number = $1 AND deleted_at IS NULL`,
        [ticketNumber]
      );

      if (ticketResult.rows.length === 0) {
        logger.warn('Ticket not found for reply', { ticketNumber, from: fromAddress });
        return;
      }

      const ticket = ticketResult.rows[0];

      // Find user by email
      const userResult = await query(
        `SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [fromAddress, ticket.tenant_id]
      );

      const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

      if (!userId) {
        logger.warn('User not found for email, cannot add comment', { email: fromAddress });
        return;
      }

      // Extract email body
      const content = email.text || email.html || '';

      // Determine if internal or external (technicians = internal, customers = external)
      const roleResult = await query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      );
      const isInternal = roleResult.rows[0]?.role === 'technician' || roleResult.rows[0]?.role === 'admin';

      // Create comment
      await CommentModel.create(
        {
          ticket_id: ticket.id,
          content,
          is_internal: isInternal,
        },
        ticket.tenant_id,
        userId || undefined
      );

      logger.info('Comment added from email', {
        ticketId: ticket.id,
        ticketNumber,
        from: fromAddress,
        isInternal,
      });

      // Handle attachments
      if (email.attachments && email.attachments.length > 0) {
        await this.saveAttachments(email.attachments, ticket.id, ticket.tenant_id);
      }
    } catch (error) {
      logger.error('Failed to add comment from email', { ticketNumber, error });
      throw error;
    }
  }

  /**
   * Find customer and tenant by email address
   */
  private async findCustomerByEmail(
    email: string
  ): Promise<{ customerId: string | null; contactId: string | null; tenantId: string | null }> {
    try {
      const result = await query(
        `SELECT c.id as contact_id, c.customer_id, cust.tenant_id
         FROM contacts c
         JOIN customers cust ON c.customer_id = cust.id
         WHERE c.email = $1 AND c.deleted_at IS NULL AND cust.deleted_at IS NULL
         LIMIT 1`,
        [email]
      );

      if (result.rows.length > 0) {
        return {
          customerId: result.rows[0].customer_id,
          contactId: result.rows[0].contact_id,
          tenantId: result.rows[0].tenant_id,
        };
      }

      return { customerId: null, contactId: null, tenantId: null };
    } catch (error) {
      logger.error('Error finding customer by email', { email, error });
      return { customerId: null, contactId: null, tenantId: null };
    }
  }

  /**
   * Save email attachments to disk
   */
  private async saveAttachments(
    attachments: any[],
    ticketId: string,
    _tenantId: string
  ): Promise<void> {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    for (const attachment of attachments) {
      try {
        const filename = `${uuidv4()}-${attachment.filename}`;
        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, attachment.content);

        // Insert into attachments table
        await query(
          `INSERT INTO attachments (ticket_id, filename, original_filename, file_path, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ticketId,
            filename,
            attachment.filename,
            filePath,
            attachment.size,
            attachment.contentType,
          ]
        );

        logger.info('Attachment saved', {
          ticketId,
          filename: attachment.filename,
          size: attachment.size,
        });
      } catch (error) {
        logger.error('Failed to save attachment', {
          ticketId,
          filename: attachment.filename,
          error,
        });
      }
    }
  }
}

// Singleton instance
export const emailIngestionService = new EmailIngestionService();
