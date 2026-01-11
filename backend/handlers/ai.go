// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
)

// OpenAI API structures
type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	MaxTokens   int             `json:"max_tokens,omitempty"`
	Temperature float64         `json:"temperature,omitempty"`
}

type OpenAIChoice struct {
	Message OpenAIMessage `json:"message"`
	Index   int           `json:"index"`
}

type OpenAIResponse struct {
	ID      string         `json:"id"`
	Choices []OpenAIChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Rate limiter for OpenAI API (5000 concurrent users support)
type RateLimiter struct {
	tokens    chan struct{}
	lastReset time.Time
	mu        sync.Mutex
}

var (
	aiRateLimiter *RateLimiter
	httpClient    *http.Client
)

func init() {
	// 100 concurrent requests, reset every minute (supports 5000+ users)
	aiRateLimiter = &RateLimiter{
		tokens:    make(chan struct{}, 100),
		lastReset: time.Now(),
	}
	for i := 0; i < 100; i++ {
		aiRateLimiter.tokens <- struct{}{}
	}

	// HTTP client with connection pooling
	httpClient = &http.Client{
		Timeout: 60 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        200,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
	}
}

func (r *RateLimiter) Acquire() bool {
	select {
	case <-r.tokens:
		return true
	case <-time.After(30 * time.Second):
		return false
	}
}

func (r *RateLimiter) Release() {
	select {
	case r.tokens <- struct{}{}:
	default:
	}
}

// System prompts
var systemPrompts = map[string]string{
	"support": `Sen Qo'qon Universiteti Andijon filiali Portfolio tizimi yordamchisisisan. 
Vazifang:
1. Foydalanuvchilarga tizimdan foydalanish bo'yicha yordam berish
2. Portfolio yaratish, tahrirlash, o'chirish haqida ma'lumot berish
3. Talabalar, registrator, admin va employer panellari haqida tushuntirish
4. Xatoliklar yuzaga kelganda yechimlar taklif qilish

Javoblar qisqa, aniq va o'zbek tilida bo'lsin. Agar savol tizimga tegishli bo'lmasa, "Admin bilan bog'laning" yoki "Registrator office bilan bog'laning" deb ayt.

Tizim haqida:
- Talabalar o'z portfoliolarini yaratishlari mumkin (sertifikatlar, loyihalar, yutuqlar)
- Registrator portfoliolarni tasdiqlaydi yoki rad etadi
- Admin barcha foydalanuvchilarni boshqaradi
- Employer talabalar portfoliolarini ko'rishi mumkin`,

	"analytics": `Sen professional portfolio tahlilchisisisan. Vazifang talabaning portfoliosini chuqur tahlil qilish:

KATEGORIYALAR TIZIMI:
- ACADEMIC: Akademik faoliyat (maqolalar, tezislar, konferensiyalar)
- LEADERSHIP: Tashkiliy va yetakchilik (jamoa boshqaruvi, tadbirlar)
- SOCIAL: Ijtimoiy va ko'ngillilik (ko'ngillilik, xayriya, mentorlik)
- PROJECTS: Loyihalar va tashabbuslar (shaxsiy/jamoa loyihalar, startup)
- TECHNICAL: Raqamli va texnik (dasturlash, botlar, veb-loyihalar)
- CAREER: Karyera va professional (amaliyot, trening, sertifikatlar)
- INTERNATIONAL: Xalqaro va tillar (xalqaro dasturlar, til sertifikatlar)
- AWARDS: Mukofotlar va yutuqlar (tanlovlar, imtiyozlar, grantlar)

TAHLIL FORMATI:
1. KATEGORIYALAR TAHLILI - har bir kategoriya bo'yicha baholash va kuchli/zaif tomonlar
2. UMUMIY BAHOLASH - barcha kategoriyalarni hisobga olgan holda umumiy holat
3. MUVOZANAT - qaysi kategoriyalarda ko'proq/kamroq ish kerak
4. TAVSIYALAR - har bir kategoriya uchun aniq maslahatlar
5. UMUMIY BAL - 100 ballik tizimda (kategoriyalar bo'yicha taqsimlangan)

Tahlil professional, konstruktiv va motivatsion bo'lsin. Har bir kategoriyani alohida e'tiborga oling. O'zbek tilida yoz.`,
}

// POST /api/ai/chat - Support chat
func AIChat(c *gin.Context) {
	var req struct {
		Message string `json:"message" binding:"required"`
		Type    string `json:"type"` // "support" or "analytics"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Xabar kiritilmagan",
			Code:    400,
		})
		return
	}

	if req.Type == "" {
		req.Type = "support"
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Get system prompt
	systemPrompt, ok := systemPrompts[req.Type]
	if !ok {
		systemPrompt = systemPrompts["support"]
	}

	// Call OpenAI
	response, err := callOpenAI(systemPrompt, req.Message)
	if err != nil {
		log.Printf("❌ AI Chat xatolik: %v", err)
		errMsg := "AI xizmati vaqtincha ishlamayapti. Admin bilan bog'laning."
		if strings.Contains(err.Error(), "API key") {
			errMsg = "OpenAI API kaliti sozlanmagan yoki noto'g'ri."
		} else if strings.Contains(err.Error(), "rate limit") || strings.Contains(err.Error(), "429") {
			errMsg = "AI so'rovlar limiti tugadi. Keyinroq urinib ko'ring."
		} else if strings.Contains(err.Error(), "quota") || strings.Contains(err.Error(), "insufficient_quota") {
			errMsg = "OpenAI hisobida kredit tugagan. Admin bilan bog'laning."
		}
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: errMsg,
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
		"type":     req.Type,
	})
}

// POST /api/ai/analyze-portfolio - Analyze student portfolio
func AnalyzePortfolio(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		StudentID string `json:"student_id"`
	}
	c.ShouldBindJSON(&req)

	// If no student_id provided, analyze current user's portfolio
	targetID := userID
	if req.StudentID != "" {
		targetID = req.StudentID
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Get student info
	var student models.User
	var studentDataJSON []byte
	err := database.DB.QueryRow(`
		SELECT id, email, full_name, student_id, student_data, profile_image 
		FROM users WHERE id = $1
	`, targetID).Scan(&student.ID, &student.Email, &student.FullName, &student.StudentID, &studentDataJSON, &student.ProfileImage)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Talaba topilmadi",
			Code:    404,
		})
		return
	}

	if studentDataJSON != nil {
		json.Unmarshal(studentDataJSON, &student.StudentData)
	}

	// Get approved portfolios with categories
	rows, err := database.DB.Query(`
		SELECT type, title, description, category, tags, approval_status, created_at
		FROM portfolio_items
		WHERE owner_id = $1 AND approval_status = 'APPROVED'
		ORDER BY created_at DESC
	`, targetID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	// Get category labels for display
	categoryLabels := make(map[string]string)
	catRows, _ := database.DB.Query(`SELECT value, label FROM portfolio_categories WHERE is_active = true`)
	if catRows != nil {
		defer catRows.Close()
		for catRows.Next() {
			var value, label string
			catRows.Scan(&value, &label)
			categoryLabels[value] = label
		}
	}

	var portfolios []map[string]interface{}
	categoryCounts := make(map[string]int)
	for rows.Next() {
		var pType, title, description, status string
		var category *string
		var tags []byte
		var createdAt time.Time
		rows.Scan(&pType, &title, &description, &category, &tags, &status, &createdAt)

		categoryStr := ""
		if category != nil {
			categoryStr = *category
			categoryCounts[categoryStr]++
		}

		portfolios = append(portfolios, map[string]interface{}{
			"type":        pType,
			"title":       title,
			"description": description,
			"category":    categoryStr,
			"tags":        string(tags),
			"created_at":  createdAt.Format("2006-01-02"),
		})
	}

	// Build analysis prompt with categories
	studentIDStr := ""
	if student.StudentID != nil {
		studentIDStr = *student.StudentID
	}
	portfolioText := fmt.Sprintf(`
TALABA MA'LUMOTLARI:
- Ism: %s
- Talaba ID: %s
- Fakultet: %v
- Mutaxassislik: %v
- Kurs: %v
- Guruh: %v

KATEGORIYALAR BO'YICHA TAQSIMOT:
`,
		student.FullName,
		studentIDStr,
		student.StudentData["faculty"],
		student.StudentData["specialty"],
		student.StudentData["course"],
		student.StudentData["group"],
	)

	// Add category statistics
	for catValue, count := range categoryCounts {
		catLabel := categoryLabels[catValue]
		if catLabel == "" {
			catLabel = catValue
		}
		portfolioText += fmt.Sprintf("- %s: %d ta\n", catLabel, count)
	}

	portfolioText += fmt.Sprintf(`
PORTFOLIO ELEMENTLARI (%d ta tasdiqlangan):
`, len(portfolios))

	for i, p := range portfolios {
		categoryStr := ""
		if p["category"] != "" {
			catLabel := categoryLabels[p["category"].(string)]
			if catLabel == "" {
				catLabel = p["category"].(string)
			}
			categoryStr = fmt.Sprintf(" [%s]", catLabel)
		}

		portfolioText += fmt.Sprintf(`
%d. %s%s (%s)
   Sarlavha: %s
   Tavsif: %s
   Teglar: %s
`,
			i+1,
			p["type"],
			categoryStr,
			p["created_at"],
			p["title"],
			p["description"],
			p["tags"],
		)
	}

	if len(portfolios) == 0 {
		portfolioText += "\nHech qanday tasdiqlangan portfolio elementi yo'q.\n"
	}

	// Call OpenAI for analysis
	analysis, err := callOpenAI(systemPrompts["analytics"], portfolioText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "AI tahlil xizmati vaqtincha ishlamayapti",
			Code:    500,
		})
		return
	}

	// Save analysis to history
	database.DB.Exec(`
		INSERT INTO analysis_history (user_id, student_id, analysis, created_at)
		VALUES ($1, $2, $3, NOW())
	`, userID, targetID, analysis)

	c.JSON(http.StatusOK, gin.H{
		"student": gin.H{
			"id":         student.ID,
			"full_name":  student.FullName,
			"student_id": student.StudentID,
			"faculty":    student.StudentData["faculty"],
			"specialty":  student.StudentData["specialty"],
			"course":     student.StudentData["course"],
			"group":      student.StudentData["group"],
		},
		"portfolio_count": len(portfolios),
		"analysis":        analysis,
	})
}

