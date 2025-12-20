package domain

import (
	"errors"
	"time"
)

// HTTPMethod represents HTTP request methods
type HTTPMethod string

const (
	MethodGET     HTTPMethod = "GET"
	MethodPOST    HTTPMethod = "POST"
	MethodPUT     HTTPMethod = "PUT"
	MethodPATCH   HTTPMethod = "PATCH"
	MethodDELETE  HTTPMethod = "DELETE"
	MethodOPTIONS HTTPMethod = "OPTIONS"
	MethodHEAD    HTTPMethod = "HEAD"
)

// String returns the string representation of the HTTP method
func (m HTTPMethod) String() string {
	return string(m)
}

// APILog represents the core API request log entry (lean table)
type APILog struct {
	ID            string            `json:"id"`
	ProjectID     string            `json:"project_id"`
	Environment   Environment       `json:"environment"`
	Method        HTTPMethod        `json:"method"`
	Path          string            `json:"path"`
	Params        map[string]string `json:"params"`       // Path parameters
	QueryParams   map[string]string `json:"query_params"` // URL query parameters
	StatusCode    int               `json:"status_code"`
	ResponseTime  int64             `json:"response_time_ms"` // in milliseconds
	ContentLength int64             `json:"content_length"`
	IPAddress     string            `json:"ip_address"`
	UserAgent     string            `json:"user_agent"`
	ErrorMessage  string            `json:"error_message,omitempty"`
	UserID        *string           `json:"user_id,omitempty"` // Optional reference to User
	Timestamp     time.Time         `json:"timestamp"`

	User *User `json:"user,omitempty"` // Optional embedded user details
}

// Validate validates the API log entry
func (a *APILog) Validate() error {
	if a.ProjectID == "" {
		return errors.New("project_id is required")
	}
	if a.Method == "" {
		return errors.New("method is required")
	}
	if a.Path == "" {
		return errors.New("path is required")
	}
	if a.StatusCode < 100 || a.StatusCode > 599 {
		return errors.New("invalid status code")
	}
	if err := a.Environment.Validate(); err != nil {
		return err
	}
	return nil
}

// APILogHeaders represents headers stored separately
type APILogHeaders struct {
	ID              string         `json:"id"`
	LogID           string         `json:"log_id"`
	RequestHeaders  map[string]any `json:"request_headers"`
	ResponseHeaders map[string]any `json:"response_headers"`
	CreatedAt       time.Time      `json:"created_at"`
}

// Validate validates the headers
func (h *APILogHeaders) Validate() error {
	if h.LogID == "" {
		return errors.New("log_id is required")
	}
	return nil
}

// APILogBody represents request/response bodies stored separately
type APILogBody struct {
	ID           string    `json:"id"`
	LogID        string    `json:"log_id"`
	RequestBody  any       `json:"request_body,omitempty"`
	ResponseBody any       `json:"response_body,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// Validate validates the body
func (b *APILogBody) Validate() error {
	if b.LogID == "" {
		return errors.New("log_id is required")
	}
	return nil
}
