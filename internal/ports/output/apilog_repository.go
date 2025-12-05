package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// APILogRepository defines the interface for API log data persistence (Secondary Port)
type APILogRepository interface {
	// Create stores a new API log entry (core log only)
	Create(ctx context.Context, log *domain.APILog) error

	// FindByID retrieves a log by ID
	FindByID(ctx context.Context, id string) (*domain.APILog, error)

	// FindByFilter retrieves logs based on filter criteria
	FindByFilter(ctx context.Context, filter domain.LogFilter) ([]*domain.APILog, error)

	// Delete removes a log by ID
	Delete(ctx context.Context, id string) error

	// CountByProject counts logs for a specific project
	CountByProject(ctx context.Context, projectID string, environment domain.Environment) (int64, error)

	// GetStatusCodeDistribution returns distribution of status codes for a project
	GetStatusCodeDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[int]int64, error)

	// GetAverageResponseTime returns average response time for a project
	GetAverageResponseTime(ctx context.Context, projectID string, environment domain.Environment) (float64, error)
}
