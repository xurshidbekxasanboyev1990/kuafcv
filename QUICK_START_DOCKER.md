# 🚀 Quick Deployment - Docker va PostgreSQL mavjud

Docker va PostgreSQL allaqachon o'rnatilgan bo'lsa, deployment juda tez!

---

## ✅ Mavjud:
- Docker ✅
- PostgreSQL (Docker ichida) ✅
- aaPanel (Ubuntu VPS) ✅

---

## 🎯 Deployment Qadamlari (15 daqiqa)

### Step 1: Repository Clone (2 daqiqa)

```bash
# SSH orqali serverga kirish
ssh root@your-vps-ip

# Proyekt papkasi
cd /opt
git clone https://github.com/xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv

# Yoki agar clone qilingan bo'lsa:
cd /opt/kuafcv
git pull origin master
```

---

### Step 2: Secrets Generatsiya (3 daqiqa)

```bash
# JWT Secret (64 bytes)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET=$JWT_SECRET"

# Database Password (32 bytes)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo "DB_PASSWORD=$DB_PASSWORD"

# Redis Password (32 bytes)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

# Bu qiymatlarni nusxalab oling!
```

---

### Step 3: Backend Environment (2 daqiqa)

```bash
nano /opt/kuafcv/backend/.env.production
```

Faqat quyidagi qatorlarni o'zgartiring:

```env
JWT_SECRET=<yuqoridagi JWT_SECRET>
DATABASE_URL=postgres://kuafcv_user:<DB_PASSWORD>@postgres:5432/kuafcv?sslmode=require
REDIS_PASSWORD=<yuqoridagi REDIS_PASSWORD>
OPENAI_API_KEY=sk-your-real-api-key
```

Qolgan qiymatlar allaqachon sozlangan:
- `ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz` ✅
- `PORT=4000` ✅
- `LOG_FORMAT=json` ✅

**Saqlash:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

### Step 4: Docker Compose Environment (1 daqiqa)

```bash
nano /opt/kuafcv/docker-compose.prod.yml
```

Faqat PostgreSQL parolni o'zgartiring (47-48 qator):

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: <yuqoridagi DB_PASSWORD>  # Step 2 dan
```

**Step 3 va Step 4 da bir xil parol ishlatilishi kerak!**

---

### Step 5: SSL Certificate (3 daqiqa)

```bash
# Certbot o'rnatish (agar yo'q bo'lsa)
sudo apt update && sudo apt install certbot -y

# aaPanel Nginx to'xtatish (80 portni bo'shatish)
sudo systemctl stop nginx

# SSL olish
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email xurshidbekxasanboyev1990@gmail.com \
  --agree-tos

# Proyektga nusxalash
sudo mkdir -p /opt/kuafcv/nginx/ssl
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem /opt/kuafcv/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem /opt/kuafcv/nginx/ssl/key.pem
sudo chmod 644 /opt/kuafcv/nginx/ssl/cert.pem
sudo chmod 600 /opt/kuafcv/nginx/ssl/key.pem
```

---

### Step 6: Deploy! (4 daqiqa)

```bash
cd /opt/kuafcv

# Build (birinchi marta 5-10 daqiqa olishi mumkin)
docker-compose -f docker-compose.prod.yml build

# Ishga tushirish
docker-compose -f docker-compose.prod.yml up -d

# Status tekshirish
docker-compose -f docker-compose.prod.yml ps
```

Natija:

```
NAME                  STATUS
kuafcv-postgres       Up (healthy)
kuafcv-redis          Up (healthy)
kuafcv-backend        Up (healthy)
kuafcv-frontend       Up (healthy)
kuafcv-nginx          Up (healthy)
```

---

### Step 7: Verify (2 daqiqa)

```bash
# Health check (serverda)
curl http://localhost/api/health
# Expected: {"status":"ok","time":...}

curl http://localhost/api/ready
# Expected: {"status":"ready","database":"ok","redis":"ok",...}

# Logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Brauzerda:**
- https://sysmasters.uz/api/health
- https://sysmasters.uz

---

## 🔥 Firewall (Agar sozlanmagan bo'lsa)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 💾 Backup Setup (Ixtiyoriy, 2 daqiqa)

```bash
# Script executable qilish
chmod +x /opt/kuafcv/scripts/backup_database.sh

# Cron job (har kuni 2 AM)
crontab -e

# Qo'shing:
0 2 * * * /opt/kuafcv/scripts/backup_database.sh
```

---

## 🔄 SSL Auto-Renewal (Ixtiyoriy, 1 daqiqa)

```bash
crontab -e

# Qo'shing:
0 3 * * * certbot renew --quiet --deploy-hook "docker-compose -f /opt/kuafcv/docker-compose.prod.yml restart nginx"
```

---

## 🚨 Troubleshooting

### PostgreSQL allaqachon ishlab tursa:

Agar serverda PostgreSQL ishlayotgan bo'lsa va 5432 port band bo'lsa:

**Option 1:** Serverda ishlab turgan PostgreSQL'ni to'xtatish:
```bash
sudo systemctl stop postgresql
sudo systemctl disable postgresql
```

**Option 2:** docker-compose.prod.yml da portni o'zgartirish:
```yaml
postgres:
  ports:
    - "5433:5432"  # 5432 o'rniga 5433
```

Va `backend/.env.production` da:
```env
DATABASE_URL=postgres://kuafcv_user:password@postgres:5433/kuafcv?sslmode=require
```

### Port conflicts:

```bash
# Qaysi portlar band
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :5432

# aaPanel Nginx to'xtatish
sudo systemctl stop nginx
sudo systemctl disable nginx  # Avtomatik ishga tushmaydi
```

### Containers ishlamasa:

```bash
# Logs
docker-compose -f docker-compose.prod.yml logs

# Restart
docker-compose -f docker-compose.prod.yml restart

# To'liq qayta boshlash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoring

### Docker stats:
```bash
docker stats
```

### Logs:
```bash
# Real-time
docker-compose -f docker-compose.prod.yml logs -f

# Faqat backend
docker logs kuafcv-backend -f

# Oxirgi 100 qator
docker logs kuafcv-backend --tail 100
```

### Database:
```bash
# PostgreSQL ga kirish
docker exec -it kuafcv-postgres psql -U kuafcv_user -d kuafcv

# SQL buyruqlar
SELECT COUNT(*) FROM users;
\dt  -- Barcha tabletslar
\q   -- Chiqish
```

---

## 🔄 Updates

```bash
cd /opt/kuafcv

# Yangi kod
git pull origin master

# Rebuild va restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl https://sysmasters.uz/api/health
```

---

## ✅ Deployment Checklist

- [ ] SSH serverga kirildi
- [ ] Repository clone qilindi
- [ ] Secrets generatsiya qilindi
- [ ] `backend/.env.production` sozlandi
- [ ] `docker-compose.prod.yml` da parol o'zgartirildi
- [ ] SSL sertifikat olindi
- [ ] `docker-compose build` bajarildi
- [ ] `docker-compose up -d` bajarildi
- [ ] Health check muvaffaqiyatli
- [ ] Firewall sozlandi
- [ ] Backup cron job (ixtiyoriy)
- [ ] SSL renewal cron job (ixtiyoriy)
- [ ] Website https://sysmasters.uz da ishlayapti ✅

---

## 🎯 Key Commands

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Status
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart bitta servis
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild bitta servis
docker-compose -f docker-compose.prod.yml up -d --build backend
```

---

**Jami vaqt: ~15 daqiqa** ⚡

**Production URL: https://sysmasters.uz** 🎉
