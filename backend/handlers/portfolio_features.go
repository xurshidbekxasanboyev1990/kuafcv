// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// ==================== PORTFOLIO VIEWS ====================

// POST /api/portfolio/:id/view - Record portfolio view
func RecordPortfolioView(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	// Get viewer info
	viewerIP := c.ClientIP()
	viewerAgent := c.GetHeader("User-Agent")

	// Check if already viewed today (for unique views)
	var existingView int
	if userID != "" {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM portfolio_views 
			WHERE portfolio_id = $1 AND viewer_id = $2 AND DATE(viewed_at) = CURRENT_DATE
		`, portfolioID, userID).Scan(&existingView)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM portfolio_views 
			WHERE portfolio_id = $1 AND viewer_ip = $2 AND DATE(viewed_at) = CURRENT_DATE
		`, portfolioID, viewerIP).Scan(&existingView)
	}

	// Insert view record
	var viewerIDPtr *string
	if userID != "" {
		viewerIDPtr = &userID
	}

	_, err := database.DB.Exec(`
		INSERT INTO portfolio_views (portfolio_id, viewer_id, viewer_role, viewer_ip, viewer_agent)
		VALUES ($1, $2, $3, $4, $5)
	`, portfolioID, viewerIDPtr, string(role), viewerIP, viewerAgent)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ko'rishni saqlashda xatolik",
			Code:    500,
		})
		return
	}

	// Update view count
	database.DB.Exec(`
		UPDATE portfolio_items SET view_count = (
			SELECT COUNT(DISTINCT COALESCE(viewer_id, viewer_ip)) FROM portfolio_views WHERE portfolio_id = $1
		) WHERE id = $1
	`, portfolioID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"is_new":  existingView == 0,
	})
}

