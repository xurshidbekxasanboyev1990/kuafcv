// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package middleware

import (
	"fmt"
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

	// Different limits for different user types
	defaultLimit       int
	authenticatedLimit int
	adminBypass        bool

	window time.Duration
}

var limiter = &rateLimiter{
	requests:           make(map[string][]time.Time),
	defaultLimit:       100,  // Anonymous users: 100 req/min
	authenticatedLimit: 500,  // Authenticated users: 500 req/min
	adminBypass:        true, // Admins bypass rate limit
	window:             time.Minute,
}

// Limitdan chiqariladigan yo'llar
var excludedPaths = []string{
	"/api/ws",
	"/api/settings/public",
	"/api/announcements/marquee",
	"/api/health",
	"/api/ready",
}

// getClientIdentifier - Generate unique identifier based on user_id + IP
func getClientIdentifier(c *gin.Context) string {
	userID := c.GetString("user_id")
	ip := c.ClientIP()

	// If authenticated, use user_id + IP combination
	if userID != "" {
		return fmt.Sprintf("user:%s:ip:%s", userID, ip)
	}

	// Anonymous users identified by IP only
	return fmt.Sprintf("ip:%s", ip)
}

// getLimit - Return appropriate limit based on user role
func getLimit(c *gin.Context) int {
	roleVal, exists := c.Get("role")
	if !exists {
		return limiter.defaultLimit
	}

	role, ok := roleVal.(models.Role)
	if !ok {
		return limiter.defaultLimit
	}

	// Admin bypass
	if limiter.adminBypass && role == models.RoleAdmin {
		return -1 // No limit
	}

	// Authenticated users
	if role == models.RoleStudent || role == models.RoleEmployer || role == models.RoleRegistrar {
		return limiter.authenticatedLimit
	}

	return limiter.defaultLimit
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

		identifier := getClientIdentifier(c)
		limit := getLimit(c)

		// Admin bypass
		if limit == -1 {
			c.Next()
			return
		}

		limiter.mu.Lock()
		defer limiter.mu.Unlock()

		now := time.Now()
		cutoff := now.Add(-limiter.window)

		// Eski so'rovlarni tozalash
		var recent []time.Time
		for _, t := range limiter.requests[identifier] {
			if t.After(cutoff) {
				recent = append(recent, t)
			}
		}
		limiter.requests[identifier] = recent

		if len(recent) >= limit {
			c.JSON(http.StatusTooManyRequests, models.APIError{
				Error:   "rate_limit",
				Message: fmt.Sprintf("Juda ko'p so'rov. Limit: %d so'rov/daqiqa. Biroz kuting.", limit),
				Code:    429,
			})
			c.Abort()
			return
		}

		limiter.requests[identifier] = append(limiter.requests[identifier], now)
		c.Next()
	}
}
