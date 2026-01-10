// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.

package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"kuafcv-backend/database"
	"kuafcv-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// ===== WEBHOOK TYPES =====

// WebhookEvent turlari
const (
	EventPortfolioCreated  = "portfolio.created"
	EventPortfolioUpdated  = "portfolio.updated"
	EventPortfolioDeleted  = "portfolio.deleted"
	EventPortfolioApproved = "portfolio.approved"
	EventPortfolioRejected = "portfolio.rejected"
	EventUserCreated       = "user.created"
	EventUserDeleted       = "user.deleted"
	EventUserUpdated       = "user.updated"
	EventNotificationSent  = "notification.sent"
	EventLoginSuccess      = "auth.login"
	EventImportCompleted   = "import.completed"
)

// AllWebhookEvents - barcha mavjud hodisalar
var AllWebhookEvents = []string{
	EventPortfolioCreated,
	EventPortfolioUpdated,
	EventPortfolioDeleted,
	EventPortfolioApproved,
	EventPortfolioRejected,
	EventUserCreated,
	EventUserDeleted,
	EventUserUpdated,
	EventNotificationSent,
	EventLoginSuccess,
	EventImportCompleted,
}

// Webhook model
type Webhook struct {
	ID             string            `json:"id"`
	Name           string            `json:"name"`
	URL            string            `json:"url"`
	Secret         *string           `json:"secret,omitempty"`
	Events         []string          `json:"events"`
	IsActive       bool              `json:"is_active"`
	RetryCount     int               `json:"retry_count"`
	TimeoutSeconds int               `json:"timeout_seconds"`
	Headers        map[string]string `json:"headers,omitempty"`
	CreatedBy      *string           `json:"created_by,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

// WebhookLog model
type WebhookLog struct {
	ID             int       `json:"id"`
	WebhookID      string    `json:"webhook_id"`
	EventType      string    `json:"event_type"`
	Payload        any       `json:"payload"`
	ResponseStatus *int      `json:"response_status,omitempty"`
	ResponseBody   *string   `json:"response_body,omitempty"`
	ErrorMessage   *string   `json:"error_message,omitempty"`
	Attempt        int       `json:"attempt"`
	DurationMs     *int      `json:"duration_ms,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// WebhookPayload - webhook so'rovining tana qismi
type WebhookPayload struct {
	Event     string    `json:"event"`
	Timestamp time.Time `json:"timestamp"`
	Data      any       `json:"data"`
}

// WebhookRequest - yangi webhook yaratish uchun
type WebhookRequest struct {
	Name           string            `json:"name" binding:"required"`
	URL            string            `json:"url" binding:"required,url"`
	Secret         string            `json:"secret"`
	Events         []string          `json:"events" binding:"required,min=1"`
	IsActive       bool              `json:"is_active"`
	RetryCount     int               `json:"retry_count"`
	TimeoutSeconds int               `json:"timeout_seconds"`
	Headers        map[string]string `json:"headers"`
}

// ===== WEBHOOK DISPATCHER =====

type webhookDispatcher struct {
	client *http.Client
	mu     sync.RWMutex
}

var dispatcher = &webhookDispatcher{
	client: &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     90 * time.Second,
		},
	},
}

// TriggerWebhook - hodisa yuz berganda webhook'larni ishga tushirish
func TriggerWebhook(eventType string, data any) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("⚠️ Webhook trigger panic: %v", r)
			}
		}()

		// Ushbu event uchun faol webhook'larni olish
		webhooks, err := getActiveWebhooksForEvent(eventType)
		if err != nil {
			log.Printf("❌ Webhook'larni olishda xatolik: %v", err)
			return
		}

		if len(webhooks) == 0 {
			return
		}

		payload := WebhookPayload{
			Event:     eventType,
			Timestamp: time.Now().UTC(),
			Data:      data,
		}

		// Har bir webhook uchun so'rov yuborish
		for _, wh := range webhooks {
			go dispatcher.send(wh, payload)
		}
	}()
}

