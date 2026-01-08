// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package auth

import (
	"testing"
	"time"

	"kuafcv-backend/models"
)

func TestJWTSecretRotation(t *testing.T) {
	// Initialize with original secret
	originalSecret := "original-test-secret-minimum-32-characters-long"
	SetSecret(originalSecret)

	// Create test user
	testUser := &models.User{
		ID:    "test-user-123",
		Email: "test@example.com",
		Role:  models.RoleStudent,
	}

	// Generate token with original secret
	token1, err := GenerateToken(testUser)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	// Validate token with original secret
	claims1, err := ValidateToken(token1)
	if err != nil {
		t.Fatalf("ValidateToken() error = %v", err)
	}

	if claims1.UserID != testUser.ID {
		t.Errorf("ValidateToken() UserID = %v, want %v", claims1.UserID, testUser.ID)
	}

	// Rotate secret with 5 second grace period
	newSecret := "new-rotated-secret-minimum-32-characters-long"
	RotateSecret(newSecret, 5*time.Second)

	// Verify secret info
	info := GetSecretInfo()
	if info["version"].(int) != 2 {
		t.Errorf("GetSecretInfo() version = %v, want 2", info["version"])
	}

	if !info["has_previous"].(bool) {
		t.Error("GetSecretInfo() has_previous = false, want true (during grace period)")
	}

	// Old token should still be valid during grace period
	claims2, err := ValidateToken(token1)
	if err != nil {
		t.Errorf("ValidateToken() with old token during grace period failed: %v", err)
	}

	if claims2.UserID != testUser.ID {
		t.Errorf("ValidateToken() old token UserID = %v, want %v", claims2.UserID, testUser.ID)
	}

	// New token should be generated with new secret
	token2, err := GenerateToken(testUser)
	if err != nil {
		t.Fatalf("GenerateToken() after rotation error = %v", err)
	}

	// New token should validate
	claims3, err := ValidateToken(token2)
	if err != nil {
		t.Fatalf("ValidateToken() new token error = %v", err)
	}

	if claims3.SecretVersion != 2 {
		t.Errorf("New token SecretVersion = %v, want 2", claims3.SecretVersion)
	}

	// Wait for grace period to expire
	time.Sleep(6 * time.Second)

	// After grace period, old token should fail
	_, err = ValidateToken(token1)
	if err == nil {
		t.Error("ValidateToken() old token after grace period should fail, but succeeded")
	}

	// New token should still work
	claims4, err := ValidateToken(token2)
	if err != nil {
		t.Errorf("ValidateToken() new token after grace period error = %v", err)
	}

	if claims4.UserID != testUser.ID {
		t.Errorf("ValidateToken() new token UserID = %v, want %v", claims4.UserID, testUser.ID)
	}
}

func TestJWTTokenExpiration(t *testing.T) {
	SetSecret("test-secret-minimum-32-characters-long")

	testUser := &models.User{
		ID:    "test-user-456",
		Email: "expire@example.com",
		Role:  models.RoleStudent,
	}

	token, err := GenerateToken(testUser)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken() error = %v", err)
	}

	// Check token has 7 day expiration
	expectedExpiration := time.Now().Add(7 * 24 * time.Hour)
	actualExpiration := claims.ExpiresAt.Time

	// Allow 10 second difference for test execution time
	diff := actualExpiration.Sub(expectedExpiration)
	if diff > 10*time.Second || diff < -10*time.Second {
		t.Errorf("Token expiration = %v, want ~%v (diff: %v)", actualExpiration, expectedExpiration, diff)
	}
}

func TestJWTInvalidToken(t *testing.T) {
	SetSecret("test-secret-minimum-32-characters-long")

	tests := []struct {
		name  string
		token string
	}{
		{"Empty token", ""},
		{"Invalid format", "invalid.token.format"},
		{"Malformed JWT", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid"},
		{"Wrong signature", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ValidateToken(tt.token)
			if err == nil {
				t.Errorf("ValidateToken(%q) should fail, but succeeded", tt.token)
			}
		})
	}
}

func BenchmarkGenerateToken(b *testing.B) {
	SetSecret("benchmark-secret-minimum-32-characters-long")

	testUser := &models.User{
		ID:    "bench-user",
		Email: "bench@example.com",
		Role:  models.RoleStudent,
	}

	for i := 0; i < b.N; i++ {
		GenerateToken(testUser)
	}
}

func BenchmarkValidateToken(b *testing.B) {
	SetSecret("benchmark-secret-minimum-32-characters-long")

	testUser := &models.User{
		ID:    "bench-user",
		Email: "bench@example.com",
		Role:  models.RoleStudent,
	}

	token, _ := GenerateToken(testUser)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ValidateToken(token)
	}
}
