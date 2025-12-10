package postgres

import (
	"context"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type ProjectRepository struct {
	pool *pgxpool.Pool
}

func NewProjectRepository(pool *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{pool: pool}
}

// Create implements output.ProjectRepository.
func (r *ProjectRepository) Create(ctx context.Context, project *domain.Project) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO projects (id, name, description, api_key, environment, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		project.ID, project.Name, project.Description, project.APIKey, string(project.Environment), project.IsActive, project.CreatedAt, project.UpdatedAt,
	)
	return err
}

// FindByID implements output.ProjectRepository.
func (r *ProjectRepository) FindByID(ctx context.Context, id string) (*domain.Project, error) {
	var project domain.Project
	var envStr string

	err := r.pool.QueryRow(ctx, `
		SELECT id, name, description, api_key, environment, is_active, created_at, updated_at
		FROM projects WHERE id = $1`, id).Scan(
		&project.ID, &project.Name, &project.Description, &project.APIKey, &envStr, &project.IsActive, &project.CreatedAt, &project.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}

	project.Environment = domain.Environment(envStr)
	return &project, nil
}

// FindByAPIKey implements output.ProjectRepository.
func (r *ProjectRepository) FindByAPIKey(ctx context.Context, apiKey string) (*domain.Project, error) {
	var project domain.Project
	var envStr string

	err := r.pool.QueryRow(ctx, `
		SELECT id, name, description, api_key, environment, is_active, created_at, updated_at
		FROM projects WHERE api_key = $1`, apiKey).Scan(
		&project.ID, &project.Name, &project.Description, &project.APIKey, &envStr, &project.IsActive, &project.CreatedAt, &project.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}

	project.Environment = domain.Environment(envStr)
	return &project, nil
}

// FindAll implements output.ProjectRepository.
func (r *ProjectRepository) FindAll(ctx context.Context, filter domain.ProjectFilter) ([]*domain.Project, error) {
	query := `
		SELECT id, name, description, api_key, environment, is_active, created_at, updated_at
		FROM projects WHERE 1=1`

	args := []interface{}{}
	argIndex := 0

	if filter.Environment != "" {
		argIndex++
		query += ` AND environment = $` + strconv.Itoa(argIndex)
		args = append(args, string(filter.Environment))
	}

	if filter.IsActive != nil {
		argIndex++
		query += ` AND is_active = $` + strconv.Itoa(argIndex)
		args = append(args, *filter.IsActive)
	}

	query += ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIndex+1) + ` OFFSET $` + strconv.Itoa(argIndex+2)
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []*domain.Project
	for rows.Next() {
		var project domain.Project
		var envStr string
		err := rows.Scan(
			&project.ID, &project.Name, &project.Description, &project.APIKey, &envStr, &project.IsActive, &project.CreatedAt, &project.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		project.Environment = domain.Environment(envStr)
		projects = append(projects, &project)
	}
	return projects, nil
}

// Update implements output.ProjectRepository.
func (r *ProjectRepository) Update(ctx context.Context, project *domain.Project) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE projects SET name = $1, description = $2, api_key = $3, environment = $4, is_active = $5, updated_at = $6
		WHERE id = $7`,
		project.Name, project.Description, project.APIKey, string(project.Environment), project.IsActive, project.UpdatedAt, project.ID,
	)
	return err
}

// Delete implements output.ProjectRepository.
func (r *ProjectRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	return err
}

// ExistsByAPIKey implements output.ProjectRepository.
func (r *ProjectRepository) ExistsByAPIKey(ctx context.Context, apiKey string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM projects WHERE api_key = $1)`, apiKey).Scan(&exists)
	return exists, err
}

var _ output.ProjectRepository = (*ProjectRepository)(nil)
