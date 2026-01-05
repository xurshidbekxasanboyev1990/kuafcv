package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// Setting represents a system setting
type Setting struct {
	ID          int             `json:"id"`
	Category    string          `json:"category"`
	Key         string          `json:"key"`
	Value       json.RawMessage `json:"value"`
	Label       string          `json:"label"`
	Description string          `json:"description"`
	DataType    string          `json:"data_type"`
	Options     json.RawMessage `json:"options,omitempty"`
	IsPublic    bool            `json:"is_public"`
	UpdatedBy   string          `json:"updated_by,omitempty"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// GET /api/settings - Get all settings (Admin only)
func GetAllSettings(c *gin.Context) {
	roleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlamalarni ko'ra oladi",
			Code:    403,
		})
		return
	}
	role := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlamalarni ko'ra oladi",
			Code:    403,
		})
		return
	}

	category := c.Query("category")

	query := `
		SELECT id, category, key, value, label, description, data_type, options, is_public, updated_by, updated_at
		FROM system_settings
	`

	if category != "" {
		query += " WHERE category = $1"
	}

	query += " ORDER BY category, id"

	var settings []Setting
	var rows *sql.Rows
	var err error

	if category != "" {
		rows, err = database.DB.Query(query, category)
	} else {
		rows, err = database.DB.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Sozlamalarni olishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var s Setting
		var options, updatedBy []byte
		err := rows.Scan(&s.ID, &s.Category, &s.Key, &s.Value, &s.Label, &s.Description, &s.DataType, &options, &s.IsPublic, &updatedBy, &s.UpdatedAt)
		if err != nil {
			continue
		}
		if options != nil {
			s.Options = options
		}
		if updatedBy != nil {
			s.UpdatedBy = string(updatedBy)
		}
		settings = append(settings, s)
	}

	// Group by category
	grouped := make(map[string][]Setting)
	for _, s := range settings {
		grouped[s.Category] = append(grouped[s.Category], s)
	}

	c.JSON(http.StatusOK, gin.H{
		"settings":   settings,
		"grouped":    grouped,
		"categories": []string{"general", "support", "permissions", "ai", "notifications", "ui"},
	})
}

// GET /api/settings/public - Get public settings (no auth required)
func GetPublicSettings(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT key, value 
		FROM system_settings 
		WHERE is_public = true
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Sozlamalarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	settings := make(map[string]json.RawMessage)
	for rows.Next() {
		var key string
		var value json.RawMessage
		rows.Scan(&key, &value)
		settings[key] = value
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
	})
}

// GET /api/settings/:key - Get single setting
func GetSetting(c *gin.Context) {
	key := c.Param("key")
	roleVal, _ := c.Get("role")
	role := ""
	if r, ok := roleVal.(models.Role); ok {
		role = string(r)
	}

	var s Setting
	var options, updatedBy []byte
	err := database.DB.QueryRow(`
		SELECT id, category, key, value, label, description, data_type, options, is_public, updated_by, updated_at
		FROM system_settings WHERE key = $1
	`, key).Scan(&s.ID, &s.Category, &s.Key, &s.Value, &s.Label, &s.Description, &s.DataType, &options, &s.IsPublic, &updatedBy, &s.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Sozlama topilmadi",
			Code:    404,
		})
		return
	}

	// Non-admin can only see public settings
	if !s.IsPublic && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Bu sozlamani ko'rish huquqi yo'q",
			Code:    403,
		})
		return
	}

	if options != nil {
		s.Options = options
	}
	if updatedBy != nil {
		s.UpdatedBy = string(updatedBy)
	}

	c.JSON(http.StatusOK, s)
}

// PUT /api/settings/:key - Update single setting (Admin only)
func UpdateSetting(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlamalarni o'zgartira oladi",
			Code:    403,
		})
		return
	}

	key := c.Param("key")
	userID := c.GetString("user_id")

	var req struct {
		Value interface{} `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Qiymat kiritish shart",
			Code:    400,
		})
		return
	}

	// Convert value to JSON
	valueJSON, err := json.Marshal(req.Value)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_value",
			Message: "Noto'g'ri qiymat formati",
			Code:    400,
		})
		return
	}

	result, err := database.DB.Exec(`
		UPDATE system_settings 
		SET value = $1, updated_by = $2, updated_at = NOW()
		WHERE key = $3
	`, valueJSON, userID, key)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Sozlamani yangilashda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Sozlama topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sozlama yangilandi",
		"key":     key,
		"value":   req.Value,
	})
}

