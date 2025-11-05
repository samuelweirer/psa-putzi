"use strict";
/**
 * Customer Controller
 *
 * Handles HTTP requests for customer management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_model_1 = require("../models/customer.model");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class CustomerController {
    /**
     * GET /api/v1/customers
     * List all customers with filters and pagination
     */
    static async listCustomers(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { tenant_id } = req.user;
            // Extract pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 50;
            // Extract filters
            const filters = {
                status: req.query.status,
                tier: req.query.tier,
                type: req.query.type,
                search: req.query.search,
                parent_customer_id: req.query.parent_customer_id,
            };
            // Remove undefined filters
            Object.keys(filters).forEach((key) => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });
            const result = await customer_model_1.CustomerModel.findAll(tenant_id, filters, page, limit);
            logger_1.default.info('Customers listed', {
                tenantId: tenant_id,
                count: result.data.length,
                page,
                limit,
            });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/customers/:id
     * Get single customer by ID
     */
    static async getCustomer(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            const customer = await customer_model_1.CustomerModel.findById(id, tenant_id);
            logger_1.default.info('Customer retrieved', { customerId: id, tenantId: tenant_id });
            res.json(customer);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/customers
     * Create new customer
     */
    static async createCustomer(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { tenant_id, id: userId } = req.user;
            const customer = await customer_model_1.CustomerModel.create(req.body, tenant_id, userId);
            logger_1.default.info('Customer created', {
                customerId: customer.id,
                tenantId: tenant_id,
                userId,
            });
            res.status(201).json(customer);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/customers/:id
     * Update customer
     */
    static async updateCustomer(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            const customer = await customer_model_1.CustomerModel.update(id, tenant_id, req.body);
            logger_1.default.info('Customer updated', { customerId: id, tenantId: tenant_id });
            res.json(customer);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/customers/:id
     * Soft delete customer
     */
    static async deleteCustomer(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            await customer_model_1.CustomerModel.softDelete(id, tenant_id);
            logger_1.default.info('Customer deleted', { customerId: id, tenantId: tenant_id });
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/customers/:id/children
     * Get customer's child customers
     */
    static async getCustomerChildren(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { id } = req.params;
            const { tenant_id } = req.user;
            // Verify parent customer exists
            await customer_model_1.CustomerModel.findById(id, tenant_id);
            const children = await customer_model_1.CustomerModel.getChildren(id, tenant_id);
            logger_1.default.info('Customer children retrieved', {
                customerId: id,
                tenantId: tenant_id,
                count: children.length,
            });
            res.json({ data: children });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map