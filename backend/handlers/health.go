package handlers

import (
	"net/http"
	"time"

	"kuafcv-backend/cache"
	"kuafcv-backend/database"

	"github.com/gin-gonic/gin"
)

// HealthCheck returns basic health status
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"time":   time.Now().Unix(),
	})
}

// ReadinessCheck checks if all dependencies are ready
func ReadinessCheck(c *gin.Context) {
	status := gin.H{
		"status": "ready",
		"time":   time.Now().Unix(),
	}

	// Check database connection
	if database.DB != nil {
		if err := database.DB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":   "not_ready",
				"database": "unavailable",
				"time":     time.Now().Unix(),
			})
			return
		}
		status["database"] = "ok"
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "not_ready",
			"database": "not_connected",
			"time":     time.Now().Unix(),
		})
		return
	}

	// Check Redis connection (optional - don't fail if Redis is down)
	if cache.Client != nil {
		if err := cache.Client.Ping(c.Request.Context()).Err(); err != nil {
			status["redis"] = "unavailable"
		} else {
			status["redis"] = "ok"
		}
	}

	c.JSON(http.StatusOK, status)
}
