package postgres

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type APILogHeadersRepository struct {
	pool *pgxpool.Pool
}

func NewAPILogHeadersRepository(pool *pgxpool.Pool) *APILogHeadersRepository {
	return &APILogHeadersRepository{pool: pool}
}

// Create implements output.APILogHeadersRepository.
func (r *APILogHeadersRepository) Create(ctx context.Context, headers *domain.APILogHeaders) error {
	requestHeadersJSON, _ := json.Marshal(headers.RequestHeaders)
	responseHeadersJSON, _ := json.Marshal(headers.ResponseHeaders)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO apilog_headers (id, log_id, request_headers, response_headers, created_at)
		VALUES ($1, $2, $3, $4, $5)`,
		headers.ID, headers.LogID, requestHeadersJSON, responseHeadersJSON, headers.CreatedAt,
	)
	return err
}

// FindByLogID implements output.APILogHeadersRepository.
func (r *APILogHeadersRepository) FindByLogID(ctx context.Context, logID string) (*domain.APILogHeaders, error) {
	var headers domain.APILogHeaders
	var requestHeadersJSON, responseHeadersJSON []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, log_id, request_headers, response_headers, created_at
		FROM apilog_headers WHERE log_id = $1`, logID).Scan(
		&headers.ID, &headers.LogID, &requestHeadersJSON, &responseHeadersJSON, &headers.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found, return nil
		}
		return nil, err
	}

	json.Unmarshal(requestHeadersJSON, &headers.RequestHeaders)
	json.Unmarshal(responseHeadersJSON, &headers.ResponseHeaders)
	return &headers, nil
}

// Delete implements output.APILogHeadersRepository.
func (r *APILogHeadersRepository) Delete(ctx context.Context, logID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM apilog_headers WHERE log_id = $1`, logID)
	return err
}

// DeleteBatch implements output.APILogHeadersRepository.
func (r *APILogHeadersRepository) DeleteBatch(ctx context.Context, logIDs []string) error {
	if len(logIDs) == 0 {
		return nil
	}

	query := `DELETE FROM apilog_headers WHERE log_id = ANY($1)`
	_, err := r.pool.Exec(ctx, query, logIDs)
	return err
}

var _ output.APILogHeadersRepository = (*APILogHeadersRepository)(nil)
