package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	authservice "processcanvas/backend/internal/auth"
	"processcanvas/backend/internal/config"
	"processcanvas/backend/internal/domain"
	appmiddleware "processcanvas/backend/internal/middleware"
	processservice "processcanvas/backend/internal/process"
)

type API struct {
	cfg       config.Config
	pool      *pgxpool.Pool
	auth      *authservice.Service
	processes *processservice.Service
	logger    *slog.Logger
}
type sessionKey string

const currentSessionKey sessionKey = "session"

func New(cfg config.Config, pool *pgxpool.Pool, logger *slog.Logger) http.Handler {
	api := &API{cfg: cfg, pool: pool, auth: authservice.New(pool, cfg.SessionTTL), processes: processservice.New(pool), logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", api.health)
	mux.HandleFunc("GET /ready", api.ready)
	mux.HandleFunc("POST /api/auth/register", api.register)
	mux.HandleFunc("POST /api/auth/login", api.login)
	mux.HandleFunc("POST /api/auth/logout", api.logout)
	mux.Handle("GET /api/auth/session", api.requireAuth(http.HandlerFunc(api.session)))
	mux.Handle("GET /api/processes", api.requireAuth(http.HandlerFunc(api.listProcesses)))
	mux.Handle("POST /api/processes", api.requireAuth(http.HandlerFunc(api.createProcess)))
	mux.Handle("GET /api/processes/{id}", api.requireAuth(http.HandlerFunc(api.getProcess)))
	mux.Handle("PATCH /api/processes/{id}", api.requireAuth(http.HandlerFunc(api.updateProcess)))
	mux.Handle("DELETE /api/processes/{id}", api.requireAuth(http.HandlerFunc(api.deleteProcess)))
	mux.Handle("GET /api/processes/{id}/versions", api.requireAuth(http.HandlerFunc(api.listVersions)))
	mux.Handle("POST /api/processes/{id}/versions", api.requireAuth(http.HandlerFunc(api.checkpoint)))
	mux.Handle("POST /api/processes/{id}/versions/{version}/restore", api.requireAuth(http.HandlerFunc(api.restoreVersion)))
	var handler http.Handler = mux
	handler = appmiddleware.CORS(cfg.FrontendURL, handler)
	handler = appmiddleware.Log(logger, handler)
	handler = appmiddleware.Recover(logger, handler)
	handler = appmiddleware.RequestID(handler)
	return handler
}

func (a *API) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
func (a *API) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := a.pool.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database_unavailable", "Database is unavailable", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

type authInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	var input authInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if fields := validateAuth(input.Name, input.Email, input.Password, true); len(fields) > 0 {
		writeError(w, 400, "validation_error", "Request validation failed", fields)
		return
	}
	session, token, err := a.auth.Register(r.Context(), input.Name, input.Email, input.Password)
	if errors.Is(err, authservice.ErrEmailExists) {
		writeError(w, 409, "email_exists", "An account with this email already exists", map[string]string{"email": "email_exists"})
		return
	}
	if err != nil {
		a.internal(w, r, err)
		return
	}
	a.setCookie(w, token)
	writeJSON(w, http.StatusCreated, session)
}
func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var input authInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if fields := validateAuth("", input.Email, input.Password, false); len(fields) > 0 {
		writeError(w, 400, "validation_error", "Request validation failed", fields)
		return
	}
	session, token, err := a.auth.Login(r.Context(), input.Email, input.Password)
	if errors.Is(err, authservice.ErrInvalidCredentials) {
		writeError(w, 401, "invalid_credentials", "Email or password is incorrect", nil)
		return
	}
	if err != nil {
		a.internal(w, r, err)
		return
	}
	a.setCookie(w, token)
	writeJSON(w, 200, session)
}
func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie(a.cfg.CookieName)
	if cookie != nil {
		if err := a.auth.Logout(r.Context(), cookie.Value); err != nil {
			a.internal(w, r, err)
			return
		}
	}
	http.SetCookie(w, &http.Cookie{Name: a.cfg.CookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: a.cfg.SecureCookie()})
	writeJSON(w, 200, map[string]bool{"ok": true})
}
func (a *API) session(w http.ResponseWriter, r *http.Request) { writeJSON(w, 200, currentSession(r)) }
func (a *API) setCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{Name: a.cfg.CookieName, Value: token, Path: "/", MaxAge: int(a.cfg.SessionTTL.Seconds()), Expires: time.Now().Add(a.cfg.SessionTTL), HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: a.cfg.SecureCookie()})
}
func (a *API) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(a.cfg.CookieName)
		if err != nil {
			writeError(w, 401, "unauthorized", "Authentication is required", nil)
			return
		}
		session, err := a.auth.Resolve(r.Context(), cookie.Value)
		if errors.Is(err, authservice.ErrInvalidSession) {
			writeError(w, 401, "unauthorized", "Authentication is required", nil)
			return
		}
		if err != nil {
			a.internal(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), currentSessionKey, session)))
	})
}
func currentSession(r *http.Request) domain.Session {
	return r.Context().Value(currentSessionKey).(domain.Session)
}

