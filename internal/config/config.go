package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	ServerAddr  string
	SessionKey  string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:dev@localhost:5432/codecensus?sslmode=disable"),
		ServerAddr:  getEnv("SERVER_ADDR", ":8080"),
		SessionKey:  getEnv("SESSION_KEY", "super-secret-session-key-change-in-production"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}