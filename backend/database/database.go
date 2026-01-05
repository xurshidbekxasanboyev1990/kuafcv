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
