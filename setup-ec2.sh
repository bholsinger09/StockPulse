#!/bin/bash

# Initial EC2 Setup Script
# Run this once after creating your EC2 instance

set -e

EC2_IP="3.88.227.220"
EC2_USER="ubuntu"
KEY_PATH="$HOME/.ssh/ED25519.pem"

echo "🔧 Setting up EC2 instance for StockPulse..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ Error: SSH key not found at $KEY_PATH"
    exit 1
fi

# SSH into EC2 and run setup commands
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'ENDSSH'

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📥 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
sudo apt-get install -y build-essential

# Install PM2 globally
echo "📥 Installing PM2 process manager..."
sudo npm install -g pm2

# Install nginx (optional, for reverse proxy)
echo "📥 Installing nginx..."
sudo apt-get install -y nginx

# Configure firewall (if UFW is enabled)
if command -v ufw &> /dev/null; then
    echo "🔒 Configuring firewall..."
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow 3001
    sudo ufw allow 5173
fi

# Create app directory
mkdir -p /home/ubuntu/stockpulse

echo "✅ EC2 setup complete!"
echo ""
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ EC2 instance ready for deployment!"
echo ""
echo "Next steps:"
echo "  1. Run: chmod +x deploy.sh"
echo "  2. Run: ./deploy.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
