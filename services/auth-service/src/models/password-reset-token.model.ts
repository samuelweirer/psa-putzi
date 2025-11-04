/**
 * Password Reset Token model for database operations
 */

import { query } from '../utils/database';
import { PasswordResetToken } from '../types';
import logger from '../utils/logger';

export class PasswordResetTokenModel {
  /**
   * Create a new password reset token
   */
  static async create(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }): Promise<PasswordResetToken> {
    const result = await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.user_id, data.token_hash, data.expires_at]
    );

    logger.info('Password reset token created', { userId: data.user_id });
    return result.rows[0];
  }

  /**
   * Find valid token by hash
   */
  static async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const result = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    return result.rows[0] || null;
  }

  /**
   * Mark token as used
   */
  static async markAsUsed(tokenHash: string): Promise<void> {
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );

    logger.info('Password reset token used', { tokenHash: tokenHash.substring(0, 10) });
  }

  /**
   * Invalidate all tokens for user
   */
  static async invalidateAllForUser(userId: string): Promise<void> {
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`
    );

    const count = result.rowCount || 0;
    if (count > 0) {
      logger.info('Expired password reset tokens cleaned up', { count });
    }

    return count;
  }
}
