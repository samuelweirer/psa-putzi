/**
 * Contact Controller
 *
 * Handles HTTP requests for contact management
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class ContactController {
    /**
     * GET /api/v1/customers/:customerId/contacts
     * List all contacts for a customer
     */
    static listContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Get single contact by ID
     */
    static getContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/customers/:customerId/contacts
     * Create new contact for customer
     */
    static createContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Update contact
     */
    static updateContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/contacts/:id or /api/v1/customers/:customerId/contacts/:contactId
     * Soft delete contact
     */
    static deleteContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/contacts/search
     * Search contacts
     */
    static searchContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=contact.controller.d.ts.map