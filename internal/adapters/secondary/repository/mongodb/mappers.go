package mongodb

import (
	"time"

	"github.com/spidey52/api-logs/internal/domain"
)

// Document types for MongoDB collections

// projectDocument represents the MongoDB document for projects
type projectDocument struct {
	ID          string    `bson:"_id"`
	Name        string    `bson:"name"`
	Description string    `bson:"description"`
	APIKey      string    `bson:"api_key"`
	Environment string    `bson:"environment"`
	IsActive    bool      `bson:"is_active"`
	CreatedAt   time.Time `bson:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at"`
}

// apiLogDocument represents the MongoDB document for API logs
type apiLogDocument struct {
	ID            string            `bson:"_id"`
	ProjectID     string            `bson:"project_id"`
	Environment   string            `bson:"environment"`
	Method        string            `bson:"method"`
	Path          string            `bson:"path"`
	Params        map[string]string `bson:"params"`
	QueryParams   map[string]string `bson:"query_params"`
	StatusCode    int               `bson:"status_code"`
	ResponseTime  int64             `bson:"response_time_ms"`
	ContentLength int64             `bson:"content_length"`
	IPAddress     string            `bson:"ip_address"`
	UserAgent     string            `bson:"user_agent"`
	ErrorMessage  string            `bson:"error_message,omitempty"`
	UserID        *string           `bson:"user_id,omitempty"`
	Timestamp     time.Time         `bson:"timestamp"`
}

// apiLogHeadersDocument represents the MongoDB document for headers
type apiLogHeadersDocument struct {
	ID              string         `bson:"_id"`
	LogID           string         `bson:"log_id"`
	RequestHeaders  map[string]any `bson:"request_headers"`
	ResponseHeaders map[string]any `bson:"response_headers"`
	CreatedAt       time.Time      `bson:"created_at"`
}

// apiLogBodyDocument represents the MongoDB document for bodies
type apiLogBodyDocument struct {
	ID           string         `bson:"_id"`
	LogID        string         `bson:"log_id"`
	RequestBody  map[string]any `bson:"request_body,omitempty"`
	ResponseBody map[string]any `bson:"response_body,omitempty"`
	CreatedAt    time.Time      `bson:"created_at"`
}

// userDocument represents the MongoDB document for users
type userDocument struct {
	ID         string         `bson:"_id"`
	Name       string         `bson:"name"`
	Identifier string         `bson:"identifier"`
	Email      string         `bson:"email,omitempty"`
	Metadata   map[string]any `bson:"metadata,omitempty"`
	CreatedAt  time.Time      `bson:"created_at"`
	UpdatedAt  time.Time      `bson:"updated_at"`
	ProjectID  string         `bson:"project_id"`
}

// Conversion functions: Domain -> Document

func projectToDocument(p *domain.Project) *projectDocument {
	return &projectDocument{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		APIKey:      p.APIKey,
		Environment: string(p.Environment),
		IsActive:    p.IsActive,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func apiLogToDocument(log *domain.APILog) *apiLogDocument {
	return &apiLogDocument{
		ID:            log.ID,
		ProjectID:     log.ProjectID,
		Environment:   string(log.Environment),
		Method:        string(log.Method),
		Path:          log.Path,
		Params:        log.Params,
		QueryParams:   log.QueryParams,
		StatusCode:    log.StatusCode,
		ResponseTime:  log.ResponseTime,
		ContentLength: log.ContentLength,
		IPAddress:     log.IPAddress,
		UserAgent:     log.UserAgent,
		ErrorMessage:  log.ErrorMessage,
		UserID:        log.UserID,
		Timestamp:     log.Timestamp,
	}
}

func headersToDocument(h *domain.APILogHeaders) *apiLogHeadersDocument {
	return &apiLogHeadersDocument{
		ID:              h.ID,
		LogID:           h.LogID,
		RequestHeaders:  h.RequestHeaders,
		ResponseHeaders: h.ResponseHeaders,
		CreatedAt:       h.CreatedAt,
	}
}

func bodyToDocument(b *domain.APILogBody) *apiLogBodyDocument {
	return &apiLogBodyDocument{
		ID:           b.ID,
		LogID:        b.LogID,
		RequestBody:  b.RequestBody,
		ResponseBody: b.ResponseBody,
		CreatedAt:    b.CreatedAt,
	}
}

func userToDocument(u *domain.User) *userDocument {
	return &userDocument{
		ID:         u.ID,
		ProjectID:  u.ProjectID,
		Name:       u.Name,
		Identifier: u.Identifier,
		Metadata:   u.Metadata,
		CreatedAt:  u.CreatedAt,
	}
}

// Conversion functions: Document -> Domain

func documentToProject(doc *projectDocument) *domain.Project {
	return &domain.Project{
		ID:          doc.ID,
		Name:        doc.Name,
		Description: doc.Description,
		APIKey:      doc.APIKey,
		Environment: domain.Environment(doc.Environment),
		IsActive:    doc.IsActive,
		CreatedAt:   doc.CreatedAt,
		UpdatedAt:   doc.UpdatedAt,
	}
}

func documentToAPILog(doc *apiLogDocument) *domain.APILog {
	return &domain.APILog{
		ID:            doc.ID,
		ProjectID:     doc.ProjectID,
		Environment:   domain.Environment(doc.Environment),
		Method:        domain.HTTPMethod(doc.Method),
		Path:          doc.Path,
		Params:        doc.Params,
		QueryParams:   doc.QueryParams,
		StatusCode:    doc.StatusCode,
		ResponseTime:  doc.ResponseTime,
		ContentLength: doc.ContentLength,
		IPAddress:     doc.IPAddress,
		UserAgent:     doc.UserAgent,
		ErrorMessage:  doc.ErrorMessage,
		UserID:        doc.UserID,
		Timestamp:     doc.Timestamp,
	}
}

func documentToHeaders(doc *apiLogHeadersDocument) *domain.APILogHeaders {
	return &domain.APILogHeaders{
		ID:              doc.ID,
		LogID:           doc.LogID,
		RequestHeaders:  doc.RequestHeaders,
		ResponseHeaders: doc.ResponseHeaders,
		CreatedAt:       doc.CreatedAt,
	}
}

func documentToBody(doc *apiLogBodyDocument) *domain.APILogBody {
	return &domain.APILogBody{
		ID:           doc.ID,
		LogID:        doc.LogID,
		RequestBody:  doc.RequestBody,
		ResponseBody: doc.ResponseBody,
		CreatedAt:    doc.CreatedAt,
	}
}

func documentToUser(doc *userDocument) *domain.User {
	return &domain.User{
		ID:         doc.ID,
		Name:       doc.Name,
		Identifier: doc.Identifier,
		Metadata:   doc.Metadata,
		CreatedAt:  doc.CreatedAt,
	}
}
