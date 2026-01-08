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
	"net/http"

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
			Message: "Bu email allaqachon ro'yxatdan o'tgan",
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

	c.JSON(http.StatusCreated, models.APISuccess{
		Success: true,
		Message: "Foydalanuvchi yaratildi",
	})
}

// GET /api/auth/password-requirements - Get password policy requirements
func GetPasswordRequirements(c *gin.Context) {
	requirements := auth.GeneratePasswordRequirements()

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"requirements": requirements,
		"message":      "Parol talablari",
	})
}

// POST /api/auth/validate-password - Validate password strength (for frontend feedback)
func ValidatePasswordStrength(c *gin.Context) {
	var req struct {
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Parol kiritish shart",
			Code:    400,
		})
		return
	}

	result := auth.ValidatePassword(req.Password)

	c.JSON(http.StatusOK, gin.H{
		"valid":    result.Valid,
		"strength": result.Strength.String(),
		"score":    result.Score,
		"errors":   result.Errors,
	})
}

// POST /api/auth/logout
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Tizimdan chiqdingiz",
	})
}
