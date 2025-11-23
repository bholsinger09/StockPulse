#!/bin/bash

# SSL Setup Script for StockPulse
# This script installs and configures SSL certificates using Let's Encrypt

set -e

echo "🔒 Setting up HTTPS for StockPulse..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install Certbot and Nginx plugin
echo "📦 Installing Certbot for Let's Encrypt..."
sudo apt install -y certbot python3-certbot-nginx

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo apt install -y nginx
fi

# Create nginx configuration for StockPulse with SSL
echo "📝 Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/stockpulse << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name stockpulse.duckdns.org;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy to frontend for now (certbot will modify this)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Metrics endpoint
    location /metrics {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Enable the site
echo "🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/stockpulse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Start nginx
echo "🔄 Starting nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx || sudo systemctl reload nginx

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate from Let's Encrypt..."
echo "Note: This requires your domain to point to this server's IP address"
echo ""
sudo certbot --nginx -d stockpulse.duckdns.org --non-interactive --agree-tos --register-unsafely-without-email --redirect

# Set up auto-renewal
echo "⏰ Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SSL Setup Complete!"
echo ""
echo "🌐 Your site is now available at:"
echo "   https://stockpulse.duckdns.org"
echo ""
echo "📝 Certificate info:"
sudo certbot certificates
echo ""
echo "🔄 Auto-renewal is enabled. Certificates will auto-renew before expiry."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
