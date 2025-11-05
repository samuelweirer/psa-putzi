"use strict";
/**
 * Customer routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const contact_controller_1 = require("../controllers/contact.controller");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const customer_validator_1 = require("../validators/customer.validator");
const contact_validator_1 = require("../validators/contact.validator");
const location_validator_1 = require("../validators/location.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route GET /api/v1/customers
 * @desc List all customers with filters and pagination
 * @access Private
 */
router.get('/', (0, error_middleware_1.validate)(customer_validator_1.customerFiltersSchema), customer_controller_1.CustomerController.listCustomers);
/**
 * @route GET /api/v1/customers/:id
 * @desc Get single customer by ID
 * @access Private
 */
router.get('/:id', customer_controller_1.CustomerController.getCustomer);
/**
 * @route POST /api/v1/customers
 * @desc Create new customer
 * @access Private
 */
router.post('/', (0, error_middleware_1.validate)(customer_validator_1.createCustomerSchema), customer_controller_1.CustomerController.createCustomer);
/**
 * @route PUT /api/v1/customers/:id
 * @desc Update customer
 * @access Private
 */
router.put('/:id', (0, error_middleware_1.validate)(customer_validator_1.updateCustomerSchema), customer_controller_1.CustomerController.updateCustomer);
/**
 * @route DELETE /api/v1/customers/:id
 * @desc Soft delete customer
 * @access Private
 */
router.delete('/:id', customer_controller_1.CustomerController.deleteCustomer);
/**
 * @route GET /api/v1/customers/:id/children
 * @desc Get customer's child customers
 * @access Private
 */
router.get('/:id/children', customer_controller_1.CustomerController.getCustomerChildren);
/**
 * @route GET /api/v1/customers/:customerId/contacts
 * @desc Get all contacts for a customer
 * @access Private
 */
router.get('/:customerId/contacts', contact_controller_1.ContactController.listContacts);
/**
 * @route POST /api/v1/customers/:customerId/contacts
 * @desc Create new contact for customer
 * @access Private
 */
router.post('/:customerId/contacts', (0, error_middleware_1.validate)(contact_validator_1.createContactSchema), contact_controller_1.ContactController.createContact);
/**
 * @route GET /api/v1/customers/:customerId/locations
 * @desc Get all locations for a customer
 * @access Private
 */
router.get('/:customerId/locations', location_controller_1.LocationController.listLocations);
/**
 * @route POST /api/v1/customers/:customerId/locations
 * @desc Create new location for customer
 * @access Private
 */
router.post('/:customerId/locations', (0, error_middleware_1.validate)(location_validator_1.createLocationSchema), location_controller_1.LocationController.createLocation);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map