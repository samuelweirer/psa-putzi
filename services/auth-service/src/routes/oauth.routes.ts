import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth2 login
 *     tags: [OAuth]
 *     description: Redirects user to Google OAuth2 consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent page
 */
router.get('/google', OAuthController.googleLogin);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback handler
 *     tags: [OAuth]
 *     description: Handles Google OAuth2 callback and creates/links user account
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to frontend with access and refresh tokens in URL parameters
 */
router.get('/google/callback', OAuthController.googleCallback);

/**
 * @swagger
 * /api/v1/auth/microsoft:
 *   get:
 *     summary: Initiate Microsoft OAuth2 login
 *     tags: [OAuth]
 *     description: Redirects user to Microsoft OAuth2 consent screen
 *     responses:
 *       302:
 *         description: Redirect to Microsoft OAuth consent page
 */
router.get('/microsoft', OAuthController.microsoftLogin);

/**
 * @swagger
 * /api/v1/auth/microsoft/callback:
 *   get:
 *     summary: Microsoft OAuth2 callback handler
 *     tags: [OAuth]
 *     description: Handles Microsoft OAuth2 callback and creates/links user account
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Microsoft
 *     responses:
 *       302:
 *         description: Redirect to frontend with access and refresh tokens in URL parameters
 */
router.get('/microsoft/callback', OAuthController.microsoftCallback);

export default router;
