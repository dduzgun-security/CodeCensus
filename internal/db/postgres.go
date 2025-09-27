package db

import (
	"database/sql"
	"embed"
	"fmt"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

type Queries struct {
	db *sql.DB
}

func New(db *sql.DB) *Queries {
	return &Queries{db: db}
}

func (q *Queries) ExecContext(query string, args ...interface{}) (sql.Result, error) {
	return q.db.Exec(query, args...)
}

func (q *Queries) QueryContext(query string, args ...interface{}) (*sql.Rows, error) {
	return q.db.Query(query, args...)
}

func (q *Queries) QueryRowContext(query string, args ...interface{}) *sql.Row {
	return q.db.QueryRow(query, args...)
}

func RunMigrations(db *sql.DB) error {
	if err := createMigrationsTable(db); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	files, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migration files: %w", err)
	}

	var migrationNames []string
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".sql") {
			migrationNames = append(migrationNames, file.Name())
		}
	}
	sort.Strings(migrationNames)

	for _, name := range migrationNames {
		if err := runMigration(db, name); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", name, err)
		}
	}

	return nil
}

func createMigrationsTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)`
	_, err := db.Exec(query)
	return err
}

func runMigration(db *sql.DB, filename string) error {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", filename).Scan(&exists)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	content, err := migrationFiles.ReadFile(filepath.Join("migrations", filename))
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(string(content)); err != nil {
		return err
	}

	if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", filename); err != nil {
		return err
	}

	return tx.Commit()
}