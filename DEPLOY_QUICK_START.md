# 🚀 KUAFCV - Quick Start Deployment Guide

## Production deployment to sysmasters.uz with Docker + Nginx

---

## 📋 Prerequisites

### Required Software

- ✅ Docker (v20.10+)
- ✅ Docker Compose (v2.0+)
- ✅ Git
- ✅ Domain: sysmasters.uz with DNS pointed to server

### System Requirements

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum (4 cores recommended)
- **Disk**: 20GB free space minimum

---

## 🎯 Deployment Steps

### 1️⃣ Clone Repository

```bash
cd /opt
git clone https://github.com/xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv
```

### 2️⃣ Configure Environment

#### Backend Environment (`backend/.env.production`)

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=kuafcv_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DB_NAME=kuafcv_db
DB_SSLMODE=disable

# JWT
JWT_SECRET=CHANGE_THIS_SUPER_SECRET_KEY_MIN_32_CHARS
JWT_EXPIRY=24h

# Server
PORT=4000
GO_ENV=production

# CORS
CORS_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz
```

#### Frontend Environment (`frontend/.env.production`)

```bash
NEXT_PUBLIC_API_URL=https://sysmasters.uz
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz
NODE_ENV=production
```

### 3️⃣ SSL Certificates

#### Option A: Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot

# Stop Nginx if running
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email your@email.com \
  --agree-tos

# Copy certificates
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/*.pem
```

#### Option B: Self-Signed (Development)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=sysmasters.uz"
```

### 4️⃣ Deploy

#### Using Deployment Script (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

#### Manual Deployment

```bash
# Stop old containers
docker-compose down

# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5️⃣ Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Test backend health
curl https://sysmasters.uz/api/health

# Test frontend
curl https://sysmasters.uz

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f nginx
```

---

## 🔧 Configuration Files

### Docker Compose (`docker-compose.yml`)

Services:

- ✅ PostgreSQL database
- ✅ Go backend API
- ✅ Next.js frontend
- ✅ Nginx reverse proxy
- ✅ Redis (optional cache)

### Nginx (`nginx/nginx.conf`)

Features:

- ✅ HTTPS with SSL/TLS
- ✅ HTTP to HTTPS redirect
- ✅ Reverse proxy to backend/frontend
- ✅ WebSocket support
- ✅ Static file caching
- ✅ Security headers
- ✅ Gzip compression

---

## 📊 Service URLs

After successful deployment:

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | <https://sysmasters.uz> | 443 |
| **Backend API** | <https://sysmasters.uz/api> | 443 |
| **WebSocket** | wss://sysmasters.uz/ws | 443 |
| **Database** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |

---

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop/Start

```bash
# Stop all
docker-compose down

# Start all
docker-compose up -d

# Rebuild and start
docker-compose up --build -d
```

### Database Access

```bash
# Connect to database
docker-compose exec postgres psql -U kuafcv_user -d kuafcv_db

# Backup database
docker-compose exec postgres pg_dump -U kuafcv_user kuafcv_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U kuafcv_user kuafcv_db < backup.sql
```

---

## 🔄 Update Deployment

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Or use deployment script
./deploy.sh
```

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Restart container
docker-compose restart [service-name]
```

### Database connection errors

```bash
# Check database is running
docker-compose exec postgres pg_isready -U kuafcv_user

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Frontend build errors

```bash
# Rebuild frontend
docker-compose build --no-cache frontend

# Check frontend logs
docker-compose logs frontend
```

### SSL/Certificate issues

```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# Renew Let's Encrypt certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/sysmasters.uz/*.pem nginx/ssl/

# Restart Nginx
docker-compose restart nginx
```

---

## 📈 Monitoring

### Health Checks

```bash
# Backend health
curl https://sysmasters.uz/api/health

# Frontend health
curl -I https://sysmasters.uz

# Database health
docker-compose exec postgres pg_isready
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean unused resources
docker system prune -a
```

---

## 🔒 Security Checklist

- [x] HTTPS enabled with SSL/TLS
- [x] Strong database password
- [x] Strong JWT secret
- [x] Environment variables secured
- [x] CORS properly configured
- [x] Security headers enabled
- [x] File upload limits set
- [x] Rate limiting configured

---

## 📞 Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Check container status: `docker-compose ps`
3. Review documentation: `PRODUCTION_DEPLOYMENT_SYSMASTERS.md`
4. Contact system administrator

---

## ✅ Production Ready Checklist

Before going live:

- [ ] Domain DNS pointed to server
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] Database password changed
- [ ] JWT secret changed
- [ ] CORS origins updated
- [ ] Firewall configured (ports 80, 443)
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Tested all features

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-08  
**System**: KUAFCV Portfolio Management  
**Domain**: sysmasters.uz