// PUT /api/settings/bulk - Update multiple settings (Admin only)
func UpdateBulkSettings(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlamalarni o'zgartira oladi",
			Code:    403,
		})
		return
	}

	userID := c.GetString("user_id")

	var req struct {
		Settings map[string]interface{} `json:"settings" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Sozlamalar ro'yxati kerak",
			Code:    400,
		})
		return
	}

	updated := []string{}
	failed := []string{}

	for key, value := range req.Settings {
		valueJSON, err := json.Marshal(value)
		if err != nil {
			failed = append(failed, key)
			continue
		}

		result, err := database.DB.Exec(`
			UPDATE system_settings 
			SET value = $1, updated_by = $2, updated_at = NOW()
			WHERE key = $3
		`, valueJSON, userID, key)

		if err != nil {
			failed = append(failed, key)
			continue
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			updated = append(updated, key)
		} else {
			failed = append(failed, key)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sozlamalar yangilandi",
		"updated": updated,
		"failed":  failed,
	})
}

// POST /api/settings - Create new setting (Admin only)
func CreateSetting(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlama qo'sha oladi",
			Code:    403,
		})
		return
	}

	userID := c.GetString("user_id")

	var req struct {
		Category    string      `json:"category" binding:"required"`
		Key         string      `json:"key" binding:"required"`
		Value       interface{} `json:"value" binding:"required"`
		Label       string      `json:"label" binding:"required"`
		Description string      `json:"description"`
		DataType    string      `json:"data_type"`
		Options     interface{} `json:"options"`
		IsPublic    bool        `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Barcha maydonlarni to'ldiring",
			Code:    400,
		})
		return
	}

	// Validate category
	validCategories := []string{"general", "support", "permissions", "ai", "notifications", "ui"}
	isValidCategory := false
	for _, cat := range validCategories {
		if cat == req.Category {
			isValidCategory = true
			break
		}
	}
	if !isValidCategory {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_category",
			Message: "Noto'g'ri kategoriya",
			Code:    400,
		})
		return
	}

	// Convert value to JSON
	valueJSON, _ := json.Marshal(req.Value)
	var optionsJSON []byte
	if req.Options != nil {
		optionsJSON, _ = json.Marshal(req.Options)
	}

	if req.DataType == "" {
		req.DataType = "text"
	}

	// Sanitize key
	req.Key = strings.ToLower(strings.ReplaceAll(req.Key, " ", "_"))

	_, err := database.DB.Exec(`
		INSERT INTO system_settings (category, key, value, label, description, data_type, options, is_public, updated_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, req.Category, req.Key, valueJSON, req.Label, req.Description, req.DataType, optionsJSON, req.IsPublic, userID)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			c.JSON(http.StatusConflict, models.APIError{
				Error:   "duplicate_key",
				Message: "Bu kalit allaqachon mavjud",
				Code:    409,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Sozlama qo'shishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sozlama qo'shildi",
		"key":     req.Key,
	})
}

// DELETE /api/settings/:key - Delete setting (Admin only)
func DeleteSetting(c *gin.Context) {
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(models.Role)
	if role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, models.APIError{
			Error:   "forbidden",
			Message: "Faqat admin sozlamani o'chira oladi",
			Code:    403,
		})
		return
	}

	key := c.Param("key")

	// Prevent deleting core settings
	coreSettings := []string{
		"site_name", "maintenance_mode", "admin_email", "ai_enabled",
	}
	for _, core := range coreSettings {
		if core == key {
			c.JSON(http.StatusForbidden, models.APIError{
				Error:   "protected_setting",
				Message: "Bu asosiy sozlama o'chirib bo'lmaydi",
				Code:    403,
			})
			return
		}
	}

	result, err := database.DB.Exec(`DELETE FROM system_settings WHERE key = $1`, key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Sozlamani o'chirishda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Sozlama topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sozlama o'chirildi",
		"key":     key,
	})
}

// Helper function to get setting value
func GetSettingValue(key string) (interface{}, error) {
	var value json.RawMessage
	err := database.DB.QueryRow(`SELECT value FROM system_settings WHERE key = $1`, key).Scan(&value)
	if err != nil {
		return nil, err
	}

	var result interface{}
	json.Unmarshal(value, &result)
	return result, nil
}

// Helper function to get setting as bool
func GetSettingBool(key string, defaultVal bool) bool {
	val, err := GetSettingValue(key)
	if err != nil {
		return defaultVal
	}
	if b, ok := val.(bool); ok {
		return b
	}
	return defaultVal
}

// Helper function to get setting as string
func GetSettingString(key string, defaultVal string) string {
	val, err := GetSettingValue(key)
	if err != nil {
		return defaultVal
	}
	if s, ok := val.(string); ok {
		return s
	}
	return defaultVal
}

// Helper function to get setting as int
func GetSettingInt(key string, defaultVal int) int {
	val, err := GetSettingValue(key)
	if err != nil {
		return defaultVal
	}
	if f, ok := val.(float64); ok {
		return int(f)
	}
	return defaultVal
}
