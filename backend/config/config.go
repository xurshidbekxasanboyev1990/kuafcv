package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	RedisURL        string
	RedisPassword   string
	JWTSecret       string
	Environment     string
	OpenAIAPIKey    string
	AllowedOrigins  string
	MaxFileSize     int64
	RateLimitReqs   int
	RateLimitWindow int
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "4000"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5433/kuafcv?sslmode=disable"),
		RedisURL:        getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword:   getEnv("REDIS_PASSWORD", ""),
		JWTSecret:       getEnvRequired("JWT_SECRET"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		OpenAIAPIKey:    getEnvRequired("OPENAI_API_KEY"),
		AllowedOrigins:  getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
		MaxFileSize:     getEnvInt64("MAX_FILE_SIZE", 10485760), // 10MB
		RateLimitReqs:   getEnvInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow: getEnvInt("RATE_LIMIT_WINDOW", 60),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvRequired(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Printf("⚠️  WARNING: Required environment variable %s is not set", key)
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intVal
		}
	}
	return defaultValue
}
