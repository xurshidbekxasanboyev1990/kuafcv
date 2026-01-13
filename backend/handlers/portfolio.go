// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"kuafcv-backend/cache"
	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// Magic bytes signatures for file type validation
var magicBytes = map[string][]byte{
	"pdf":  {0x25, 0x50, 0x44, 0x46}, // %PDF
	"jpeg": {0xFF, 0xD8, 0xFF},
	"png":  {0x89, 0x50, 0x4E, 0x47},
	"gif":  {0x47, 0x49, 0x46, 0x38}, // GIF8
	"bmp":  {0x42, 0x4D},             // BM
	"webp": {0x52, 0x49, 0x46, 0x46}, // RIFF
	"zip":  {0x50, 0x4B, 0x03, 0x04}, // ZIP archive (DOCX, XLSX, PPTX, ZIP)
	"docx": {0x50, 0x4B, 0x03, 0x04},
	"xlsx": {0x50, 0x4B, 0x03, 0x04},
	"pptx": {0x50, 0x4B, 0x03, 0x04},
	"mp4":  {0x00, 0x00, 0x00},       // ftyp variants
	"mp3":  {0x49, 0x44, 0x33},       // ID3
	"wav":  {0x52, 0x49, 0x46, 0x46}, // RIFF
	"ogg":  {0x4F, 0x67, 0x67, 0x53}, // OggS
	"avi":  {0x52, 0x49, 0x46, 0x46}, // RIFF
	"rar":  {0x52, 0x61, 0x72, 0x21}, // Rar!
}

// validateMagicBytes checks if file content matches expected type
// Barcha xavfsiz fayl turlari uchun umumiy validatsiya
func validateMagicBytes(data []byte, portfolioType string) bool {
	if len(data) < 4 {
		return false // Too small to validate
	}

	// Check for known safe magic bytes
	safeSignatures := [][]byte{
		{0x25, 0x50, 0x44, 0x46}, // PDF
		{0xFF, 0xD8, 0xFF},       // JPEG
		{0x89, 0x50, 0x4E, 0x47}, // PNG
		{0x47, 0x49, 0x46, 0x38}, // GIF
		{0x42, 0x4D},             // BMP
		{0x52, 0x49, 0x46, 0x46}, // RIFF (WEBP, WAV, AVI)
		{0x50, 0x4B, 0x03, 0x04}, // ZIP (DOCX, XLSX, PPTX, ZIP)
		{0x50, 0x4B, 0x05, 0x06}, // Empty ZIP
		{0x00, 0x00, 0x00},       // MP4/MOV variants
		{0x49, 0x44, 0x33},       // MP3 (ID3)
		{0xFF, 0xFB},             // MP3 without ID3
		{0xFF, 0xFA},             // MP3 variant
		{0x4F, 0x67, 0x67, 0x53}, // OGG
		{0x52, 0x61, 0x72, 0x21}, // RAR
		{0x1F, 0x8B},             // GZIP
		{0x37, 0x7A, 0xBC, 0xAF}, // 7Z
		{0x66, 0x4C, 0x61, 0x43}, // FLAC
		{0x00, 0x00, 0x01, 0x00}, // ICO
		{0x3C, 0x3F, 0x78, 0x6D}, // XML (<?xm)
		{0x3C, 0x73, 0x76, 0x67}, // SVG (<svg)
		{0x7B},                   // JSON ({)
		{0x5B},                   // JSON ([)
	}

	for _, sig := range safeSignatures {
		if len(data) >= len(sig) && bytes.HasPrefix(data, sig) {
			return true
		}
	}

	// Check for text files (UTF-8 BOM or printable ASCII)
	if data[0] == 0xEF && data[1] == 0xBB && data[2] == 0xBF {
		return true // UTF-8 BOM
	}

	// Allow plain text files (check if mostly printable)
	printableCount := 0
	checkLen := min(len(data), 512)
	for i := 0; i < checkLen; i++ {
		if (data[i] >= 32 && data[i] <= 126) || data[i] == 9 || data[i] == 10 || data[i] == 13 {
			printableCount++
		}
	}
	if float64(printableCount)/float64(checkLen) > 0.85 {
		return true // Mostly printable text
	}

	return false
}

