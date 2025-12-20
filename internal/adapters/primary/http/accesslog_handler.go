package http

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
)

// // APILogHandler handles HTTP requests for API logs
type AccessLogHandler struct {
	logService input.AccessLogService
}

func NewAccessLogHandler(logService input.AccessLogService) *AccessLogHandler {
	return &AccessLogHandler{
		logService: logService,
	}
}

type CreateAccessLogRequest struct {
	ProjectID string               `json:"project_id" binding:"required"`
	ActorID   string               `json:"actor_id" binding:"required"`
	Action    string               `json:"action" binding:"required"`
	Outcome   domain.AccessOutcome `json:"outcome" binding:"required"`

	// not required fields
	ResourceType string           `json:"resource_type"`
	ResourceID   string           `json:"resource_id"`
	ActorType    domain.ActorType `json:"actor_type"`
	Message      string           `json:"message"`
	Metadata     map[string]any   `json:"metadata"`

	// Timestamp of the log entry
	Timestamp time.Time `json:"timestamp" binding:"required"`
}

func (h *AccessLogHandler) CreateAccessLog(c *gin.Context) {
	var req CreateAccessLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	log := &domain.AccessLog{
		ProjectID:    req.ProjectID,
		ActorID:      req.ActorID,
		Action:       req.Action,
		Outcome:      req.Outcome,
		ResourceType: req.ResourceType,
		ResourceID:   req.ResourceID,
		ActorType:    req.ActorType,
		Message:      req.Message,
		Metadata:     req.Metadata,
		Timestamp:    req.Timestamp,
	}

	if err := h.logService.CreateLog(c.Request.Context(), log); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create access log", "details": err.Error()})
		return
	}

	c.JSON(201, gin.H{"data": gin.H{
		"id":        log.ID,
		"timestamp": log.Timestamp,
	}})

}

func (h *AccessLogHandler) CreateManyAccessLogs(c *gin.Context) {
	var reqs []CreateAccessLogRequest
	if err := c.ShouldBindJSON(&reqs); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	logs := make([]*domain.AccessLog, len(reqs))
	for i, req := range reqs {
		logs[i] = &domain.AccessLog{
			ProjectID:    req.ProjectID,
			ActorID:      req.ActorID,
			Action:       req.Action,
			Outcome:      req.Outcome,
			ResourceType: req.ResourceType,
			ResourceID:   req.ResourceID,
			ActorType:    req.ActorType,
			Message:      req.Message,
			Metadata:     req.Metadata,
			Timestamp:    req.Timestamp,
		}
	}

	if err := h.logService.CreateManyLogs(c.Request.Context(), logs); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create access logs", "details": err.Error()})
		return
	}

	c.JSON(201, gin.H{"data": "Access logs created successfully"})
}

func (h *AccessLogHandler) GetAccessLogDetails(c *gin.Context) {
	id := c.Param("id")
	log, err := h.logService.GetLogDetails(c.Request.Context(), id)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to retrieve access log", "details": err.Error()})
		return
	}
	if log == nil {
		c.JSON(404, gin.H{"error": "Access log not found"})
		return
	}

	c.JSON(200, gin.H{"data": log})
}

func (h *AccessLogHandler) GetAccessLogs(c *gin.Context) {
	var filter domain.AccessLogFilter
	var ctx = c.Request.Context()

	// bind query parameters to filter
	if err := c.BindQuery(&filter); err != nil {
		c.JSON(400, gin.H{"error": "Invalid query parameters", "details": err.Error()})
		return
	}

	logs, err := h.logService.GetLogs(ctx, filter)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to retrieve access logs", "details": err.Error()})
		return
	}

	count, err := h.logService.CountLogs(ctx, filter)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to count access logs", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data":  logs,
		"total": count,
	})
}
