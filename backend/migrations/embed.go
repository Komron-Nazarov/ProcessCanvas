package migrations

import "embed"

// Files contains ordered SQL migrations bundled into the server binary.
//
//go:embed *.up.sql
var Files embed.FS
