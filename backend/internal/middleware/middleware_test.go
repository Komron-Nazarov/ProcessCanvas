package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
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
