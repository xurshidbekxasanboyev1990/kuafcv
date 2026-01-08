// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/kuafcv-backend/database"
	"github.com/user/kuafcv-backend/models"
)

// CreateNotification creates a new notification (admin only)
func CreateNotification(c *gin.Context) {
	var req struct {
		Title      string `json:"title" binding:"required"`
		Message    string `json:"message" binding:"required"`
		Type       string `json:"type"`
		TargetRole string `json:"target_role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	notifType := "INFO"
	if req.Type != "" {
		notifType = req.Type
	}

	// Create notification
	notifID := uuid.New().String()
	now := time.Now()

	var targetRole sql.NullString
	if req.TargetRole != "" {
		targetRole = sql.NullString{String: req.TargetRole, Valid: true}
	}

	_, err := database.DB.Exec(`
		INSERT INTO notifications (id, title, message, type, target_role, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, notifID, req.Title, req.Message, notifType, targetRole, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification created successfully",
		"id":      notifID,
	})
}

// GetNotifications returns notifications for current user based on their role
func GetNotifications(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user := userVal.(*models.User)

	rows, err := database.DB.Query(`
		SELECT id, title, message, type, target_role, is_read, created_at
		FROM notifications
		WHERE target_role IS NULL OR target_role = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, user.Role)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	type Notification struct {
		ID         string    `json:"id"`
		Title      string    `json:"title"`
		Message    string    `json:"message"`
		Type       string    `json:"type"`
		TargetRole *string   `json:"target_role"`
		IsRead     bool      `json:"is_read"`
		CreatedAt  time.Time `json:"created_at"`
	}

	notifications := []Notification{}
	for rows.Next() {
		var n Notification
		var targetRole sql.NullString

		err := rows.Scan(&n.ID, &n.Title, &n.Message, &n.Type, &targetRole, &n.IsRead, &n.CreatedAt)
		if err != nil {
			continue
		}

		if targetRole.Valid {
			n.TargetRole = &targetRole.String
		}

		notifications = append(notifications, n)
	}

	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

// MarkNotificationRead marks a notification as read
func MarkNotificationRead(c *gin.Context) {
	notifID := c.Param("id")

	_, err := database.DB.Exec(`
		UPDATE notifications SET is_read = true WHERE id = $1
	`, notifID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// UserNotification struct for personal notifications
type UserNotification struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Link      string    `json:"link"`
	Metadata  string    `json:"metadata"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// GetPersonalNotifications - Shaxsiy bildirishnomalar
func GetPersonalNotifications(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user := userVal.(*models.User)

	rows, err := database.DB.Query(`
		SELECT id, user_id, type, title, message, COALESCE(link, ''), 
		       COALESCE(metadata::text, '{}'), is_read, created_at
		FROM user_notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, user.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch personal notifications"})
		return
	}
	defer rows.Close()

	notifications := []UserNotification{}
	for rows.Next() {
		var n UserNotification
		err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.Link, &n.Metadata, &n.IsRead, &n.CreatedAt)
		if err != nil {
			continue
		}
		notifications = append(notifications, n)
	}

	// Get unread count
	var unreadCount int
	database.DB.QueryRow(`SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false`, user.ID).Scan(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

// MarkPersonalNotificationRead - Shaxsiy bildirishnomani o'qilgan qilish
func MarkPersonalNotificationRead(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user := userVal.(*models.User)
	notifID := c.Param("id")

	result, err := database.DB.Exec(`
		UPDATE user_notifications 
		SET is_read = true 
		WHERE id = $1 AND user_id = $2
	`, notifID, user.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xatolik"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bildirishnoma topilmadi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "O'qildi"})
}

// MarkAllPersonalNotificationsRead - Barcha shaxsiy bildirishnomalarni o'qilgan qilish
func MarkAllPersonalNotificationsRead(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user := userVal.(*models.User)

	_, err := database.DB.Exec(`
		UPDATE user_notifications 
		SET is_read = true 
		WHERE user_id = $1 AND is_read = false
	`, user.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xatolik"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Barcha bildirishnomalar o'qildi"})
}
