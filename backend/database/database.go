package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
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
		CREATE TYPE portfolio_item_type AS ENUM ('PROJECT', 'CERTIFICATE', 'ASSIGNMENT');
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

	_, err := DB.Exec(schema)
	if err != nil {
		return fmt.Errorf("migration xatolik: %w", err)
	}

	log.Println("✅ Database migration bajarildi")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
		log.Println("✅ Database ulanish yopildi")
	}
}
