package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"processcanvas/backend/internal/config"
	"processcanvas/backend/internal/database"
	"processcanvas/backend/internal/domain"
)

type processEnvelope struct {
	Process domain.Process `json:"process"`
}

func TestProcessAPIIntegration(t *testing.T) {
	baseURL := os.Getenv("TEST_DATABASE_URL")
	if baseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, baseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	schema := fmt.Sprintf("pc_test_%d", time.Now().UnixNano())
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	defer func() { _, _ = admin.Exec(ctx, "DROP SCHEMA "+identifier+" CASCADE") }()

	poolConfig, err := pgxpool.ParseConfig(baseURL)
	if err != nil {
		t.Fatal(err)
	}
	poolConfig.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err = database.Migrate(ctx, pool); err != nil {
		t.Fatal(err)
	}

	cfg := config.Config{Environment: "test", FrontendURL: "http://localhost:3000", CookieName: "pc_test_session", SessionTTL: time.Hour, AuthRateLimit: 1000}
	server := httptest.NewServer(New(cfg, pool, slog.New(slog.NewTextHandler(io.Discard, nil))))
	defer server.Close()

	owner := newTestClient(t)
	viewer := newTestClient(t)
	if status := requestJSON(t, owner, http.MethodGet, server.URL+"/health", nil, nil); status != http.StatusOK {
		t.Fatalf("health: %d", status)
	}
	if status := requestJSON(t, owner, http.MethodGet, server.URL+"/ready", nil, nil); status != http.StatusOK {
		t.Fatalf("ready: %d", status)
	}
	if status := requestJSON(t, owner, http.MethodGet, server.URL+"/api/auth/session", nil, nil); status != http.StatusUnauthorized {
		t.Fatalf("anonymous session: %d", status)
	}

	var ownerSession domain.Session
	status := requestJSON(t, owner, http.MethodPost, server.URL+"/api/auth/register", map[string]string{"name": "Owner", "email": "owner@example.test", "password": "password-123"}, &ownerSession)
	if status != http.StatusCreated {
		t.Fatalf("register owner: %d", status)
	}
	duplicate := newTestClient(t)
	if status = requestJSON(t, duplicate, http.MethodPost, server.URL+"/api/auth/register", map[string]string{"name": "Duplicate", "email": "owner@example.test", "password": "password-123"}, nil); status != http.StatusConflict {
		t.Fatalf("duplicate email: %d", status)
	}
	loginClient := newTestClient(t)
	if status = requestJSON(t, loginClient, http.MethodPost, server.URL+"/api/auth/login", map[string]string{"email": "owner@example.test", "password": "wrong-password"}, nil); status != http.StatusUnauthorized {
		t.Fatalf("wrong password: %d", status)
	}
	var loginSession domain.Session
	if status = requestJSON(t, loginClient, http.MethodPost, server.URL+"/api/auth/login", map[string]string{"email": "owner@example.test", "password": "password-123"}, &loginSession); status != http.StatusOK {
		t.Fatalf("valid login: %d", status)
	}
	if loginSession.Workspace.ID == "" || loginSession.Workspace.Role != "owner" {
		t.Fatalf("personal workspace missing: %+v", loginSession.Workspace)
	}
	if _, err = pool.Exec(ctx, `UPDATE sessions SET expires_at=now()-interval '1 minute' WHERE token_hash=(SELECT token_hash FROM sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1)`, loginSession.User.ID); err != nil {
		t.Fatal(err)
	}
	if status = requestJSON(t, loginClient, http.MethodGet, server.URL+"/api/auth/session", nil, nil); status != http.StatusUnauthorized {
		t.Fatalf("expired session: %d", status)
	}
	var viewerSession domain.Session
	status = requestJSON(t, viewer, http.MethodPost, server.URL+"/api/auth/register", map[string]string{"name": "Viewer", "email": "viewer@example.test", "password": "password-123"}, &viewerSession)
	if status != http.StatusCreated {
		t.Fatalf("register viewer: %d", status)
	}

	workflow := map[string]any{"workspaceId": ownerSession.Workspace.ID, "name": "Approval", "nodes": []any{map[string]any{"id": "start"}}, "edges": []any{}}
	var created processEnvelope
	status = requestJSON(t, owner, http.MethodPost, server.URL+"/api/processes", workflow, &created)
	if status != http.StatusCreated || created.Process.CurrentVersion != 1 {
		t.Fatalf("create: %d %+v", status, created.Process)
	}
	if status = requestJSON(t, owner, http.MethodPost, server.URL+"/api/processes", map[string]any{"workspaceId": ownerSession.Workspace.ID, "name": "Invalid", "nodes": map[string]any{}, "edges": []any{}}, nil); status != http.StatusBadRequest {
		t.Fatalf("invalid nodes: %d", status)
	}
	oversizedRequest, err := http.NewRequest(http.MethodPost, server.URL+"/api/processes", bytes.NewReader(bytes.Repeat([]byte("x"), (2<<20)+1)))
	if err != nil {
		t.Fatal(err)
	}
	oversizedRequest.Header.Set("Content-Type", "application/json")
	oversizedResponse, err := owner.Do(oversizedRequest)
	if err != nil {
		t.Fatal(err)
	}
	_ = oversizedResponse.Body.Close()
	if oversizedResponse.StatusCode != http.StatusBadRequest {
		t.Fatalf("oversized request: %d", oversizedResponse.StatusCode)
	}

	var list struct {
		Processes []domain.ProcessSummary `json:"processes"`
	}
	status = requestJSON(t, owner, http.MethodGet, server.URL+"/api/processes?workspaceId="+ownerSession.Workspace.ID, nil, &list)
	if status != http.StatusOK || len(list.Processes) != 1 {
		t.Fatalf("list: %d %+v", status, list.Processes)
	}

	update := map[string]any{"name": "Approval updated", "nodes": []any{}, "edges": []any{}, "expectedVersion": 1}
	var updated processEnvelope
	status = requestJSON(t, owner, http.MethodPatch, server.URL+"/api/processes/"+created.Process.ID, update, &updated)
	if status != http.StatusOK || updated.Process.CurrentVersion != 2 {
		t.Fatalf("update: %d %+v", status, updated.Process)
	}
	var conflict processEnvelope
	status = requestJSON(t, owner, http.MethodPatch, server.URL+"/api/processes/"+created.Process.ID, update, &conflict)
	if status != http.StatusConflict || conflict.Process.CurrentVersion != 2 {
		t.Fatalf("conflict: %d %+v", status, conflict.Process)
	}

	status = requestJSON(t, viewer, http.MethodGet, server.URL+"/api/processes/"+created.Process.ID, nil, nil)
	if status != http.StatusNotFound {
		t.Fatalf("foreign process should be hidden: %d", status)
	}
	if _, err = pool.Exec(ctx, `INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'viewer')`, ownerSession.Workspace.ID, viewerSession.User.ID); err != nil {
		t.Fatal(err)
	}
	status = requestJSON(t, viewer, http.MethodGet, server.URL+"/api/processes/"+created.Process.ID, nil, nil)
	if status != http.StatusOK {
		t.Fatalf("viewer read: %d", status)
	}
	status = requestJSON(t, viewer, http.MethodPatch, server.URL+"/api/processes/"+created.Process.ID, map[string]any{"name": "No", "nodes": []any{}, "edges": []any{}, "expectedVersion": 2}, nil)
	if status != http.StatusForbidden {
		t.Fatalf("viewer update: %d", status)
	}
	status = requestJSON(t, viewer, http.MethodPost, server.URL+"/api/processes", workflow, nil)
	if status != http.StatusForbidden {
		t.Fatalf("viewer create: %d", status)
	}
	if _, err = pool.Exec(ctx, `UPDATE workspace_members SET role='editor' WHERE workspace_id=$1 AND user_id=$2`, ownerSession.Workspace.ID, viewerSession.User.ID); err != nil {
		t.Fatal(err)
	}
	var editorCreated processEnvelope
	status = requestJSON(t, viewer, http.MethodPost, server.URL+"/api/processes", map[string]any{"workspaceId": ownerSession.Workspace.ID, "name": "Editor process", "nodes": []any{}, "edges": []any{}}, &editorCreated)
	if status != http.StatusCreated {
		t.Fatalf("editor create: %d", status)
	}
	status = requestJSON(t, viewer, http.MethodPatch, server.URL+"/api/processes/"+editorCreated.Process.ID, map[string]any{"name": "Editor updated", "nodes": []any{}, "edges": []any{}, "expectedVersion": 1}, nil)
	if status != http.StatusOK {
		t.Fatalf("editor update: %d", status)
	}

	status = requestJSON(t, owner, http.MethodPost, server.URL+"/api/processes/"+created.Process.ID+"/versions", nil, nil)
	if status != http.StatusCreated {
		t.Fatalf("checkpoint: %d", status)
	}
	var versions struct {
		Versions []domain.Version `json:"versions"`
	}
	status = requestJSON(t, owner, http.MethodGet, server.URL+"/api/processes/"+created.Process.ID+"/versions", nil, &versions)
	if status != http.StatusOK || len(versions.Versions) < 2 {
		t.Fatalf("versions: %d %d", status, len(versions.Versions))
	}
	var restored processEnvelope
	status = requestJSON(t, owner, http.MethodPost, server.URL+"/api/processes/"+created.Process.ID+"/versions/1/restore", nil, &restored)
	if status != http.StatusOK || restored.Process.CurrentVersion != 3 {
		t.Fatalf("restore: %d %+v", status, restored.Process)
	}

	status = requestJSON(t, owner, http.MethodDelete, server.URL+"/api/processes/"+created.Process.ID, nil, nil)
	if status != http.StatusOK {
		t.Fatalf("delete: %d", status)
	}
	status = requestJSON(t, owner, http.MethodGet, server.URL+"/api/processes/"+created.Process.ID, nil, nil)
	if status != http.StatusNotFound {
		t.Fatalf("deleted process: %d", status)
	}
	status = requestJSON(t, owner, http.MethodPost, server.URL+"/api/auth/logout", nil, nil)
	if status != http.StatusOK {
		t.Fatalf("logout: %d", status)
	}
	status = requestJSON(t, owner, http.MethodGet, server.URL+"/api/auth/session", nil, nil)
	if status != http.StatusUnauthorized {
		t.Fatalf("session after logout: %d", status)
	}
}

func newTestClient(t *testing.T) *http.Client {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	return &http.Client{Jar: jar, Timeout: 10 * time.Second}
}

func requestJSON(t *testing.T, client *http.Client, method, url string, input, output any) int {
	t.Helper()
	var body io.Reader
	if input != nil {
		encoded, err := json.Marshal(input)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(encoded)
	}
	request, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatal(err)
	}
	if input != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	data, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if output != nil && len(data) > 0 {
		if err := json.Unmarshal(data, output); err != nil {
			t.Fatalf("decode %s %s: %v: %s", method, url, err, data)
		}
	}
	return response.StatusCode
}
