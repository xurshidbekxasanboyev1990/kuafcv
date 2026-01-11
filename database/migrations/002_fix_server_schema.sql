-- =====================================================
-- SERVER UCHUN SCHEMA FIX
-- =====================================================
-- Serverda UUID ishlatiladi, shunga moslashtirilgan
-- Sana: 2026-01-12

-- =====================================================
-- 1. notification_reads jadvalini yaratish
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);

-- =====================================================
-- 2. user_notifications jadvaliga ustunlar qo'shish
-- Backend handler quyidagi ustunlarni kutadi:
-- id, type, title, message, link, metadata, is_read, created_at
-- =====================================================

-- Eski strukturadan yangi strukturaga o'tish
-- Avval yangi ustunlar qo'shamiz
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info';
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- id ustunini SERIAL qilish kerak emas, UUID ham ishlaydi
-- Lekin backend INT kutadi, shuning uchun alohida jadval kerak bo'lishi mumkin

-- =====================================================
-- 3. personal_notifications jadvalini tekshirish
-- =====================================================
-- Bu jadval serverda bor, backend uni ishlatmasligi mumkin
-- Agar kerak bo'lsa, user_notifications ga o'tkazamiz

-- =====================================================
-- 4. portfolio_categories ga slug ustuni qo'shish
-- =====================================================
ALTER TABLE portfolio_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Mavjud kategoriyalarga slug qo'shish
UPDATE portfolio_categories SET slug = LOWER(value) WHERE slug IS NULL;

-- =====================================================
-- 5. file_analysis_results jadvalini yaratish
-- =====================================================
CREATE TABLE IF NOT EXISTS file_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolio_items(id) ON DELETE SET NULL,
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
    model_version VARCHAR(50) DEFAULT 'gpt-4o',
    analysis_version VARCHAR(20) DEFAULT '2.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_analysis_user ON file_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_file_analysis_portfolio ON file_analysis_results(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_file_analysis_type ON file_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_file_analysis_created ON file_analysis_results(created_at DESC);

-- =====================================================
-- 6. Default kategoriyalar qo'shish (agar yo'q bo'lsa)
-- =====================================================
INSERT INTO portfolio_categories (value, label, icon, description, slug, display_order, is_active) VALUES
    ('ACADEMIC', 'Akademik faoliyat', '🎓', 'Ilmiy maqolalar, tezislar, konferensiya ishtiroklar', 'academic', 1, true),
    ('LEADERSHIP', 'Tashkiliy va yetakchilik', '👔', 'Jamoa boshqaruvi, tadbirlar tashkil etish', 'leadership', 2, true),
    ('SOCIAL', 'Ijtimoiy va ko''ngillilik', '🤝', 'Ko''ngillilik, xayriya, mentorlik', 'social', 3, true),
    ('PROJECTS', 'Loyihalar va tashabbuslar', '🚀', 'Shaxsiy/jamoa loyihalari, startup', 'projects', 4, true),
    ('TECHNICAL', 'Raqamli va texnik tajriba', '💻', 'Dasturlash, botlar, veb-loyihalar', 'technical', 5, true),
    ('CAREER', 'Karyera va professional', '💼', 'Amaliyot, trening, sertifikatlar', 'career', 6, true),
    ('INTERNATIONAL', 'Xalqaro va tillar', '🌍', 'Xalqaro dasturlar, til sertifikatlar', 'international', 7, true),
    ('AWARDS', 'Mukofotlar va yutuqlar', '🏆', 'Tanlovlar, imtiyozlar, grantlar', 'awards', 8, true)
ON CONFLICT (value) DO UPDATE SET
    slug = EXCLUDED.slug,
    display_order = EXCLUDED.display_order;

-- =====================================================
-- 7. user_notifications indeksini yaratish
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread 
ON user_notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- TAYYOR!
-- =====================================================
