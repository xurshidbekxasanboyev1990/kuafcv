package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

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

	rows, err := f.GetRows(sheetName)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "sheet_error",
			Message: fmt.Sprintf("Sahifani o'qishda xatolik: %v", err),
			Code:    400,
		})
		return
	}

	// Header qatorlarini aniqlash
	headerRows := 0
	for i, row := range rows {
		if len(row) > 0 {
			firstCell := strings.TrimSpace(row[0])
			if _, err := strconv.ParseInt(firstCell, 10, 64); err == nil && len(firstCell) > 5 {
				headerRows = i
				break
			}
		}
		if i >= 5 {
			headerRows = i
			break
		}
	}

	dataRows := rows[headerRows:]
	if len(dataRows) == 0 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "empty_file",
			Message: "Faylda ma'lumot topilmadi",
			Code:    400,
		})
		return
	}

	// Default parol hash - BIR MARTA hisoblash (15000 ta emas!)
	defaultPassword, _ := auth.HashPassword("student123")

	imported := 0
	updated := 0
	skipped := 0
	batchSize := 500 // Batch hajmi

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

	// Mavjud student_id larni olish
	existingStudents := make(map[string]string) // student_id -> user_id
	existingRows, _ := tx.Query(`SELECT id, student_id FROM users WHERE student_id IS NOT NULL`)
	if existingRows != nil {
		for existingRows.Next() {
			var id, studentID string
			existingRows.Scan(&id, &studentID)
			existingStudents[studentID] = id
		}
		existingRows.Close()
	}

	for i, row := range dataRows {
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

		// Har batch da commit
		if (i+1)%batchSize == 0 {
			tx.Commit()
			tx, _ = database.DB.Begin()
		}
	}

	// Oxirgi commit
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  fmt.Sprintf("%d ta yangi talaba qo'shildi, %d ta yangilandi", imported, updated),
		"imported": imported,
		"updated":  updated,
		"skipped":  skipped,
		"total":    len(dataRows),
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