// POST /api/ai/quick-analyze - Quick analysis for multiple students
func QuickAnalyze(c *gin.Context) {
	var req struct {
		StudentIDs []string `json:"student_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Talabalar ro'yxati kerak",
			Code:    400,
		})
		return
	}

	if len(req.StudentIDs) > 10 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "limit_exceeded",
			Message: "Bir vaqtda maksimum 10 ta talaba tahlil qilinadi",
			Code:    400,
		})
		return
	}

	// Parallel analysis with worker pool
	results := make([]gin.H, len(req.StudentIDs))
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 5) // 5 parallel requests

	for i, studentID := range req.StudentIDs {
		wg.Add(1)
		go func(idx int, sid string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Get portfolio count and categories
			var count int
			var fullName string
			database.DB.QueryRow(`
				SELECT u.full_name, COUNT(p.id) 
				FROM users u 
				LEFT JOIN portfolio_items p ON u.id = p.owner_id AND p.approval_status = 'APPROVED'
				WHERE u.id = $1
				GROUP BY u.full_name
			`, sid).Scan(&fullName, &count)

			// Get category distribution
			categoryRows, _ := database.DB.Query(`
				SELECT category, COUNT(*) 
				FROM portfolio_items 
				WHERE owner_id = $1 AND approval_status = 'APPROVED' AND category IS NOT NULL
				GROUP BY category
			`, sid)

			categoryDist := make(map[string]int)
			if categoryRows != nil {
				defer categoryRows.Close()
				for categoryRows.Next() {
					var cat string
					var cnt int
					categoryRows.Scan(&cat, &cnt)
					categoryDist[cat] = cnt
				}
			}

			results[idx] = gin.H{
				"student_id":      sid,
				"full_name":       fullName,
				"portfolio_count": count,
				"status":          getPortfolioStatus(count),
				"categories":      categoryDist,
			}
		}(i, studentID)
	}

	wg.Wait()

	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"total":   len(results),
	})
}

func getPortfolioStatus(count int) string {
	switch {
	case count == 0:
		return "Portfolio yo'q"
	case count < 3:
		return "Kam"
	case count < 6:
		return "O'rtacha"
	case count < 10:
		return "Yaxshi"
	default:
		return "A'lo"
	}
}

// callOpenAI - Make request to OpenAI API
func callOpenAI(systemPrompt, userMessage string) (string, error) {
	return callOpenAIWithRetry(systemPrompt, userMessage, 3)
}

func callOpenAIWithRetry(systemPrompt, userMessage string, maxRetries int) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OpenAI API key not configured")
	}

	var lastErr error
	backoff := time.Second

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			log.Printf("⚠️  OpenAI retry attempt %d/%d after %v", attempt+1, maxRetries, backoff)
			time.Sleep(backoff)
			backoff *= 2 // Exponential backoff
		}

		reqBody := OpenAIRequest{
			Model: "gpt-4o", // Eng zo'r model
			Messages: []OpenAIMessage{
				{Role: "system", Content: systemPrompt},
				{Role: "user", Content: userMessage},
			},
			MaxTokens:   2000,
			Temperature: 0.7,
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			lastErr = err
			continue
		}

		req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
		if err != nil {
			lastErr = err
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+apiKey)

		resp, err := httpClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("network error: %w", err)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()

		if err != nil {
			lastErr = fmt.Errorf("read error: %w", err)
			continue
		}

		// Handle HTTP error codes with retry logic
		if resp.StatusCode == 429 {
			// Rate limit - retry with backoff
			lastErr = fmt.Errorf("rate limit exceeded")
			continue
		} else if resp.StatusCode == 503 || resp.StatusCode == 502 {
			// Service unavailable - retry
			lastErr = fmt.Errorf("service temporarily unavailable")
			continue
		} else if resp.StatusCode >= 500 {
			// Server error - retry
			lastErr = fmt.Errorf("server error: %d", resp.StatusCode)
			continue
		} else if resp.StatusCode != 200 {
			// Other errors - don't retry
			var openAIResp OpenAIResponse
			if json.Unmarshal(body, &openAIResp) == nil && openAIResp.Error != nil {
				return "", fmt.Errorf("OpenAI error: %s", openAIResp.Error.Message)
			}
			return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}

		var openAIResp OpenAIResponse
		if err := json.Unmarshal(body, &openAIResp); err != nil {
			lastErr = fmt.Errorf("parse error: %w", err)
			continue
		}

		if openAIResp.Error != nil {
			return "", fmt.Errorf("OpenAI error: %s", openAIResp.Error.Message)
		}

		if len(openAIResp.Choices) == 0 {
			lastErr = fmt.Errorf("no response from OpenAI")
			continue
		}

		// Success!
		content := openAIResp.Choices[0].Message.Content
		content = cleanMarkdown(content)
		return strings.TrimSpace(content), nil
	}

	// All retries failed
	log.Printf("❌ OpenAI failed after %d attempts: %v", maxRetries, lastErr)
	return "", lastErr
}

// cleanMarkdown - Remove markdown formatting from AI response
func cleanMarkdown(text string) string {
	// Remove bold markers **text** or __text__
	result := text

	// Remove ** markers
	for strings.Contains(result, "**") {
		result = strings.Replace(result, "**", "", 1)
	}

	// Remove __ markers
	for strings.Contains(result, "__") {
		result = strings.Replace(result, "__", "", 1)
	}

	// Remove * markers for italic (but keep list items)
	lines := strings.Split(result, "\n")
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		// If line doesn't start with * (not a list item), remove single *
		if !strings.HasPrefix(trimmed, "* ") && !strings.HasPrefix(trimmed, "- ") {
			// Remove italic markers *text*
			lines[i] = removeItalicMarkers(line)
		}
	}
	result = strings.Join(lines, "\n")

	// Remove # headers markers
	result = strings.ReplaceAll(result, "### ", "")
	result = strings.ReplaceAll(result, "## ", "")
	result = strings.ReplaceAll(result, "# ", "")

	// Remove backtick code markers
	result = strings.ReplaceAll(result, "```", "")
	result = strings.ReplaceAll(result, "`", "")

	return result
}

// removeItalicMarkers - Remove single * italic markers but preserve text
func removeItalicMarkers(text string) string {
	result := []rune(text)
	var output []rune
	i := 0
	for i < len(result) {
		if result[i] == '*' {
			// Check if it's a single * (italic), not ** (bold, already removed)
			if i+1 < len(result) && result[i+1] != '*' && result[i+1] != ' ' {
				// Skip this * marker
				i++
				continue
			}
			// If * followed by space, might be list - keep it
			if i+1 < len(result) && result[i+1] == ' ' {
				output = append(output, result[i])
				i++
				continue
			}
		}
		output = append(output, result[i])
		i++
	}
	return string(output)
}

// GET /api/ai/suggestions - Get instruction suggestions
func GetAISuggestions(c *gin.Context) {
	suggestions := []gin.H{
		{"id": 1, "question": "Portfolio qanday yarataman?", "category": "portfolio"},
		{"id": 2, "question": "Sertifikat qanday yuklayman?", "category": "portfolio"},
		{"id": 3, "question": "Portfoliom nima uchun rad etildi?", "category": "portfolio"},
		{"id": 4, "question": "Profilimni qanday tahrirlash mumkin?", "category": "profile"},
		{"id": 5, "question": "Parolimni qanday o'zgartiraman?", "category": "profile"},
		{"id": 6, "question": "Bildirishnomalar qanday ishlaydi?", "category": "system"},
		{"id": 7, "question": "Admin bilan qanday bog'lanaman?", "category": "support"},
		{"id": 8, "question": "Registrator office qayerda?", "category": "support"},
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
	})
}