// GET /api/portfolio - O'z portfoliolari
func GetMyPortfolios(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := database.DB.Query(`
		SELECT id, type, title, description, category, tags, file_url, file_name, mime_type, size_bytes,
		       COALESCE(files, '[]'::jsonb) as files,
		       owner_id, approval_status, approved_by, approved_at, rejection_reason, created_at, updated_at,
		       view_count, rating_avg, rating_count, comment_count, bookmark_count
		FROM portfolio_items
		WHERE owner_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		log.Printf("❌ GetMyPortfolios Query Error: %v", err)
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
		var categoryStr string
		var filesJSON []byte
		err := rows.Scan(
			&item.ID, &item.Type, &item.Title, &item.Description, &categoryStr, pq.Array(&tags),
			&item.FileURL, &item.FileName, &item.MimeType, &item.SizeBytes,
			&filesJSON,
			&item.OwnerID, &item.ApprovalStatus, &item.ApprovedBy, &item.ApprovedAt,
			&item.RejectionReason, &item.CreatedAt, &item.UpdatedAt,
			&item.ViewCount, &item.RatingAvg, &item.RatingCount, &item.CommentCount, &item.BookmarkCount,
		)
		if err != nil {
			log.Printf("❌ GetMyPortfolios Scan Error: %v", err)
			continue
		}
		cat := models.PortfolioCategory(categoryStr)
		item.Category = &cat
		item.Tags = tags

		// Parse files JSON
		if len(filesJSON) > 0 {
			if err := json.Unmarshal(filesJSON, &item.Files); err != nil {
				log.Printf("⚠️ Files JSON parse error: %v", err)
				item.Files = []models.FileInfo{}
			}
		}

		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// Ruxsat berilgan fayl turlari - faqat xavfsiz office va media formatlar
var allowedDocTypes = map[string]bool{
	"application/pdf":    true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // docx
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         true, // xlsx
	"application/vnd.ms-powerpoint":                                             true,
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": true, // pptx
	"text/plain": true, // txt
	"text/csv":   true, // csv
}

var allowedMediaTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"image/bmp":       true,
	"video/mp4":       true,
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
	category := c.PostForm("category")
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

	// Ko'p fayllarni qabul qilish (maksimal 3 ta)
	form, err := c.MultipartForm()
	var uploadedFiles []models.FileInfo
	var firstFileURL, firstFileName, firstMimeType *string
	var firstSizeBytes *int64

	if err == nil && form != nil && form.File["files"] != nil {
		files := form.File["files"]

		// Maksimal 3 ta fayl
		if len(files) > 3 {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "too_many_files",
				Message: "Maksimal 3 ta fayl yuklash mumkin",
				Code:    400,
			})
			return
		}

		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				c.JSON(http.StatusBadRequest, models.APIError{
					Error:   "file_open_error",
					Message: "Faylni ochishda xatolik",
					Code:    400,
				})
				return
			}
			defer file.Close()

			// Read first 512 bytes for magic number detection
			buffer := make([]byte, 512)
			n, _ := file.Read(buffer)
			file.Seek(0, 0)

			// Detect content type
			detectedType := http.DetectContentType(buffer[:n])
			headerType := fileHeader.Header.Get("Content-Type")
			contentType := detectedType
			if contentType == "application/octet-stream" && headerType != "" {
				contentType = headerType
			}

			// Also check file extension (case-insensitive)
			ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
			extMimeMap := map[string]string{
				".pdf":  "application/pdf",
				".doc":  "application/msword",
				".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				".xls":  "application/vnd.ms-excel",
				".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				".ppt":  "application/vnd.ms-powerpoint",
				".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
				".txt":  "text/plain",
				".csv":  "text/csv",
				".jpg":  "image/jpeg",
				".jpeg": "image/jpeg",
				".png":  "image/png",
				".gif":  "image/gif",
				".webp": "image/webp",
				".bmp":  "image/bmp",
				".mp4":  "video/mp4",
				".webm": "video/webm",
				".mov":  "video/quicktime",
				".mp3":  "audio/mpeg",
				".wav":  "audio/wav",
			}
			if extMime, ok := extMimeMap[ext]; ok {
				if contentType == "application/octet-stream" || contentType == "application/zip" {
					contentType = extMime
				}
			}
			_ = contentType // May be used for logging

			// Simple validation - accept all common file types by extension
			allowedExts := map[string]bool{
				".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true,
				".ppt": true, ".pptx": true, ".txt": true, ".csv": true,
				".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".bmp": true,
				".mp4": true, ".webm": true, ".mov": true, ".mp3": true, ".wav": true,
				".zip": true, ".rar": true, ".7z": true,
			}
			isValidFile := allowedExts[ext]
			
			// Also accept if magic bytes are valid (for renamed files)
			if !isValidFile {
				isValidFile = validateMagicBytes(buffer[:n], portfolioType)
			}

			if !isValidFile {
				c.JSON(http.StatusBadRequest, models.APIError{
					Error:   "invalid_file",
					Message: "Faqat ruxsat berilgan fayl turlari qabul qilinadi (PDF, DOCX, XLSX, PPTX, JPG, PNG, MP4, ZIP va boshqalar)",
					Code:    400,
				})
				return
			}

			// File size check (50MB max)
			if fileHeader.Size > 50*1024*1024 {
				c.JSON(http.StatusBadRequest, models.APIError{
					Error:   "file_too_large",
					Message: "Fayl hajmi 50MB dan oshmasligi kerak: " + fileHeader.Filename,
					Code:    400,
				})
				return
			}

			// Save file
			fileExt := filepath.Ext(fileHeader.Filename)
			if fileExt == "" {
				fileExt = ".bin"
			}

			newFileName := uuid.New().String() + fileExt
			filePath := "uploads/portfolios/" + newFileName
			os.MkdirAll("uploads/portfolios", 0755)

			if err := c.SaveUploadedFile(fileHeader, filePath); err != nil {
				c.JSON(http.StatusInternalServerError, models.APIError{
					Error:   "upload_error",
					Message: "Fayl yuklashda xatolik: " + fileHeader.Filename,
					Code:    500,
				})
				return
			}

			// Add to uploaded files
			uploadedFiles = append(uploadedFiles, models.FileInfo{
				URL:      "/" + filePath,
				Name:     fileHeader.Filename,
				MimeType: contentType,
				Size:     fileHeader.Size,
			})

			// Keep first file for legacy compatibility
			if firstFileURL == nil {
				url := "/" + filePath
				firstFileURL = &url
				firstFileName = &fileHeader.Filename
				firstMimeType = &contentType
				size := fileHeader.Size
				firstSizeBytes = &size
			}
		}
	}

	id := uuid.New().String()
	descPtr := &description
	if description == "" {
		descPtr = nil
	}

	var categoryStr *string
	if category != "" {
		var exists bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(SELECT 1 FROM portfolio_categories WHERE value = $1 AND is_active = true)
		`, category).Scan(&exists)

		if err == nil && !exists {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "invalid_category",
				Message: "Noto'g'ri kategoriya tanlandi",
				Code:    400,
			})
			return
		}
		categoryStr = &category
	}

	// Convert files to JSON
	filesJSON, _ := json.Marshal(uploadedFiles)

	_, err = database.DB.Exec(`
		INSERT INTO portfolio_items (id, type, title, description, category, tags, file_url, file_name, mime_type, size_bytes, files, owner_id, approval_status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
	`, id, portfolioType, title, descPtr, categoryStr, pq.Array(tags), firstFileURL, firstFileName, firstMimeType, firstSizeBytes, filesJSON, userID)

	if err != nil {
		log.Printf("❌ Portfolio yaratishda xatolik: %v", err)
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
		Data:    gin.H{"id": id, "files_count": len(uploadedFiles)},
	})
}

