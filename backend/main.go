package main

import (
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"kuafcv-backend/auth"
	"kuafcv-backend/cache"
	"kuafcv-backend/config"
	"kuafcv-backend/database"
	"kuafcv-backend/handlers"
	"kuafcv-backend/middleware"
	"kuafcv-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// .env faylini yuklash
	godotenv.Load()

	// Config yuklash
	cfg := config.Load()

	// JWT secret o'rnatish
	auth.SetSecret(cfg.JWTSecret)

	// Database ulanish
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("❌ Database ulanishda xatolik: %v", err)
	}
	defer database.Close()

	// Migration
	if err := database.Migrate(); err != nil {
		log.Fatalf("❌ Migration xatolik: %v", err)
	}

	// Redis ulanish (ixtiyoriy)
	cache.Connect(cfg.RedisURL)
	defer cache.Close()

	// Default admin yaratish
	createDefaultAdmin()

	// WebSocket hub ishga tushirish
	handlers.InitWebSocket()

	// Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.RateLimiter())

	// CORS - production uchun environment dan olish
	allowedOrigins := strings.Split(cfg.AllowedOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Static fayllar (uploads papkasi)
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api")
	{
		// Health check endpoints
		api.GET("/health", handlers.HealthCheck)
		api.GET("/ready", handlers.ReadinessCheck)

		// Public routes
		api.POST("/auth/login", handlers.Login)
		api.GET("/settings/public", handlers.GetPublicSettings)             // Public settings
		api.GET("/announcements/marquee", handlers.GetMarqueeAnnouncements) // Public marquee

		// CAPTCHA routes (public)
		api.GET("/captcha/generate", handlers.GenerateCaptcha)
		api.POST("/captcha/verify", handlers.VerifyCaptcha)

		// WebSocket route (requires auth via query param)
		api.GET("/ws", middleware.AuthMiddleware(), handlers.HandleWebSocket)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth
			protected.GET("/auth/me", handlers.GetCurrentUser)
			protected.POST("/auth/logout", handlers.Logout)

			// Dashboard
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)

			// Portfolio (STUDENT)
			portfolio := protected.Group("/portfolio")
			portfolio.Use(middleware.RequireRole(models.RoleStudent))
			{
				portfolio.GET("", handlers.GetMyPortfolios)
				portfolio.POST("", handlers.CreatePortfolio)
				portfolio.PUT("/:id", handlers.UpdatePortfolio)
				portfolio.DELETE("/:id", handlers.DeletePortfolio)
			}

			// Portfolio Features - Barcha autentifikatsiya qilingan foydalanuvchilar uchun
			portfolioFeatures := protected.Group("/portfolio")
			{
				portfolioFeatures.POST("/:id/view", handlers.RecordPortfolioView)
				portfolioFeatures.GET("/:id/views", handlers.GetPortfolioViews)
				portfolioFeatures.POST("/:id/rate", handlers.RatePortfolio)
				portfolioFeatures.GET("/:id/ratings", handlers.GetPortfolioRatings)
				portfolioFeatures.POST("/:id/comments", handlers.AddPortfolioComment)
				portfolioFeatures.GET("/:id/comments", handlers.GetPortfolioComments)
				portfolioFeatures.POST("/:id/bookmark", handlers.TogglePortfolioBookmark)
				portfolioFeatures.GET("/:id/stats", handlers.GetPortfolioStats)
				portfolioFeatures.GET("/:id/export/pdf", handlers.ExportPortfolioPDF)
			}
			// Comment management
			protected.PUT("/portfolio/comments/:id", handlers.UpdatePortfolioComment)
			protected.DELETE("/portfolio/comments/:id", handlers.DeletePortfolioComment)
			// User bookmarks
			protected.GET("/bookmarks", handlers.GetMyBookmarks)
			// Bookmark collections
			protected.GET("/bookmarks/collections", handlers.GetBookmarkCollections)
			protected.POST("/bookmarks/collections", handlers.CreateBookmarkCollection)
			protected.PUT("/bookmarks/collections/:id", handlers.UpdateBookmarkCollection)
			protected.DELETE("/bookmarks/collections/:id", handlers.DeleteBookmarkCollection)
			protected.PUT("/bookmarks/:portfolio_id/collection", handlers.MoveBookmarkToCollection)
			protected.GET("/bookmarks/collections/:id/bookmarks", handlers.GetCollectionBookmarks)

			// Notifications
			protected.GET("/notifications", handlers.GetNotifications)
			protected.POST("/notifications/:id/read", handlers.MarkAsRead)
			protected.POST("/notifications/read-all", handlers.MarkAllAsRead)
			// Personal notifications
			protected.GET("/notifications/personal", handlers.GetPersonalNotifications)
			protected.POST("/notifications/personal/:id/read", handlers.MarkPersonalNotificationRead)
			protected.POST("/notifications/personal/read-all", handlers.MarkAllPersonalNotificationsRead)

			// Analytics routes
			analytics := protected.Group("/analytics")
			{
				// Student's own stats
				analytics.GET("/my-portfolio-stats", handlers.GetMyPortfolioStats)
				// General analytics (barcha autentifikatsiya qilingan foydalanuvchilar uchun)
				analytics.GET("/overview", handlers.GetAnalyticsOverview)
				analytics.GET("/top-portfolios", handlers.GetTopPortfolios)
				analytics.GET("/categories", handlers.GetCategoryStats)
				analytics.GET("/recent-activity", handlers.GetRecentActivity)
			}

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(middleware.RequireRole(models.RoleAdmin))
			{
				admin.GET("/users", handlers.GetUsers)
				admin.POST("/users", handlers.CreateUser)
				admin.DELETE("/users/:id", handlers.DeleteUser)
				admin.POST("/import-students", handlers.ImportStudents)
				admin.POST("/notifications", handlers.CreateNotification)
				// Admin analytics
				admin.GET("/analytics/overview", handlers.GetAnalyticsOverview)
				admin.GET("/analytics/top-portfolios", handlers.GetTopPortfolios)
				admin.GET("/analytics/activity", handlers.GetActivityStats)
				admin.GET("/analytics/categories", handlers.GetCategoryStats)
				admin.GET("/analytics/rating-distribution", handlers.GetRatingDistribution)
				admin.GET("/analytics/recent-activity", handlers.GetRecentActivity)
			}

			// Announcements routes (Admin only)
			announcements := protected.Group("/announcements")
			announcements.Use(middleware.RequireRole(models.RoleAdmin))
			{
				announcements.GET("", handlers.GetAllAnnouncements)
				announcements.POST("", handlers.CreateAnnouncement)
				announcements.PUT("/:id", handlers.UpdateAnnouncement)
				announcements.DELETE("/:id", handlers.DeleteAnnouncement)
				announcements.PUT("/:id/toggle", handlers.ToggleAnnouncement)
			}

			// Settings routes (Admin only)
			settings := protected.Group("/settings")
			settings.Use(middleware.RequireRole(models.RoleAdmin))
			{
				settings.GET("", handlers.GetAllSettings)
				settings.GET("/:key", handlers.GetSetting)
				settings.PUT("/:key", handlers.UpdateSetting)
				settings.PUT("/bulk", handlers.UpdateBulkSettings)
				settings.POST("", handlers.CreateSetting)
				settings.DELETE("/:key", handlers.DeleteSetting)
			}

			// Registrar routes
			registrar := protected.Group("/registrar")
			registrar.Use(middleware.RequireRole(models.RoleAdmin, models.RoleRegistrar))
			{
				registrar.GET("/portfolios", handlers.GetAllPortfolios)
				registrar.POST("/approve/:id", handlers.ApprovePortfolio)
				registrar.POST("/reject/:id", handlers.RejectPortfolio)
				registrar.GET("/students", handlers.GetStudents) // Registrar uchun talabalar
			}

			// Employer routes
			employer := protected.Group("/employer")
			employer.Use(middleware.RequireRole(models.RoleAdmin, models.RoleEmployer))
			{
				employer.GET("/students", handlers.GetStudents)
				employer.GET("/students/:id", handlers.GetStudentDetails)
			}

			// AI routes - barcha autentifikatsiya qilingan foydalanuvchilar uchun
			ai := protected.Group("/ai")
			{
				ai.POST("/chat", handlers.AIChat)
				ai.POST("/analyze-portfolio", handlers.AnalyzePortfolio)
				ai.POST("/quick-analyze", handlers.QuickAnalyze)
				ai.GET("/suggestions", handlers.GetAISuggestions)
				// Yangi fayl tahlil endpoint'lari
				ai.POST("/analyze-file", handlers.AnalyzeFile)
				ai.POST("/detect-ai", handlers.DetectAIContent)
				ai.POST("/analyze-portfolio-files", handlers.AnalyzePortfolioFiles)
				// OCR va tarix endpoint'lari
				ai.POST("/extract-text", handlers.ExtractTextFromImage)
				ai.GET("/analysis-history", handlers.GetAnalysisHistory)
				ai.GET("/analysis-stats", handlers.GetAnalysisStats)
				ai.POST("/save-analysis", handlers.SaveAnalysisResult)
				// Export va yangi endpoint'lar
				ai.GET("/export-history", handlers.ExportAnalysisHistory)
				ai.POST("/compare-texts", handlers.CompareTexts)
				ai.POST("/suggest-improvements", handlers.SuggestTextImprovements)
				ai.POST("/batch-analyze", handlers.BatchAnalyze)
				// Portfolio takomillashtirish endpoint'lari
				ai.GET("/portfolio-suggestions/:id", handlers.GetPortfolioImprovementSuggestions)
				ai.POST("/improve-text", handlers.ImproveText)
				ai.POST("/generate-description", handlers.GeneratePortfolioDescription)
				ai.POST("/career-advice", handlers.GetCareerAdvice)
			}
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "time": time.Now()})
	})

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Server to'xtatilmoqda...")
		database.Close()
		cache.Close()
		os.Exit(0)
	}()

	// Server ishga tushirish
	log.Printf("🚀 Server %s portda ishlamoqda...", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("❌ Server ishga tushmadi: %v", err)
	}
}

func createDefaultAdmin() {
	var exists bool
	database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@kuafcv.uz')`).Scan(&exists)

	if !exists {
		hash, _ := auth.HashPassword("admin123")
		_, err := database.DB.Exec(`
			INSERT INTO users (id, email, password_hash, role, full_name)
			VALUES ('admin-001', 'admin@kuafcv.uz', $1, 'ADMIN', 'Administrator')
		`, hash)
		if err == nil {
			log.Println("✅ Default admin yaratildi: admin@kuafcv.uz / admin123")
		}
	}
}