// ==================== FILE ANALYSIS WITH VISION ====================

// OpenAI Vision structures
type VisionContent struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}

type ImageURL struct {
	URL    string `json:"url"`
	Detail string `json:"detail,omitempty"`
}

type VisionMessage struct {
	Role    string          `json:"role"`
	Content []VisionContent `json:"content"`
}

type VisionRequest struct {
	Model     string          `json:"model"`
	Messages  []VisionMessage `json:"messages"`
	MaxTokens int             `json:"max_tokens,omitempty"`
}

// Vision API Response structures
type VisionResponseChoice struct {
	Index   int `json:"index"`
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	FinishReason string `json:"finish_reason"`
}

type VisionResponse struct {
	ID      string                 `json:"id"`
	Choices []VisionResponseChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

// POST /api/ai/analyze-file - Analyze a single file (image, PDF preview, etc.)
func AnalyzeFile(c *gin.Context) {
	var req struct {
		FileURL     string `json:"file_url" binding:"required"`
		FileType    string `json:"file_type"` // image, document, certificate
		FileName    string `json:"file_name"`
		Description string `json:"description"`
		CheckAI     bool   `json:"check_ai"` // Check if AI-generated
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Fayl URL kiritilmagan",
			Code:    400,
		})
		return
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Build analysis prompt based on file type
	var systemPrompt string
	switch req.FileType {
	case "certificate":
		systemPrompt = `Sen sertifikat va diplom tahlilchisisisan. Rasmni ko'rib quyidagilarni aniqlash:

1. SERTIFIKAT TURI - Qanday sertifikat (kurs, musobaqa, olimpiada, volontyorlik va h.k.)
2. TASHKILOT - Kim tomonidan berilgan
3. SANA - Qachon berilgan
4. HAQIQIYLIK - Sertifikat haqiqiy ko'rinadimi yoki yo'qmi (shubhali belgilar)
5. QIYMAT - Bu sertifikat qanchalik qimmatli (1-10 ball)
6. TAVSIYALAR - Portfolioda qanday taqdim etish kerak

O'zbek tilida professional tahlil ber.`

	case "document", "article", "thesis":
		systemPrompt = `Sen ilmiy maqola va tezis tahlilchisisisan. Hujjatni ko'rib quyidagilarni baholash:

1. HUJJAT TURI - Maqola, tezis, referat, kurs ishi va h.k.
2. MAVZU - Asosiy mavzu va yo'nalish
3. SIFAT - Ilmiy yozuv sifati (1-10 ball)
4. STRUKTURA - Tuzilishi to'g'rimi
5. ORIGINAL - Plagiat yoki AI yozgan belgilari bormi
6. KUCHLI TOMONLAR - Yaxshi qismlari
7. YAXSHILASH KERAK - Qanday yaxshilash mumkin
8. UMUMIY BAHO - 100 ballik tizimda

Professional va konstruktiv tahlil ber. O'zbek tilida.`

	case "project":
		systemPrompt = `Sen IT loyiha tahlilchisisisan. Loyiha screenshot yoki hujjatini ko'rib baholash:

1. LOYIHA TURI - Web, mobile, desktop, AI va h.k.
2. TEXNOLOGIYALAR - Qanday texnologiyalar ishlatilgan
3. DIZAYN - UI/UX sifati (1-10)
4. FUNKSIONALLIK - Qanday funksiyalar ko'rinmoqda
5. PROFESSIONAL DARAJA - Junior/Middle/Senior darajasi
6. TAVSIYALAR - Yaxshilash uchun maslahatlar

O'zbek tilida professional tahlil ber.`

	default:
		systemPrompt = `Sen portfolio fayl tahlilchisisisan. Faylni ko'rib quyidagilarni baholash:

1. FAYL TURI - Bu qanday fayl
2. MAZMUNI - Nimadan iborat
3. SIFAT - Umumiy sifat (1-10)
4. PORTFOLIODA O'RNI - Bu portfolioga qanday qo'shimcha qiladi
5. TAVSIYALAR - Yaxshilash uchun maslahatlar

O'zbek tilida tahlil ber.`
	}

	// Add AI detection check
	if req.CheckAI {
		systemPrompt += `

MUHIM: Shuningdek, bu matn/hujjat AI (ChatGPT, Claude va h.k.) tomonidan yozilgan yoki yo'qligini tekshir:
- AI YOZGAN BELGILARI - Qanday belgilar bor
- AI EHTIMOLI - 0-100% orasida AI yozgan ehtimoli
- DALILLAR - Nima uchun shunday deb o'ylaysan`
	}

	// Log the request for debugging
	fmt.Printf("[DEBUG] Analyzing file: %s, type: %s\n", req.FileURL, req.FileType)

	// Check file extension
	fileExt := strings.ToLower(req.FileURL[strings.LastIndex(req.FileURL, ".")+1:])
	isImage := fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png" || fileExt == "gif" || fileExt == "webp"
	isPDF := fileExt == "pdf"

	// PDF files cannot be analyzed with Vision API directly
	if isPDF {
		// Use text-based analysis for PDF
		response, err := callOpenAI(systemPrompt, "Bu PDF fayl: "+req.FileName+". Fayl tavsifi: "+req.Description+". PDF fayllarni to'g'ridan-to'g'ri tahlil qilib bo'lmaydi, lekin fayl nomi va tavsifiga qarab umumiy maslahatlar beraman.")
		if err != nil {
			fmt.Printf("[ERROR] OpenAI error for PDF: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "ai_error",
				Message: "PDF tahlilida xatolik: " + err.Error(),
				Code:    500,
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"analysis":  cleanMarkdown(response),
			"file_type": req.FileType,
			"file_name": req.FileName,
			"check_ai":  req.CheckAI,
			"note":      "PDF fayllar to'g'ridan-to'g'ri tahlil qilinmaydi. Rasmga aylantiring yoki matn ko'chiring.",
		})
		return
	}

	// For images, read file and convert to base64
	if isImage {
		// Get local file path from URL
		localPath := strings.Replace(req.FileURL, "http://localhost:4000", ".", 1)
		fmt.Printf("[DEBUG] Reading local file: %s\n", localPath)

		imageData, err := os.ReadFile(localPath)
		if err != nil {
			fmt.Printf("[ERROR] File read error: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "file_error",
				Message: "Fayl o'qishda xatolik: " + err.Error(),
				Code:    500,
			})
			return
		}

		// Convert to base64
		base64Data := base64.StdEncoding.EncodeToString(imageData)
		mimeType := "image/jpeg"
		if fileExt == "png" {
			mimeType = "image/png"
		} else if fileExt == "gif" {
			mimeType = "image/gif"
		} else if fileExt == "webp" {
			mimeType = "image/webp"
		}

		dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data)
		fmt.Printf("[DEBUG] Base64 image size: %d bytes\n", len(base64Data))

		// Call Vision API with base64
		response, err := callOpenAIVision(systemPrompt, dataURL, req.Description)
		if err != nil {
			fmt.Printf("[ERROR] Vision API error: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "ai_error",
				Message: "Fayl tahlilida xatolik: " + err.Error(),
				Code:    500,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"analysis":  cleanMarkdown(response),
			"file_type": req.FileType,
			"file_name": req.FileName,
			"check_ai":  req.CheckAI,
		})
		return
	}

	// Other file types - text-based analysis
	response, err := callOpenAI(systemPrompt, "Fayl: "+req.FileName+". Fayl tavsifi: "+req.Description+". Bu fayl turini to'g'ridan-to'g'ri tahlil qilib bo'lmaydi.")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Tahlil xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"analysis":  cleanMarkdown(response),
		"file_type": req.FileType,
		"file_name": req.FileName,
		"check_ai":  req.CheckAI,
		"note":      "Bu fayl turi to'g'ridan-to'g'ri tahlil qilinmaydi.",
	})
}

