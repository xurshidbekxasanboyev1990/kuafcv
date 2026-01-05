package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// GET /api/employer/students - Talabalar ro'yxati
func GetStudents(c *gin.Context) {
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
		SELECT id, email, role, full_name, student_id, student_data, profile_image, created_at, updated_at
		FROM users
		WHERE role = 'STUDENT'
	`
	countQuery := `SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`
	args := []interface{}{}
	argNum := 1

	if search != "" {
		query += ` AND (full_name ILIKE $` + strconv.Itoa(argNum) + ` OR student_id ILIKE $` + strconv.Itoa(argNum) + ` OR email ILIKE $` + strconv.Itoa(argNum) + `)`
		countQuery += ` AND (full_name ILIKE $` + strconv.Itoa(argNum) + ` OR student_id ILIKE $` + strconv.Itoa(argNum) + ` OR email ILIKE $` + strconv.Itoa(argNum) + `)`
		args = append(args, "%"+search+"%")
		argNum++
	}

	if faculty != "" {
		query += ` AND student_data->>'faculty' = $` + strconv.Itoa(argNum)
		countQuery += ` AND student_data->>'faculty' = $` + strconv.Itoa(argNum)
		args = append(args, faculty)
		argNum++
	}

	if specialty != "" {
		query += ` AND student_data->>'specialty' = $` + strconv.Itoa(argNum)
		countQuery += ` AND student_data->>'specialty' = $` + strconv.Itoa(argNum)
		args = append(args, specialty)
		argNum++
	}

	if course != "" {
		query += ` AND (student_data->>'course')::int = $` + strconv.Itoa(argNum)
		countQuery += ` AND (student_data->>'course')::int = $` + strconv.Itoa(argNum)
		courseInt, _ := strconv.Atoi(course)
		args = append(args, courseInt)
		argNum++
	}

	if group != "" {
		query += ` AND student_data->>'group' = $` + strconv.Itoa(argNum)
		countQuery += ` AND student_data->>'group' = $` + strconv.Itoa(argNum)
		args = append(args, group)
		argNum++
	}

	var total int
	database.DB.QueryRow(countQuery, args...).Scan(&total)

	query += ` ORDER BY full_name ASC LIMIT $` + strconv.Itoa(argNum) + ` OFFSET $` + strconv.Itoa(argNum+1)
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

	students := []models.User{}
	for rows.Next() {
		var user models.User
		var studentDataJSON []byte

		err := rows.Scan(
			&user.ID, &user.Email, &user.Role, &user.FullName,
			&user.StudentID, &studentDataJSON, &user.ProfileImage,
			&user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if studentDataJSON != nil {
			json.Unmarshal(studentDataJSON, &user.StudentData)
		}
		students = append(students, user)
	}

	filters := getFilterOptions()

	c.JSON(http.StatusOK, models.StudentsResponse{
		Students: students,
		Filters:  filters,
		Total:    total,
	})
}

// GET /api/employer/students/:id - Talaba tafsilotlari
func GetStudentDetails(c *gin.Context) {
	studentID := c.Param("id")

	var user models.User
	var studentDataJSON []byte

	err := database.DB.QueryRow(`
		SELECT id, email, role, full_name, student_id, student_data, profile_image, created_at, updated_at
		FROM users WHERE id = $1 AND role = 'STUDENT'
	`, studentID).Scan(
		&user.ID, &user.Email, &user.Role, &user.FullName,
		&user.StudentID, &studentDataJSON, &user.ProfileImage,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Talaba topilmadi",
			Code:    404,
		})
		return
	}

	if studentDataJSON != nil {
		json.Unmarshal(studentDataJSON, &user.StudentData)
	}

	// Talaba portfoliolari
	rows, _ := database.DB.Query(`
		SELECT id, type, title, description, tags, file_url, file_name, approval_status, created_at,
		       view_count, rating_avg, rating_count, comment_count, bookmark_count
		FROM portfolio_items
		WHERE owner_id = $1 AND approval_status = 'APPROVED'
		ORDER BY created_at DESC
	`, studentID)

	portfolios := []models.PortfolioItem{}
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var item models.PortfolioItem
			rows.Scan(
				&item.ID, &item.Type, &item.Title, &item.Description,
				&item.Tags, &item.FileURL, &item.FileName, &item.ApprovalStatus, &item.CreatedAt,
				&item.ViewCount, &item.RatingAvg, &item.RatingCount, &item.CommentCount, &item.BookmarkCount,
			)
			portfolios = append(portfolios, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"student":    user,
		"portfolios": portfolios,
	})
}
