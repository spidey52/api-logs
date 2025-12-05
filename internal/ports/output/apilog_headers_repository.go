package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// APILogHeadersRepository defines the interface for headers data persistence (Secondary Port)
type APILogHeadersRepository interface {
	// Create stores headers for a log
	Create(ctx context.Context, headers *domain.APILogHeaders) error

	// FindByLogID retrieves headers by log ID
	FindByLogID(ctx context.Context, logID string) (*domain.APILogHeaders, error)

	// Delete removes headers by log ID
	Delete(ctx context.Context, logID string) error

	// DeleteBatch removes headers for multiple log IDs
	DeleteBatch(ctx context.Context, logIDs []string) error
}
