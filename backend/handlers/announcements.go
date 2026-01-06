package handlers

import (
	"net/http"
	"strconv"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// Announcement represents an announcement/news item
type Announcement struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Content     string     `json:"content"`
	Type        string     `json:"type"`
	Priority    int        `json:"priority"`
	TargetRoles []string   `json:"target_roles"`
	IsActive    bool       `json:"is_active"`
	IsMarquee   bool       `json:"is_marquee"`
	LinkURL     *string    `json:"link_url,omitempty"`
	LinkText    *string    `json:"link_text,omitempty"`
	ImageURL    *string    `json:"image_url,omitempty"`
	PortfolioID *string    `json:"portfolio_id,omitempty"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	CreatedBy   string     `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// GET /api/announcements/marquee - Get active marquee announcements (Public)
func GetMarqueeAnnouncements(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		role = "ALL"
	}

	rows, err := database.DB.Query(`
		SELECT id, title, content, type, priority, target_roles, is_active, is_marquee, 
			   link_url, link_text, image_url, portfolio_id, start_date, end_date, 
			   created_by, created_at, updated_at
		FROM announcements 
		WHERE is_active = true 
		  AND is_marquee = true
		  AND (start_date <= NOW() OR start_date IS NULL)
		  AND (end_date >= NOW() OR end_date IS NULL)
		  AND ('ALL' = ANY(target_roles) OR $1 = ANY(target_roles))
		ORDER BY priority DESC, created_at DESC
		LIMIT 20
	`, role)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "E'lonlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	var announcements []Announcement
	for rows.Next() {
		var a Announcement
		err := rows.Scan(
			&a.ID, &a.Title, &a.Content, &a.Type, &a.Priority, pq.Array(&a.TargetRoles),
			&a.IsActive, &a.IsMarquee, &a.LinkURL, &a.LinkText, &a.ImageURL, &a.PortfolioID,
			&a.StartDate, &a.EndDate, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			continue
		}
		announcements = append(announcements, a)
	}

	c.JSON(http.StatusOK, gin.H{
		"announcements": announcements,
		"total":         len(announcements),
	})
}

