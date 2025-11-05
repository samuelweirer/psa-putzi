"use strict";
/**
 * Customer routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const customer_validator_1 = require("../validators/customer.validator");
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
exports.default = router;
//# sourceMappingURL=customer.routes.js.map