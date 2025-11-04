/**
 * Multi-Factor Authentication (MFA) service using TOTP
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import config from '../utils/config';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class MfaService {
  /**
   * Generate TOTP secret and QR code
   */
  static async generateSecret(userEmail: string): Promise<{ secret: string; qrCode: string }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${config.mfa.issuer} (${userEmail})`,
      issuer: config.mfa.issuer,
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify TOTP code
   */
  static verifyCode(secret: string, code: string): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: config.mfa.window,
      });

      return verified;
    } catch (error) {
      logger.error('MFA verification error', { error });
      return false;
    }
  }

  /**
   * Generate backup recovery codes
   */
  static generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Verify recovery code
   */
  static verifyRecoveryCode(userRecoveryCodes: string[], providedCode: string): boolean {
    return userRecoveryCodes.includes(providedCode.toUpperCase());
  }

  /**
   * Remove used recovery code
   */
  static removeRecoveryCode(userRecoveryCodes: string[], usedCode: string): string[] {
    return userRecoveryCodes.filter(code => code !== usedCode.toUpperCase());
  }

  /**
   * Validate MFA code format
   */
  static validateCodeFormat(code: string): void {
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestError('MFA code must be 6 digits', 'INVALID_MFA_CODE_FORMAT');
    }
  }
}
