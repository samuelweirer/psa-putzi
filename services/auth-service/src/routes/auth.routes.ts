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

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', loginRateLimit, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refreshToken);
router.post('/logout', validate(logoutSchema), AuthController.logout);

// Password reset
router.post('/password-reset/request', validate(passwordResetRequestSchema), AuthController.requestPasswordReset);
router.post('/password-reset/confirm', validate(passwordResetConfirmSchema), AuthController.confirmPasswordReset);

// Protected routes (require authentication)
router.get('/me', authenticateJWT, AuthController.getMe);
router.put('/me', authenticateJWT, AuthController.updateMe);
router.put('/change-password', authenticateJWT, validate(changePasswordSchema), AuthController.changePassword);

// MFA routes (require authentication)
router.post('/mfa/setup', authenticateJWT, AuthController.setupMfa);
router.post('/mfa/verify', authenticateJWT, validate(mfaVerifySchema), AuthController.verifyMfa);
router.post('/mfa/disable', authenticateJWT, validate(mfaDisableSchema), AuthController.disableMfa);

export default router;
