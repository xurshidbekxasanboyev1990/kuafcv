# Portfolio Kategoriyalari - Dinamik Tizim

## Admin Paneldan Kategoriya Qo'shish

### 1. Admin Panelga Kirish
- http://localhost:3000/admin ga kiring
- **Kategoriyalar** tabiga o'ting

### 2. Yangi Kategoriya Qo'shish
**"Yangi kategoriya"** tugmasini bosing va quyidagi maydonlarni to'ldiring:

#### Majburiy Maydonlar:
- **Kod (VALUE)**: Inglizcha, katta harflar (masalan: `RESEARCH`)
- **Nomi (LABEL)**: O'zbekcha nomi (masalan: `Tadqiqot va izlanishlar`)
- **Slug**: URL uchun, kichik harflar (masalan: `research`)

#### Ixtiyoriy Maydonlar:
- **Icon**: Emoji icon (masalan: 🔬)
- **Tavsif**: Qisqacha tavsif
- **Tartib raqami**: Sidebar da ko'rinish tartibi (0-100)

### 3. Kategoriya Sozlashlari

#### Misol Kategoriya:
```json
{
  "value": "RESEARCH",
  "label": "Tadqiqot va izlanishlar",
  "icon": "🔬",
  "description": "Ilmiy tadqiqotlar, laboratoriya ishlari, tajribalar",
  "slug": "research",
  "display_order": 9
}
```

### 4. Natija
Kategoriya qo'shilgandan keyin:
1. ✅ Student sidebar da ko'rinadi
2. ✅ `/portfolio/research` sahifasi avtomatik ishlaydi
3. ✅ Portfolio yaratishda kategoriya tanlash mumkin
4. ✅ Filtrlash ishlaydi

## Texnik Ma'lumotlar

### Backend API:
- `GET /api/admin/categories` - Barcha kategoriyalar
- `POST /api/admin/categories` - Yangi kategoriya
- `PUT /api/admin/categories/:value` - Tahrirlash
- `DELETE /api/admin/categories/:value` - O'chirish

### Database Struktura:
```sql
CREATE TABLE portfolio_categories (
    value TEXT PRIMARY KEY,           -- RESEARCH
    label TEXT NOT NULL,              -- Tadqiqot va izlanishlar
    icon TEXT DEFAULT '📁',           -- 🔬
    description TEXT,                 -- Tavsif
    slug TEXT UNIQUE,                 -- research
    display_order INTEGER DEFAULT 0,  -- 9
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Frontend Routing:
- **Dinamik Route**: `/portfolio/[slug]/page.tsx`
- Slug orqali kategoriya topiladi
- Agar kategoriya topilmasa - `/portfolio` ga redirect

## Foydalanish

### Admin Vazifasi:
1. Admin panelga kiring
2. Kategoriyalar tabini oching
3. Yangi kategoriya qo'shing
4. Barcha maydonlarni to'ldiring
5. "Qo'shish" ni bosing

### Student Ko'rinishi:
1. Student login qiladi
2. Sidebar da yangi kategoriya paydo bo'ladi
3. Kategoriya ustiga bosganda `/portfolio/research` sahifasi ochiladi
4. O'sha kategoriya uchun portfolio qo'shish mumkin

## Xususiyatlar

✅ **Dinamik**: Har bir yangi kategoriya uchun kod yozish shart emas
✅ **Avtomatik**: Slug orqali sahifa avtomatik ishlaydi
✅ **Admin Boshqaruvi**: To'liq CRUD operatsiyalar
✅ **Icon Support**: Emoji iconlar
✅ **Tartib**: display_order orqali sidebar tartibi
✅ **Filtrlash**: Kategoriya bo'yicha portfolio filter

## Migration

Agar mavjud kategoriyalarga slug yo'q bo'lsa:

```sql
-- Run this SQL:
ALTER TABLE portfolio_categories ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE portfolio_categories SET slug = LOWER(value);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_categories_slug 
ON portfolio_categories(slug);
```

## Namuna Kategoriyalar

| Value | Label | Icon | Slug |
|-------|-------|------|------|
| ACADEMIC | Akademik faoliyat | 🎓 | academic |
| LEADERSHIP | Tashkiliy va yetakchilik | 👔 | leadership |
| SOCIAL | Ijtimoiy va ko'ngillilik | 🤝 | social |
| PROJECTS | Loyihalar va tashabbuslar | 🚀 | projects |
| TECHNICAL | Raqamli va texnik tajriba | 💻 | technical |
| CAREER | Karyera va professional | 💼 | career |
| INTERNATIONAL | Xalqaro va tillar | 🌍 | international |
| AWARDS | Mukofotlar va yutuqlar | 🏆 | awards |

Yangi qo'shish uchun:
| RESEARCH | Tadqiqot va izlanishlar | 🔬 | research |
| SPORTS | Sport yutuqlari | ⚽ | sports |
| ARTS | San'at va ijodiyot | 🎨 | arts |

## Muammolarni Hal Qilish

### Slug mavjud emas:
```bash
# Database migration:
ALTER TABLE portfolio_categories ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE portfolio_categories SET slug = 'academic' WHERE value = 'ACADEMIC';
```

### Kategoriya ko'rinmayapti:
1. `is_active` ni tekshiring
2. Browser cache ni tozalang
3. Backend/Frontend qayta ishga tushiring

### 404 Xatosi:
1. Slug to'g'riligini tekshiring
2. `/api/portfolio/categories` dan kategoriya mavjudligini tekshiring
3. Database da slug maydonini tekshiring
