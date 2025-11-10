/**
 * Customer routes
 */

import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { ContactController } from '../controllers/contact.controller';
import { LocationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerFiltersSchema,
} from '../validators/customer.validator';
import { createContactSchema, updateContactSchema } from '../validators/contact.validator';
import { createLocationSchema } from '../validators/location.validator';

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

/**
 * @route GET /api/v1/customers/:customerId/contacts
 * @desc Get all contacts for a customer
 * @access Private
 */
router.get('/:customerId/contacts', ContactController.listContacts);

/**
 * @route POST /api/v1/customers/:customerId/contacts
 * @desc Create new contact for customer
 * @access Private
 */
router.post(
  '/:customerId/contacts',
  validate(createContactSchema),
  ContactController.createContact
);

/**
 * @route GET /api/v1/customers/:customerId/contacts/:contactId
 * @desc Get single contact for a customer
 * @access Private
 */
router.get('/:customerId/contacts/:contactId', ContactController.getContact);

/**
 * @route PUT /api/v1/customers/:customerId/contacts/:contactId
 * @desc Update contact for customer
 * @access Private
 */
router.put(
  '/:customerId/contacts/:contactId',
  validate(updateContactSchema),
  ContactController.updateContact
);

/**
 * @route DELETE /api/v1/customers/:customerId/contacts/:contactId
 * @desc Delete contact for customer
 * @access Private
 */
router.delete('/:customerId/contacts/:contactId', ContactController.deleteContact);

/**
 * @route GET /api/v1/customers/:customerId/locations
 * @desc Get all locations for a customer
 * @access Private
 */
router.get('/:customerId/locations', LocationController.listLocations);

/**
 * @route POST /api/v1/customers/:customerId/locations
 * @desc Create new location for customer
 * @access Private
 */
router.post(
  '/:customerId/locations',
  validate(createLocationSchema),
  LocationController.createLocation
);

export default router;
