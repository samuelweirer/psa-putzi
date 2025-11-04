import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';

const router = Router();

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', OAuthController.googleLogin);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', OAuthController.googleCallback);

/**
 * @route   GET /api/v1/auth/microsoft
 * @desc    Initiate Microsoft OAuth login
 * @access  Public
 */
router.get('/microsoft', OAuthController.microsoftLogin);

/**
 * @route   GET /api/v1/auth/microsoft/callback
 * @desc    Microsoft OAuth callback
 * @access  Public
 */
router.get('/microsoft/callback', OAuthController.microsoftCallback);

export default router;
