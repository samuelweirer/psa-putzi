/**
 * Location Controller
 *
 * Handles HTTP requests for location management
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class LocationController {
    /**
     * GET /api/v1/customers/:customerId/locations
     * List all locations for a customer
     */
    static listLocations(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/locations/:id
     * Get single location by ID
     */
    static getLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/customers/:customerId/locations
     * Create new location for customer
     */
    static createLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/locations/:id
     * Update location
     */
    static updateLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/locations/:id
     * Soft delete location
     */
    static deleteLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/locations/search
     * Search locations
     */
    static searchLocations(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=location.controller.d.ts.map