// POST /api/ai/detect-ai - Check if text is AI-generated
func DetectAIContent(c *gin.Context) {
	var req struct {
		Text         string `json:"text" binding:"required"`
		Language     string `json:"language"`      // uz, ru, en
		DocumentType string `json:"document_type"` // cv, essay, article, thesis, general
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matn kiritilmagan",
			Code:    400,
		})
		return
	}

	if len(req.Text) < 50 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matn juda qisqa (kamida 50 belgi kerak)",
			Code:    400,
		})
		return
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Professional Linguistic Analysis System Prompt
	systemPrompt := `Sen professional lingvistik analizchi va matn baholovchisisisan.

🎯 VAZIFANG:
Berilgan matnni LINGVISTIK va STILISTIK jihatdan tahlil qilish. Sen AI-detektor EMASSAN - sen til mutaxassisisisan. Matnning til xususiyatlarini tahlil qilib, ANALITIK XULOSA berasan.

⚠️ MUHIM CHEKLOVLAR:
- 100% aniqlik da'vo qilma
- Bu QAROR emas, ANALITIK XULOSA
- Ehtimollik va ishonchlilik darajasini ko'rsat
- Fayl formati yoki model nomiga qarama

📊 TAHLIL MEZONLARI:

1. TIL RITMI VA OQIMI
   - Gap uzunliklari variatsiyasi
   - Tabiiy to'xtash joylari
   - Fikr oqimining izchilligi

2. GRAMMATIK XUSUSIYATLAR
   - Haddan tashqari "silliq" yozuv (AI belgisi)
   - Tabiiy grammatik variatsiyalar (inson belgisi)
   - Murakkab gap tuzilmalari

3. SHAXSIYLIK SIGNALLARI
   - Shaxsiy tajriba va misollar
   - Emotsional rang-baranglik
   - Noaniq yoki subjektiv fikrlar
   - Kontekstual bilim

4. LEKSIK TAHLIL
   - So'z tanlovi tabiiylik darajasi
   - Takrorlanuvchi pattern'lar
   - Idiomatik ifodalar

5. STRUKTURA TAHLILI
   - Haddan tashqari tartiblilik (AI belgisi)
   - Organik fikr rivojlanishi (inson belgisi)
   - Ro'yxat va bullet point'lar

📤 JAVOB FORMATI (FAQAT JSON):
{
  "overall_assessment": {
    "conclusion": "AI signallari yuqori / Aralash / Inson signallari yuqori",
    "confidence_level": "past / o'rta / yuqori",
    "ai_probability_range": "10-30% / 30-60% / 60-90%"
  },
  "ai_signals": [
    {"signal": "signal nomi", "description": "tushuntirish", "weight": "kuchli/o'rta/kuchsiz"}
  ],
  "human_signals": [
    {"signal": "signal nomi", "description": "tushuntirish", "weight": "kuchli/o'rta/kuchsiz"}
  ],
  "linguistic_analysis": {
    "rhythm_score": 1-10,
    "personality_score": 1-10,
    "naturalness_score": 1-10,
    "notes": "qisqa izoh"
  },
  "document_specific_notes": "hujjat turiga xos eslatmalar",
  "recommendation": "tavsiya"
}

FAQAT JSON formatida javob ber.`

	// Add document-specific context
	docContext := ""
	switch req.DocumentType {
	case "cv", "resume":
		docContext = `
📋 HUJJAT TURI: CV/REZYUME
⚠️ ESLATMA: CV'lar ko'pincha "aralash" natija beradi chunki:
- Rasmiy til talab qilinadi
- Shablon ifodalar ko'p ishlatiladi
- Qisqa, strukturaviy matn
- Bu sohada AI va inson yozuvi o'xshash bo'lishi mumkin
Shuning uchun CV uchun ishonchlilik darajasi PAST bo'ladi.`

	case "essay":
		docContext = `
📋 HUJJAT TURI: ESSE
Esse uchun shaxsiy fikr va tajriba muhim. Shaxsiylik signallariga alohida e'tibor ber.`

	case "article", "thesis":
		docContext = `
📋 HUJJAT TURI: ILMIY MAQOLA/TEZIS
⚠️ ESLATMA: Ilmiy matnlar rasmiy va strukturaviy. Bu AI belgisi EMAS.
Ilmiy uslub va AI uslubini farqlash qiyin - ishonchlilik o'rtacha bo'ladi.`

	default:
		docContext = `
📋 HUJJAT TURI: UMUMIY MATN`
	}

	response, err := callOpenAI(systemPrompt+docContext, "TAHLIL QILINADIGAN MATN:\n\n"+req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Tahlil xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	// Clean and parse JSON response
	cleanedResponse := cleanJSONResponse(response)

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		// If not valid JSON, create structured response
		c.JSON(http.StatusOK, gin.H{
			"overall_assessment": gin.H{
				"conclusion":           "Tahlil yakunlandi",
				"confidence_level":     "o'rta",
				"ai_probability_range": "aniqlanmadi",
			},
			"raw_analysis":   response,
			"document_type":  req.DocumentType,
			"text_length":    len(req.Text),
			"parsing_failed": true,
		})
		return
	}

	// Add metadata
	result["document_type"] = req.DocumentType
	result["text_length"] = len(req.Text)
	result["analysis_version"] = "2.0"

	c.JSON(http.StatusOK, result)
}

// cleanJSONResponse - Clean markdown code blocks from response
func cleanJSONResponse(response string) string {
	response = strings.TrimSpace(response)

	// Remove ```json\n and \n``` markers (with newlines)
	if strings.HasPrefix(response, "```json") {
		response = strings.TrimPrefix(response, "```json")
		response = strings.TrimSpace(response)
	}
	if strings.HasPrefix(response, "```") {
		response = strings.TrimPrefix(response, "```")
		response = strings.TrimSpace(response)
	}
	if strings.HasSuffix(response, "```") {
		response = strings.TrimSuffix(response, "```")
		response = strings.TrimSpace(response)
	}

	// Find JSON object boundaries
	startIdx := strings.Index(response, "{")
	endIdx := strings.LastIndex(response, "}")

	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		response = response[startIdx : endIdx+1]
	}

	return response
}

// POST /api/ai/analyze-portfolio-files - Analyze all portfolio files
func AnalyzePortfolioFiles(c *gin.Context) {
	var req struct {
		PortfolioID string `json:"portfolio_id" binding:"required"`
		Files       []struct {
			URL      string `json:"url"`
			Name     string `json:"name"`
			MimeType string `json:"mime_type"`
			Type     string `json:"type"` // certificate, document, project, media
		} `json:"files"`
		IncludeAICheck bool `json:"include_ai_check"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Portfolio ID kiritilmagan",
			Code:    400,
		})
		return
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// If no files provided, fetch from database
	if len(req.Files) == 0 {
		rows, err := database.DB.Query(`
			SELECT file_url, title, file_type, type 
			FROM portfolios 
			WHERE id = $1 OR owner_id = $1
		`, req.PortfolioID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var url, name, mimeType, pType string
				if rows.Scan(&url, &name, &mimeType, &pType) == nil {
					req.Files = append(req.Files, struct {
						URL      string `json:"url"`
						Name     string `json:"name"`
						MimeType string `json:"mime_type"`
						Type     string `json:"type"`
					}{url, name, mimeType, pType})
				}
			}
		}
	}

	// Build comprehensive analysis prompt
	var filesDescription strings.Builder
	filesDescription.WriteString("Portfolio fayllar ro'yxati:\n\n")

	for i, file := range req.Files {
		filesDescription.WriteString(fmt.Sprintf("%d. %s\n", i+1, file.Name))
		filesDescription.WriteString(fmt.Sprintf("   - Turi: %s\n", file.Type))
		filesDescription.WriteString(fmt.Sprintf("   - Format: %s\n", file.MimeType))
		filesDescription.WriteString(fmt.Sprintf("   - URL: %s\n\n", file.URL))
	}

	systemPrompt := `Sen professional portfolio ekspertisisan. Talabaning portfoliosidagi barcha fayllarni umumiy tahlil qilish:

1. UMUMIY TAHLIL
   - Portfolio to'liqligi (1-10)
   - Professional ko'rinish (1-10)
   - Mazmun sifati (1-10)

2. FAYLLAR TAHLILI
   - Har bir fayl turi bo'yicha baho
   - Eng kuchli fayllar
   - Yaxshilash kerak bo'lgan fayllar

3. TAVSIYALAR
   - Qanday fayllar qo'shish kerak
   - Qaysi fayllarni yaxshilash kerak
   - Portfolio strategiyasi

4. UMUMIY BALL - 100 ballik tizimda

O'zbek tilida professional, konstruktiv tahlil ber.`

	if req.IncludeAICheck {
		systemPrompt += `

5. AI TEKSHIRUV
   - Qaysi fayllar AI yordamida yaratilgan bo'lishi mumkin
   - Original kontentga baho`
	}

	response, err := callOpenAI(systemPrompt, filesDescription.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Portfolio tahlilida xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"analysis":     cleanMarkdown(response),
		"portfolio_id": req.PortfolioID,
		"files_count":  len(req.Files),
		"ai_check":     req.IncludeAICheck,
	})
}