// GET /api/portfolio/:id/views - Get portfolio view statistics
func GetPortfolioViews(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	// Check ownership or admin/registrar
	var ownerID string
	err := database.DB.QueryRow(`SELECT owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	if ownerID != userID && role != models.RoleAdmin && role != models.RoleRegistrar {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu statistikani ko'rish huquqi yo'q",
			Code:    403,
		})
		return
	}

	// Get total views
	var totalViews, uniqueViews int
	database.DB.QueryRow(`
		SELECT COUNT(*), COUNT(DISTINCT COALESCE(viewer_id, viewer_ip))
		FROM portfolio_views WHERE portfolio_id = $1
	`, portfolioID).Scan(&totalViews, &uniqueViews)

	// Get views by day (last 30 days)
	rows, _ := database.DB.Query(`
		SELECT DATE(viewed_at) as view_date, COUNT(*) as views
		FROM portfolio_views 
		WHERE portfolio_id = $1 AND viewed_at >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(viewed_at)
		ORDER BY view_date DESC
	`, portfolioID)
	defer rows.Close()

	var dailyViews []map[string]interface{}
	for rows.Next() {
		var date time.Time
		var count int
		rows.Scan(&date, &count)
		dailyViews = append(dailyViews, map[string]interface{}{
			"date":  date.Format("2006-01-02"),
			"views": count,
		})
	}

	// Get views by role
	roleRows, _ := database.DB.Query(`
		SELECT COALESCE(viewer_role, 'GUEST') as role, COUNT(*) as views
		FROM portfolio_views 
		WHERE portfolio_id = $1
		GROUP BY viewer_role
	`, portfolioID)
	defer roleRows.Close()

	viewsByRole := make(map[string]int)
	for roleRows.Next() {
		var r string
		var count int
		roleRows.Scan(&r, &count)
		viewsByRole[r] = count
	}

	// Get recent viewers (for owner/admin)
	var recentViewers []map[string]interface{}
	viewerRows, _ := database.DB.Query(`
		SELECT pv.viewer_id, u.full_name, u.role, pv.viewed_at
		FROM portfolio_views pv
		LEFT JOIN users u ON pv.viewer_id = u.id
		WHERE pv.portfolio_id = $1 AND pv.viewer_id IS NOT NULL
		ORDER BY pv.viewed_at DESC
		LIMIT 20
	`, portfolioID)
	defer viewerRows.Close()

	for viewerRows.Next() {
		var viewerID sql.NullString
		var fullName sql.NullString
		var viewerRole sql.NullString
		var viewedAt time.Time
		viewerRows.Scan(&viewerID, &fullName, &viewerRole, &viewedAt)

		if viewerID.Valid {
			recentViewers = append(recentViewers, map[string]interface{}{
				"viewer_id": viewerID.String,
				"name":      fullName.String,
				"role":      viewerRole.String,
				"viewed_at": viewedAt,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_views":    totalViews,
		"unique_views":   uniqueViews,
		"daily_views":    dailyViews,
		"views_by_role":  viewsByRole,
		"recent_viewers": recentViewers,
	})
}

// ==================== PORTFOLIO RATINGS ====================

// POST /api/portfolio/:id/rate - Rate a portfolio
func RatePortfolio(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	// Only employers and admins can rate
	if role != models.RoleEmployer && role != models.RoleAdmin && role != models.RoleRegistrar {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat ish beruvchilar baholashi mumkin",
			Code:    403,
		})
		return
	}

	var req struct {
		Rating int    `json:"rating" binding:"required,min=1,max=5"`
		Review string `json:"review"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Reyting 1 dan 5 gacha bo'lishi kerak",
			Code:    400,
		})
		return
	}

	// Check if portfolio exists and is approved
	var status string
	err := database.DB.QueryRow(`SELECT approval_status FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	if status != "APPROVED" {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_status",
			Message: "Faqat tasdiqlangan portfoliolarni baholash mumkin",
			Code:    400,
		})
		return
	}

	// Upsert rating
	_, err = database.DB.Exec(`
		INSERT INTO portfolio_ratings (portfolio_id, user_id, rating, review)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (portfolio_id, user_id) 
		DO UPDATE SET rating = $3, review = $4, updated_at = NOW()
	`, portfolioID, userID, req.Rating, req.Review)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Reytingni saqlashda xatolik",
			Code:    500,
		})
		return
	}

	// Get updated average
	var avgRating float64
	var ratingCount int
	database.DB.QueryRow(`
		SELECT COALESCE(AVG(rating), 0), COUNT(*) 
		FROM portfolio_ratings WHERE portfolio_id = $1
	`, portfolioID).Scan(&avgRating, &ratingCount)

	// Update portfolio rating stats
	database.DB.Exec(`
		UPDATE portfolio_items SET rating_avg = $1, rating_count = $2 WHERE id = $3
	`, avgRating, ratingCount, portfolioID)

	// Get rater name and portfolio info for notification
	var raterName, portfolioTitle, ownerID string
	database.DB.QueryRow(`SELECT full_name FROM users WHERE id = $1`, userID).Scan(&raterName)
	database.DB.QueryRow(`SELECT title, owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&portfolioTitle, &ownerID)

	// Create notification for portfolio owner
	if ownerID != userID {
		reviewText := ""
		if req.Review != "" {
			reviewText = ": \"" + req.Review + "\""
		}
		notifMessage := fmt.Sprintf("%s portfoliongizni %d yulduz bilan baholadi: \"%s\"%s", raterName, req.Rating, portfolioTitle, reviewText)
		notifMetadata := fmt.Sprintf(`{"portfolio_id":"%s","rater_id":"%s","rater_name":"%s","rating":%d}`, portfolioID, userID, raterName, req.Rating)

		// Save to database
		var notifID int
		database.DB.QueryRow(`
			INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
			VALUES ($1, 'rating', 'Yangi baho', $2, $3, $4::jsonb)
			RETURNING id
		`, ownerID, notifMessage, "/portfolio", notifMetadata).Scan(&notifID)

		// Send via WebSocket
		SendNotification(ownerID, NotificationMessage{
			ID:        notifID,
			Type:      "rating",
			Title:     "Yangi baho",
			Message:   notifMessage,
			Link:      "/portfolio",
			Metadata:  notifMetadata,
			CreatedAt: time.Now(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Reyting saqlandi",
		"avg_rating":   avgRating,
		"rating_count": ratingCount,
	})
}

// GET /api/portfolio/:id/ratings - Get portfolio ratings
func GetPortfolioRatings(c *gin.Context) {
	portfolioID := c.Param("id")

	// Get average and count
	var avgRating float64
	var ratingCount int
	database.DB.QueryRow(`
		SELECT COALESCE(AVG(rating), 0), COUNT(*) 
		FROM portfolio_ratings WHERE portfolio_id = $1
	`, portfolioID).Scan(&avgRating, &ratingCount)

	// Get rating distribution
	var dist [5]int
	distRows, _ := database.DB.Query(`
		SELECT rating, COUNT(*) 
		FROM portfolio_ratings 
		WHERE portfolio_id = $1
		GROUP BY rating
	`, portfolioID)
	defer distRows.Close()

	for distRows.Next() {
		var rating, count int
		distRows.Scan(&rating, &count)
		if rating >= 1 && rating <= 5 {
			dist[rating-1] = count
		}
	}

	// Get reviews with ratings
	rows, _ := database.DB.Query(`
		SELECT pr.rating, pr.review, pr.created_at, pr.updated_at,
			   u.id, u.full_name, u.role
		FROM portfolio_ratings pr
		JOIN users u ON pr.user_id = u.id
		WHERE pr.portfolio_id = $1 AND pr.review IS NOT NULL AND pr.review != ''
		ORDER BY pr.created_at DESC
		LIMIT 50
	`, portfolioID)
	defer rows.Close()

	var reviews []map[string]interface{}
	for rows.Next() {
		var rating int
		var review sql.NullString
		var createdAt, updatedAt time.Time
		var userID, fullName, userRole string
		rows.Scan(&rating, &review, &createdAt, &updatedAt, &userID, &fullName, &userRole)

		reviews = append(reviews, map[string]interface{}{
			"rating":     rating,
			"review":     review.String,
			"created_at": createdAt,
			"updated_at": updatedAt,
			"user": map[string]interface{}{
				"id":        userID,
				"full_name": fullName,
				"role":      userRole,
			},
		})
	}

	// Check if current user has rated
	userID := c.GetString("user_id")
	var userRating *int
	var userReview *string
	if userID != "" {
		var r int
		var rv sql.NullString
		err := database.DB.QueryRow(`
			SELECT rating, review FROM portfolio_ratings 
			WHERE portfolio_id = $1 AND user_id = $2
		`, portfolioID, userID).Scan(&r, &rv)
		if err == nil {
			userRating = &r
			if rv.Valid {
				userReview = &rv.String
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"avg_rating":   avgRating,
		"rating_count": ratingCount,
		"distribution": dist,
		"reviews":      reviews,
		"user_rating":  userRating,
		"user_review":  userReview,
	})
}

// ==================== PORTFOLIO COMMENTS ====================

// POST /api/portfolio/:id/comments - Add comment to portfolio
func AddPortfolioComment(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	var req struct {
		Content   string `json:"content" binding:"required"`
		ParentID  *int   `json:"parent_id"`
		IsPrivate bool   `json:"is_private"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Izoh matni kiritilishi shart",
			Code:    400,
		})
		return
	}

	// Check if portfolio exists
	var exists bool
	database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM portfolio_items WHERE id = $1)`, portfolioID).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	// Insert comment
	var commentID int
	err := database.DB.QueryRow(`
		INSERT INTO portfolio_comments (portfolio_id, user_id, parent_id, content, is_private)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, portfolioID, userID, req.ParentID, req.Content, req.IsPrivate).Scan(&commentID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Izohni saqlashda xatolik",
			Code:    500,
		})
		return
	}

	// Get commenter name and portfolio info for notification
	var commenterName, portfolioTitle, ownerID string
	database.DB.QueryRow(`SELECT full_name FROM users WHERE id = $1`, userID).Scan(&commenterName)
	database.DB.QueryRow(`SELECT title, owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&portfolioTitle, &ownerID)

	// Update comment count
	database.DB.Exec(`UPDATE portfolio_items SET comment_count = comment_count + 1 WHERE id = $1`, portfolioID)

	// Create notification for portfolio owner
	if ownerID != userID {
		notifMessage := commenterName + " portfoliongizga izoh qoldirdi: \"" + portfolioTitle + "\""
		notifMetadata := fmt.Sprintf(`{"portfolio_id":"%s","commenter_id":"%s","commenter_name":"%s","comment_id":%d}`, portfolioID, userID, commenterName, commentID)

		// Save to database
		var notifID int
		database.DB.QueryRow(`
			INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
			VALUES ($1, 'comment', 'Yangi izoh', $2, $3, $4::jsonb)
			RETURNING id
		`, ownerID, notifMessage, "/portfolio", notifMetadata).Scan(&notifID)

		// Send via WebSocket
		SendNotification(ownerID, NotificationMessage{
			ID:        notifID,
			Type:      "comment",
			Title:     "Yangi izoh",
			Message:   notifMessage,
			Link:      "/portfolio",
			Metadata:  notifMetadata,
			CreatedAt: time.Now(),
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"comment_id": commentID,
		"message":    "Izoh qo'shildi",
	})
}

// GET /api/portfolio/:id/comments - Get portfolio comments
func GetPortfolioComments(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	// Check if user is owner
	var ownerID string
	database.DB.QueryRow(`SELECT owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID)
	isOwner := ownerID == userID

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	isAdmin := role == models.RoleAdmin || role == models.RoleRegistrar

	// Get comments
	query := `
		SELECT c.id, c.content, c.parent_id, c.is_private, c.is_edited, 
			   c.created_at, c.updated_at, c.user_id,
			   u.full_name, u.role
		FROM portfolio_comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.portfolio_id = $1
	`

	// If not owner/admin, don't show private comments (except own)
	if !isOwner && !isAdmin {
		query += ` AND (c.is_private = false OR c.user_id = $2)`
	}
	query += ` ORDER BY c.created_at DESC`

	var rows *sql.Rows
	var err error
	if !isOwner && !isAdmin {
		rows, err = database.DB.Query(query, portfolioID, userID)
	} else {
		rows, err = database.DB.Query(query, portfolioID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Izohlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type Comment struct {
		ID        int                    `json:"id"`
		Content   string                 `json:"content"`
		ParentID  *int                   `json:"parent_id"`
		IsPrivate bool                   `json:"is_private"`
		IsEdited  bool                   `json:"is_edited"`
		CreatedAt time.Time              `json:"created_at"`
		UpdatedAt time.Time              `json:"updated_at"`
		User      map[string]interface{} `json:"user"`
		CanEdit   bool                   `json:"can_edit"`
		Replies   []Comment              `json:"replies,omitempty"`
	}

	commentsMap := make(map[int]*Comment)
	var rootComments []*Comment

	for rows.Next() {
		var c Comment
		var parentID sql.NullInt64
		var userID, fullName, userRole string

		rows.Scan(&c.ID, &c.Content, &parentID, &c.IsPrivate, &c.IsEdited,
			&c.CreatedAt, &c.UpdatedAt, &userID, &fullName, &userRole)

		if parentID.Valid {
			pid := int(parentID.Int64)
			c.ParentID = &pid
		}

		c.User = map[string]interface{}{
			"id":        userID,
			"full_name": fullName,
			"role":      userRole,
		}
		c.CanEdit = (userID == c.User["id"]) || isAdmin

		commentsMap[c.ID] = &c

		if c.ParentID == nil {
			rootComments = append(rootComments, &c)
		}
	}

	// Build reply tree
	for _, c := range commentsMap {
		if c.ParentID != nil {
			if parent, ok := commentsMap[*c.ParentID]; ok {
				parent.Replies = append(parent.Replies, *c)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"comments": rootComments,
		"total":    len(commentsMap),
	})
}

// PUT /api/portfolio/comments/:id - Update comment
func UpdatePortfolioComment(c *gin.Context) {
	commentID := c.Param("id")
	userID := c.GetString("user_id")

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Izoh matni kiritilishi shart",
			Code:    400,
		})
		return
	}

	// Check ownership
	var commentOwnerID string
	err := database.DB.QueryRow(`SELECT user_id FROM portfolio_comments WHERE id = $1`, commentID).Scan(&commentOwnerID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Izoh topilmadi",
			Code:    404,
		})
		return
	}

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	if commentOwnerID != userID && role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu izohni o'zgartirish huquqi yo'q",
			Code:    403,
		})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE portfolio_comments 
		SET content = $1, is_edited = true, updated_at = NOW()
		WHERE id = $2
	`, req.Content, commentID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Izohni yangilashda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Izoh yangilandi",
	})
}

// DELETE /api/portfolio/comments/:id - Delete comment
func DeletePortfolioComment(c *gin.Context) {
	commentID := c.Param("id")
	userID := c.GetString("user_id")

	// Check ownership and get portfolio_id
	var commentOwnerID, portfolioID string
	err := database.DB.QueryRow(`SELECT user_id, portfolio_id FROM portfolio_comments WHERE id = $1`, commentID).Scan(&commentOwnerID, &portfolioID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Izoh topilmadi",
			Code:    404,
		})
		return
	}

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	if commentOwnerID != userID && role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu izohni o'chirish huquqi yo'q",
			Code:    403,
		})
		return
	}

	_, err = database.DB.Exec(`DELETE FROM portfolio_comments WHERE id = $1`, commentID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Izohni o'chirishda xatolik",
			Code:    500,
		})
		return
	}

	// Decrement comment count
	database.DB.Exec(`UPDATE portfolio_items SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1`, portfolioID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Izoh o'chirildi",
	})
}