// PUT /api/portfolio/:id - Portfolio yangilash
func UpdatePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	portfolioID := c.Param("id")

	// Faqat o'z portfoliosini yangilash mumkin
	var ownerID string
	var status string
	err := database.DB.QueryRow(`SELECT owner_id, approval_status FROM portfolio_items WHERE id = $1`, portfolioID).Scan(&ownerID, &status)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Portfolio topilmadi",
			Code:    404,
		})
		return
	}

	// Check ownership
	if ownerID != userID {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu portfolioni yangilashga ruxsat yo'q",
			Code:    403,
		})
		return
	}

	// Check status constraints for students
	// Faqat PENDING statusda tahrirlash mumkin
	// APPROVED yoki REJECTED bo'lsa tahrirlash taqiqlanadi (admin bundan mustasno bo'lishi mumkin, lekin talaba uchun yopiq)
	if userRole == string(models.RoleStudent) && status != string(models.StatusPending) {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Tasdiqlangan yoki rad etilgan portfolioni o'zgartirib bo'lmaydi",
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
		SELECT p.id, p.type, p.title, p.description, p.category, p.tags, p.file_url, p.file_name, 
		       p.mime_type, p.size_bytes, COALESCE(p.files, '[]'::jsonb) as files, p.owner_id, p.approval_status, p.approved_by, 
		       p.approved_at, p.rejection_reason, p.created_at, p.updated_at,
		       u.id, u.email, u.role, u.full_name, u.student_id, u.student_data, u.created_at, u.profile_image
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
		var filesJSON []byte
		var tags []string
		var categoryStr string

		err := rows.Scan(
			&item.ID, &item.Type, &item.Title, &item.Description, &categoryStr, pq.Array(&tags),
			&item.FileURL, &item.FileName, &item.MimeType, &item.SizeBytes, &filesJSON,
			&item.OwnerID, &item.ApprovalStatus, &item.ApprovedBy, &item.ApprovedAt,
			&item.RejectionReason, &item.CreatedAt, &item.UpdatedAt,
			&owner.ID, &owner.Email, &owner.Role, &owner.FullName, &owner.StudentID,
			&studentDataJSON, &owner.CreatedAt, &owner.ProfileImage,
		)
		if err != nil {
			continue
		}
		cat := models.PortfolioCategory(categoryStr)
		item.Category = &cat
		item.Tags = tags

		// Parse files JSON array
		if filesJSON != nil {
			json.Unmarshal(filesJSON, &item.Files)
		}
		if item.Files == nil {
			item.Files = []models.FileInfo{}
		}

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

// GET /api/portfolio/categories - Barcha kategoriyalar
func GetPortfolioCategories(c *gin.Context) {
	type CategoryInfo struct {
		Value string `json:"value"`
		Label string `json:"label"`
	}

	cacheKey := "portfolio:categories"
	var cachedCategories []CategoryInfo

	// Try cache first
	if err := cache.Get(cacheKey, &cachedCategories); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"categories": cachedCategories,
			"cached":     true,
		})
		return
	}

	categories := []CategoryInfo{
		{Value: string(models.CategoryAcademic), Label: models.CategoryLabels[models.CategoryAcademic]},
		{Value: string(models.CategoryLeadership), Label: models.CategoryLabels[models.CategoryLeadership]},
		{Value: string(models.CategorySocial), Label: models.CategoryLabels[models.CategorySocial]},
		{Value: string(models.CategoryProjects), Label: models.CategoryLabels[models.CategoryProjects]},
		{Value: string(models.CategoryTechnical), Label: models.CategoryLabels[models.CategoryTechnical]},
		{Value: string(models.CategoryCareer), Label: models.CategoryLabels[models.CategoryCareer]},
		{Value: string(models.CategoryInternational), Label: models.CategoryLabels[models.CategoryInternational]},
		{Value: string(models.CategoryAwards), Label: models.CategoryLabels[models.CategoryAwards]},
	}

	// Cache for 24 hours
	cache.Set(cacheKey, categories, 24*time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
