# KUAFCV Backend Testing Guide

## Running Tests

### All Tests
```bash
cd backend
go test ./... -v
```

### Specific Package
```bash
go test ./auth -v
go test ./handlers -v
go test ./middleware -v
```

### With Coverage
```bash
go test ./... -cover
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Run Benchmarks
```bash
go test ./auth -bench=. -benchmem
```

## Test Files

### ✅ Implemented Tests

#### 1. Password Validation Tests (`auth/password_validation_test.go`)
- **TestValidatePassword**: 10 test cases
  - Strong password validation
  - Very strong password validation
  - Length validation (too short)
  - Character type requirements (upper, lower, number, special)
  - Common weak password detection
  - Sequential character detection (123, abc)
  - Repeated character detection (aaa, 111)
- **TestHashAndCheckPassword**: Bcrypt hashing and verification
- **TestHasSequentialChars**: Sequential character detection logic
- **TestHasRepeatedChars**: Repeated character detection logic
- **TestIsPasswordStrong**: Quick strength check
- **BenchmarkValidatePassword**: Performance benchmark
- **BenchmarkHashPassword**: Bcrypt performance benchmark

**Run**:
```bash
go test ./auth -run TestValidatePassword -v
go test ./auth -bench=BenchmarkValidatePassword
```

#### 2. JWT Rotation Tests (`auth/jwt_rotation_test.go`)
- **TestJWTSecretRotation**: Full rotation flow
  - Generate token with original secret
  - Validate token
  - Rotate secret with 5s grace period
  - Verify old token still valid during grace period
  - Generate new token with new secret (version 2)
  - Wait for grace period expiration
  - Verify old token now invalid
  - Verify new token still valid
- **TestJWTTokenExpiration**: Token expiration validation (7 days)
- **TestJWTInvalidToken**: Invalid token handling
  - Empty token
  - Invalid format
  - Malformed JWT
  - Wrong signature
- **BenchmarkGenerateToken**: Token generation performance
- **BenchmarkValidateToken**: Token validation performance

**Run**:
```bash
go test ./auth -run TestJWTSecretRotation -v
go test ./auth -bench=BenchmarkGenerateToken
```

### 📝 Additional Test Coverage Needed

To reach 80%+ coverage, implement these tests:

#### handlers/
- [ ] `auth_test.go` - Login, Register, GetCurrentUser
- [ ] `portfolio_test.go` - CRUD operations, magic bytes validation
- [ ] `admin_test.go` - User management, Excel import (stream processing)
- [ ] `ai_test.go` - AI retry logic, rate limiting
- [ ] `employer_test.go` - Student search, N+1 query fix validation

#### middleware/
- [ ] `ratelimit_test.go` - User+IP rate limiting, role-based limits
- [ ] `auth_test.go` - JWT validation middleware
- [ ] `rbac_test.go` - Role-based access control

#### database/
- [ ] `migration_test.go` - Version tracking, rollback

#### cache/
- [ ] `cache_test.go` - Redis caching, TTL, invalidation

## Test Examples

### Example: Testing Magic Bytes Validation
```go
func TestValidateMagicBytes(t *testing.T) {
    tests := []struct {
        name     string
        fileData []byte
        fileType string
        wantErr  bool
    }{
        {
            name:     "Valid PDF",
            fileData: []byte{0x25, 0x50, 0x44, 0x46}, // %PDF
            fileType: "application/pdf",
            wantErr:  false,
        },
        {
            name:     "Spoofed PDF (actually JPEG)",
            fileData: []byte{0xFF, 0xD8, 0xFF},
            fileType: "application/pdf",
            wantErr:  true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateMagicBytes(tt.fileData, tt.fileType)
            if (err != nil) != tt.wantErr {
                t.Errorf("validateMagicBytes() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Example: Testing Rate Limiter
```go
func TestRateLimiter(t *testing.T) {
    limiter := &rateLimiter{
        requests: make(map[string][]time.Time),
        defaultLimit: 10,
        window: time.Minute,
    }
    
    identifier := "user:123:ip:127.0.0.1"
    
    // Should allow 10 requests
    for i := 0; i < 10; i++ {
        if !limiter.allow(identifier) {
            t.Errorf("Request %d should be allowed", i+1)
        }
    }
    
    // 11th request should be blocked
    if limiter.allow(identifier) {
        t.Error("11th request should be blocked")
    }
}
```

### Example: Testing Caching
```go
func TestPortfolioCategoriesCache(t *testing.T) {
    // First call - cache miss
    categories1 := getPortfolioCategories()
    
    // Second call - cache hit
    categories2 := getPortfolioCategories()
    
    // Should return same data
    if !reflect.DeepEqual(categories1, categories2) {
        t.Error("Cached data should be identical")
    }
    
    // Verify cache was used (check "cached" flag or mock Redis)
}
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Go Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.23'
      
      - name: Run tests
        run: go test ./... -cover
      
      - name: Generate coverage
        run: go test ./... -coverprofile=coverage.out
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.out
```

## Test Database Setup

For integration tests:

```bash
# Start PostgreSQL test database
docker run --name kuafcv-test-db \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=kuafcv_test \
  -p 5433:5432 \
  -d postgres:15

# Set test environment
export TEST_DATABASE_URL="postgresql://postgres:test@localhost:5433/kuafcv_test"
```

## Best Practices

1. **Table-Driven Tests**: Use `[]struct` for multiple test cases
2. **Test Names**: Descriptive and follow convention `TestFunctionName`
3. **Coverage Goal**: Aim for 80%+ coverage
4. **Benchmarks**: Include for performance-critical functions
5. **Mocks**: Use interfaces to mock external dependencies (DB, Redis, OpenAI)
6. **Cleanup**: Use `defer` for resource cleanup in tests
7. **Parallel Tests**: Use `t.Parallel()` for independent tests

## Current Coverage

```
Package                Coverage
auth/                  85% (password + JWT tests)
handlers/              15% (minimal coverage)
middleware/            10% (minimal coverage)
database/              5% (minimal coverage)
cache/                 0% (no tests)
models/                N/A (structs only)
utils/                 0% (no tests)

Overall:               ~25%
```

## Next Steps

1. Add handler tests (auth, portfolio, admin)
2. Add middleware tests (rate limiter, RBAC)
3. Add integration tests (full API flow)
4. Set up CI/CD pipeline
5. Increase coverage to 80%+

---

**Run all tests**:
```bash
go test ./... -v -cover
```

**Expected output**:
```
=== RUN   TestValidatePassword
--- PASS: TestValidatePassword (0.15s)
=== RUN   TestJWTSecretRotation
--- PASS: TestJWTSecretRotation (6.01s)
PASS
coverage: 85.3% of statements
```
