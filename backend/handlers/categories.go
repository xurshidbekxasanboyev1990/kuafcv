// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"kuafcv-backend/database"
	"kuafcv-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GET /api/admin/categories - Barcha kategoriyalar (Admin)
func GetAllCategories(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT value, label, icon, description, display_order, is_active, created_at, updated_at
		FROM portfolio_categories
		ORDER BY display_order ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kategoriyalarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	categories := []models.PortfolioCategoryFull{}
	for rows.Next() {
		var cat models.PortfolioCategoryFull
		err := rows.Scan(&cat.Value, &cat.Label, &cat.Icon, &cat.Description, &cat.DisplayOrder, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt)
		if err != nil {
			continue
		}
		categories = append(categories, cat)
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

// POST /api/admin/categories - Yangi kategoriya yaratish
func CreateCategory(c *gin.Context) {
	var req struct {
		Value        string `json:"value" binding:"required"`
		Label        string `json:"label" binding:"required"`
		Icon         string `json:"icon"`
		Description  string `json:"description"`
		DisplayOrder int    `json:"display_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Noto'g'ri ma'lumot",
			Code:    400,
		})
		return
	}

	_, err := database.DB.Exec(`
		INSERT INTO portfolio_categories (value, label, icon, description, display_order, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
	`, req.Value, req.Label, req.Icon, req.Description, req.DisplayOrder)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kategoriya yaratishda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, models.APISuccess{
		Success: true,
		Message: "Kategoriya yaratildi",
	})
}

// PUT /api/admin/categories/:value - Kategoriyani yangilash
func UpdateCategory(c *gin.Context) {
	value := c.Param("value")

	var req struct {
		Label        string `json:"label"`
		Icon         string `json:"icon"`
		Description  string `json:"description"`
		DisplayOrder int    `json:"display_order"`
		IsActive     bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Noto'g'ri ma'lumot",
			Code:    400,
		})
		return
	}

	result, err := database.DB.Exec(`
		UPDATE portfolio_categories
		SET label = $1, icon = $2, description = $3, display_order = $4, is_active = $5, updated_at = NOW()
		WHERE value = $6
	`, req.Label, req.Icon, req.Description, req.DisplayOrder, req.IsActive, value)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kategoriyani yangilashda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Kategoriya topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Kategoriya yangilandi",
	})
}

// DELETE /api/admin/categories/:value - Kategoriyani o'chirish
func DeleteCategory(c *gin.Context) {
	value := c.Param("value")

	// Kategoriya ishlatilayotganini tekshirish
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM portfolio_items WHERE category = $1
	`, value).Scan(&count)

	if err == nil && count > 0 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "category_in_use",
			Message: "Kategoriya ishlatilmoqda, o'chirish mumkin emas",
			Code:    400,
		})
		return
	}

	result, err := database.DB.Exec(`DELETE FROM portfolio_categories WHERE value = $1`, value)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Kategoriyani o'chirishda xatolik",
			Code:    500,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Kategoriya topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Kategoriya o'chirildi",
	})
}

// POST /api/admin/categories/reorder - Kategoriyalarni tartibini o'zgartirish
func ReorderCategories(c *gin.Context) {
	var req struct {
		Categories []struct {
			Value        string `json:"value"`
			DisplayOrder int    `json:"display_order"`
		} `json:"categories"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Noto'g'ri ma'lumot",
			Code:    400,
		})
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Tranzaksiya boshlanmadi",
			Code:    500,
		})
		return
	}

	for _, cat := range req.Categories {
		_, err := tx.Exec(`UPDATE portfolio_categories SET display_order = $1 WHERE value = $2`, cat.DisplayOrder, cat.Value)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "database_error",
				Message: "Tartibni yangilashda xatolik",
				Code:    500,
			})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Tranzaksiya xatosi",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Tartib yangilandi",
	})
}
