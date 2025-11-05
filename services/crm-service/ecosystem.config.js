/**
 * PM2 Ecosystem Configuration
 *
 * Configuration for deploying CRM service with PM2 process manager
 */

module.exports = {
  apps: [
    {
      name: 'psa-crm-service',
      script: './dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3020,
      },
      error_file: '/opt/psa-platform/logs/crm-service-error.log',
      out_file: '/opt/psa-platform/logs/crm-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
