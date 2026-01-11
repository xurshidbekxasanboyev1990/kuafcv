// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"kuafcv-backend/auth"
	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

// GET /api/admin/users
func GetUsers(c *gin.Context) {
	role := c.Query("role")
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

	query := `SELECT id, email, role, full_name, student_id, company_name, 
	                 student_data, profile_image, created_at, updated_at 
	          FROM users WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM users WHERE 1=1`
	args := []interface{}{}
	argNum := 1

	// Role filter - STAFF means ADMIN, REGISTRAR, EMPLOYER
	if role != "" {
		if role == "STAFF" {
			query += " AND role IN ('ADMIN', 'REGISTRAR', 'EMPLOYER')"
			countQuery += " AND role IN ('ADMIN', 'REGISTRAR', 'EMPLOYER')"
		} else {
			query += fmt.Sprintf(" AND role = $%d", argNum)
			countQuery += fmt.Sprintf(" AND role = $%d", argNum)
			args = append(args, role)
			argNum++
		}
	}

	if search != "" {
		query += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d OR student_id ILIKE $%d)", argNum, argNum, argNum)
		countQuery += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d OR student_id ILIKE $%d)", argNum, argNum, argNum)
		args = append(args, "%"+search+"%")
		argNum++
	}

	if faculty != "" {
		query += fmt.Sprintf(" AND student_data->>'faculty' = $%d", argNum)
		countQuery += fmt.Sprintf(" AND student_data->>'faculty' = $%d", argNum)
		args = append(args, faculty)
		argNum++
	}

	if specialty != "" {
		query += fmt.Sprintf(" AND student_data->>'specialty' = $%d", argNum)
		countQuery += fmt.Sprintf(" AND student_data->>'specialty' = $%d", argNum)
		args = append(args, specialty)
		argNum++
	}

	if course != "" {
		query += fmt.Sprintf(" AND (student_data->>'course')::int = $%d", argNum)
		countQuery += fmt.Sprintf(" AND (student_data->>'course')::int = $%d", argNum)
		courseInt, _ := strconv.Atoi(course)
		args = append(args, courseInt)
		argNum++
	}

	if group != "" {
		query += fmt.Sprintf(" AND student_data->>'group' = $%d", argNum)
		countQuery += fmt.Sprintf(" AND student_data->>'group' = $%d", argNum)
		args = append(args, group)
		argNum++
	}

	// Total count
	var total int
	database.DB.QueryRow(countQuery, args...).Scan(&total)

	// Get users
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argNum, argNum+1)
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

	users := []models.User{}
	for rows.Next() {
		var user models.User
		var studentDataJSON []byte
		err := rows.Scan(
			&user.ID, &user.Email, &user.Role, &user.FullName,
			&user.StudentID, &user.CompanyName, &studentDataJSON,
			&user.ProfileImage, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if studentDataJSON != nil {
			json.Unmarshal(studentDataJSON, &user.StudentData)
		}
		users = append(users, user)
	}

	// Get filter options
	filters := getFilterOptions()

	c.JSON(http.StatusOK, models.StudentsResponse{
		Students: users,
		Filters:  filters,
		Total:    total,
	})
}

