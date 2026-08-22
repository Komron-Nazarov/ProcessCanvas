package config

import "testing"

func TestLoadRequiresDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	if _, err := Load(); err == nil {
		t.Fatal("expected DATABASE_URL error")
	}
}

func TestLoadDefaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://example")
	t.Setenv("HTTP_PORT", "")
	t.Setenv("PORT", "")
	t.Setenv("SESSION_TTL_HOURS", "")
	t.Setenv("AUTH_RATE_LIMIT_PER_MINUTE", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.HTTPPort != "8080" || cfg.SessionTTL.Hours() != 336 || cfg.AuthRateLimit != 10 {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadUsesPlatformPort(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://example")
	t.Setenv("HTTP_PORT", "")
	t.Setenv("PORT", "10000")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.HTTPPort != "10000" {
		t.Fatalf("expected platform port, got %q", cfg.HTTPPort)
	}
}
