// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	// Database ulanish
	dbURL := "postgres://postgres:postgres@localhost:5433/kuafcv?sslmode=disable"

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Database ga ulanib bo'lmadi:", err)
	}
	defer db.Close()

	fmt.Println("\n==========================================")
	fmt.Println("  TEST ANALYSIS DATA SEEDING")
	fmt.Println("==========================================\n")

	// Get admin user ID
	var adminID string
	err = db.QueryRow(`SELECT id FROM users WHERE UPPER(role::text) = 'ADMIN' LIMIT 1`).Scan(&adminID)
	if err != nil {
		log.Fatal("Admin topilmadi:", err)
	}
	fmt.Printf("Admin ID: %s\n", adminID)

	// Seed test analysis records
	testData := []struct {
		FileName         string
		FileType         string
		AnalysisType     string
		Conclusion       string
		ConfidenceLevel  string
		AIProbRange      string
		RhythmScore      int
		PersonalityScore int
		NaturalnessScore int
		ProcessingTime   int
		DocumentType     string
		TextLength       int
	}{
		{"referat_informatika.docx", "document", "linguistic_analysis", "Matn asosan inson tomonidan yozilgan", "high", "10-25%", 78, 85, 82, 1250, "referat", 2500},
		{"diplom_ishi.pdf", "document", "linguistic_analysis", "AI yordamida yozilgan bo'lishi mumkin", "medium", "45-65%", 62, 55, 58, 2100, "diplom", 15000},
		{"kurs_ishi.docx", "document", "linguistic_analysis", "Sun'iy intellekt tomonidan yaratilgan", "high", "75-95%", 45, 35, 40, 1800, "kurs_ishi", 8000},
		{"esse_falsafa.txt", "text", "linguistic_analysis", "Matn inson tomonidan yozilgan", "high", "5-15%", 92, 88, 90, 800, "esse", 1200},
		{"taqdimot_biznes.pptx", "presentation", "linguistic_analysis", "Aralash kontent - qisman AI", "medium", "35-50%", 70, 65, 68, 1500, "taqdimot", 3500},
		{"hisobot_amaliyot.docx", "document", "linguistic_analysis", "Matn asosan inson tomonidan yozilgan", "high", "15-30%", 75, 80, 77, 1100, "hisobot", 4200},
		{"annotatsiya.txt", "text", "linguistic_analysis", "AI yordamida yozilgan", "high", "80-95%", 38, 42, 40, 600, "annotatsiya", 500},
	}

	for _, d := range testData {
		analysisResult := fmt.Sprintf(`{"rhythm_score":%d,"personality_score":%d,"naturalness_score":%d,"conclusion":"%s"}`,
			d.RhythmScore, d.PersonalityScore, d.NaturalnessScore, d.Conclusion)

		_, err := db.Exec(`
			INSERT INTO file_analysis_results (
				user_id, file_name, file_type, analysis_type, analysis_result,
				conclusion, confidence_level, ai_probability_range,
				rhythm_score, personality_score, naturalness_score,
				processing_time_ms, document_type, text_length, created_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
			)
		`, adminID, d.FileName, d.FileType, d.AnalysisType, analysisResult, d.Conclusion,
			d.ConfidenceLevel, d.AIProbRange, d.RhythmScore, d.PersonalityScore,
			d.NaturalnessScore, d.ProcessingTime, d.DocumentType, d.TextLength,
			time.Now().Add(-time.Duration(len(testData))*time.Hour*24))

		if err != nil {
			fmt.Printf("❌ Error inserting %s: %v\n", d.FileName, err)
		} else {
			fmt.Printf("✅ Inserted: %s\n", d.FileName)
		}
	}

	// Check count
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM file_analysis_results`).Scan(&count)
	fmt.Printf("\n📊 Total records: %d\n", count)

	fmt.Println("\n==========================================")
	fmt.Println("  SEEDING COMPLETE")
	fmt.Println("==========================================\n")
}