// POST /api/admin/users
func CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri",
			Code:    400,
		})
		return
	}

	// Email mavjudligini tekshirish
	var exists bool
	database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, req.Email).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, models.APIError{
			Error:   "email_exists",
			Message: "Bu email allaqachon mavjud",
			Code:    409,
		})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "hash_error",
			Message: "Server xatoligi",
			Code:    500,
		})
		return
	}

	id := uuid.New().String()
	_, err = database.DB.Exec(`
		INSERT INTO users (id, email, password_hash, role, full_name, student_id, company_name)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, id, req.Email, hash, req.Role, req.FullName, req.StudentID, req.CompanyName)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Foydalanuvchi yaratishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, models.APISuccess{
		Success: true,
		Message: "Foydalanuvchi yaratildi",
	})
}

// DELETE /api/admin/users/:id
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	currentUserID := c.GetString("user_id")

	if userID == currentUserID {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "self_delete",
			Message: "O'zingizni o'chira olmaysiz",
			Code:    400,
		})
		return
	}

	result, err := database.DB.Exec(`DELETE FROM users WHERE id = $1`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "O'chirishda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Foydalanuvchi topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Foydalanuvchi o'chirildi",
	})
}

// PUT /api/admin/users/:id - Update user
func UpdateUser(c *gin.Context) {
	userID := c.Param("id")

	var req struct {
		FullName string `json:"full_name"`
		Email    string `json:"email"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_request",
			Message: "Noto'g'ri so'rov",
			Code:    400,
		})
		return
	}

	// Check if user exists
	var exists bool
	err := database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)`, userID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Foydalanuvchi topilmadi",
			Code:    404,
		})
		return
	}

	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.FullName != "" {
		updates = append(updates, fmt.Sprintf("full_name = $%d", argCount))
		args = append(args, req.FullName)
		argCount++
	}

	if req.Email != "" {
		// Check email uniqueness
		var emailExists bool
		database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)`, req.Email, userID).Scan(&emailExists)
		if emailExists {
			c.JSON(http.StatusConflict, models.APIError{
				Error:   "email_exists",
				Message: "Bu email allaqachon mavjud",
				Code:    409,
			})
			return
		}
		updates = append(updates, fmt.Sprintf("email = $%d", argCount))
		args = append(args, req.Email)
		argCount++
	}

	if req.Role != "" {
		// Validate role
		validRoles := map[string]bool{
			"ADMIN": true, "REGISTRAR": true, "EMPLOYER": true, "STUDENT": true,
		}
		if !validRoles[req.Role] {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "invalid_role",
				Message: "Noto'g'ri rol",
				Code:    400,
			})
			return
		}
		updates = append(updates, fmt.Sprintf("role = $%d", argCount))
		args = append(args, req.Role)
		argCount++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "no_updates",
			Message: "O'zgartirishlar yo'q",
			Code:    400,
		})
		return
	}

	updates = append(updates, "updated_at = NOW()")
	args = append(args, userID)

	query := fmt.Sprintf("UPDATE users SET %s WHERE id = $%d", strings.Join(updates, ", "), argCount)

	_, err = database.DB.Exec(query, args...)
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
		Message: "Foydalanuvchi yangilandi",
	})
}

