// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package auth

import (
	"errors"
	"sync"
	"time"

	"kuafcv-backend/models"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID        string      `json:"user_id"`
	Email         string      `json:"email"`
	Role          models.Role `json:"role"`
	SecretVersion int         `json:"secret_version,omitempty"` // Track which secret signed this
	jwt.RegisteredClaims
}

var (
	jwtSecret       []byte
	secretVersion   int       = 1
	secretRotatedAt time.Time = time.Now()
	secretMutex     sync.RWMutex
	previousSecret  []byte // Keep old secret for grace period
	previousVersion int
)

func SetSecret(secret string) {
	secretMutex.Lock()
	defer secretMutex.Unlock()

	jwtSecret = []byte(secret)
	secretVersion = 1
	secretRotatedAt = time.Now()
}

// RotateSecret - Change JWT secret with grace period for existing tokens
func RotateSecret(newSecret string, gracePeriod time.Duration) {
	secretMutex.Lock()
	defer secretMutex.Unlock()

	// Save old secret for validation during grace period
	previousSecret = jwtSecret
	previousVersion = secretVersion

	// Set new secret
	jwtSecret = []byte(newSecret)
	secretVersion++
	secretRotatedAt = time.Now()

	// After grace period, clear old secret
	go func() {
		time.Sleep(gracePeriod)
		secretMutex.Lock()
		previousSecret = nil
		secretMutex.Unlock()
	}()
}

// GetSecretInfo - Return current secret metadata (not the secret itself)
func GetSecretInfo() map[string]interface{} {
	secretMutex.RLock()
	defer secretMutex.RUnlock()

	return map[string]interface{}{
		"version":      secretVersion,
		"rotated_at":   secretRotatedAt,
		"has_previous": previousSecret != nil,
	}
}

func GenerateToken(user *models.User) (string, error) {
	secretMutex.RLock()
	currentSecret := jwtSecret
	currentVersion := secretVersion
	secretMutex.RUnlock()

	claims := &Claims{
		UserID:        user.ID,
		Email:         user.Email,
		Role:          user.Role,
		SecretVersion: currentVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 kun
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(currentSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
	secretMutex.RLock()
	currentSecret := jwtSecret
	prevSecret := previousSecret
	currentVer := secretVersion
	prevVer := previousVersion
	secretMutex.RUnlock()

	// Try current secret first
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("noto'g'ri signing method")
		}

		// Check version in claims
		if claims, ok := token.Claims.(*Claims); ok {
			if claims.SecretVersion == currentVer {
				return currentSecret, nil
			} else if claims.SecretVersion == prevVer && prevSecret != nil {
				return prevSecret, nil
			}
		}

		// Default to current secret for backward compatibility
		return currentSecret, nil
	})

	if err != nil && prevSecret != nil {
		// Try previous secret during grace period
		token, err = jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("noto'g'ri signing method")
			}
			return prevSecret, nil
		})
	}

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token yaroqsiz")
}
