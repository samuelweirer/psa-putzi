/**
 * Refresh Token Model Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenModel } from '../../src/models/refresh-token.model';
import { query } from '../../src/utils/database';

// Mock database
vi.mock('../../src/utils/database');

describe('RefreshTokenModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new refresh token', async () => {
      const mockToken = {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: 'user-123',
        token_hash: 'hashed-token',
        expires_at: new Date('2025-12-31'),
        user_agent: 'Mozilla/5.0',
        ip_address: '127.0.0.1',
        created_at: new Date(),
        revoked_at: null,
      };

      vi.mocked(query).mockResolvedValue({ rows: [mockToken], rowCount: 1 } as any);

      const result = await RefreshTokenModel.create({
        user_id: 'user-123',
        token_hash: 'hashed-token',
        expires_at: new Date('2025-12-31'),
        user_agent: 'Mozilla/5.0',
        ip_address: '127.0.0.1',
      });

      expect(result).toEqual(mockToken);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        ['user-123', 'hashed-token', expect.any(Date), 'Mozilla/5.0', '127.0.0.1']
      );
    });
  });

  describe('findByHash', () => {
    it('should find token by hash', async () => {
      const mockToken = {
        id: '00000000-0000-0000-0000-000000000002',
        user_id: 'user-123',
        token_hash: 'hashed-token',
        expires_at: new Date('2025-12-31'),
        revoked_at: null,
      };

      vi.mocked(query).mockResolvedValue({ rows: [mockToken], rowCount: 1 } as any);

      const result = await RefreshTokenModel.findByHash('hashed-token');

      expect(result).toEqual(mockToken);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM refresh_tokens'),
        ['hashed-token']
      );
    });

    it('should return null when token not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await RefreshTokenModel.findByHash('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('revoke', () => {
    it('should revoke a refresh token', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await RefreshTokenModel.revoke('hashed-token');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens SET revoked_at = NOW()'),
        ['hashed-token']
      );
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all tokens for a user', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 3 } as any);

      await RefreshTokenModel.revokeAllForUser('user-123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens SET revoked_at = NOW()'),
        ['user-123']
      );
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired tokens and return count', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 5 } as any);

      const count = await RefreshTokenModel.cleanupExpired();

      expect(count).toBe(5);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM refresh_tokens WHERE expires_at')
      );
    });

    it('should return 0 when no tokens to cleanup', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const count = await RefreshTokenModel.cleanupExpired();

      expect(count).toBe(0);
    });

    it('should handle null rowCount', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: null } as any);

      const count = await RefreshTokenModel.cleanupExpired();

      expect(count).toBe(0);
    });
  });

  describe('getActiveForUser', () => {
    it('should get all active tokens for user', async () => {
      const mockTokens = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: 'user-123',
          token_hash: 'token1',
          expires_at: new Date('2025-12-31'),
          revoked_at: null,
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          user_id: 'user-123',
          token_hash: 'token2',
          expires_at: new Date('2025-12-31'),
          revoked_at: null,
        },
      ];

      vi.mocked(query).mockResolvedValue({ rows: mockTokens, rowCount: 2 } as any);

      const result = await RefreshTokenModel.getActiveForUser('user-123');

      expect(result).toEqual(mockTokens);
      expect(result).toHaveLength(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM refresh_tokens'),
        ['user-123']
      );
    });

    it('should return empty array when no active tokens', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await RefreshTokenModel.getActiveForUser('user-456');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
