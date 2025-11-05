/**
 * Swagger/OpenAPI configuration for API Gateway
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSA Platform API Gateway',
      version: '1.0.0',
      description: `
# PSA Platform API Gateway

The API Gateway for the PSA (Professional Services Automation) Platform.
This gateway handles authentication, rate limiting, circuit breaking, and routing to all microservices.

## Features

- **Authentication**: JWT-based authentication with OAuth2 support
- **RBAC**: Role-Based Access Control with 23 role hierarchy
- **Rate Limiting**: Redis-backed distributed rate limiting
- **Circuit Breaker**: Automatic failure detection and recovery
- **Request Tracking**: Unique request IDs for all requests
- **Security**: Helmet security headers, CORS configuration

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain tokens from the \`/api/v1/auth/login\` endpoint.

## Rate Limiting

All endpoints are rate limited to prevent abuse:
- **Global**: 100 requests per 15 minutes per IP
- **Auth**: 5 failed login attempts per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user

Rate limit info is included in response headers:
- \`RateLimit-Limit\`: Maximum requests allowed
- \`RateLimit-Remaining\`: Requests remaining in current window
- \`RateLimit-Policy\`: Rate limit policy details

## Circuit Breaker

The gateway implements circuit breaker pattern for all downstream services:
- **CLOSED**: Normal operation
- **OPEN**: Service unavailable (returns 503)
- **HALF_OPEN**: Testing service recovery

Check \`/health/detailed\` for circuit breaker status.

## Error Responses

All errors follow a standardized format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "status": 400,
    "timestamp": "2025-11-05T12:00:00.000Z",
    "request_id": "uuid-v4"
  }
}
\`\`\`
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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.psa-platform.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/v1/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'string',
                  example: 'Human-readable error message',
                },
                status: {
                  type: 'integer',
                  example: 400,
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                request_id: {
                  type: 'string',
                  format: 'uuid',
                },
              },
            },
          },
        },
        Health: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
            },
            service: {
              type: 'string',
              example: 'psa-api-gateway',
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            uptime: {
              type: 'integer',
              description: 'Uptime in seconds',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DetailedHealth: {
          allOf: [
            { $ref: '#/components/schemas/Health' },
            {
              type: 'object',
              properties: {
                circuitBreakers: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      state: {
                        type: 'string',
                        enum: ['CLOSED', 'OPEN', 'HALF_OPEN'],
                      },
                      failures: {
                        type: 'integer',
                      },
                      successes: {
                        type: 'integer',
                      },
                      totalRequests: {
                        type: 'integer',
                      },
                      lastFailureTime: {
                        type: 'integer',
                        nullable: true,
                      },
                      lastSuccessTime: {
                        type: 'integer',
                        nullable: true,
                      },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalCircuits: { type: 'integer' },
                    openCircuits: { type: 'integer' },
                    halfOpenCircuits: { type: 'integer' },
                    closedCircuits: { type: 'integer' },
                  },
                },
              },
            },
          ],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
          headers: {
            'RateLimit-Limit': {
              description: 'Maximum requests allowed',
              schema: { type: 'integer' },
            },
            'RateLimit-Remaining': {
              description: 'Requests remaining',
              schema: { type: 'integer' },
            },
            'Retry-After': {
              description: 'Seconds to wait before retrying',
              schema: { type: 'integer' },
            },
          },
        },
        ServiceUnavailable: {
          description: 'Service temporarily unavailable (circuit breaker open)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints (proxied to auth service)',
      },
      {
        name: 'Protected',
        description: 'Example protected endpoints demonstrating auth/RBAC',
      },
    ],
  },
  apis: ['./src/app.ts', './src/routes/*.ts'], // Files containing annotations
};

export const swaggerSpec = swaggerJsdoc(options);
