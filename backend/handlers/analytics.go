// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"fmt"
	"net/http"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// Portfolio Analytics - Umumiy statistika

// GET /api/analytics/overview - Umumiy tizim statistikasi (ADMIN)
func GetAnalyticsOverview(c *gin.Context) {
	var stats struct {
		TotalUsers         int `json:"total_users"`
		TotalStudents      int `json:"total_students"`
		TotalEmployers     int `json:"total_employers"`
		TotalPortfolios    int `json:"total_portfolios"`
		ApprovedPortfolios int `json:"approved_portfolios"`
		PendingPortfolios  int `json:"pending_portfolios"`
		TotalViews         int `json:"total_views"`
		TotalRatings       int `json:"total_ratings"`
		TotalComments      int `json:"total_comments"`
		TotalBookmarks     int `json:"total_bookmarks"`
		OnlineUsers        int `json:"online_users"`
	}

	// Users - Error checking qo'shildi
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers); err != nil {
		fmt.Printf("TotalUsers error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE UPPER(role::text) = 'STUDENT'`).Scan(&stats.TotalStudents); err != nil {
		fmt.Printf("TotalStudents error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE UPPER(role::text) = 'EMPLOYER'`).Scan(&stats.TotalEmployers); err != nil {
		fmt.Printf("TotalEmployers error: %v\n", err)
	}

	// Portfolios
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items`).Scan(&stats.TotalPortfolios); err != nil {
		fmt.Printf("TotalPortfolios error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'APPROVED'`).Scan(&stats.ApprovedPortfolios); err != nil {
		fmt.Printf("ApprovedPortfolios error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'PENDING'`).Scan(&stats.PendingPortfolios); err != nil {
		fmt.Printf("PendingPortfolios error: %v\n", err)
	}

	// Engagement
	if err := database.DB.QueryRow(`SELECT COALESCE(SUM(view_count), 0) FROM portfolio_items`).Scan(&stats.TotalViews); err != nil {
		fmt.Printf("TotalViews error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_ratings`).Scan(&stats.TotalRatings); err != nil {
		fmt.Printf("TotalRatings error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_comments`).Scan(&stats.TotalComments); err != nil {
		fmt.Printf("TotalComments error: %v\n", err)
	}
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_bookmarks`).Scan(&stats.TotalBookmarks); err != nil {
		fmt.Printf("TotalBookmarks error: %v\n", err)
	}

	// Online users
	stats.OnlineUsers = GetOnlineCount()

	c.JSON(http.StatusOK, stats)
}

// GET /api/analytics/portfolios/top - Eng ko'p ko'rilgan portfoliolar
func GetTopPortfolios(c *gin.Context) {
	limit := 10
	sortBy := c.DefaultQuery("sort", "views") // views, rating, comments

	var orderBy string
	switch sortBy {
	case "rating":
		orderBy = "rating_avg DESC, rating_count DESC"
	case "comments":
		orderBy = "comment_count DESC"
	default:
		orderBy = "view_count DESC"
	}

	query := `
		SELECT p.id, p.title, p.type::text as category, p.view_count, p.rating_avg, p.rating_count, 
		       p.comment_count, p.bookmark_count, u.full_name as owner_name
		FROM portfolio_items p
		JOIN users u ON p.owner_id = u.id
		WHERE p.approval_status = 'APPROVED'
		ORDER BY ` + orderBy + `
		LIMIT $1
	`

	rows, err := database.DB.Query(query, limit)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type TopPortfolio struct {
		ID            string  `json:"id"`
		Title         string  `json:"title"`
		Category      string  `json:"category"`
		ViewCount     int     `json:"view_count"`
		RatingAvg     float64 `json:"rating_avg"`
		RatingCount   int     `json:"rating_count"`
		CommentCount  int     `json:"comment_count"`
		BookmarkCount int     `json:"bookmark_count"`
		OwnerName     string  `json:"owner_name"`
	}

	portfolios := []TopPortfolio{}
	for rows.Next() {
		var p TopPortfolio
		rows.Scan(&p.ID, &p.Title, &p.Category, &p.ViewCount, &p.RatingAvg,
			&p.RatingCount, &p.CommentCount, &p.BookmarkCount, &p.OwnerName)
		portfolios = append(portfolios, p)
	}

	c.JSON(http.StatusOK, gin.H{"portfolios": portfolios})
}

// GET /api/analytics/activity - Faollik statistikasi (vaqt bo'yicha)
func GetActivityStats(c *gin.Context) {
	period := c.DefaultQuery("period", "week") // day, week, month

	var interval string
	var days int
	switch period {
	case "day":
		interval = "hour"
		days = 1
	case "month":
		interval = "day"
		days = 30
	default: // week
		interval = "day"
		days = 7
	}

	type DataPoint struct {
		Period time.Time `json:"period"`
		Count  int       `json:"count"`
	}

	views := []DataPoint{}
	ratings := []DataPoint{}
	comments := []DataPoint{}

	// Views over time
	viewRows, err := database.DB.Query(`
		SELECT DATE_TRUNC($1, viewed_at) as period, COUNT(*) as count
		FROM portfolio_views
		WHERE viewed_at >= NOW() - INTERVAL '`+fmt.Sprintf("%d", days)+` days'
		GROUP BY period
		ORDER BY period
	`, interval)
	if err == nil {
		defer viewRows.Close()
		for viewRows.Next() {
			var d DataPoint
			viewRows.Scan(&d.Period, &d.Count)
			views = append(views, d)
		}
	}

	// Ratings over time
	ratingRows, err := database.DB.Query(`
		SELECT DATE_TRUNC($1, created_at) as period, COUNT(*) as count
		FROM portfolio_ratings
		WHERE created_at >= NOW() - INTERVAL '`+fmt.Sprintf("%d", days)+` days'
		GROUP BY period
		ORDER BY period
	`, interval)
	if err == nil {
		defer ratingRows.Close()
		for ratingRows.Next() {
			var d DataPoint
			ratingRows.Scan(&d.Period, &d.Count)
			ratings = append(ratings, d)
		}
	}

	// Comments over time
	commentRows, err := database.DB.Query(`
		SELECT DATE_TRUNC($1, created_at) as period, COUNT(*) as count
		FROM portfolio_comments
		WHERE created_at >= NOW() - INTERVAL '`+fmt.Sprintf("%d", days)+` days'
		GROUP BY period
		ORDER BY period
	`, interval)
	if err == nil {
		defer commentRows.Close()
		for commentRows.Next() {
			var d DataPoint
			commentRows.Scan(&d.Period, &d.Count)
			comments = append(comments, d)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"views":    views,
		"ratings":  ratings,
		"comments": comments,
		"period":   period,
	})
}

// GET /api/analytics/categories - Kategoriya bo'yicha statistika
func GetCategoryStats(c *gin.Context) {
	query := `
		SELECT type::text as category, 
		       COUNT(*) as count,
		       COALESCE(SUM(view_count), 0) as total_views,
		       COALESCE(AVG(rating_avg), 0) as avg_rating
		FROM portfolio_items
		WHERE approval_status = 'APPROVED'
		GROUP BY type
		ORDER BY count DESC
	`

	rows, err := database.DB.Query(query)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type CategoryStat struct {
		Category   string  `json:"category"`
		Count      int     `json:"count"`
		TotalViews int     `json:"total_views"`
		AvgRating  float64 `json:"avg_rating"`
	}

	categories := []CategoryStat{}
	for rows.Next() {
		var cat CategoryStat
		rows.Scan(&cat.Category, &cat.Count, &cat.TotalViews, &cat.AvgRating)
		categories = append(categories, cat)
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// GET /api/analytics/rating-distribution - Reyting taqsimoti
func GetRatingDistribution(c *gin.Context) {
	distribution := make(map[int]int)
	for i := 1; i <= 5; i++ {
		distribution[i] = 0
	}

	rows, err := database.DB.Query(`
		SELECT rating, COUNT(*) as count
		FROM portfolio_ratings
		GROUP BY rating
		ORDER BY rating
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var rating, count int
			rows.Scan(&rating, &count)
			distribution[rating] = count
		}
	}

	c.JSON(http.StatusOK, gin.H{"distribution": distribution})
}

// GET /api/analytics/recent-activity - So'nggi faollik
func GetRecentActivity(c *gin.Context) {
	type Activity struct {
		PortfolioID    string    `json:"portfolio_id"`
		PortfolioTitle string    `json:"portfolio_title"`
		UserName       string    `json:"user_name"`
		Action         string    `json:"action"`
		CreatedAt      time.Time `json:"created_at"`
	}

	activities := []Activity{}

	// Recent views
	viewRows, err := database.DB.Query(`
		SELECT pv.portfolio_id, p.title, u.full_name as viewer_name, pv.viewed_at
		FROM portfolio_views pv
		JOIN portfolio_items p ON pv.portfolio_id = p.id
		JOIN users u ON pv.user_id = u.id
		ORDER BY pv.viewed_at DESC
		LIMIT 10
	`)
	if err == nil {
		defer viewRows.Close()
		for viewRows.Next() {
			var a Activity
			viewRows.Scan(&a.PortfolioID, &a.PortfolioTitle, &a.UserName, &a.CreatedAt)
			a.Action = "viewed"
			activities = append(activities, a)
		}
	}

	// Recent ratings
	ratingRows, err := database.DB.Query(`
		SELECT pr.portfolio_id, p.title, u.full_name, pr.rating, pr.created_at
		FROM portfolio_ratings pr
		JOIN portfolio_items p ON pr.portfolio_id = p.id
		JOIN users u ON pr.user_id = u.id
		ORDER BY pr.created_at DESC
		LIMIT 10
	`)
	if err == nil {
		defer ratingRows.Close()
		for ratingRows.Next() {
			var a Activity
			var rating int
			ratingRows.Scan(&a.PortfolioID, &a.PortfolioTitle, &a.UserName, &rating, &a.CreatedAt)
			a.Action = "rated"
			activities = append(activities, a)
		}
	}

	// Recent comments
	commentRows, err := database.DB.Query(`
		SELECT pc.portfolio_id, p.title, u.full_name, pc.created_at
		FROM portfolio_comments pc
		JOIN portfolio_items p ON pc.portfolio_id = p.id
		JOIN users u ON pc.user_id = u.id
		ORDER BY pc.created_at DESC
		LIMIT 10
	`)
	if err == nil {
		defer commentRows.Close()
		for commentRows.Next() {
			var a Activity
			commentRows.Scan(&a.PortfolioID, &a.PortfolioTitle, &a.UserName, &a.CreatedAt)
			a.Action = "commented"
			activities = append(activities, a)
		}
	}

	c.JSON(http.StatusOK, gin.H{"activities": activities})
}

// GET /api/analytics/my-portfolio-stats - Talaba o'z portfoliosi statistikasi
func GetMyPortfolioStats(c *gin.Context) {
	userID := c.GetString("user_id")

	// Overall stats
	var stats struct {
		TotalPortfolios int     `json:"total_portfolios"`
		ApprovedCount   int     `json:"approved_count"`
		TotalViews      int     `json:"total_views"`
		TotalRatings    int     `json:"total_ratings"`
		AverageRating   float64 `json:"average_rating"`
		TotalComments   int     `json:"total_comments"`
		TotalBookmarks  int     `json:"total_bookmarks"`
		ViewsThisWeek   int     `json:"views_this_week"`
		ViewsThisMonth  int     `json:"views_this_month"`
	}

	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1`, userID).Scan(&stats.TotalPortfolios)
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE owner_id = $1 AND approval_status = 'APPROVED'`, userID).Scan(&stats.ApprovedCount)
	database.DB.QueryRow(`SELECT COALESCE(SUM(view_count), 0) FROM portfolio_items WHERE owner_id = $1`, userID).Scan(&stats.TotalViews)
	database.DB.QueryRow(`SELECT COALESCE(SUM(rating_count), 0) FROM portfolio_items WHERE owner_id = $1`, userID).Scan(&stats.TotalRatings)
	database.DB.QueryRow(`SELECT COALESCE(AVG(rating_avg), 0) FROM portfolio_items WHERE owner_id = $1 AND rating_count > 0`, userID).Scan(&stats.AverageRating)
	database.DB.QueryRow(`SELECT COALESCE(SUM(comment_count), 0) FROM portfolio_items WHERE owner_id = $1`, userID).Scan(&stats.TotalComments)
	database.DB.QueryRow(`SELECT COALESCE(SUM(bookmark_count), 0) FROM portfolio_items WHERE owner_id = $1`, userID).Scan(&stats.TotalBookmarks)

	// Views this week
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM portfolio_views pv
		JOIN portfolio_items p ON pv.portfolio_id = p.id
		WHERE p.owner_id = $1 AND pv.viewed_at >= NOW() - INTERVAL '7 days'
	`, userID).Scan(&stats.ViewsThisWeek)

	// Views this month
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM portfolio_views pv
		JOIN portfolio_items p ON pv.portfolio_id = p.id
		WHERE p.owner_id = $1 AND pv.viewed_at >= NOW() - INTERVAL '30 days'
	`, userID).Scan(&stats.ViewsThisMonth)

	// Per portfolio stats
	type PortfolioStat struct {
		ID            string  `json:"id"`
		Title         string  `json:"title"`
		ViewCount     int     `json:"view_count"`
		RatingAvg     float64 `json:"rating_avg"`
		RatingCount   int     `json:"rating_count"`
		CommentCount  int     `json:"comment_count"`
		BookmarkCount int     `json:"bookmark_count"`
	}

	portfolios := []PortfolioStat{}
	rows, err := database.DB.Query(`
		SELECT id, title, view_count, rating_avg, rating_count, comment_count, bookmark_count
		FROM portfolio_items
		WHERE owner_id = $1
		ORDER BY view_count DESC
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p PortfolioStat
			rows.Scan(&p.ID, &p.Title, &p.ViewCount, &p.RatingAvg, &p.RatingCount, &p.CommentCount, &p.BookmarkCount)
			portfolios = append(portfolios, p)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stats":      stats,
		"portfolios": portfolios,
	})
}
