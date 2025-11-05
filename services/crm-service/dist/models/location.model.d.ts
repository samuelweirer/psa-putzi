/**
 * Location Model
 *
 * CRITICAL: All queries MUST filter by tenant_id for multi-tenancy isolation
 */
import { Location } from '../types';
export declare class LocationModel {
    /**
     * Find all locations for a customer
     */
    static findByCustomer(customerId: string, tenantId: string): Promise<Location[]>;
    /**
     * Find location by ID
     */
    static findById(id: string, tenantId: string): Promise<Location>;
    /**
     * Create new location
     */
    static create(data: Partial<Location>, tenantId: string): Promise<Location>;
    /**
     * Update location
     */
    static update(id: string, tenantId: string, data: Partial<Location>): Promise<Location>;
    /**
     * Soft delete location
     */
    static softDelete(id: string, tenantId: string): Promise<void>;
    /**
     * Search locations
     */
    static search(tenantId: string, searchQuery: string, customerId?: string): Promise<Location[]>;
}
//# sourceMappingURL=location.model.d.ts.map