// send - webhook so'rovini yuborish (retry bilan)
func (d *webhookDispatcher) send(webhook Webhook, payload WebhookPayload) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("❌ Webhook payload marshal xatolik: %v", err)
		return
	}

	var lastError error
	maxRetries := webhook.RetryCount
	if maxRetries == 0 {
		maxRetries = 3
	}

	for attempt := 1; attempt <= maxRetries; attempt++ {
		startTime := time.Now()

		req, err := http.NewRequest("POST", webhook.URL, bytes.NewBuffer(payloadBytes))
		if err != nil {
			lastError = err
			continue
		}

		// Headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "KUAFCV-Webhook/1.0")
		req.Header.Set("X-Webhook-Event", payload.Event)
		req.Header.Set("X-Webhook-Delivery", uuid.New().String())

		// Custom headers
		for key, value := range webhook.Headers {
			req.Header.Set(key, value)
		}

		// Signature (HMAC-SHA256)
		if webhook.Secret != nil && *webhook.Secret != "" {
			signature := computeHMAC(payloadBytes, *webhook.Secret)
			req.Header.Set("X-Webhook-Signature", "sha256="+signature)
		}

		// Timeout
		timeout := time.Duration(webhook.TimeoutSeconds) * time.Second
		if timeout == 0 {
			timeout = 30 * time.Second
		}
		d.client.Timeout = timeout

		resp, err := d.client.Do(req)
		duration := time.Since(startTime)

		// Log yozish
		logEntry := WebhookLog{
			WebhookID:  webhook.ID,
			EventType:  payload.Event,
			Payload:    payload.Data,
			Attempt:    attempt,
			DurationMs: intPtr(int(duration.Milliseconds())),
		}

		if err != nil {
			lastError = err
			errMsg := err.Error()
			logEntry.ErrorMessage = &errMsg
			saveWebhookLog(logEntry)

			// Exponential backoff
			if attempt < maxRetries {
				time.Sleep(time.Duration(attempt*attempt) * time.Second)
			}
			continue
		}

		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyStr := string(bodyBytes)

		logEntry.ResponseStatus = &resp.StatusCode
		logEntry.ResponseBody = &bodyStr
		saveWebhookLog(logEntry)

		// 2xx javob muvaffaqiyatli
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("✅ Webhook yuborildi: %s -> %s (attempt %d)", payload.Event, webhook.URL, attempt)
			return
		}

		lastError = fmt.Errorf("webhook qaytardi: %d", resp.StatusCode)

		// Retry qilish kerakmi?
		if resp.StatusCode >= 500 || resp.StatusCode == 429 {
			if attempt < maxRetries {
				time.Sleep(time.Duration(attempt*attempt) * time.Second)
			}
			continue
		}

		// 4xx xatolar uchun retry qilmaymiz
		break
	}

	if lastError != nil {
		log.Printf("❌ Webhook xatolik: %s -> %s: %v", payload.Event, webhook.URL, lastError)
	}
}

