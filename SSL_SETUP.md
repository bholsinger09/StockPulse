# HTTPS/SSL Setup for StockPulse

StockPulse is configured with HTTPS using Let's Encrypt SSL certificates.

## 🔒 SSL Configuration

### Certificate Details
- **Provider**: Let's Encrypt
- **Domain**: stockpulse.duckdns.org
- **Certificate Path**: `/etc/letsencrypt/live/stockpulse.duckdns.org/`
- **Auto-renewal**: Enabled (certificates renew automatically before expiry)

### URLs
- **HTTPS**: https://stockpulse.duckdns.org
- **HTTP**: Automatically redirects to HTTPS
- **WebSocket**: wss://stockpulse.duckdns.org/ws (secure WebSocket)

## 🛠️ Initial Setup

The SSL certificate was set up using:

```bash
./setup-ssl.sh
```

This script:
1. Installs Certbot and nginx
2. Configures nginx as a reverse proxy
3. Obtains SSL certificate from Let's Encrypt
4. Sets up automatic certificate renewal

## 🔄 Certificate Renewal

Certificates automatically renew via systemd timer:

```bash
# Check renewal timer status
sudo systemctl status certbot.timer

# Check certificate info
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew
```

## 📝 Nginx Configuration

The nginx configuration (`/etc/nginx/sites-available/stockpulse`) includes:

- **HTTP → HTTPS redirect** on port 80
- **HTTPS server** on port 443 with:
  - TLS 1.2 and 1.3
  - Strong cipher suites
  - Security headers (HSTS, X-Frame-Options, etc.)
- **Reverse proxy** to:
  - Frontend: `localhost:5173`
  - Backend API: `localhost:3001/api/`
  - WebSocket: `localhost:3001/ws`

### Restart Nginx

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload nginx
```

## 🔐 Security Features

- ✅ SSL/TLS encryption
- ✅ HTTP to HTTPS redirect
- ✅ Secure WebSocket (wss://)
- ✅ HSTS enabled
- ✅ Security headers
- ✅ Strong cipher suites

## 🌐 Accessing the Application

Once deployed, access StockPulse at:
- https://stockpulse.duckdns.org

All HTTP requests automatically redirect to HTTPS, and WebSockets use secure wss:// protocol.

## 🚨 Troubleshooting

### Certificate Issues
```bash
# View logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Test renewal
sudo certbot renew --dry-run
```

### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
```

### Port Issues
Ensure AWS Security Group allows:
- Port 80 (HTTP) - for Let's Encrypt verification and redirects
- Port 443 (HTTPS) - for secure connections

## 📦 Files
- `setup-ssl.sh` - SSL setup script
- `nginx-ssl.conf` - Nginx configuration template
- `/etc/nginx/sites-available/stockpulse` - Active nginx config
- `/etc/letsencrypt/live/stockpulse.duckdns.org/` - SSL certificates
