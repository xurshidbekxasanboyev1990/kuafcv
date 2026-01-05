# ⚡ Quick Deploy Guide - sysmasters.uz

Tezkor deployment qo'llanmasi - faqat zarur qadamlar.

## 📋 Pre-requisites

- ✅ Server: Ubuntu 20.04+ / Debian 11+ yoki CentOS 8+
- ✅ Docker & Docker Compose installed
- ✅ Domain: sysmasters.uz DNS configured (A record → server IP)
- ✅ Ports open: 80, 443, 22

---

## 🚀 5-Step Deployment

### Step 1: Generate Secrets (2 minutes)

```powershell
# JWT Secret
$bytes = New-Object byte[] 64
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$jwtSecret = [Convert]::ToBase64String($bytes)
Write-Host "JWT_SECRET=$jwtSecret"

# Database Password
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$dbPassword = [Convert]::ToBase64String($bytes)
Write-Host "DB_PASSWORD=$dbPassword"

# Redis Password
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$redisPassword = [Convert]::ToBase64String($bytes)
Write-Host "REDIS_PASSWORD=$redisPassword"
```

**Ushbu secretlarni xavfsiz joyda saqlang!**

---

### Step 2: Update Environment Files (3 minutes)

**`backend/.env.production`:**
```env
PORT=4000
ENVIRONMENT=production
DATABASE_URL=postgres://kuafcv_user:<DB_PASSWORD>@postgres:5432/kuafcv?sslmode=require
REDIS_URL=redis://redis:6379/0
REDIS_PASSWORD=<REDIS_PASSWORD>
JWT_SECRET=<JWT_SECRET>
OPENAI_API_KEY=sk-your-real-key
ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz
MAX_FILE_SIZE=20971520
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
LOG_FORMAT=json
LOG_LEVEL=info
```

**`frontend/.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://sysmasters.uz/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz/ws
NEXT_PUBLIC_APP_URL=https://sysmasters.uz
```

**`docker-compose.prod.yml`:** (postgres environment)
```yaml
postgres:
  environment:
    POSTGRES_DB: kuafcv
    POSTGRES_USER: kuafcv_user
    POSTGRES_PASSWORD: <DB_PASSWORD>  # Same as above
```

---

### Step 3: SSL Certificate (5 minutes)

**Serverda (Ubuntu/Debian):**
```bash
# Install certbot
sudo apt update
sudo apt install certbot -y

# Generate certificate
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email admin@sysmasters.uz \
  --agree-tos \
  --non-interactive

# Copy to project
cd /opt/kuafcv
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem
sudo chown $(whoami):$(whoami) nginx/ssl/*
```

**Auto-renewal cron:**
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker-compose -f /opt/kuafcv/docker-compose.prod.yml restart nginx'") | crontab -
```

---

### Step 4: Deploy (3 minutes)

```bash
# Clone repository (if not already)
cd /opt
git clone <your-repo-url> kuafcv
cd kuafcv

# OR update existing:
cd /opt/kuafcv
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

---

### Step 5: Verify (2 minutes)

```bash
# Health checks
curl https://sysmasters.uz/api/health
# Expected: {"status":"ok","time":1704412800}

curl https://sysmasters.uz/api/ready
# Expected: {"status":"ready","database":"ok","redis":"ok","time":1704412800}

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
# Should see: "Server running on port 4000"

# Test frontend
curl -I https://sysmasters.uz
# Expected: HTTP/2 200
```

---

## 🔍 Troubleshooting

### SSL Certificate Failed?

```bash
# Check DNS
nslookup sysmasters.uz
# Should return your server IP

# Check ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Retry with verbose
sudo certbot certonly --standalone -d sysmasters.uz --dry-run
```

### Backend Not Starting?

```bash
# Check logs
docker logs kuafcv-backend

# Common issues:
# - Database connection: Check DATABASE_URL in .env.production
# - Redis connection: Check REDIS_PASSWORD
# - JWT_SECRET missing: Check .env.production

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Frontend 502 Error?

```bash
# Check backend is running
curl http://localhost:4000/api/health

# Check nginx config
docker exec kuafcv-nginx nginx -t

# Check nginx logs
docker logs kuafcv-nginx

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Database Connection Error?

```bash
# Check postgres container
docker logs kuafcv-postgres

# Test connection
docker exec kuafcv-postgres psql -U kuafcv_user -d kuafcv -c "SELECT 1"

# Check password in docker-compose.prod.yml and .env.production match
```

---

## 📊 Post-Deployment

### Setup Database Backups:

```bash
# Make script executable
chmod +x /opt/kuafcv/scripts/backup_database.sh

# Test backup
/opt/kuafcv/scripts/backup_database.sh

# Add to cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/kuafcv/scripts/backup_database.sh") | crontab -
```

### Setup Monitoring:

```bash
# Check disk space
df -h

# Monitor containers
watch docker stats

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Firewall (if not configured):

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔄 Updates

```bash
cd /opt/kuafcv

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d --build

# Check health
curl https://sysmasters.uz/api/health
```

---

## 📞 Support

- Deployment issues: Check logs first
- Database issues: `docker logs kuafcv-postgres`
- Backend issues: `docker logs kuafcv-backend`
- Frontend issues: `docker logs kuafcv-frontend`
- Nginx issues: `docker logs kuafcv-nginx`

---

**Total deployment time: ~15 minutes** ⚡

**Production URL: https://sysmasters.uz** 🎉
