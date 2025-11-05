"use strict";
/**
 * Location routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const location_validator_1 = require("../validators/location.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route GET /api/v1/locations/search
 * @desc Search locations across all customers
 * @access Private
 */
router.get('/search', location_controller_1.LocationController.searchLocations);
/**
 * @route GET /api/v1/locations/:id
 * @desc Get single location by ID
 * @access Private
 */
router.get('/:id', location_controller_1.LocationController.getLocation);
/**
 * @route PUT /api/v1/locations/:id
 * @desc Update location
 * @access Private
 */
router.put('/:id', (0, error_middleware_1.validate)(location_validator_1.updateLocationSchema), location_controller_1.LocationController.updateLocation);
/**
 * @route DELETE /api/v1/locations/:id
 * @desc Soft delete location
 * @access Private
 */
router.delete('/:id', location_controller_1.LocationController.deleteLocation);
exports.default = router;
//# sourceMappingURL=location.routes.js.map