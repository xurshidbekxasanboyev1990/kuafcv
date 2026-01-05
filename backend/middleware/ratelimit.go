package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

var limiter = &rateLimiter{
	requests: make(map[string][]time.Time),
	limit:    500,         // 500 so'rov (ko'paytirildi)
	window:   time.Minute, // daqiqada
}

// Limitdan chiqariladigan yo'llar
var excludedPaths = []string{
	"/api/ws",
	"/api/settings/public",
	"/api/announcements/marquee",
	"/api/health",
}

func RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ba'zi yo'llar uchun rate limit qo'llanmaydi
		path := c.Request.URL.Path
		for _, excluded := range excludedPaths {
			if strings.HasPrefix(path, excluded) {
				c.Next()
				return
			}
		}

		ip := c.ClientIP()

		limiter.mu.Lock()
		defer limiter.mu.Unlock()

		now := time.Now()
		cutoff := now.Add(-limiter.window)

		// Eski so'rovlarni tozalash
		var recent []time.Time
		for _, t := range limiter.requests[ip] {
			if t.After(cutoff) {
				recent = append(recent, t)
			}
		}
		limiter.requests[ip] = recent

		if len(recent) >= limiter.limit {
			c.JSON(http.StatusTooManyRequests, models.APIError{
				Error:   "rate_limit",
				Message: "Juda ko'p so'rov. Biroz kuting.",
				Code:    429,
			})
			c.Abort()
			return
		}

		limiter.requests[ip] = append(limiter.requests[ip], now)
		c.Next()
	}
}
