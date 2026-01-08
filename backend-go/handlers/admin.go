// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/kuafcv-backend/auth"
	"github.com/user/kuafcv-backend/database"
	"github.com/user/kuafcv-backend/models"
	"github.com/xuri/excelize/v2"
)

// GetAllUsers returns all users for admin with pagination
func GetAllUsers(c *gin.Context) {
	// Get pagination params
	page := 1
	limit := 10

	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	// Get total count
	var total int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	// Get paginated users
	rows, err := database.DB.Query(`
		SELECT id, email, role, full_name, student_id, company_name, 
		       profile_image, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.Email, &user.Role,
			&user.FullName, &user.StudentID, &user.CompanyName,
			&user.ProfileImage, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"users":      users,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// GetAllStudents returns all students for admin
func GetAllStudents(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, email, role, full_name, student_id, student_data,
		       profile_image, created_at, updated_at
		FROM users
		WHERE role = $1
		ORDER BY created_at DESC
	`, models.RoleStudent)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}
	defer rows.Close()

	students := []models.User{}
	for rows.Next() {
		var user models.User
		var studentDataJSON sql.NullString

		err := rows.Scan(
			&user.ID, &user.Email, &user.Role,
			&user.FullName, &user.StudentID, &studentDataJSON,
			&user.ProfileImage, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}

		// Parse JSON field
		if studentDataJSON.Valid && studentDataJSON.String != "" {
			json.Unmarshal([]byte(studentDataJSON.String), &user.StudentData)
		}

		students = append(students, user)
	}

	c.JSON(http.StatusOK, gin.H{"students": students})
}

