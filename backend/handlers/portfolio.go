package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// GET /api/portfolio - O'z portfoliolari
func GetMyPortfolios(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := database.DB.Query(`
		SELECT id, type, title, description, tags, file_url, file_name, mime_type, size_bytes,
		       owner_id, approval_status, approved_by, approved_at, rejection_reason, created_at, updated_at,
		       view_count, rating_avg, rating_count, comment_count, bookmark_count
		FROM portfolio_items
		WHERE owner_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	items := []models.PortfolioItem{}
	for rows.Next() {
		var item models.PortfolioItem
		var tags []string
		err := rows.Scan(
			&item.ID, &item.Type, &item.Title, &item.Description, pq.Array(&tags),
			&item.FileURL, &item.FileName, &item.MimeType, &item.SizeBytes,
			&item.OwnerID, &item.ApprovalStatus, &item.ApprovedBy, &item.ApprovedAt,
			&item.RejectionReason, &item.CreatedAt, &item.UpdatedAt,
			&item.ViewCount, &item.RatingAvg, &item.RatingCount, &item.CommentCount, &item.BookmarkCount,
		)
		if err != nil {
			continue
		}
		item.Tags = tags
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// Ruxsat berilgan fayl turlari
var allowedDocTypes = map[string]bool{
	"application/pdf":    true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // docx
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         true, // xlsx
	"application/vnd.ms-powerpoint":                                             true,
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": true, // pptx
}

var allowedMediaTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"video/mp4":       true,
	"video/mpeg":      true,
	"video/webm":      true,
	"video/quicktime": true, // mov
	"audio/mpeg":      true, // mp3
	"audio/wav":       true,
}

// POST /api/portfolio - Yangi portfolio (fayl bilan)
func CreatePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")

	// FormData dan ma'lumotlarni olish
	title := c.PostForm("title")
	portfolioType := c.PostForm("type")
	description := c.PostForm("description")
	tagsStr := c.PostForm("tags")

	if title == "" || portfolioType == "" {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Sarlavha va tur majburiy",
			Code:    400,
		})
		return
	}

	// Tags ni parse qilish
	var tags []string
	if tagsStr != "" {
		json.Unmarshal([]byte(tagsStr), &tags)
	}
	if tags == nil {
		tags = []string{}
	}

	// Fayl mavjudligini tekshirish
	file, fileHeader, err := c.Request.FormFile("file")
	var fileURL, fileName, mimeType *string
	var sizeBytes *int64

	if err == nil && file != nil {
		defer file.Close()

		// MIME type aniqlash
		contentType := fileHeader.Header.Get("Content-Type")

		// Portfolio turiga qarab fayl turini tekshirish
		isValidFile := false
		if portfolioType == "DOCUMENT" || portfolioType == "CERTIFICATE" {
			isValidFile = allowedDocTypes[contentType]
			if !isValidFile {
				c.JSON(http.StatusBadRequest, models.APIError{
					Error:   "invalid_file",
					Message: "Faqat PDF, DOCX, XLSX, PPTX formatdagi fayllar qabul qilinadi",
					Code:    400,
				})
				return
			}
		} else if portfolioType == "PROJECT" || portfolioType == "MEDIA" || portfolioType == "OTHER" {
			isValidFile = allowedDocTypes[contentType] || allowedMediaTypes[contentType]
			if !isValidFile {
				c.JSON(http.StatusBadRequest, models.APIError{
					Error:   "invalid_file",
					Message: "Faqat ruxsat berilgan fayl turlari qabul qilinadi (PDF, DOCX, JPEG, PNG, MP4 va h.k.)",
					Code:    400,
				})
				return
			}
		}

		// Fayl hajmini tekshirish (50MB max)
		if fileHeader.Size > 50*1024*1024 {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "file_too_large",
				Message: "Fayl hajmi 50MB dan oshmasligi kerak",
				Code:    400,
			})
			return
		}

		// Faylni saqlash
		ext := ""
		if idx := len(fileHeader.Filename) - 1; idx >= 0 {
			for i := idx; i >= 0; i-- {
				if fileHeader.Filename[i] == '.' {
					ext = fileHeader.Filename[i:]
					break
				}
			}
		}

		newFileName := uuid.New().String() + ext
		filePath := "uploads/portfolios/" + newFileName

		// Papka mavjudligini tekshirish
		os.MkdirAll("uploads/portfolios", 0755)

		if err := c.SaveUploadedFile(fileHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "upload_error",
				Message: "Fayl yuklashda xatolik",
				Code:    500,
			})
			return
		}

		fileURLStr := "/" + filePath
		fileURL = &fileURLStr
		fileNameStr := fileHeader.Filename
		fileName = &fileNameStr
		mimeType = &contentType
		size := fileHeader.Size
		sizeBytes = &size
	}

	id := uuid.New().String()
	descPtr := &description
	if description == "" {
		descPtr = nil
	}

	_, err = database.DB.Exec(`
		INSERT INTO portfolio_items (id, type, title, description, tags, file_url, file_name, mime_type, size_bytes, owner_id, approval_status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
	`, id, portfolioType, title, descPtr, pq.Array(tags), fileURL, fileName, mimeType, sizeBytes, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Portfolio yaratishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, models.APISuccess{
		Success: true,
		Message: "Portfolio yaratildi",
		Data:    gin.H{"id": id},
	})
}

// PUT /api/portfolio/:id - Portfolio yangilash
func UpdatePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")
	portfolioID := c.Param("id")

	// Faqat o'z portfoliosini yangilash mumkin
	var ownerID string
	err := database.DB.QueryRow(`SELECT owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}
	if ownerID != userID {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu portfolioni yangilashga ruxsat yo'q",
			Code:    403,
		})
		return
	}

	var req models.CreatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri",
			Code:    400,
		})
		return
	}

	// Tags uchun pq.Array ishlatish
	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	_, err = database.DB.Exec(`
		UPDATE portfolio_items 
		SET type = $1, title = $2, description = $3, tags = $4, 
		    approval_status = 'PENDING', rejection_reason = NULL, updated_at = NOW()
		WHERE id = $5
	`, req.Type, req.Title, req.Description, pq.Array(tags), portfolioID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Yangilashda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Portfolio yangilandi",
	})
}

