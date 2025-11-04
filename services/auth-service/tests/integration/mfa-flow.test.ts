/**
 * Integration tests for MFA flow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { query, closePool } from '../../src/utils/database';
import { Express } from 'express';
import speakeasy from 'speakeasy';

describe('MFA Flow Integration Tests', () => {
  let app: Express;
  let userId: string;
  let accessToken: string;

  const testUser = {
    email: 'mfa-flow-test@example.com',
    password: 'MfaFlowTest123!',
    first_name: 'MFA',
    last_name: 'Flow',
  };

  beforeAll(async () => {
    app = createApp();
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    if (userId) {
      await query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
    await closePool();
  });

  it('should complete full MFA setup and login flow', async () => {
    // Step 1: Register user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    userId = registerRes.body.id;
    expect(userId).toBeDefined();

    // Step 2: Login to get access token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    accessToken = loginRes.body.access_token;
    expect(accessToken).toBeDefined();

    // Step 3: Setup MFA
    const setupRes = await request(app)
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(setupRes.body).toHaveProperty('secret');
    expect(setupRes.body).toHaveProperty('qr_code');
    expect(setupRes.body).toHaveProperty('setup_token');

    const mfaSecret = setupRes.body.secret;
    const setupToken = setupRes.body.setup_token;

    // Step 4: Verify MFA with valid TOTP code
    const totpCode = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32',
    });

    const verifyRes = await request(app)
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        setup_token: setupToken,
        code: totpCode,
      })
      .expect(200);

    expect(verifyRes.body).toHaveProperty('message');
    expect(verifyRes.body).toHaveProperty('recovery_codes');
    expect(verifyRes.body.recovery_codes.length).toBe(10);

    const recoveryCodes = verifyRes.body.recovery_codes;

    // Step 5: Verify MFA is enabled in profile
    const profileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileRes.body.mfa_enabled).toBe(true);

    // Step 6: Login now requires MFA code
    const loginNoMfaRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(428);

    expect(loginNoMfaRes.body.error).toBe('MFA_REQUIRED');

    // Step 7: Login with valid TOTP code
    const newTotpCode = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32',
    });

    const loginWithMfaRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        mfa_code: newTotpCode,
      })
      .expect(200);

    expect(loginWithMfaRes.body).toHaveProperty('access_token');
    expect(loginWithMfaRes.body).toHaveProperty('refresh_token');

    // Update access token
    accessToken = loginWithMfaRes.body.access_token;

    // Step 8: Login with recovery code
    const recoveryCode = recoveryCodes[0];

    const loginWithRecoveryRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        mfa_code: recoveryCode,
      })
      .expect(200);

    expect(loginWithRecoveryRes.body).toHaveProperty('access_token');

    // Update access token
    accessToken = loginWithRecoveryRes.body.access_token;

    // Step 9: Same recovery code should not work again
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        mfa_code: recoveryCode,
      })
      .expect(401);

    // Step 10: Disable MFA
    const disableTotpCode = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32',
    });

    const disableRes = await request(app)
      .post('/api/v1/auth/mfa/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: testUser.password,
        code: disableTotpCode,
      })
      .expect(200);

    expect(disableRes.body).toHaveProperty('message');

    // Step 11: Verify MFA is disabled
    const finalProfileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(finalProfileRes.body.mfa_enabled).toBe(false);

    // Step 12: Login should work without MFA code now
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);
  });

  it('should reject MFA setup without authentication', async () => {
    await request(app)
      .post('/api/v1/auth/mfa/setup')
      .expect(401);
  });

  it('should reject invalid TOTP code during verification', async () => {
    // Create new user for this test
    const tempUser = {
      email: 'mfa-invalid-test@example.com',
      password: 'InvalidTest123!',
      first_name: 'Invalid',
      last_name: 'Test',
    };

    await query('DELETE FROM users WHERE email = $1', [tempUser.email]);

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(tempUser)
      .expect(201);

    const tempUserId = registerRes.body.id;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: tempUser.email,
        password: tempUser.password,
      })
      .expect(200);

    const tempAccessToken = loginRes.body.access_token;

    const setupRes = await request(app)
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', `Bearer ${tempAccessToken}`)
      .expect(200);

    // Try to verify with invalid code
    await request(app)
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${tempAccessToken}`)
      .send({
        setup_token: setupRes.body.setup_token,
        code: '000000', // Invalid code
      })
      .expect(500); // Will throw error

    // Cleanup
    await query('DELETE FROM users WHERE id = $1', [tempUserId]);
  });
});
