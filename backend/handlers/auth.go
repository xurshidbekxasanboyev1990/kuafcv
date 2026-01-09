// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"kuafcv-backend/auth"
	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// POST /api/auth/login
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Email va parol kerak",
			Code:    400,
		})
		return
	}

	var user models.User
	var studentDataJSON, permissionsJSON []byte
	err := database.DB.QueryRow(`
		SELECT id, email, password_hash, role, full_name, student_id, company_name,
		       student_data, profile_image, permissions, created_at, updated_at
		FROM users WHERE email = $1
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.FullName,
		&user.StudentID, &user.CompanyName, &studentDataJSON, &user.ProfileImage,
		&permissionsJSON, &user.CreatedAt, &user.UpdatedAt,
	)

	// Parse JSON fields
	if len(studentDataJSON) > 0 {
		json.Unmarshal(studentDataJSON, &user.StudentData)
	}
	if len(permissionsJSON) > 0 {
		json.Unmarshal(permissionsJSON, &user.Permissions)
	}

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, models.APIError{
			Error:   "invalid_credentials",
			Message: "Email yoki parol noto'g'ri",
			Code:    401,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Server xatoligi",
			Code:    500,
		})
		return
	}

	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, models.APIError{
			Error:   "invalid_credentials",
			Message: "Email yoki parol noto'g'ri",
			Code:    401,
		})
		return
	}

	token, err := auth.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "token_error",
			Message: "Token yaratishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// GET /api/auth/me
func GetCurrentUser(c *gin.Context) {
	userID := c.GetString("user_id")

	var user models.User
	var studentDataJSON, permissionsJSON []byte
	err := database.DB.QueryRow(`
		SELECT id, email, role, full_name, student_id, company_name,
		       student_data, profile_image, permissions, created_at, updated_at
		FROM users WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.Email, &user.Role, &user.FullName,
		&user.StudentID, &user.CompanyName, &studentDataJSON, &user.ProfileImage,
		&permissionsJSON, &user.CreatedAt, &user.UpdatedAt,
	)

	// Parse JSON fields
	if len(studentDataJSON) > 0 {
		json.Unmarshal(studentDataJSON, &user.StudentData)
	}
	if len(permissionsJSON) > 0 {
		json.Unmarshal(permissionsJSON, &user.Permissions)
	}

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Foydalanuvchi topilmadi",
			Code:    404,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Server xatoligi",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// POST /api/auth/register (faqat ADMIN uchun)
func Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri",
			Code:    400,
		})
		return
	}

	// Password strength validation
	passwordValidation := auth.ValidatePassword(req.Password)
	if !passwordValidation.Valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "weak_password",
			"message":  "Parol talablarga javob bermaydi",
			"code":     400,
			"errors":   passwordValidation.Errors,
			"strength": passwordValidation.Strength.String(),
			"score":    passwordValidation.Score,
		})
		return
	}

	// Email mavjudligini tekshirish
	var exists bool
	database.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, req.Email).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, models.APIError{
			Error:   "email_exists",
			Message: "Bu email allaqon ro'yxatdan o'tgan",
			Code:    409,
		})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "hash_error",
			Message: "Parolni hashlashda xatolik",
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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Foydalanuvchi muvaffaqiyatli yaratildi",
		"id":      id,
	})
}

// POST /api/auth/logout
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Muvaffaqiyatli chiqildi",
	})
}

// PUT /api/auth/profile
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "parse_error",
			Message: "Fayl hajmi juda katta",
			Code:    400,
		})
		return
	}

	fullName := c.Request.FormValue("full_name")
	// email := c.Request.FormValue("email") // Optional: allow email update?

	// Handle file upload
	file, header, err := c.Request.FormFile("avatar")
	if err == nil {
		defer file.Close()

		// Validate file type (allow all common image formats)
		ext := strings.ToLower(filepath.Ext(header.Filename))
		allowedExts := map[string]bool{
			".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
			".svg": true, ".gif": true, ".bmp": true, ".ico": true,
			".tiff": true, ".tif": true, ".heic": true,
		}

		if !allowedExts[ext] {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "invalid_file",
				Message: "Faqat rasm fayllari qabul qilinadi (jpg, png, svg, gif va h.k)",
				Code:    400,
			})
			return
		}

		// Ensure upload directory exists
		uploadDir := filepath.Join("uploads", "profiles")
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "filesystem_error",
				Message: "Serverda xatolik",
				Code:    500,
			})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		path := filepath.Join(uploadDir, filename)

		// Create file
		out, err := os.Create(path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "save_error",
				Message: "Rasmni saqlashda xatolik",
				Code:    500,
			})
			return
		}
		defer out.Close()

		// Copy data
		if _, err := io.Copy(out, file); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "write_error",
				Message: "Faylni yozishda xatolik",
				Code:    500,
			})
			return
		}

		// Update profile_image in DB
		webPath := "/uploads/profiles/" + filename
		_, err = database.DB.Exec("UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2", webPath, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "database_error",
				Message: "Bazaga yozishda xatolik",
				Code:    500,
			})
			return
		}
	}

	// Update text fields
	if fullName != "" {
		_, err := database.DB.Exec("UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2", fullName, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "database_error",
				Message: "Ismni yangilashda xatolik",
				Code:    500,
			})
			return
		}
	}
	// Note: Email updates usually require verification, skipping for now unless requested.

	// Return updated user data (reuses GetCurrentUser logic basically)
	GetCurrentUser(c)
}

// POST /api/auth/change-password
func ChangePassword(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar to'liq emas",
			Code:    400,
		})
		return
	}

	// Verify current password
	var currentHash string
	err := database.DB.QueryRow("SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Foydalanuvchi topilmadi",
			Code:    500,
		})
		return
	}

	if !auth.CheckPassword(req.CurrentPassword, currentHash) {
		c.JSON(http.StatusUnauthorized, models.APIError{
			Error:   "invalid_credentials",
			Message: "Joriy parol noto'g'ri",
			Code:    401,
		})
		return
	}

	// Validate new password strength
	passwordValidation := auth.ValidatePassword(req.NewPassword)
	if !passwordValidation.Valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "weak_password",
			"message": "Yangi parol talablarga javob bermaydi",
			"errors":  passwordValidation.Errors,
		})
		return
	}

	// Update password
	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "hash_error",
			Message: "Xatolik yuz berdi",
			Code:    500,
		})
		return
	}

	_, err = database.DB.Exec("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", newHash, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Parolni yangilashda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Parol muvaffaqiyatli yangilandi",
	})
}

// GET /api/auth/password-requirements
func GetPasswordRequirements(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"min_length":        8,
		"require_uppercase": true,
		"require_lowercase": true,
		"require_number":    true,
		"require_special":   true,
	})
}

// POST /api/auth/validate-password
func ValidatePasswordStrength(c *gin.Context) {
	var req struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Parol kiritilishi shart",
			Code:    400,
		})
		return
	}

	validation := auth.ValidatePassword(req.Password)
	c.JSON(http.StatusOK, validation)
}