// DELETE /api/portfolio/:id - Portfolio o'chirish
func DeletePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	portfolioID := c.Param("id")

	// Faqat o'zining yoki ADMIN bo'lsa o'chirishi mumkin
	var ownerID string
	err := database.DB.QueryRow(`SELECT owner_id FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	if ownerID != userID && userRole != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu portfolioni o'chirishga ruxsat yo'q",
			Code:    403,
		})
		return
	}

	_, err = database.DB.Exec(`DELETE FROM portfolio_items WHERE id = $1`, portfolioID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "O'chirishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Portfolio o'chirildi",
	})
}

// GET /api/registrar/portfolios - Barcha portfoliolar (tasdiqlash uchun)
func GetAllPortfolios(c *gin.Context) {
	status := c.Query("status")
	search := c.Query("search")
	faculty := c.Query("faculty")
	specialty := c.Query("specialty")
	course := c.Query("course")
	group := c.Query("group")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := `
		SELECT p.id, p.type, p.title, p.description, p.tags, p.file_url, p.file_name, 
		       p.mime_type, p.size_bytes, p.owner_id, p.approval_status, p.approved_by, 
		       p.approved_at, p.rejection_reason, p.created_at, p.updated_at,
		       u.id, u.email, u.role, u.full_name, u.student_id, u.student_data, u.created_at
		FROM portfolio_items p
		JOIN users u ON p.owner_id = u.id
		WHERE 1=1
	`

	countQuery := `
		SELECT COUNT(*)
		FROM portfolio_items p
		JOIN users u ON p.owner_id = u.id
		WHERE 1=1
	`

	args := []interface{}{}
	argNum := 1

	if status != "" {
		query += ` AND p.approval_status = $` + strconv.Itoa(argNum)
		countQuery += ` AND p.approval_status = $` + strconv.Itoa(argNum)
		args = append(args, status)
		argNum++
	}

	if search != "" {
		query += ` AND (p.title ILIKE $` + strconv.Itoa(argNum) + ` OR u.full_name ILIKE $` + strconv.Itoa(argNum) + `)`
		countQuery += ` AND (p.title ILIKE $` + strconv.Itoa(argNum) + ` OR u.full_name ILIKE $` + strconv.Itoa(argNum) + `)`
		args = append(args, "%"+search+"%")
		argNum++
	}

	if faculty != "" {
		query += ` AND u.student_data->>'faculty' = $` + strconv.Itoa(argNum)
		countQuery += ` AND u.student_data->>'faculty' = $` + strconv.Itoa(argNum)
		args = append(args, faculty)
		argNum++
	}

	if specialty != "" {
		query += ` AND u.student_data->>'specialty' = $` + strconv.Itoa(argNum)
		countQuery += ` AND u.student_data->>'specialty' = $` + strconv.Itoa(argNum)
		args = append(args, specialty)
		argNum++
	}

	if course != "" {
		query += ` AND (u.student_data->>'course')::int = $` + strconv.Itoa(argNum)
		countQuery += ` AND (u.student_data->>'course')::int = $` + strconv.Itoa(argNum)
		courseInt, _ := strconv.Atoi(course)
		args = append(args, courseInt)
		argNum++
	}

	if group != "" {
		query += ` AND u.student_data->>'group' = $` + strconv.Itoa(argNum)
		countQuery += ` AND u.student_data->>'group' = $` + strconv.Itoa(argNum)
		args = append(args, group)
		argNum++
	}

	var total int
	database.DB.QueryRow(countQuery, args...).Scan(&total)

	query += ` ORDER BY p.created_at DESC LIMIT $` + strconv.Itoa(argNum) + ` OFFSET $` + strconv.Itoa(argNum+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	items := []models.PortfolioItemWithOwner{}
	for rows.Next() {
		var item models.PortfolioItem
		var owner models.User
		var studentDataJSON []byte
		var tags []string

		err := rows.Scan(
			&item.ID, &item.Type, &item.Title, &item.Description, pq.Array(&tags),
			&item.FileURL, &item.FileName, &item.MimeType, &item.SizeBytes,
			&item.OwnerID, &item.ApprovalStatus, &item.ApprovedBy, &item.ApprovedAt,
			&item.RejectionReason, &item.CreatedAt, &item.UpdatedAt,
			&owner.ID, &owner.Email, &owner.Role, &owner.FullName, &owner.StudentID,
			&studentDataJSON, &owner.CreatedAt,
		)
		if err != nil {
			continue
		}
		item.Tags = tags
		if studentDataJSON != nil {
			json.Unmarshal(studentDataJSON, &owner.StudentData)
		}
		items = append(items, models.PortfolioItemWithOwner{
			PortfolioItem: item,
			Owner:         owner,
		})
	}

	filters := getFilterOptions()

	c.JSON(http.StatusOK, models.PortfoliosResponse{
		Items:   items,
		Total:   total,
		Filters: filters,
	})
}

// POST /api/registrar/approve/:id - Tasdiqlash
func ApprovePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")
	portfolioID := c.Param("id")

	result, err := database.DB.Exec(`
		UPDATE portfolio_items 
		SET approval_status = 'APPROVED', approved_by = $1, approved_at = NOW(), rejection_reason = NULL
		WHERE id = $2
	`, userID, portfolioID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Tasdiqlashda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Portfolio tasdiqlandi",
	})
}

// POST /api/registrar/reject/:id - Rad etish
func RejectPortfolio(c *gin.Context) {
	userID := c.GetString("user_id")
	portfolioID := c.Param("id")

	var req models.ApproveRejectRequest
	c.ShouldBindJSON(&req)

	reason := "Sabab ko'rsatilmagan"
	if req.RejectionReason != nil && *req.RejectionReason != "" {
		reason = *req.RejectionReason
	}

	result, err := database.DB.Exec(`
		UPDATE portfolio_items 
		SET approval_status = 'REJECTED', approved_by = $1, approved_at = NOW(), rejection_reason = $2
		WHERE id = $3
	`, userID, reason, portfolioID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Rad etishda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Portfolio rad etildi",
	})
}
