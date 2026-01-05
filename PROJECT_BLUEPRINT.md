# 📋 KUAF CV Portfolio - Loyiha Blueprint

## 🎯 Loyiha Maqsadi
Talabalarning portfolio tizimi - Excel import, AI tahlil, filtrlash va boshqarish.

---

## 📊 DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role role NOT NULL, -- STUDENT, ADMIN, REGISTRAR, EMPLOYER
    full_name TEXT,
    student_id TEXT UNIQUE,
    company_name TEXT,
    student_data JSONB, -- Excel import ma'lumotlari
    profile_image TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Student Data JSONB Structure (Excel Import)
```json
{
    "faculty": "Fakultet nomi",
    "specialty": "Mutaxassislik",
    "course": 1,
    "group": "Guruh nomi",
    "citizenship": "O'zbekiston",
    "passport": "AB1234567",
    "jshshir": "12345678901234",
    "passport_date": "2020-01-01",
    "birth_date": "2000-01-01",
    "phone": "+998901234567",
    "university": "OTM nomi",
    "education_type": "Bakalavr",
    "education_form": "Kunduzgi",
    "code": "60111100",
    "perm_region": "Toshkent",
    "perm_district": "Mirzo Ulug'bek",
    "perm_address": "...",
    "temp_region": "Toshkent",
    "temp_district": "...",
    "temp_address": "...",
    "housing_type": "Yotoqxona"
}
```

### Portfolio Items Table
```sql
CREATE TABLE portfolio_items (
    id TEXT PRIMARY KEY,
    type portfolio_item_type NOT NULL, -- PROJECT, CERTIFICATE, ASSIGNMENT
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    file_url TEXT,
    file_name TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    owner_id TEXT REFERENCES users(id),
    approval_status approval_status DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approved_by TEXT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    target_role role,
    is_read BOOLEAN DEFAULT FALSE,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 ROLLAR VA RUXSATLAR

### 1. ADMIN
- ✅ Barcha foydalanuvchilarni ko'rish/qo'shish/o'chirish
- ✅ Excel import qilish
- ✅ Talabalar ro'yxati + To'liq filtrlar
- ✅ Bildirishnomalar yuborish
- ✅ Ruxsatlarni boshqarish
- ✅ Super Admin panel

### 2. REGISTRAR
- ✅ Talabalar ro'yxatini ko'rish (faqat o'qish)
- ✅ Portfoliolarni tasdiqlash/rad etish
- ✅ Filtrlar (Fakultet, Mutaxassislik, Kurs, Guruh)
- ❌ Foydalanuvchi qo'shish/o'chirish

### 3. EMPLOYER
- ✅ Talabalar ro'yxatini ko'rish (faqat o'qish)
- ✅ AI bilan talaba tahlili
- ✅ Filtrlar (Fakultet, Mutaxassislik, Kurs, Guruh)
- ❌ Portfolio tasdiqlash

### 4. STUDENT
- ✅ O'z portfoliosini boshqarish
- ✅ Portfolio qo'shish/o'chirish
- ✅ Profil sozlamalari
- ✅ AI tahlil olish
- ❌ Boshqa talabalarni ko'rish

---

## 📁 EXCEL IMPORT SHABLON (23 ustun)

| # | Ustun nomi | Field | Majburiy |
|---|------------|-------|----------|
| 0 | Talaba ID | student_id | ✅ |
| 1 | F.I.O | full_name | ✅ |
| 2 | Fuqarolik | citizenship | ❌ |
| 3 | Pasport raqami | passport | ❌ |
| 4 | JSHSHIR | jshshir | ❌ |
| 5 | Pasport berilgan sana | passport_date | ❌ |
| 6 | Tug'ilgan sana | birth_date | ❌ |
| 7 | Telefon | phone | ❌ |
| 8 | OTM nomi | university | ❌ |
| 9 | Ta'lim turi | education_type | ❌ |
| 10 | Ta'lim shakli | education_form | ❌ |
| 11 | Shifr | code | ❌ |
| 12 | Mutaxassislik | specialty | ❌ |
| 13 | Kurs | course | ❌ |
| 14 | Guruh | group | ❌ |
| 15 | Doimiy viloyat | perm_region | ❌ |
| 16 | Doimiy tuman | perm_district | ❌ |
| 17 | Doimiy manzil | perm_address | ❌ |
| 18 | Vaqtinchalik viloyat | temp_region | ❌ |
| 19 | Vaqtinchalik tuman | temp_district | ❌ |
| 20 | Vaqtinchalik manzil | temp_address | ❌ |
| 21 | Turar joy turi | housing_type | ❌ |
| 22 | Fakultet | faculty | ❌ |

---

## 🎨 DIZAYN - OQ-QIZIL KOMBINATSIYA

### Ranglar
```css
/* Primary - Qizil */
--red-50: #fef2f2;
--red-100: #fee2e2;
--red-200: #fecaca;
--red-300: #fca5a5;
--red-400: #f87171;
--red-500: #ef4444;
--red-600: #dc2626;
--red-700: #b91c1c;
--red-800: #991b1b;