// POST /api/ai/extract-text - Extract text from image using OCR (Vision API)
func ExtractTextFromImage(c *gin.Context) {
	var req struct {
		FileURL  string `json:"file_url" binding:"required"`
		FileName string `json:"file_name"`
		Language string `json:"language"` // uz, ru, en
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Fayl URL kiritilmagan",
			Code:    400,
		})
		return
	}

	// Rate limiting
	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Get file extension
	fileExt := strings.ToLower(req.FileURL[strings.LastIndex(req.FileURL, ".")+1:])
	isImage := fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png" || fileExt == "gif" || fileExt == "webp"

	if !isImage {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_file",
			Message: "Faqat rasm fayllar qo'llab-quvvatlanadi (JPG, PNG, GIF, WEBP)",
			Code:    400,
		})
		return
	}

	// Read local file
	localPath := strings.Replace(req.FileURL, "http://localhost:4000", ".", 1)
	imageData, err := os.ReadFile(localPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "file_error",
			Message: "Fayl o'qishda xatolik",
			Code:    500,
		})
		return
	}

	// Convert to base64
	base64Data := base64.StdEncoding.EncodeToString(imageData)
	mimeType := "image/jpeg"
	if fileExt == "png" {
		mimeType = "image/png"
	}
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data)

	// OCR Prompt
	lang := "o'zbek"
	if req.Language == "ru" {
		lang = "rus"
	} else if req.Language == "en" {
		lang = "ingliz"
	}

	ocrPrompt := fmt.Sprintf(`Sen OCR (Optical Character Recognition) tizimiisan. 
Rasmdagi barcha matnni %s tilida aniq o'qib chiqar.

VAZIFALAR:
1. Rasmdagi barcha yozuvlarni o'qi
2. Matnni asl formatida saqla (paragraflar, ro'yxatlar)
3. Jadvallar bo'lsa, ularni ham o'qi
4. Qo'l yozuvi bo'lsa, uni ham aniqlashga harakat qil
5. Noaniq joylarni [noaniq] deb belgilab qo'y

FAQAT rasmdagi matnni qaytargin, boshqa izoh kerak emas.`, lang)

	response, err := callOpenAIVision(ocrPrompt, dataURL, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ocr_error",
			Message: "Matn o'qishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"extracted_text": response,
		"file_name":      req.FileName,
		"language":       req.Language,
		"char_count":     len(response),
		"word_count":     len(strings.Fields(response)),
	})
}

