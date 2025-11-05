/**
 * Contact Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
import { Contact } from '../types';
export declare class ContactModel {
    /**
     * Find all contacts for a customer
     */
    static findByCustomer(customerId: string, tenantId: string): Promise<Contact[]>;
    /**
     * Find contact by ID
     */
    static findById(id: string, tenantId: string): Promise<Contact>;
    /**
     * Find contact by email
     */
    static findByEmail(email: string, tenantId: string, customerId?: string): Promise<Contact | null>;
    /**
     * Create new contact
     */
    static create(data: Partial<Contact>, tenantId: string): Promise<Contact>;
    /**
     * Update contact
     */
    static update(id: string, tenantId: string, data: Partial<Contact>): Promise<Contact>;
    /**
     * Soft delete contact
     */
    static softDelete(id: string, tenantId: string): Promise<void>;
    /**
     * Get primary contact for a customer
     */
    static getPrimaryContact(customerId: string, tenantId: string): Promise<Contact | null>;
    /**
     * Search contacts
     */
    static search(tenantId: string, searchQuery: string, customerId?: string): Promise<Contact[]>;
}
//# sourceMappingURL=contact.model.d.ts.map