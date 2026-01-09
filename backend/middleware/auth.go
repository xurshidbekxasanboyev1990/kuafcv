// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package middleware

import (
	"net/http"
	"strings"

	"kuafcv-backend/auth"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		// Try to get token from Authorization header first (preferred method)
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}

		// SECURITY: Only allow query parameter token for WebSocket connections
		// URL parameters appear in logs and browser history - security risk for normal requests
		if token == "" && IsWebSocketRequest(c) {
			token = c.Query("token")
		}

		if token == "" {
			c.JSON(http.StatusUnauthorized, models.APIError{
				Error:   "unauthorized",
				Message: "Authorization kerak",
				Code:    401,
			})
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIError{
				Error:   "invalid_token",
				Message: "Token yaroqsiz yoki muddati tugagan",
				Code:    401,
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("user", &models.User{
			ID:    claims.UserID,
			Email: claims.Email,
			Role:  claims.Role,
		})
		c.Next()
	}
}

func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIError{
				Error:   "unauthorized",
				Message: "Foydalanuvchi topilmadi",
				Code:    401,
			})
			c.Abort()
			return
		}

		role := userRole.(models.Role)
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu amalni bajarishga ruxsat yo'q",
			Code:    403,
		})
		c.Abort()
	}
}
