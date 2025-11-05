/**
 * Contact routes
 */

import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/error.middleware';
import { updateContactSchema } from '../validators/contact.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/contacts/search
 * @desc Search contacts across all customers
 * @access Private
 */
router.get('/search', ContactController.searchContacts);

/**
 * @route GET /api/v1/contacts/:id
 * @desc Get single contact by ID
 * @access Private
 */
router.get('/:id', ContactController.getContact);

/**
 * @route PUT /api/v1/contacts/:id
 * @desc Update contact
 * @access Private
 */
router.put(
  '/:id',
  validate(updateContactSchema),
  ContactController.updateContact
);

/**
 * @route DELETE /api/v1/contacts/:id
 * @desc Soft delete contact
 * @access Private
 */
router.delete('/:id', ContactController.deleteContact);

export default router;
