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
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/user/kuafcv-backend/database"
	"github.com/user/kuafcv-backend/models"
)

type EmployerStudent struct {
	ID           string                 `json:"id"`
	Email        *string                `json:"email,omitempty"`
	FullName     *string                `json:"fullName,omitempty"`
	StudentID    *string                `json:"studentId,omitempty"`
	ProfileImage *string                `json:"profileImage,omitempty"`
	Faculty      *string                `json:"faculty,omitempty"`
	Group        *string                `json:"group,omitempty"`
	Specialty    *string                `json:"specialty,omitempty"`
	Course       *int                   `json:"course,omitempty"`
	StudentData  map[string]interface{} `json:"studentData,omitempty"`
}

func parseLimitParam(c *gin.Context, defaultLimit int) int {
	limitStr := strings.TrimSpace(c.Query("limit"))
	if limitStr == "" {
		return defaultLimit
	}
	v, err := strconv.Atoi(limitStr)
	if err != nil {
		return defaultLimit
	}
	if v < 1 {
		return defaultLimit
	}
	if v > 200 {
		return 200
	}
	return v
}

// GetEmployerStudents returns a lightweight, searchable student roster for employers.
func GetEmployerStudents(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	limit := parseLimitParam(c, 50)

	var rows *sql.Rows
	var err error

	if q == "" {
		rows, err = database.DB.Query(`
			SELECT id, email, full_name, student_id, profile_image, student_data
			FROM users
			WHERE role = $1
			ORDER BY full_name NULLS LAST, created_at DESC
			LIMIT $2
		`, models.RoleStudent, limit)
	} else {
		pattern := "%" + q + "%"
		rows, err = database.DB.Query(`
			SELECT id, email, full_name, student_id, profile_image, student_data
			FROM users
			WHERE role = $1
			AND (
				(full_name ILIKE $2) OR
				(student_id ILIKE $2) OR
				(email ILIKE $2)
			)
			ORDER BY full_name NULLS LAST, created_at DESC
			LIMIT $3
		`, models.RoleStudent, pattern, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}
	defer rows.Close()

	students := []EmployerStudent{}
	for rows.Next() {
		var s EmployerStudent
		var email, fullName, studentID, profileImage sql.NullString
		var studentDataJSON []byte

		if err := rows.Scan(&s.ID, &email, &fullName, &studentID, &profileImage, &studentDataJSON); err != nil {
			continue
		}
		if email.Valid {
			v := email.String
			s.Email = &v
		}
		if fullName.Valid {
			v := fullName.String
			s.FullName = &v
		}
		if studentID.Valid {
			v := studentID.String
			s.StudentID = &v
		}
		if profileImage.Valid {
			v := profileImage.String
			s.ProfileImage = &v
		}
		if len(studentDataJSON) > 0 {
			var data map[string]interface{}
			if err := json.Unmarshal(studentDataJSON, &data); err == nil {
				s.StudentData = data

				// Extract common fields from studentData
				if faculty, ok := data["faculty"].(string); ok && faculty != "" {
					s.Faculty = &faculty
				}
				if group, ok := data["group"].(string); ok && group != "" {
					s.Group = &group
				}
				if specialty, ok := data["specialty"].(string); ok && specialty != "" {
					s.Specialty = &specialty
				}
				if course, ok := data["course"].(float64); ok && course > 0 {
					c := int(course)
					s.Course = &c
				}
			}
		}

		students = append(students, s)
	}

	c.JSON(http.StatusOK, gin.H{"students": students})
}

// GetEmployerStudentByID returns one student by user id (employer-safe fields only).
func GetEmployerStudentByID(c *gin.Context) {
	id := c.Param("id")

	var s EmployerStudent
	var email, fullName, studentID, profileImage sql.NullString

	var studentDataJSON []byte
	err := database.DB.QueryRow(`
		SELECT id, email, full_name, student_id, profile_image, student_data
		FROM users
		WHERE id = $1 AND role = $2
	`, id, models.RoleStudent).Scan(&s.ID, &email, &fullName, &studentID, &profileImage, &studentDataJSON)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if email.Valid {
		v := email.String
		s.Email = &v
	}
	if fullName.Valid {
		v := fullName.String
		s.FullName = &v
	}
	if studentID.Valid {
		v := studentID.String
		s.StudentID = &v
	}
	if profileImage.Valid {
		v := profileImage.String
		s.ProfileImage = &v
	}
	if len(studentDataJSON) > 0 {
		var data map[string]interface{}
		if err := json.Unmarshal(studentDataJSON, &data); err == nil {
			s.StudentData = data

			// Extract common fields from studentData
			if faculty, ok := data["faculty"].(string); ok && faculty != "" {
				s.Faculty = &faculty
			}
			if group, ok := data["group"].(string); ok && group != "" {
				s.Group = &group
			}
			if specialty, ok := data["specialty"].(string); ok && specialty != "" {
				s.Specialty = &specialty
			}
			if course, ok := data["course"].(float64); ok && course > 0 {
				c := int(course)
				s.Course = &c
			}
		}
	}

	c.JSON(http.StatusOK, s)
}
