package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// APILogBodyRepository defines the interface for body data persistence (Secondary Port)
type APILogBodyRepository interface {
	// Create stores request/response bodies for a log
	Create(ctx context.Context, body *domain.APILogBody) error

	// FindByLogID retrieves body by log ID
	FindByLogID(ctx context.Context, logID string) (*domain.APILogBody, error)

	// Delete removes body by log ID
	Delete(ctx context.Context, logID string) error

	// DeleteBatch removes bodies for multiple log IDs
	DeleteBatch(ctx context.Context, logIDs []string) error
}