// computeHMAC - HMAC-SHA256 imzo hisoblash
func computeHMAC(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// ===== DATABASE HELPERS =====

// getActiveWebhooksForEvent - berilgan event uchun faol webhook'larni olish
func getActiveWebhooksForEvent(eventType string) ([]Webhook, error) {
	rows, err := database.DB.Query(`
		SELECT id, name, url, secret, events, is_active, retry_count, timeout_seconds, headers
		FROM webhooks
		WHERE is_active = true AND $1 = ANY(events)
	`, eventType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []Webhook
	for rows.Next() {
		var wh Webhook
		var secret sql.NullString
		var headersJSON []byte

		err := rows.Scan(
			&wh.ID, &wh.Name, &wh.URL, &secret,
			pq.Array(&wh.Events), &wh.IsActive,
			&wh.RetryCount, &wh.TimeoutSeconds, &headersJSON,
		)
		if err != nil {
			continue
		}

		if secret.Valid {
			wh.Secret = &secret.String
		}

		if len(headersJSON) > 0 {
			json.Unmarshal(headersJSON, &wh.Headers)
		}

		webhooks = append(webhooks, wh)
	}

	return webhooks, nil
}

// saveWebhookLog - webhook logini saqlash
func saveWebhookLog(logEntry WebhookLog) {
	payloadJSON, _ := json.Marshal(logEntry.Payload)

	_, err := database.DB.Exec(`
		INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body, error_message, attempt, duration_ms)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, logEntry.WebhookID, logEntry.EventType, payloadJSON,
		logEntry.ResponseStatus, logEntry.ResponseBody, logEntry.ErrorMessage,
		logEntry.Attempt, logEntry.DurationMs)

	if err != nil {
		log.Printf("⚠️ Webhook log saqlashda xatolik: %v", err)
	}
}

// ===== API HANDLERS =====

// GET /api/admin/webhooks - Barcha webhook'larni olish
func GetWebhooks(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT w.id, w.name, w.url, w.secret, w.events, w.is_active, 
		       w.retry_count, w.timeout_seconds, w.headers, w.created_by, 
		       w.created_at, w.updated_at,
		       (SELECT COUNT(*) FROM webhook_logs WHERE webhook_id = w.id) as log_count,
		       (SELECT COUNT(*) FROM webhook_logs WHERE webhook_id = w.id AND error_message IS NOT NULL) as error_count
		FROM webhooks w
		ORDER BY w.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook'larni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	type WebhookWithStats struct {
		Webhook
		LogCount   int `json:"log_count"`
		ErrorCount int `json:"error_count"`
	}

	webhooks := []WebhookWithStats{}
	for rows.Next() {
		var wh WebhookWithStats
		var secret sql.NullString
		var createdBy sql.NullString
		var headersJSON []byte

		err := rows.Scan(
			&wh.ID, &wh.Name, &wh.URL, &secret,
			pq.Array(&wh.Events), &wh.IsActive,
			&wh.RetryCount, &wh.TimeoutSeconds, &headersJSON,
			&createdBy, &wh.CreatedAt, &wh.UpdatedAt,
			&wh.LogCount, &wh.ErrorCount,
		)
		if err != nil {
			continue
		}

		if secret.Valid {
			// Secret'ni maskalash
			masked := "****" + secret.String[len(secret.String)-4:]
			wh.Secret = &masked
		}
		if createdBy.Valid {
			wh.CreatedBy = &createdBy.String
		}
		if len(headersJSON) > 0 {
			json.Unmarshal(headersJSON, &wh.Headers)
		}

		webhooks = append(webhooks, wh)
	}

	c.JSON(http.StatusOK, gin.H{
		"webhooks":       webhooks,
		"total":          len(webhooks),
		"available_events": AllWebhookEvents,
	})
}

// GET /api/admin/webhooks/:id - Bitta webhook'ni olish
func GetWebhook(c *gin.Context) {
	id := c.Param("id")

	var wh Webhook
	var secret sql.NullString
	var createdBy sql.NullString
	var headersJSON []byte

	err := database.DB.QueryRow(`
		SELECT id, name, url, secret, events, is_active, retry_count, timeout_seconds, 
		       headers, created_by, created_at, updated_at
		FROM webhooks WHERE id = $1
	`, id).Scan(
		&wh.ID, &wh.Name, &wh.URL, &secret,
		pq.Array(&wh.Events), &wh.IsActive,
		&wh.RetryCount, &wh.TimeoutSeconds, &headersJSON,
		&createdBy, &wh.CreatedAt, &wh.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Webhook topilmadi",
			Code:    404,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook'ni olishda xatolik",
			Code:    500,
		})
		return
	}

	if secret.Valid {
		wh.Secret = &secret.String
	}
	if createdBy.Valid {
		wh.CreatedBy = &createdBy.String
	}
	if len(headersJSON) > 0 {
		json.Unmarshal(headersJSON, &wh.Headers)
	}

	c.JSON(http.StatusOK, wh)
}

// POST /api/admin/webhooks - Yangi webhook yaratish
func CreateWebhook(c *gin.Context) {
	var req WebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri: " + err.Error(),
			Code:    400,
		})
		return
	}

	// URL validatsiya
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_url",
			Message: "URL http:// yoki https:// bilan boshlanishi kerak",
			Code:    400,
		})
		return
	}

	// Events validatsiya
	for _, event := range req.Events {
		valid := false
		for _, allowed := range AllWebhookEvents {
			if event == allowed {
				valid = true
				break
			}
		}
		if !valid {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "invalid_event",
				Message: fmt.Sprintf("Noto'g'ri event turi: %s", event),
				Code:    400,
			})
			return
		}
	}

	userID := c.GetString("user_id")
	id := uuid.New().String()

	// Default qiymatlar
	if req.RetryCount == 0 {
		req.RetryCount = 3
	}
	if req.TimeoutSeconds == 0 {
		req.TimeoutSeconds = 30
	}

	headersJSON, _ := json.Marshal(req.Headers)

	var secret *string
	if req.Secret != "" {
		secret = &req.Secret
	}

	_, err := database.DB.Exec(`
		INSERT INTO webhooks (id, name, url, secret, events, is_active, retry_count, timeout_seconds, headers, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, id, req.Name, req.URL, secret, pq.Array(req.Events),
		req.IsActive, req.RetryCount, req.TimeoutSeconds, headersJSON, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook yaratishda xatolik: " + err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Webhook muvaffaqiyatli yaratildi",
		"id":      id,
	})
}

// PUT /api/admin/webhooks/:id - Webhook'ni yangilash
func UpdateWebhook(c *gin.Context) {
	id := c.Param("id")

	var req WebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "validation_error",
			Message: "Ma'lumotlar noto'g'ri: " + err.Error(),
			Code:    400,
		})
		return
	}

	// URL validatsiya
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "invalid_url",
			Message: "URL http:// yoki https:// bilan boshlanishi kerak",
			Code:    400,
		})
		return
	}

	headersJSON, _ := json.Marshal(req.Headers)

	var secret *string
	if req.Secret != "" {
		secret = &req.Secret
	}

	result, err := database.DB.Exec(`
		UPDATE webhooks 
		SET name = $1, url = $2, secret = COALESCE($3, secret), events = $4, 
		    is_active = $5, retry_count = $6, timeout_seconds = $7, headers = $8
		WHERE id = $9
	`, req.Name, req.URL, secret, pq.Array(req.Events),
		req.IsActive, req.RetryCount, req.TimeoutSeconds, headersJSON, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook yangilashda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Webhook topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Webhook muvaffaqiyatli yangilandi",
	})
}

