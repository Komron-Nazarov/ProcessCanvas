package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Environment string
	HTTPPort    string
	DatabaseURL string
	FrontendURL string
	CookieName  string
	SessionTTL  time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		Environment: value("APP_ENV", "development"),
		HTTPPort:    value("HTTP_PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		FrontendURL: value("FRONTEND_URL", "http://localhost:3000"),
		CookieName:  value("SESSION_COOKIE_NAME", "processcanvas_session"),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	hours, err := strconv.Atoi(value("SESSION_TTL_HOURS", "336"))
	if err != nil || hours < 1 || hours > 8760 {
		return Config{}, fmt.Errorf("SESSION_TTL_HOURS must be between 1 and 8760")
	}
	cfg.SessionTTL = time.Duration(hours) * time.Hour
	return cfg, nil
}

func value(key, fallback string) string {
	if result := os.Getenv(key); result != "" {
		return result
	}
	return fallback
}

func (c Config) SecureCookie() bool { return c.Environment == "production" }