// GET /api/announcements - Get all announcements (Admin only)
func GetAllAnnouncements(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin e'lonlarni ko'ra oladi",
			Code:    403,
		})
		return
	}

	typeFilter := c.Query("type")
	activeOnly := c.Query("active") == "true"

	query := `
		SELECT id, title, content, type, priority, target_roles, is_active, is_marquee, 
			   link_url, link_text, image_url, portfolio_id, start_date, end_date, 
			   created_by, created_at, updated_at
		FROM announcements 
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if typeFilter != "" {
		query += " AND type = $" + strconv.Itoa(argIndex)
		args = append(args, typeFilter)
		argIndex++
	}

	if activeOnly {
		query += " AND is_active = true"
	}

	query += " ORDER BY priority DESC, created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "E'lonlarni olishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}
	defer rows.Close()

	var announcements []Announcement
	for rows.Next() {
		var a Announcement
		err := rows.Scan(
			&a.ID, &a.Title, &a.Content, &a.Type, &a.Priority, pq.Array(&a.TargetRoles),
			&a.IsActive, &a.IsMarquee, &a.LinkURL, &a.LinkText, &a.ImageURL, &a.PortfolioID,
			&a.StartDate, &a.EndDate, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			continue
		}
		announcements = append(announcements, a)
	}

	c.JSON(http.StatusOK, gin.H{
		"announcements": announcements,
		"total":         len(announcements),
	})
}

// POST /api/announcements - Create announcement (Admin only)
func CreateAnnouncement(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin e'lon qo'sha oladi",
			Code:    403,
		})
		return
	}

	userID := c.GetString("user_id")

	var req struct {
		Title       string   `json:"title" binding:"required"`
		Content     string   `json:"content" binding:"required"`
		Type        string   `json:"type"`
		Priority    int      `json:"priority"`
		TargetRoles []string `json:"target_roles"`
		IsActive    bool     `json:"is_active"`
		IsMarquee   bool     `json:"is_marquee"`
		LinkURL     *string  `json:"link_url"`
		LinkText    *string  `json:"link_text"`
		ImageURL    *string  `json:"image_url"`
		PortfolioID *string  `json:"portfolio_id"`
		StartDate   *string  `json:"start_date"`
		EndDate     *string  `json:"end_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Sarlavha va matn kiritish shart",
			Code:    400,
		})
		return
	}

	// Defaults
	if req.Type == "" {
		req.Type = "news"
	}
	if len(req.TargetRoles) == 0 {
		req.TargetRoles = []string{"ALL"}
	}

	// Parse dates
	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		t, _ := time.Parse(time.RFC3339, *req.StartDate)
		startDate = &t
	}
	if req.EndDate != nil && *req.EndDate != "" {
		t, _ := time.Parse(time.RFC3339, *req.EndDate)
		endDate = &t
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO announcements (title, content, type, priority, target_roles, is_active, is_marquee, 
								   link_url, link_text, image_url, portfolio_id, start_date, end_date, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, NOW()), $13, $14)
		RETURNING id
	`, req.Title, req.Content, req.Type, req.Priority, pq.Array(req.TargetRoles),
		req.IsActive, req.IsMarquee, req.LinkURL, req.LinkText, req.ImageURL,
		req.PortfolioID, startDate, endDate, userID).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "E'lon qo'shishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "E'lon muvaffaqiyatli qo'shildi",
		"id":      id,
	})
}

// PUT /api/announcements/:id - Update announcement (Admin only)
func UpdateAnnouncement(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin e'lonni o'zgartira oladi",
			Code:    403,
		})
		return
	}

	id := c.Param("id")

	var req struct {
		Title       string   `json:"title"`
		Content     string   `json:"content"`
		Type        string   `json:"type"`
		Priority    int      `json:"priority"`
		TargetRoles []string `json:"target_roles"`
		IsActive    *bool    `json:"is_active"`
		IsMarquee   *bool    `json:"is_marquee"`
		LinkURL     *string  `json:"link_url"`
		LinkText    *string  `json:"link_text"`
		ImageURL    *string  `json:"image_url"`
		PortfolioID *string  `json:"portfolio_id"`
		StartDate   *string  `json:"start_date"`
		EndDate     *string  `json:"end_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Noto'g'ri ma'lumot",
			Code:    400,
		})
		return
	}

	// Parse dates
	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		t, _ := time.Parse(time.RFC3339, *req.StartDate)
		startDate = &t
	}
	if req.EndDate != nil && *req.EndDate != "" {
		t, _ := time.Parse(time.RFC3339, *req.EndDate)
		endDate = &t
	}

	result, err := database.DB.Exec(`
		UPDATE announcements SET
			title = COALESCE(NULLIF($1, ''), title),
			content = COALESCE(NULLIF($2, ''), content),
			type = COALESCE(NULLIF($3, ''), type),
			priority = $4,
			target_roles = COALESCE($5, target_roles),
			is_active = COALESCE($6, is_active),
			is_marquee = COALESCE($7, is_marquee),
			link_url = $8,
			link_text = $9,
			image_url = $10,
			portfolio_id = $11,
			start_date = COALESCE($12, start_date),
			end_date = $13,
			updated_at = NOW()
		WHERE id = $14
	`, req.Title, req.Content, req.Type, req.Priority, pq.Array(req.TargetRoles),
		req.IsActive, req.IsMarquee, req.LinkURL, req.LinkText, req.ImageURL,
		req.PortfolioID, startDate, endDate, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "E'lonni yangilashda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "E'lon topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "E'lon yangilandi",
	})
}

// DELETE /api/announcements/:id - Delete announcement (Admin only)
func DeleteAnnouncement(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin e'lonni o'chira oladi",
			Code:    403,
		})
		return
	}

	id := c.Param("id")

	result, err := database.DB.Exec("DELETE FROM announcements WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "E'lonni o'chirishda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "E'lon topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "E'lon o'chirildi",
	})
}

// PUT /api/announcements/:id/toggle - Toggle announcement active status
func ToggleAnnouncement(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin e'lon holatini o'zgartira oladi",
			Code:    403,
		})
		return
	}

	id := c.Param("id")

	var isActive bool
	err := database.DB.QueryRow(`
		UPDATE announcements 
		SET is_active = NOT is_active, updated_at = NOW()
		WHERE id = $1
		RETURNING is_active
	`, id).Scan(&isActive)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "E'lon topilmadi",
			Code:    404,
		})
		return
	}

	status := "faollashtirildi"
	if !isActive {
		status = "o'chirildi"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "E'lon " + status,
		"is_active": isActive,
	})
}
