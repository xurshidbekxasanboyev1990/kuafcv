-- =====================================================
-- KUAFCV Database Schema - Complete Setup
-- =====================================================
-- LOCAL DOCKER BAZASIDAN OLINGAN ANIQ SCHEMA
-- Sana: 2026-01-12

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES (ENUMs)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('STUDENT', 'ADMIN', 'REGISTRAR', 'EMPLOYER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE portfolio_item_type AS ENUM ('PROJECT', 'CERTIFICATE', 'ASSIGNMENT', 'DOCUMENT', 'MEDIA', 'OTHER', 'AWARD', 'PUBLICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE portfolio_category AS ENUM ('ACADEMIC', 'LEADERSHIP', 'SOCIAL', 'PROJECTS', 'TECHNICAL', 'CAREER', 'INTERNATIONAL', 'AWARDS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TRIGGER FUNCTION FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role role NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE,
    company_name TEXT,
    student_data JSONB DEFAULT '{}'::jsonb,
    profile_image TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PORTFOLIO ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_items (
    id TEXT PRIMARY KEY,
    type portfolio_item_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}'::text[],
    file_url TEXT,
    file_name TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    approval_status approval_status DEFAULT 'PENDING'::approval_status,
    approved_by TEXT REFERENCES users(id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    rating_avg NUMERIC(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    category TEXT,
    files JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_portfolio_created ON portfolio_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_owner ON portfolio_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio_items(approval_status);

DROP TRIGGER IF EXISTS portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PORTFOLIO VIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_views (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    viewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    viewer_role VARCHAR(50),
    viewer_ip VARCHAR(50),
    viewer_agent TEXT,
    viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_portfolio_views_portfolio ON portfolio_views(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewer ON portfolio_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_date ON portfolio_views(viewed_at);

-- =====================================================
-- PORTFOLIO RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_ratings (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_ratings_portfolio ON portfolio_ratings(portfolio_id);

-- =====================================================
-- PORTFOLIO COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_comments (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES portfolio_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_comments_portfolio ON portfolio_comments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_parent ON portfolio_comments(parent_id);

-- =====================================================
-- BOOKMARK COLLECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookmark_collections (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#ef4444'::text,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmark_collections_user ON bookmark_collections(user_id);

-- =====================================================
-- PORTFOLIO BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_bookmarks (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    collection_id INTEGER REFERENCES bookmark_collections(id) ON DELETE SET NULL,
    notes TEXT,
    UNIQUE(portfolio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_bookmarks_portfolio ON portfolio_bookmarks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_bookmarks_user ON portfolio_bookmarks(user_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info'::text,
    target_role role,
    is_read BOOLEAN DEFAULT false,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);

-- =====================================================
-- NOTIFICATION READS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);

-- =====================================================
-- USER NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info'::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- PORTFOLIO CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_categories (
    value TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT DEFAULT '📁'::text,
    description TEXT,
    slug TEXT UNIQUE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON portfolio_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON portfolio_categories(display_order);

-- Default kategoriyalar
INSERT INTO portfolio_categories (value, label, icon, description, slug, display_order) VALUES
    ('ACADEMIC', 'Akademik faoliyat', '🎓', 'Ilmiy maqolalar, tezislar, konferensiya ishtiroklar', 'academic', 1),
    ('LEADERSHIP', 'Tashkiliy va yetakchilik', '👔', 'Jamoa boshqaruvi, tadbirlar tashkil etish', 'leadership', 2),
    ('SOCIAL', 'Ijtimoiy va ko''ngillilik', '🤝', 'Ko''ngillilik, xayriya, mentorlik', 'social', 3),
    ('PROJECTS', 'Loyihalar va tashabbuslar', '🚀', 'Shaxsiy/jamoa loyihalari, startup', 'projects', 4),
    ('TECHNICAL', 'Raqamli va texnik tajriba', '💻', 'Dasturlash, botlar, veb-loyihalar', 'technical', 5),
    ('CAREER', 'Karyera va professional', '💼', 'Amaliyot, trening, sertifikatlar', 'career', 6),
    ('INTERNATIONAL', 'Xalqaro va tillar', '🌍', 'Xalqaro dasturlar, til sertifikatlar', 'international', 7),
    ('AWARDS', 'Mukofotlar va yutuqlar', '🏆', 'Tanlovlar, imtiyozlar, grantlar', 'awards', 8)
ON CONFLICT (value) DO NOTHING;

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'news'::character varying,
    priority INTEGER DEFAULT 0,
    target_roles TEXT[] DEFAULT ARRAY['ALL'::text],
    is_active BOOLEAN DEFAULT true,
    is_marquee BOOLEAN DEFAULT true,
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    image_url VARCHAR(500),
    portfolio_id VARCHAR(50),
    start_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITHOUT TIME ZONE,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_marquee ON announcements(is_marquee, is_active);

DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    label VARCHAR(255),
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'text'::character varying,
    options JSONB,
    is_public BOOLEAN DEFAULT false,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_public ON system_settings(is_public);

DROP TRIGGER IF EXISTS settings_updated_at ON system_settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_settings_timestamp();

DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
CREATE TRIGGER system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default sozlamalar
INSERT INTO system_settings (category, key, value, label, description, data_type, is_public) VALUES
    ('support', 'admin_email', '"admin@kuafcv.uz"', 'Admin Email', 'Administrator elektron pochta manzili', 'text', true),
    ('support', 'admin_phone', '"+998 71 123 45 67"', 'Admin Telefon', 'Administrator telefon raqami', 'text', true),
    ('support', 'admin_telegram', '"@kuafcv_admin"', 'Admin Telegram', 'Administrator Telegram username', 'text', true),
    ('support', 'registrar_email', '"registrar@kuafcv.uz"', 'Registrar Email', 'Registrator elektron pochta manzili', 'text', true),
    ('support', 'registrar_phone', '"+998 71 234 56 78"', 'Registrar Telefon', 'Registrator telefon raqami', 'text', true),
    ('support', 'registrar_location', '"A Bino, 105-xona"', 'Registrar Manzil', 'Registrator ofisi manzili', 'text', true),
    ('support', 'registrar_working_hours', '"09:00 - 18:00 (Dushanba - Juma)"', 'Ish vaqti', 'Registrator ish vaqti', 'text', true),
    ('support', 'support_message', '"Savollaringiz bo''lsa, biz bilan bog''laning!"', 'Support xabari', 'Yordam sahifasidagi xabar', 'text', true),
    ('permissions', 'student_can_delete_portfolio', 'false', 'Talaba portfolio o''chirishi', 'Talabalar o''z portfoliolarini o''chira oladi', 'boolean', false),
    ('permissions', 'student_can_edit_approved', 'false', 'Tasdiqlangan tahrirlash', 'Talabalar tasdiqlangan portfoliolarni tahrirlashi', 'boolean', false),
    ('permissions', 'student_max_portfolios', '50', 'Max portfolio soni', 'Talaba maksimal portfolio soni', 'number', false),
    ('permissions', 'employer_can_contact', 'true', 'Employer kontakt', 'Ishga joylashtirivochilar talabalar bilan bog''lanishi', 'boolean', false),
    ('permissions', 'employer_can_download', 'true', 'Employer yuklab olish', 'Ishga joylashtirivochilar fayllarni yuklab olishi', 'boolean', false),
    ('permissions', 'registrar_auto_approve', 'false', 'Avtomatik tasdiqlash', 'Portfoliolar avtomatik tasdiqlanadi', 'boolean', false),
    ('permissions', 'allow_registration', 'false', 'Ro''yxatdan o''tish', 'Yangi foydalanuvchilar ro''yxatdan o''tishi', 'boolean', false),
    ('ai', 'ai_enabled', 'false', 'AI yoqilgan', 'Sun''iy intellekt xizmatlari faol', 'boolean', false),
    ('ai', 'ai_model', '"gpt-4o"', 'AI Model', 'OpenAI model nomi', 'text', false),
    ('ai', 'ai_max_tokens', '2000', 'Max tokenlar', 'AI javob maksimal uzunligi', 'number', false),
    ('ai', 'ai_rate_limit', '100', 'Rate limit', 'Bir vaqtda maksimal AI so''rovlar', 'number', false),
    ('ai', 'ai_support_enabled', 'true', 'Support chat', 'AI yordam chat faol', 'boolean', false),
    ('ai', 'ai_analytics_enabled', 'true', 'AI Analitika', 'AI portfolio tahlili faol', 'boolean', false),
    ('general', 'site_name', '"KUAF Portfolio"', 'Sayt nomi', 'Tizim nomi', 'text', true),
    ('general', 'site_description', '"Qo''qon Universiteti Andijon filiali Portfolio tizimi"', 'Sayt tavsifi', 'Tizim tavsifi', 'text', true),
    ('general', 'maintenance_mode', 'false', 'Texnik tanaffus', 'Tizim texnik tanaffusda', 'boolean', true),
    ('general', 'maintenance_message', '"Tizim yangilanmoqda. Iltimos, keyinroq urinib ko''ring."', 'Tanaffus xabari', 'Texnik tanaffus paytidagi xabar', 'text', true),
    ('general', 'welcome_message', '"Portfolio tizimiga xush kelibsiz!"', 'Xush kelibsiz', 'Login sahifasidagi xabar', 'text', true),
    ('general', 'max_file_size', '10', 'Max fayl hajmi (MB)', 'Yuklanadigan fayl maksimal hajmi', 'number', false),
    ('general', 'allowed_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "mp4", "mp3"]', 'Ruxsat fayl turlari', 'Yuklab olish mumkin bo''lgan fayl turlari', 'array', false),
    ('ui', 'primary_color', '"#dc2626"', 'Asosiy rang', 'Tizim asosiy rangi (hex)', 'text', true),
    ('ui', 'logo_url', '"/logo.png"', 'Logo URL', 'Tizim logosi manzili', 'text', true),
    ('ui', 'show_footer', 'true', 'Footer ko''rsatish', 'Sahifa pastki qismini ko''rsatish', 'boolean', true),
    ('ui', 'footer_text', '"© 2024 KUAFCV. Barcha huquqlar himoyalangan."', 'Footer matni', 'Pastki qism matni', 'text', true),
    ('ui', 'items_per_page', '20', 'Sahifa elementlari', 'Bir sahifadagi elementlar soni', 'number', false),
    ('notifications', 'email_notifications', 'true', 'Email bildirishnomalar', 'Email orqali bildirishnomalar yuborish', 'boolean', false),
    ('notifications', 'push_notifications', 'true', 'Push bildirishnomalar', 'Push bildirishnomalar yuborish', 'boolean', false),
    ('notifications', 'notify_on_approve', 'true', 'Tasdiqlash xabari', 'Portfolio tasdiqlanganda xabar yuborish', 'boolean', false),
    ('notifications', 'notify_on_reject', 'true', 'Rad etish xabari', 'Portfolio rad etilganda xabar yuborish', 'boolean', false),
    ('notifications', 'notify_admin_new_portfolio', 'true', 'Yangi portfolio xabari', 'Yangi portfolio qo''shilganda adminga xabar', 'boolean', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FILE ANALYSIS RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS file_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID,
    file_url TEXT,
    file_name VARCHAR(500),
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    analysis_type VARCHAR(50) NOT NULL,
    analysis_result JSONB NOT NULL,
    ai_probability_range VARCHAR(50),
    confidence_level VARCHAR(20),
    conclusion VARCHAR(200),
    rhythm_score INTEGER,
    personality_score INTEGER,
    naturalness_score INTEGER,
    analyzed_text TEXT,
    text_length INTEGER,
    document_type VARCHAR(50),
    processing_time_ms INTEGER,
    model_version VARCHAR(50) DEFAULT 'gpt-4o'::character varying,
    analysis_version VARCHAR(20) DEFAULT '2.0'::character varying,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_user ON file_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_portfolio ON file_analysis_results(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_analysis_type ON file_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_file_type ON file_analysis_results(file_type);
CREATE INDEX IF NOT EXISTS idx_analysis_created ON file_analysis_results(created_at DESC);

-- =====================================================
-- SCHEMA MIGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Super Admin User (parol: otamonam9900)
-- =====================================================
INSERT INTO users (id, email, password_hash, role, full_name, permissions, created_at, updated_at)
VALUES (
    'admin-001',
    'xurshidbekxasanboyev@kuafcv.uz',
    '$2a$12$JCw7Hona.mH.3S7KL/gHX.iSvARfGmc7L/R2T7mg6465WA34FRg3K',
    'ADMIN',
    'Xurshidbek Xasanboyev',
    '{"all": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
