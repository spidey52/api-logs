package input

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// APILogService defines the interface for API log business logic (Primary Port)
type APILogService interface {
	// CreateLog creates a new API log entry with optional headers and body
	CreateLog(
		ctx context.Context,
		log *domain.APILog,
		headers *domain.APILogHeaders,
		body *domain.APILogBody,
	) error

	// GetLog retrieves a log by ID (core log only)
	GetLog(ctx context.Context, id string) (*domain.APILog, error)

	// GetLogWithDetails retrieves a log with headers and body
	GetLogWithDetails(ctx context.Context, id string) (*domain.APILog, *domain.APILogHeaders, *domain.APILogBody, error)

	// GetLogHeaders retrieves headers for a specific log
	GetLogHeaders(ctx context.Context, logID string) (*domain.APILogHeaders, error)

	// GetLogBody retrieves body for a specific log
	GetLogBody(ctx context.Context, logID string) (*domain.APILogBody, error)

	// ListLogs retrieves logs based on filter criteria (core logs only)
	ListLogs(ctx context.Context, filter domain.LogFilter) ([]*domain.APILog, error)

	// CountLogs counts logs matching the filter criteria
	CountLogs(ctx context.Context, filter domain.LogFilter) (int64, error)

	// DeleteLog deletes a log and its associated headers/body
	DeleteLog(ctx context.Context, id string) error

	// GetLogStats retrieves statistics for a project
	GetLogStats(ctx context.Context, projectID string, environment domain.Environment) (map[string]interface{}, error)

	// GetUniquePaths retrieves unique paths for autocomplete
	GetUniquePaths(ctx context.Context, projectID string, environment domain.Environment) ([]string, error)
}
