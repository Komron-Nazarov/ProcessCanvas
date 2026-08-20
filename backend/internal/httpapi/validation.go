package httpapi

import (
	"encoding/json"
	"net/mail"
	"strings"
)

func validateAuth(name, email, password string, registration bool) map[string]string {
	fields := map[string]string{}
	if registration && (len([]rune(strings.TrimSpace(name))) < 2 || len([]rune(name)) > 80) {
		fields["name"] = "invalid_name"
	}
	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email || len(email) > 254 {
		fields["email"] = "invalid_email"
	}
	if len(password) < 8 || len(password) > 128 {
		fields["password"] = "invalid_password"
	}
	return fields
}
func validateWorkflow(name string, nodes, edges json.RawMessage) map[string]string {
	fields := map[string]string{}
	if strings.TrimSpace(name) == "" || len([]rune(name)) > 160 {
		fields["name"] = "invalid_name"
	}
	if !validArray(nodes, 500) {
		fields["nodes"] = "invalid_nodes"
	}
	if !validArray(edges, 1000) {
		fields["edges"] = "invalid_edges"
	}
	return fields
}
func validArray(value json.RawMessage, limit int) bool {
	if len(value) == 0 || value[0] != '[' {
		return false
	}
	var items []json.RawMessage
	if json.Unmarshal(value, &items) != nil {
		return false
	}
	return len(items) <= limit
}
