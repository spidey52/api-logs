package postgres

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// Create implements output.UserRepository.
func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	metadataJSON, _ := json.Marshal(user.Metadata)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, name, identifier, metadata, created_at, project_id)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		user.ID, user.Name, user.Identifier, metadataJSON, user.CreatedAt, user.ProjectID,
	)
	return err
}

// FindByID implements output.UserRepository.
func (r *UserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	var metadataJSON []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, name, identifier, metadata, created_at, project_id
		FROM users WHERE id = $1`, id).Scan(
		&user.ID, &user.Name, &user.Identifier, &metadataJSON, &user.CreatedAt, &user.ProjectID,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	json.Unmarshal(metadataJSON, &user.Metadata)
	return &user, nil
}

// FindByIdentifier implements output.UserRepository.
func (r *UserRepository) FindByIdentifier(ctx context.Context, identifier string, projectID string) (*domain.User, error) {
	var user domain.User
	var metadataJSON []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, name, identifier, metadata, created_at, project_id
		FROM users WHERE identifier = $1 AND project_id = $2`, identifier, projectID).Scan(
		&user.ID, &user.Name, &user.Identifier, &metadataJSON, &user.CreatedAt, &user.ProjectID,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	json.Unmarshal(metadataJSON, &user.Metadata)
	return &user, nil
}

// Update implements output.UserRepository.
func (r *UserRepository) Update(ctx context.Context, user *domain.User) error {
	metadataJSON, _ := json.Marshal(user.Metadata)

	_, err := r.pool.Exec(ctx, `
		UPDATE users SET name = $1, identifier = $2, metadata = $3
		WHERE id = $4`,
		user.Name, user.Identifier, metadataJSON, user.ID,
	)
	return err
}

// Delete implements output.UserRepository.
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

// List implements output.UserRepository.
func (r *UserRepository) List(ctx context.Context, page, pageSize int) ([]*domain.User, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get users
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, identifier, metadata, created_at, project_id
		FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		var metadataJSON []byte
		err := rows.Scan(
			&user.ID, &user.Name, &user.Identifier, &metadataJSON, &user.CreatedAt, &user.ProjectID,
		)
		if err != nil {
			return nil, 0, err
		}
		json.Unmarshal(metadataJSON, &user.Metadata)
		users = append(users, &user)
	}
	return users, total, nil
}

var _ output.UserRepository = (*UserRepository)(nil)
