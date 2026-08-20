package httpapi

import (
	"encoding/json"
	"testing"
)

func TestValidateAuth(t *testing.T) {
	fields := validateAuth("K", "wrong", "short", true)
	for _, key := range []string{"name", "email", "password"} {
		if _, ok := fields[key]; !ok {
			t.Fatalf("missing validation error for %s", key)
		}
	}
	if fields := validateAuth("Komron", "komron@example.com", "strong-password", true); len(fields) != 0 {
		t.Fatalf("valid auth input rejected: %v", fields)
	}
}

func TestValidateWorkflowLimits(t *testing.T) {
	if fields := validateWorkflow("Process", json.RawMessage(`[]`), json.RawMessage(`[]`)); len(fields) != 0 {
		t.Fatalf("valid workflow rejected: %v", fields)
	}
	if fields := validateWorkflow("", json.RawMessage(`{}`), json.RawMessage(`null`)); len(fields) != 3 {
		t.Fatalf("expected three field errors, got %v", fields)
	}
}
