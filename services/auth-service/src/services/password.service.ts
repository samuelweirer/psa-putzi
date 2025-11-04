/**
 * Password hashing and validation service
 */

import bcrypt from 'bcrypt';
import config from '../utils/config';
import { BadRequestError } from '../utils/errors';

const SALT_ROUNDS = 12;

export class PasswordService {
  /**
   * Hash a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password against policy
   */
  static validatePassword(password: string): void {
    const errors: string[] = [];

    // Minimum length
    if (password.length < config.password.minLength) {
      errors.push(`Password must be at least ${config.password.minLength} characters long`);
    }

    // Uppercase requirement
    if (config.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase requirement
    if (config.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Numbers requirement
    if (config.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special characters requirement
    if (config.password.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new BadRequestError(errors.join('; '), 'PASSWORD_POLICY_VIOLATION');
    }
  }

  /**
   * Generate a random password meeting policy requirements
   */
  static generateRandomPassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{};<>?';

    let password = '';
    const all = uppercase + lowercase + numbers + special;

    // Ensure at least one of each required type
    if (config.password.requireUppercase) {
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }
    if (config.password.requireLowercase) {
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }
    if (config.password.requireNumbers) {
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    if (config.password.requireSpecial) {
      password += special[Math.floor(Math.random() * special.length)];
    }

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
