// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package middleware

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp    string  `json:"timestamp"`
	RequestID    string  `json:"request_id"`
	Method       string  `json:"method"`
	Path         string  `json:"path"`
	Status       int     `json:"status"`
	Latency      float64 `json:"latency_ms"`
	ClientIP     string  `json:"client_ip"`
	UserAgent    string  `json:"user_agent,omitempty"`
	ErrorMessage string  `json:"error,omitempty"`
	Level        string  `json:"level"`
}

var (
	useJSONLogging = os.Getenv("LOG_FORMAT") == "json"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		// Generate request ID for tracing
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method

		// Determine log level based on status code
		level := "info"
		if status >= 400 && status < 500 {
			level = "warning"
		} else if status >= 500 {
			level = "error"
		}

		// Get error message if exists
		errorMsg := ""
		if len(c.Errors) > 0 {
			errorMsg = c.Errors.String()
		}

		if useJSONLogging {
			// Structured JSON logging for production
			entry := LogEntry{
				Timestamp: time.Now().Format(time.RFC3339),
				RequestID: requestID,
				Method:    method,
				Path:      path,
				Status:    status,
				Latency:   float64(latency.Microseconds()) / 1000.0, // Convert to ms
				ClientIP:  c.ClientIP(),
				UserAgent: c.Request.UserAgent(),
				Level:     level,
			}
			if errorMsg != "" {
				entry.ErrorMessage = errorMsg
			}

			jsonLog, _ := json.Marshal(entry)
			log.Println(string(jsonLog))
		} else {
			// Human-readable logging for development
			emoji := "✅"
			if status >= 400 && status < 500 {
				emoji = "⚠️"
			} else if status >= 500 {
				emoji = "❌"
			}

			log.Printf("%s [%s] %d | %s | %s | %s | %v",
				emoji,
				requestID[:8], // Short request ID
				status,
				method,
				path,
				c.ClientIP(),
				latency,
			)

			if errorMsg != "" {
				log.Printf("   └─ Error: %s", errorMsg)
			}
		}
	}
}
