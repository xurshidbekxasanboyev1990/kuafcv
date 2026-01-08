# PRODUCTION DEPLOYMENT GUIDE

**KUAFCV Portfolio System - sysmasters.uz**

## 🚀 PRODUCTION DEPLOYMENT TO SYSMASTERS.UZ

### Prerequisites Checklist

- ✅ Domain: `sysmasters.uz` configured and pointing to server
- ✅ SSL Certificate installed (HTTPS)
- ✅ Node.js 18+ installed on server
- ✅ PostgreSQL database configured
- ✅ Go 1.21+ for backend
- ✅ Nginx or similar reverse proxy

---

## 📋 STEP 1: ENVIRONMENT CONFIGURATION

### Frontend Environment Variables

Create `/frontend/.env.production`:

```env
# API Configuration for sysmasters.uz
NEXT_PUBLIC_API_URL=https://sysmasters.uz
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz

# Environment
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_FILE_ANALYSIS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Application Metadata
NEXT_PUBLIC_APP_NAME=KUAFCV Portfolio System
NEXT_PUBLIC_APP_VERSION=1.0.0

```

### Backend Environment Variables

Create `/backend-go/.env.production`:

```env
# Server Configuration
PORT=4000
GIN_MODE=release

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=kuafcv_prod
DB_PASSWORD=<STRONG_PASSWORD_HERE>
DB_NAME=kuafcv_production
DB_SSLMODE=require

# JWT Configuration
JWT_SECRET=<GENERATE_STRONG_SECRET_HERE>
JWT_EXPIRATION=24h

# CORS
CORS_ORIGINS=https://sysmasters.uz
CORS_CREDENTIALS=true

# File Upload
MAX_UPLOAD_SIZE=52428800
UPLOAD_PATH=/var/www/kuafcv/uploads

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<EMAIL>
SMTP_PASSWORD=<APP_PASSWORD>
SMTP_FROM=noreply@sysmasters.uz
```

---

## 📦 STEP 2: BUILD PROCESS

### Frontend Build

```powershell
# Navigate to frontend directory
cd C:\Users\user\Desktop\kuafcv\frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally

npm run start
```

**Expected Output:**

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Finalizing page optimization

Route (pages)                                Size     First Load JS
┌ ○ /                                        X kB          XX kB
├ ○ /login                                   X kB          XX kB
├ ● /portfolio                               X kB          XX kB
└ ...
```

### Backend Build

```powershell
# Navigate to backend directory
cd C:\Users\user\Desktop\kuafcv\backend-go

# Build Go binary
go build -ldflags="-s -w" -o kuafcv-backend.exe

# Or with optimization
$env:CGO_ENABLED=0
go build -ldflags="-s -w -X main.Version=1.0.0" -o kuafcv-backend.exe
```

---

## 🌐 STEP 3: NGINX CONFIGURATION

Create `/etc/nginx/sites-available/sysmasters.uz`:

```nginx
# Upstream backends
upstream frontend_upstream {
    server localhost:3000;
    keepalive 64;
}

