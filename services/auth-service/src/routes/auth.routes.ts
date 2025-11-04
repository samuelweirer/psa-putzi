/**
 * Authentication routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { loginRateLimit } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/error.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  mfaVerifySchema,
  mfaDisableSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Invalid request or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               mfaToken:
 *                 type: string
 *                 description: Required if MFA is enabled
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid credentials or MFA token required
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', loginRateLimit, validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(refreshSchema), AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Invalid request
 */
router.post('/logout', validate(logoutSchema), AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/password-reset/request:
 *   post:
 *     summary: Request password reset email
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns 200 for security)
 */
router.post('/password-reset/request', validate(passwordResetRequestSchema), AuthController.requestPasswordReset);

/**
 * @swagger
 * /api/v1/auth/password-reset/confirm:
 *   post:
 *     summary: Confirm password reset with token
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/password-reset/confirm', validate(passwordResetConfirmSchema), AuthController.confirmPasswordReset);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateJWT, AuthController.getMe);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.put('/me', authenticateJWT, AuthController.updateMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Password]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid current password or not authenticated
 */
router.put('/change-password', authenticateJWT, validate(changePasswordSchema), AuthController.changePassword);

/**
 * @swagger
 * /api/v1/auth/mfa/setup:
 *   post:
 *     summary: Setup Multi-Factor Authentication (TOTP)
 *     tags: [MFA]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: TOTP secret for manual entry
 *                 qrCode:
 *                   type: string
 *                   description: QR code data URL for scanning
 *                 recoveryCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: One-time recovery codes
 *       401:
 *         description: Not authenticated
 */
router.post('/mfa/setup', authenticateJWT, AuthController.setupMfa);

/**
 * @swagger
 * /api/v1/auth/mfa/verify:
 *   post:
 *     summary: Verify and enable MFA
 *     tags: [MFA]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP token
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Not authenticated
 */
router.post('/mfa/verify', authenticateJWT, validate(mfaVerifySchema), AuthController.verifyMfa);

/**
 * @swagger
 * /api/v1/auth/mfa/disable:
 *   post:
 *     summary: Disable Multi-Factor Authentication
 *     tags: [MFA]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       401:
 *         description: Invalid password or not authenticated
 */
router.post('/mfa/disable', authenticateJWT, validate(mfaDisableSchema), AuthController.disableMfa);

export default router;
