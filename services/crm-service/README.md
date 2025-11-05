# PSA CRM Service

Customer Relationship Management microservice for the PSA Platform.

## Overview

The CRM Service provides comprehensive customer, contact, and location management functionality with full multi-tenancy support, event publishing, and RESTful APIs.

## Features

- ✅ **Customer Management**: Complete CRUD operations for customers with hierarchical support
- ✅ **Contact Management**: Multi-contact per customer with primary contact designation
- ✅ **Location Management**: Multiple locations per customer (headquarters, branches, datacenters)
- ✅ **Multi-Tenancy**: Full tenant isolation with `tenant_id` filtering on all queries
- ✅ **Event Publishing**: RabbitMQ event publishing for domain events
- ✅ **Soft Deletes**: All entities support soft deletion
- ✅ **Validation**: Joi schema validation on all inputs
- ✅ **API Documentation**: OpenAPI 3.0 / Swagger documentation
- ✅ **Testing**: 141 tests with 83.7% code coverage
- ✅ **TypeScript**: Full type safety

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Message Queue**: RabbitMQ
- **Testing**: Vitest + Supertest
- **Documentation**: Swagger/OpenAPI 3.0
- **Process Manager**: PM2

## Quick Start

### Installation

```bash
cd /opt/psa-putzi/services/crm-service
npm install
```

### Environment Setup

Create `.env` file from template:

```bash
cp .env.example .env
```

Required environment variables:

```env
NODE_ENV=development
PORT=3020

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=psa_platform
DB_USER=psa_admin
DB_PASSWORD=your_password

# RabbitMQ
RABBITMQ_URL=amqp://psa_user:your_password@localhost:5672
RABBITMQ_EXCHANGE=psa.events

# JWT (for auth middleware)
JWT_SECRET=your_jwt_secret
```

### Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

### Testing

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm test:run

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## API Documentation

Once running, access interactive API documentation at:

- **Swagger UI**: http://localhost:3020/api-docs

### Endpoints

#### Customer Endpoints

- `GET /api/v1/customers` - List customers (paginated)
- `GET /api/v1/customers/:id` - Get customer by ID
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Soft delete customer
- `GET /api/v1/customers/:id/children` - Get child customers

#### Contact Endpoints

- `GET /api/v1/customers/:customerId/contacts` - List customer contacts
- `POST /api/v1/customers/:customerId/contacts` - Create contact
- `GET /api/v1/contacts/:id` - Get contact by ID
- `PUT /api/v1/contacts/:id` - Update contact
- `DELETE /api/v1/contacts/:id` - Soft delete contact
- `GET /api/v1/contacts/search?q=query` - Search contacts

#### Location Endpoints

- `GET /api/v1/customers/:customerId/locations` - List customer locations
- `POST /api/v1/customers/:customerId/locations` - Create location
- `GET /api/v1/locations/:id` - Get location by ID
- `PUT /api/v1/locations/:id` - Update location
- `DELETE /api/v1/locations/:id` - Soft delete location
- `GET /api/v1/locations/search?q=query` - Search locations

#### Health Check

- `GET /health` - Service health check

## Authentication

All API endpoints (except `/health` and `/api-docs`) require JWT authentication via Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

The JWT must contain:
- `userId` or `sub`: User ID
- `tenant_id` or `tenantId`: Tenant ID
- `email`: User email
- `role`: User role

## Database Migrations

Run migrations to set up the database schema:

```bash
# Apply all migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

Migrations are located in `/opt/psa-putzi/services/crm-service/migrations/`.

## Deployment

### PM2 Deployment

Deploy using PM2 process manager:

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs psa-crm-service

# Monitor
pm2 monit

# Restart
pm2 restart psa-crm-service

# Stop
pm2 stop psa-crm-service

# Delete
pm2 delete psa-crm-service
```

### PM2 Configuration

The PM2 configuration (`ecosystem.config.js`) runs:
- **2 instances** in cluster mode
- **Auto-restart** on failure
- **Max memory**: 500MB per instance
- **Logs**: `/opt/psa-platform/logs/`

## Project Structure

