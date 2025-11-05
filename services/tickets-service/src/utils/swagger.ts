/**
 * Swagger/OpenAPI configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSA Tickets API',
      version: '1.0.0',
      description: 'Ticketing & Service Desk API for PSA-Platform',
      contact: {
        name: 'PSA-Platform Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000/api/v1/tickets',
        description: 'Via API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticket_number: { type: 'integer' },
            customer_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            status: {
              type: 'string',
              enum: ['new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed', 'cancelled'],
            },
            assigned_to: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TimeEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticket_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            hours: { type: 'number', format: 'double' },
            description: { type: 'string' },
            billable: { type: 'boolean' },
            billing_rate: { type: 'number', format: 'double' },
            cost_rate: { type: 'number', format: 'double' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticket_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            is_internal: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'integer' },
              },
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
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to API routes
};

export const swaggerSpec = swaggerJsdoc(options);
