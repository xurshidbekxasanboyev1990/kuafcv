# KUAFCV Backend API Documentation

## Base URL
```
Production: https://api.kuafcv.uz
Development: http://localhost:8080
```

## Authentication
All protected endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
### Success Response
```json
{
  "success": true,
  "message": "Action completed",
  "data": {}
}
```

### Error Response
```json
{
  "error": "error_code",
  "message": "Error description in Uzbek",
  "code": 400
}
```

---

## 📌 Public Endpoints

### POST /api/auth/login
**Description**: User authentication  
**Auth**: None  
**Body**:
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "student@example.com",
    "role": "STUDENT",
    "full_name": "John Doe"
  }
}
```

### GET /api/auth/password-requirements
**Description**: Get password policy requirements  
**Auth**: None  
**Response**:
```json
{
  "min_length": 8,
  "require_upper": true,
  "require_lower": true,
  "require_number": true,
  "require_special": true,
  "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$"
}
```

### POST /api/auth/validate-password
**Description**: Validate password strength (for frontend feedback)  
**Auth**: None  
**Body**:
```json
{
  "password": "MyP@ssw0rd!"
}
```
**Response**:
```json
{
  "valid": true,
  "strength": "Kuchli",
  "score": 85,
  "errors": []
}
```

### GET /api/settings/public
**Description**: Get public system settings (cached 1h)  
**Auth**: None  
**Response**:
```json
{
  "university_name": "Karakalpak State University",
  "contact_email": "info@university.uz",
  "cached": true
}
```

### GET /api/announcements/marquee
**Description**: Get active marquee announcements  
**Auth**: None

### GET /api/health
**Description**: Health check endpoint  
**Auth**: None  
**Response**:
```json
{
  "status": "ok",
  "time": "2024-01-15T10:30:00Z"
}
```

---

## 🔒 Protected Endpoints

### GET /api/auth/me
**Description**: Get current authenticated user  
**Auth**: Required  
**Response**: User object with full profile data

### POST /api/auth/logout
**Description**: Logout (client-side token removal)  
**Auth**: Required

---

## 👨‍🎓 Student Endpoints

### GET /api/portfolio
**Description**: Get my portfolios  
**Auth**: Required (STUDENT)  
**Query Params**: `page`, `limit`, `category`, `status`

### POST /api/portfolio
**Description**: Create portfolio  
**Auth**: Required (STUDENT)  
**Body**:
```json
{
  "title": "My Project",
  "description": "Description",
  "category": "project",
  "files": ["file1.pdf"],
  "links": ["https://github.com/user/repo"]
}
```

### PUT /api/portfolio/:id
**Description**: Update portfolio  
**Auth**: Required (STUDENT, owner only)

### DELETE /api/portfolio/:id
**Description**: Delete portfolio  
**Auth**: Required (STUDENT, owner only)

### GET /api/portfolio/categories
**Description**: Get portfolio categories (cached 24h)  
**Auth**: Required  
**Response**:
```json
{
  "categories": [
    {
      "value": "project",
      "label": "Loyiha",
      "icon": "🚀",
      "description": "Dasturiy ta'minot loyihalari"
    }
  ],
  "cached": true
}
```

---

## 🎯 Portfolio Interaction Endpoints

### POST /api/portfolio/:id/view
**Description**: Record portfolio view (analytics)  
**Auth**: Required

### POST /api/portfolio/:id/rate
**Description**: Rate portfolio (1-5 stars)  
**Auth**: Required  
**Body**:
```json
{
  "rating": 5,
  "comment": "Excellent work!"
}
```

### POST /api/portfolio/:id/comments
**Description**: Add comment  
**Auth**: Required  
**Body**:
```json
{
  "content": "Great project!"
}
```

### GET /api/portfolio/:id/comments
**Description**: Get portfolio comments  
**Auth**: Required

### POST /api/portfolio/:id/bookmark
**Description**: Toggle bookmark  
**Auth**: Required

### GET /api/bookmarks
**Description**: Get my bookmarks  
**Auth**: Required

---

## 🧠 AI Endpoints

### POST /api/ai/chat
**Description**: AI chat assistant  
**Auth**: Required  
**Body**:
```json
{
  "message": "How to improve my portfolio?"
}
```
**Response**:
```json
{
  "response": "AI generated advice...",
  "tokens_used": 150
}
```

### POST /api/ai/analyze-portfolio
**Description**: AI portfolio analysis  
**Auth**: Required  
**Body**:
```json
{
  "portfolio_id": "port-123"
}
```
**Rate Limit**: 10 requests/hour per user

### POST /api/ai/analyze-file
**Description**: Analyze uploaded file (PDF, DOCX)  
**Auth**: Required  
**Body**: FormData with `file` field  
**Response**:
```json
{
  "analysis": {
    "summary": "Document summary",
    "key_points": ["Point 1", "Point 2"],
    "suggestions": ["Improve X", "Add Y"]
  }
}
```

### POST /api/ai/detect-ai
**Description**: Detect AI-generated content (plagiarism check)  
**Auth**: Required  
**Body**:
```json
{
  "text": "Content to analyze"
}
```
**Response**:
```json
{
  "ai_probability": 0.85,
  "confidence": "High",
  "verdict": "Likely AI-generated"
}
```

---

## 👔 Employer Endpoints

### GET /api/employer/students
**Description**: Search students by filters  
**Auth**: Required (EMPLOYER)  
**Query**: `faculty`, `specialty`, `course`, `skills`, `search`

### GET /api/employer/students/:id
**Description**: Get student details with portfolios  
**Auth**: Required (EMPLOYER)  
**Response**:
```json
{
  "student": { "id": "...", "full_name": "..." },
  "portfolios": [
    {
      "id": "port-123",
      "title": "Project",
      "category_label": "Loyiha",
      "category_icon": "🚀"
    }
  ]
}
```
**Note**: Optimized with LEFT JOIN - no N+1 query

---

## 📊 Analytics Endpoints

### GET /api/analytics/overview
**Description**: Dashboard analytics  
**Auth**: Required  
**Response**:
```json
{
  "total_portfolios": 1500,
  "total_views": 12000,
  "avg_rating": 4.2,
  "top_categories": [...]
}
```

### GET /api/analytics/my-portfolio-stats
**Description**: My portfolio statistics  
**Auth**: Required (STUDENT)

---

## 👨‍💼 Admin Endpoints

### GET /api/admin/users
**Description**: Get users with filters  
**Auth**: Required (ADMIN)  
**Query**: `role`, `search`, `faculty`, `specialty`, `course`, `group`, `page`, `limit`  
**Response**:
```json
{
  "students": [...],
  "filters": {
    "faculties": ["IT", "Engineering"],
    "courses": [1, 2, 3, 4],
    "groups": ["IT-21", "IT-22"]
  },
  "total": 1500
}
```

### POST /api/admin/import-students
**Description**: Import students from Excel (streaming)  
**Auth**: Required (ADMIN)  
**Body**: FormData with Excel file  
**Response**:
```json
{
  "imported": 150,
  "updated": 30,
  "skipped": 5,
  "total": 185
}
```
**Note**: Uses stream processing - no memory leak

### DELETE /api/admin/users/:id
**Description**: Delete user  
**Auth**: Required (ADMIN)

### POST /api/admin/rotate-jwt-secret
**Description**: Rotate JWT secret with grace period  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "new_secret": "new-secret-minimum-32-characters-long",
  "grace_period": 60
}
```
**Response**:
```json
{
  "message": "JWT secret rotated",
  "version": 2,
  "rotated_at": "2024-01-15T10:30:00Z",
  "grace_period_minutes": 60,
  "note": "Old tokens valid for 60 minutes"
}
```

