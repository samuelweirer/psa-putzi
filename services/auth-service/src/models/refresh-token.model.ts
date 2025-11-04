/**
 * Refresh Token model for database operations
 */

import { query } from '../utils/database';
import { RefreshToken } from '../types';
import logger from '../utils/logger';

export class RefreshTokenModel {
  /**
   * Create a new refresh token
   */
  static async create(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
    user_agent?: string;
    ip_address?: string;
  }): Promise<RefreshToken> {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.user_id, data.token_hash, data.expires_at, data.user_agent, data.ip_address]
    );

    return result.rows[0];
  }

  /**
   * Find token by hash
   */
  static async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    return result.rows[0] || null;
  }

  /**
   * Revoke a refresh token
   */
  static async revoke(tokenHash: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );

    logger.info('Refresh token revoked', { tokenHash: tokenHash.substring(0, 10) });
  }

  /**
   * Revoke all tokens for a user
   */
  static async revokeAllForUser(userId: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    logger.info('All refresh tokens revoked for user', { userId });
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days'`
    );

    const count = result.rowCount || 0;
    if (count > 0) {
      logger.info('Expired refresh tokens cleaned up', { count });
    }

    return count;
  }

  /**
   * Get active tokens for user
   */
  static async getActiveForUser(userId: string): Promise<RefreshToken[]> {
    const result = await query(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }
}
