#!/bin/bash

# StockPulse Deployment Script
# Deploy to AWS EC2 instance

set -e

# Configuration
EC2_IP="3.88.227.220"
EC2_USER="ubuntu"
KEY_PATH="$HOME/.ssh/ED25519.pem"
APP_DIR="/home/ubuntu/stockpulse"

echo "🚀 Deploying StockPulse to AWS EC2..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ Error: SSH key not found at $KEY_PATH"
    echo "Please create your SSH key pair first:"
    echo "  ssh-keygen -t ed25519 -C 'stockpulse-aws-deployment' -f ~/.ssh/stockpulse-aws"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir -p deploy-temp
rsync -av --exclude 'node_modules' \
          --exclude '.git' \
          --exclude 'deploy-temp' \
          --exclude 'dist' \
          --exclude '.DS_Store' \
          . deploy-temp/

# Transfer files to EC2
echo "📤 Transferring files to EC2..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" "mkdir -p $APP_DIR"
rsync -avz --delete \
      -e "ssh -i $KEY_PATH" \
      deploy-temp/ \
      "$EC2_USER@$EC2_IP:$APP_DIR/"

# Execute remote setup and start script
echo "⚙️  Setting up application on EC2..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd /home/ubuntu/stockpulse

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
fi

# Start/Restart with PM2
echo "🚀 Starting application with PM2..."
cd /home/ubuntu/stockpulse

# Stop existing processes
pm2 delete stockpulse-backend 2>/dev/null || true
pm2 delete stockpulse-frontend 2>/dev/null || true

# Start backend
cd backend
pm2 start src/server.js --name stockpulse-backend

# Start frontend (using serve)
cd ../frontend
npm install -g serve
pm2 start "serve -s dist -l 5173" --name stockpulse-frontend

# Save PM2 process list
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo "✅ Deployment complete!"
pm2 list

ENDSSH

# Cleanup
rm -rf deploy-temp

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment successful!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$EC2_IP:5173"
echo "   Backend:  http://$EC2_IP:3001"
echo "   WebSocket: ws://$EC2_IP:3001/ws"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'pm2 logs'"
echo "   Check status: ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'pm2 status'"
echo "   Restart:      ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'pm2 restart all'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