type processInput struct {
	WorkspaceID     string          `json:"workspaceId"`
	Name            string          `json:"name"`
	Nodes           json.RawMessage `json:"nodes"`
	Edges           json.RawMessage `json:"edges"`
	ExpectedVersion int             `json:"expectedVersion"`
}

func (a *API) listProcesses(w http.ResponseWriter, r *http.Request) {
	workspaceID := r.URL.Query().Get("workspaceId")
	if workspaceID == "" {
		writeError(w, 400, "workspace_required", "workspaceId is required", nil)
		return
	}
	items, err := a.processes.List(r.Context(), currentSession(r).User.ID, workspaceID)
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"processes": items})
}
func (a *API) createProcess(w http.ResponseWriter, r *http.Request) {
	var input processInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.WorkspaceID == "" {
		writeError(w, 400, "validation_error", "Request validation failed", map[string]string{"workspaceId": "required"})
		return
	}
	if fields := validateWorkflow(input.Name, input.Nodes, input.Edges); len(fields) > 0 {
		writeError(w, 400, "validation_error", "Request validation failed", fields)
		return
	}
	p, err := a.processes.Create(r.Context(), currentSession(r).User.ID, input.WorkspaceID, strings.TrimSpace(input.Name), input.Nodes, input.Edges)
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 201, map[string]any{"process": p})
}
func (a *API) getProcess(w http.ResponseWriter, r *http.Request) {
	p, err := a.processes.Get(r.Context(), currentSession(r).User.ID, r.PathValue("id"))
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"process": p})
}
func (a *API) updateProcess(w http.ResponseWriter, r *http.Request) {
	var input processInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.ExpectedVersion < 1 {
		writeError(w, 400, "validation_error", "Request validation failed", map[string]string{"expectedVersion": "required"})
		return
	}
	if fields := validateWorkflow(input.Name, input.Nodes, input.Edges); len(fields) > 0 {
		writeError(w, 400, "validation_error", "Request validation failed", fields)
		return
	}
	p, err := a.processes.Update(r.Context(), currentSession(r).User.ID, r.PathValue("id"), strings.TrimSpace(input.Name), input.Nodes, input.Edges, input.ExpectedVersion)
	if errors.Is(err, processservice.ErrConflict) {
		writeJSON(w, 409, map[string]any{"error": apiError{Code: "version_conflict", Message: "The process has a newer server version"}, "process": p})
		return
	}
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"process": p})
}
func (a *API) deleteProcess(w http.ResponseWriter, r *http.Request) {
	if err := a.processes.Delete(r.Context(), currentSession(r).User.ID, r.PathValue("id")); err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}
func (a *API) listVersions(w http.ResponseWriter, r *http.Request) {
	items, err := a.processes.Versions(r.Context(), currentSession(r).User.ID, r.PathValue("id"))
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"versions": items})
}
func (a *API) checkpoint(w http.ResponseWriter, r *http.Request) {
	v, err := a.processes.Checkpoint(r.Context(), currentSession(r).User.ID, r.PathValue("id"))
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 201, map[string]any{"version": v})
}
func (a *API) restoreVersion(w http.ResponseWriter, r *http.Request) {
	version, err := strconv.Atoi(r.PathValue("version"))
	if err != nil || version < 1 {
		writeError(w, 400, "invalid_version", "Version must be a positive integer", nil)
		return
	}
	p, err := a.processes.Restore(r.Context(), currentSession(r).User.ID, r.PathValue("id"), version)
	if err != nil {
		a.processError(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"process": p})
}
func (a *API) processError(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, processservice.ErrNotFound) {
		writeError(w, 404, "not_found", "Resource was not found", nil)
		return
	}
	if errors.Is(err, processservice.ErrForbidden) {
		writeError(w, 403, "forbidden", "You do not have permission for this action", nil)
		return
	}
	a.internal(w, r, err)
}
func (a *API) internal(w http.ResponseWriter, r *http.Request, err error) {
	a.logger.Error("request failed", "error", err, "request_id", r.Context().Value(appmiddleware.RequestIDKey))
	writeError(w, 500, "server_error", "The server could not complete the request", nil)
}
