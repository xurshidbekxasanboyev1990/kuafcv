package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Personal notification struct
type UserNotification struct {
	ID        int       `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Link      *string   `json:"link,omitempty"`
	Metadata  *string   `json:"metadata,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// GET /api/notifications - Foydalanuvchi uchun bildirishnomalar
func GetNotifications(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	// Get global notifications
	rows, err := database.DB.Query(`
		SELECT n.id, n.title, n.message, n.type, n.target_role, n.created_at,
		       COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
		FROM notifications n
		LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $1
		WHERE n.target_role IS NULL OR n.target_role::text = $2
		ORDER BY n.created_at DESC
		LIMIT 30
	`, userID, userRole)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Bildirishnomalarni olishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var notif models.Notification
		var targetRole *string
		err := rows.Scan(
			&notif.ID, &notif.Title, &notif.Message, &notif.Type,
			&targetRole, &notif.CreatedAt, &notif.IsRead,
		)
		if err != nil {
			continue
		}
		if targetRole != nil {
			role := models.Role(*targetRole)
			notif.TargetRole = &role
		}
		notifications = append(notifications, notif)
	}

	// Get personal notifications (from user_notifications table)
	personalRows, err := database.DB.Query(`
		SELECT id, type, title, message, link, metadata::text, is_read, created_at
		FROM user_notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 30
	`, userID)

	var personalNotifications []UserNotification
	if err == nil {
		defer personalRows.Close()
		for personalRows.Next() {
			var n UserNotification
			var link, metadata sql.NullString
			personalRows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &link, &metadata, &n.IsRead, &n.CreatedAt)
			if link.Valid {
				n.Link = &link.String
			}
			if metadata.Valid {
				n.Metadata = &metadata.String
			}
			personalNotifications = append(personalNotifications, n)
		}
	}

	// Count unread personal notifications
	var unreadCount int
	database.DB.QueryRow(`SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false`, userID).Scan(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"global":       notifications,
		"personal":     personalNotifications,
		"unread_count": unreadCount,
	})
}

// POST /api/notifications - Yangi bildirishnoma (faqat ADMIN)
func CreateNotification(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Title      string       `json:"title" binding:"required"`
		Message    string       `json:"message" binding:"required"`
		Type       string       `json:"type"`
		TargetRole *models.Role `json:"target_role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Sarlavha va xabar kerak",
			Code:    400,
		})
		return
	}

	notifType := "info"
	if req.Type != "" {
		notifType = req.Type
	}

	id := uuid.New().String()
	_, err := database.DB.Exec(`
		INSERT INTO notifications (id, title, message, type, target_role, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, req.Title, req.Message, notifType, req.TargetRole, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Bildirishnoma yaratishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, models.APISuccess{
		Success: true,
		Message: "Bildirishnoma yuborildi",
	})
}

// POST /api/notifications/:id/read - O'qilgan deb belgilash
func MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	notifID := c.Param("id")

	_, err := database.DB.Exec(`
		INSERT INTO notification_reads (notification_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, notifID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "O'qildi",
	})
}

// POST /api/notifications/read-all - Hammasini o'qilgan qilish
func MarkAllAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	_, err := database.DB.Exec(`
		INSERT INTO notification_reads (notification_id, user_id)
		SELECT n.id, $1
		FROM notifications n
		WHERE (n.target_role IS NULL OR n.target_role::text = $2)
		AND NOT EXISTS (
			SELECT 1 FROM notification_reads nr 
			WHERE nr.notification_id = n.id AND nr.user_id = $1
		)
	`, userID, userRole)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Hammasi o'qildi",
	})
}

// GET /api/notifications/personal - Shaxsiy bildirishnomalar
func GetPersonalNotifications(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := database.DB.Query(`
		SELECT id, type, title, message, link, metadata::text, is_read, created_at
		FROM user_notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Bildirishnomalarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	notifications := []UserNotification{}
	for rows.Next() {
		var n UserNotification
		var link, metadata sql.NullString
		err := rows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &link, &metadata, &n.IsRead, &n.CreatedAt)
		if err != nil {
			continue
		}
		if link.Valid {
			n.Link = &link.String
		}
		if metadata.Valid {
			n.Metadata = &metadata.String
		}
		notifications = append(notifications, n)
	}

	// Unread count
	var unreadCount int
	database.DB.QueryRow(`SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false`, userID).Scan(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

// POST /api/notifications/personal/:id/read - Shaxsiy bildirishnomani o'qilgan qilish
func MarkPersonalNotificationRead(c *gin.Context) {
	userID := c.GetString("user_id")
	notifID := c.Param("id")

	result, err := database.DB.Exec(`
		UPDATE user_notifications 
		SET is_read = true 
		WHERE id = $1 AND user_id = $2
	`, notifID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Bildirishnoma topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "O'qildi",
	})
}

// POST /api/notifications/personal/read-all - Barcha shaxsiy bildirishnomalarni o'qilgan qilish
func MarkAllPersonalNotificationsRead(c *gin.Context) {
	userID := c.GetString("user_id")

	_, err := database.DB.Exec(`
		UPDATE user_notifications 
		SET is_read = true 
		WHERE user_id = $1 AND is_read = false
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Barcha bildirishnomalar o'qildi",
	})
}