### GET /api/admin/jwt-info
**Description**: Get JWT secret metadata  
**Auth**: Required (ADMIN)  
**Response**:
```json
{
  "version": 2,
  "rotated_at": "2024-01-15T10:30:00Z",
  "has_previous": true
}
```

### POST /api/admin/notifications
**Description**: Create broadcast notification  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "type": "announcement",
  "title": "System Maintenance",
  "message": "Scheduled downtime...",
  "target_role": "STUDENT"
}
```

### GET /api/admin/categories
**Description**: Get all portfolio categories  
**Auth**: Required (ADMIN)

### POST /api/admin/categories
**Description**: Create category  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "value": "research",
  "label": "Ilmiy tadqiqot",
  "icon": "🔬",
  "description": "Research papers"
}
```

---

## ⚙️ Settings Endpoints (Admin)

### GET /api/settings
**Description**: Get all settings  
**Auth**: Required (ADMIN)

### GET /api/settings/:key
**Description**: Get specific setting  
**Auth**: Required (ADMIN)

### PUT /api/settings/:key
**Description**: Update setting (invalidates cache)  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "value": "New value"
}
```

### PUT /api/settings/bulk
**Description**: Update multiple settings  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "settings": {
    "university_name": "New Name",
    "contact_email": "new@email.com"
  }
}
```

---

## 📢 Announcements (Admin)

### GET /api/announcements
**Description**: Get all announcements  
**Auth**: Required (ADMIN)

