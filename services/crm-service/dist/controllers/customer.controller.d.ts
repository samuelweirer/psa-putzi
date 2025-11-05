/**
 * Customer Controller
 *
 * Handles HTTP requests for customer management
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class CustomerController {
    /**
     * GET /api/v1/customers
     * List all customers with filters and pagination
     */
    static listCustomers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/customers/:id
     * Get single customer by ID
     */
    static getCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/customers
     * Create new customer
     */
    static createCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/customers/:id
     * Update customer
     */
    static updateCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/customers/:id
     * Soft delete customer
     */
    static deleteCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/customers/:id/children
     * Get customer's child customers
     */
    static getCustomerChildren(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=customer.controller.d.ts.map