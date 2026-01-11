// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.

package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

func Connect(databaseURL string) error {
	var err error
	DB, err = sql.Open("postgres", databaseURL)
	if err != nil {
		return fmt.Errorf("database bilan ulanishda xatolik: %w", err)
	}

	// Connection pool sozlamalari
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// Ulanishni tekshirish
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("database ping xatolik: %w", err)
	}

	log.Println("✅ PostgreSQL ga ulandi")
	return nil
}

func Migrate() error {
	// Create migration version table
	versionTable := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT NOW(),
		success BOOLEAN DEFAULT TRUE
	);
	`

	if _, err := DB.Exec(versionTable); err != nil {
		return fmt.Errorf("migration version table yaratishda xatolik: %w", err)
	}

	// Check current version
	var currentVersion int
	err := DB.QueryRow(`
		SELECT COALESCE(MAX(version), 0) FROM schema_migrations WHERE success = true
	`).Scan(&currentVersion)
	if err != nil {
		currentVersion = 0
	}

	log.Printf("📊 Current migration version: %d", currentVersion)

	// Start transaction for migration
	tx, err := DB.Begin()
	if err != nil {
		return fmt.Errorf("migration transaction boshlanmadi: %w", err)
	}
	defer tx.Rollback() // Auto rollback if not committed

	// Migration version 1: Base schema
	if currentVersion < 1 {
		log.Println("🔄 Applying migration v1: Base schema...")

		schema := `
	-- Enum types
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
		CREATE TYPE portfolio_item_type AS ENUM (
			'PROJECT',      -- Loyiha
			'CERTIFICATE',  -- Sertifikat
			'ASSIGNMENT',   -- Topshiriq
			'DOCUMENT',     -- Hujjat
			'MEDIA',        -- Media fayl
			'AWARD',        -- Mukofot
			'PUBLICATION',  -- Nashr
			'OTHER'         -- Boshqa
		);
	EXCEPTION
		WHEN duplicate_object THEN null;
	END $$;

	DO $$ BEGIN
		CREATE TYPE portfolio_category AS ENUM (
			'ACADEMIC',           -- Akademik faoliyat
			'LEADERSHIP',         -- Tashkiliy va yetakchilik
			'SOCIAL',             -- Ijtimoiy va ko'ngillilik
			'PROJECTS',           -- Loyihalar va tashabbuslar
			'TECHNICAL',          -- Raqamli va texnik tajriba
			'CAREER',             -- Karyera va professional
			'INTERNATIONAL',      -- Xalqaro va tillar
			'AWARDS'              -- Mukofotlar va yutuqlar
		);
	EXCEPTION
		WHEN duplicate_object THEN null;
	END $$;

	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role role NOT NULL,
		full_name TEXT NOT NULL,
		student_id TEXT UNIQUE,
		company_name TEXT,
		student_data JSONB DEFAULT '{}',
		profile_image TEXT,
		permissions JSONB DEFAULT '{}',
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Portfolio items table
	CREATE TABLE IF NOT EXISTS portfolio_items (
		id TEXT PRIMARY KEY,
		type portfolio_item_type NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		category TEXT,
		tags TEXT[] DEFAULT '{}',
		file_url TEXT,
		file_name TEXT,
		mime_type TEXT,
		size_bytes INTEGER,
		files JSONB DEFAULT '[]',
		owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		approval_status approval_status DEFAULT 'PENDING',
		approved_by TEXT REFERENCES users(id),
		approved_at TIMESTAMP,
		rejection_reason TEXT,
		view_count INTEGER DEFAULT 0,
		bookmark_count INTEGER DEFAULT 0,
		comment_count INTEGER DEFAULT 0,
		rating_count INTEGER DEFAULT 0,
		rating_avg DECIMAL(3,2) DEFAULT 0.00,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Notifications table
	CREATE TABLE IF NOT EXISTS notifications (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		message TEXT NOT NULL,
		type TEXT DEFAULT 'info',
		target_role role,
		is_read BOOLEAN DEFAULT FALSE,
		created_by TEXT REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW()
	);

	-- Notification reads (kim o'qigan)
	CREATE TABLE IF NOT EXISTS notification_reads (
		notification_id TEXT REFERENCES notifications(id) ON DELETE CASCADE,
		user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		read_at TIMESTAMP DEFAULT NOW(),
		PRIMARY KEY (notification_id, user_id)
	);

	-- AI Analysis results table
	CREATE TABLE IF NOT EXISTS file_analysis_results (
		id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
		user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		portfolio_id TEXT,
		file_url TEXT,
		file_name TEXT NOT NULL,
		file_type TEXT DEFAULT 'text',
		mime_type TEXT,
		analysis_type TEXT DEFAULT 'linguistic',
		analysis_result JSONB,
		conclusion TEXT,
		confidence_level TEXT,
		ai_probability_range TEXT,
		rhythm_score NUMERIC(5,2) DEFAULT 0,
		personality_score NUMERIC(5,2) DEFAULT 0,
		naturalness_score NUMERIC(5,2) DEFAULT 0,
		processing_time_ms INTEGER DEFAULT 0,
		document_type TEXT,
		analyzed_text TEXT,
		text_length INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW()
	);

	-- Indexes
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
	CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
	CREATE INDEX IF NOT EXISTS idx_portfolio_owner ON portfolio_items(owner_id);
	CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio_items(approval_status);
	CREATE INDEX IF NOT EXISTS idx_portfolio_created ON portfolio_items(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);
	CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_analysis_user ON file_analysis_results(user_id);
	CREATE INDEX IF NOT EXISTS idx_analysis_created ON file_analysis_results(created_at DESC);

	-- Update timestamp trigger
	CREATE OR REPLACE FUNCTION update_updated_at()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;

	DROP TRIGGER IF EXISTS users_updated_at ON users;
	CREATE TRIGGER users_updated_at
		BEFORE UPDATE ON users
		FOR EACH ROW EXECUTE FUNCTION update_updated_at();

	DROP TRIGGER IF EXISTS portfolio_items_updated_at ON portfolio_items;
	CREATE TRIGGER portfolio_items_updated_at
		BEFORE UPDATE ON portfolio_items
		FOR EACH ROW EXECUTE FUNCTION update_updated_at();

	-- Portfolio bookmarks table
	CREATE TABLE IF NOT EXISTS portfolio_bookmarks (
		id SERIAL PRIMARY KEY,
		portfolio_id TEXT REFERENCES portfolio_items(id) ON DELETE CASCADE,
		user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		note TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(portfolio_id, user_id)
	);

	-- Portfolio comments table
	CREATE TABLE IF NOT EXISTS portfolio_comments (
		id SERIAL PRIMARY KEY,
		portfolio_id TEXT REFERENCES portfolio_items(id) ON DELETE CASCADE,
		user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		comment TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT NOW()
	);

	-- Portfolio ratings table
	CREATE TABLE IF NOT EXISTS portfolio_ratings (
		id SERIAL PRIMARY KEY,
		portfolio_id TEXT REFERENCES portfolio_items(id) ON DELETE CASCADE,
		user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
		rating INTEGER CHECK (rating >= 1 AND rating <= 5),
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(portfolio_id, user_id)
	);

	-- Portfolio views table
	CREATE TABLE IF NOT EXISTS portfolio_views (
		id SERIAL PRIMARY KEY,
		portfolio_id TEXT REFERENCES portfolio_items(id) ON DELETE CASCADE,
		viewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
		viewer_ip TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	);

	-- System settings table
	CREATE TABLE IF NOT EXISTS system_settings (
		id SERIAL PRIMARY KEY,
		category TEXT DEFAULT 'general',
		key TEXT UNIQUE NOT NULL,
		value JSONB NOT NULL,
		label TEXT,
		description TEXT,
		data_type TEXT DEFAULT 'string',
		options JSONB,
		is_public BOOLEAN DEFAULT FALSE,
		updated_by TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Portfolio Categories table
	CREATE TABLE IF NOT EXISTS portfolio_categories (
		value TEXT PRIMARY KEY,
		label TEXT NOT NULL,
		icon TEXT DEFAULT '📁',
		description TEXT,
		slug TEXT UNIQUE,
		display_order INTEGER DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Insert default categories if not exist
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

	-- Announcements table
	CREATE TABLE IF NOT EXISTS announcements (
		id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		type TEXT DEFAULT 'info',
		priority INTEGER DEFAULT 0,
		target_roles TEXT[] DEFAULT '{ALL}',
		is_active BOOLEAN DEFAULT TRUE,
		is_marquee BOOLEAN DEFAULT FALSE,
		link_url TEXT,
		link_text TEXT,
		image_url TEXT,
		portfolio_id TEXT REFERENCES portfolio_items(id) ON DELETE SET NULL,
		start_date TIMESTAMP DEFAULT NOW(),
		end_date TIMESTAMP,
		created_by TEXT REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Indexes for new tables
	CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
	CREATE INDEX IF NOT EXISTS idx_settings_public ON system_settings(is_public);
	CREATE INDEX IF NOT EXISTS idx_categories_active ON portfolio_categories(is_active);
	CREATE INDEX IF NOT EXISTS idx_categories_order ON portfolio_categories(display_order);
	CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
	CREATE INDEX IF NOT EXISTS idx_announcements_marquee ON announcements(is_marquee);
	CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);

	-- Trigger for system_settings updated_at
	DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
	CREATE TRIGGER system_settings_updated_at
		BEFORE UPDATE ON system_settings
		FOR EACH ROW EXECUTE FUNCTION update_updated_at();

	-- Trigger for announcements updated_at
	DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
	CREATE TRIGGER announcements_updated_at
		BEFORE UPDATE ON announcements
		FOR EACH ROW EXECUTE FUNCTION update_updated_at();

	-- Sync bookmark counts from portfolio_bookmarks table
	UPDATE portfolio_items p
	SET bookmark_count = (
		SELECT COUNT(*) FROM portfolio_bookmarks pb WHERE pb.portfolio_id = p.id
	);

	-- Sync comment counts from portfolio_comments table
	UPDATE portfolio_items p
	SET comment_count = (
		SELECT COUNT(*) FROM portfolio_comments pc WHERE pc.portfolio_id = p.id
	);

	-- Sync rating counts and averages from portfolio_ratings table
	UPDATE portfolio_items p
	SET 
		rating_count = COALESCE((SELECT COUNT(*) FROM portfolio_ratings pr WHERE pr.portfolio_id = p.id), 0),
		rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM portfolio_ratings pr WHERE pr.portfolio_id = p.id), 0);

	-- Sync view counts from portfolio_views table
	UPDATE portfolio_items p
	SET view_count = (
		SELECT COUNT(DISTINCT COALESCE(viewer_id, viewer_ip)) FROM portfolio_views pv WHERE pv.portfolio_id = p.id
	);
	`

		if _, err := tx.Exec(schema); err != nil {
			log.Printf("❌ Migration v1 failed: %v", err)
			return fmt.Errorf("migration v1 xatolik: %w", err)
		}

		// Record successful migration
		if _, err := tx.Exec(`INSERT INTO schema_migrations (version) VALUES (1)`); err != nil {
			return fmt.Errorf("migration version yozishda xatolik: %w", err)
		}

		log.Println("✅ Migration v1 completed")
	}

	// Migration version 2: Extensions and fixes
	if currentVersion < 2 {
		log.Println("🔄 Applying migration v2: Extensions...")

		// Add category column if it doesn't exist
		if _, err := tx.Exec(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS category TEXT;`); err != nil {
			log.Printf("⚠️ Category column qo'shishda xatolik: %v", err)
		} else {
			log.Println("✅ Category column qo'shildi")
		}

		// Extend portfolio_item_type ENUM with new values
		enumValues := []string{"DOCUMENT", "MEDIA", "AWARD", "PUBLICATION", "OTHER"}
		for _, val := range enumValues {
			// Check if value already exists
			var exists bool
			err = tx.QueryRow(`
				SELECT EXISTS(
					SELECT 1 FROM pg_enum 
					WHERE enumtypid = 'portfolio_item_type'::regtype 
					AND enumlabel = $1
				)
			`, val).Scan(&exists)

			if err == nil && !exists {
				// Add new value (note: ALTER TYPE can't be in transaction on some PostgreSQL versions)
				// So we'll skip if already in transaction
				log.Printf("ℹ️  Portfolio type '%s' uchun manual qo'shish kerak (transaction ichida)", val)
			} else if exists {
				log.Printf("✅ Portfolio type '%s' allaqachon mavjud", val)
			}
		}

		// Record successful migration
		if _, err := tx.Exec(`INSERT INTO schema_migrations (version) VALUES (2)`); err != nil {
			return fmt.Errorf("migration version 2 yozishda xatolik: %w", err)
		}

		log.Println("✅ Migration v2 completed")
	}

	// Commit all migrations
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("migration commit xatolik: %w", err)
	}

	// ENUM extensions (outside transaction - PostgreSQL limitation)
	if currentVersion < 2 {
		enumValues := []string{"DOCUMENT", "MEDIA", "AWARD", "PUBLICATION", "OTHER"}
		for _, val := range enumValues {
			var exists bool
			DB.QueryRow(`
				SELECT EXISTS(
					SELECT 1 FROM pg_enum 
					WHERE enumtypid = 'portfolio_item_type'::regtype 
					AND enumlabel = $1
				)
			`, val).Scan(&exists)

			if !exists {
				if _, err := DB.Exec(fmt.Sprintf("ALTER TYPE portfolio_item_type ADD VALUE IF NOT EXISTS '%s'", val)); err != nil {
					log.Printf("⚠️ Portfolio type '%s' qo'shishda xatolik: %v", val, err)
				} else {
					log.Printf("✅ Portfolio type '%s' qo'shildi", val)
				}
			}
		}
	}

	// Migration v3: Add files JSONB column for multiple file uploads
	if currentVersion < 3 {
		log.Println("🔄 Applying migration v3: Multiple files support...")

		// Add files column
		if _, err := DB.Exec(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'`); err != nil {
			log.Printf("⚠️ Files column qo'shishda xatolik: %v", err)
		} else {
			log.Println("✅ Files column qo'shildi")
		}

		// Migrate existing single file to files array
		if _, err := DB.Exec(`
			UPDATE portfolio_items 
			SET files = jsonb_build_array(
				jsonb_build_object(
					'url', file_url,
					'name', file_name,
					'mime_type', mime_type,
					'size', size_bytes
				)
			)
			WHERE file_url IS NOT NULL AND (files IS NULL OR files = '[]'::jsonb)
		`); err != nil {
			log.Printf("⚠️ Mavjud fayllarni migration qilishda xatolik: %v", err)
		} else {
			log.Println("✅ Mavjud fayllar files arrayga ko'chirildi")
		}

		// Record migration
		if _, err := DB.Exec(`INSERT INTO schema_migrations (version) VALUES (3)`); err != nil {
			log.Printf("⚠️ Migration v3 yozishda xatolik: %v", err)
		} else {
			log.Println("✅ Migration v3 completed")
		}
	}

	// Migration v4: Webhooks support
	var v4Applied bool
	DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = 4 AND success = true)`).Scan(&v4Applied)

	if !v4Applied {
		log.Println("🔄 Applying migration v4: Webhooks support...")

		webhookSchema := `
		-- Webhooks jadvalini yaratish
		CREATE TABLE IF NOT EXISTS webhooks (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			secret TEXT,
			events TEXT[] NOT NULL DEFAULT '{}',
			is_active BOOLEAN DEFAULT TRUE,
			retry_count INTEGER DEFAULT 3,
			timeout_seconds INTEGER DEFAULT 30,
			headers JSONB DEFAULT '{}',
			created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);

		-- Webhook logs jadvalini yaratish
		CREATE TABLE IF NOT EXISTS webhook_logs (
			id SERIAL PRIMARY KEY,
			webhook_id TEXT REFERENCES webhooks(id) ON DELETE CASCADE,
			event_type TEXT NOT NULL,
			payload JSONB NOT NULL,
			response_status INTEGER,
			response_body TEXT,
			error_message TEXT,
			attempt INTEGER DEFAULT 1,
			duration_ms INTEGER,
			created_at TIMESTAMP DEFAULT NOW()
		);

		-- Indekslar
		CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
		CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);
		CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
		CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);

		-- Update trigger
		DROP TRIGGER IF EXISTS webhooks_updated_at ON webhooks;
		CREATE TRIGGER webhooks_updated_at
			BEFORE UPDATE ON webhooks
			FOR EACH ROW EXECUTE FUNCTION update_updated_at();
		`

		if _, err := DB.Exec(webhookSchema); err != nil {
			log.Printf("⚠️ Webhook jadvallarini yaratishda xatolik: %v", err)
		} else {
			log.Println("✅ Webhook jadvallari yaratildi")
		}

		// Record migration
		if _, err := DB.Exec(`INSERT INTO schema_migrations (version) VALUES (4)`); err != nil {
			log.Printf("⚠️ Migration v4 yozishda xatolik: %v", err)
		} else {
			log.Println("✅ Migration v4 completed")
		}
	}

	// Migration v5: Super Admin user
	var v5Applied bool
	DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = 5 AND success = true)`).Scan(&v5Applied)

	if !v5Applied {
		log.Println("🔄 Applying migration v5: Super Admin user...")

		// Check if super admin already exists
		var exists bool
		DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = 'xurshidbekxasanboyev@kuafcv.uz')`).Scan(&exists)

		if !exists {
			// Hash password using bcrypt
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte("otamonam9900"), 12)
			if err != nil {
				log.Printf("⚠️ Super Admin parolini hash qilishda xatolik: %v", err)
			} else {
				superAdminSQL := `
				INSERT INTO users (id, email, password, full_name, role, is_active, created_at, updated_at)
				VALUES ($1, $2, $3, $4, 'ADMIN', true, NOW(), NOW())
				`
				if _, err := DB.Exec(superAdminSQL, "super-admin-001", "xurshidbekxasanboyev@kuafcv.uz", string(hashedPassword), "Super Administrator"); err != nil {
					log.Printf("⚠️ Super Admin yaratishda xatolik: %v", err)
				} else {
					log.Println("✅ Super Admin yaratildi")
				}
			}
		} else {
			log.Println("ℹ️ Super Admin allaqachon mavjud")
		}

		// Record migration
		if _, err := DB.Exec(`INSERT INTO schema_migrations (version) VALUES (5)`); err != nil {
			log.Printf("⚠️ Migration v5 yozishda xatolik: %v", err)
		} else {
			log.Println("✅ Migration v5 completed")
		}
	}

	log.Println("✅ Database migration bajarildi (version tracking enabled)")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
		log.Println("✅ Database ulanish yopildi")
	}
}
