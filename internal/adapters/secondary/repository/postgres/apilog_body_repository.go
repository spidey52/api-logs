package postgres

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type APILogBodyRepository struct {
	pool *pgxpool.Pool
}

func NewAPILogBodyRepository(pool *pgxpool.Pool) *APILogBodyRepository {
	return &APILogBodyRepository{pool: pool}
}

// Create implements output.APILogBodyRepository.
func (r *APILogBodyRepository) Create(ctx context.Context, body *domain.APILogBody) error {
	requestBodyJSON, _ := json.Marshal(body.RequestBody)
	responseBodyJSON, _ := json.Marshal(body.ResponseBody)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO apilog_bodies (id, log_id, request_body, response_body, created_at)
		VALUES ($1, $2, $3, $4, $5)`,
		body.ID, body.LogID, requestBodyJSON, responseBodyJSON, body.CreatedAt,
	)
	return err
}

// FindByLogID implements output.APILogBodyRepository.
func (r *APILogBodyRepository) FindByLogID(ctx context.Context, logID string) (*domain.APILogBody, error) {
	var body domain.APILogBody
	var requestBodyJSON, responseBodyJSON []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, log_id, request_body, response_body, created_at
		FROM apilog_bodies WHERE log_id = $1`, logID).Scan(
		&body.ID, &body.LogID, &requestBodyJSON, &responseBodyJSON, &body.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found, return nil
		}
		return nil, err
	}

	json.Unmarshal(requestBodyJSON, &body.RequestBody)
	json.Unmarshal(responseBodyJSON, &body.ResponseBody)
	return &body, nil
}

// Delete implements output.APILogBodyRepository.
func (r *APILogBodyRepository) Delete(ctx context.Context, logID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM apilog_bodies WHERE log_id = $1`, logID)
	return err
}

// DeleteBatch implements output.APILogBodyRepository.
func (r *APILogBodyRepository) DeleteBatch(ctx context.Context, logIDs []string) error {
	if len(logIDs) == 0 {
		return nil
	}

	query := `DELETE FROM apilog_bodies WHERE log_id = ANY($1)`
	_, err := r.pool.Exec(ctx, query, logIDs)
	return err
}

var _ output.APILogBodyRepository = (*APILogBodyRepository)(nil)
