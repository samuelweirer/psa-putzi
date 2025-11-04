/**
 * JWT token generation and validation service
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../utils/config';
import { JWTPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

export class JWTService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as string,
      issuer: 'psa-platform',
      audience: 'psa-api',
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    // Add unique jti (JWT ID) to prevent duplicate token hashes
    const tokenPayload = {
      ...payload,
      jti: crypto.randomUUID(), // Unique identifier for this token
    };

    return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as string,
      issuer: 'psa-platform',
      audience: 'psa-api',
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'psa-platform',
        audience: 'psa-api',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token', 'TOKEN_INVALID');
      }
      throw new UnauthorizedError('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'psa-platform',
        audience: 'psa-api',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token', 'REFRESH_TOKEN_INVALID');
      }
      throw new UnauthorizedError('Refresh token verification failed', 'REFRESH_TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Failed to decode token', { error });
      return null;
    }
  }

  /**
   * Hash token for storage (for refresh tokens)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate random token (for password reset, MFA setup)
   */
  static generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get expiry time in seconds for access token
   */
  static getAccessTokenExpiry(): number {
    const expiry = config.jwt.accessExpiry;

    // Parse expiry string (e.g., "15m", "1h", "7d")
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }
}
