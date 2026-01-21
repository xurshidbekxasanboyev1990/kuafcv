# 🚀 CV.KUAF.UZ - To'liq Deploy Qo'llanmasi

Bu qo'llanma loyihani serverda ishga tushirish uchun barcha bosqichlarni batafsil tushuntiradi.

---

## 📋 Mundarija

1. [Server talablari](#1-server-talablari)
2. [Domen sozlamalari](#2-domen-sozlamalari)
3. [Serverga ulanish](#3-serverga-ulanish)
4. [Docker o'rnatish](#4-docker-ornatish)
5. [Loyihani yuklash](#5-loyihani-yuklash)
6. [Environment sozlash](#6-environment-sozlash)
7. [SSL sertifikat](#7-ssl-sertifikat)
8. [Deploy qilish](#8-deploy-qilish)
9. [Nginx sozlash](#9-nginx-sozlash)
10. [Tekshirish](#10-tekshirish)
11. [Muammolarni hal qilish](#11-muammolarni-hal-qilish)

---

## 1. Server talablari

### Minimal talablar:
- **OS:** Ubuntu 20.04+ / Debian 11+
- **RAM:** 4GB (tavsiya 8GB)
- **CPU:** 2 core
- **Disk:** 20GB bo'sh joy
- **Port:** 80, 443 ochiq bo'lishi kerak

### Kerakli dasturlar:
- Docker 24+
- Docker Compose v2+
- Git
- Nginx (reverse proxy uchun)

---

## 2. Domen sozlamalari

### DNS sozlamalari

Domen panel (Cloudflare, cPanel va boshqalar)da quyidagi A recordlarni qo'shing:

```
Type    Name    Value           TTL
A       cv      SERVER_IP       Auto
A       www     SERVER_IP       Auto (ixtiyoriy)
```

**Misol:**
- Domen: `kuaf.uz`
- Subdomen: `cv.kuaf.uz`
- Server IP: `185.196.214.123`

```
A    cv    185.196.214.123    Auto
```

### Tekshirish

```bash
# DNS tekshirish
dig cv.kuaf.uz
# yoki
nslookup cv.kuaf.uz
```

---

## 3. Serverga ulanish

### SSH orqali kirish

```bash
ssh root@server-ip
# yoki
ssh username@server-ip
```

**Misol:**
```bash
ssh root@185.196.214.123
```

### Root bo'lmasangiz

```bash
sudo -i
# yoki har bir buyruq oldiga sudo qo'shing
```

---

## 4. Docker o'rnatish

### Ubuntu/Debian uchun

```bash
# Sistema yangilash
apt update && apt upgrade -y

# Eski versiyalarni o'chirish
apt remove docker docker-engine docker.io containerd runc

# Kerakli paketlar
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Docker GPG kalitini qo'shish
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker repository qo'shish
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker o'rnatish
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker ishga tushirish
systemctl start docker
systemctl enable docker

# Tekshirish
docker --version
docker compose version
```

---

## 5. Loyihani yuklash

### Loyiha joylashuvi

Tavsiya etiladigan joylar:
- `/var/www/cv.kuaf.uz/`
- `/opt/cv.kuaf.uz/`
- `/home/username/cv.kuaf.uz/`

### GitLab'dan klonlash

```bash
# Papka yaratish
mkdir -p /var/www
cd /var/www

# Loyihani klonlash
git clone https://gitlab.com/kokand-university-andijan-branch/cv.kuaf.uz.git

# Papkaga kirish
cd cv.kuaf.uz

# Tekshirish
ls -la
```

**Natija:**
```
.env.example
README.md
docker-compose.yml
backend/
frontend/
nginx/
database/
```

---

## 6. Environment sozlash

### .env fayl yaratish

```bash
# .env.example dan nusxa olish
cp .env.example .env

# .env faylni tahrirlash
nano .env
```

### .env to'ldirish

```env
# ==========================================
# ASOSIY SOZLAMALAR
# ==========================================
NODE_ENV=production
COMPOSE_PROJECT_NAME=kuafcv

# ==========================================
# DATABASE (PostgreSQL)
# ==========================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kuafcv_db
DB_USER=kuafcv_user
DB_PASSWORD=KUCHLI_PAROL_123456_O'ZGARTIRING

# ==========================================
# REDIS
# ==========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=REDIS_PAROL_123456_O'ZGARTIRING

# ==========================================
# BACKEND
# ==========================================
BACKEND_PORT=4000
JWT_SECRET=openssl rand -base64 32 bilan yarating
MAX_FILE_SIZE=52428800
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
LOG_LEVEL=info
LOG_FORMAT=json

# ==========================================
# FRONTEND
# ==========================================
FRONTEND_PORT=3000

# ==========================================
# API URLs (PRODUCTION)
# ==========================================
NEXT_PUBLIC_API_URL=https://cv.kuaf.uz/api
NEXT_PUBLIC_WS_URL=wss://cv.kuaf.uz/ws
NEXT_PUBLIC_APP_URL=https://cv.kuaf.uz

# ==========================================
# CORS
# ==========================================
ALLOWED_ORIGINS=https://cv.kuaf.uz,https://www.cv.kuaf.uz

# ==========================================
# NGINX
# ==========================================
NGINX_PORT=8090

# ==========================================
# OPENAI (Ixtiyoriy - AI tahlil uchun)
# ==========================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# ADMIN HISOBLAR
# ==========================================
SUPER_ADMIN_EMAIL=xurshidbekxasanboyev@kuafcv.uz
SUPER_ADMIN_PASSWORD=KUCHLI_PAROL_O'ZGARTIRING
DEFAULT_ADMIN_EMAIL=admin@kuafcv.uz
DEFAULT_ADMIN_PASSWORD=KUCHLI_PAROL_O'ZGARTIRING
```

### JWT Secret yaratish

```bash
openssl rand -base64 32
```

Natijani `JWT_SECRET` ga qo'ying.

### Saqlash

`Ctrl + X`, keyin `Y`, keyin `Enter`

---

## 7. SSL Sertifikat

### Let's Encrypt bilan (Certbot)

```bash
# Certbot o'rnatish
apt install -y certbot python3-certbot-nginx

# SSL olish
certbot certonly --nginx -d cv.kuaf.uz -d www.cv.kuaf.uz

# Sertifikatlar joyi:
# /etc/letsencrypt/live/cv.kuaf.uz/fullchain.pem
# /etc/letsencrypt/live/cv.kuaf.uz/privkey.pem
```

### Nginx SSL konfiguratsiya

```bash
# nginx/nginx.conf faylni tahrirlash
cd /var/www/cv.kuaf.uz
nano nginx/nginx.conf
```

SSL qismini yangilash:

```nginx
ssl_certificate /etc/letsencrypt/live/cv.kuaf.uz/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/cv.kuaf.uz/privkey.pem;
```

### Avtomatik yangilash

```bash
# Certbot auto-renewal
certbot renew --dry-run
```

---

## 8. Deploy qilish

### Barcha konteynerlarni ishga tushirish

```bash
cd /var/www/cv.kuaf.uz

# Konteynerlarni build qilish va ishga tushirish
docker compose up -d --build

# Jarayon davomida ko'rsatiladigan loglar:
# ✅ Building backend...
# ✅ Building frontend...
# ✅ Starting postgres...
# ✅ Starting redis...
# ✅ Starting backend...
# ✅ Starting frontend...
# ✅ Starting nginx...
```

### Loglarni kuzatish

```bash
# Barcha servislar
docker compose logs -f

# Faqat backend
docker compose logs -f backend

# Faqat frontend
docker compose logs -f frontend

# Chiqish: Ctrl + C
```

---

## 9. Nginx sozlash

### System Nginx (serverda o'rnatilgan)

Agar serverda Nginx allaqachon o'rnatilgan bo'lsa:

```bash
# Nginx konfiguratsiya yaratish
nano /etc/nginx/sites-available/cv.kuaf.uz
```

**Konfiguratsiya:**

```nginx
# HTTP - HTTPS ga yo'naltirish
server {
    listen 80;
    server_name cv.kuaf.uz www.cv.kuaf.uz;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS - Docker konteynerga proxy
server {
    listen 443 ssl http2;
    server_name cv.kuaf.uz www.cv.kuaf.uz;

    # SSL sertifikatlar
    ssl_certificate /etc/letsencrypt/live/cv.kuaf.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cv.kuaf.uz/privkey.pem;
    
    # SSL sozlamalari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy Docker Nginx ga
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Aktivlashtirish

```bash
# Symlink yaratish
ln -s /etc/nginx/sites-available/cv.kuaf.uz /etc/nginx/sites-enabled/

# Test
nginx -t

# Qayta yuklash
systemctl reload nginx
```

---

## 10. Tekshirish

### Konteynerlar holati

```bash
docker ps

# Natija ko'rinishi:
# CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
# abc123def456   kuafcv-frontend    Up 5 minutes   0.0.0.0:3000->3000/tcp   kuafcv_frontend
# 789ghi012jkl   kuafcv-backend     Up 5 minutes   0.0.0.0:4000->4000/tcp   kuafcv_backend
# mno345pqr678   postgres:16        Up 5 minutes   0.0.0.0:5432->5432/tcp   kuafcv_postgres
# stu901vwx234   redis:7            Up 5 minutes   0.0.0.0:6379->6379/tcp   kuafcv_redis
# yza567bcd890   nginx:alpine       Up 5 minutes   0.0.0.0:8090->80/tcp     kuafcv_nginx
```

### Health check

```bash
# Backend API
curl http://localhost:4000/api/health
# Natija: {"status":"ok","time":1737447123}

# Frontend
curl -I http://localhost:3000
# Natija: HTTP/1.1 200 OK

# Tashqaridan
curl https://cv.kuaf.uz/api/health
```

### Database tekshirish

```bash
# PostgreSQL ga ulanish
docker exec -it kuafcv_postgres psql -U kuafcv_user -d kuafcv_db

# SQL buyruqlar
\dt  # jadvallar ro'yxati
SELECT COUNT(*) FROM users;  # foydalanuvchilar soni
\q   # chiqish
```

### Disk joy

```bash
# Disk joy
df -h

# Docker hajmi
docker system df
```

---

## 11. Muammolarni hal qilish

### Konteyner ishlamayapti

```bash
# Xatoliklarni ko'rish
docker compose logs backend
docker compose logs frontend

# Qayta ishga tushirish
docker compose restart backend
docker compose restart frontend
```

### Database ulanish xatosi

```bash
# PostgreSQL holatini tekshirish
docker exec kuafcv_postgres pg_isready -U kuafcv_user -d kuafcv_db

# Agar ishlamasa - qayta yaratish
docker compose down
docker volume rm kuafcv_postgres_data
docker compose up -d
```

### Port band

```bash
# Qaysi jarayon ishlatayotganini topish
netstat -tulpn | grep :4000
# yoki
lsof -i :4000

# Jarayonni to'xtatish
kill -9 <PID>
```

### Frontend build xatosi

```bash
# Cache tozalash
docker compose build --no-cache frontend

# Qayta ishga tushirish
docker compose up -d frontend
```

### SSL muammolari

```bash
# Sertifikat tekshirish
certbot certificates

# Yangilash
certbot renew

# Nginx qayta yuklash
systemctl reload nginx
```

---

## 📂 Loyiha strukturasi serverda

```
/var/www/cv.kuaf.uz/
│
├── .env                          # Asosiy konfiguratsiya
├── .env.example                  # Namuna
├── docker-compose.yml            # Docker konfiguratsiya
├── README.md
│
├── backend/                      # Go Backend
│   ├── Dockerfile                # Backend Docker image
│   ├── main.go                   # Asosiy fayl
│   ├── go.mod                    # Dependencies
│   ├── handlers/                 # API handlers
│   │   ├── auth.go               # Kirish/Ro'yxatdan o'tish
│   │   ├── portfolio.go          # Portfolio CRUD
│   │   ├── admin.go              # Admin panel
│   │   └── ...
│   ├── middleware/               # Middleware
│   │   ├── auth.go               # JWT autentifikatsiya
│   │   ├── ratelimit.go          # Rate limiting
│   │   └── security.go           # CORS, headers
│   ├── models/                   # Database modellari
│   │   └── models.go             # User, Portfolio va h.k.
│   ├── config/                   # Konfiguratsiya
│   │   └── config.go             # .env o'qish
│   └── uploads/                  # Yuklangan fayllar (volume)
│
├── frontend/                     # Next.js Frontend
│   ├── Dockerfile                # Frontend Docker image
│   ├── next.config.js            # Next.js config
│   ├── package.json              # Dependencies
│   ├── tailwind.config.js        # Tailwind CSS
│   ├── src/
│   │   ├── app/                  # Sahifalar (App Router)
│   │   │   ├── login/            # Kirish sahifasi
│   │   │   ├── portfolio/        # Portfolio dashboard
│   │   │   ├── xk9m2v7p/         # Super admin panel
│   │   │   └── ...
│   │   └── components/           # Komponentlar
│   │       ├── GrantNizomi.tsx   # Grant nizomi modal
│   │       ├── FileUpload.tsx    # Fayl yuklash
│   │       └── ...
│   └── public/                   # Statik fayllar
│       ├── logo.svg
│       ├── grant-nizomi.pdf
│       └── ...
│
├── nginx/                        # Nginx konfiguratsiya
│   └── nginx.conf                # Reverse proxy config
│
├── database/                     # SQL migratsiyalar
│   ├── init.sql                  # Boshlang'ich SQL
│   └── migrations/               # Migratsiya fayllar
│
└── scripts/                      # Qo'shimcha skriptlar
    └── backup_database.sh        # Backup skripti
```

---

## 🔄 Yangilash (Update)

### Git orqali yangilash

```bash
cd /var/www/cv.kuaf.uz

# Oxirgi o'zgarishlarni olish
git pull origin main

# Konteynerlarni qayta build qilish
docker compose down
docker compose up -d --build

# Loglarni tekshirish
docker compose logs -f
```

---

## 💾 Backup

### Database backup

```bash
# Backup yaratish
docker exec kuafcv_postgres pg_dump -U kuafcv_user kuafcv_db > backup_$(date +%Y%m%d).sql

# Tiklash
docker exec -i kuafcv_postgres psql -U kuafcv_user kuafcv_db < backup_20260121.sql
```

### Avtomatik backup (cron)

```bash
# Crontab ochish
crontab -e

# Har kuni soat 02:00 da backup
0 2 * * * docker exec kuafcv_postgres pg_dump -U kuafcv_user kuafcv_db > /var/backups/kuafcv_$(date +\%Y\%m\%d).sql
```

---

## 📊 Monitoring

### Resource istifodasi

```bash
# Konteynerlar resource usage
docker stats

# Disk joy
docker system df

# Loglar hajmi
du -sh /var/lib/docker/containers/*/
```

---

## 🔒 Xavfsizlik

### Firewall

```bash
# UFW o'rnatish va sozlash
apt install ufw
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### Parollarni o'zgartirish

Birinchi deploy dan keyin `.env` dagi barcha parollarni o'zgartiring!

---

## 📞 Yordam

Muammo yuzaga kelsa:

1. **Loglarni tekshiring:** `docker compose logs -f`
2. **Konteyner holatini ko'ring:** `docker ps -a`
3. **Disk joyini tekshiring:** `df -h`
4. **Environment o'zgaruvchilarni qayta ko'rib chiqing:** `cat .env`

---

<p align="center">
  <strong>Qo'qon Universiteti Andijon filiali</strong><br>
  Startuplar bilan ishlash bo'limi<br>
  © 2026
</p>
