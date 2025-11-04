/**
 * Integration tests for Auth endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { query, closePool } from '../../src/utils/database';
import { Express } from 'express';

describe('Auth API Integration Tests', () => {
  let app: Express;
  let testUserId: string;
  let accessToken: string;
  let refreshToken: string;

  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
  };

  beforeAll(async () => {
    app = createApp();

    // Clean up any existing test user
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);

    // Close database connection
    await closePool();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('first_name', testUser.first_name);
      expect(response.body).toHaveProperty('last_name', testUser.last_name);
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('is_verified', false);
      expect(response.body).not.toHaveProperty('password_hash');

      testUserId = response.body.id;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'USER_EXISTS');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'weak@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('token_type', 'Bearer');
      expect(response.body).toHaveProperty('expires_in');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should lock account after max failed attempts', async () => {
      // Create a temporary user for this test
      const tempUser = {
        email: 'locktest@example.com',
        password: 'LockTest123!',
        first_name: 'Lock',
        last_name: 'Test',
      };

      // Register temp user
      await request(app)
        .post('/api/v1/auth/register')
        .send(tempUser);

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: tempUser.email,
            password: 'WrongPassword123!',
          });
      }

      // 6th attempt should return account locked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: tempUser.email,
          password: tempUser.password, // Even correct password should fail
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'ACCOUNT_LOCKED');
      expect(response.body).toHaveProperty('message');

      // Clean up
      await query('DELETE FROM users WHERE email = $1', [tempUser.email]);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('first_name', testUser.first_name);
      expect(response.body).toHaveProperty('last_name', testUser.last_name);
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/auth/me', () => {
    it('should update user profile', async () => {
      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
        language: 'en',
      };

      const response = await request(app)
        .put('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('first_name', 'Updated');
      expect(response.body).toHaveProperty('last_name', 'Name');
      expect(response.body).toHaveProperty('language', 'en');
    });

    it('should not allow updating restricted fields', async () => {
      const response = await request(app)
        .put('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'system_admin', // Should be ignored
          email: 'hacker@example.com', // Should be ignored
        })
        .expect(200);

      // Email and role should not change
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body.role).not.toBe('system_admin');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('expires_in');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.access_token.length).toBeGreaterThan(0);

      // Update access token for future tests
      accessToken = response.body.access_token;
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    const newPassword = 'NewPassword123!';

    it('should change password with valid credentials', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          old_password: testUser.password,
          new_password: newPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Update test user password
      testUser.password = newPassword;
    });

    it('should reject with wrong old password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          old_password: 'WrongPassword123!',
          new_password: 'AnotherPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          old_password: testUser.password,
          new_password: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/password-reset/request', () => {
    it('should accept password reset request', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refresh_token: refreshToken,
        })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should reject using revoked refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'psa-auth-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
