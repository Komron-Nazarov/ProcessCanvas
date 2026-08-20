package domain

import (
	"encoding/json"
	"time"
)

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}
type Session struct {
	User      User      `json:"user"`
	Workspace Workspace `json:"workspace"`
}
type Process struct {
	ID             string          `json:"id"`
	WorkspaceID    string          `json:"workspaceId"`
	Name           string          `json:"name"`
	Status         string          `json:"status"`
	Nodes          json.RawMessage `json:"nodes"`
	Edges          json.RawMessage `json:"edges"`
	CurrentVersion int             `json:"currentVersion"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}
type ProcessSummary struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Status         string    `json:"status"`
	CurrentVersion int       `json:"currentVersion"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
type Version struct {
	ID         string          `json:"id"`
	ProcessID  string          `json:"processId"`
	Version    int             `json:"version"`
	Name       string          `json:"name"`
	Nodes      json.RawMessage `json:"nodes"`
	Edges      json.RawMessage `json:"edges"`
	CreatedBy  string          `json:"createdBy"`
	AuthorName string          `json:"authorName"`
	CreatedAt  time.Time       `json:"createdAt"`
}
