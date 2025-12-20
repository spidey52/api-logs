package http

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
	"github.com/spidey52/api-logs/pkg/logger"
)

// APILogHandler handles HTTP requests for API logs
type APILogHandler struct {
	logService     input.APILogService
	projectService input.ProjectService
	userService    input.UserService
}

// NewAPILogHandler creates a new instance of APILogHandler
func NewAPILogHandler(logService input.APILogService, projectService input.ProjectService, userService input.UserService) *APILogHandler {
	return &APILogHandler{
		logService:     logService,
		projectService: projectService,
		userService:    userService,
	}
}

// CreateLogRequest represents the request body for creating a log
type CreateLogRequest struct {
	Method          string            `json:"method" binding:"required"`
	Path            string            `json:"path" binding:"required"`
	Params          map[string]string `json:"params"`
	QueryParams     map[string]string `json:"query_params"`
	StatusCode      int               `json:"status_code" binding:"required"`
	ResponseTime    int64             `json:"response_time_ms"`
	ContentLength   int64             `json:"content_length"`
	IPAddress       string            `json:"ip_address"`
	UserAgent       string            `json:"user_agent"`
	ErrorMessage    string            `json:"error_message"`
	UserID          *string           `json:"user_id"`
	UserName        string            `json:"user_name"`
	UserIdentifier  string            `json:"user_identifier"`
	RequestHeaders  map[string]any    `json:"request_headers"`
	ResponseHeaders map[string]any    `json:"response_headers"`
	// RequestBody     map[string]any    `json:"request_body"`
	// ResponseBody    map[string]any    `json:"response_body"`

	RequestBody  any `json:"request_body"`
	ResponseBody any `json:"response_body"`
}

// CreateBatchLogsRequest represents the request body for batch creating logs
type CreateBatchLogsRequest struct {
	Logs        []CreateLogRequest `json:"logs" binding:"required,min=1"`
	CreateUsers bool               `json:"create_users"` // Auto-create users if not found
}

// BatchLogResponse represents the response for batch log creation
type BatchLogResponse struct {
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	Total        int      `json:"total"`
	Errors       []string `json:"errors,omitempty"`
}

// AuthMiddleware validates API key from headers
func (h *APILogHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		environment := c.GetHeader("X-Environment")

		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key is required"})
			c.Abort()
			return
		}

		if environment == "" {
			environment = "dev" // default
		}

		env := domain.Environment(environment)
		if err := env.Validate(); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
			c.Abort()
			return
		}

		project, err := h.projectService.ValidateAPIKey(c.Request.Context(), apiKey, env)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Store project info in context
		c.Set("project_id", project.ID)
		c.Set("environment", string(project.Environment))

		c.Next()
	}
}

// CreateLog handles POST /api/v1/logs
func (h *APILogHandler) CreateLog(c *gin.Context) {
	var req CreateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get project info from middleware
	projectID, _ := c.Get("project_id")
	environment, _ := c.Get("environment")

	// Create core log
	log := &domain.APILog{
		ProjectID:     projectID.(string),
		Environment:   domain.Environment(environment.(string)),
		Method:        domain.HTTPMethod(req.Method),
		Path:          req.Path,
		Params:        req.Params,
		QueryParams:   req.QueryParams,
		StatusCode:    req.StatusCode,
		ResponseTime:  req.ResponseTime,
		ContentLength: req.ContentLength,
		IPAddress:     req.IPAddress,
		UserAgent:     req.UserAgent,
		ErrorMessage:  req.ErrorMessage,
		UserID:        req.UserID,
	}

	// If IP not provided, get from request
	if log.IPAddress == "" {
		log.IPAddress = c.ClientIP()
	}

	// If UserAgent not provided, get from request
	if log.UserAgent == "" {
		log.UserAgent = c.Request.UserAgent()
	}

	// Create headers object if provided
	var headers *domain.APILogHeaders
	if len(req.RequestHeaders) > 0 || len(req.ResponseHeaders) > 0 {
		headers = &domain.APILogHeaders{
			RequestHeaders:  req.RequestHeaders,
			ResponseHeaders: req.ResponseHeaders,
		}
	}

	// Create body object if provided
	var body *domain.APILogBody
	// if len(req.RequestBody) > 0 || len(req.ResponseBody) > 0 {
	// 	body = &domain.APILogBody{
	// 		RequestBody:  req.RequestBody,
	// 		ResponseBody: req.ResponseBody,
	// 	}
	// }

	if req.RequestBody != nil || req.ResponseBody != nil {
		body = &domain.APILogBody{
			RequestBody:  req.RequestBody,
			ResponseBody: req.ResponseBody,
		}
	}

	// Create log with headers and body
	if err := h.logService.CreateLog(c.Request.Context(), log, headers, body); err != nil {
		if err == domain.ErrInvalidInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create log"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"id":        log.ID,
		"timestamp": log.Timestamp,
	}})
}

