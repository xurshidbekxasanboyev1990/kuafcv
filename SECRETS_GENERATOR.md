# 🔐 Production Secrets Generator

Production deployment uchun zarur bo'lgan barcha secretlarni yaratish.

## 🎲 Secret Generation Commands

### 1. JWT Secret (64 characters)

**Linux/macOS:**
```bash
openssl rand -base64 64 | tr -d '\n'
```

**Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 64
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Output misoli:**
```
vK8x9Zm3Qp2Lm5Nj7Rw1Yv4Xt6Bc8Df0Gh2Jk4Ml6Pq8Rs0Uv2Xy4Za6Cd8Fg0Ij2Lm4Oq6St8Vx0
```

### 2. Database Password (32 characters)

**Linux/macOS:**
```bash
openssl rand -base64 32 | tr -d '\n'
```

**Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Output misoli:**
```
Xm3Pk9Lq2Nv5Bw8Yt1Zc4Df7Gh0Jk3
```

### 3. Redis Password (32 characters)

**Yuqoridagi database password generatori bilan bir xil.**

---

## 📝 Environment Files Update

### Backend `.env.production`

1. JWT_SECRET generatsiya qiling:
```powershell
$bytes = New-Object byte[] 64; [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

2. Database password generatsiya qiling:
```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

3. Redis password generatsiya qiling:
```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

4. `backend/.env.production` faylini yangilang:
```env
JWT_SECRET=<generated-jwt-secret>
DATABASE_URL=postgres://kuafcv_user:<db-password>@postgres:5432/kuafcv?sslmode=require
REDIS_PASSWORD=<redis-password>
OPENAI_API_KEY=sk-your-real-openai-key
ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz
```

### Frontend `.env.production`

```env
NEXT_PUBLIC_API_URL=https://sysmasters.uz/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz/ws
NEXT_PUBLIC_APP_URL=https://sysmasters.uz
```

---

## 🔒 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended)

**Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

**Generate Certificate:**
```bash
# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Generate certificate
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email admin@sysmasters.uz \
  --agree-tos

# Copy to project
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml start nginx
```

**Auto-renewal (Cron job):**
```bash
# Add to crontab (runs daily at 3 AM)
0 3 * * * certbot renew --quiet --deploy-hook "docker-compose -f /opt/kuafcv/docker-compose.prod.yml restart nginx"
```

### Option 2: Self-Signed (Development only)

```bash
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=SysMasters/CN=sysmasters.uz"
```

---

## 🗄️ Database Setup

### Create Production Database:

```bash
# Enter PostgreSQL container
docker exec -it kuafcv-postgres psql -U postgres

# Or directly:
docker exec -it kuafcv-postgres psql -U postgres -c "
CREATE DATABASE kuafcv;
CREATE USER kuafcv_user WITH ENCRYPTED PASSWORD '<your-generated-password>';
GRANT ALL PRIVILEGES ON DATABASE kuafcv TO kuafcv_user;
ALTER DATABASE kuafcv OWNER TO kuafcv_user;
"
```

### Update docker-compose.prod.yml:

```yaml
postgres:
  environment:
    POSTGRES_DB: kuafcv
    POSTGRES_USER: kuafcv_user
    POSTGRES_PASSWORD: <your-generated-password>
```

---

## ✅ Security Checklist

- [ ] JWT_SECRET - 64+ random characters
- [ ] Database password - 32+ random characters
- [ ] Redis password - 32+ random characters
- [ ] OPENAI_API_KEY - production key from OpenAI
- [ ] SSL certificates - valid for sysmasters.uz
- [ ] ALLOWED_ORIGINS - only sysmasters.uz domains
- [ ] Database user - limited privileges
- [ ] .env files - NOT committed to git
- [ ] Secrets - stored securely (not in plain text)

---

## 🔄 Rotating Secrets

### JWT Secret rotation:

1. Generate new secret
2. Update `backend/.env.production`
3. Restart backend: `docker-compose -f docker-compose.prod.yml restart backend`
4. All users will need to re-login

### Database password rotation:

1. Generate new password
2. Update PostgreSQL: `ALTER USER kuafcv_user WITH PASSWORD 'new-password';`
3. Update `.env.production` and `docker-compose.prod.yml`
4. Restart backend: `docker-compose -f docker-compose.prod.yml restart backend`

---

## 📞 Emergency Secret Leak Response

1. **Immediately rotate all secrets**
2. **Check access logs for unauthorized access**
3. **Notify users if data was compromised**
4. **Update all environment files**
5. **Restart all services**
6. **Review security measures**

---

**Security matters! 🔒**
