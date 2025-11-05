/**
 * Location Controller
 *
 * Handles HTTP requests for location management
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { LocationModel } from '../models/location.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class LocationController {
  /**
   * GET /api/v1/customers/:customerId/locations
   * List all locations for a customer
   */
  static async listLocations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { customerId } = req.params;
      const { tenant_id } = req.user;

      const locations = await LocationModel.findByCustomer(customerId, tenant_id);

      logger.info('Locations listed', {
        tenantId: tenant_id,
        customerId,
        count: locations.length,
      });

      res.json({ data: locations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/:id
   * Get single location by ID
   */
  static async getLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const location = await LocationModel.findById(id, tenant_id);

      logger.info('Location retrieved', { locationId: id, tenantId: tenant_id });

      res.json(location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/customers/:customerId/locations
   * Create new location for customer
   */
  static async createLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { customerId } = req.params;
      const { tenant_id } = req.user;

      // Add customer_id from URL to request body
      const locationData = {
        ...req.body,
        customer_id: customerId,
      };

      const location = await LocationModel.create(locationData, tenant_id);

      logger.info('Location created', {
        locationId: location.id,
        customerId,
        tenantId: tenant_id,
      });

      res.status(201).json(location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/locations/:id
   * Update location
   */
  static async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const location = await LocationModel.update(id, tenant_id, req.body);

      logger.info('Location updated', { locationId: id, tenantId: tenant_id });

      res.json(location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/locations/:id
   * Soft delete location
   */
  static async deleteLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      await LocationModel.softDelete(id, tenant_id);

      logger.info('Location deleted', { locationId: id, tenantId: tenant_id });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/search
   * Search locations
   */
  static async searchLocations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;
      const { q, customer_id } = req.query;

      if (!q || typeof q !== 'string') {
        throw new ValidationError('Search query (q) is required');
      }

      const locations = await LocationModel.search(
        tenant_id,
        q,
        customer_id as string | undefined
      );

      logger.info('Locations searched', {
        tenantId: tenant_id,
        query: q,
        count: locations.length,
      });

      res.json({ data: locations });
    } catch (error) {
      next(error);
    }
  }
}