// GetLog handles GET /api/v1/logs/:id
func (h *APILogHandler) GetLog(c *gin.Context) {
	id := c.Param("id")

	log, err := h.logService.GetLog(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrLogNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve log", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": log})
}

// GetLogWithDetails handles GET /api/v1/logs/:id/details
func (h *APILogHandler) GetLogWithDetails(c *gin.Context) {
	id := c.Param("id")

	log, headers, body, err := h.logService.GetLogWithDetails(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrLogNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve log details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"log":     log,
			"headers": headers,
			"body":    body,
		},
	})
}

// GetLogHeaders handles GET /api/v1/logs/:id/headers
func (h *APILogHandler) GetLogHeaders(c *gin.Context) {
	id := c.Param("id")

	headers, err := h.logService.GetLogHeaders(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrHeadersNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Headers not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve headers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": headers})
}

// GetLogBody handles GET /api/v1/logs/:id/body
func (h *APILogHandler) GetLogBody(c *gin.Context) {
	id := c.Param("id")

	body, err := h.logService.GetLogBody(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrBodyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Body not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve body"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": body})
}

// ListLogs handles GET /api/v1/logs
func (h *APILogHandler) ListLogs(c *gin.Context) {
	// Get project info from middleware
	projectID, _ := c.Get("project_id")
	environment := c.Query("environment")

	logger.Info("Listing logs for project", projectID, "environment", environment)

	filter := domain.LogFilter{
		ProjectID:   projectID.(string),
		Environment: domain.Environment(environment),
	}

	// Parse pagination parameters
	if page := c.Query("page"); page != "" {
		if pageNum, err := strconv.Atoi(page); err == nil && pageNum > 0 {
			if limit := c.Query("limit"); limit != "" {
				if limitNum, err := strconv.Atoi(limit); err == nil && limitNum > 0 {
					filter.Offset = (pageNum - 1) * limitNum
					filter.Limit = limitNum
				}
			}
		}
	}

	// Parse filter parameters
	if method := c.Query("method"); method != "" {
		filter.Method = domain.HTTPMethod(method)
	}

	if path := c.Query("path"); path != "" {
		filter.Path = path
	}

	if search := c.Query("search"); search != "" {
		filter.Search = search
	}

	if statusCode := c.Query("statusCode"); statusCode != "" {
		// Check if it's a range (format: "min-max") or single value
		if strings.Contains(statusCode, "-") {
			parts := strings.Split(statusCode, "-")
			if len(parts) == 2 {
				if minCode, err := strconv.Atoi(strings.TrimSpace(parts[0])); err == nil {
					filter.StatusCodeMin = &minCode
				}
				if maxCode, err := strconv.Atoi(strings.TrimSpace(parts[1])); err == nil {
					filter.StatusCodeMax = &maxCode
				}
			}
		} else {
			// Single status code
			if code, err := strconv.Atoi(statusCode); err == nil {
				filter.StatusCode = &code
			}
		}
	}

	if date := c.Query("date"); date != "" {
		if parsedDate, err := time.Parse("2006-01-02", date); err == nil {
			// Set to start of day
			startOfDay := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, parsedDate.Location())
			endOfDay := startOfDay.Add(24 * time.Hour)
			filter.FromDate = &startOfDay
			filter.ToDate = &endOfDay
		}
	}

	if dateRange := c.Query("dateRange"); dateRange != "" {
		// Format: "startDate,endDate" (e.g., "2024-01-01,2024-01-31")
		dates := strings.Split(dateRange, "|")
		if len(dates) == 2 {
			if startDate, err := time.ParseInLocation("2006-01-02", strings.TrimSpace(dates[0]), time.Local); err == nil {
				filter.FromDate = &startDate
			}
			if endDate, err := time.ParseInLocation("2006-01-02", strings.TrimSpace(dates[1]), time.Local); err == nil {
				// Set to end of day
				endOfDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())
				filter.ToDate = &endOfDay
			}
		}
	}

	// Apply defaults for pagination
	filter.ApplyDefaults()

	logs, err := h.logService.ListLogs(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve logs", "details": err.Error()})
		return
	}

	// Get total count for pagination
	total, err := h.logService.CountLogs(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
	})
}

