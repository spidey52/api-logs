package service

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
	"github.com/spidey52/api-logs/internal/ports/output"
)

// accessLogService implements the AccessLogService interface
type accessLogService struct {
	logRepo output.AccessLogRepository
}

var _ input.AccessLogService = (*accessLogService)(nil)

func NewAccessLogService(logRepo output.AccessLogRepository) input.AccessLogService {
	return &accessLogService{
		logRepo: logRepo,
	}
}

// CountLogs implements input.AccessLogService.
func (a *accessLogService) CountLogs(ctx context.Context, filter domain.AccessLogFilter) (int64, error) {
	return a.logRepo.CountByFilter(ctx, filter)
}

// CreateLog implements input.AccessLogService.
func (a *accessLogService) CreateLog(ctx context.Context, log *domain.AccessLog) error {
	log.SetDefaults()
	err := log.Validate()

	if err != nil {
		return err
	}

	return a.logRepo.Create(ctx, log)
}

// CreateManyLogs implements input.AccessLogService.
func (a *accessLogService) CreateManyLogs(ctx context.Context, logs []*domain.AccessLog) error {
	for _, log := range logs {
		log.SetDefaults()
		err := log.Validate()

		if err != nil {
			return err
		}
	}

	return a.logRepo.CreateMany(ctx, logs)
}

// GetLogDetails implements input.AccessLogService.
func (a *accessLogService) GetLogDetails(ctx context.Context, id string) (*domain.AccessLog, error) {
	return a.logRepo.FindByID(ctx, id)
}

// GetLogs implements input.AccessLogService.
func (a *accessLogService) GetLogs(ctx context.Context, filter domain.AccessLogFilter) ([]*domain.AccessLog, error) {
	return a.logRepo.FindByFilter(ctx, filter)
}
