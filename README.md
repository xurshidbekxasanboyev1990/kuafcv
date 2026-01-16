# CV.KUAF.UZ - Talabalar Portfolio Tizimi

<p align="center">
  <img src="logo.svg" alt="KUAFCV Logo" width="120" />
</p>

<p align="center">
  <strong>Qo'qon Universiteti Andijon filiali - Talabalar Portfolio Platformasi</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.23-00ADD8?logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
</p>

---

## 📋 Mundarija

- [Tizim haqida](#-tizim-haqida)
- [Tez boshlash (Quick Start)](#-tez-boshlash)
- [To'liq o'rnatish](#-toliq-ornatish)
- [Environment sozlamalari](#-environment-sozlamalari)
- [Loyiha strukturasi](#-loyiha-strukturasi)
- [Foydalanuvchilar](#-foydalanuvchilar)
- [Production deployment](#-production-deployment)
- [Muammolarni hal qilish](#-muammolarni-hal-qilish)

---

## 🎯 Tizim haqida

**CV.KUAF.UZ** - talabalar portfoliosini boshqarish, saqlash va tahlil qilish uchun mo'ljallangan platforma.

### Imkoniyatlar:
- ✅ Talabalar portfoliosini yaratish va boshqarish
- ✅ Fayl yuklash (PDF, DOCX, XLSX, rasmlar)
- ✅ AI-asosidagi portfolio tahlili
- ✅ Admin panel va super admin panel
- ✅ Real-time bildirishnomalar (WebSocket)
- ✅ Grant nizomi va qo'llanmalar

---

## ⚡ Tez boshlash

### Minimal talablar
- Docker va Docker Compose
- Git

### 3 qadamda ishga tushirish

```bash
# 1. Klonlash
git clone https://gitlab.com/kokand-university-andijan-branch/cv.kuaf.uz.git
cd cv.kuaf.uz

# 2. Environment sozlash
cp .env.example .env

# 3. Ishga tushirish
docker-compose up -d
```

**Tayyor!** 
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/api/health

---

## 📦 To'liq o'rnatish

### 1-qadam: Repozitoriyani klonlash

```bash
git clone https://gitlab.com/kokand-university-andijan-branch/cv.kuaf.uz.git
cd cv.kuaf.uz
```

### 2-qadam: Environment faylini sozlash

```bash
# .env.example dan nusxa olish
cp .env.example .env

# .env faylni tahrirlash
nano .env  # yoki vim, code va h.k.
```

### 3-qadam: .env faylini to'ldirish

```env
# ==========================================
# ASOSIY SOZLAMALAR
# ==========================================
NODE_ENV=production
COMPOSE_PROJECT_NAME=kuafcv

# ==========================================
# DATABASE
# ==========================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kuafcv_db
DB_USER=kuafcv_user
DB_PASSWORD=KUCHLI_PAROL_YOZING

# ==========================================
# REDIS
# ==========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=REDIS_PAROL_YOZING

# ==========================================
# BACKEND
# ==========================================
BACKEND_PORT=4000
JWT_SECRET=openssl_rand_base64_32_bilan_yarating
MAX_FILE_SIZE=52428800

# ==========================================
# FRONTEND
# ==========================================
FRONTEND_PORT=3000

# ==========================================
# API URLs (Production uchun)
# ==========================================
NEXT_PUBLIC_API_URL=https://cv.kuaf.uz/api
NEXT_PUBLIC_WS_URL=wss://cv.kuaf.uz/ws
NEXT_PUBLIC_APP_URL=https://cv.kuaf.uz

# ==========================================
# CORS
# ==========================================
ALLOWED_ORIGINS=https://cv.kuaf.uz,https://www.cv.kuaf.uz

# ==========================================
# OPENAI (Ixtiyoriy - AI tahlil uchun)
# ==========================================
OPENAI_API_KEY=your_openai_api_key
```

### 4-qadam: Docker konteynerlarni ishga tushirish

```bash
# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# Holatni tekshirish
docker-compose ps
```

### 5-qadam: Tekshirish

```bash
# Backend health check
curl http://localhost:4000/api/health

# Konteynerlar holati
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ⚙️ Environment sozlamalari

Barcha sozlamalar bitta `.env` faylda boshqariladi:

| O'zgaruvchi | Tavsif | Default |
|-------------|--------|---------|
| `NODE_ENV` | Muhit (development/production) | production |
| `DB_USER` | PostgreSQL foydalanuvchi | kuafcv_user |
| `DB_PASSWORD` | PostgreSQL paroli | - |
| `DB_NAME` | Database nomi | kuafcv_db |
| `REDIS_PASSWORD` | Redis paroli | - |
| `JWT_SECRET` | JWT maxfiy kalit | - |
| `NEXT_PUBLIC_API_URL` | API manzili | http://localhost:4000 |
| `ALLOWED_ORIGINS` | CORS ruxsat etilgan domenlar | - |
| `OPENAI_API_KEY` | OpenAI API kaliti (ixtiyoriy) | - |

### JWT Secret yaratish

```bash
openssl rand -base64 32
```

---

## 📁 Loyiha strukturasi

```
cv.kuaf.uz/
├── .env                    # Asosiy environment fayl
├── .env.example            # Namuna
├── docker-compose.yml      # Docker konfiguratsiya
├── README.md               # Hujjat
│
├── backend/                # Go Backend
│   ├── Dockerfile
│   ├── main.go
│   ├── handlers/           # API handlers
│   ├── middleware/         # Auth, rate limit
│   ├── models/             # Database modellari
│   └── config/             # Konfiguratsiya
│
├── frontend/               # Next.js Frontend
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/            # Sahifalar
│   │   └── components/     # Komponentlar
│   └── public/             # Statik fayllar
│
├── nginx/                  # Nginx konfiguratsiya
│   └── nginx.conf
│
└── database/               # SQL migratsiyalar
    └── migrations/
```

---

## 👥 Foydalanuvchilar

### Rollar

| Rol | Kirish | Imkoniyatlar |
|-----|--------|--------------|
| **Talaba** | `studentid@student.kuafcv.uz` | Portfolio yaratish, fayl yuklash |
| **Admin** | `admin@kuafcv.uz` | Talabalarni boshqarish, tasdiqlash |
| **Super Admin** | Maxfiy panel | To'liq boshqaruv |

### Default hisoblar (birinchi ishga tushirishda)

- **Admin:** `admin@kuafcv.uz` / `admin123`

> ⚠️ **Muhim:** Production'da parollarni darhol o'zgartiring!

---

## 🚀 Production Deployment

### Serverda deploy qilish

```bash
# 1. Serverga SSH orqali kirish
ssh user@server-ip

# 2. Loyihani klonlash
git clone https://gitlab.com/kokand-university-andijan-branch/cv.kuaf.uz.git
cd cv.kuaf.uz

# 3. Environment sozlash
cp .env.example .env
nano .env  # Production qiymatlarni kiriting

# 4. Konteynerlarni ishga tushirish
docker-compose up -d --build

# 5. SSL sertifikat (Let's Encrypt)
# Nginx yoki Certbot orqali sozlang
```

### Yangilash (Update)

```bash
cd cv.kuaf.uz
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Backup

```bash
# Database backup
docker exec kuafcv_postgres pg_dump -U kuafcv_user kuafcv_db > backup.sql

# Restore
docker exec -i kuafcv_postgres psql -U kuafcv_user kuafcv_db < backup.sql
```

---

## 🔧 Muammolarni hal qilish

### Konteyner ishga tushmayapti

```bash
# Loglarni tekshirish
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Konteynerlarni qayta ishga tushirish
docker-compose restart
```

### Database ulanish xatosi

```bash
# PostgreSQL holatini tekshirish
docker exec kuafcv_postgres pg_isready -U kuafcv_user -d kuafcv_db

# Qayta yaratish (MA'LUMOTLAR YO'QOLADI!)
docker-compose down -v
docker-compose up -d
```

### Port band

```bash
# Portni ishlatayotgan jarayonni topish
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux:
lsof -i :4000
kill -9 <PID>
```

### Frontend build xatosi

```bash
# Cache tozalash va qayta build
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## 📞 Aloqa

- **Loyiha:** cv.kuaf.uz
- **Tashkilot:** Qo'qon Universiteti Andijon filiali
- **GitLab:** https://gitlab.com/kokand-university-andijan-branch/cv.kuaf.uz

---

## 📄 Litsenziya

MIT License - Qo'qon Universiteti Andijon filiali © 2026
