package process

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"processcanvas/backend/internal/domain"
)

var ErrNotFound = errors.New("not found")
var ErrForbidden = errors.New("forbidden")
var ErrConflict = errors.New("version conflict")

type Service struct{ pool *pgxpool.Pool }

func New(pool *pgxpool.Pool) *Service { return &Service{pool: pool} }

func (s *Service) role(ctx context.Context, userID, workspaceID string) (string, error) {
	var role string
	err := s.pool.QueryRow(ctx, `SELECT role FROM workspace_members WHERE user_id=$1 AND workspace_id=$2`, userID, workspaceID).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return role, err
}
func (s *Service) processRole(ctx context.Context, userID, processID string) (domain.Process, string, error) {
	var p domain.Process
	var role string
	err := s.pool.QueryRow(ctx, `SELECT p.id,p.workspace_id,p.name,p.status,p.nodes,p.edges,p.current_version,p.created_at,p.updated_at,wm.role FROM processes p JOIN workspace_members wm ON wm.workspace_id=p.workspace_id AND wm.user_id=$1 WHERE p.id=$2`, userID, processID).Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Nodes, &p.Edges, &p.CurrentVersion, &p.CreatedAt, &p.UpdatedAt, &role)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, "", ErrNotFound
	}
	return p, role, err
}
func canWrite(role string) bool { return role == "owner" || role == "editor" }

func (s *Service) List(ctx context.Context, userID, workspaceID string) ([]domain.ProcessSummary, error) {
	if _, err := s.role(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,name,status,current_version,created_at,updated_at FROM processes WHERE workspace_id=$1 ORDER BY updated_at DESC`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.ProcessSummary{}
	for rows.Next() {
		var p domain.ProcessSummary
		if err := rows.Scan(&p.ID, &p.Name, &p.Status, &p.CurrentVersion, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

func (s *Service) Create(ctx context.Context, userID, workspaceID, name string, nodes, edges json.RawMessage) (domain.Process, error) {
	role, err := s.role(ctx, userID, workspaceID)
	if err != nil {
		return domain.Process{}, err
	}
	if !canWrite(role) {
		return domain.Process{}, ErrForbidden
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return domain.Process{}, err
	}
	defer tx.Rollback(ctx)
	var p domain.Process
	err = tx.QueryRow(ctx, `INSERT INTO processes(workspace_id,name,nodes,edges) VALUES($1,$2,$3,$4) RETURNING id,workspace_id,name,status,nodes,edges,current_version,created_at,updated_at`, workspaceID, name, nodes, edges).Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Nodes, &p.Edges, &p.CurrentVersion, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return p, err
	}
	_, err = tx.Exec(ctx, `INSERT INTO process_versions(process_id,version,name,nodes,edges,created_by) VALUES($1,1,$2,$3,$4,$5)`, p.ID, p.Name, p.Nodes, p.Edges, userID)
	if err != nil {
		return p, err
	}
	if err = tx.Commit(ctx); err != nil {
		return p, err
	}
	return p, nil
}
func (s *Service) Get(ctx context.Context, userID, id string) (domain.Process, error) {
	p, _, err := s.processRole(ctx, userID, id)
	return p, err
}
func (s *Service) Update(ctx context.Context, userID, id, name string, nodes, edges json.RawMessage, expected int) (domain.Process, error) {
	current, role, err := s.processRole(ctx, userID, id)
	if err != nil {
		return domain.Process{}, err
	}
	if !canWrite(role) {
		return domain.Process{}, ErrForbidden
	}
	if current.CurrentVersion != expected {
		return current, ErrConflict
	}
	var p domain.Process
	err = s.pool.QueryRow(ctx, `UPDATE processes SET name=$1,nodes=$2,edges=$3,current_version=current_version+1,updated_at=now() WHERE id=$4 AND current_version=$5 RETURNING id,workspace_id,name,status,nodes,edges,current_version,created_at,updated_at`, name, nodes, edges, id, expected).Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Nodes, &p.Edges, &p.CurrentVersion, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return current, ErrConflict
	}
	return p, err
}
func (s *Service) Delete(ctx context.Context, userID, id string) error {
	_, role, err := s.processRole(ctx, userID, id)
	if err != nil {
		return err
	}
	if !canWrite(role) {
		return ErrForbidden
	}
	_, err = s.pool.Exec(ctx, `DELETE FROM processes WHERE id=$1`, id)
	return err
}
func (s *Service) Checkpoint(ctx context.Context, userID, id string) (domain.Version, error) {
	p, role, err := s.processRole(ctx, userID, id)
	if err != nil {
		return domain.Version{}, err
	}
	if !canWrite(role) {
		return domain.Version{}, ErrForbidden
	}
	var v domain.Version
	err = s.pool.QueryRow(ctx, `INSERT INTO process_versions(process_id,version,name,nodes,edges,created_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(process_id,version) DO UPDATE SET name=excluded.name,nodes=excluded.nodes,edges=excluded.edges,created_by=excluded.created_by,created_at=now() RETURNING id,process_id,version,name,nodes,edges,created_by,created_at`, p.ID, p.CurrentVersion, p.Name, p.Nodes, p.Edges, userID).Scan(&v.ID, &v.ProcessID, &v.Version, &v.Name, &v.Nodes, &v.Edges, &v.CreatedBy, &v.CreatedAt)
	return v, err
}
func (s *Service) Versions(ctx context.Context, userID, id string) ([]domain.Version, error) {
	if _, _, err := s.processRole(ctx, userID, id); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT pv.id,pv.process_id,pv.version,pv.name,pv.nodes,pv.edges,pv.created_by,u.name,pv.created_at FROM process_versions pv JOIN users u ON u.id=pv.created_by WHERE pv.process_id=$1 ORDER BY pv.version DESC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.Version{}
	for rows.Next() {
		var v domain.Version
		if err := rows.Scan(&v.ID, &v.ProcessID, &v.Version, &v.Name, &v.Nodes, &v.Edges, &v.CreatedBy, &v.AuthorName, &v.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, v)
	}
	return items, rows.Err()
}
func (s *Service) Restore(ctx context.Context, userID, id string, version int) (domain.Process, error) {
	current, role, err := s.processRole(ctx, userID, id)
	if err != nil {
		return domain.Process{}, err
	}
	if !canWrite(role) {
		return domain.Process{}, ErrForbidden
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return domain.Process{}, err
	}
	defer tx.Rollback(ctx)
	var name string
	var nodes, edges json.RawMessage
	err = tx.QueryRow(ctx, `SELECT name,nodes,edges FROM process_versions WHERE process_id=$1 AND version=$2`, id, version).Scan(&name, &nodes, &edges)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Process{}, ErrNotFound
	}
	if err != nil {
		return domain.Process{}, err
	}
	next := current.CurrentVersion + 1
	var p domain.Process
	err = tx.QueryRow(ctx, `UPDATE processes SET name=$1,nodes=$2,edges=$3,current_version=$4,updated_at=now() WHERE id=$5 RETURNING id,workspace_id,name,status,nodes,edges,current_version,created_at,updated_at`, name, nodes, edges, next, id).Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Nodes, &p.Edges, &p.CurrentVersion, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return p, err
	}
	_, err = tx.Exec(ctx, `INSERT INTO process_versions(process_id,version,name,nodes,edges,created_by) VALUES($1,$2,$3,$4,$5,$6)`, id, next, name, nodes, edges, userID)
	if err != nil {
		return p, err
	}
	if err = tx.Commit(ctx); err != nil {
		return p, err
	}
	return p, nil
}
