/**
 * PM2 Ecosystem Configuration for Auth Service
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart auth-service
 *   pm2 stop auth-service
 *   pm2 logs auth-service
 */

module.exports = {
  apps: [{
    name: 'auth-service',
    script: './dist/index.js',
    cwd: '/opt/psa-putzi/services/auth-service',
    instances: 1,
    exec_mode: 'fork',

    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Restart strategy
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s',

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },

    // Logging
    error_file: '/tmp/auth-service-error.log',
    out_file: '/tmp/auth-service.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Process management
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Cluster settings (if needed for scaling)
    // instances: 'max', // Uncomment for cluster mode
    // exec_mode: 'cluster', // Uncomment for cluster mode
  }]
};
