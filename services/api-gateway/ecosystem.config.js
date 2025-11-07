/**
 * PM2 Ecosystem Configuration for PSA Platform API Gateway
 *
 * This configuration defines how PM2 should manage the API Gateway process
 * in production. It includes settings for clustering, auto-restart, logging,
 * and monitoring.
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env development
 *   pm2 stop psa-api-gateway
 *   pm2 restart psa-api-gateway
 *   pm2 reload psa-api-gateway  # Zero-downtime reload
 *   pm2 logs psa-api-gateway
 */

module.exports = {
  apps: [
    {
      name: 'psa-api-gateway',
      script: './dist/index.js',

      // Instance configuration
      instances: 2, // Run 2 instances for load balancing (can be 'max' for all CPU cores)
      exec_mode: 'cluster', // Cluster mode for load balancing

      // Auto-restart configuration
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '500M', // Restart if memory exceeds 500MB

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        REDIS_PASSWORD: 'uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C',
        CRM_SERVICE_URL: 'http://localhost:3020',
        ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173,http://10.255.20.15:5173',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        REDIS_PASSWORD: 'uRUl9UDmXMnV0CkqWxvEW8z5Dp6rDV7C',
        CRM_SERVICE_URL: 'http://localhost:3020',
        ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173,http://10.255.20.15:5173',
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/access.log',
      log_file: './logs/combined.log',
      merge_logs: true, // Merge logs from all instances

      // Process management
      listen_timeout: 3000, // Wait 3 seconds for app to listen
      kill_timeout: 5000, // Wait 5 seconds before killing process
      wait_ready: false, // Don't wait for app to emit 'ready' event

      // Restart on file changes (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],

      // Advanced features
      min_uptime: '10s', // Consider app crashed if uptime < 10s
      max_restarts: 10, // Max 10 restarts within 1 minute
      restart_delay: 4000, // Wait 4s before restart

      // Source maps support
      source_map_support: true,

      // Graceful shutdown
      shutdown_with_message: false,

      // Monitoring
      instance_var: 'INSTANCE_ID',

      // Health check
      health_check_grace_period: 10000, // 10 seconds grace period on startup
    },
  ],

  // PM2 deploy configuration (optional, for automated deployment)
  deploy: {
    production: {
      user: 'root',
      host: '192.168.1.200', // Container 200 IP
      ref: 'origin/master',
      repo: 'git@github.com:your-org/psa-platform.git',
      path: '/opt/psa-platform/services/api-gateway',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
