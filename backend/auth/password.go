// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package auth

import (
	"fmt"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// Password policy constants
const (
	MinPasswordLength = 8
	MaxPasswordLength = 128
)

// Common weak passwords blacklist (top 100 most common)
var weakPasswords = map[string]bool{
	"password": true, "12345678": true, "123456789": true, "1234567890": true,
	"password1": true, "qwerty": true, "abc123": true, "Password1": true,
	"12345": true, "1234567": true, "welcome": true, "admin": true,
	"letmein": true, "monkey": true, "dragon": true, "master": true,
	"sunshine": true, "princess": true, "football": true, "shadow": true,
}

// PasswordStrength represents password strength level
type PasswordStrength int

const (
	Weak PasswordStrength = iota
	Medium
	Strong
	VeryStrong
)

func (ps PasswordStrength) String() string {
	return [...]string{"Zaif", "O'rtacha", "Kuchli", "Juda kuchli"}[ps]
}

// PasswordValidationResult holds validation result and strength
type PasswordValidationResult struct {
	Valid    bool             `json:"valid"`
	Strength PasswordStrength `json:"strength"`
	Errors   []string         `json:"errors,omitempty"`
	Score    int              `json:"score"` // 0-100
}

// ValidatePassword - Comprehensive password validation with strength check
func ValidatePassword(password string) *PasswordValidationResult {
	result := &PasswordValidationResult{
		Valid:  true,
		Errors: []string{},
		Score:  0,
	}

	// Length check
	length := len(password)
	if length < MinPasswordLength {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Parol kamida %d belgidan iborat bo'lishi kerak", MinPasswordLength))
	}
	if length > MaxPasswordLength {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Parol %d belgidan oshmasligi kerak", MaxPasswordLength))
		return result
	}

	// Check against common weak passwords
	lowerPassword := strings.ToLower(password)
	if weakPasswords[lowerPassword] {
		result.Valid = false
		result.Errors = append(result.Errors, "Bu parol juda oddiy va keng tarqalgan")
		return result
	}

	// Character type requirements
	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	// Enforce minimum requirements
	if !hasUpper {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda kamida 1 ta katta harf bo'lishi kerak")
	}
	if !hasLower {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda kamida 1 ta kichik harf bo'lishi kerak")
	}
	if !hasNumber {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda kamida 1 ta raqam bo'lishi kerak")
	}
	if !hasSpecial {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda kamida 1 ta maxsus belgi bo'lishi kerak (!@#$%^&* va h.k.)")
	}

	// Check for sequential characters (123, abc, etc.)
	if hasSequentialChars(password) {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda ketma-ket belgilar bo'lmasligi kerak (123, abc)")
	}

	// Check for repeated characters (aaa, 111, etc.)
	if hasRepeatedChars(password, 3) {
		result.Valid = false
		result.Errors = append(result.Errors, "Parolda 3 ta bir xil belgi ketma-ket kelmasligi kerak")
	}

	// Calculate strength score (0-100)
	score := 0

	// Length bonus
	if length >= 8 {
		score += 10
	}
	if length >= 12 {
		score += 10
	}
	if length >= 16 {
		score += 10
	}

	// Character variety bonus
	if hasUpper {
		score += 15
	}
	if hasLower {
		score += 15
	}
	if hasNumber {
		score += 15
	}
	if hasSpecial {
		score += 20
	}

	// Mixed character types bonus
	charTypes := 0
	if hasUpper {
		charTypes++
	}
	if hasLower {
		charTypes++
	}
	if hasNumber {
		charTypes++
	}
	if hasSpecial {
		charTypes++
	}
	if charTypes >= 3 {
		score += 5
	}

	result.Score = score

	// Determine strength level
	switch {
	case score < 40:
		result.Strength = Weak
	case score < 60:
		result.Strength = Medium
	case score < 80:
		result.Strength = Strong
	default:
		result.Strength = VeryStrong
	}

	return result
}

// hasSequentialChars checks for sequential characters (abc, 123, xyz)
func hasSequentialChars(s string) bool {
	for i := 0; i < len(s)-2; i++ {
		if s[i+1] == s[i]+1 && s[i+2] == s[i]+2 {
			return true
		}
		if s[i+1] == s[i]-1 && s[i+2] == s[i]-2 {
			return true
		}
	}
	return false
}

// hasRepeatedChars checks for repeated characters
func hasRepeatedChars(s string, count int) bool {
	if len(s) < count {
		return false
	}

	for i := 0; i <= len(s)-count; i++ {
		allSame := true
		for j := 1; j < count; j++ {
			if s[i+j] != s[i] {
				allSame = false
				break
			}
		}
		if allSame {
			return true
		}
	}
	return false
}

// IsPasswordStrong - Quick check if password meets strong requirements
func IsPasswordStrong(password string) bool {
	result := ValidatePassword(password)
	return result.Valid && result.Strength >= Strong
}

// GeneratePasswordRequirements - Return password requirements for frontend
func GeneratePasswordRequirements() map[string]interface{} {
	return map[string]interface{}{
		"min_length":      MinPasswordLength,
		"max_length":      MaxPasswordLength,
		"require_upper":   true,
		"require_lower":   true,
		"require_number":  true,
		"require_special": true,
		"no_sequential":   true,
		"no_repeated":     true,
		"pattern":         "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
	}
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