// GET /api/ai/analysis-history - Get user's analysis history
func GetAnalysisHistory(c *gin.Context) {
	userID := c.GetString("user_id")
	// Role ni to'g'ri olish
	var userRole string
	if role, exists := c.Get("role"); exists {
		userRole = fmt.Sprintf("%v", role)
	}
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o := c.Query("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}

	log.Printf("[GetAnalysisHistory] userID: %s, role: %s", userID, userRole)

	var rows *sql.Rows
	var err error

	// Admin barcha tarixni ko'radi
	if strings.ToUpper(userRole) == "ADMIN" {
		rows, err = database.DB.Query(`
			SELECT id, file_name, file_type, analysis_type, conclusion, 
			       confidence_level, ai_probability_range, processing_time_ms, created_at,
				   text_length, rhythm_score, personality_score, naturalness_score, document_type
			FROM file_analysis_results
			ORDER BY created_at DESC
			LIMIT $1 OFFSET $2
		`, limit, offset)
	} else {
		rows, err = database.DB.Query(`
			SELECT id, file_name, file_type, analysis_type, conclusion, 
			       confidence_level, ai_probability_range, processing_time_ms, created_at,
				   text_length, rhythm_score, personality_score, naturalness_score, document_type
			FROM file_analysis_results
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, userID, limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Tarix olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var id, fileName, fileType, analysisType, docType string
		var conclusion, confidenceLevel, aiProbRange *string
		var processingTime, textLength, rhythm, personality, naturalness *int
		var createdAt time.Time

		if err := rows.Scan(&id, &fileName, &fileType, &analysisType, &conclusion,
			&confidenceLevel, &aiProbRange, &processingTime, &createdAt,
			&textLength, &rhythm, &personality, &naturalness, &docType); err != nil {
			continue
		}

		item := map[string]interface{}{
			"id":                   id,
			"file_name":            fileName,
			"file_type":            fileType,
			"analysis_type":        analysisType,
			"conclusion":           conclusion,
			"confidence_level":     confidenceLevel,
			"ai_probability_range": aiProbRange,
			"processing_time_ms":   processingTime,
			"created_at":           createdAt,
			"text_length":          textLength,
			"rhythm_score":         rhythm,
			"personality_score":    personality,
			"naturalness_score":    naturalness,
			"document_type":        docType,
		}
		history = append(history, item)
	}

	// Get total count
	var total int
	if strings.ToUpper(userRole) == "ADMIN" {
		database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results`).Scan(&total)
	} else {
		database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE user_id = $1`, userID).Scan(&total)
	}

	log.Printf("[GetAnalysisHistory] Total records: %d, returning %d items", total, len(history))

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GET /api/ai/analysis-stats - Get user's analysis statistics
func GetAnalysisStats(c *gin.Context) {
	userID := c.GetString("user_id")
	// Role ni to'g'ri olish
	var userRole string
	if role, exists := c.Get("role"); exists {
		userRole = fmt.Sprintf("%v", role)
	}
	isAdmin := strings.ToUpper(userRole) == "ADMIN"

	log.Printf("[GetAnalysisStats] userID: %s, role: %s, isAdmin: %v", userID, userRole, isAdmin)

	var stats struct {
		TotalAnalyses      int     `json:"total_analyses"`
		AIDetectedCount    int     `json:"ai_detected_count"`
		HumanDetectedCount int     `json:"human_detected_count"`
		MixedCount         int     `json:"mixed_count"`
		AvgProcessingTime  float64 `json:"avg_processing_time"`
		TodayCount         int     `json:"today_count"`
		WeekCount          int     `json:"week_count"`
	}

	// Total analyses
	if isAdmin {
		database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results`).Scan(&stats.TotalAnalyses)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results WHERE user_id = $1
		`, userID).Scan(&stats.TotalAnalyses)
	}

	// AI detected (conclusion contains 'AI' or confidence is high)
	if isAdmin {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE LOWER(conclusion) LIKE '%ai%' OR 
				LOWER(conclusion) LIKE '%sun''iy%'
		`).Scan(&stats.AIDetectedCount)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE user_id = $1 AND (
				LOWER(conclusion) LIKE '%ai%' OR 
				LOWER(conclusion) LIKE '%sun''iy%'
			)
		`, userID).Scan(&stats.AIDetectedCount)
	}

	// Human detected
	if isAdmin {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE LOWER(conclusion) LIKE '%inson%' OR 
				LOWER(conclusion) LIKE '%human%'
		`).Scan(&stats.HumanDetectedCount)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE user_id = $1 AND (
				LOWER(conclusion) LIKE '%inson%' OR 
				LOWER(conclusion) LIKE '%human%'
			)
		`, userID).Scan(&stats.HumanDetectedCount)
	}

	// Mixed/uncertain
	stats.MixedCount = stats.TotalAnalyses - stats.AIDetectedCount - stats.HumanDetectedCount
	if stats.MixedCount < 0 {
		stats.MixedCount = 0
	}

	// Average processing time
	if isAdmin {
		database.DB.QueryRow(`SELECT COALESCE(AVG(processing_time_ms), 0) FROM file_analysis_results`).Scan(&stats.AvgProcessingTime)
	} else {
		database.DB.QueryRow(`
			SELECT COALESCE(AVG(processing_time_ms), 0) FROM file_analysis_results WHERE user_id = $1
		`, userID).Scan(&stats.AvgProcessingTime)
	}

	// Today count
	if isAdmin {
		database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE created_at >= CURRENT_DATE`).Scan(&stats.TodayCount)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE user_id = $1 AND created_at >= CURRENT_DATE
		`, userID).Scan(&stats.TodayCount)
	}

	// This week count
	if isAdmin {
		database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`).Scan(&stats.WeekCount)
	} else {
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM file_analysis_results 
			WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
		`, userID).Scan(&stats.WeekCount)
	}

	log.Printf("[GetAnalysisStats] Stats: total=%d, ai=%d, human=%d, today=%d, week=%d",
		stats.TotalAnalyses, stats.AIDetectedCount, stats.HumanDetectedCount, stats.TodayCount, stats.WeekCount)

	c.JSON(http.StatusOK, stats)
}

// POST /api/ai/save-analysis - Save analysis result to history
func SaveAnalysisResult(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		PortfolioID        string                 `json:"portfolio_id"`
		FileURL            string                 `json:"file_url"`
		FileName           string                 `json:"file_name"`
		FileType           string                 `json:"file_type"`
		MimeType           string                 `json:"mime_type"`
		AnalysisType       string                 `json:"analysis_type" binding:"required"`
		AnalysisResult     map[string]interface{} `json:"analysis_result" binding:"required"`
		AIProbabilityRange string                 `json:"ai_probability_range"`
		ConfidenceLevel    string                 `json:"confidence_level"`
		Conclusion         string                 `json:"conclusion"`
		RhythmScore        int                    `json:"rhythm_score"`
		PersonalityScore   int                    `json:"personality_score"`
		NaturalnessScore   int                    `json:"naturalness_score"`
		AnalyzedText       string                 `json:"analyzed_text"`
		DocumentType       string                 `json:"document_type"`
		ProcessingTimeMs   int                    `json:"processing_time_ms"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar to'liq emas",
			Code:    400,
		})
		return
	}

	// Convert analysis result to JSON
	resultJSON, _ := json.Marshal(req.AnalysisResult)

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO file_analysis_results (
			user_id, portfolio_id, file_url, file_name, file_type, mime_type,
			analysis_type, analysis_result, ai_probability_range, confidence_level,
			conclusion, rhythm_score, personality_score, naturalness_score,
			analyzed_text, text_length, document_type, processing_time_ms
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		RETURNING id
	`, userID, req.PortfolioID, req.FileURL, req.FileName, req.FileType, req.MimeType,
		req.AnalysisType, resultJSON, req.AIProbabilityRange, req.ConfidenceLevel,
		req.Conclusion, req.RhythmScore, req.PersonalityScore, req.NaturalnessScore,
		req.AnalyzedText, len(req.AnalyzedText), req.DocumentType, req.ProcessingTimeMs,
	).Scan(&id)

	if err != nil {
		fmt.Printf("[ERROR] Save analysis error: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Natija saqlashda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"message": "Tahlil natijasi saqlandi",
	})
}

// callOpenAIVision - Call OpenAI Vision API for image analysis
func callOpenAIVision(systemPrompt, imageURL, description string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OPENAI_API_KEY not set")
	}

	// Build content array
	content := []VisionContent{
		{Type: "text", Text: systemPrompt},
	}

	// Add description if provided
	if description != "" {
		content = append(content, VisionContent{
			Type: "text",
			Text: "Fayl haqida qo'shimcha ma'lumot: " + description,
		})
	}

	// Add image
	content = append(content, VisionContent{
		Type: "image_url",
		ImageURL: &ImageURL{
			URL:    imageURL,
			Detail: "high",
		},
	})

	reqBody := VisionRequest{
		Model: "gpt-4o",
		Messages: []VisionMessage{
			{Role: "user", Content: content},
		},
		MaxTokens: 2000,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("JSON marshal error: %v", err)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("request create error: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("API call error: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("response read error: %v", err)
	}

	// Log response for debugging
	fmt.Printf("[DEBUG] Vision API status: %d\n", resp.StatusCode)
	fmt.Printf("[DEBUG] Vision API response: %s\n", string(body[:min(len(body), 1000)]))

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var visionResp VisionResponse
	if err := json.Unmarshal(body, &visionResp); err != nil {
		return "", fmt.Errorf("JSON parse error: %v, body: %s", err, string(body[:min(len(body), 500)]))
	}

	if visionResp.Error != nil {
		return "", fmt.Errorf("OpenAI error: %s (type: %s)", visionResp.Error.Message, visionResp.Error.Type)
	}

	if len(visionResp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return visionResp.Choices[0].Message.Content, nil
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GET /api/ai/export-history - Export analysis history as JSON/CSV
func ExportAnalysisHistory(c *gin.Context) {
	userID := c.GetString("user_id")
	format := c.DefaultQuery("format", "json") // json, csv

	rows, err := database.DB.Query(`
		SELECT id, file_name, file_type, analysis_type, conclusion, 
		       confidence_level, ai_probability_range, rhythm_score,
		       personality_score, naturalness_score, processing_time_ms, 
		       document_type, text_length, created_at
		FROM file_analysis_results
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Ma'lumotlarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type ExportRow struct {
		ID                 string    `json:"id"`
		FileName           string    `json:"file_name"`
		FileType           string    `json:"file_type"`
		AnalysisType       string    `json:"analysis_type"`
		Conclusion         string    `json:"conclusion"`
		ConfidenceLevel    string    `json:"confidence_level"`
		AIProbabilityRange string    `json:"ai_probability_range"`
		RhythmScore        int       `json:"rhythm_score"`
		PersonalityScore   int       `json:"personality_score"`
		NaturalnessScore   int       `json:"naturalness_score"`
		ProcessingTimeMs   int       `json:"processing_time_ms"`
		DocumentType       string    `json:"document_type"`
		TextLength         int       `json:"text_length"`
		CreatedAt          time.Time `json:"created_at"`
	}

	var results []ExportRow
	for rows.Next() {
		var row ExportRow
		var conclusion, confLevel, aiProb, docType *string
		var rhythm, personality, naturalness, procTime, textLen *int

		if err := rows.Scan(&row.ID, &row.FileName, &row.FileType, &row.AnalysisType,
			&conclusion, &confLevel, &aiProb, &rhythm, &personality, &naturalness,
			&procTime, &docType, &textLen, &row.CreatedAt); err != nil {
			continue
		}

		if conclusion != nil {
			row.Conclusion = *conclusion
		}
		if confLevel != nil {
			row.ConfidenceLevel = *confLevel
		}
		if aiProb != nil {
			row.AIProbabilityRange = *aiProb
		}
		if rhythm != nil {
			row.RhythmScore = *rhythm
		}
		if personality != nil {
			row.PersonalityScore = *personality
		}
		if naturalness != nil {
			row.NaturalnessScore = *naturalness
		}
		if procTime != nil {
			row.ProcessingTimeMs = *procTime
		}
		if docType != nil {
			row.DocumentType = *docType
		}
		if textLen != nil {
			row.TextLength = *textLen
		}

		results = append(results, row)
	}

	if format == "csv" {
		// Generate CSV
		var csvBuilder strings.Builder
		csvBuilder.WriteString("ID,Fayl nomi,Fayl turi,Tahlil turi,Xulosa,Ishonchlilik,AI ehtimoli,Ritm,Shaxsiylik,Tabiiylik,Vaqt (ms),Hujjat turi,Matn uzunligi,Sana\n")

		for _, row := range results {
			csvBuilder.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%d,%d,%d,%d,%s,%d,%s\n",
				row.ID, row.FileName, row.FileType, row.AnalysisType, row.Conclusion,
				row.ConfidenceLevel, row.AIProbabilityRange, row.RhythmScore,
				row.PersonalityScore, row.NaturalnessScore, row.ProcessingTimeMs,
				row.DocumentType, row.TextLength, row.CreatedAt.Format("2006-01-02 15:04:05")))
		}

		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", "attachment; filename=tahlil_tarixi.csv")
		c.String(http.StatusOK, csvBuilder.String())
		return
	}

	// JSON format
	c.JSON(http.StatusOK, gin.H{
		"data":        results,
		"total":       len(results),
		"exported_at": time.Now(),
	})
}

// POST /api/ai/compare-texts - Compare two texts linguistically
func CompareTexts(c *gin.Context) {
	var req struct {
		Text1       string `json:"text1" binding:"required"`
		Text2       string `json:"text2" binding:"required"`
		CompareType string `json:"compare_type"` // similarity, style, authorship
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ikkita matn kiritilishi kerak",
			Code:    400,
		})
		return
	}

	if len(req.Text1) < 50 || len(req.Text2) < 50 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Har bir matn kamida 50 belgi bo'lishi kerak",
			Code:    400,
		})
		return
	}

	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	systemPrompt := `Sen professional lingvistik taqqoslash mutaxassisisisan.

VAZIFA: Ikki matnni taqqoslab, quyidagilarni aniqlash:

1. O'XSHASHLIK DARAJASI (0-100%)
   - Leksik o'xshashlik
   - Grammatik o'xshashlik
   - Uslubiy o'xshashlik

2. MUALLIFLIK TAHLILI
   - Bir muallif yozgan ehtimoli (0-100%)
   - Yozuv uslubi farqlari
   - So'z tanlovi farqlari

3. AI TAHLILI
   - Birinchi matn AI ehtimoli
   - Ikkinchi matn AI ehtimoli
   - Qaysi biri ko'proq AI belgisiga ega

4. XULOSA
   - Umumiy baho
   - Tavsiyalar

JAVOB FORMATI (FAQAT JSON):
{
  "similarity": {
    "overall": 0-100,
    "lexical": 0-100,
    "grammatical": 0-100,
    "stylistic": 0-100
  },
  "authorship": {
    "same_author_probability": 0-100,
    "style_differences": ["farq1", "farq2"],
    "vocabulary_differences": ["farq1", "farq2"]
  },
  "ai_analysis": {
    "text1_ai_probability": "10-30% / 30-60% / 60-90%",
    "text2_ai_probability": "10-30% / 30-60% / 60-90%",
    "more_ai_like": "text1 / text2 / teng"
  },
  "conclusion": "xulosa matni",
  "recommendations": ["tavsiya1", "tavsiya2"]
}

FAQAT JSON formatida javob ber.`

	userMessage := fmt.Sprintf("BIRINCHI MATN:\n%s\n\nIKKINCHI MATN:\n%s", req.Text1, req.Text2)

	response, err := callOpenAI(systemPrompt, userMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Taqqoslashda xatolik",
			Code:    500,
		})
		return
	}

	cleanedResponse := cleanJSONResponse(response)

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"raw_analysis":  response,
			"text1_length":  len(req.Text1),
			"text2_length":  len(req.Text2),
			"parsing_error": true,
		})
		return
	}

	result["text1_length"] = len(req.Text1)
	result["text2_length"] = len(req.Text2)

	c.JSON(http.StatusOK, result)
}

