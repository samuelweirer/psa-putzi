"use strict";
/**
 * Contact Controller
 *
 * Handles HTTP requests for contact management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const contact_model_1 = require("../models/contact.model");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class ContactController {
    /**
     * GET /api/v1/customers/:customerId/contacts
     * List all contacts for a customer
     */
    static async listContacts(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { customerId } = req.params;
            const { tenant_id } = req.user;
            const contacts = await contact_model_1.ContactModel.findByCustomer(customerId, tenant_id);
            logger_1.default.info('Contacts listed', {
                tenantId: tenant_id,
                customerId,
                count: contacts.length,
            });
            res.json({ data: contacts });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Get single contact by ID
     */
    static async getContact(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
            const contactId = req.params.id || req.params.contactId;
            const { tenant_id } = req.user;
            const contact = await contact_model_1.ContactModel.findById(contactId, tenant_id);
            logger_1.default.info('Contact retrieved', { contactId, tenantId: tenant_id });
            res.json(contact);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/customers/:customerId/contacts
     * Create new contact for customer
     */
    static async createContact(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { customerId } = req.params;
            const { tenant_id } = req.user;
            // Add customer_id from URL to request body
            const contactData = {
                ...req.body,
                customer_id: customerId,
            };
            const contact = await contact_model_1.ContactModel.create(contactData, tenant_id);
            logger_1.default.info('Contact created', {
                contactId: contact.id,
                customerId,
                tenantId: tenant_id,
            });
            res.status(201).json(contact);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Update contact
     */
    static async updateContact(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
            const contactId = req.params.id || req.params.contactId;
            const { tenant_id } = req.user;
            const contact = await contact_model_1.ContactModel.update(contactId, tenant_id, req.body);
            logger_1.default.info('Contact updated', { contactId, tenantId: tenant_id });
            res.json(contact);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Soft delete contact
     */
    static async deleteContact(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            // Handle both route patterns: /contacts/:id and /customers/:customerId/contacts/:contactId
            const contactId = req.params.id || req.params.contactId;
            const { tenant_id } = req.user;
            await contact_model_1.ContactModel.softDelete(contactId, tenant_id);
            logger_1.default.info('Contact deleted', { contactId, tenantId: tenant_id });
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/contacts/search
     * Search contacts
     */
    static async searchContacts(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { tenant_id } = req.user;
            const { q, customer_id } = req.query;
            if (!q || typeof q !== 'string') {
                throw new errors_1.ValidationError('Search query (q) is required');
            }
            const contacts = await contact_model_1.ContactModel.search(tenant_id, q, customer_id);
            logger_1.default.info('Contacts searched', {
                tenantId: tenant_id,
                query: q,
                count: contacts.length,
            });
            res.json({ data: contacts });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ContactController = ContactController;
//# sourceMappingURL=contact.controller.js.map