"use strict";
/**
 * Contact routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controllers/contact.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const contact_validator_1 = require("../validators/contact.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route GET /api/v1/contacts/search
 * @desc Search contacts across all customers
 * @access Private
 */
router.get('/search', contact_controller_1.ContactController.searchContacts);
/**
 * @route GET /api/v1/contacts/:id
 * @desc Get single contact by ID
 * @access Private
 */
router.get('/:id', contact_controller_1.ContactController.getContact);
/**
 * @route PUT /api/v1/contacts/:id
 * @desc Update contact
 * @access Private
 */
router.put('/:id', (0, error_middleware_1.validate)(contact_validator_1.updateContactSchema), contact_controller_1.ContactController.updateContact);
/**
 * @route DELETE /api/v1/contacts/:id
 * @desc Soft delete contact
 * @access Private
 */
router.delete('/:id', contact_controller_1.ContactController.deleteContact);
exports.default = router;
//# sourceMappingURL=contact.routes.js.map