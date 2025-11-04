/**
 * Swagger API Documentation Configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSA Platform - Authentication Service API',
      version: '1.0.0',
      description: `
        Comprehensive authentication and authorization service for the PSA Platform.

        **Features:**
        - Email/password authentication with JWT tokens
        - Multi-Factor Authentication (TOTP)
        - OAuth2 integration (Google, Microsoft)
        - Role-Based Access Control (RBAC) with 23 roles
        - Password reset and management
        - Token refresh and revocation

        **Security:**
        - bcrypt password hashing
        - JWT with unique jti claims
        - Refresh token rotation
        - Rate limiting (Redis-based)
        - RBAC middleware with role hierarchy
      `,
      contact: {
        name: 'PSA Platform Team',
        email: 'support@psa-platform.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.psa-platform.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: [
                'system_admin',
                'tenant_admin',
                'security_admin',
                'service_manager',
                'software_developer_lead',
                'technician_lead',
                'software_developer_senior',
                'technician_senior',
                'software_developer',
                'technician',
                'software_developer_junior',
                'technician_junior',
                'account_manager',
                'project_manager',
                'billing_manager',
                'customer_admin',
                'customer_technician',
                'customer_user',
              ],
              example: 'customer_user',
            },
            mfa_enabled: {
              type: 'boolean',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (expires in 15 minutes)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token (expires in 7 days)',
              example: 'd7f8a9b0c1d2e3f4...',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'VALIDATION_ERROR',
            },
            message: {
              type: 'string',
              example: 'Invalid request parameters',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Local authentication endpoints (email/password)',
      },
      {
        name: 'OAuth',
        description: 'OAuth2 authentication (Google, Microsoft)',
      },
      {
        name: 'MFA',
        description: 'Multi-Factor Authentication (TOTP)',
      },
      {
        name: 'Password',
        description: 'Password management and recovery',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
