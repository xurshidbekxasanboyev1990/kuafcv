# KUAFCV Portfolio Tizimi

**Talabalar portfolio boshqaruv tizimi**

## 🚀 Tezkor Boshlash

### 1. Docker bilan ishga tushirish

```powershell
# Docker konteynerlarni ishga tushirish
docker-compose up -d

# Backend ishga tushirish
cd backend
go mod tidy
go run .

# Frontend ishga tushirish (yangi terminalda)
cd frontend
npm install
npm run dev
```

### 2. Yoki bitta buyruq bilan

```powershell
.\start.ps1
```

## 🔗 URL'lar

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **PostgreSQL:** localhost:5433
- **Redis:** localhost:6379

## 👤 Demo Hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | admin@kuafcv.uz | admin123 |
| Talaba | [student_id]@student.kuafcv.uz | student123 |

## 📁 Struktura

```
kuafcv/
├── backend/              # Go API server
│   ├── main.go          # Entry point
│   ├── config/          # Konfiguratsiya
│   ├── database/        # PostgreSQL
│   ├── cache/           # Redis
│   ├── models/          # Data models
│   ├── auth/            # JWT & Password
│   ├── handlers/        # API endpoints
│   └── middleware/      # Auth, Rate limit
├── frontend/            # Next.js
│   └── src/
│       ├── app/         # Pages
│       ├── components/  # UI komponentlar
│       └── lib/         # API helper
├── docker-compose.yml   # Database containers
└── start.ps1           # Start script
```

## 🎨 Dizayn

- **Rang sxemasi:** Oq + Qizil
- **Framework:** Tailwind CSS
- **Ikonkalar:** Lucide React

## ✅ Funksiyalar

### Admin
- ✅ Foydalanuvchilarni boshqarish
- ✅ Excel import (23 ustunli)
- ✅ Bildirishnomalar yuborish
- ✅ Dashboard statistika

### Registrar
- ✅ Portfolio tasdiqlash/rad etish
- ✅ Talabalar ro'yxati
- ✅ Filtrlash (Fakultet, Guruh, Kurs)

### Employer
- ✅ Talabalar bazasi
- ✅ Portfolio ko'rish
- ✅ Filtrlash

### Student
- ✅ Portfolio qo'shish/tahrirlash
- ✅ Profil ko'rish
- ✅ Bildirishnomalar

## 📊 API Endpoints

### Auth
- `POST /api/auth/login` - Kirish
- `GET /api/auth/me` - Joriy foydalanuvchi
- `POST /api/auth/logout` - Chiqish

### Admin
- `GET /api/admin/users` - Foydalanuvchilar ro'yxati
- `POST /api/admin/users` - Yangi foydalanuvchi
- `DELETE /api/admin/users/:id` - O'chirish
- `POST /api/admin/import-students` - Excel import

### Portfolio
- `GET /api/portfolio` - O'z portfoliosi
- `POST /api/portfolio` - Yangi qo'shish
- `PUT /api/portfolio/:id` - Yangilash
- `DELETE /api/portfolio/:id` - O'chirish

### Registrar
- `GET /api/registrar/portfolios` - Barcha portfoliolar
- `POST /api/registrar/approve/:id` - Tasdiqlash
- `POST /api/registrar/reject/:id` - Rad etish

### Employer
- `GET /api/employer/students` - Talabalar
- `GET /api/employer/students/:id` - Talaba tafsilotlari

---

*Yaratilgan: 2025*
