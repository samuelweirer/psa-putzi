/**
 * Customer routes
 */

import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerFiltersSchema,
} from '../validators/customer.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/customers
 * @desc List all customers with filters and pagination
 * @access Private
 */
router.get(
  '/',
  validate(customerFiltersSchema),
  CustomerController.listCustomers
);

/**
 * @route GET /api/v1/customers/:id
 * @desc Get single customer by ID
 * @access Private
 */
router.get('/:id', CustomerController.getCustomer);

/**
 * @route POST /api/v1/customers
 * @desc Create new customer
 * @access Private
 */
router.post(
  '/',
  validate(createCustomerSchema),
  CustomerController.createCustomer
);

/**
 * @route PUT /api/v1/customers/:id
 * @desc Update customer
 * @access Private
 */
router.put(
  '/:id',
  validate(updateCustomerSchema),
  CustomerController.updateCustomer
);

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Soft delete customer
 * @access Private
 */
router.delete('/:id', CustomerController.deleteCustomer);

/**
 * @route GET /api/v1/customers/:id/children
 * @desc Get customer's child customers
 * @access Private
 */
router.get('/:id/children', CustomerController.getCustomerChildren);

export default router;