// POST /api/admin/import-students - Excel import (optimized for large files)
func ImportStudents(c *gin.Context) {
	// Panic recovery
	defer func() {
		if r := recover(); r != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "panic_error",
				Message: fmt.Sprintf("Import xatolik: %v", r),
				Code:    500,
			})
		}
	}()

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "file_required",
			Message: "Excel fayl kerak",
			Code:    400,
		})
		return
	}

	// Fayl turini tekshirish
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".xlsx") && !strings.HasSuffix(strings.ToLower(file.Filename), ".xls") {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_file",
			Message: "Faqat Excel (.xlsx, .xls) fayllar qabul qilinadi",
			Code:    400,
		})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "file_error",
			Message: fmt.Sprintf("Faylni ochishda xatolik: %v", err),
			Code:    500,
		})
		return
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "excel_error",
			Message: fmt.Sprintf("Excel faylni o'qishda xatolik: %v", err),
			Code:    400,
		})
		return
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "sheet_error",
			Message: "Excel faylda sheet topilmadi",
			Code:    400,
		})
		return
	}

	// Stream-based row iteration (memory efficient)
	rowIterator, err := f.Rows(sheetName)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "sheet_error",
			Message: fmt.Sprintf("Sahifani o'qishda xatolik: %v", err),
			Code:    400,
		})
		return
	}
	defer rowIterator.Close()

	// Default parol hash - BIR MARTA hisoblash
	defaultPassword, _ := auth.HashPassword("student123")

	imported := 0
	updated := 0
	skipped := 0
	batchSize := 500
	rowCount := 0
	headerFound := false

	// Transaction boshlash
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Transaction boshlanmadi",
			Code:    500,
		})
		return
	}
	defer tx.Rollback() // Auto rollback if not committed

	// Mavjud student_id larni olish (optimized with map)
	existingStudents := make(map[string]string, 15000) // pre-allocate capacity
	existingRows, err := tx.Query(`SELECT id, student_id FROM users WHERE student_id IS NOT NULL`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Talabalar ma'lumotini olishda xatolik",
			Code:    500,
		})
		return
	}
	for existingRows.Next() {
		var id, studentID string
		if err := existingRows.Scan(&id, &studentID); err == nil {
			existingStudents[studentID] = id
		}
	}
	existingRows.Close()

	// Stream processing
	for rowIterator.Next() {
		row, err := rowIterator.Columns()
		if err != nil {
			skipped++
			continue
		}

		rowCount++

		// Header qatorlarini skip qilish
		if !headerFound {
			if len(row) > 0 {
				firstCell := strings.TrimSpace(row[0])
				if _, err := strconv.ParseInt(firstCell, 10, 64); err == nil && len(firstCell) > 5 {
					headerFound = true
				} else if rowCount >= 10 { // Max 10 qator header
					headerFound = true
				}
			}
			if !headerFound {
				continue
			}
		}

		i := rowCount - 1
		if len(row) < 2 {
			skipped++
			continue
		}

		studentID := getCell(row, 0)
		fullName := getCell(row, 1)

		if studentID == "" || fullName == "" {
			skipped++
			continue
		}

		// Kursni parse qilish
		courseStr := getCell(row, 13)
		var course int
		if courseStr != "" {
			courseStr = strings.TrimSuffix(courseStr, "-kurs")
			courseStr = strings.TrimSpace(courseStr)
			course, _ = strconv.Atoi(courseStr)
		}

		// Student data
		studentData := map[string]interface{}{
			"citizenship":    getCell(row, 2),
			"passport":       getCell(row, 3),
			"jshshir":        getCell(row, 4),
			"passport_date":  getCell(row, 5),
			"birth_date":     getCell(row, 6),
			"phone":          getCell(row, 7),
			"university":     getCell(row, 8),
			"education_type": getCell(row, 9),
			"education_form": getCell(row, 10),
			"code":           getCell(row, 11),
			"specialty":      getCell(row, 12),
			"course":         course,
			"group":          getCell(row, 14),
			"perm_country":   getCell(row, 15),
			"perm_region":    getCell(row, 16),
			"perm_district":  getCell(row, 17),
			"perm_address":   getCell(row, 18),
			"temp_region":    getCell(row, 19),
			"temp_district":  getCell(row, 20),
			"temp_address":   getCell(row, 21),
			"housing_type":   getCell(row, 22),
			"faculty":        getCell(row, 23),
		}

		studentDataJSON, _ := json.Marshal(studentData)
		email := fmt.Sprintf("%s@student.kuafcv.uz", studentID)

		if existingID, exists := existingStudents[studentID]; exists {
			// UPDATE
			_, err = tx.Exec(`
				UPDATE users SET full_name = $1, student_data = $2, updated_at = NOW()
				WHERE id = $3
			`, fullName, studentDataJSON, existingID)
			if err == nil {
				updated++
			} else {
				skipped++
			}
		} else {
			// INSERT
			id := uuid.New().String()
			_, err = tx.Exec(`
				INSERT INTO users (id, email, password_hash, role, full_name, student_id, student_data)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
			`, id, email, defaultPassword, models.RoleStudent, fullName, studentID, studentDataJSON)
			if err == nil {
				imported++
				existingStudents[studentID] = id
			} else {
				skipped++
			}
		}

		// Har batch da commit (transaction management)
		if (i+1)%batchSize == 0 {
			if err := tx.Commit(); err != nil {
				c.JSON(http.StatusInternalServerError, models.APIError{
					Error:   "commit_error",
					Message: fmt.Sprintf("Batch commit xatolik: %v", err),
					Code:    500,
				})
				return
			}
			tx, err = database.DB.Begin()
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.APIError{
					Error:   "transaction_error",
					Message: "Yangi transaction boshlanmadi",
					Code:    500,
				})
				return
			}
		}
	}

	// Oxirgi commit
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "final_commit_error",
			Message: fmt.Sprintf("Final commit xatolik: %v", err),
			Code:    500,
		})
		return
	}

	totalProcessed := imported + updated + skipped

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  fmt.Sprintf("%d ta yangi, %d ta yangilandi, %d ta skip", imported, updated, skipped),
		"imported": imported,
		"updated":  updated,
		"skipped":  skipped,
		"total":    totalProcessed,
	})
}

