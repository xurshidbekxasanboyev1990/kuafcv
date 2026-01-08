// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package models

import "time"

// ===== ENUMS =====

type Role string

const (
	RoleStudent   Role = "STUDENT"
	RoleAdmin     Role = "ADMIN"
	RoleRegistrar Role = "REGISTRAR"
	RoleEmployer  Role = "EMPLOYER"
)

type ApprovalStatus string

const (
	StatusPending  ApprovalStatus = "PENDING"
	StatusApproved ApprovalStatus = "APPROVED"
	StatusRejected ApprovalStatus = "REJECTED"
)

type PortfolioType string

const (
	TypeProject     PortfolioType = "PROJECT"
	TypeCertificate PortfolioType = "CERTIFICATE"
	TypeAssignment  PortfolioType = "ASSIGNMENT"
	TypeDocument    PortfolioType = "DOCUMENT"
	TypeMedia       PortfolioType = "MEDIA"
	TypeAward       PortfolioType = "AWARD"
	TypePublication PortfolioType = "PUBLICATION"
	TypeOther       PortfolioType = "OTHER"
)

type PortfolioCategory string

const (
	CategoryAcademic      PortfolioCategory = "ACADEMIC"      // Akademik faoliyat
	CategoryLeadership    PortfolioCategory = "LEADERSHIP"    // Tashkiliy va yetakchilik
	CategorySocial        PortfolioCategory = "SOCIAL"        // Ijtimoiy va ko'ngillilik
	CategoryProjects      PortfolioCategory = "PROJECTS"      // Loyihalar va tashabbuslar
	CategoryTechnical     PortfolioCategory = "TECHNICAL"     // Raqamli va texnik
	CategoryCareer        PortfolioCategory = "CAREER"        // Karyera va professional
	CategoryInternational PortfolioCategory = "INTERNATIONAL" // Xalqaro va tillar
	CategoryAwards        PortfolioCategory = "AWARDS"        // Mukofotlar va yutuqlar
)

// CategoryLabels - O'zbek tilidagi nomlar
var CategoryLabels = map[PortfolioCategory]string{
	CategoryAcademic:      "Akademik faoliyat",
	CategoryLeadership:    "Tashkiliy va yetakchilik",
	CategorySocial:        "Ijtimoiy va ko'ngillilik",
	CategoryProjects:      "Loyihalar va tashabbuslar",
	CategoryTechnical:     "Raqamli va texnik tajriba",
	CategoryCareer:        "Karyera va professional",
	CategoryInternational: "Xalqaro va tillar",
	CategoryAwards:        "Mukofotlar va yutuqlar",
}

// Portfolio Category Full (for admin)
type PortfolioCategoryFull struct {
	Value        string    `json:"value"`
	Label        string    `json:"label"`
	Icon         string    `json:"icon"`
	Description  string    `json:"description"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ===== MODELS =====

type User struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	PasswordHash string                 `json:"-"`
	Role         Role                   `json:"role"`
	FullName     string                 `json:"full_name"`
	StudentID    *string                `json:"student_id,omitempty"`
	CompanyName  *string                `json:"company_name,omitempty"`
	StudentData  map[string]interface{} `json:"student_data,omitempty"`
	ProfileImage *string                `json:"profile_image,omitempty"`
	Permissions  map[string]bool        `json:"permissions,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

// FileInfo represents a single uploaded file
type FileInfo struct {
	URL      string `json:"url"`
	Name     string `json:"name"`
	MimeType string `json:"mime_type"`
	Size     int64  `json:"size"`
}

type PortfolioItem struct {
	ID              string             `json:"id"`
	Type            PortfolioType      `json:"type"`
	Title           string             `json:"title"`
	Description     *string            `json:"description,omitempty"`
	Category        *PortfolioCategory `json:"category,omitempty"`
	Tags            []string           `json:"tags,omitempty"`
	FileURL         *string            `json:"file_url,omitempty"`   // Legacy single file
	FileName        *string            `json:"file_name,omitempty"`  // Legacy
	MimeType        *string            `json:"mime_type,omitempty"`  // Legacy
	SizeBytes       *int64             `json:"size_bytes,omitempty"` // Legacy
	Files           []FileInfo         `json:"files,omitempty"`      // New: multiple files
	OwnerID         string             `json:"owner_id"`
	ApprovalStatus  ApprovalStatus     `json:"approval_status"`
	ApprovedBy      *string            `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time         `json:"approved_at,omitempty"`
	RejectionReason *string            `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	// Stats fields
	ViewCount     int     `json:"view_count"`
	RatingAvg     float64 `json:"rating_avg"`
	RatingCount   int     `json:"rating_count"`
	CommentCount  int     `json:"comment_count"`
	BookmarkCount int     `json:"bookmark_count"`
}

type Notification struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Message    string    `json:"message"`
	Type       string    `json:"type"`
	TargetRole *Role     `json:"target_role,omitempty"`
	IsRead     bool      `json:"is_read"`
	CreatedBy  string    `json:"created_by"`
	CreatedAt  time.Time `json:"created_at"`
}

// ===== REQUEST DTOs =====

type LoginRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required"`
	CaptchaID   string `json:"captcha_id"`
	CaptchaCode string `json:"captcha_code"`
}

type CreateUserRequest struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=6"`
	Role        Role    `json:"role" binding:"required"`
	FullName    string  `json:"full_name" binding:"required"`
	StudentID   *string `json:"student_id,omitempty"`
	CompanyName *string `json:"company_name,omitempty"`
}

type CreatePortfolioRequest struct {
	Type        PortfolioType `json:"type" binding:"required"`
	Title       string        `json:"title" binding:"required"`
	Description *string       `json:"description,omitempty"`
	Tags        []string      `json:"tags,omitempty"`
}

type ApproveRejectRequest struct {
	RejectionReason *string `json:"rejection_reason,omitempty"`
}

// ===== RESPONSE DTOs =====

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type FilterOptions struct {
	Faculties   []string `json:"faculties"`
	Specialties []string `json:"specialties"`
	Courses     []int    `json:"courses"`
	Groups      []string `json:"groups"`
}

type StudentsResponse struct {
	Students []User        `json:"students"`
	Filters  FilterOptions `json:"filters"`
	Total    int           `json:"total"`
}

type PortfoliosResponse struct {
	Items   []PortfolioItemWithOwner `json:"items"`
	Total   int                      `json:"total"`
	Filters FilterOptions            `json:"filters"`
}

type PortfolioItemWithOwner struct {
	PortfolioItem
	Owner User `json:"owner"`
}

type DashboardStats struct {
	TotalStudents       int            `json:"total_students"`
	TotalPortfolios     int            `json:"total_portfolios"`
	PendingPortfolios   int            `json:"pending_portfolios"`
	ApprovedPortfolios  int            `json:"approved_portfolios"`
	StudentsByFaculty   map[string]int `json:"students_by_faculty"`
	PortfoliosByStatus  map[string]int `json:"portfolios_by_status"`
	RecentPortfolios    int            `json:"recent_portfolios"`
	RecentNotifications int            `json:"recent_notifications"`
}

type APIError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

type APISuccess struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
