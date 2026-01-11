//go:build ignore
// +build ignore

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
	"os"
	"strings"

	_ "github.com/lib/pq"
)

func main() {
	// Database ulanish
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5433/kuafcv?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Database ga ulanib bo'lmadi:", err)
	}
	defer db.Close()

	fmt.Println("\n==========================================")
	fmt.Println("  DATABASE ANALYTICS CHECK")
	fmt.Println("==========================================")

	// 1. Users count by role
	fmt.Println("📊 USERS BY ROLE:")
	fmt.Println("------------------------------------------")

	rows, err := db.Query(`
		SELECT role, COUNT(*) as count 
		FROM users 
		GROUP BY role 
		ORDER BY count DESC
	`)
	if err != nil {
		log.Println("Users query error:", err)
	} else {
		defer rows.Close()
		totalUsers := 0
		for rows.Next() {
			var role string
			var count int
			rows.Scan(&role, &count)
			fmt.Printf("  %-15s : %d\n", role, count)
			totalUsers += count
		}
		fmt.Printf("  %-15s : %d\n", "TOTAL", totalUsers)
	}

	// 2. Check if role is enum or text
	fmt.Println("\n📋 ROLE TYPE CHECK:")
	fmt.Println("------------------------------------------")

	var roleType string
	err = db.QueryRow(`
		SELECT data_type 
		FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'role'
	`).Scan(&roleType)
	if err != nil {
		fmt.Println("  Role type check error:", err)
	} else {
		fmt.Printf("  Role column type: %s\n", roleType)
	}

	// 3. Sample role values
	fmt.Println("\n🔍 SAMPLE ROLE VALUES:")
	fmt.Println("------------------------------------------")

	rows2, err := db.Query(`SELECT DISTINCT role::text FROM users LIMIT 10`)
	if err != nil {
		fmt.Println("  Sample roles error:", err)
	} else {
		defer rows2.Close()
		for rows2.Next() {
			var role string
			rows2.Scan(&role)
			fmt.Printf("  '%s' (uppercase: '%s')\n", role, strings.ToUpper(role))
		}
	}

	// 4. Portfolio stats
	fmt.Println("\n📁 PORTFOLIOS:")
	fmt.Println("------------------------------------------")

	var totalPortfolios, approvedPortfolios, pendingPortfolios int
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_items`).Scan(&totalPortfolios)
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'APPROVED'`).Scan(&approvedPortfolios)
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'PENDING'`).Scan(&pendingPortfolios)

	fmt.Printf("  Total:    %d\n", totalPortfolios)
	fmt.Printf("  Approved: %d\n", approvedPortfolios)
	fmt.Printf("  Pending:  %d\n", pendingPortfolios)

	// 5. Engagement stats
	fmt.Println("\n💬 ENGAGEMENT:")
	fmt.Println("------------------------------------------")

	var totalViews, totalRatings, totalComments, totalBookmarks int
	db.QueryRow(`SELECT COALESCE(SUM(view_count), 0) FROM portfolio_items`).Scan(&totalViews)
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_ratings`).Scan(&totalRatings)
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_comments`).Scan(&totalComments)
	db.QueryRow(`SELECT COUNT(*) FROM portfolio_bookmarks`).Scan(&totalBookmarks)

	fmt.Printf("  Total Views:     %d\n", totalViews)
	fmt.Printf("  Total Ratings:   %d\n", totalRatings)
	fmt.Printf("  Total Comments:  %d\n", totalComments)
	fmt.Printf("  Total Bookmarks: %d\n", totalBookmarks)

	// 6. Direct count tests
	fmt.Println("\n🔬 DIRECT COUNT TESTS:")
	fmt.Println("------------------------------------------")

	var studentCount, employerCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM users WHERE UPPER(role::text) = 'STUDENT'`).Scan(&studentCount)
	fmt.Printf("  Students (UPPER query): %d (err: %v)\n", studentCount, err)

	err = db.QueryRow(`SELECT COUNT(*) FROM users WHERE UPPER(role::text) = 'EMPLOYER'`).Scan(&employerCount)
	fmt.Printf("  Employers (UPPER query): %d (err: %v)\n", employerCount, err)

	// Try lower case
	var studentCount2, employerCount2 int
	err = db.QueryRow(`SELECT COUNT(*) FROM users WHERE role::text = 'student'`).Scan(&studentCount2)
	fmt.Printf("  Students (lowercase): %d (err: %v)\n", studentCount2, err)

	err = db.QueryRow(`SELECT COUNT(*) FROM users WHERE role::text = 'STUDENT'`).Scan(&employerCount2)
	fmt.Printf("  Students (UPPERCASE): %d (err: %v)\n", employerCount2, err)

	fmt.Println("\n==========================================")
	fmt.Println("  CHECK COMPLETE")
	fmt.Println("==========================================")
}
