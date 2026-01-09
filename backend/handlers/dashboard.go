// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"net/http"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// GET /api/dashboard/stats - Statistika
func GetDashboardStats(c *gin.Context) {
	// User role va ID ni olish
	userRole, _ := c.Get("role")
	userID, _ := c.Get("user_id")

	roleStr := string(userRole.(models.Role))
	userIDStr := userID.(string)

	stats := models.DashboardStats{
		StudentsByFaculty:  make(map[string]int),
		PortfoliosByStatus: make(map[string]int),
	}

	if roleStr == "STUDENT" {
		// ----- STUDENT DASHBOARD STATS -----

		// O'zining jami portfoliolari
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1`, userIDStr).Scan(&stats.TotalPortfolios)

		// O'zining kutilayotgan portfoliolari
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1 AND approval_status = 'PENDING'`, userIDStr).Scan(&stats.PendingPortfolios)

		// O'zining tasdiqlangan portfoliolari
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1 AND approval_status = 'APPROVED'`, userIDStr).Scan(&stats.ApprovedPortfolios)

		// O'zining so'nggi 7 kungi portfoliolari
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1 AND created_at > NOW() - INTERVAL '7 days'`, userIDStr).Scan(&stats.RecentPortfolios)

		// O'zining jami ko'rishlar soni (barcha portfoliolar bo'yicha)
		database.DB.QueryRow(`SELECT COALESCE(SUM(view_count), 0) FROM portfolio_items WHERE owner_id = $1`, userIDStr).Scan(&stats.TotalViews)

		// So'nggi 7 kun bildirishnomalar (shaxsiy va umumiy)
		// Oddiy soni kifoya
		database.DB.QueryRow(`SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '7 days'`).Scan(&stats.RecentNotifications)

		// O'zining portfoliolarini status bo'yicha taqsimoti
		rows, err := database.DB.Query(`
			SELECT approval_status, COUNT(*) as count
			FROM portfolio_items
			WHERE owner_id = $1
			GROUP BY approval_status
		`, userIDStr)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var status string
				var count int
				if rows.Scan(&status, &count) == nil {
					stats.PortfoliosByStatus[status] = count
				}
			}
		}

	} else {
		// ----- ADMIN / REGISTRAR DASHBOARD STATS (GLOBAL) -----

		// Jami talabalar
		database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`).Scan(&stats.TotalStudents)

		// Jami portfoliolar
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items`).Scan(&stats.TotalPortfolios)

		// Kutilayotgan portfoliolar
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'PENDING'`).Scan(&stats.PendingPortfolios)

		// Tasdiqlangan portfoliolar
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'APPROVED'`).Scan(&stats.ApprovedPortfolios)

		// So'nggi 7 kun portfoliolar
		database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE created_at > NOW() - INTERVAL '7 days'`).Scan(&stats.RecentPortfolios)

		// So'nggi 7 kun bildirishnomalar
		database.DB.QueryRow(`SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '7 days'`).Scan(&stats.RecentNotifications)

		// Fakultet bo'yicha talabalar
		rows, err := database.DB.Query(`
			SELECT student_data->>'faculty' as faculty, COUNT(*) as count
			FROM users
			WHERE role = 'STUDENT' AND student_data->>'faculty' IS NOT NULL AND student_data->>'faculty' != ''
			GROUP BY student_data->>'faculty'
			ORDER BY count DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var faculty string
				var count int
				if rows.Scan(&faculty, &count) == nil {
					stats.StudentsByFaculty[faculty] = count
				}
			}
		}

		// Status bo'yicha portfoliolar
		rows, err = database.DB.Query(`
			SELECT approval_status, COUNT(*) as count
			FROM portfolio_items
			GROUP BY approval_status
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var status string
				var count int
				if rows.Scan(&status, &count) == nil {
					stats.PortfoliosByStatus[status] = count
				}
			}
		}
	}

	c.JSON(http.StatusOK, stats)
}
