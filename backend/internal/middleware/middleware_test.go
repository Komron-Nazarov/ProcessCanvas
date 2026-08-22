package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRequestID(t *testing.T) {
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Context().Value(RequestIDKey) == nil {
			t.Error("request id missing from context")
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/health", nil))
	if recorder.Header().Get("X-Request-ID") == "" {
		t.Fatal("request id header missing")
	}
}

func TestRateLimiterRejectsRequestsOverLimit(t *testing.T) {
	handler := NewRateLimiter(2, time.Minute).Wrap(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	for attempt := 1; attempt <= 3; attempt++ {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		request.RemoteAddr = "192.0.2.10:1234"
		handler.ServeHTTP(recorder, request)
		if attempt < 3 && recorder.Code != http.StatusNoContent {
			t.Fatalf("attempt %d unexpectedly blocked", attempt)
		}
		if attempt == 3 && recorder.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429, got %d", recorder.Code)
		}
	}
}

func TestSecurityHeaders(t *testing.T) {
	recorder := httptest.NewRecorder()
	SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })).ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/health", nil))
	if recorder.Header().Get("X-Content-Type-Options") != "nosniff" || recorder.Header().Get("X-Frame-Options") != "DENY" {
		t.Fatal("security headers missing")
	}
}

func TestCORSOnlyAllowsConfiguredFrontend(t *testing.T) {
	handler := CORS("http://localhost:3000", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) }))
	request := httptest.NewRequest(http.MethodOptions, "/api", nil)
	request.Header.Set("Origin", "http://localhost:3000")
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNoContent || recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Fatalf("unexpected CORS response: %d %v", recorder.Code, recorder.Header())
	}
}
