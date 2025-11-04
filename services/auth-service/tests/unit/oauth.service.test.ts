/**
 * OAuth Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthService, OAuthProfile } from '../../src/services/oauth.service';
import { UserModel } from '../../src/models/user.model';

// Mock UserModel
vi.mock('../../src/models/user.model');

describe('OAuthService', () => {
  let oauthService: OAuthService;

  beforeEach(() => {
    oauthService = new OAuthService();
    vi.clearAllMocks();
  });

  describe('findOrCreateOAuthUser', () => {
    const googleProfile: OAuthProfile = {
      provider: 'google',
      providerId: 'google-123456',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const microsoftProfile: OAuthProfile = {
      provider: 'microsoft',
      providerId: 'ms-789012',
      email: 'test@outlook.com',
      firstName: 'Microsoft',
      lastName: 'User',
    };

    it('should return existing user when OAuth provider match is found', async () => {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer_user',
        oauth_provider: 'google',
        oauth_provider_id: 'google-123456',
      };

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(mockUser);

      const result = await oauthService.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(mockUser);
      expect(UserModel.findByOAuthProvider).toHaveBeenCalledWith('google', 'google-123456');
      expect(UserModel.findByEmail).not.toHaveBeenCalled();
      expect(UserModel.createOAuthUser).not.toHaveBeenCalled();
    });

    it('should link OAuth provider to existing email account', async () => {
      const mockExistingUser = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'test@gmail.com',
        first_name: 'Existing',
        last_name: 'User',
        role: 'customer_user',
        oauth_provider: null,
        oauth_provider_id: null,
      };

      const mockLinkedUser = {
        ...mockExistingUser,
        oauth_provider: 'google',
        oauth_provider_id: 'google-123456',
      };

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(mockExistingUser);
      vi.mocked(UserModel.linkOAuthProvider).mockResolvedValue(mockLinkedUser);

      const result = await oauthService.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(mockLinkedUser);
      expect(UserModel.findByOAuthProvider).toHaveBeenCalledWith('google', 'google-123456');
      expect(UserModel.findByEmail).toHaveBeenCalledWith('test@gmail.com');
      expect(UserModel.linkOAuthProvider).toHaveBeenCalledWith(
        mockExistingUser.id,
        'google',
        'google-123456'
      );
      expect(UserModel.createOAuthUser).not.toHaveBeenCalled();
    });

    it('should create new user when no existing user is found', async () => {
      const mockNewUser = {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'test@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer_user',
        oauth_provider: 'google',
        oauth_provider_id: 'google-123456',
      };

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(null);
      vi.mocked(UserModel.createOAuthUser).mockResolvedValue(mockNewUser);

      const result = await oauthService.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(mockNewUser);
      expect(UserModel.findByOAuthProvider).toHaveBeenCalledWith('google', 'google-123456');
      expect(UserModel.findByEmail).toHaveBeenCalledWith('test@gmail.com');
      expect(UserModel.createOAuthUser).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        oauthProvider: 'google',
        oauthProviderId: 'google-123456',
      });
    });

    it('should handle Microsoft OAuth profile', async () => {
      const mockNewUser = {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'test@outlook.com',
        first_name: 'Microsoft',
        last_name: 'User',
        role: 'customer_user',
        oauth_provider: 'microsoft',
        oauth_provider_id: 'ms-789012',
      };

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(null);
      vi.mocked(UserModel.createOAuthUser).mockResolvedValue(mockNewUser);

      const result = await oauthService.findOrCreateOAuthUser(microsoftProfile);

      expect(result).toEqual(mockNewUser);
      expect(UserModel.findByOAuthProvider).toHaveBeenCalledWith('microsoft', 'ms-789012');
      expect(UserModel.findByEmail).toHaveBeenCalledWith('test@outlook.com');
      expect(UserModel.createOAuthUser).toHaveBeenCalledWith({
        email: 'test@outlook.com',
        firstName: 'Microsoft',
        lastName: 'User',
        oauthProvider: 'microsoft',
        oauthProviderId: 'ms-789012',
      });
    });

    it('should throw error when database operations fail', async () => {
      const dbError = new Error('Database connection failed');

      vi.mocked(UserModel.findByOAuthProvider).mockRejectedValue(dbError);

      await expect(
        oauthService.findOrCreateOAuthUser(googleProfile)
      ).rejects.toThrow('Database connection failed');

      expect(UserModel.findByOAuthProvider).toHaveBeenCalledWith('google', 'google-123456');
    });

    it('should throw error when user creation fails', async () => {
      const createError = new Error('Failed to create user');

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(null);
      vi.mocked(UserModel.createOAuthUser).mockRejectedValue(createError);

      await expect(
        oauthService.findOrCreateOAuthUser(googleProfile)
      ).rejects.toThrow('Failed to create user');

      expect(UserModel.createOAuthUser).toHaveBeenCalled();
    });

    it('should throw error when linking OAuth provider fails', async () => {
      const mockExistingUser = {
        id: '00000000-0000-0000-0000-000000000005',
        email: 'test@gmail.com',
        first_name: 'Existing',
        last_name: 'User',
        role: 'customer_user',
      };

      const linkError = new Error('Failed to link OAuth provider');

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(mockExistingUser);
      vi.mocked(UserModel.linkOAuthProvider).mockRejectedValue(linkError);

      await expect(
        oauthService.findOrCreateOAuthUser(googleProfile)
      ).rejects.toThrow('Failed to link OAuth provider');

      expect(UserModel.linkOAuthProvider).toHaveBeenCalledWith(
        mockExistingUser.id,
        'google',
        'google-123456'
      );
    });

    it('should handle profiles with missing optional fields', async () => {
      const minimalProfile: OAuthProfile = {
        provider: 'google',
        providerId: 'google-minimal',
        email: 'minimal@gmail.com',
        firstName: 'Min',
        lastName: 'User',
      };

      const mockNewUser = {
        id: '00000000-0000-0000-0000-000000000006',
        email: 'minimal@gmail.com',
        first_name: 'Min',
        last_name: 'User',
        role: 'customer_user',
        oauth_provider: 'google',
        oauth_provider_id: 'google-minimal',
      };

      vi.mocked(UserModel.findByOAuthProvider).mockResolvedValue(null);
      vi.mocked(UserModel.findByEmail).mockResolvedValue(null);
      vi.mocked(UserModel.createOAuthUser).mockResolvedValue(mockNewUser);

      const result = await oauthService.findOrCreateOAuthUser(minimalProfile);

      expect(result).toEqual(mockNewUser);
      expect(UserModel.createOAuthUser).toHaveBeenCalledWith({
        email: 'minimal@gmail.com',
        firstName: 'Min',
        lastName: 'User',
        oauthProvider: 'google',
        oauthProviderId: 'google-minimal',
      });
    });
  });
});
