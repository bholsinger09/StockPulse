# AWS EC2 Deployment Guide for StockPulse

## Prerequisites

1. **EC2 Instance Running**: Ubuntu 22.04 LTS (t3.small or larger)
2. **Public IP**: 3.88.227.220
3. **SSH Key Pair**: `~/.ssh/stockpulse-aws`
4. **Security Group**: Ports 22, 80, 443, 3001, 5173 open

## Quick Deployment

### Step 1: Initial Setup (Run Once)

```bash
# Make scripts executable
chmod +x setup-ec2.sh deploy.sh

# Setup EC2 instance
./setup-ec2.sh
```

### Step 2: Deploy Application

```bash
# Deploy to EC2
./deploy.sh
```

## Access Your Application

- **Frontend**: http://3.88.227.220:5173
- **Backend API**: http://3.88.227.220:3001
- **WebSocket**: ws://3.88.227.220:3001/ws
- **Metrics**: http://3.88.227.220:3001/metrics
- **Health**: http://3.88.227.220:3001/health

## Manage Application

### SSH into EC2
```bash
ssh -i ~/.ssh/stockpulse-aws ubuntu@3.88.227.220
```

### View Application Status
```bash
pm2 status
```

### View Logs
```bash
# All logs
pm2 logs

# Backend only
pm2 logs stockpulse-backend

# Frontend only
pm2 logs stockpulse-frontend
```

### Restart Application
```bash
# Restart all
pm2 restart all

# Restart backend only
pm2 restart stockpulse-backend

# Restart frontend only
pm2 restart stockpulse-frontend
```

### Stop Application
```bash
pm2 stop all
```

## AWS Security Group Configuration

Ensure your EC2 security group has these inbound rules:

| Type | Protocol | Port Range | Source |
|------|----------|------------|--------|
| SSH | TCP | 22 | Your IP |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 |
| Custom TCP | TCP | 5173 | 0.0.0.0/0 |

## Optional: Setup Nginx Reverse Proxy

For production, it's recommended to use nginx:

```bash
# SSH into EC2
ssh -i ~/.ssh/stockpulse-aws ubuntu@3.88.227.220

# Copy nginx config
sudo cp /home/ubuntu/stockpulse/nginx.conf /etc/nginx/sites-available/stockpulse

# Enable site
sudo ln -s /etc/nginx/sites-available/stockpulse /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

Then access via:
- **Frontend**: http://3.88.227.220
- **Backend**: http://3.88.227.220/api
- **WebSocket**: ws://3.88.227.220/ws

## Optional: Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com
```

## Monitoring & Maintenance

### Check System Resources
```bash
# CPU and Memory
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

### View Application Metrics
```bash
curl http://localhost:3001/metrics
```

### Update Application
```bash
# On your local machine
./deploy.sh
```

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs --err

# Check if ports are in use
sudo netstat -tlnp | grep -E '3001|5173'
```

### Can't connect to WebSocket
- Check EC2 security group allows port 3001
- Verify backend is running: `pm2 status`
- Check backend logs: `pm2 logs stockpulse-backend`

### High memory usage
```bash
# Restart application
pm2 restart all

# Check memory
free -h
```

## Cost Optimization

- **t3.small** (2 GB RAM): ~$15/month - Good for demo
- **t3.micro** (1 GB RAM): ~$7.50/month - May work with optimizations
- Use AWS Free Tier for first 12 months (750 hours/month)

## Backup & Restore

### Backup
```bash
ssh -i ~/.ssh/stockpulse-aws ubuntu@3.88.227.220 'tar -czf ~/stockpulse-backup.tar.gz ~/stockpulse'
scp -i ~/.ssh/stockpulse-aws ubuntu@3.88.227.220:~/stockpulse-backup.tar.gz .
```

### Restore
```bash
scp -i ~/.ssh/stockpulse-aws stockpulse-backup.tar.gz ubuntu@3.88.227.220:~
ssh -i ~/.ssh/stockpulse-aws ubuntu@3.88.227.220 'tar -xzf ~/stockpulse-backup.tar.gz'
```

## Next Steps

1. Configure custom domain name
2. Setup SSL/HTTPS
3. Configure nginx reverse proxy
4. Setup monitoring with CloudWatch
5. Configure automated backups
6. Setup CI/CD with GitHub Actions
