/**
 * Service registry configuration
 * Maps service names to their URLs and configurations
 */

import { ServiceRegistry } from '../types';

/**
 * Service registry with all microservices
 */
export const serviceRegistry: ServiceRegistry = {
  auth: {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    healthCheck: '/health',
    timeout: 5000,
    retries: 3,
  },
  crm: {
    name: 'crm-service',
    url: process.env.CRM_SERVICE_URL || 'http://localhost:3002',
    healthCheck: '/health',
    timeout: 5000,
    retries: 3,
  },
  tickets: {
    name: 'tickets-service',
    url: process.env.TICKETS_SERVICE_URL || 'http://localhost:3003',
    healthCheck: '/health',
    timeout: 15000,  // Longer timeout for complex queries
    retries: 3,
  },
  billing: {
    name: 'billing-service',
    url: process.env.BILLING_SERVICE_URL || 'http://localhost:3004',
    healthCheck: '/health',
    timeout: 30000,  // Even longer for report generation
    retries: 2,
  },
  projects: {
    name: 'projects-service',
    url: process.env.PROJECTS_SERVICE_URL || 'http://localhost:3005',
    healthCheck: '/health',
    timeout: 10000,
    retries: 3,
  },
  assets: {
    name: 'assets-service',
    url: process.env.ASSETS_SERVICE_URL || 'http://localhost:3006',
    healthCheck: '/health',
    timeout: 10000,
    retries: 3,
  },
  reports: {
    name: 'reports-service',
    url: process.env.REPORTS_SERVICE_URL || 'http://localhost:3007',
    healthCheck: '/health',
    timeout: 60000,  // Very long for complex reports
    retries: 2,
  },
};

/**
 * Get service configuration by name
 */
export function getService(name: string) {
  return serviceRegistry[name];
}

/**
 * Get all service names
 */
export function getAllServiceNames(): string[] {
  return Object.keys(serviceRegistry);
}