func getCell(row []string, index int) string {
	if index < len(row) {
		return strings.TrimSpace(row[index])
	}
	return ""
}

func getFilterOptions() models.FilterOptions {
	filters := models.FilterOptions{
		Faculties:   []string{},
		Specialties: []string{},
		Courses:     []int{},
		Groups:      []string{},
	}

	// Fakultetlar
	rows, _ := database.DB.Query(`
		SELECT DISTINCT student_data->>'faculty' 
		FROM users 
		WHERE role = 'STUDENT' AND student_data->>'faculty' IS NOT NULL AND student_data->>'faculty' != ''
		ORDER BY 1
	`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var val string
			if rows.Scan(&val) == nil && val != "" {
				filters.Faculties = append(filters.Faculties, val)
			}
		}
	}

	// Mutaxassisliklar
	rows, _ = database.DB.Query(`
		SELECT DISTINCT student_data->>'specialty' 
		FROM users 
		WHERE role = 'STUDENT' AND student_data->>'specialty' IS NOT NULL AND student_data->>'specialty' != ''
		ORDER BY 1
	`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var val string
			if rows.Scan(&val) == nil && val != "" {
				filters.Specialties = append(filters.Specialties, val)
			}
		}
	}

	// Kurslar
	rows, _ = database.DB.Query(`
		SELECT DISTINCT (student_data->>'course')::int as course
		FROM users 
		WHERE role = 'STUDENT' AND student_data->>'course' IS NOT NULL
		ORDER BY 1
	`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var val int
			if rows.Scan(&val) == nil && val > 0 {
				filters.Courses = append(filters.Courses, val)
			}
		}
	}

	// Guruhlar
	rows, _ = database.DB.Query(`
		SELECT DISTINCT student_data->>'group' 
		FROM users 
		WHERE role = 'STUDENT' AND student_data->>'group' IS NOT NULL AND student_data->>'group' != ''
		ORDER BY 1
	`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var val string
			if rows.Scan(&val) == nil && val != "" {
				filters.Groups = append(filters.Groups, val)
			}
		}
	}

	return filters
}

// POST /api/admin/rotate-jwt-secret - Rotate JWT secret with grace period (Admin only)
func RotateJWTSecret(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin JWT secretni almashtira oladi",
			Code:    403,
		})
		return
	}

	var req struct {
		NewSecret   string `json:"new_secret" binding:"required,min=32"`
		GracePeriod int    `json:"grace_period"` // Minutes, default 60
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "JWT secret kamida 32 ta belgidan iborat bo'lishi kerak",
			Code:    400,
		})
		return
	}

	// Default grace period: 60 minutes
	gracePeriod := 60
	if req.GracePeriod > 0 && req.GracePeriod <= 1440 { // Max 24 hours
		gracePeriod = req.GracePeriod
	}

	// Rotate secret
	auth.RotateSecret(req.NewSecret, time.Duration(gracePeriod)*time.Minute)

	// Get rotation info
	info := auth.GetSecretInfo()

	c.JSON(http.StatusOK, gin.H{
		"message":              "JWT secret muvaffaqiyatli almashtirildi",
		"version":              info["version"],
		"rotated_at":           info["rotated_at"],
		"grace_period_minutes": gracePeriod,
		"note":                 fmt.Sprintf("Eski tokenlar %d daqiqa davomida ishlaydi", gracePeriod),
	})
}

