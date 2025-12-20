package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// APILogRepository defines the interface for API log data persistence (Secondary Port)
type AccessLogRepository interface {
	Create(ctx context.Context, log *domain.AccessLog) error
	CreateMany(ctx context.Context, logs []*domain.AccessLog) error

	FindByID(ctx context.Context, id string) (*domain.AccessLog, error)
	FindByFilter(ctx context.Context, filter domain.AccessLogFilter) ([]*domain.AccessLog, error)

	// count logs matching the filter criteria
	CountByFilter(ctx context.Context, filter domain.AccessLogFilter) (int64, error)

	DeleteByID(ctx context.Context, id string) error

	DeleteByFilter(ctx context.Context, filter domain.AccessLogFilter) (int64, error)
}
