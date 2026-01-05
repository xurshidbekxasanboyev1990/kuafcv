# 🚀 STEP 5: Copy-Paste Commands

**Serverda bajaring (SSH orqali):**

---

## ⚠️ MUHIM: Mavjud saytga tasir qilmasligi uchun

1. Docker PostgreSQL **5433** portda ishga tushadi (mavjud 5432 bilan konflikt yo'q)
2. Nginx **80/443** portni egallaydi - mavjud aaPanel Nginx to'xtatilishi kerak
3. Mavjud PostgreSQL database tegmaydi

---

## 1️⃣ Secrets Yaratish (3 daqiqa)

```bash
# SSH orqali serverga kiring
cd /www/wwwroot/kuafcv

# Secretlar yaratish
echo "===== JWT SECRET ====="
openssl rand -base64 64 | tr -d '\n' && echo

echo ""
echo "===== DATABASE PASSWORD ====="
openssl rand -base64 32 | tr -d '\n' && echo

echo ""
echo "===== REDIS PASSWORD ====="
openssl rand -base64 32 | tr -d '\n' && echo
```

**⚠️ Bu 3 ta qiymatni nusxalab, xavfsiz joyga saqlang!**

---

## 2️⃣ Backend Environment (Copy-Paste)

```bash
nano /www/wwwroot/kuafcv/backend/.env.production
```

**Quyidagini butunlay copy-paste qiling va 3 ta qiymatni o'zgartiring:**

```env
# Server Configuration
PORT=4000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz

# Database (Docker PostgreSQL - alohida container)
DATABASE_URL=postgres://kuafcv_user:PASTE_DB_PASSWORD_HERE@postgres:5432/kuafcv?sslmode=require

# Redis (Docker ichida)
REDIS_URL=redis://redis:6379/0
REDIS_PASSWORD=PASTE_REDIS_PASSWORD_HERE

# JWT Secret
JWT_SECRET=PASTE_JWT_SECRET_HERE

# OpenAI API Key
OPENAI_API_KEY=sk-your-real-openai-api-key-here

# File Upload
MAX_FILE_SIZE=20971520
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

**Saqlash:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 3️⃣ Frontend Environment (Copy-Paste)

```bash
nano /www/wwwroot/kuafcv/frontend/.env.production
```

**Quyidagini butunlay copy-paste qiling (o'zgartirish kerak emas):**

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://sysmasters.uz/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz/ws

# Application
NEXT_PUBLIC_APP_URL=https://sysmasters.uz
NODE_ENV=production
```

**Saqlash:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 4️⃣ Docker Compose Parol (Copy-Paste)

```bash
nano /www/wwwroot/kuafcv/docker-compose.prod.yml
```

**Faqat 27-28 qatorni toping va parolni o'zgartiring:**

Topish: `/POSTGRES_PASSWORD` (nano da)

**O'zgartirish:**
```yaml
    POSTGRES_PASSWORD: PASTE_DB_PASSWORD_HERE
```

**⚠️ Step 2 dagi DATABASE_URL parol bilan BIR XIL bo'lishi kerak!**

**Saqlash:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 5️⃣ PostgreSQL Portni O'zgartirish (Mavjud DB ga tasir qilmasligi uchun)

```bash
nano /www/wwwroot/kuafcv/docker-compose.prod.yml
```

**PostgreSQL servisidagi portni toping (21-qator atrofida):**

**O'zgartirish:**
```yaml
postgres:
  image: postgres:16-alpine
  container_name: kuafcv-postgres
  restart: unless-stopped
  environment:
    POSTGRES_DB: kuafcv
    POSTGRES_USER: kuafcv_user
    POSTGRES_PASSWORD: YOUR_PASSWORD_HERE
  ports:
    - "5433:5432"  # ← Buni 5433 ga o'zgartiring (mavjud 5432 bilan konflikt yo'q)
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

**Saqlash:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 6️⃣ SSL Certificates

```bash
# aaPanel Nginx to'xtatish (80 portni bo'shatish)
sudo systemctl stop nginx

# Certbot o'rnatish (agar yo'q bo'lsa)
sudo apt update && sudo apt install certbot -y

# SSL olish
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email xurshidbekxasanboyev1990@gmail.com \
  --agree-tos

# Proyektga nusxalash
sudo mkdir -p /www/wwwroot/kuafcv/nginx/ssl
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem /www/wwwroot/kuafcv/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem /www/wwwroot/kuafcv/nginx/ssl/key.pem
sudo chmod 644 /www/wwwroot/kuafcv/nginx/ssl/cert.pem
sudo chmod 600 /www/wwwroot/kuafcv/nginx/ssl/key.pem
sudo chown -R www:www /www/wwwroot/kuafcv
```

---

## 7️⃣ Build va Deploy

```bash
cd /www/wwwroot/kuafcv

# Build (5-10 daqiqa)
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Status tekshirish
docker-compose -f docker-compose.prod.yml ps
```

**Kutilayotgan natija:**
```
NAME                  STATUS
kuafcv-postgres       Up (healthy)
kuafcv-redis          Up (healthy)
kuafcv-backend        Up (healthy)
kuafcv-frontend       Up (healthy)
kuafcv-nginx          Up (healthy)
```

---

## 8️⃣ Tekshirish

```bash
# Health check
curl http://localhost/api/health

# Logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Brauzerda:**
- https://sysmasters.uz/api/health
- https://sysmasters.uz

---

## ⚠️ Mavjud Saytni Qayta Ishga Tushirish

Agar mavjud saytingizni Docker Nginx ishlagandan keyin qayta ishlatmoqchi bo'lsangiz:

**Option 1: Reverse Proxy (aaPanel)**
```bash
# aaPanel Nginx'ni qayta ishga tushirish
sudo systemctl start nginx

# aaPanel → Website → Reverse Proxy
# Port: 8080 (Docker Nginx oldiga)
```

**Option 2: Boshqa Port**
```bash
# Mavjud saytni 8080 portga o'tkazish
# aaPanel → Website → Settings → Port: 8080
```

---

## 🔥 Troubleshooting

### Port conflicts:
```bash
# Qaysi portlar band
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# aaPanel Nginx to'xtatish
sudo systemctl stop nginx
```

### Containers ishlamasa:
```bash
# Logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart
docker-compose -f docker-compose.prod.yml restart

# Qayta deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Deployment Checklist

- [ ] Secrets yaratildi (JWT, DB, Redis)
- [ ] backend/.env.production to'ldirildi
- [ ] frontend/.env.production to'ldirildi
- [ ] docker-compose.prod.yml parol o'zgartirildi
- [ ] PostgreSQL port 5433 ga o'zgartirildi
- [ ] aaPanel Nginx to'xtatildi
- [ ] SSL sertifikatlar olindi
- [ ] docker-compose build bajarildi
- [ ] docker-compose up -d bajarildi
- [ ] Health check muvaffaqiyatli
- [ ] Website ishlayapti

---

**Barcha buyruqlar copy-paste uchun tayyor!** 📋