// DELETE /api/admin/webhooks/:id - Webhook'ni o'chirish
func DeleteWebhook(c *gin.Context) {
	id := c.Param("id")

	result, err := database.DB.Exec(`DELETE FROM webhooks WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook o'chirishda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Webhook topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Webhook muvaffaqiyatli o'chirildi",
	})
}

// PUT /api/admin/webhooks/:id/toggle - Webhook'ni yoqish/o'chirish
func ToggleWebhook(c *gin.Context) {
	id := c.Param("id")

	result, err := database.DB.Exec(`
		UPDATE webhooks SET is_active = NOT is_active WHERE id = $1
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook holatini o'zgartirishda xatolik",
			Code:    500,
		})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Webhook topilmadi",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Webhook holati o'zgartirildi",
	})
}

// POST /api/admin/webhooks/:id/test - Webhook'ni test qilish
func TestWebhook(c *gin.Context) {
	id := c.Param("id")

	var wh Webhook
	var secret sql.NullString
	var headersJSON []byte

	err := database.DB.QueryRow(`
		SELECT id, name, url, secret, events, is_active, retry_count, timeout_seconds, headers
		FROM webhooks WHERE id = $1
	`, id).Scan(
		&wh.ID, &wh.Name, &wh.URL, &secret,
		pq.Array(&wh.Events), &wh.IsActive,
		&wh.RetryCount, &wh.TimeoutSeconds, &headersJSON,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIError{
			Error:   "not_found",
			Message: "Webhook topilmadi",
			Code:    404,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Webhook'ni olishda xatolik",
			Code:    500,
		})
		return
	}

	if secret.Valid {
		wh.Secret = &secret.String
	}
	if len(headersJSON) > 0 {
		json.Unmarshal(headersJSON, &wh.Headers)
	}

	// Test payload
	testPayload := WebhookPayload{
		Event:     "test",
		Timestamp: time.Now().UTC(),
		Data: map[string]interface{}{
			"message": "Bu test so'rovidir",
			"webhook": wh.Name,
		},
	}

	payloadBytes, _ := json.Marshal(testPayload)

	req, err := http.NewRequest("POST", wh.URL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{
			Error:   "request_error",
			Message: "So'rov yaratishda xatolik: " + err.Error(),
			Code:    400,
		})
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "KUAFCV-Webhook/1.0")
	req.Header.Set("X-Webhook-Event", "test")
	req.Header.Set("X-Webhook-Delivery", uuid.New().String())

	for key, value := range wh.Headers {
		req.Header.Set(key, value)
	}

	if wh.Secret != nil && *wh.Secret != "" {
		signature := computeHMAC(payloadBytes, *wh.Secret)
		req.Header.Set("X-Webhook-Signature", "sha256="+signature)
	}

	client := &http.Client{Timeout: time.Duration(wh.TimeoutSeconds) * time.Second}
	startTime := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(startTime)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success":     false,
			"error":       err.Error(),
			"duration_ms": duration.Milliseconds(),
		})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	c.JSON(http.StatusOK, gin.H{
		"success":       resp.StatusCode >= 200 && resp.StatusCode < 300,
		"status_code":   resp.StatusCode,
		"response_body": string(bodyBytes),
		"duration_ms":   duration.Milliseconds(),
	})
}

