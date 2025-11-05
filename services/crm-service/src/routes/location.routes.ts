/**
 * Location routes
 */

import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import {
  updateLocationSchema,
} from '../validators/location.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/locations/search
 * @desc Search locations across all customers
 * @access Private
 */
router.get('/search', LocationController.searchLocations);

/**
 * @route GET /api/v1/locations/:id
 * @desc Get single location by ID
 * @access Private
 */
router.get('/:id', LocationController.getLocation);

/**
 * @route PUT /api/v1/locations/:id
 * @desc Update location
 * @access Private
 */
router.put(
  '/:id',
  validate(updateLocationSchema),
  LocationController.updateLocation
);

/**
 * @route DELETE /api/v1/locations/:id
 * @desc Soft delete location
 * @access Private
 */
router.delete('/:id', LocationController.deleteLocation);

export default router;