// GetAllStaff returns all staff members (registrars, employers, admins)
func GetAllStaff(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, email, role, full_name, company_name, permissions,
		       profile_image, created_at, updated_at
		FROM users
		WHERE role IN ($1, $2, $3)
		ORDER BY created_at DESC
	`, models.RoleAdmin, models.RoleRegistrar, models.RoleEmployer)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff"})
		return
	}
	defer rows.Close()

	staff := []models.User{}
	for rows.Next() {
		var user models.User
		var permissionsJSON sql.NullString

		err := rows.Scan(
			&user.ID, &user.Email, &user.Role,
			&user.FullName, &user.CompanyName, &permissionsJSON,
			&user.ProfileImage, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}

		// Parse JSON field
		if permissionsJSON.Valid && permissionsJSON.String != "" {
			json.Unmarshal([]byte(permissionsJSON.String), &user.Permissions)
		}

		staff = append(staff, user)
	}

	c.JSON(http.StatusOK, gin.H{"users": staff})
}

// DeleteUser deletes a user
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	result, err := database.DB.Exec("DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// CreateUser creates a new user (admin only)
func CreateUser(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call the Register function
	Register(c)
}

// UpdateStaffPermissions updates permissions for staff members
func UpdateStaffPermissions(c *gin.Context) {
	staffID := c.Param("id")

	var req struct {
		Permissions map[string]interface{} `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permissionsJSON, _ := json.Marshal(req.Permissions)

	_, err := database.DB.Exec(`
		UPDATE users 
		SET permissions = $1, updated_at = NOW()
		WHERE id = $2
	`, permissionsJSON, staffID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permissions updated successfully"})
}

// ImportStudents imports students from CSV or XLSX file (supports up to 100k rows)
func ImportStudents(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("❌ Import error - no file: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "File required"})
		return
	}
	defer file.Close()

	log.Printf("📥 Importing file: %s", header.Filename)

	var records [][]string

	// Check file type
	if strings.HasSuffix(header.Filename, ".xlsx") || strings.HasSuffix(header.Filename, ".xls") {
		// Parse Excel file
		f, err := excelize.OpenReader(file)
		if err != nil {
			log.Printf("❌ Excel parse error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Excel file"})
			return
		}
		defer f.Close()

		// Get first sheet
		sheets := f.GetSheetList()
		if len(sheets) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Excel file has no sheets"})
			return
		}

		rows, err := f.GetRows(sheets[0])
		if err != nil {
			log.Printf("❌ Error reading Excel rows: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read Excel data"})
			return
		}

		log.Printf("📊 Excel has %d total rows", len(rows))

		// Skip first 2 rows (headers with merged cells)
		// Data starts from row 3
		if len(rows) < 3 {
			log.Printf("❌ Not enough rows: %d", len(rows))
			c.JSON(http.StatusBadRequest, gin.H{"error": "File has no data rows"})
			return
		}

		// Extract data rows only (skip headers)
		records = rows[2:]
		log.Printf("✅ Processing %d data rows", len(records))

	} else if strings.HasSuffix(header.Filename, ".csv") {
		// Parse CSV
		reader := csv.NewReader(file)
		records, err = reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
			return
		}

		if len(records) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file is empty"})
			return
		}
		// Skip header row for CSV
		records = records[1:]

	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only CSV and XLSX files allowed"})
		return
	}

	if len(records) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No data to import"})
		return
	}

	// Column mapping for Excel file:
	// 0: Talaba ID
	// 1: Full Name
	// 2: Fuqarolik
	// 3: Pasport raqami
	// 4: JSHSHIR
	// 5: Pasport berilgan sana
	// 6: Tug'ilgan sana
	// 7: Telefon
	// 8: OTM nomi
	// 9: Ta'lim turi
	// 10: Ta'lim shakli
	// 11: Shifr
	// 12: Mutaxassislik
	// 13: Talaba kursi
	// 14: Guruh
	// 15: Doimiy viloyat
	// 16: Doimiy tuman
	// 17: Doimiy manzil
	// 18: Vaqtinchalik viloyat
	// 19: Vaqtinchalik tuman
	// 20: Vaqtinchalik manzil
	// 21: Turar joy turi
	// 22: Fakultet

	imported := 0
	failed := 0
	errors := []string{}
	skipped := 0

	// Limit to 100k rows for safety
	maxRows := 100000
	if len(records) > maxRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File too large. Maximum %d rows allowed", maxRows)})
		return
	}

	// Start transaction
	tx, err := database.DB.Begin()
	if err != nil {
		log.Printf("❌ Transaction error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	log.Printf("🔄 Starting import of %d records...", len(records))

	// Batch insert for better performance
	batchSize := 500
	now := time.Now()

	// Safely get values with bounds checking
	getValue := func(record []string, idx int) string {
		if idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
		return ""
	}

	// Process in batches
	for batchStart := 0; batchStart < len(records); batchStart += batchSize {
		batchEnd := batchStart + batchSize
		if batchEnd > len(records) {
			batchEnd = len(records)
		}

		batch := records[batchStart:batchEnd]

		// Prepare batch insert
		valueStrings := []string{}
		valueArgs := []interface{}{}
		argPosition := 1

		for i, record := range batch {
			// Skip empty rows
			if len(record) == 0 || (len(record) == 1 && strings.TrimSpace(record[0]) == "") {
				skipped++
				continue
			}

			// Ensure minimum columns
			if len(record) < 8 {
				failed++
				if len(errors) < 100 {
					errors = append(errors, fmt.Sprintf("Row %d: insufficient data", batchStart+i+3))
				}
				continue
			}

			studentID := getValue(record, 0)
			fullName := getValue(record, 1)

			// Validate required fields
			if studentID == "" || fullName == "" {
				failed++
				if len(errors) < 100 {
					errors = append(errors, fmt.Sprintf("Row %d: missing student_id or full_name", batchStart+i+3))
				}
				continue
			}

			// Create student data JSON
			courseStr := getValue(record, 13)
			var courseNum interface{} = nil
			if courseStr != "" {
				if c, err := strconv.Atoi(courseStr); err == nil && c > 0 {
					courseNum = c
				}
			}

			studentData := map[string]interface{}{
				"faculty":        getValue(record, 22),
				"specialty":      getValue(record, 12),
				"course":         courseNum,
				"group":          getValue(record, 14),
				"citizenship":    getValue(record, 2),
				"passport":       getValue(record, 3),
				"jshshir":        getValue(record, 4),
				"passport_date":  getValue(record, 5),
				"birth_date":     getValue(record, 6),
				"phone":          getValue(record, 7),
				"university":     getValue(record, 8),
				"education_type": getValue(record, 9),
				"education_form": getValue(record, 10),
				"code":           getValue(record, 11),
				"perm_region":    getValue(record, 15),
				"perm_district":  getValue(record, 16),
				"perm_address":   getValue(record, 17),
				"temp_region":    getValue(record, 18),
				"temp_district":  getValue(record, 19),
				"temp_address":   getValue(record, 20),
				"housing_type":   getValue(record, 21),
			}
			studentDataJSON, _ := json.Marshal(studentData)

			// Hash password - default password for all students is "12345678"
			hashedPassword, err := auth.HashPassword("12345678")
			if err != nil {
				failed++
				if len(errors) < 100 {
					errors = append(errors, fmt.Sprintf("Row %d: password hash error", batchStart+i+3))
				}
				continue
			}

			email := strings.ToLower(studentID) + "@student.uz"
			userID := uuid.New().String()

			// Add to batch
			valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
				argPosition, argPosition+1, argPosition+2, argPosition+3, argPosition+4, argPosition+5, argPosition+6, argPosition+7, argPosition+8))

			valueArgs = append(valueArgs, userID, email, hashedPassword, models.RoleStudent, fullName, studentID, studentDataJSON, now, now)
			argPosition += 9
		}

		// Execute batch insert
		if len(valueStrings) > 0 {
			query := fmt.Sprintf(`
				INSERT INTO users (id, email, password_hash, role, full_name, student_id, student_data, created_at, updated_at)
				VALUES %s
				ON CONFLICT (email) DO UPDATE SET
					full_name = EXCLUDED.full_name,
					student_id = EXCLUDED.student_id,
					student_data = EXCLUDED.student_data,
					updated_at = EXCLUDED.updated_at
			`, strings.Join(valueStrings, ","))

			_, err = tx.Exec(query, valueArgs...)
			if err != nil {
				log.Printf("❌ Batch error at row %d: %v", batchStart+3, err)
				failed += len(valueStrings)
				if len(errors) < 100 {
					errors = append(errors, fmt.Sprintf("Batch %d: %s", batchStart/batchSize, err.Error()))
				}
			} else {
				imported += len(valueStrings)
			}
		}

		if imported%3000 == 0 && imported > 0 {
			log.Printf("✅ Imported %d/%d students...", imported, len(records))
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("❌ Commit error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	log.Printf("✅ Import complete: %d imported, %d failed, %d skipped", imported, failed, skipped)

	c.JSON(http.StatusOK, gin.H{
		"imported": imported,
		"failed":   failed,
		"skipped":  skipped,
		"total":    len(records),
		"errors":   errors,
	})
}

// ResetUserPassword - Admin resets any user's password
func ResetUserPassword(c *gin.Context) {
	userID := c.Param("id")

	var req struct {
		NewPassword string `json:"newPassword" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password is required"})
		return
	}

	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	result, err := database.DB.Exec(`
		UPDATE users 
		SET password_hash = $1, updated_at = $2
		WHERE id = $3
	`, hashedPassword, time.Now(), userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}
