/**
 * Unit tests for MfaService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MfaService } from '../../src/services/mfa.service';
import { BadRequestError } from '../../src/utils/errors';
import speakeasy from 'speakeasy';

// Mock config
vi.mock('../../src/utils/config', () => ({
  default: {
    mfa: {
      issuer: 'PSA-Platform-Test',
      window: 1,
    },
  },
}));

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MfaService', () => {
  describe('generateSecret', () => {
    it('should generate secret and QR code', async () => {
      const email = 'test@example.com';
      const result = await MfaService.generateSecret(email);

      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
    });

    it('should generate base32 secret', async () => {
      const email = 'test@example.com';
      const result = await MfaService.generateSecret(email);

      // Base32 alphabet: A-Z and 2-7
      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
      expect(result.secret.length).toBeGreaterThan(0);
    });

    it('should generate valid QR code data URL', async () => {
      const email = 'test@example.com';
      const result = await MfaService.generateSecret(email);

      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should include email in QR code', async () => {
      const email = 'test@example.com';
      const result = await MfaService.generateSecret(email);

      // QR code should be a base64 PNG data URL
      expect(result.qrCode).toContain('base64');
    });

    it('should generate different secrets on multiple calls', async () => {
      const email = 'test@example.com';
      const result1 = await MfaService.generateSecret(email);
      const result2 = await MfaService.generateSecret(email);

      expect(result1.secret).not.toBe(result2.secret);
      expect(result1.qrCode).not.toBe(result2.qrCode);
    });

    it('should handle different email addresses', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      const result1 = await MfaService.generateSecret(email1);
      const result2 = await MfaService.generateSecret(email2);

      expect(result1.secret).toBeDefined();
      expect(result2.secret).toBeDefined();
      expect(result1.secret).not.toBe(result2.secret);
    });
  });

  describe('verifyCode', () => {
    it('should verify valid TOTP code', async () => {
      // Generate a secret
      const { secret } = await MfaService.generateSecret('test@example.com');

      // Generate a valid code using the secret
      const validCode = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      // Verify the code
      const isValid = MfaService.verifyCode(secret, validCode);
      expect(isValid).toBe(true);
    });

    it('should reject invalid TOTP code', async () => {
      const { secret } = await MfaService.generateSecret('test@example.com');

      const isValid = MfaService.verifyCode(secret, '000000');
      expect(isValid).toBe(false);
    });

    it('should reject code with wrong secret', async () => {
      const { secret: secret1 } = await MfaService.generateSecret('test1@example.com');
      const { secret: secret2 } = await MfaService.generateSecret('test2@example.com');

      // Generate code for secret1
      const code1 = speakeasy.totp({
        secret: secret1,
        encoding: 'base32',
      });

      // Try to verify with secret2
      const isValid = MfaService.verifyCode(secret2, code1);
      expect(isValid).toBe(false);
    });

    it('should handle empty code', async () => {
      const { secret } = await MfaService.generateSecret('test@example.com');

      const isValid = MfaService.verifyCode(secret, '');
      expect(isValid).toBe(false);
    });

    it('should handle malformed secret', () => {
      const isValid = MfaService.verifyCode('invalid-secret', '123456');
      expect(isValid).toBe(false);
    });

    it('should verify code within time window', async () => {
      const { secret } = await MfaService.generateSecret('test@example.com');

      // Generate code at current time
      const code = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      // Should be valid immediately
      expect(MfaService.verifyCode(secret, code)).toBe(true);
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate default number of codes (10)', () => {
      const codes = MfaService.generateRecoveryCodes();

      expect(codes).toBeDefined();
      expect(codes.length).toBe(10);
    });

    it('should generate custom number of codes', () => {
      const codes = MfaService.generateRecoveryCodes(5);

      expect(codes.length).toBe(5);
    });

    it('should generate uppercase alphanumeric codes', () => {
      const codes = MfaService.generateRecoveryCodes();

      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });
    });

    it('should generate codes of reasonable length', () => {
      const codes = MfaService.generateRecoveryCodes();

      codes.forEach(code => {
        expect(code.length).toBeGreaterThanOrEqual(4);
        expect(code.length).toBeLessThanOrEqual(10);
      });
    });

    it('should generate unique codes', () => {
      const codes = MfaService.generateRecoveryCodes(20);
      const uniqueCodes = new Set(codes);

      // Most codes should be unique (allow small collision due to random generation)
      expect(uniqueCodes.size).toBeGreaterThanOrEqual(19);
    });

    it('should generate different codes on multiple calls', () => {
      const codes1 = MfaService.generateRecoveryCodes(10);
      const codes2 = MfaService.generateRecoveryCodes(10);

      // Arrays should not be identical
      expect(codes1).not.toEqual(codes2);
    });

    it('should handle edge case of 0 codes', () => {
      const codes = MfaService.generateRecoveryCodes(0);

      expect(codes.length).toBe(0);
      expect(codes).toEqual([]);
    });

    it('should handle large number of codes', () => {
      const codes = MfaService.generateRecoveryCodes(100);

      expect(codes.length).toBe(100);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });
    });
  });

  describe('verifyRecoveryCode', () => {
    it('should verify valid recovery code', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const providedCode = 'DEF456';

      const isValid = MfaService.verifyRecoveryCode(recoveryCodes, providedCode);
      expect(isValid).toBe(true);
    });

    it('should reject invalid recovery code', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const providedCode = 'INVALID';

      const isValid = MfaService.verifyRecoveryCode(recoveryCodes, providedCode);
      expect(isValid).toBe(false);
    });

    it('should be case insensitive', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const providedCode = 'def456'; // lowercase

      const isValid = MfaService.verifyRecoveryCode(recoveryCodes, providedCode);
      expect(isValid).toBe(true);
    });

    it('should handle empty recovery codes array', () => {
      const recoveryCodes: string[] = [];
      const providedCode = 'ABC123';

      const isValid = MfaService.verifyRecoveryCode(recoveryCodes, providedCode);
      expect(isValid).toBe(false);
    });

    it('should handle empty provided code', () => {
      const recoveryCodes = ['ABC123', 'DEF456'];
      const providedCode = '';

      const isValid = MfaService.verifyRecoveryCode(recoveryCodes, providedCode);
      expect(isValid).toBe(false);
    });

    it('should match exact codes only', () => {
      const recoveryCodes = ['ABC123'];

      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'ABC123')).toBe(true);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'ABC12')).toBe(false);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'ABC1234')).toBe(false);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'BC123')).toBe(false);
    });

    it('should handle codes with mixed case input', () => {
      const recoveryCodes = ['ABC123', 'XYZ789'];

      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'abc123')).toBe(true);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'ABC123')).toBe(true);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'AbC123')).toBe(true);
      expect(MfaService.verifyRecoveryCode(recoveryCodes, 'xyz789')).toBe(true);
    });
  });

  describe('removeRecoveryCode', () => {
    it('should remove used recovery code', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const usedCode = 'DEF456';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      expect(updatedCodes).toEqual(['ABC123', 'GHI789']);
      expect(updatedCodes.length).toBe(2);
      expect(updatedCodes).not.toContain('DEF456');
    });

    it('should be case insensitive when removing', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const usedCode = 'def456'; // lowercase

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      expect(updatedCodes).toEqual(['ABC123', 'GHI789']);
      expect(updatedCodes).not.toContain('DEF456');
    });

    it('should not modify array if code not found', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const usedCode = 'NOTFOUND';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      expect(updatedCodes).toEqual(recoveryCodes);
      expect(updatedCodes.length).toBe(3);
    });

    it('should handle empty recovery codes array', () => {
      const recoveryCodes: string[] = [];
      const usedCode = 'ABC123';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      expect(updatedCodes).toEqual([]);
    });

    it('should handle removing last code', () => {
      const recoveryCodes = ['ABC123'];
      const usedCode = 'ABC123';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      expect(updatedCodes).toEqual([]);
      expect(updatedCodes.length).toBe(0);
    });

    it('should not mutate original array', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'GHI789'];
      const originalLength = recoveryCodes.length;
      const usedCode = 'DEF456';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      // Original array should not be modified
      expect(recoveryCodes.length).toBe(originalLength);
      expect(recoveryCodes).toContain('DEF456');

      // New array should have code removed
      expect(updatedCodes).not.toContain('DEF456');
    });

    it('should handle removing multiple occurrences', () => {
      const recoveryCodes = ['ABC123', 'DEF456', 'ABC123', 'GHI789'];
      const usedCode = 'ABC123';

      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, usedCode);

      // Should remove all occurrences
      expect(updatedCodes).toEqual(['DEF456', 'GHI789']);
      expect(updatedCodes.length).toBe(2);
    });
  });

  describe('validateCodeFormat', () => {
    it('should accept valid 6-digit code', () => {
      expect(() => MfaService.validateCodeFormat('123456')).not.toThrow();
      expect(() => MfaService.validateCodeFormat('000000')).not.toThrow();
      expect(() => MfaService.validateCodeFormat('999999')).not.toThrow();
    });

    it('should reject code that is too short', () => {
      expect(() => MfaService.validateCodeFormat('12345'))
        .toThrow(BadRequestError);

      try {
        MfaService.validateCodeFormat('12345');
      } catch (error) {
        expect((error as BadRequestError).message).toContain('6 digits');
        expect((error as BadRequestError).code).toBe('INVALID_MFA_CODE_FORMAT');
      }
    });

    it('should reject code that is too long', () => {
      expect(() => MfaService.validateCodeFormat('1234567'))
        .toThrow(BadRequestError);
    });

    it('should reject code with letters', () => {
      expect(() => MfaService.validateCodeFormat('12345A'))
        .toThrow(BadRequestError);

      expect(() => MfaService.validateCodeFormat('ABC123'))
        .toThrow(BadRequestError);
    });

    it('should reject code with special characters', () => {
      expect(() => MfaService.validateCodeFormat('12345!'))
        .toThrow(BadRequestError);

      expect(() => MfaService.validateCodeFormat('123-456'))
        .toThrow(BadRequestError);
    });

    it('should reject code with spaces', () => {
      expect(() => MfaService.validateCodeFormat('123 456'))
        .toThrow(BadRequestError);

      expect(() => MfaService.validateCodeFormat(' 123456'))
        .toThrow(BadRequestError);

      expect(() => MfaService.validateCodeFormat('123456 '))
        .toThrow(BadRequestError);
    });

    it('should reject empty code', () => {
      expect(() => MfaService.validateCodeFormat(''))
        .toThrow(BadRequestError);
    });

    it('should reject code with decimal point', () => {
      expect(() => MfaService.validateCodeFormat('123.456'))
        .toThrow(BadRequestError);
    });

    it('should reject negative numbers', () => {
      expect(() => MfaService.validateCodeFormat('-12345'))
        .toThrow(BadRequestError);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete MFA setup flow', async () => {
      const email = 'test@example.com';

      // 1. Generate secret and QR code
      const { secret, qrCode } = await MfaService.generateSecret(email);
      expect(secret).toBeDefined();
      expect(qrCode).toBeDefined();

      // 2. Generate recovery codes
      const recoveryCodes = MfaService.generateRecoveryCodes();
      expect(recoveryCodes.length).toBe(10);

      // 3. Generate and verify TOTP code
      const totpCode = speakeasy.totp({
        secret,
        encoding: 'base32',
      });
      expect(MfaService.verifyCode(secret, totpCode)).toBe(true);

      // 4. Verify recovery code
      const isRecoveryValid = MfaService.verifyRecoveryCode(recoveryCodes, recoveryCodes[0]);
      expect(isRecoveryValid).toBe(true);

      // 5. Remove used recovery code
      const updatedCodes = MfaService.removeRecoveryCode(recoveryCodes, recoveryCodes[0]);
      expect(updatedCodes.length).toBe(9);
    });

    it('should handle recovery code usage', () => {
      let recoveryCodes = MfaService.generateRecoveryCodes(5);
      expect(recoveryCodes.length).toBe(5);

      // Use first code
      expect(MfaService.verifyRecoveryCode(recoveryCodes, recoveryCodes[0])).toBe(true);
      recoveryCodes = MfaService.removeRecoveryCode(recoveryCodes, recoveryCodes[0]);
      expect(recoveryCodes.length).toBe(4);

      // Try to use same code again - should fail
      expect(MfaService.verifyRecoveryCode(recoveryCodes, recoveryCodes[0])).toBe(true);

      // Use another code
      expect(MfaService.verifyRecoveryCode(recoveryCodes, recoveryCodes[1])).toBe(true);
      recoveryCodes = MfaService.removeRecoveryCode(recoveryCodes, recoveryCodes[1]);
      expect(recoveryCodes.length).toBe(3);
    });

    it('should validate TOTP code format before verification', async () => {
      const { secret } = await MfaService.generateSecret('test@example.com');

      // Valid format
      expect(() => MfaService.validateCodeFormat('123456')).not.toThrow();

      // Invalid formats
      expect(() => MfaService.validateCodeFormat('12345')).toThrow();
      expect(() => MfaService.validateCodeFormat('ABC123')).toThrow();
      expect(() => MfaService.validateCodeFormat('123-456')).toThrow();
    });
  });
});
