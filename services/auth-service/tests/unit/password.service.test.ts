/**
 * Unit tests for PasswordService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordService } from '../../src/services/password.service';
import { BadRequestError } from '../../src/utils/errors';

// Mock config
vi.mock('../../src/utils/config', () => ({
  default: {
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true,
    },
  },
}));

describe('PasswordService', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt hash prefix
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordService.hash(password);
      const hash2 = await PasswordService.hash(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);

      const isValid = await PasswordService.verify(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);

      const isValid = await PasswordService.verify('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);

      const isValid = await PasswordService.verify('', hash);
      expect(isValid).toBe(false);
    });

    it('should reject password with case difference', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);

      const isValid = await PasswordService.verify('testpassword123!', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const password = 'ValidPass123!';

      expect(() => PasswordService.validatePassword(password)).not.toThrow();
    });

    it('should reject password too short', () => {
      const password = 'Short1!';

      expect(() => PasswordService.validatePassword(password))
        .toThrow(BadRequestError);

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as BadRequestError).message).toContain('at least 12 characters');
        expect((error as BadRequestError).code).toBe('PASSWORD_POLICY_VIOLATION');
      }
    });

    it('should reject password without uppercase', () => {
      const password = 'validpass123!';

      expect(() => PasswordService.validatePassword(password))
        .toThrow(BadRequestError);

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect((error as BadRequestError).message).toContain('uppercase letter');
      }
    });

    it('should reject password without lowercase', () => {
      const password = 'VALIDPASS123!';

      expect(() => PasswordService.validatePassword(password))
        .toThrow(BadRequestError);

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect((error as BadRequestError).message).toContain('lowercase letter');
      }
    });

    it('should reject password without numbers', () => {
      const password = 'ValidPassword!';

      expect(() => PasswordService.validatePassword(password))
        .toThrow(BadRequestError);

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect((error as BadRequestError).message).toContain('at least one number');
      }
    });

    it('should reject password without special characters', () => {
      const password = 'ValidPass123';

      expect(() => PasswordService.validatePassword(password))
        .toThrow(BadRequestError);

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect((error as BadRequestError).message).toContain('special character');
      }
    });

    it('should reject password with multiple policy violations', () => {
      const password = 'short';

      try {
        PasswordService.validatePassword(password);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        // Should contain multiple error messages
        const message = (error as BadRequestError).message;
        expect(message).toContain('at least 12 characters');
        expect(message).toContain('uppercase letter');
        expect(message).toContain('number');
        expect(message).toContain('special character');
      }
    });

    it('should accept passwords with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '|', ',', '.', '<', '>', '/', '?'];

      specialChars.forEach(char => {
        const password = `ValidPass123${char}`;
        expect(() => PasswordService.validatePassword(password)).not.toThrow();
      });
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password of default length (16)', () => {
      const password = PasswordService.generateRandomPassword();

      expect(password).toBeDefined();
      expect(password.length).toBe(16);
    });

    it('should generate password of custom length', () => {
      const password = PasswordService.generateRandomPassword(20);

      expect(password.length).toBe(20);
    });

    it('should generate password that passes validation', () => {
      const password = PasswordService.generateRandomPassword();

      expect(() => PasswordService.validatePassword(password)).not.toThrow();
    });

    it('should generate different passwords on multiple calls', () => {
      const password1 = PasswordService.generateRandomPassword();
      const password2 = PasswordService.generateRandomPassword();
      const password3 = PasswordService.generateRandomPassword();

      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    it('should generate password with at least one uppercase', () => {
      const password = PasswordService.generateRandomPassword();

      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should generate password with at least one lowercase', () => {
      const password = PasswordService.generateRandomPassword();

      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should generate password with at least one number', () => {
      const password = PasswordService.generateRandomPassword();

      expect(/\d/.test(password)).toBe(true);
    });

    it('should generate password with at least one special character', () => {
      const password = PasswordService.generateRandomPassword();

      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true);
    });

    it('should generate passwords with sufficient entropy', () => {
      const passwords = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        passwords.add(PasswordService.generateRandomPassword());
      }

      // All passwords should be unique
      expect(passwords.size).toBe(iterations);
    });
  });

  describe('hash and verify integration', () => {
    it('should work correctly in sequence', async () => {
      const password = 'IntegrationTest123!';

      // Validate
      expect(() => PasswordService.validatePassword(password)).not.toThrow();

      // Hash
      const hash = await PasswordService.hash(password);
      expect(hash).toBeDefined();

      // Verify correct
      const isValid = await PasswordService.verify(password, hash);
      expect(isValid).toBe(true);

      // Verify incorrect
      const isInvalid = await PasswordService.verify('Wrong123!', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle multiple passwords', async () => {
      const password1 = 'Password1Test!';
      const password2 = 'Password2Test!';

      const hash1 = await PasswordService.hash(password1);
      const hash2 = await PasswordService.hash(password2);

      // Each password should only verify with its own hash
      expect(await PasswordService.verify(password1, hash1)).toBe(true);
      expect(await PasswordService.verify(password2, hash2)).toBe(true);
      expect(await PasswordService.verify(password1, hash2)).toBe(false);
      expect(await PasswordService.verify(password2, hash1)).toBe(false);
    });
  });
});
