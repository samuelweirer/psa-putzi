/**
 * Customer Controller
 *
 * Handles HTTP requests for customer management
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, CustomerFilters } from '../types';
import { CustomerModel } from '../models/customer.model';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class CustomerController {
  /**
   * GET /api/v1/customers
   * List all customers with filters and pagination
   */
  static async listCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id } = req.user;

      // Extract pagination
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      // Extract filters
      const filters: CustomerFilters = {
        status: req.query.status as string,
        tier: req.query.tier as string,
        type: req.query.type as string,
        search: req.query.search as string,
        parent_customer_id: req.query.parent_customer_id as string,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof CustomerFilters] === undefined) {
          delete filters[key as keyof CustomerFilters];
        }
      });

      const result = await CustomerModel.findAll(tenant_id, filters, page, limit);

      logger.info('Customers listed', {
        tenantId: tenant_id,
        count: result.data.length,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/customers/:id
   * Get single customer by ID
   */
  static async getCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const customer = await CustomerModel.findById(id, tenant_id);

      logger.info('Customer retrieved', { customerId: id, tenantId: tenant_id });

      res.json(customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/customers
   * Create new customer
   */
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { tenant_id, id: userId } = req.user;

      const customer = await CustomerModel.create(req.body, tenant_id, userId);

      logger.info('Customer created', {
        customerId: customer.id,
        tenantId: tenant_id,
        userId,
      });

      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/customers/:id
   * Update customer
   */
  static async updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      const customer = await CustomerModel.update(id, tenant_id, req.body);

      logger.info('Customer updated', { customerId: id, tenantId: tenant_id });

      res.json(customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/customers/:id
   * Soft delete customer
   */
  static async deleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      await CustomerModel.softDelete(id, tenant_id);

      logger.info('Customer deleted', { customerId: id, tenantId: tenant_id });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/customers/:id/children
   * Get customer's child customers
   */
  static async getCustomerChildren(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { tenant_id } = req.user;

      // Verify parent customer exists
      await CustomerModel.findById(id, tenant_id);

      const children = await CustomerModel.getChildren(id, tenant_id);

      logger.info('Customer children retrieved', {
        customerId: id,
        tenantId: tenant_id,
        count: children.length,
      });

      res.json({ data: children });
    } catch (error) {
      next(error);
    }
  }
}
