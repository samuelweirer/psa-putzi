import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JWTService } from '../services/jwt.service';
import { UserModel } from '../models/user.model';
import logger from '../utils/logger';

export class OAuthController {
  /**
   * Initiate Google OAuth login
   * GET /api/v1/auth/google
   */
  static googleLogin = passport.authenticate('google', {
    scope: ['profile', 'email'],
  });

  /**
   * Google OAuth callback
   * GET /api/v1/auth/google/callback
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('google', { session: false }, async (err: Error, user: any) => {
      try {
        if (err || !user) {
          logger.error('Google OAuth error:', err);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }

        // Update last login
        await UserModel.updateLastLogin(user.id, req.ip || 'unknown');

        // Generate JWT tokens
        const accessToken = JWTService.generateAccessToken({
          sub: user.id,
          email: user.email,
          role: user.role,
          permissions: {},
        });

        const refreshToken = JWTService.generateRefreshToken({
          sub: user.id,
          email: user.email,
          role: user.role,
          permissions: {},
        });

        // Redirect to frontend with tokens
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
      } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        next(error);
      }
    })(req, res, next);
  }

  /**
   * Initiate Microsoft OAuth login
   * GET /api/v1/auth/microsoft
   */
  static microsoftLogin = passport.authenticate('microsoft', {
    scope: ['user.read'],
  });

  /**
   * Microsoft OAuth callback
   * GET /api/v1/auth/microsoft/callback
   */
  static async microsoftCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('microsoft', { session: false }, async (err: Error, user: any) => {
      try {
        if (err || !user) {
          logger.error('Microsoft OAuth error:', err);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }

        // Update last login
        await UserModel.updateLastLogin(user.id, req.ip || 'unknown');

        // Generate JWT tokens
        const accessToken = JWTService.generateAccessToken({
          sub: user.id,
          email: user.email,
          role: user.role,
          permissions: {},
        });

        const refreshToken = JWTService.generateRefreshToken({
          sub: user.id,
          email: user.email,
          role: user.role,
          permissions: {},
        });

        // Redirect to frontend with tokens
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
      } catch (error) {
        logger.error('Error in Microsoft OAuth callback:', error);
        next(error);
      }
    })(req, res, next);
  }
}