// GetStats handles GET /api/v1/logs/stats
func (h *APILogHandler) GetStats(c *gin.Context) {
	// Get project info from middleware
	projectID, _ := c.Get("project_id")
	environment, _ := c.Get("environment")

	stats, err := h.logService.GetLogStats(
		c.Request.Context(),
		projectID.(string),
		domain.Environment(environment.(string)),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// GetUniquePaths handles GET /api/v1/logs/paths
func (h *APILogHandler) GetUniquePaths(c *gin.Context) {
	// Get project info from middleware
	projectID, _ := c.Get("project_id")
	environment, _ := c.Get("environment")

	paths, err := h.logService.GetUniquePaths(
		c.Request.Context(),
		projectID.(string),
		domain.Environment(environment.(string)),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve paths"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": paths})
}

// CreateBatchLogs handles POST /api/v1/logs/batch
func (h *APILogHandler) CreateBatchLogs(c *gin.Context) {
	var req CreateBatchLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get project info from middleware
	projectID, _ := c.Get("project_id")
	environment, _ := c.Get("environment")

	successCount := 0
	failedCount := 0
	errors := []string{}

	for _, logReq := range req.Logs {
		// Handle user creation if requested
		var userID *string
		if req.CreateUsers && logReq.UserIdentifier != "" {
			// Try to get existing user
			user, err := h.userService.GetUserByIdentifier(c.Request.Context(), logReq.UserIdentifier, projectID.(string))

			switch err {
			case domain.ErrUserNotFound:
				// Create new user
				newUser := &domain.User{
					ID:         uuid.NewString(),
					Identifier: logReq.UserIdentifier,
					Name:       logReq.UserName,
					ProjectID:  projectID.(string),
				}

				if err := h.userService.CreateUser(c.Request.Context(), newUser); err == nil {
					userID = &newUser.ID
				}
				// If creation fails, continue without user ID
			case nil:
				// User found
				userID = &user.ID
			}
			// If error is something else, continue without user ID
		} else if logReq.UserID != nil {
			userID = logReq.UserID
		}

		// Create core log
		log := &domain.APILog{
			ProjectID:     projectID.(string),
			Environment:   domain.Environment(environment.(string)),
			Method:        domain.HTTPMethod(logReq.Method),
			Path:          logReq.Path,
			Params:        logReq.Params,
			QueryParams:   logReq.QueryParams,
			StatusCode:    logReq.StatusCode,
			ResponseTime:  logReq.ResponseTime,
			ContentLength: logReq.ContentLength,
			IPAddress:     logReq.IPAddress,
			UserAgent:     logReq.UserAgent,
			ErrorMessage:  logReq.ErrorMessage,
			UserID:        userID,
		}

		// If IP not provided, get from request
		if log.IPAddress == "" {
			log.IPAddress = c.ClientIP()
		}

		// If UserAgent not provided, get from request
		if log.UserAgent == "" {
			log.UserAgent = c.Request.UserAgent()
		}

		// Create headers object if provided
		var headers *domain.APILogHeaders
		if len(logReq.RequestHeaders) > 0 || len(logReq.ResponseHeaders) > 0 {
			headers = &domain.APILogHeaders{
				RequestHeaders:  logReq.RequestHeaders,
				ResponseHeaders: logReq.ResponseHeaders,
			}
		}

		// Create body object if provided
		var body *domain.APILogBody
		// if len(logReq.RequestBody) > 0 || len(logReq.ResponseBody) > 0 {
		// 	body = &domain.APILogBody{
		// 		RequestBody:  logReq.RequestBody,
		// 		ResponseBody: logReq.ResponseBody,
		// 	}
		// }
		if logReq.RequestBody != nil || logReq.ResponseBody != nil {
			body = &domain.APILogBody{
				RequestBody:  logReq.RequestBody,
				ResponseBody: logReq.ResponseBody,
			}
		}

		// Create log with headers and body
		if err := h.logService.CreateLog(c.Request.Context(), log, headers, body); err != nil {
			failedCount++
			errors = append(errors, err.Error())
		} else {
			successCount++
		}
	}

	response := BatchLogResponse{
		SuccessCount: successCount,
		FailedCount:  failedCount,
		Total:        len(req.Logs),
	}

	if len(errors) > 0 {
		response.Errors = errors
	}

	statusCode := http.StatusCreated
	if failedCount > 0 {
		if successCount == 0 {
			statusCode = http.StatusInternalServerError
		} else {
			statusCode = http.StatusPartialContent
		}
	}

	c.JSON(statusCode, gin.H{"data": response})
}
