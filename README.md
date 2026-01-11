# KUAFCV - Talabalar Portfolio Boshqaruv Tizimi

<p align="center">
  <img src="logo.svg" alt="KUAFCV Logo" width="120" />
</p>

<p align="center">
  <strong>Universitet talabalari uchun portfolio yaratish va boshqarish platformasi</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.23-00ADD8?logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
</p>

---

## 📋 Mundarija

- [Loyiha haqida](#-loyiha-haqida)
- [Texnologiyalar](#-texnologiyalar)
- [O'rnatish](#-ornatish)
- [Loyiha strukturasi](#-loyiha-strukturasi)
- [Foydalanuvchi rollari](#-foydalanuvchi-rollari)
- [API Endpoints](#-api-endpoints)
- [Database modellari](#-database-modellari)
- [Portfolio kategoriyalari](#-portfolio-kategoriyalari)
- [Xususiyatlar](#-xususiyatlar)
- [Production deployment](#-production-deployment)
- [Konfiguratsiya](#-konfiguratsiya)

---

## 🎯 Loyiha haqida

**KUAFCV** - bu universitet talabalari uchun maxsus ishlab chiqilgan portfolio boshqaruv tizimi. Talabalar o'z yutuqlari, loyihalari, sertifikatlari va boshqa materiallarini saqlash, tashkil qilish va ish beruvchilarga ko'rsatish imkoniyatiga ega.

### Asosiy maqsadlar:
- Talabalar portfoliosini markazlashtirilgan holda saqlash
- Registratorlar tomonidan portfolio tasdiqlash jarayoni
- Ish beruvchilar uchun talabalar bazasini ko'rish
- AI-asosidagi portfolio tahlili va tavsiyalar
- Real-vaqtda bildirishnomalar (WebSocket)

---

## 🛠 Texnologiyalar

### Backend
| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Go | 1.23 | Asosiy dasturlash tili |
| Gin | 1.10 | HTTP web framework |
| PostgreSQL | 15 | Asosiy ma'lumotlar bazasi |
| Redis | 7 | Caching va session |
| JWT | v5 | Autentifikatsiya |
| bcrypt | - | Parol hashing |
| WebSocket | - | Real-time aloqa |

### Frontend
| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Next.js | 14.2 | React framework |
| React | 18.3 | UI kutubxonasi |
| TypeScript | 5.4 | Tipli JavaScript |
| Tailwind CSS | 3.4 | Styling |
| Lucide React | - | Ikonkalar |

### DevOps
| Texnologiya | Vazifasi |
|-------------|----------|
| Docker | Konteynerizatsiya |
| Docker Compose | Multi-container orkestrasiya |
| Nginx | Reverse proxy |

---

## 🚀 O'rnatish

### Talablar
- Docker va Docker Compose
- Git
- (Ixtiyoriy) Go 1.23+, Node.js 20+

### 1-usul: Docker bilan (tavsiya etiladi)

```bash
# Loyihani klonlash
git clone https://github.com/xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv

# Environment fayllarni sozlash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Docker konteynerlarni ishga tushirish
docker-compose up -d
```

### 2-usul: Lokal development

```bash
# Database va Redis ni Docker bilan
docker-compose up -d postgres redis

# Backend
cd backend
go mod tidy
go run .

# Frontend (yangi terminalda)
cd frontend
npm install
npm run dev
```

### 3-usul: PowerShell script (Windows)

```powershell
.\start.ps1
```

### URL'lar

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Demo hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | admin@kuafcv.uz | admin123 |

---

## 📁 Loyiha strukturasi

```
kuafcv/
├── backend/                    # Go API server
│   ├── main.go                # Entry point (354 qator)
│   ├── config/                # Environment konfiguratsiya
│   │   └── config.go
│   ├── database/              # PostgreSQL + Migrations
│   │   └── database.go        # (621 qator)
│   ├── cache/                 # Redis cache
│   │   └── cache.go
│   ├── models/                # Data structures
│   │   └── models.go          # (226 qator)
│   ├── auth/                  # JWT + Password
│   │   ├── jwt.go
│   │   └── password.go
│   ├── handlers/              # API endpoint handlers
│   │   ├── admin.go           # Admin funksiyalari
│   │   ├── ai.go              # AI tahlil
│   │   ├── analytics.go       # Statistika
│   │   ├── announcements.go   # E'lonlar
│   │   ├── auth.go            # Autentifikatsiya
│   │   ├── captcha.go         # CAPTCHA
│   │   ├── categories.go      # Kategoriyalar
│   │   ├── dashboard.go       # Dashboard
│   │   ├── employer.go        # Ish beruvchi
│   │   ├── health.go          # Health check
│   │   ├── notification.go    # Bildirishnomalar
│   │   ├── portfolio.go       # Portfolio CRUD
│   │   ├── portfolio_features.go # Reyting, izoh
│   │   ├── settings.go        # Tizim sozlamalari
│   │   ├── webhook.go         # Webhook
│   │   └── websocket.go       # Real-time
│   ├── middleware/            # Middleware
│   │   ├── auth.go            # JWT tekshiruvi
│   │   ├── logger.go          # Request logging
│   │   ├── ratelimit.go       # Rate limiting
│   │   └── security.go        # Security headers
│   └── uploads/               # Yuklangan fayllar
│       ├── portfolios/
│       └── profiles/
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Sahifalar
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── dashboard/     # Bosh sahifa
│   │   │   ├── portfolio/     # Talaba portfoliosi
│   │   │   ├── registrar/     # Registrator
│   │   │   ├── employer/      # Ish beruvchi
│   │   │   ├── login/         # Kirish
│   │   │   ├── analytics/     # Statistika
│   │   │   ├── notifications/ # Bildirishnomalar
│   │   │   ├── settings/      # Sozlamalar
│   │   │   └── ...
│   │   ├── components/        # UI komponentlar
│   │   │   ├── Sidebar.tsx    # Navigatsiya
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── AIAnalytics.tsx
│   │   │   ├── PortfolioFeatures.tsx
│   │   │   └── ...
│   │   └── lib/               # Yordamchi funksiyalar
│   │       ├── api.ts         # API helper (480 qator)
│   │       ├── config.ts
│   │       └── utils.ts
│   └── public/                # Statik fayllar
│
├── database/                   # Database migrations
│   └── migrations/
│       ├── add_analysis_results.sql
│       ├── add_announcements.sql
│       ├── add_webhooks.sql
│       ├── portfolio_features.sql
│       └── ...
│
├── nginx/                      # Nginx konfiguratsiya
│   ├── nginx.conf
│   └── ssl/
│
├── scripts/                    # Yordamchi scriptlar
│   ├── backup_database.sh
│   └── backup_database.ps1
│
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production
└── start.ps1                   # Windows start script
```

---

## 👥 Foydalanuvchi rollari

### STUDENT (Talaba)
- Portfolio yaratish va tahrirlash
- 8 ta kategoriya bo'yicha materiallar yuklash
- O'z statistikasini ko'rish
- Bildirishnomalarni olish
- AI tavsiyalarini olish

### ADMIN (Administrator)
- Barcha foydalanuvchilarni boshqarish
- Excel orqali talabalar import (23 ustun)
- Tizim sozlamalarini boshqarish
- E'lonlar yaratish
- Webhook konfiguratsiyasi
- Analytics ko'rish

### REGISTRAR (Registrator)
- Portfoliolarni tasdiqlash/rad etish
- Talabalar ro'yxatini ko'rish
- Filtrlash (fakultet, guruh, kurs)

### EMPLOYER (Ish beruvchi)
- Talabalar bazasini ko'rish
- Portfoliolarni ko'rish
- Saqlangan talabalar ro'yxati
- Qidiruv va filtrlash

---

## 🔌 API Endpoints

### Autentifikatsiya
```
POST   /api/auth/login              # Kirish
GET    /api/auth/me                 # Joriy foydalanuvchi
POST   /api/auth/logout             # Chiqish
PUT    /api/auth/profile            # Profil yangilash
POST   /api/auth/change-password    # Parol o'zgartirish
```

### Portfolio (Talaba)
```
GET    /api/portfolio               # Mening portfoliolarim
POST   /api/portfolio               # Yangi portfolio
PUT    /api/portfolio/:id           # Tahrirlash
DELETE /api/portfolio/:id           # O'chirish
GET    /api/portfolio/categories    # Kategoriyalar
```

### Portfolio xususiyatlari
```
POST   /api/portfolio/:id/view      # Ko'rish qayd qilish
GET    /api/portfolio/:id/views     # Ko'rishlar soni
POST   /api/portfolio/:id/rate      # Reyting berish
GET    /api/portfolio/:id/ratings   # Reytinglar
POST   /api/portfolio/:id/comments  # Izoh qo'shish
GET    /api/portfolio/:id/comments  # Izohlar
POST   /api/portfolio/:id/bookmark  # Saqlash
GET    /api/portfolio/:id/stats     # Statistika
GET    /api/portfolio/:id/export/pdf # PDF export
```

### Dashboard
```
GET    /api/dashboard/stats         # Umumiy statistika
```

### Admin
```
GET    /api/admin/users             # Foydalanuvchilar
POST   /api/admin/users             # Yangi foydalanuvchi
DELETE /api/admin/users/:id         # O'chirish
POST   /api/admin/import-students   # Excel import
GET    /api/admin/categories        # Kategoriyalar
POST   /api/admin/categories        # Yangi kategoriya
GET    /api/admin/webhooks          # Webhooklar
POST   /api/admin/webhooks          # Yangi webhook
GET    /api/admin/analytics/*       # Analytics endpointlari
```

### Registrator
```
GET    /api/registrar/portfolios    # Barcha portfoliolar
POST   /api/registrar/approve/:id   # Tasdiqlash
POST   /api/registrar/reject/:id    # Rad etish
GET    /api/registrar/students      # Talabalar
```

### Ish beruvchi
```
GET    /api/employer/students       # Talabalar
GET    /api/employer/students/:id   # Talaba tafsilotlari
```

### AI xususiyatlari
```
POST   /api/ai/chat                 # AI chat
POST   /api/ai/analyze-portfolio    # Portfolio tahlili
POST   /api/ai/analyze-file         # Fayl tahlili
POST   /api/ai/detect-ai            # AI content aniqlash
POST   /api/ai/extract-text         # OCR
GET    /api/ai/analysis-history     # Tahlil tarixi
POST   /api/ai/career-advice        # Karyera maslahati
```

### Bildirishnomalar
```
GET    /api/notifications           # Bildirishnomalar
POST   /api/notifications/:id/read  # O'qildi deb belgilash
POST   /api/notifications/read-all  # Barchasini o'qildi
```

### E'lonlar
```
GET    /api/announcements           # E'lonlar (Admin)
POST   /api/announcements           # Yangi e'lon
PUT    /api/announcements/:id       # Tahrirlash
DELETE /api/announcements/:id       # O'chirish
GET    /api/announcements/marquee   # Ommaviy e'lonlar
```

### Sozlamalar
```
GET    /api/settings                # Barcha sozlamalar
GET    /api/settings/:key           # Bitta sozlama
PUT    /api/settings/:key           # Yangilash
PUT    /api/settings/bulk           # Ko'plab yangilash
```

### Health
```
GET    /api/health                  # Health check
GET    /api/ready                   # Readiness check
```

---

## 🗄 Database modellari

### Users (Foydalanuvchilar)
```sql
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            role NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    student_id      VARCHAR(50),
    company_name    VARCHAR(255),
    student_data    JSONB,           -- 23 ta ustun Excel dan
    profile_image   VARCHAR(500),
    permissions     JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Portfolio Items (Portfolio elementlari)
```sql
CREATE TABLE portfolio_items (
    id               VARCHAR(36) PRIMARY KEY,
    type             portfolio_item_type NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(50),
    tags             TEXT[],
    file_url         VARCHAR(500),
    file_name        VARCHAR(255),
    mime_type        VARCHAR(100),
    size_bytes       BIGINT,
    files            JSONB,           -- Ko'p fayllar
    owner_id         VARCHAR(36) REFERENCES users(id),
    approval_status  approval_status DEFAULT 'PENDING',
    approved_by      VARCHAR(36),
    approved_at      TIMESTAMP,
    rejection_reason TEXT,
    view_count       INTEGER DEFAULT 0,
    rating_avg       DECIMAL(3,2) DEFAULT 0,
    rating_count     INTEGER DEFAULT 0,
    comment_count    INTEGER DEFAULT 0,
    bookmark_count   INTEGER DEFAULT 0,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
```

### Notifications (Bildirishnomalar)
```sql
CREATE TABLE notifications (
    id          VARCHAR(36) PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50),
    target_role role,
    is_read     BOOLEAN DEFAULT FALSE,
    created_by  VARCHAR(36),
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### Boshqa jadvallar
- `portfolio_views` - Ko'rishlar tarixi
- `portfolio_ratings` - Reytinglar
- `portfolio_comments` - Izohlar
- `portfolio_bookmarks` - Saqlangan portfoliolar
- `bookmark_collections` - Kolleksiyalar
- `announcements` - E'lonlar
- `system_settings` - Tizim sozlamalari
- `webhooks` - Webhook konfiguratsiyalari
- `webhook_logs` - Webhook loglari
- `ai_analysis_results` - AI tahlil natijalari
- `personal_notifications` - Shaxsiy bildirishnomalar

---

## 📂 Portfolio kategoriyalari

| Kategoriya | O'zbek nomi | Tavsif |
|------------|-------------|--------|
| ACADEMIC | Akademik faoliyat | Ilmiy maqolalar, tadqiqotlar |
| LEADERSHIP | Tashkiliy va yetakchilik | Klub, tashkilot rahbarligi |
| SOCIAL | Ijtimoiy va ko'ngillilik | Volontyorlik, ijtimoiy loyihalar |
| PROJECTS | Loyihalar va tashabbuslar | Shaxsiy va guruh loyihalari |
| TECHNICAL | Raqamli va texnik tajriba | Dasturlash, IT ko'nikmalar |
| CAREER | Karyera va professional | Amaliyot, ish tajribasi |
| INTERNATIONAL | Xalqaro va tillar | Til sertifikatlari, xalqaro dasturlar |
| AWARDS | Mukofotlar va yutuqlar | Diplomlar, sertifikatlar |

---

## ✨ Xususiyatlar

### Asosiy
- ✅ Multi-role autentifikatsiya (JWT)
- ✅ Portfolio CRUD operatsiyalari
- ✅ Fayl yuklash (rasm, PDF, video)
- ✅ Portfolio tasdiqlash workflow
- ✅ Excel import (23 ustunli format)
- ✅ Real-time bildirishnomalar (WebSocket)

### Kengaytirilgan
- ✅ AI-asosidagi portfolio tahlili
- ✅ AI content detection
- ✅ OCR (rasmdan matn ajratish)
- ✅ Reyting va izohlar tizimi
- ✅ Bookmark va kolleksiyalar
- ✅ PDF export
- ✅ Webhook integratsiyasi
- ✅ Analytics dashboard
- ✅ Rate limiting
- ✅ CAPTCHA himoya

### Xavfsizlik
- ✅ bcrypt parol hashing
- ✅ JWT token rotation
- ✅ CORS sozlamalari
- ✅ Security headers (XSS, CSRF)
- ✅ Secure file upload
- ✅ Input validation

---

## 🌐 Production deployment

### Docker Compose (tavsiya etiladi)

```bash
# Production konfiguratsiya
docker-compose -f docker-compose.prod.yml up -d --build
```

### Portlar
| Servis | Port | Tavsif |
|--------|------|--------|
| Frontend | 3000 | Next.js |
| Backend | 4000 | Go API |
| Nginx | 8000 | Reverse proxy |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache (internal) |

### Environment sozlamalari

**Backend** (`backend/.env.production`):
```env
DATABASE_URL=postgres://user:pass@postgres:5432/kuafcv?sslmode=disable
REDIS_URL=redis:6379
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret_min_32_chars
PORT=4000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com
OPENAI_API_KEY=your_openai_key  # AI uchun
```

**Frontend** (`frontend/.env.production`):
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Health check

```bash
# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3000
```

---

## ⚙️ Konfiguratsiya

### Docker Compose servislari

```yaml
services:
  postgres:     # PostgreSQL 15
  redis:        # Redis 7
  backend:      # Go API
  frontend:     # Next.js
  nginx:        # Reverse proxy
```

### Nginx konfiguratsiya

```nginx
# API proxy
location /api/ {
    proxy_pass http://backend:4000;
}

# WebSocket
location /ws {
    proxy_pass http://backend:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Frontend
location / {
    proxy_pass http://frontend:3000;
}
```

---

## 📞 Aloqa

**Repository:** [github.com/xurshidbekxasanboyev1990/kuafcv](https://github.com/xurshidbekxasanboyev1990/kuafcv)

---

## 📄 Litsenziya

MIT License

---

<p align="center">
  <sub>Built with ❤️ for university students</sub>
</p>
