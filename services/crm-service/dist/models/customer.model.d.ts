/**
 * Customer Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
import { Customer, CustomerFilters, PaginatedResponse } from '../types';
export declare class CustomerModel {
    /**
     * Generate next customer number for tenant
     */
    static generateCustomerNumber(tenantId: string): Promise<string>;
    /**
     * Find all customers for tenant with filters and pagination
     */
    static findAll(tenantId: string, filters?: CustomerFilters, page?: number, limit?: number): Promise<PaginatedResponse<Customer>>;
    /**
     * Find customer by ID
     */
    static findById(id: string, tenantId: string): Promise<Customer>;
    /**
     * Find customer by customer_number
     */
    static findByCustomerNumber(customerNumber: string, tenantId: string): Promise<Customer | null>;
    /**
     * Create new customer
     */
    static create(data: Partial<Customer>, tenantId: string, userId: string): Promise<Customer>;
    /**
     * Update customer
     */
    static update(id: string, tenantId: string, data: Partial<Customer>): Promise<Customer>;
    /**
     * Soft delete customer
     */
    static softDelete(id: string, tenantId: string): Promise<void>;
    /**
     * Validate parent customer exists and prevent circular references
     */
    private static validateParentCustomer;
    /**
     * Get customer hierarchy (children)
     */
    static getChildren(customerId: string, tenantId: string): Promise<Customer[]>;
}
//# sourceMappingURL=customer.model.d.ts.map