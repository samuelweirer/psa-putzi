/**
 * TypeScript type definitions
 */
import { Request } from 'express';
export interface AuthUser {
    id: string;
    tenant_id: string;
    email: string;
    role: string;
    permissions: string[];
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    display_name?: string;
    customer_number?: string;
    parent_customer_id?: string;
    type?: string;
    tier?: string;
    status: string;
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    tax_id?: string;
    payment_terms?: number;
    currency?: string;
    custom_fields?: Record<string, any>;
    tags?: string[];
    notes?: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    deleted_at?: Date;
}
export interface Contact {
    id: string;
    tenant_id: string;
    customer_id: string;
    first_name: string;
    last_name: string;
    title?: string;
    department?: string;
    email?: string;
    phone_office?: string;
    phone_mobile?: string;
    phone_direct?: string;
    is_primary: boolean;
    is_billing: boolean;
    is_technical: boolean;
    custom_fields?: Record<string, any>;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
export interface Location {
    id: string;
    tenant_id: string;
    customer_id: string;
    name: string;
    location_type?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    custom_fields?: Record<string, any>;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface CustomerFilters {
    status?: string;
    tier?: string;
    type?: string;
    search?: string;
    parent_customer_id?: string;
}
//# sourceMappingURL=index.d.ts.map