// POST /api/ai/suggest-improvements - Get improvement suggestions for text
func SuggestTextImprovements(c *gin.Context) {
	var req struct {
		Text         string `json:"text" binding:"required"`
		DocumentType string `json:"document_type"` // cv, essay, article, thesis
		Language     string `json:"language"`      // uz, ru, en
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matn kiritilmagan",
			Code:    400,
		})
		return
	}

	if len(req.Text) < 50 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matn juda qisqa",
			Code:    400,
		})
		return
	}

	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	docTypeContext := ""
	switch req.DocumentType {
	case "cv":
		docTypeContext = "Bu CV/Rezyume matni. Professional va qisqa bo'lishi kerak."
	case "essay":
		docTypeContext = "Bu esse. Shaxsiy fikr va dalillar muhim."
	case "article":
		docTypeContext = "Bu ilmiy maqola. Akademik uslub va havolalar muhim."
	case "thesis":
		docTypeContext = "Bu tezis/dissertatsiya. Ilmiy qat'iylik va struktura muhim."
	default:
		docTypeContext = "Umumiy matn."
	}

	systemPrompt := fmt.Sprintf(`Sen professional matn muharriri va yozuv bo'yicha maslahatchi san.

HUJJAT TURI: %s

VAZIFA: Berilgan matnni tahlil qilib, yaxshilash uchun tavsiyalar ber.

TAHLIL SOHALARI:
1. GRAMMATIKA - xatolar va tuzatishlar
2. USLUB - yozuv uslubi yaxshilash
3. STRUKTURA - tuzilishni yaxshilash
4. SO'Z BOYLIGI - leksikani kengaytirish
5. ANIQLIK - noaniq joylarni aniqlash
6. KUCHLI TOMONLAR - yaxshi qismlar

JAVOB FORMATI (FAQAT JSON):
{
  "grammar": {
    "errors": [{"text": "xato", "correction": "to'g'ri", "explanation": "tushuntirish"}],
    "score": 1-10
  },
  "style": {
    "suggestions": ["tavsiya1", "tavsiya2"],
    "score": 1-10
  },
  "structure": {
    "suggestions": ["tavsiya1", "tavsiya2"],
    "score": 1-10
  },
  "vocabulary": {
    "weak_words": ["so'z1", "so'z2"],
    "alternatives": {"so'z1": ["muqobil1", "muqobil2"]},
    "score": 1-10
  },
  "clarity": {
    "unclear_parts": ["qism1"],
    "suggestions": ["tavsiya1"],
    "score": 1-10
  },
  "strengths": ["kuchli tomon1", "kuchli tomon2"],
  "overall_score": 1-100,
  "improved_version": "yaxshilangan matn varianti (qisqa bo'lsa)"
}

O'zbek tilida javob ber. FAQAT JSON formatida.`, docTypeContext)

	response, err := callOpenAI(systemPrompt, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Tahlilda xatolik",
			Code:    500,
		})
		return
	}

	cleanedResponse := cleanJSONResponse(response)

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"raw_analysis":   response,
			"document_type":  req.DocumentType,
			"text_length":    len(req.Text),
			"parsing_failed": true,
		})
		return
	}

	result["document_type"] = req.DocumentType
	result["text_length"] = len(req.Text)

	c.JSON(http.StatusOK, result)
}

// POST /api/ai/batch-analyze - Analyze multiple texts at once
func BatchAnalyze(c *gin.Context) {
	var req struct {
		Texts []struct {
			ID           string `json:"id"`
			Text         string `json:"text"`
			DocumentType string `json:"document_type"`
		} `json:"texts" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matnlar ro'yxati kiritilmagan",
			Code:    400,
		})
		return
	}

	if len(req.Texts) == 0 || len(req.Texts) > 10 {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "1 dan 10 gacha matn kiritish mumkin",
			Code:    400,
		})
		return
	}

	if !aiRateLimiter.Acquire() {
		c.JSON(http.StatusTooManyRequests, models.APIError{
			Error:   "rate_limit",
			Message: "Juda ko'p so'rovlar",
			Code:    429,
		})
		return
	}
	defer aiRateLimiter.Release()

	// Build batch analysis prompt
	var textsForAnalysis strings.Builder
	textsForAnalysis.WriteString("Quyidagi matnlarni lingvistik tahlil qil:\n\n")

	for i, item := range req.Texts {
		textsForAnalysis.WriteString(fmt.Sprintf("=== MATN #%d (ID: %s, Turi: %s) ===\n%s\n\n",
			i+1, item.ID, item.DocumentType, item.Text))
	}

	systemPrompt := `Sen professional lingvistik analizchisan. Bir nechta matnni tahlil qilasan.

Har bir matn uchun quyidagilarni aniqlash:
1. AI yozgan ehtimoli (10-30% / 30-60% / 60-90%)
2. Ishonchlilik darajasi (past / o'rta / yuqori)
3. Qisqa xulosa

JAVOB FORMATI (FAQAT JSON):
{
  "results": [
    {
      "id": "matn_id",
      "ai_probability_range": "10-30%",
      "confidence_level": "yuqori",
      "conclusion": "Inson signallari yuqori",
      "key_signals": ["signal1", "signal2"]
    }
  ],
  "summary": {
    "total_analyzed": 3,
    "likely_human": 2,
    "likely_ai": 1,
    "mixed": 0
  }
}

FAQAT JSON formatida javob ber.`

	response, err := callOpenAI(systemPrompt, textsForAnalysis.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "Batch tahlilda xatolik",
			Code:    500,
		})
		return
	}

	cleanedResponse := cleanJSONResponse(response)

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"raw_analysis":   response,
			"texts_count":    len(req.Texts),
			"parsing_failed": true,
		})
		return
	}

	result["texts_count"] = len(req.Texts)

	c.JSON(http.StatusOK, result)
}

// ==================== PORTFOLIO IMPROVEMENT SUGGESTIONS ====================

// POST /api/ai/portfolio-suggestions - Get AI suggestions for portfolio improvement
func GetPortfolioImprovementSuggestions(c *gin.Context) {
	userID := c.GetString("user_id")

	// Get user's portfolios
	rows, err := database.DB.Query(`
		SELECT id, title, description, category, approval_status, rating_avg, view_count
		FROM portfolio_items 
		WHERE owner_id = $1
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Portfolio ma'lumotlarini olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	var portfolios []map[string]interface{}
	for rows.Next() {
		var id, title, category, status string
		var description sql.NullString
		var ratingAvg float64
		var viewCount int
		rows.Scan(&id, &title, &description, &category, &status, &ratingAvg, &viewCount)
		portfolios = append(portfolios, map[string]interface{}{
			"id":          id,
			"title":       title,
			"description": description.String,
			"category":    category,
			"status":      status,
			"rating":      ratingAvg,
			"views":       viewCount,
		})
	}

	if len(portfolios) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"suggestions": []string{
				"Birinchi portfoliongizni yarating",
				"O'zingiz qiziqadigan soha bo'yicha loyiha qo'shing",
				"GitHub profilingizni ulang",
			},
			"overall_score":    0,
			"areas_to_improve": []string{"portfolio_count"},
		})
		return
	}

	// Build prompt for AI
	portfolioData := ""
	for _, p := range portfolios {
		portfolioData += fmt.Sprintf("- %s (%s): %s, Status: %s, Rating: %.1f, Views: %d\n",
			p["title"], p["category"], p["description"], p["status"], p["rating"], p["views"])
	}

	systemPrompt := `Sen portfolio yaxshilash bo'yicha mutaxassissan. Talaba portfoliosini tahlil qilib, aniq va foydali tavsiyalar ber.
Javobni JSON formatda ber:
{
	"overall_score": 1-100 oralig'ida umumiy ball,
	"strengths": ["kuchli tomonlar ro'yxati"],
	"weaknesses": ["kamchiliklar ro'yxati"],
	"suggestions": [
		{"priority": "high/medium/low", "area": "soha", "suggestion": "aniq tavsiya", "action": "qanday qilish kerak"}
	],
	"missing_elements": ["yetishmayotgan elementlar"],
	"next_steps": ["keyingi qadamlar"]
}`

	userMessage := fmt.Sprintf("Quyidagi talaba portfoliolarini tahlil qil:\n%s\nJami %d ta portfolio.", portfolioData, len(portfolios))

	// Call OpenAI
	response, err := callOpenAI(systemPrompt, userMessage)
	if err != nil {
		// Return basic suggestions if AI fails
		c.JSON(http.StatusOK, gin.H{
			"suggestions": []map[string]string{
				{"priority": "high", "suggestion": "Portfolio tavsiflarini batafsil yozing"},
				{"priority": "medium", "suggestion": "Ko'proq loyihalar qo'shing"},
				{"priority": "low", "suggestion": "Sertifikatlar qo'shing"},
			},
			"overall_score": 50,
			"ai_available":  false,
		})
		return
	}

	// Parse AI response
	cleanedResponse := cleanJSONResponse(response)
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"raw_suggestions": response,
			"parsing_failed":  true,
		})
		return
	}

	result["portfolio_count"] = len(portfolios)
	result["ai_available"] = true

	c.JSON(http.StatusOK, result)
}

