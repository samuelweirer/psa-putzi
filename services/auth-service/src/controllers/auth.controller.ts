/**
 * Authentication controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';
import { MfaService } from '../services/mfa.service';
import { JWTService } from '../services/jwt.service';
import { query } from '../utils/database';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);

      res.status(201).json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_verified: user.is_verified,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(req.body, ipAddress, userAgent);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      const result = await AuthService.refreshAccessToken(refresh_token);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      await AuthService.logout(refresh_token);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const user = await UserModel.findById(req.user.sub);

      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        permissions: user.permissions || {},
        mfa_enabled: user.mfa_enabled,
        last_login_at: user.last_login_at,
        language: user.language,
        timezone: user.timezone,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/me
   */
  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      // Only allow updating certain fields
      const allowedUpdates = ['first_name', 'last_name', 'phone', 'language', 'timezone'];
      const updates: any = {};

      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await UserModel.update(req.user.sub, updates);

      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone,
        language: user.language,
        timezone: user.timezone,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/change-password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const { old_password, new_password } = req.body;

      await AuthService.changePassword(req.user.sub, old_password, new_password);

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/password-reset/request
   */
  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      await AuthService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/password-reset/confirm
   */
  static async confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, new_password } = req.body;

      await AuthService.resetPassword(token, new_password);

      res.json({
        message: 'Password has been reset successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/mfa/setup
   */
  static async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const user = await UserModel.findById(req.user.sub);

      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      // Generate MFA secret and QR code
      const { secret, qrCode } = await MfaService.generateSecret(user.email);

      // Generate temporary setup token
      const setupToken = JWTService.generateRandomToken();
      const tokenHash = JWTService.hashToken(setupToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store setup token
      await query(
        `INSERT INTO mfa_setup_tokens (user_id, token_hash, secret, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [user.id, tokenHash, secret, expiresAt]
      );

      res.json({
        secret,
        qr_code: qrCode,
        setup_token: setupToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/mfa/verify
   */
  static async verifyMfa(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const { setup_token, code } = req.body;

      // Find setup token
      const tokenHash = JWTService.hashToken(setup_token);
      const result = await query(
        `SELECT * FROM mfa_setup_tokens
         WHERE token_hash = $1 AND user_id = $2 AND verified_at IS NULL AND expires_at > NOW()`,
        [tokenHash, req.user.sub]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Invalid or expired setup token', 'INVALID_SETUP_TOKEN');
      }

      const setupTokenData = result.rows[0];

      // Verify code
      const isValid = MfaService.verifyCode(setupTokenData.secret, code);

      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      // Generate recovery codes
      const recoveryCodes = MfaService.generateRecoveryCodes();

      // Enable MFA for user
      await UserModel.enableMfa(req.user.sub, setupTokenData.secret, recoveryCodes);

      // Mark setup token as verified
      await query(
        `UPDATE mfa_setup_tokens SET verified_at = NOW() WHERE token_hash = $1`,
        [tokenHash]
      );

      logger.info('MFA enabled successfully', { userId: req.user.sub });

      res.json({
        message: 'MFA enabled successfully',
        recovery_codes: recoveryCodes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/mfa/disable
   */
  static async disableMfa(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const { password, code } = req.body;

      const user = await UserModel.findById(req.user.sub);

      if (!user || !user.password_hash) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      // Verify password
      const { PasswordService } = await import('../services/password.service');
      const isPasswordValid = await PasswordService.verify(password, user.password_hash);

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Verify MFA code
      if (user.mfa_enabled && user.mfa_secret) {
        const isCodeValid = MfaService.verifyCode(user.mfa_secret, code);

        if (!isCodeValid) {
          throw new Error('Invalid MFA code');
        }
      }

      // Disable MFA
      await UserModel.disableMfa(req.user.sub);

      res.json({
        message: 'MFA disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
