/**
 * Authentication service - Core business logic
 */

import { UserModel } from '../models/user.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { PasswordResetTokenModel } from '../models/password-reset-token.model';
import { PasswordService } from './password.service';
import { JWTService } from './jwt.service';
import { MfaService } from './mfa.service';
import config from '../utils/config';
import logger from '../utils/logger';
import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
  PreconditionRequiredError,
  NotFoundError
} from '../utils/errors';
import {
  User,
  LoginRequest,
  LoginResponse,
  UserProfile,
  RegisterRequest,
  JWTPayload
} from '../types';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<User> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists', 'USER_EXISTS');
    }

    // Validate password
    PasswordService.validatePassword(data.password);

    // Hash password
    const passwordHash = await PasswordService.hash(data.password);

    // Create user
    const user = await UserModel.create({
      email: data.email,
      password_hash: passwordHash,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role || 'customer_user',
      phone: undefined,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Remove sensitive data
    delete user.password_hash;
    return user;
  }

  /**
   * Login user with email and password
   */
  static async login(
    credentials: LoginRequest,
    ipAddress: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const { email, password, mfa_code } = credentials;

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password_hash) {
      // Don't reveal if user exists
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      throw new ForbiddenError(
        `Account is locked. Try again in ${minutesLeft} minutes`,
        'ACCOUNT_LOCKED'
      );
    }

    // Verify password
    const isPasswordValid = await PasswordService.verify(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed attempts
      await UserModel.incrementFailedAttempts(user.id);

      // Lock account if too many attempts
      if (user.failed_login_attempts + 1 >= config.security.maxLoginAttempts) {
        await UserModel.lockAccount(user.id, config.security.lockoutDurationMinutes);
        throw new ForbiddenError(
          `Too many failed login attempts. Account locked for ${config.security.lockoutDurationMinutes} minutes`,
          'ACCOUNT_LOCKED'
        );
      }

      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check MFA
    if (user.mfa_enabled) {
      if (!mfa_code) {
        throw new PreconditionRequiredError('MFA code required', 'MFA_REQUIRED');
      }

      const isMfaValid = MfaService.verifyCode(user.mfa_secret!, mfa_code);
      if (!isMfaValid) {
        // Check recovery code
        if (user.mfa_recovery_codes && user.mfa_recovery_codes.length > 0) {
          const isRecoveryCodeValid = MfaService.verifyRecoveryCode(user.mfa_recovery_codes, mfa_code);
          if (isRecoveryCodeValid) {
            // Remove used recovery code
            const updatedCodes = MfaService.removeRecoveryCode(user.mfa_recovery_codes, mfa_code);
            await UserModel.update(user.id, { mfa_recovery_codes: updatedCodes });
            logger.info('Recovery code used for login', { userId: user.id });
          } else {
            throw new UnauthorizedError('Invalid MFA code or recovery code', 'INVALID_MFA_CODE');
          }
        } else {
          throw new UnauthorizedError('Invalid MFA code', 'INVALID_MFA_CODE');
        }
      }
    }

    // Reset failed attempts
    await UserModel.resetFailedAttempts(user.id);

    // Update last login
    await UserModel.updateLastLogin(user.id, ipAddress);

    // Generate tokens
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || {},
    };

    const accessToken = JWTService.generateAccessToken(payload);
    const refreshToken = JWTService.generateRefreshToken(payload);

    // Store refresh token
    const tokenHash = JWTService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: JWTService.getAccessTokenExpiry(),
      user: this.toUserProfile(user),
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    // Verify refresh token
    let payload: JWTPayload;
    try {
      payload = JWTService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check if token is in database and not revoked
    const tokenHash = JWTService.hashToken(refreshToken);
    const storedToken = await RefreshTokenModel.findByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found or revoked', 'TOKEN_REVOKED');
    }

    // Get latest user data
    const user = await UserModel.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive', 'USER_INACTIVE');
    }

    // Generate new access token with fresh user data
    const newPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || {},
    };

    const accessToken = JWTService.generateAccessToken(newPayload);

    logger.info('Access token refreshed', { userId: user.id });

    return {
      access_token: accessToken,
      expires_in: JWTService.getAccessTokenExpiry(),
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    const tokenHash = JWTService.hashToken(refreshToken);
    await RefreshTokenModel.revoke(tokenHash);

    logger.info('User logged out');
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    // Find user (but don't reveal if they exist)
    const user = await UserModel.findByEmail(email);

    if (user) {
      // Generate reset token
      const token = JWTService.generateRandomToken();
      const tokenHash = JWTService.hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      await PasswordResetTokenModel.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // TODO: Send email with reset link
      logger.info('Password reset requested', { userId: user.id, email: user.email });

      // In development, log the token
      if (config.nodeEnv === 'development') {
        logger.debug('Password reset token (dev only)', { token });
      }
    }

    // Always return success to prevent email enumeration
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password
    PasswordService.validatePassword(newPassword);

    // Find token
    const tokenHash = JWTService.hashToken(token);
    const resetToken = await PasswordResetTokenModel.findByHash(tokenHash);

    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const passwordHash = await PasswordService.hash(newPassword);

    // Update password
    await UserModel.updatePassword(resetToken.user_id, passwordHash);

    // Mark token as used
    await PasswordResetTokenModel.markAsUsed(tokenHash);

    // Invalidate all other reset tokens for this user
    await PasswordResetTokenModel.invalidateAllForUser(resetToken.user_id);

    // Revoke all refresh tokens (force re-login)
    await RefreshTokenModel.revokeAllForUser(resetToken.user_id);

    logger.info('Password reset successfully', { userId: resetToken.user_id });
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await UserModel.findById(userId);
    if (!user || !user.password_hash) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Verify old password
    const isOldPasswordValid = await PasswordService.verify(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Validate new password
    PasswordService.validatePassword(newPassword);

    // Hash new password
    const passwordHash = await PasswordService.hash(newPassword);

    // Update password
    await UserModel.updatePassword(userId, passwordHash);

    logger.info('Password changed successfully', { userId });
  }

  /**
   * Convert User to UserProfile (remove sensitive data)
   */
  private static toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      permissions: user.permissions || {},
      mfa_enabled: user.mfa_enabled,
      last_login_at: user.last_login_at,
    };
  }
}