// ==================== PORTFOLIO BOOKMARKS ====================

// POST /api/portfolio/:id/bookmark - Toggle bookmark
func TogglePortfolioBookmark(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	var req struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&req)

	// Check if already bookmarked
	var exists bool
	database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM portfolio_bookmarks WHERE portfolio_id = $1 AND user_id = $2)
	`, portfolioID, userID).Scan(&exists)

	if exists {
		// Remove bookmark
		database.DB.Exec(`DELETE FROM portfolio_bookmarks WHERE portfolio_id = $1 AND user_id = $2`, portfolioID, userID)
		// Decrement bookmark_count
		database.DB.Exec(`UPDATE portfolio_items SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = $1`, portfolioID)
		c.JSON(http.StatusOK, gin.H{
			"success":    true,
			"bookmarked": false,
			"message":    "Saqlangan ro'yxatdan olib tashlandi",
		})
	} else {
		// Add bookmark
		database.DB.Exec(`
			INSERT INTO portfolio_bookmarks (portfolio_id, user_id, note) VALUES ($1, $2, $3)
		`, portfolioID, userID, req.Note)
		// Increment bookmark_count
		database.DB.Exec(`UPDATE portfolio_items SET bookmark_count = bookmark_count + 1 WHERE id = $1`, portfolioID)
		c.JSON(http.StatusOK, gin.H{
			"success":    true,
			"bookmarked": true,
			"message":    "Saqlandi",
		})
	}
}

// GET /api/bookmarks - Get user's bookmarked portfolios
func GetMyBookmarks(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := database.DB.Query(`
		SELECT pb.portfolio_id, pb.note, pb.created_at,
			   p.title, p.approval_status, p.rating_avg, p.view_count,
			   u.id as student_id, u.full_name, u.student_id as student_number
		FROM portfolio_bookmarks pb
		JOIN portfolio_items p ON pb.portfolio_id = p.id
		JOIN users u ON p.owner_id = u.id
		WHERE pb.user_id = $1
		ORDER BY pb.created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Saqlangan portfoliolarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	var bookmarks []map[string]interface{}
	for rows.Next() {
		var portfolioID, title, status, studentID, fullName string
		var studentNumber sql.NullString
		var note sql.NullString
		var createdAt time.Time
		var ratingAvg float64
		var viewCount int

		rows.Scan(&portfolioID, &note, &createdAt, &title, &status, &ratingAvg, &viewCount,
			&studentID, &fullName, &studentNumber)

		bookmarks = append(bookmarks, map[string]interface{}{
			"portfolio_id": portfolioID,
			"note":         note.String,
			"created_at":   createdAt,
			"portfolio": map[string]interface{}{
				"title":      title,
				"status":     status,
				"rating_avg": ratingAvg,
				"view_count": viewCount,
			},
			"student": map[string]interface{}{
				"id":             studentID,
				"full_name":      fullName,
				"student_number": studentNumber.String,
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"bookmarks": bookmarks,
		"total":     len(bookmarks),
	})
}

// ==================== PDF EXPORT ====================

// GET /api/portfolio/:id/export/pdf - Export portfolio as PDF (returns data for frontend PDF generation)
func ExportPortfolioPDF(c *gin.Context) {
	portfolioID := c.Param("id")

	// Get portfolio with all details
	var portfolio struct {
		ID          string
		Title       string
		Description sql.NullString
		Status      string
		FileURL     sql.NullString
		FileType    sql.NullString
		CreatedAt   time.Time
		UpdatedAt   time.Time
		ViewCount   int
		RatingAvg   float64
		RatingCount int
	}

	err := database.DB.QueryRow(`
		SELECT id, title, description, approval_status, file_url, file_type, 
			   created_at, updated_at, view_count, rating_avg, rating_count
		FROM portfolio_items WHERE id = $1
	`, portfolioID).Scan(&portfolio.ID, &portfolio.Title, &portfolio.Description,
		&portfolio.Status, &portfolio.FileURL, &portfolio.FileType,
		&portfolio.CreatedAt, &portfolio.UpdatedAt, &portfolio.ViewCount,
		&portfolio.RatingAvg, &portfolio.RatingCount)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	// Get student info
	var student struct {
		FullName    string
		Email       string
		StudentID   sql.NullString
		StudentData []byte
	}

	database.DB.QueryRow(`
		SELECT u.full_name, u.email, u.student_id, u.student_data
		FROM portfolio_items p
		JOIN users u ON p.owner_id = u.id
		WHERE p.id = $1
	`, portfolioID).Scan(&student.FullName, &student.Email, &student.StudentID, &student.StudentData)

	// Get ratings/reviews
	ratingRows, _ := database.DB.Query(`
		SELECT pr.rating, pr.review, u.full_name, pr.created_at
		FROM portfolio_ratings pr
		JOIN users u ON pr.user_id = u.id
		WHERE pr.portfolio_id = $1 AND pr.review IS NOT NULL
		ORDER BY pr.created_at DESC
		LIMIT 10
	`, portfolioID)
	defer ratingRows.Close()

	var reviews []map[string]interface{}
	for ratingRows.Next() {
		var rating int
		var review sql.NullString
		var reviewerName string
		var createdAt time.Time
		ratingRows.Scan(&rating, &review, &reviewerName, &createdAt)

		reviews = append(reviews, map[string]interface{}{
			"rating":     rating,
			"review":     review.String,
			"reviewer":   reviewerName,
			"created_at": createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"portfolio": map[string]interface{}{
			"id":           portfolio.ID,
			"title":        portfolio.Title,
			"description":  portfolio.Description.String,
			"status":       portfolio.Status,
			"file_url":     portfolio.FileURL.String,
			"file_type":    portfolio.FileType.String,
			"created_at":   portfolio.CreatedAt,
			"updated_at":   portfolio.UpdatedAt,
			"view_count":   portfolio.ViewCount,
			"rating_avg":   portfolio.RatingAvg,
			"rating_count": portfolio.RatingCount,
		},
		"student": map[string]interface{}{
			"full_name":    student.FullName,
			"email":        student.Email,
			"student_id":   student.StudentID.String,
			"student_data": string(student.StudentData),
		},
		"reviews": reviews,
	})
}

// GET /api/portfolio/:id/stats - Get comprehensive portfolio statistics
func GetPortfolioStats(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	// Check ownership
	var ownerID string
	err := database.DB.QueryRow(`SELECT owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)

	if ownerID != userID && role != models.RoleAdmin && role != models.RoleRegistrar {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu statistikani ko'rish huquqi yo'q",
			Code:    403,
		})
		return
	}

	// Get all stats
	var stats struct {
		ViewCount     int
		UniqueViews   int
		RatingAvg     float64
		RatingCount   int
		CommentCount  int
		BookmarkCount int
	}

	database.DB.QueryRow(`
		SELECT view_count, rating_avg, rating_count, comment_count, bookmark_count
		FROM portfolio_items WHERE id = $1
	`, portfolioID).Scan(&stats.ViewCount, &stats.RatingAvg, &stats.RatingCount,
		&stats.CommentCount, &stats.BookmarkCount)

	database.DB.QueryRow(`
		SELECT COUNT(DISTINCT COALESCE(viewer_id, viewer_ip))
		FROM portfolio_views WHERE portfolio_id = $1
	`, portfolioID).Scan(&stats.UniqueViews)

	// Views trend (last 7 days)
	trendRows, _ := database.DB.Query(`
		SELECT DATE(viewed_at), COUNT(*)
		FROM portfolio_views
		WHERE portfolio_id = $1 AND viewed_at >= NOW() - INTERVAL '7 days'
		GROUP BY DATE(viewed_at)
		ORDER BY DATE(viewed_at)
	`, portfolioID)
	defer trendRows.Close()

	viewsTrend := make([]map[string]interface{}, 0)
	for trendRows.Next() {
		var date time.Time
		var count int
		trendRows.Scan(&date, &count)
		viewsTrend = append(viewsTrend, map[string]interface{}{
			"date":  date.Format("2006-01-02"),
			"views": count,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_views":    stats.ViewCount,
		"unique_views":   stats.UniqueViews,
		"rating_avg":     stats.RatingAvg,
		"rating_count":   stats.RatingCount,
		"comment_count":  stats.CommentCount,
		"bookmark_count": stats.BookmarkCount,
		"views_trend":    viewsTrend,
	})
}

// ==================== BOOKMARK COLLECTIONS ====================

// GET /api/bookmarks/collections - Get user's bookmark collections
func GetBookmarkCollections(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := database.DB.Query(`
		SELECT bc.id, bc.name, bc.description, bc.color, bc.created_at,
		       (SELECT COUNT(*) FROM portfolio_bookmarks pb WHERE pb.collection_id = bc.id) as bookmark_count
		FROM bookmark_collections bc
		WHERE bc.user_id = $1
		ORDER BY bc.created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kolleksiyalarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type Collection struct {
		ID            int       `json:"id"`
		Name          string    `json:"name"`
		Description   string    `json:"description"`
		Color         string    `json:"color"`
		BookmarkCount int       `json:"bookmark_count"`
		CreatedAt     time.Time `json:"created_at"`
	}

	collections := []Collection{}
	for rows.Next() {
		var col Collection
		var desc sql.NullString
		rows.Scan(&col.ID, &col.Name, &desc, &col.Color, &col.CreatedAt, &col.BookmarkCount)
		if desc.Valid {
			col.Description = desc.String
		}
		collections = append(collections, col)
	}

	c.JSON(http.StatusOK, gin.H{"collections": collections})
}

// POST /api/bookmarks/collections - Create new collection
func CreateBookmarkCollection(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Nomi kerak",
			Code:    400,
		})
		return
	}

	color := req.Color
	if color == "" {
		color = "#ef4444"
	}

	var collectionID int
	err := database.DB.QueryRow(`
		INSERT INTO bookmark_collections (user_id, name, description, color)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, userID, req.Name, req.Description, color).Scan(&collectionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kolleksiya yaratishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":       true,
		"collection_id": collectionID,
		"message":       "Kolleksiya yaratildi",
	})
}

// PUT /api/bookmarks/collections/:id - Update collection
func UpdateBookmarkCollection(c *gin.Context) {
	userID := c.GetString("user_id")
	collectionID := c.Param("id")

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri",
			Code:    400,
		})
		return
	}

	result, err := database.DB.Exec(`
		UPDATE bookmark_collections 
		SET name = COALESCE(NULLIF($1, ''), name),
		    description = $2,
		    color = COALESCE(NULLIF($3, ''), color)
		WHERE id = $4 AND user_id = $5
	`, req.Name, req.Description, req.Color, collectionID, userID)

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
			Message: "Kolleksiya topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Yangilandi",
	})
}

// DELETE /api/bookmarks/collections/:id - Delete collection
func DeleteBookmarkCollection(c *gin.Context) {
	userID := c.GetString("user_id")
	collectionID := c.Param("id")

	result, err := database.DB.Exec(`
		DELETE FROM bookmark_collections WHERE id = $1 AND user_id = $2
	`, collectionID, userID)

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
			Message: "Kolleksiya topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "O'chirildi",
	})
}

// PUT /api/bookmarks/:portfolio_id/collection - Move bookmark to collection
func MoveBookmarkToCollection(c *gin.Context) {
	userID := c.GetString("user_id")
	portfolioID := c.Param("portfolio_id")

	var req struct {
		CollectionID *int   `json:"collection_id"`
		Notes        string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri",
			Code:    400,
		})
		return
	}

	// Verify collection belongs to user if specified
	if req.CollectionID != nil {
		var ownerID string
		err := database.DB.QueryRow(`SELECT user_id FROM bookmark_collections WHERE id = $1`, req.CollectionID).Scan(&ownerID)
		if err != nil || ownerID != userID {
			c.JSON(http.StatusForbidden, models.APIError{
				Error:   "forbidden",
				Message: "Bu kolleksiya sizga tegishli emas",
				Code:    403,
			})
			return
		}
	}

	_, err := database.DB.Exec(`
		UPDATE portfolio_bookmarks 
		SET collection_id = $1, notes = $2
		WHERE portfolio_id = $3 AND user_id = $4
	`, req.CollectionID, req.Notes, portfolioID, userID)

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
		Message: "Bookmark yangilandi",
	})
}

// GET /api/bookmarks/collections/:id/bookmarks - Get bookmarks in collection
func GetCollectionBookmarks(c *gin.Context) {
	userID := c.GetString("user_id")
	collectionID := c.Param("id")

	// Verify collection belongs to user
	var ownerID string
	err := database.DB.QueryRow(`SELECT user_id FROM bookmark_collections WHERE id = $1`, collectionID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu kolleksiya sizga tegishli emas",
			Code:    403,
		})
		return
	}

	rows, err := database.DB.Query(`
		SELECT pb.portfolio_id, pb.notes, pb.created_at,
			   p.title, p.approval_status, p.rating_avg, p.view_count, p.category,
			   u.id as student_id, u.full_name, u.student_id as student_number
		FROM portfolio_bookmarks pb
		JOIN portfolio_items p ON pb.portfolio_id = p.id
		JOIN users u ON p.owner_id = u.id
		WHERE pb.user_id = $1 AND pb.collection_id = $2
		ORDER BY pb.created_at DESC
	`, userID, collectionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type Bookmark struct {
		PortfolioID string    `json:"portfolio_id"`
		Notes       string    `json:"notes"`
		CreatedAt   time.Time `json:"created_at"`
		Portfolio   struct {
			Title     string  `json:"title"`
			Status    string  `json:"status"`
			RatingAvg float64 `json:"rating_avg"`
			ViewCount int     `json:"view_count"`
			Category  string  `json:"category"`
		} `json:"portfolio"`
		Student struct {
			ID            string `json:"id"`
			FullName      string `json:"full_name"`
			StudentNumber string `json:"student_number"`
		} `json:"student"`
	}

	bookmarks := []Bookmark{}
	for rows.Next() {
		var b Bookmark
		var notes, studentNum sql.NullString
		rows.Scan(&b.PortfolioID, &notes, &b.CreatedAt,
			&b.Portfolio.Title, &b.Portfolio.Status, &b.Portfolio.RatingAvg, &b.Portfolio.ViewCount, &b.Portfolio.Category,
			&b.Student.ID, &b.Student.FullName, &studentNum)
		if notes.Valid {
			b.Notes = notes.String
		}
		if studentNum.Valid {
			b.Student.StudentNumber = studentNum.String
		}
		bookmarks = append(bookmarks, b)
	}

	c.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}
