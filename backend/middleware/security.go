// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.

// Package middleware provides HTTP middleware functions for the KUAFCV application.
// This file contains security-related middleware for protecting against common web vulnerabilities.
package middleware

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// ===== CONSTANTS =====

// allowedFileExtensions defines safe file extensions that can be served inline.
// Other extensions will be forced to download (Content-Disposition: attachment).
var allowedInlineExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".pdf":  true,
}

// dangerousExtensions are file types that should NEVER be served inline
// as they can execute scripts in the browser.
var dangerousExtensions = map[string]bool{
	".html": true,
	".htm":  true,
	".svg":  true, // SVG can contain JavaScript
	".xml":  true,
	".js":   true,
	".mjs":  true,
	".css":  true,
	".php":  true,
	".asp":  true,
	".aspx": true,
	".jsp":  true,
}

// ===== MIDDLEWARE =====

// SecureStaticFiles returns a middleware that adds security headers to static file responses.
// This prevents XSS attacks from uploaded files and ensures proper content handling.
//
// Security headers added:
//   - X-Content-Type-Options: nosniff - Prevents MIME type sniffing
//   - X-Frame-Options: DENY - Prevents clickjacking
//   - Content-Security-Policy: default-src 'none' - Prevents script execution
//   - Content-Disposition: attachment - Forces download for dangerous files
//
// Usage:
//
//	r.Use(middleware.SecureStaticFiles("/uploads"))
//	r.Static("/uploads", "./uploads")
func SecureStaticFiles(urlPrefix string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only apply to static file routes
		if !strings.HasPrefix(c.Request.URL.Path, urlPrefix) {
			c.Next()
			return
		}

		// Get file extension (lowercase for comparison)
		ext := strings.ToLower(filepath.Ext(c.Request.URL.Path))

		// ===== Security Headers =====

		// Prevent MIME type sniffing - critical for preventing XSS
		// Without this, browsers might execute uploaded files as scripts
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking attacks
		c.Header("X-Frame-Options", "DENY")

		// Strict Content Security Policy for uploaded files
		// This prevents any scripts from executing even if somehow injected
		c.Header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:;")

		// Prevent caching of sensitive files in shared caches
		c.Header("Cache-Control", "private, no-transform")

		// ===== Content-Disposition Logic =====

		// Force download for dangerous file types (XSS prevention)
		if dangerousExtensions[ext] {
			// Extract filename from path for download
			filename := filepath.Base(c.Request.URL.Path)
			c.Header("Content-Disposition", "attachment; filename=\""+sanitizeFilename(filename)+"\"")
			c.Header("Content-Type", "application/octet-stream")
		} else if !allowedInlineExtensions[ext] {
			// Unknown extensions should also be downloaded
			filename := filepath.Base(c.Request.URL.Path)
			c.Header("Content-Disposition", "attachment; filename=\""+sanitizeFilename(filename)+"\"")
		}
		// Allowed inline extensions (images, PDFs) will be served normally

		c.Next()
	}
}

// SecurityHeaders returns a middleware that adds general security headers to all responses.
// These headers provide protection against various common web vulnerabilities.
//
// Headers added:
//   - X-Content-Type-Options: nosniff
//   - X-Frame-Options: DENY
//   - X-XSS-Protection: 1; mode=block
//   - Referrer-Policy: strict-origin-when-cross-origin
//   - Permissions-Policy: various restrictions
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Enable browser XSS filter (legacy but still useful)
		c.Header("X-XSS-Protection", "1; mode=block")

		// Control referrer information
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict browser features/APIs
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")

		c.Next()
	}
}

// ===== HELPER FUNCTIONS =====

// sanitizeFilename removes potentially dangerous characters from filenames
// to prevent header injection attacks in Content-Disposition header.
func sanitizeFilename(filename string) string {
	// Remove any path traversal attempts
	filename = filepath.Base(filename)

	// Remove characters that could break HTTP headers
	replacer := strings.NewReplacer(
		"\"", "_",
		"'", "_",
		"\n", "_",
		"\r", "_",
		";", "_",
		"\\", "_",
	)

	return replacer.Replace(filename)
}

// IsWebSocketRequest checks if the current request is a WebSocket upgrade request.
// This is used to determine if token query parameter should be allowed.
func IsWebSocketRequest(c *gin.Context) bool {
	// Check for WebSocket upgrade headers
	upgrade := c.GetHeader("Upgrade")
	connection := c.GetHeader("Connection")

	return strings.EqualFold(upgrade, "websocket") &&
		strings.Contains(strings.ToLower(connection), "upgrade")
}

// ValidateUploadedFile checks if an uploaded file is safe based on its extension
// and MIME type. Returns an error message if the file is not allowed.
func ValidateUploadedFile(filename string, mimeType string) (bool, string) {
	ext := strings.ToLower(filepath.Ext(filename))

	// Block dangerous file types from being uploaded at all
	blockedExtensions := map[string]bool{
		".exe":  true,
		".dll":  true,
		".bat":  true,
		".cmd":  true,
		".sh":   true,
		".php":  true,
		".asp":  true,
		".aspx": true,
		".jsp":  true,
		".cgi":  true,
	}

	if blockedExtensions[ext] {
		return false, "Bu fayl turi ruxsat etilmagan: " + ext
	}

	// Validate MIME type matches extension (prevent disguised files)
	expectedMimes := map[string][]string{
		".jpg":  {"image/jpeg"},
		".jpeg": {"image/jpeg"},
		".png":  {"image/png"},
		".gif":  {"image/gif"},
		".webp": {"image/webp"},
		".pdf":  {"application/pdf"},
		".doc":  {"application/msword"},
		".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
		".xls":  {"application/vnd.ms-excel"},
		".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
		".svg":  {"image/svg+xml"},
		".mp4":  {"video/mp4"},
		".mp3":  {"audio/mpeg"},
	}

	if expected, ok := expectedMimes[ext]; ok {
		mimeValid := false
		for _, m := range expected {
			if strings.HasPrefix(mimeType, m) {
				mimeValid = true
				break
			}
		}
		if !mimeValid {
			return false, "Fayl turi va kengaytmasi mos emas"
		}
	}

	return true, ""
}

// RateLimitByIP creates a simple in-memory rate limiter per IP address.
// For production with multiple servers, use Redis-based rate limiting instead.
// Note: This is a placeholder - the actual implementation is in ratelimit.go
func RateLimitByIP(requestsPerMinute int) gin.HandlerFunc {
	// Implementation in ratelimit.go
	return func(c *gin.Context) {
		c.Next()
	}
}

// ===== REQUEST VALIDATION =====

// ValidateJSONContentType ensures the request has proper JSON content type
// for POST/PUT/PATCH requests. This prevents content-type confusion attacks.
func ValidateJSONContentType() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		// Only check methods that typically have a body
		if method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch {
			contentType := c.GetHeader("Content-Type")

			// Allow multipart for file uploads
			if strings.HasPrefix(contentType, "multipart/form-data") {
				c.Next()
				return
			}

			// For API endpoints, require JSON
			if strings.HasPrefix(c.Request.URL.Path, "/api/") &&
				!strings.HasPrefix(contentType, "application/json") {
				c.JSON(http.StatusUnsupportedMediaType, gin.H{
					"error":   "unsupported_media_type",
					"message": "Content-Type must be application/json",
					"code":    415,
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