// POST /api/ai/improve-text - AI yordamida matn yaxshilash
func ImproveText(c *gin.Context) {
	var req struct {
		Text     string `json:"text" binding:"required"`
		Type     string `json:"type"` // description, title, bio
		Language string `json:"language"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Matn kerak",
			Code:    400,
		})
		return
	}

	textType := req.Type
	if textType == "" {
		textType = "description"
	}

	systemPrompt := `Sen professional kopyrayter va portfolio mutaxassisisisan. Berilgan matnni professional qilib qayta yoz.
Matnni:
1. Grammatik xatolardan tozala
2. Professional ohangda yoz
3. Aniq va tushunarli qil
4. O'zbek tilida javob ber (agar kiruvchi matn o'zbekcha bo'lsa)
Faqat yaxshilangan matnni qaytar, boshqa hech narsa yo'q.`

	response, err := callOpenAI(systemPrompt, "Quyidagi "+textType+" matnini yaxshila: "+req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "AI xizmati mavjud emas",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"original": req.Text,
		"improved": strings.TrimSpace(response),
	})
}

// POST /api/ai/generate-description - Portfolio uchun tavsif generatsiya qilish
func GeneratePortfolioDescription(c *gin.Context) {
	var req struct {
		Title       string   `json:"title" binding:"required"`
		Category    string   `json:"category"`
		Skills      []string `json:"skills"`
		ProjectType string   `json:"project_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Portfolio nomi kerak",
			Code:    400,
		})
		return
	}

	skills := ""
	if len(req.Skills) > 0 {
		skills = "Texnologiyalar: " + strings.Join(req.Skills, ", ")
	}

	systemPrompt := `Sen portfolio tavsif yozuvchi mutaxassissan. Professional va qiziqarli tavsif yoz.
Tavsif qisqa (2-3 gap), aniq va professional bo'lsin.
O'zbek tilida yoz.`

	userMessage := fmt.Sprintf("Portfolio: %s\nKategoriya: %s\n%s\nBu loyiha uchun professional tavsif yoz.",
		req.Title, req.Category, skills)

	response, err := callOpenAI(systemPrompt, userMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "ai_error",
			Message: "AI xizmati mavjud emas",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"description": strings.TrimSpace(response),
		"title":       req.Title,
	})
}

// POST /api/ai/career-advice - Karyera maslahatlari
func GetCareerAdvice(c *gin.Context) {
	userID := c.GetString("user_id")

	// Get user info and portfolios
	var user struct {
		FullName string
		Faculty  sql.NullString
		Major    sql.NullString
	}
	database.DB.QueryRow(`SELECT full_name, faculty, major FROM users WHERE id = $1`, userID).Scan(&user.FullName, &user.Faculty, &user.Major)

	// Get portfolio categories
	rows, _ := database.DB.Query(`SELECT DISTINCT category FROM portfolio_items WHERE owner_id = $1`, userID)
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var cat string
		rows.Scan(&cat)
		categories = append(categories, cat)
	}

	systemPrompt := `Sen karyera maslahatchisisisan. Talabaga uning bilim va ko'nikmalari asosida karyera yo'nalishlarini tavsiya qil.
Javobni JSON formatda ber:
{
	"recommended_careers": [{"title": "lavozim", "match_score": 1-100, "reason": "sabab"}],
	"skills_to_develop": ["rivojlantirish kerak ko'nikmalar"],
	"courses_suggested": ["tavsiya etiladigan kurslar"],
	"advice": "umumiy maslahat"
}`

	userMessage := fmt.Sprintf("Talaba: %s\nFakultet: %s\nYo'nalish: %s\nPortfolio kategoriyalari: %s",
		user.FullName, user.Faculty.String, user.Major.String, strings.Join(categories, ", "))

	response, err := callOpenAI(systemPrompt, userMessage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"recommended_careers": []map[string]interface{}{
				{"title": "Software Developer", "match_score": 80, "reason": "Texnik ko'nikmalar mavjud"},
			},
			"ai_available": false,
		})
		return
	}

	cleanedResponse := cleanJSONResponse(response)
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"raw_advice":     response,
			"parsing_failed": true,
		})
		return
	}

	result["ai_available"] = true
	c.JSON(http.StatusOK, result)
}

// GET /api/admin/ai/analytics - AI tahlil statistikasi (Admin uchun)
func GetAIAnalyticsAdmin(c *gin.Context) {
	// Jami tahlillar soni
	var totalAnalyses int
	database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results`).Scan(&totalAnalyses)

	// Bugungi tahlillar
	var todayAnalyses int
	database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE created_at >= CURRENT_DATE`).Scan(&todayAnalyses)

	// Haftalik tahlillar
	var weeklyAnalyses int
	database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`).Scan(&weeklyAnalyses)

	// Oylik tahlillar
	var monthlyAnalyses int
	database.DB.QueryRow(`SELECT COUNT(*) FROM file_analysis_results WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`).Scan(&monthlyAnalyses)

	// Tahlil turlari bo'yicha
	typeStats := []map[string]interface{}{}
	rows, err := database.DB.Query(`
		SELECT analysis_type, COUNT(*) as count
		FROM file_analysis_results
		GROUP BY analysis_type
		ORDER BY count DESC
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var analysisType string
			var count int
			rows.Scan(&analysisType, &count)
			typeStats = append(typeStats, map[string]interface{}{
				"type":  analysisType,
				"count": count,
			})
		}
	}

	// AI natijalar bo'yicha (AI ehtimoli)
	aiProbabilityStats := []map[string]interface{}{}
	rows2, err := database.DB.Query(`
		SELECT ai_probability_range, COUNT(*) as count
		FROM file_analysis_results
		WHERE ai_probability_range IS NOT NULL
		GROUP BY ai_probability_range
		ORDER BY count DESC
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var prob string
			var count int
			rows2.Scan(&prob, &count)
			aiProbabilityStats = append(aiProbabilityStats, map[string]interface{}{
				"range": prob,
				"count": count,
			})
		}
	}

	// So'nggi 7 kun trend
	dailyTrend := []map[string]interface{}{}
	rows3, err := database.DB.Query(`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM file_analysis_results
		WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
		GROUP BY DATE(created_at)
		ORDER BY date
	`)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var date time.Time
			var count int
			rows3.Scan(&date, &count)
			dailyTrend = append(dailyTrend, map[string]interface{}{
				"date":  date.Format("2006-01-02"),
				"count": count,
			})
		}
	}

	// Eng ko'p tahlil qilgan foydalanuvchilar
	topUsers := []map[string]interface{}{}
	rows4, err := database.DB.Query(`
		SELECT f.user_id, u.full_name, u.email, COUNT(*) as count
		FROM file_analysis_results f
		JOIN users u ON f.user_id::text = u.id::text
		GROUP BY f.user_id, u.full_name, u.email
		ORDER BY count DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var userID, fullName, email string
			var count int
			rows4.Scan(&userID, &fullName, &email, &count)
			topUsers = append(topUsers, map[string]interface{}{
				"user_id":   userID,
				"full_name": fullName,
				"email":     email,
				"count":     count,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_analyses":   totalAnalyses,
		"today_analyses":   todayAnalyses,
		"weekly_analyses":  weeklyAnalyses,
		"monthly_analyses": monthlyAnalyses,
		"by_type":          typeStats,
		"by_ai_probability": aiProbabilityStats,
		"daily_trend":      dailyTrend,
		"top_users":        topUsers,
		"ai_enabled":       os.Getenv("OPENAI_API_KEY") != "",
	})
}
