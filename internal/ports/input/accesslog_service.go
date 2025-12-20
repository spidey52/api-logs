package input

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// AccessLogService defines the interface for API log business logic (Primary Port)

type AccessLogService interface {
	// CreateLog creates a new API log entry with optional headers and body
	CreateLog(ctx context.Context, log *domain.AccessLog) error
	CreateManyLogs(ctx context.Context, logs []*domain.AccessLog) error

	// GetLogDetails retrieves a specific API log by its ID
	GetLogDetails(ctx context.Context, id string) (*domain.AccessLog, error)

	// GetLogs retrieves API logs based on filter criteria
	GetLogs(ctx context.Context, filter domain.AccessLogFilter) ([]*domain.AccessLog, error)
	CountLogs(ctx context.Context, filter domain.AccessLogFilter) (int64, error)
}