upstream backend_upstream {
    server localhost:4000;
    keepalive 64;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name sysmasters.uz www.sysmasters.uz;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sysmasters.uz www.sysmasters.uz;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sysmasters.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sysmasters.uz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/sysmasters.uz.access.log;
    error_log /var/log/nginx/sysmasters.uz.error.log;

    # Client Max Body Size (for file uploads)
    client_max_body_size 50M;

    # Backend API
    location /api {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Uploads
    location /uploads {
        alias /var/www/kuafcv/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Security: Prevent script execution
        location ~ \.(php|jsp|asp|aspx|cgi|sh|py|pl)$ {
            deny all;
        }
    }

    # Frontend Next.js
    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Next.js specific
        proxy_buffering off;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://frontend_upstream;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;

    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/sysmasters.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 STEP 4: SSL CERTIFICATE (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d sysmasters.uz -d www.sysmasters.uz

# Auto-renewal (should be automatic, verify with)
sudo certbot renew --dry-run
```

---

## 🗄️ STEP 5: DATABASE SETUP

```sql
-- Create production database
CREATE DATABASE kuafcv_production;

-- Create user
CREATE USER kuafcv_prod WITH ENCRYPTED PASSWORD '<STRONG_PASSWORD>';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kuafcv_production TO kuafcv_prod;

-- Connect to database
\c kuafcv_production

-- Run migrations
-- (Copy SQL from database/migrations/)
```

---

## 🚀 STEP 6: PROCESS MANAGEMENT (PM2)

### Install PM2

```bash
npm install -g pm2
```

### Create PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'kuafcv-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'kuafcv-backend',
      script: './backend-go/kuafcv-backend.exe',
      cwd: './backend-go',
      instances: 1,
      exec_mode: 'fork',
      env: {
        GIN_MODE: 'release',
        PORT: 4000,
      },
      error_file: './logs/backend-error.log',

      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Start Applications

```bash
# Create logs directory
mkdir -p logs

# Start all applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status

pm2 status
pm2 logs
```

---

## 📊 STEP 7: MONITORING & LOGGING

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Check logs
pm2 logs kuafcv-frontend --lines 100

pm2 logs kuafcv-backend --lines 100

# Restart applications
pm2 restart all

# Reload (zero-downtime)
pm2 reload all
```

### Log Rotation

Create `/etc/logrotate.d/kuafcv`:

```
/var/www/kuafcv/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts

    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## ✅ STEP 8: VERIFICATION CHECKLIST

### Pre-Launch Checks

- [ ] HTTPS working (`https://sysmasters.uz`)

- [ ] API endpoints responding (`https://sysmasters.uz/api/health`)
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Database connected
- [ ] All environment variables set
- [ ] PM2 processes running
- [ ] Nginx configuration valid
- [ ] SSL certificate valid
- [ ] Logs directory writable
- [ ] Upload directory writable (`/var/www/kuafcv/uploads`)

### Performance Checks

```bash
# Run Lighthouse audit
npx lighthouse https://sysmasters.uz --view

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://sysmasters.uz

# Load testing (optional)
npm install -g artillery
artillery quick --count 10 -n 20 https://sysmasters.uz
```

### Security Checks

```bash
# SSL Test

curl -I https://sysmasters.uz

# Security Headers
curl -I https://sysmasters.uz | grep -i "security\|x-frame\|x-content"

# SQL Injection test (basic)
# (Use professional tools like OWASP ZAP)
```

---

## 🔄 STEP 9: CONTINUOUS DEPLOYMENT

### Update Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying KUAFCV to Production..."

# Pull latest code
git pull origin master

# Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
pm2 reload kuafcv-frontend


# Backend
echo "🔨 Building Backend..."
cd ../backend-go
go build -ldflags="-s -w" -o kuafcv-backend.exe
pm2 reload kuafcv-backend

# Database migrations (if any)
# psql -U kuafcv_prod -d kuafcv_production -f database/migrations/new_migration.sql

echo "✅ Deployment Complete!"

pm2 status
```

Make executable:

```bash
chmod +x deploy.sh
```

---

## 📞 STEP 10: SUPPORT & MAINTENANCE

### Common Issues

**1. Application won't start**

```bash
# Check PM2 logs
pm2 logs --err

# Check Nginx logs

sudo tail -f /var/log/nginx/error.log

# Check application logs
tail -f logs/backend-error.log
tail -f logs/frontend-error.log
```

**2. Database connection failed**

```bash
# Test database connection
psql -U kuafcv_prod -d kuafcv_production -h localhost

# Check environment variables
pm2 env kuafcv-backend
```

**3. File uploads not working**

```bash
# Check permissions
ls -la /var/www/kuafcv/uploads
sudo chown -R www-data:www-data /var/www/kuafcv/uploads
sudo chmod -R 755 /var/www/kuafcv/uploads
```

**4. High memory usage**

```bash
# Check PM2 memory
pm2 list

# Restart applications
pm2 reload all

```

### Backup Strategy

```bash
# Database backup (daily cron job)

0 2 * * * pg_dump -U kuafcv_prod kuafcv_production | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Uploads backup (weekly)
0 3 * * 0 tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/kuafcv/uploads

# Rotate backups (keep 30 days)
find /backups -name "*.gz" -mtime +30 -delete
```

---

## 🎯 SUCCESS METRICS

### Performance Targets

- **Page Load Time:** < 2 seconds
- **API Response Time:** < 200ms

- **Time to Interactive:** < 3 seconds
- **Lighthouse Score:** > 90

### Uptime Targets

- **Availability:** 99.9%
- **Database:** 99.95%
- **API:** 99.9%

---

## 📚 POST-DEPLOYMENT

### Monitor These Metrics

1. Server CPU/Memory usage
2. Database query performance
3. API response times
4. Error rates
5. User sessions
6. File storage usage

### Regular Maintenance

- **Daily:** Check logs for errors
- **Weekly:** Review performance metrics
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

---

**Deployment Date:** January 8, 2026  
**Version:** 1.0.0  
**Domain:** sysmasters.uz  
**Status:** Production Ready ✅