// GET /api/admin/jwt-info - Get JWT secret metadata (Admin only)
func GetJWTInfo(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Ruxsat berilmagan",
			Code:    403,
		})
		return
	}

	info := auth.GetSecretInfo()

	c.JSON(http.StatusOK, gin.H{
		"version":      info["version"],
		"rotated_at":   info["rotated_at"],
		"has_previous": info["has_previous"],
		"message":      "JWT secret ma'lumotlari",
	})
}

// PUT /api/admin/users/:id/password
func ChangeUserPassword(c *gin.Context) {
	targetUserID := c.Param("id")
	var req struct {
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Yangi parol noto'g'ri (kamida 6 ta belgi)",
			Code:    400,
		})
		return
	}

	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "hash_error",
			Message: "Server xatoligi",
			Code:    500,
		})
		return
	}

	result, err := database.DB.Exec(`
		UPDATE users SET password_hash = $1 WHERE id = $2
	`, hash, targetUserID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Parolni yangilashda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Foydalanuvchi topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Parol muvaffaqiyatli o'zgartirildi",
	})
}

// GET /api/admin/system/info - Tizim ma'lumotlari
func GetSystemInfo(c *gin.Context) {
	// Foydalanuvchilar statistikasi
	var totalUsers, totalStudents, totalAdmins, totalRegistrars, totalEmployers int
	database.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&totalUsers)
	database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`).Scan(&totalStudents)
	database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'ADMIN'`).Scan(&totalAdmins)
	database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'REGISTRAR'`).Scan(&totalRegistrars)
	database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'EMPLOYER'`).Scan(&totalEmployers)

	// Portfolio statistikasi
	var totalPortfolios, pendingPortfolios, approvedPortfolios, rejectedPortfolios int
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items`).Scan(&totalPortfolios)
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'PENDING'`).Scan(&pendingPortfolios)
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'APPROVED'`).Scan(&approvedPortfolios)
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_items WHERE approval_status = 'REJECTED'`).Scan(&rejectedPortfolios)

	// Boshqa statistikalar
	var totalCategories, totalAnnouncements, totalNotifications int
	database.DB.QueryRow(`SELECT COUNT(*) FROM portfolio_categories WHERE is_active = true`).Scan(&totalCategories)
	database.DB.QueryRow(`SELECT COUNT(*) FROM announcements WHERE is_active = true`).Scan(&totalAnnouncements)
	database.DB.QueryRow(`SELECT COUNT(*) FROM notifications`).Scan(&totalNotifications)

	// Database hajmi (taxminiy)
	var dbSize string
	database.DB.QueryRow(`SELECT pg_size_pretty(pg_database_size(current_database()))`).Scan(&dbSize)

	c.JSON(http.StatusOK, gin.H{
		"users": gin.H{
			"total":      totalUsers,
			"students":   totalStudents,
			"admins":     totalAdmins,
			"registrars": totalRegistrars,
			"employers":  totalEmployers,
		},
		"portfolios": gin.H{
			"total":    totalPortfolios,
			"pending":  pendingPortfolios,
			"approved": approvedPortfolios,
			"rejected": rejectedPortfolios,
		},
		"categories":    totalCategories,
		"announcements": totalAnnouncements,
		"notifications": totalNotifications,
		"database_size": dbSize,
		"server_time":   time.Now().Format(time.RFC3339),
		"version":       "2.0.0",
		"environment":   "production",
	})
}
