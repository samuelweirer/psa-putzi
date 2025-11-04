/**
 * Unit tests for JWTService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JWTService } from '../../src/services/jwt.service';
import { UnauthorizedError } from '../../src/utils/errors';
import { JWTPayload } from '../../src/types';
import jwt from 'jsonwebtoken';

// Mock config - must be inline in vi.mock factory
vi.mock('../../src/utils/config', () => ({
  default: {
    jwt: {
      secret: 'test-jwt-secret-key-min-32-chars-long-for-security',
      refreshSecret: 'test-jwt-refresh-secret-key-min-32-chars-long-for-security',
      accessExpiry: '15m',
      refreshExpiry: '7d',
    },
  },
}));

// Reference to mocked config for tests that modify it
const mockConfig = {
  jwt: {
    secret: 'test-jwt-secret-key-min-32-chars-long-for-security',
    refreshSecret: 'test-jwt-refresh-secret-key-min-32-chars-long-for-security',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
};

// Mock logger to suppress logs during tests
vi.mock('../../src/utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('JWTService', () => {
  const mockPayload: JWTPayload = {
    sub: 'user-id-123',
    email: 'test@example.com',
    role: 'customer_user',
    permissions: { tickets: { read: true, write: true } },
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = JWTService.generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include correct claims in token', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.permissions).toEqual(mockPayload.permissions);
      expect(decoded.iss).toBe('psa-platform');
      expect(decoded.aud).toBe('psa-api');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should generate different tokens for same payload', () => {
      const token1 = JWTService.generateAccessToken(mockPayload);

      // Wait a tiny bit to ensure different iat
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      const token2 = JWTService.generateAccessToken(mockPayload);

      vi.useRealTimers();

      expect(token1).not.toBe(token2);
    });

    it('should set expiry correctly', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 15 * 60; // 15 minutes

      // Allow 2 second tolerance
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 2);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct claims in token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iss).toBe('psa-platform');
      expect(decoded.aud).toBe('psa-api');
    });

    it('should set longer expiry than access token', () => {
      const accessToken = JWTService.generateAccessToken(mockPayload);
      const refreshToken = JWTService.generateRefreshToken(mockPayload);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.verifyAccessToken(token);

      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should reject token with wrong secret', () => {
      // Generate token with different secret
      const token = jwt.sign(mockPayload, 'wrong-secret', {
        expiresIn: '15m',
        issuer: 'psa-platform',
        audience: 'psa-api',
      });

      expect(() => JWTService.verifyAccessToken(token))
        .toThrow(UnauthorizedError);

      try {
        JWTService.verifyAccessToken(token);
      } catch (error) {
        expect((error as UnauthorizedError).code).toBe('TOKEN_INVALID');
      }
    });

    it('should reject expired token', () => {
      // Generate expired token
      const expiredToken = jwt.sign(mockPayload, mockConfig.jwt.secret, {
        expiresIn: '-1s', // Already expired
        issuer: 'psa-platform',
        audience: 'psa-api',
      });

      expect(() => JWTService.verifyAccessToken(expiredToken))
        .toThrow(UnauthorizedError);

      try {
        JWTService.verifyAccessToken(expiredToken);
      } catch (error) {
        expect((error as UnauthorizedError).code).toBe('TOKEN_EXPIRED');
      }
    });

    it('should reject malformed token', () => {
      expect(() => JWTService.verifyAccessToken('not-a-jwt-token'))
        .toThrow(UnauthorizedError);
    });

    it('should reject empty token', () => {
      expect(() => JWTService.verifyAccessToken(''))
        .toThrow(UnauthorizedError);
    });

    it('should reject token with wrong issuer', () => {
      const token = jwt.sign(mockPayload, mockConfig.jwt.secret, {
        expiresIn: '15m',
        issuer: 'wrong-issuer',
        audience: 'psa-api',
      });

      expect(() => JWTService.verifyAccessToken(token))
        .toThrow(UnauthorizedError);
    });

    it('should reject token with wrong audience', () => {
      const token = jwt.sign(mockPayload, mockConfig.jwt.secret, {
        expiresIn: '15m',
        issuer: 'psa-platform',
        audience: 'wrong-audience',
      });

      expect(() => JWTService.verifyAccessToken(token))
        .toThrow(UnauthorizedError);
    });

    it('should reject refresh token as access token', () => {
      const refreshToken = JWTService.generateRefreshToken(mockPayload);

      expect(() => JWTService.verifyAccessToken(refreshToken))
        .toThrow(UnauthorizedError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);
      const decoded = JWTService.verifyRefreshToken(token);

      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should reject token with wrong secret', () => {
      const token = jwt.sign(mockPayload, 'wrong-secret', {
        expiresIn: '7d',
        issuer: 'psa-platform',
        audience: 'psa-api',
      });

      expect(() => JWTService.verifyRefreshToken(token))
        .toThrow(UnauthorizedError);

      try {
        JWTService.verifyRefreshToken(token);
      } catch (error) {
        expect((error as UnauthorizedError).code).toBe('REFRESH_TOKEN_INVALID');
      }
    });

    it('should reject expired refresh token', () => {
      const expiredToken = jwt.sign(mockPayload, mockConfig.jwt.refreshSecret, {
        expiresIn: '-1s',
        issuer: 'psa-platform',
        audience: 'psa-api',
      });

      expect(() => JWTService.verifyRefreshToken(expiredToken))
        .toThrow(UnauthorizedError);

      try {
        JWTService.verifyRefreshToken(expiredToken);
      } catch (error) {
        expect((error as UnauthorizedError).code).toBe('REFRESH_TOKEN_EXPIRED');
      }
    });

    it('should reject access token as refresh token', () => {
      const accessToken = JWTService.generateAccessToken(mockPayload);

      expect(() => JWTService.verifyRefreshToken(accessToken))
        .toThrow(UnauthorizedError);
    });
  });

  describe('decode', () => {
    it('should decode valid token without verification', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.decode(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockPayload.sub);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should decode expired token', () => {
      const expiredToken = jwt.sign(mockPayload, mockConfig.jwt.secret, {
        expiresIn: '-1s',
        issuer: 'psa-platform',
        audience: 'psa-api',
      });

      const decoded = JWTService.decode(expiredToken);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockPayload.sub);
    });

    it('should return null for malformed token', () => {
      const decoded = JWTService.decode('not-a-valid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = JWTService.decode('');
      expect(decoded).toBeNull();
    });
  });

  describe('hashToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token-123';
      const hash1 = JWTService.hashToken(token);
      const hash2 = JWTService.hashToken(token);

      expect(hash1).toBe(hash2); // Same input = same hash
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = 'test-token-123';
      const token2 = 'test-token-456';

      const hash1 = JWTService.hashToken(token1);
      const hash2 = JWTService.hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hex string', () => {
      const token = 'test-token-123';
      const hash = JWTService.hashToken(token);

      expect(hash).toMatch(/^[0-9a-f]+$/); // Hex format
      expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it('should be case sensitive', () => {
      const token1 = 'test-token';
      const token2 = 'TEST-TOKEN';

      const hash1 = JWTService.hashToken(token1);
      const hash2 = JWTService.hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateRandomToken', () => {
    it('should generate token of default length (64 chars)', () => {
      const token = JWTService.generateRandomToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate token of custom length', () => {
      const token = JWTService.generateRandomToken(16);

      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate different tokens on multiple calls', () => {
      const token1 = JWTService.generateRandomToken();
      const token2 = JWTService.generateRandomToken();
      const token3 = JWTService.generateRandomToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate hex string', () => {
      const token = JWTService.generateRandomToken();

      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should have sufficient entropy', () => {
      const tokens = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(JWTService.generateRandomToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('getAccessTokenExpiry', () => {
    it('should parse minutes correctly (default config)', () => {
      // Config is set to '15m' in mock
      const expiry = JWTService.getAccessTokenExpiry();
      expect(expiry).toBe(15 * 60); // 900 seconds
    });

    it('should return number of seconds', () => {
      const expiry = JWTService.getAccessTokenExpiry();
      expect(typeof expiry).toBe('number');
      expect(expiry).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete token lifecycle', () => {
      // Generate
      const accessToken = JWTService.generateAccessToken(mockPayload);
      const refreshToken = JWTService.generateRefreshToken(mockPayload);

      // Verify
      const accessDecoded = JWTService.verifyAccessToken(accessToken);
      const refreshDecoded = JWTService.verifyRefreshToken(refreshToken);

      expect(accessDecoded.sub).toBe(mockPayload.sub);
      expect(refreshDecoded.sub).toBe(mockPayload.sub);

      // Hash refresh token for storage
      const hash = JWTService.hashToken(refreshToken);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);

      // Decode without verification
      const decoded = JWTService.decode(accessToken);
      expect(decoded?.sub).toBe(mockPayload.sub);
    });

    it('should maintain token separation', () => {
      const user1Payload: JWTPayload = {
        sub: 'user1',
        email: 'user1@example.com',
        role: 'customer_user',
        permissions: {},
      };

      const user2Payload: JWTPayload = {
        sub: 'user2',
        email: 'user2@example.com',
        role: 'technician',
        permissions: {},
      };

      const token1 = JWTService.generateAccessToken(user1Payload);
      const token2 = JWTService.generateAccessToken(user2Payload);

      const decoded1 = JWTService.verifyAccessToken(token1);
      const decoded2 = JWTService.verifyAccessToken(token2);

      expect(decoded1.sub).toBe('user1');
      expect(decoded2.sub).toBe('user2');
      expect(token1).not.toBe(token2);
    });
  });
});