```
/opt/psa-putzi/services/crm-service/
├── src/
│   ├── controllers/      # HTTP request handlers
│   │   ├── customer.controller.ts
│   │   ├── contact.controller.ts
│   │   └── location.controller.ts
│   ├── models/          # Data models & database queries
│   │   ├── customer.model.ts
│   │   ├── contact.model.ts
│   │   └── location.model.ts
│   ├── routes/          # API route definitions
│   │   ├── customer.routes.ts
│   │   ├── contact.routes.ts
│   │   └── location.routes.ts
│   ├── validators/      # Joi validation schemas
│   │   ├── customer.validator.ts
│   │   ├── contact.validator.ts
│   │   └── location.validator.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/           # Utilities
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── errors.ts
│   │   ├── event-publisher.ts
│   │   ├── logger.ts
│   │   └── swagger.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/            # Unit tests (95 tests)
│   │   └── models/
│   └── integration/     # Integration tests (46 tests)
│       ├── customer.routes.test.ts
│       ├── contact.routes.test.ts
│       └── location.routes.test.ts
├── migrations/          # Database migrations
├── dist/                # Compiled JavaScript (gitignored)
├── coverage/            # Test coverage reports (gitignored)
├── ecosystem.config.js  # PM2 configuration
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Testing Coverage

Current test coverage: **83.7%** ✅

```
 % Coverage report from v8
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   83.7  |   83.54  |   86.2  |   83.7  |
 src/models        |    100  |     100  |    100  |    100  |
 src/routes        |    100  |     100  |    100  |    100  |
 src/validators    |    100  |     100  |    100  |    100  |
 src/controllers   |  87.19  |      65  |  94.44  |  87.19  |
 src/middleware    |  79.14  |   88.88  |     60  |  79.14  |
-------------------|---------|----------|---------|---------|
```

**Test Breakdown:**
- Unit Tests: 95 tests (Customer: 36, Contact: 32, Location: 27)
- Integration Tests: 46 tests (Customer: 17, Contact: 17, Location: 12)
- **Total: 141 tests** - ALL PASSING ✅

## Domain Events

The service publishes domain events to RabbitMQ:

### Customer Events
- `customer.created`
- `customer.updated`
- `customer.deleted`

### Contact Events
- `contact.created`
- `contact.updated`
- `contact.deleted`

### Location Events
- `location.created`
- `location.updated`
- `location.deleted`

**Event Format:**
```typescript
{
  eventType: string;
  eventVersion: string;
  timestamp: string;
  tenantId: string;
  userId?: string;
  data: {
    customer?: Customer;
    contact?: Contact;
    location?: Location;
    changes?: Partial<any>;
  };
}
```

## Multi-Tenancy

All database queries are automatically filtered by `tenant_id` extracted from the JWT token. This ensures complete data isolation between tenants.

**Implementation:**
- Every model query includes `tenant_id` in WHERE clauses
- Row-Level Security (RLS) is enforced at the database level
- Tenant context is extracted from JWT in auth middleware

## Error Handling

The service uses standardized error responses:

**Success Response:**
```json
{
  "id": "uuid",
  "name": "Customer Name",
  ...
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Customer not found",
    "statusCode": 404
  }
}
```

**Validation Error:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [...]
}
```

## Logging

Structured logging using Winston:
- All requests logged with method, path, IP
- All domain events logged
- Errors logged with stack traces
- Logs include correlation IDs

## Performance

- **Cluster Mode**: 2 PM2 instances for load distribution
- **Database Connection Pooling**: PostgreSQL connection pool
- **Soft Deletes**: Fast deletion without data loss
- **Indexed Queries**: All tenant_id and primary keys indexed

## Security

- **JWT Authentication**: All endpoints protected
- **Helmet.js**: HTTP security headers
- **CORS**: Configured for trusted origins
- **Input Validation**: Joi schemas on all inputs
- **SQL Injection Protection**: Parameterized queries
- **Tenant Isolation**: RLS + application-level filtering

## Troubleshooting

### Service won't start
- Check `.env` file exists and is configured
- Verify PostgreSQL is running
- Verify RabbitMQ is running
- Check port 3020 is not in use

### Tests failing
- Ensure database is running (tests use mocks but need config)
- Run `npm install` to ensure all dependencies installed
- Check test logs: `npm test 2>&1 | tee test.log`

### PM2 deployment issues
- Ensure `npm run build` completes successfully
- Check PM2 logs: `pm2 logs psa-crm-service`
- Verify log directory exists: `/opt/psa-platform/logs/`
- Check PM2 status: `pm2 status`

## Next Steps

This CRM service is complete and production-ready. The next module to implement is:

**Module 5: Tickets Service** (`implementation/05-MODULE-Tickets.md`)

Key handover items:
1. All CRM endpoints tested and documented
2. Event publishing infrastructure ready for Tickets to consume
3. Authentication middleware can be reused
4. Database migration pattern established
5. Testing infrastructure (Vitest) ready for Tickets module

## License

Internal PSA Platform Project

## Contact

For questions or issues, contact the PSA Platform development team.
