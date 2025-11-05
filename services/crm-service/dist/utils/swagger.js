"use strict";
/**
 * Swagger/OpenAPI Configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PSA CRM Service API',
            version: '1.0.0',
            description: 'Customer Relationship Management API for PSA Platform',
            contact: {
                name: 'PSA Platform Team',
                email: 'support@psa-platform.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3020',
                description: 'Development server',
            },
            {
                url: 'http://localhost:3000/crm',
                description: 'Development server (via Gateway)',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Authorization header using the Bearer scheme',
                },
            },
            schemas: {
                Customer: {
                    type: 'object',
                    required: ['name', 'type', 'tier', 'status', 'currency'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier',
                        },
                        tenant_id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Tenant identifier',
                        },
                        name: {
                            type: 'string',
                            description: 'Customer legal name',
                            example: 'ACME GmbH',
                        },
                        display_name: {
                            type: 'string',
                            description: 'Customer display name',
                            example: 'ACME',
                        },
                        customer_number: {
                            type: 'string',
                            description: 'Auto-generated customer number',
                            example: 'CUS-0001',
                        },
                        parent_customer_id: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                            description: 'Parent customer ID for hierarchies',
                        },
                        type: {
                            type: 'string',
                            enum: ['business', 'residential'],
                            description: 'Customer type',
                        },
                        tier: {
                            type: 'string',
                            enum: ['bronze', 'silver', 'gold', 'platinum'],
                            description: 'Customer tier/priority',
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'suspended'],
                            description: 'Customer status',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            nullable: true,
                        },
                        phone: {
                            type: 'string',
                            nullable: true,
                        },
                        website: {
                            type: 'string',
                            format: 'uri',
                            nullable: true,
                        },
                        address_line1: {
                            type: 'string',
                            nullable: true,
                        },
                        address_line2: {
                            type: 'string',
                            nullable: true,
                        },
                        city: {
                            type: 'string',
                            nullable: true,
                        },
                        state: {
                            type: 'string',
                            nullable: true,
                        },
                        postal_code: {
                            type: 'string',
                            nullable: true,
                        },
                        country: {
                            type: 'string',
                            pattern: '^[A-Z]{3}$',
                            nullable: true,
                            description: 'ISO 3166-1 alpha-3 country code',
                        },
                        tax_id: {
                            type: 'string',
                            nullable: true,
                            description: 'VAT/Tax ID',
                        },
                        payment_terms: {
                            type: 'integer',
                            nullable: true,
                            description: 'Payment terms in days',
                        },
                        currency: {
                            type: 'string',
                            pattern: '^[A-Z]{3}$',
                            description: 'ISO 4217 currency code',
                            example: 'EUR',
                        },
                        custom_fields: {
                            type: 'object',
                            additionalProperties: true,
                            description: 'Custom fields (JSON)',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Customer tags',
                        },
                        notes: {
                            type: 'string',
                            nullable: true,
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Contact: {
                    type: 'object',
                    required: ['customer_id', 'first_name', 'last_name'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        tenant_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        customer_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        first_name: {
                            type: 'string',
                            example: 'Max',
                        },
                        last_name: {
                            type: 'string',
                            example: 'Mustermann',
                        },
                        title: {
                            type: 'string',
                            nullable: true,
                            example: 'IT Manager',
                        },
                        department: {
                            type: 'string',
                            nullable: true,
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            nullable: true,
                        },
                        phone_office: {
                            type: 'string',
                            nullable: true,
                        },
                        phone_mobile: {
                            type: 'string',
                            nullable: true,
                        },
                        phone_direct: {
                            type: 'string',
                            nullable: true,
                        },
                        is_primary: {
                            type: 'boolean',
                            default: false,
                        },
                        is_billing: {
                            type: 'boolean',
                            default: false,
                        },
                        is_technical: {
                            type: 'boolean',
                            default: false,
                        },
                        custom_fields: {
                            type: 'object',
                            additionalProperties: true,
                        },
                        notes: {
                            type: 'string',
                            nullable: true,
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Location: {
                    type: 'object',
                    required: ['customer_id', 'location_name', 'location_type'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        tenant_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        customer_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        location_name: {
                            type: 'string',
                            example: 'Headquarters',
                        },
                        location_type: {
                            type: 'string',
                            enum: ['headquarters', 'branch', 'datacenter', 'remote'],
                        },
                        address_line1: {
                            type: 'string',
                            nullable: true,
                        },
                        address_line2: {
                            type: 'string',
                            nullable: true,
                        },
                        city: {
                            type: 'string',
                            nullable: true,
                        },
                        state: {
                            type: 'string',
                            nullable: true,
                        },
                        postal_code: {
                            type: 'string',
                            nullable: true,
                        },
                        country: {
                            type: 'string',
                            pattern: '^[A-Z]{3}$',
                            nullable: true,
                        },
                        phone: {
                            type: 'string',
                            nullable: true,
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            nullable: true,
                        },
                        is_primary: {
                            type: 'boolean',
                            default: false,
                        },
                        is_billing: {
                            type: 'boolean',
                            default: false,
                        },
                        is_shipping: {
                            type: 'boolean',
                            default: false,
                        },
                        custom_fields: {
                            type: 'object',
                            additionalProperties: true,
                        },
                        notes: {
                            type: 'string',
                            nullable: true,
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            oneOf: [
                                {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR',
                                },
                                {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                        },
                                        statusCode: {
                                            type: 'integer',
                                        },
                                    },
                                },
                            ],
                        },
                        message: {
                            type: 'string',
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                            },
                        },
                    },
                },
                PaginationResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                            },
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: {
                                    type: 'integer',
                                    example: 1,
                                },
                                limit: {
                                    type: 'integer',
                                    example: 50,
                                },
                                total: {
                                    type: 'integer',
                                    example: 100,
                                },
                                pages: {
                                    type: 'integer',
                                    example: 2,
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to API routes
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map