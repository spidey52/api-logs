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

	// CountByFilter counts logs matching the filter criteria
	CountByFilter(ctx context.Context, filter domain.LogFilter) (int64, error)

	// GetStatusCodeDistribution returns distribution of status codes for a project
	GetStatusCodeDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[int]int64, error)

	// GetAverageResponseTime returns average response time for a project
	GetAverageResponseTime(ctx context.Context, projectID string, environment domain.Environment) (float64, error)

	// GetTimeSeriesStats returns request count grouped by time interval (hourly for last 24h)
	GetTimeSeriesStats(ctx context.Context, projectID string, environment domain.Environment) ([]map[string]interface{}, error)

	// GetTopEndpoints returns top N most requested endpoints with their request counts
	GetTopEndpoints(ctx context.Context, projectID string, environment domain.Environment, limit int) ([]map[string]interface{}, error)

	// GetMethodDistribution returns distribution of HTTP methods (GET, POST, etc.)
	GetMethodDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[string]int64, error)

	// GetUniquePaths returns list of unique paths for autocomplete
	GetUniquePaths(ctx context.Context, projectID string, environment domain.Environment) ([]string, error)
}
