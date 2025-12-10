package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
	"github.com/spidey52/api-logs/internal/ports/output"
)

// apiLogService implements the APILogService interface
type apiLogService struct {
	logRepo     output.APILogRepository
	headersRepo output.APILogHeadersRepository
	bodyRepo    output.APILogBodyRepository
}

// NewAPILogService creates a new instance of APILogService
func NewAPILogService(
	logRepo output.APILogRepository,
	headersRepo output.APILogHeadersRepository,
	bodyRepo output.APILogBodyRepository,
) input.APILogService {
	return &apiLogService{
		logRepo:     logRepo,
		headersRepo: headersRepo,
		bodyRepo:    bodyRepo,
	}
}

// CreateLog creates a new API log entry with optional headers and body
func (s *apiLogService) CreateLog(
	ctx context.Context,
	log *domain.APILog,
	headers *domain.APILogHeaders,
	body *domain.APILogBody,
) error {
	// Validate core log
	if err := log.Validate(); err != nil {
		return domain.ErrInvalidInput
	}

	// Generate ID if not provided
	if log.ID == "" {
		log.ID = uuid.New().String()
	}

	// Set timestamp if not provided
	if log.Timestamp.IsZero() {
		log.Timestamp = time.Now()
	}

	// Create main log entry
	if err := s.logRepo.Create(ctx, log); err != nil {
		return err
	}

	// Create headers if provided
	if headers != nil && (len(headers.RequestHeaders) > 0 || len(headers.ResponseHeaders) > 0) {
		headers.ID = uuid.New().String()
		headers.LogID = log.ID
		headers.CreatedAt = time.Now()

		if err := headers.Validate(); err != nil {
			// Log error but don't fail the main log creation
			// In production, you might want to use a proper logger here
		} else if err := s.headersRepo.Create(ctx, headers); err != nil {
			// Log error but don't fail
		}
	}

	// Create body if provided
	if body != nil && (len(body.RequestBody) > 0 || len(body.ResponseBody) > 0) {
		body.ID = uuid.New().String()
		body.LogID = log.ID
		body.CreatedAt = time.Now()

		if err := body.Validate(); err != nil {
			// Log error but don't fail
		} else if err := s.bodyRepo.Create(ctx, body); err != nil {
			// Log error but don't fail
		}
	}

	return nil
}

// GetLog retrieves a log by ID (core log only)
func (s *apiLogService) GetLog(ctx context.Context, id string) (*domain.APILog, error) {
	return s.logRepo.FindByID(ctx, id)
}

// GetLogWithDetails retrieves a log with headers and body
func (s *apiLogService) GetLogWithDetails(ctx context.Context, id string) (*domain.APILog, *domain.APILogHeaders, *domain.APILogBody, error) {
	// Get core log
	log, err := s.logRepo.FindByID(ctx, id)
	if err != nil {
		return nil, nil, nil, err
	}
	if log == nil {
		return nil, nil, nil, domain.ErrLogNotFound
	}

	var headers *domain.APILogHeaders
	var body *domain.APILogBody

	// Get headers if they exist
	headers, err = s.headersRepo.FindByLogID(ctx, id)
	if err != nil {
		// Headers might not exist, don't fail
		headers = nil
	}

	// Get body if it exists
	body, err = s.bodyRepo.FindByLogID(ctx, id)
	if err != nil {
		// Body might not exist, don't fail
		body = nil
	}

	return log, headers, body, nil
}

// GetLogHeaders retrieves headers for a specific log
func (s *apiLogService) GetLogHeaders(ctx context.Context, logID string) (*domain.APILogHeaders, error) {
	return s.headersRepo.FindByLogID(ctx, logID)
}

// GetLogBody retrieves body for a specific log
func (s *apiLogService) GetLogBody(ctx context.Context, logID string) (*domain.APILogBody, error) {
	return s.bodyRepo.FindByLogID(ctx, logID)
}

// ListLogs retrieves logs based on filter criteria
func (s *apiLogService) ListLogs(ctx context.Context, filter domain.LogFilter) ([]*domain.APILog, error) {
	filter.ApplyDefaults()
	return s.logRepo.FindByFilter(ctx, filter)
}

// CountLogs counts logs matching the filter criteria
func (s *apiLogService) CountLogs(ctx context.Context, filter domain.LogFilter) (int64, error) {
	return s.logRepo.CountByFilter(ctx, filter)
}

// DeleteLog deletes a log and its associated headers/body
func (s *apiLogService) DeleteLog(ctx context.Context, id string) error {
	// Check if log exists
	log, err := s.logRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if log == nil {
		return domain.ErrLogNotFound
	}

	// Delete headers if they exist
	_ = s.headersRepo.Delete(ctx, id) // Ignore error

	// Delete body if it exists
	_ = s.bodyRepo.Delete(ctx, id) // Ignore error

	// Delete main log
	return s.logRepo.Delete(ctx, id)
}

// GetLogStats retrieves statistics for a project
func (s *apiLogService) GetLogStats(ctx context.Context, projectID string, environment domain.Environment) (map[string]interface{}, error) {
	if err := environment.Validate(); err != nil {
		return nil, domain.ErrInvalidEnvironment
	}

	// Get total count
	count, err := s.logRepo.CountByProject(ctx, projectID, environment)
	if err != nil {
		return nil, err
	}

	// Get status code distribution
	distribution, err := s.logRepo.GetStatusCodeDistribution(ctx, projectID, environment)
	if err != nil {
		return nil, err
	}

	// Get average response time
	avgResponseTime, err := s.logRepo.GetAverageResponseTime(ctx, projectID, environment)
	if err != nil {
		return nil, err
	}

	// Get time series data
	timeSeries, err := s.logRepo.GetTimeSeriesStats(ctx, projectID, environment)
	if err != nil {
		return nil, err
	}

	// Get top endpoints
	topEndpoints, err := s.logRepo.GetTopEndpoints(ctx, projectID, environment, 10)
	if err != nil {
		return nil, err
	}

	// Get method distribution
	methodDistribution, err := s.logRepo.GetMethodDistribution(ctx, projectID, environment)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_logs":               count,
		"status_code_distribution": distribution,
		"average_response_time_ms": avgResponseTime,
		"time_series":              timeSeries,
		"top_endpoints":            topEndpoints,
		"method_distribution":      methodDistribution,
		"environment":              environment.String(),
		"project_id":               projectID,
	}

	return stats, nil
}

// GetUniquePaths retrieves unique paths for autocomplete
func (s *apiLogService) GetUniquePaths(ctx context.Context, projectID string, environment domain.Environment) ([]string, error) {
	if err := environment.Validate(); err != nil {
		return nil, domain.ErrInvalidEnvironment
	}

	return s.logRepo.GetUniquePaths(ctx, projectID, environment)
}
