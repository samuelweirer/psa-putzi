/**
 * Contact Controller
 *
 * Handles HTTP requests for contact management
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ContactModel } from '../models/contact.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class ContactController {
  /**
   * GET /api/v1/customers/:customerId/contacts
   * List all contacts for a customer
   */
  static async listContacts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { customerId } = req.params;
      const { tenant_id } = req.user;

      const contacts = await ContactModel.findByCustomer(customerId, tenant_id);

      logger.info('Contacts listed', {
        tenantId: tenant_id,
        customerId,
        count: contacts.length,
      });

      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
   * Get single contact by ID
   */
  static async getContact(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
      const contactId = req.params.id || req.params.contactId;
      const { tenant_id } = req.user;

      const contact = await ContactModel.findById(contactId, tenant_id);

      logger.info('Contact retrieved', { contactId, tenantId: tenant_id });

      res.json(contact);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/customers/:customerId/contacts
   * Create new contact for customer
   */
  static async createContact(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { customerId } = req.params;
      const { tenant_id } = req.user;

      // Add customer_id from URL to request body
      const contactData = {
        ...req.body,
        customer_id: customerId,
      };

      const contact = await ContactModel.create(contactData, tenant_id);

      logger.info('Contact created', {
        contactId: contact.id,
        customerId,
        tenantId: tenant_id,
      });

      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
   * Update contact
   */
  static async updateContact(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
      const contactId = req.params.id || req.params.contactId;
      const { tenant_id } = req.user;

      const contact = await ContactModel.update(contactId, tenant_id, req.body);

      logger.info('Contact updated', { contactId, tenantId: tenant_id });

      res.json(contact);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
   * Soft delete contact
   */
  static async deleteContact(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
      const contactId = req.params.id || req.params.contactId;
      const { tenant_id } = req.user;

      await ContactModel.softDelete(contactId, tenant_id);

      logger.info('Contact deleted', { contactId, tenantId: tenant_id });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contacts/search
   * Search contacts
   */
  static async searchContacts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;
      const { q, customer_id } = req.query;

      if (!q || typeof q !== 'string') {
        throw new ValidationError('Search query (q) is required');
      }

      const contacts = await ContactModel.search(
        tenant_id,
        q,
        customer_id as string | undefined
      );

      logger.info('Contacts searched', {
        tenantId: tenant_id,
        query: q,
        count: contacts.length,
      });

      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }
}
