// PM2 Ecosystem Configuration for StockPulse
// This file configures how PM2 manages the application processes

module.exports = {
  apps: [
    {
      name: 'stockpulse-backend',
      script: './backend/src/server.js',
      cwd: '/home/ubuntu/stockpulse',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'stockpulse-frontend',
      script: 'serve',
      args: '-s dist -l 5173 -n',
      cwd: '/home/ubuntu/stockpulse/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
