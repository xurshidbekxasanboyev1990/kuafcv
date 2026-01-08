// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package auth

import (
	"testing"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name         string
		password     string
		wantValid    bool
		wantStrength PasswordStrength
	}{
		{
			name:         "Strong password",
			password:     "MyP@ssw0rd!",
			wantValid:    true,
			wantStrength: Strong,
		},
		{
			name:         "Very strong password",
			password:     "C0mpl3x!P@ssW0rd#2024",
			wantValid:    true,
			wantStrength: VeryStrong,
		},
		{
			name:         "Too short",
			password:     "Sh0rt!",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "No uppercase",
			password:     "myp@ssw0rd!",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "No lowercase",
			password:     "MYP@SSW0RD!",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "No number",
			password:     "MyPassword!",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "No special char",
			password:     "MyPassword0",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "Common weak password",
			password:     "Password1",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "Sequential characters",
			password:     "MyP@ssw0rd123",
			wantValid:    false,
			wantStrength: Weak,
		},
		{
			name:         "Repeated characters",
			password:     "MyP@sssw0rd!",
			wantValid:    false,
			wantStrength: Weak,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidatePassword(tt.password)

			if result.Valid != tt.wantValid {
				t.Errorf("ValidatePassword(%q).Valid = %v, want %v", tt.password, result.Valid, tt.wantValid)
			}

			// Only check strength for valid passwords
			if result.Valid && result.Strength != tt.wantStrength {
				t.Errorf("ValidatePassword(%q).Strength = %v, want %v", tt.password, result.Strength, tt.wantStrength)
			}

			// Verify errors are present for invalid passwords
			if !result.Valid && len(result.Errors) == 0 {
				t.Errorf("ValidatePassword(%q) invalid but no errors returned", tt.password)
			}
		})
	}
}

func TestHashAndCheckPassword(t *testing.T) {
	password := "TestP@ssw0rd123"

	// Hash password
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	if hash == "" {
		t.Fatal("HashPassword() returned empty hash")
	}

	// Check correct password
	if !CheckPassword(password, hash) {
		t.Error("CheckPassword() failed for correct password")
	}

	// Check incorrect password
	if CheckPassword("WrongP@ssw0rd!", hash) {
		t.Error("CheckPassword() succeeded for incorrect password")
	}
}

func TestHasSequentialChars(t *testing.T) {
	tests := []struct {
		input string
		want  bool
	}{
		{"abc123", true},
		{"password123", true},
		{"xyz", true},
		{"321cba", true},
		{"p@ssw0rd", false},
		{"random", false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := hasSequentialChars(tt.input); got != tt.want {
				t.Errorf("hasSequentialChars(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestHasRepeatedChars(t *testing.T) {
	tests := []struct {
		input string
		count int
		want  bool
	}{
		{"aaa", 3, true},
		{"111", 3, true},
		{"password", 3, false},
		{"paaassword", 3, true},
		{"ab", 3, false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := hasRepeatedChars(tt.input, tt.count); got != tt.want {
				t.Errorf("hasRepeatedChars(%q, %d) = %v, want %v", tt.input, tt.count, got, tt.want)
			}
		})
	}
}

func TestIsPasswordStrong(t *testing.T) {
	strongPassword := "MyP@ssw0rd2024!"
	weakPassword := "weak"

	if !IsPasswordStrong(strongPassword) {
		t.Errorf("IsPasswordStrong(%q) = false, want true", strongPassword)
	}

	if IsPasswordStrong(weakPassword) {
		t.Errorf("IsPasswordStrong(%q) = true, want false", weakPassword)
	}
}

func BenchmarkValidatePassword(b *testing.B) {
	password := "MyP@ssw0rd2024!"

	for i := 0; i < b.N; i++ {
		ValidatePassword(password)
	}
}

func BenchmarkHashPassword(b *testing.B) {
	password := "MyP@ssw0rd2024!"

	for i := 0; i < b.N; i++ {
		HashPassword(password)
	}
}
