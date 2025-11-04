/**
 * User model for database operations
 */

import { query } from '../utils/database';
import { User, UserRole } from '../types';
import logger from '../utils/logger';

export class UserModel {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  static async create(userData: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, role, phone,
        language, timezone, is_active, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, 'de', 'Europe/Vienna', true, false)
      RETURNING *`,
      [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.phone || null,
      ]
    );

    logger.info('User created', { userId: result.rows[0].id, email: userData.email });
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build dynamic UPDATE query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedAttempts(id: string): Promise<void> {
    await query(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Lock user account
   */
  static async lockAccount(id: string, lockoutDurationMinutes: number): Promise<void> {
    await query(
      `UPDATE users
       SET locked_until = NOW() + INTERVAL '${lockoutDurationMinutes} minutes',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    logger.warn('User account locked', { userId: id, duration: lockoutDurationMinutes });
  }

  /**
   * Reset failed login attempts
   */
  static async resetFailedAttempts(id: string): Promise<void> {
    await query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id: string, ipAddress: string): Promise<void> {
    await query(
      `UPDATE users
       SET last_login_at = NOW(), last_login_ip = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, ipAddress]
    );
  }

  /**
   * Enable MFA for user
   */
  static async enableMfa(id: string, secret: string, recoveryCodes: string[]): Promise<void> {
    await query(
      `UPDATE users
       SET mfa_enabled = true, mfa_secret = $2, mfa_recovery_codes = $3, updated_at = NOW()
       WHERE id = $1`,
      [id, secret, recoveryCodes]
    );

    logger.info('MFA enabled for user', { userId: id });
  }

  /**
   * Disable MFA for user
   */
  static async disableMfa(id: string): Promise<void> {
    await query(
      `UPDATE users
       SET mfa_enabled = false, mfa_secret = NULL, mfa_recovery_codes = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    logger.info('MFA disabled for user', { userId: id });
  }

  /**
   * Update password
   */
  static async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE users
       SET password_hash = $2, password_changed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id, passwordHash]
    );

    logger.info('Password updated for user', { userId: id });
  }

  /**
   * Soft delete user
   */
  static async softDelete(id: string): Promise<void> {
    await query(
      `UPDATE users
       SET deleted_at = NOW(), is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    logger.info('User soft deleted', { userId: id });
  }

  /**
   * List users with pagination
   */
  static async list(params: {
    limit?: number;
    offset?: number;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<{ users: User[]; total: number }> {
    const { limit = 50, offset = 0, role, isActive } = params;

    const conditions: string[] = ['deleted_at IS NULL'];
    const values: any[] = [];
    let paramCounter = 1;

    if (role) {
      conditions.push(`role = $${paramCounter}`);
      values.push(role);
      paramCounter++;
    }

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramCounter}`);
      values.push(isActive);
      paramCounter++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      values
    );

    return {
      users: result.rows,
      total,
    };
  }

  /**
   * Find user by OAuth provider
   */
  static async findByOAuthProvider(provider: string, providerId: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2 AND deleted_at IS NULL',
      [provider, providerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Link OAuth provider to existing user
   */
  static async linkOAuthProvider(
    userId: string,
    provider: string,
    providerId: string
  ): Promise<User | null> {
    const result = await query(
      `UPDATE users
       SET oauth_provider = $2, oauth_provider_id = $3, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [userId, provider, providerId]
    );

    logger.info('OAuth provider linked to user', { userId, provider });
    return result.rows[0] || null;
  }

  /**
   * Create new user from OAuth provider
   */
  static async createOAuthUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    oauthProvider: string;
    oauthProviderId: string;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (
        email, first_name, last_name, oauth_provider, oauth_provider_id,
        language, timezone, is_active, is_verified, role
      ) VALUES ($1, $2, $3, $4, $5, 'de', 'Europe/Vienna', true, true, 'user')
      RETURNING *`,
      [
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.oauthProvider,
        userData.oauthProviderId,
      ]
    );

    logger.info('OAuth user created', {
      userId: result.rows[0].id,
      email: userData.email,
      provider: userData.oauthProvider,
    });
    return result.rows[0];
  }
}
