package apilog

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

type Environment string

const (
	EnvDev        Environment = "dev"
	EnvStaging    Environment = "staging"
	EnvProduction Environment = "production"
)

type HTTPMethod string

const (
	MethodGET     HTTPMethod = "GET"
	MethodPOST    HTTPMethod = "POST"
	MethodPUT     HTTPMethod = "PUT"
	MethodPATCH   HTTPMethod = "PATCH"
	MethodDELETE  HTTPMethod = "DELETE"
	MethodHEAD    HTTPMethod = "HEAD"
	MethodOPTIONS HTTPMethod = "OPTIONS"
)

type APILogEntry struct {
	Method          HTTPMethod             `json:"method"`
	Path            string                 `json:"path"`
	StatusCode      int                    `json:"status_code"`
	ResponseTimeMs  int64                  `json:"response_time_ms"`
	IPAddress       string                 `json:"ip_address,omitempty"`
	UserAgent       string                 `json:"user_agent,omitempty"`
	UserID          string                 `json:"user_id,omitempty"`
	UserName        string                 `json:"user_name,omitempty"`
	UserIdentifier  string                 `json:"user_identifier,omitempty"`
	RequestHeaders  map[string]interface{} `json:"request_headers,omitempty"`
	ResponseHeaders map[string]interface{} `json:"response_headers,omitempty"`
	RequestBody     map[string]interface{} `json:"request_body,omitempty"`
	ResponseBody    map[string]interface{} `json:"response_body,omitempty"`
	ErrorMessage    string                 `json:"error_message,omitempty"`
}

type ExporterConfig struct {
	APIKey        string
	Environment   Environment
	BaseURL       string
	BatchSize     int
	FlushInterval time.Duration
	Enabled       bool
	MaxRetries    int
	RetryDelay    time.Duration
	CreateUsers   bool
}

type BatchRequest struct {
	Logs        []APILogEntry `json:"logs"`
	CreateUsers bool          `json:"create_users"`
}

type BatchResponse struct {
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	Total        int      `json:"total"`
	Errors       []string `json:"errors,omitempty"`
}

type Exporter struct {
	config     ExporterConfig
	logQueue   []APILogEntry
	mu         sync.Mutex
	ticker     *time.Ticker
	done       chan bool
	httpClient *http.Client
	retryCount int
}

func NewExporter(config ExporterConfig) *Exporter {
	// Set defaults
	if config.Environment == "" {
		config.Environment = EnvProduction
	}
	if config.BaseURL == "" {
		config.BaseURL = "https://api-logs.yourdomain.com"
	}
	if config.BatchSize <= 0 {
		config.BatchSize = 100
	}
	if config.FlushInterval <= 0 {
		config.FlushInterval = 10 * time.Second
	}
	if !config.Enabled {
		config.Enabled = true
	}
	if config.MaxRetries <= 0 {
		config.MaxRetries = 3
	}
	if config.RetryDelay <= 0 {
		config.RetryDelay = 1 * time.Second
	}

	exporter := &Exporter{
		config:     config,
		logQueue:   make([]APILogEntry, 0, config.BatchSize),
		done:       make(chan bool),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}

	// Start auto-flush ticker
	exporter.ticker = time.NewTicker(config.FlushInterval)
	go exporter.autoFlush()

	return exporter
}

func (e *Exporter) Log(entry APILogEntry) error {
	if !e.config.Enabled {
		return nil
	}

	e.mu.Lock()
	defer e.mu.Unlock()

	e.logQueue = append(e.logQueue, entry)

	// Auto-flush if batch size reached
	if len(e.logQueue) >= e.config.BatchSize {
		go e.Flush()
	}

	return nil
}

func (e *Exporter) Flush() (*BatchResponse, error) {
	if !e.config.Enabled {
		return nil, nil
	}

	e.mu.Lock()
	if len(e.logQueue) == 0 {
		e.mu.Unlock()
		return nil, nil
	}

	// Take all queued logs
	logs := make([]APILogEntry, len(e.logQueue))
	copy(logs, e.logQueue)
	e.logQueue = e.logQueue[:0]
	e.mu.Unlock()

	return e.sendBatch(logs)
}

func (e *Exporter) sendBatch(logs []APILogEntry) (*BatchResponse, error) {
	batchReq := BatchRequest{
		Logs:        logs,
		CreateUsers: e.config.CreateUsers,
	}

	body, err := json.Marshal(batchReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal batch: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/logs/batch", e.config.BaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", e.config.APIKey)
	req.Header.Set("X-Environment", string(e.config.Environment))

	resp, err := e.httpClient.Do(req)
	if err != nil {
		// Retry logic
		if e.retryCount < e.config.MaxRetries {
			e.retryCount++
			delay := e.config.RetryDelay * time.Duration(1<<uint(e.retryCount-1))
			time.Sleep(delay)
			return e.sendBatch(logs)
		}
		return nil, fmt.Errorf("failed to send batch after %d retries: %w", e.config.MaxRetries, err)
	}
	defer resp.Body.Close()

	// Reset retry count on success
	e.retryCount = 0

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("batch request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var batchResp BatchResponse
	if err := json.Unmarshal(respBody, &batchResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &batchResp, nil
}

func (e *Exporter) autoFlush() {
	for {
		select {
		case <-e.ticker.C:
			e.Flush()
		case <-e.done:
			return
		}
	}
}

func (e *Exporter) Shutdown() error {
	e.ticker.Stop()
	e.done <- true

	// Final flush
	_, err := e.Flush()
	return err
}