/* Oq */
--white: #ffffff;
--gray-50: #f9fafb; /* faqat background uchun */
```

### Sidebar
- Background: `bg-red-600`
- Text: `text-white`
- Active: `bg-white text-red-600`
- Hover: `hover:bg-red-700`

### Cards & Inputs
- Border: `border-red-200`
- Text: `text-red-800`
- Labels: `text-red-700`
- Focus: `focus:ring-red-500`

---

## 📂 FRONTEND STRUKTURA

```
frontend/src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home redirect
│   ├── login/page.tsx      # Login sahifa
│   ├── admin/page.tsx      # Admin panel (foydalanuvchilar)
│   ├── dashboard/page.tsx  # Statistika
│   ├── groups/page.tsx     # Talabalar kontingenti
│   ├── student/page.tsx    # Talaba dashboard
│   ├── portfolio/page.tsx  # Portfolio boshqaruvi
│   ├── employer/page.tsx   # Employer panel
│   ├── employer-ai/page.tsx # AI tahlil
│   ├── registrar/page.tsx  # Registrar panel
│   └── registrar-portfolios/page.tsx # Portfolio tasdiqlash
├── components/
│   ├── Sidebar.tsx         # Navigation
│   ├── AuthProvider.tsx    # Auth context
│   └── ...
└── lib/
    ├── api.ts              # API helper
    └── auth.ts             # Auth hooks
```

---

## 📂 BACKEND STRUKTURA

```
backend-go/
├── main.go                 # Entry point
├── config/config.go        # Configuration
├── database/db.go          # PostgreSQL
├── cache/cache.go          # Redis
├── models/models.go        # Data models
├── auth/
│   ├── jwt.go              # JWT handling
│   └── password.go         # Password hashing
├── handlers/
│   ├── auth.go             # Login/Register
│   ├── admin.go            # Admin endpoints
│   ├── portfolio.go        # Portfolio CRUD
│   ├── employer_students.go # Employer API
│   └── ...
├── middleware/
│   ├── auth.go             # JWT validation
│   ├── rbac.go             # Role-based access
│   └── ...
└── logger/logger.go        # Structured logging
```

---

## 🔌 API ENDPOINTS

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Admin
- `GET /api/admin/users` - Barcha foydalanuvchilar
- `POST /api/admin/users` - Yangi foydalanuvchi
- `DELETE /api/admin/users/:id` - O'chirish
- `POST /api/admin/import-students` - Excel import

### Portfolio
- `GET /api/portfolio` - O'z portfoliosi
- `POST /api/portfolio` - Qo'shish
- `PUT /api/portfolio/:id` - Yangilash
- `DELETE /api/portfolio/:id` - O'chirish

### Registrar
- `GET /api/registrar/portfolios` - Barcha portfoliolar
- `POST /api/registrar/approve/:id` - Tasdiqlash
- `POST /api/registrar/reject/:id` - Rad etish

### Employer
- `GET /api/employer/students` - Talabalar ro'yxati
- `GET /api/employer/students/:id` - Talaba ma'lumotlari
- `POST /api/employer/analyze/:id` - AI tahlil

---

## ✅ TO'LIQ FILTR TIZIMI

Har bir panelda quyidagi filtrlar bo'lishi kerak:

1. **🔍 Qidiruv** - Ism, ID, Email
2. **🏛️ Fakultet** - Dropdown
3. **📚 Mutaxassislik** - Dropdown
4. **📖 Kurs** - 1, 2, 3, 4
5. **👥 Guruh** - Dropdown
6. **✖ Tozalash** - Barcha filtrlarni tozalash

---

## 🚀 QAYTA YOZISH REJASI

1. ✅ Blueprint yaratish (shu fayl)
2. ⏳ Barcha eski fayllarni o'chirish
3. ⏳ Backend Go - yangi yozish
4. ⏳ Frontend Next.js - yangi yozish
5. ⏳ Test va deploy

---

*Yaratilgan: 2025-12-31*
