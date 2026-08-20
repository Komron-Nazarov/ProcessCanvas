package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"processcanvas/backend/internal/domain"
)

var ErrEmailExists = errors.New("email exists")
var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrInvalidSession = errors.New("invalid session")

type Service struct {
	pool *pgxpool.Pool
	ttl  time.Duration
}

func New(pool *pgxpool.Pool, ttl time.Duration) *Service { return &Service{pool: pool, ttl: ttl} }

func (s *Service) Register(ctx context.Context, name, email, password string) (domain.Session, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	name = strings.TrimSpace(name)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return domain.Session{}, "", err
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return domain.Session{}, "", err
	}
	defer tx.Rollback(ctx)
	var user domain.User
	err = tx.QueryRow(ctx, `INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email`, name, email, string(hash)).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.Session{}, "", ErrEmailExists
		}
		return domain.Session{}, "", err
	}
	var workspace domain.Workspace
	err = tx.QueryRow(ctx, `INSERT INTO workspaces(name,owner_id) VALUES($1,$2) RETURNING id,name`, name+" — Workspace", user.ID).Scan(&workspace.ID, &workspace.Name)
	if err != nil {
		return domain.Session{}, "", err
	}
	workspace.Role = "owner"
	if _, err = tx.Exec(ctx, `INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner')`, workspace.ID, user.ID); err != nil {
		return domain.Session{}, "", err
	}
	token, tokenHash, err := newToken()
	if err != nil {
		return domain.Session{}, "", err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)`, tokenHash, user.ID, time.Now().Add(s.ttl)); err != nil {
		return domain.Session{}, "", err
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.Session{}, "", err
	}
	return domain.Session{User: user, Workspace: workspace}, token, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (domain.Session, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var user domain.User
	var passwordHash string
	err := s.pool.QueryRow(ctx, `SELECT id,name,email,password_hash FROM users WHERE lower(email)=lower($1)`, email).Scan(&user.ID, &user.Name, &user.Email, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) != nil) {
		return domain.Session{}, "", ErrInvalidCredentials
	}
	if err != nil {
		return domain.Session{}, "", err
	}
	var workspace domain.Workspace
	err = s.pool.QueryRow(ctx, `SELECT w.id,w.name,wm.role FROM workspaces w JOIN workspace_members wm ON wm.workspace_id=w.id WHERE wm.user_id=$1 ORDER BY w.created_at LIMIT 1`, user.ID).Scan(&workspace.ID, &workspace.Name, &workspace.Role)
	if err != nil {
		return domain.Session{}, "", err
	}
	token, tokenHash, err := newToken()
	if err != nil {
		return domain.Session{}, "", err
	}
	if _, err = s.pool.Exec(ctx, `INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)`, tokenHash, user.ID, time.Now().Add(s.ttl)); err != nil {
		return domain.Session{}, "", err
	}
	return domain.Session{User: user, Workspace: workspace}, token, nil
}

func (s *Service) Resolve(ctx context.Context, token string) (domain.Session, error) {
	if token == "" {
		return domain.Session{}, ErrInvalidSession
	}
	tokenHash := hashToken(token)
	var result domain.Session
	err := s.pool.QueryRow(ctx, `SELECT u.id,u.name,u.email,w.id,w.name,wm.role FROM sessions s JOIN users u ON u.id=s.user_id JOIN workspace_members wm ON wm.user_id=u.id JOIN workspaces w ON w.id=wm.workspace_id WHERE s.token_hash=$1 AND s.expires_at>now() ORDER BY w.created_at LIMIT 1`, tokenHash).Scan(&result.User.ID, &result.User.Name, &result.User.Email, &result.Workspace.ID, &result.Workspace.Name, &result.Workspace.Role)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Session{}, ErrInvalidSession
	}
	if err != nil {
		return domain.Session{}, err
	}
	_, _ = s.pool.Exec(ctx, `UPDATE sessions SET last_used_at=now() WHERE token_hash=$1`, tokenHash)
	return result, nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1`, hashToken(token))
	return err
}
func (s *Service) DeleteExpired(ctx context.Context) {
	_, _ = s.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at<=now()`)
}

func newToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, hashToken(token), nil
}
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
