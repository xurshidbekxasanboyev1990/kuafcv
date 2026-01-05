# 🚀 KUAFCV Production Deployment Guide

Serverga deploy qilish uchun to'liq qo'llanma.

## 📋 Pre-Deployment Checklist

### 1️⃣ Environment Files

✅ **Backend** (`backend/.env.production`):
```bash
# MUST CHANGE BEFORE DEPLOYMENT:
- JWT_SECRET (openssl rand -base64 32)
- OPENAI_API_KEY
- DATABASE_URL (production credentials)
- REDIS_PASSWORD
- ALLOWED_ORIGINS (your production domain)
```

✅ **Frontend** (`frontend/.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2️⃣ SSL Certificates

**Production:**
```bash
# Let's Encrypt bilan
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

**Development (self-signed):**
```bash
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=localhost"
```

### 3️⃣ Nginx Configuration

`nginx/nginx.conf` da domainni o'zgartiring:
```nginx
server_name your-domain.com www.your-domain.com;
```

### 4️⃣ Database Setup

```bash
# PostgreSQL user va database yaratish
psql -U postgres
CREATE DATABASE kuafcv;
CREATE USER kuafcv_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE kuafcv TO kuafcv_user;
\q
```

---

## 🐳 Docker Deployment

### Production Stack ishga tushirish:

```bash
# 1. Images build qilish
docker-compose -f docker-compose.prod.yml build

# 2. Stack ishga tushirish
docker-compose -f docker-compose.prod.yml up -d

# 3. Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f

# 4. Health check
curl http://localhost/api/health
curl http://localhost/api/ready
```

### Health Checks:

- **Backend**: `http://localhost:4000/api/health`
- **Frontend**: `http://localhost:3000`
- **Nginx**: `http://localhost/health`
- **Readiness**: `http://localhost/api/ready` (database + redis check)

---

## 📊 Monitoring & Logging

### Logs ko'rish:

```bash
# Barcha servislar
docker-compose -f docker-compose.prod.yml logs -f

# Bitta servis
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx access logs
docker exec kuafcv-nginx tail -f /var/log/nginx/access.log

# Backend JSON logs (production)
docker-compose -f docker-compose.prod.yml logs -f backend | jq .
```

### Container status:

```bash
# Running containers
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Health status
docker inspect kuafcv-backend | jq '.[0].State.Health'
```

---

## 💾 Database Backups

### Automatic Backups:

```bash
# Linux - Cron job (har kuni 2:00)
0 2 * * * /path/to/kuafcv/scripts/backup_database.sh

# Windows - Task Scheduler
powershell.exe -File "C:\path\to\kuafcv\scripts\backup_database.ps1"
```

### Manual Backup:

```bash
# Linux/Docker
docker exec kuafcv-postgres pg_dump -U kuafcv_user kuafcv | gzip > backup.sql.gz

# Windows
.\scripts\backup_database.ps1
```

### Restore:

```bash
# Linux
gunzip -c backup.sql.gz | docker exec -i kuafcv-postgres psql -U kuafcv_user kuafcv

# Windows
Expand-Archive backup.sql.zip
docker exec -i kuafcv-postgres psql -U kuafcv_user kuafcv < backup.sql
```

---

## 🔐 Security Checklist

- ✅ JWT_SECRET - random 64+ char
- ✅ OPENAI_API_KEY - production key
- ✅ Database password - strong
- ✅ Redis password - strong
- ✅ SSL certificates - valid & not expired
- ✅ CORS - only production domains
- ✅ Rate limiting - enabled
- ✅ CSRF protection - enabled
- ✅ File upload limits - 20MB
- ✅ SQL injection protection - enabled
- ✅ XSS protection - enabled

---

## 🚨 Troubleshooting

### Frontend bo'lmasa:

```bash
# Container logs
docker logs kuafcv-frontend

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### Backend bo'lmasa:

```bash
# Logs
docker logs kuafcv-backend

# Database connection check
docker exec kuafcv-backend wget -O- http://localhost:4000/api/ready

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Database ulanmasa:

```bash
# PostgreSQL logs
docker logs kuafcv-postgres

# Connection test
docker exec kuafcv-postgres psql -U kuafcv_user -d kuafcv -c "SELECT 1"

# Restart
docker-compose -f docker-compose.prod.yml restart postgres
```

### Nginx 502/504:

```bash
# Nginx config test
docker exec kuafcv-nginx nginx -t

# Reload config
docker exec kuafcv-nginx nginx -s reload

# Check upstream
curl http://localhost:4000/api/health
curl http://localhost:3000
```

---

## 📈 Performance Tuning

### PostgreSQL:

```sql
-- Indexlar va query optimization
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
```

### Redis:

```bash
# Redis performance
docker exec kuafcv-redis redis-cli INFO stats
docker exec kuafcv-redis redis-cli SLOWLOG GET 10
```

### Nginx:

```nginx
# worker_processes ni CPU cores ga moslash
worker_processes auto;

# Gzip compression
gzip_comp_level 6;

# Cache static files
expires 1y;
```

---

## 🔄 Updates & Migrations

### Code Update:

```bash
# 1. Pull yangi kod
git pull origin main

# 2. Rebuild
docker-compose -f docker-compose.prod.yml build

# 3. Zero-downtime restart
docker-compose -f docker-compose.prod.yml up -d

# 4. Health check
curl http://localhost/api/health
```

### Database Migration:

```bash
# Backup olish
./scripts/backup_database.sh

# Migration run
docker exec kuafcv-backend /app/backend migrate

# Rollback (agar kerak bo'lsa)
docker exec -i kuafcv-postgres psql -U kuafcv_user kuafcv < backup.sql
```

---

## 📞 Support

Issues: https://github.com/your-repo/issues
Docs: https://docs.your-domain.com

---

**Deployment muvaffaqiyatli bo'lsin! 🎉**