// GET /api/admin/webhooks/:id/logs - Webhook loglarini olish
func GetWebhookLogs(c *gin.Context) {
	webhookID := c.Param("id")
	limit := c.DefaultQuery("limit", "50")

	rows, err := database.DB.Query(`
		SELECT id, webhook_id, event_type, payload, response_status, response_body, 
		       error_message, attempt, duration_ms, created_at
		FROM webhook_logs
		WHERE webhook_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, webhookID, limit)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Loglarni olishda xatolik",
			Code:    500,
		})
		return
	}
	defer rows.Close()

	logs := []WebhookLog{}
	for rows.Next() {
		var log WebhookLog
		var payloadJSON []byte
		var status sql.NullInt32
		var respBody, errMsg sql.NullString
		var durationMs sql.NullInt32

		err := rows.Scan(
			&log.ID, &log.WebhookID, &log.EventType, &payloadJSON,
			&status, &respBody, &errMsg, &log.Attempt, &durationMs, &log.CreatedAt,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(payloadJSON, &log.Payload)
		if status.Valid {
			s := int(status.Int32)
			log.ResponseStatus = &s
		}
		if respBody.Valid {
			log.ResponseBody = &respBody.String
		}
		if errMsg.Valid {
			log.ErrorMessage = &errMsg.String
		}
		if durationMs.Valid {
			d := int(durationMs.Int32)
			log.DurationMs = &d
		}

		logs = append(logs, log)
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": len(logs),
	})
}

// DELETE /api/admin/webhooks/:id/logs - Webhook loglarini tozalash
func ClearWebhookLogs(c *gin.Context) {
	webhookID := c.Param("id")

	_, err := database.DB.Exec(`DELETE FROM webhook_logs WHERE webhook_id = $1`, webhookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{
			Error:   "database_error",
			Message: "Loglarni tozalashda xatolik",
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, models.APISuccess{
		Success: true,
		Message: "Loglar tozalandi",
	})
}

// GET /api/admin/webhooks/events - Mavjud eventlarni olish
func GetWebhookEvents(c *gin.Context) {
	events := []map[string]string{
		{"value": EventPortfolioCreated, "label": "Portfolio yaratildi"},
		{"value": EventPortfolioUpdated, "label": "Portfolio yangilandi"},
		{"value": EventPortfolioDeleted, "label": "Portfolio o'chirildi"},
		{"value": EventPortfolioApproved, "label": "Portfolio tasdiqlandi"},
		{"value": EventPortfolioRejected, "label": "Portfolio rad etildi"},
		{"value": EventUserCreated, "label": "Foydalanuvchi yaratildi"},
		{"value": EventUserUpdated, "label": "Foydalanuvchi yangilandi"},
		{"value": EventUserDeleted, "label": "Foydalanuvchi o'chirildi"},
		{"value": EventNotificationSent, "label": "Bildirishnoma yuborildi"},
		{"value": EventLoginSuccess, "label": "Tizimga kirish"},
		{"value": EventImportCompleted, "label": "Import tugadi"},
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// intPtr - int pointer yaratish
func intPtr(i int) *int {
	return &i
}