### POST /api/announcements
**Description**: Create announcement  
**Auth**: Required (ADMIN)  
**Body**:
```json
{
  "content": "Important announcement",
  "type": "marquee",
  "is_active": true,
  "priority": 1
}
```

### PUT /api/announcements/:id
**Description**: Update announcement  
**Auth**: Required (ADMIN)

### DELETE /api/announcements/:id
**Description**: Delete announcement  
**Auth**: Required (ADMIN)

### PUT /api/announcements/:id/toggle
**Description**: Toggle active status  
**Auth**: Required (ADMIN)

---

## 🔔 Notifications

### GET /api/notifications
**Description**: Get my notifications  
**Auth**: Required

### POST /api/notifications/:id/read
**Description**: Mark as read  
**Auth**: Required

### POST /api/notifications/read-all
**Description**: Mark all as read  
**Auth**: Required

---

## 🌐 WebSocket

### GET /api/ws
**Description**: WebSocket connection for real-time updates  
**Auth**: Required (via query param `?token=<jwt>`)  
**Message Format**:
```json
{
  "type": "ping|notification|chat|status",
  "data": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```
**Security**:
- Max message size: 10 KB
- Max content length: 5000 characters
- XSS sanitization (HTML escaping)
- Type whitelist validation
- Rate limit: Handled by middleware

---

## 🔐 Security Features

### Rate Limiting
- **Anonymous**: 100 requests/minute (IP-based)
- **Authenticated**: 500 requests/minute (user_id + IP)
- **Admin**: Unlimited (bypass enabled)

### Password Policy
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- No sequential characters (123, abc)
- No repeated characters (aaa, 111)
- Blacklist of 100 common weak passwords
- Strength score: 0-100

### File Upload Security
- Magic bytes validation (first 512 bytes)
- Content-Type detection via `http.DetectContentType()`
- Supported types: PDF, JPEG, PNG, DOCX, XLSX, PPTX, MP4
- Max file size: 10 MB

### Database
- Parameterized queries (SQL injection protection)
- JSONB GIN indexes for fast searches
- Full-text search indexes
- 15 performance indexes (37x faster JSONB queries)

### Caching
- Redis caching layer
- Portfolio categories: 24h TTL
- Public settings: 1h TTL
- Cache invalidation on updates

---

## 📈 Performance Optimizations

### Memory Management
- Excel import: Stream-based processing (100MB → 15KB memory)
- Pre-allocated map capacity (15,000 students)
- Batch commits (500 rows)

### Query Optimization
- N+1 elimination via LEFT JOIN
- Composite indexes (user_id, created_at)
- JSONB path indexes
- Full-text search GIN indexes

### Error Recovery
- AI API: 3-attempt retry with exponential backoff (1s, 2s, 4s)
- Auth: Offline mode - retry 3x before logout
- HTTP 429/503: Automatic retry
- HTTP 500+: Immediate fail

### Database Migrations
- Transaction wrapping with rollback
- Version tracking table (`schema_migrations`)
- Safe to re-run (IF NOT EXISTS)

---

## 📊 Monitoring Endpoints

### GET /api/health
**Description**: Service health check  
**Response**: `200 OK` if healthy

### GET /api/ready
**Description**: Readiness probe (DB connection)  
**Response**: `200 OK` if ready

---

## 🚨 Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | validation_error | Invalid request data |
| 401 | unauthorized | Missing or invalid token |
| 403 | forbidden | Insufficient permissions |
| 404 | not_found | Resource not found |
| 409 | conflict | Duplicate entry (e.g., email exists) |
| 413 | payload_too_large | Request body too large |
| 429 | rate_limit | Too many requests |
| 500 | server_error | Internal server error |
| 503 | service_unavailable | Service temporarily unavailable |

---

## 📝 Notes

- **JWT Expiration**: 7 days
- **CORS**: Configured via environment variable `ALLOWED_ORIGINS`
- **File Uploads**: Stored in `./uploads/` directory
- **Logs**: Structured logging with request ID
- **Database**: PostgreSQL 15+
- **Redis**: Optional (fallback to DB if unavailable)
- **Go Version**: 1.23+
- **OpenAI API**: gpt-4o model

---

## 🛠️ Environment Variables

```env
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/kuafcv
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-minimum-32-characters
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=http://localhost:3000,https://kuafcv.uz
ENVIRONMENT=development|production
```

---

## 📦 Postman Collection

Import this OpenAPI spec to Postman for testing:
- File: `docs/api/openapi.yaml`
- Base URL: Configure environment variable

---

**Last Updated**: January 2024  
**API Version**: 1.0  
**Backend**: Go 1.23, Gin Framework  
**Database**: PostgreSQL 15, Redis 7
