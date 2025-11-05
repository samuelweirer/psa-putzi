"use strict";
/**
 * Location Controller
 *
 * Handles HTTP requests for location management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const location_model_1 = require("../models/location.model");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class LocationController {
    /**
     * GET /api/v1/customers/:customerId/locations
     * List all locations for a customer
     */
    static async listLocations(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { customerId } = req.params;
            const { tenant_id } = req.user;
            const locations = await location_model_1.LocationModel.findByCustomer(customerId, tenant_id);
            logger_1.default.info('Locations listed', {
                tenantId: tenant_id,
                customerId,
                count: locations.length,
            });
            res.json({ data: locations });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/locations/:id
     * Get single location by ID
     */
    static async getLocation(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            const location = await location_model_1.LocationModel.findById(id, tenant_id);
            logger_1.default.info('Location retrieved', { locationId: id, tenantId: tenant_id });
            res.json(location);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/customers/:customerId/locations
     * Create new location for customer
     */
    static async createLocation(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { customerId } = req.params;
            const { tenant_id } = req.user;
            // Add customer_id from URL to request body
            const locationData = {
                ...req.body,
                customer_id: customerId,
            };
            const location = await location_model_1.LocationModel.create(locationData, tenant_id);
            logger_1.default.info('Location created', {
                locationId: location.id,
                customerId,
                tenantId: tenant_id,
            });
            res.status(201).json(location);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/locations/:id
     * Update location
     */
    static async updateLocation(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            const location = await location_model_1.LocationModel.update(id, tenant_id, req.body);
            logger_1.default.info('Location updated', { locationId: id, tenantId: tenant_id });
            res.json(location);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/locations/:id
     * Soft delete location
     */
    static async deleteLocation(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            await location_model_1.LocationModel.softDelete(id, tenant_id);
            logger_1.default.info('Location deleted', { locationId: id, tenantId: tenant_id });
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/locations/search
     * Search locations
     */
    static async searchLocations(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { tenant_id } = req.user;
            const { q, customer_id } = req.query;
            if (!q || typeof q !== 'string') {
                throw new errors_1.ValidationError('Search query (q) is required');
            }
            const locations = await location_model_1.LocationModel.search(tenant_id, q, customer_id);
            logger_1.default.info('Locations searched', {
                tenantId: tenant_id,
                query: q,
                count: locations.length,
            });
            res.json({ data: locations });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map