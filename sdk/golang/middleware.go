package apilog

import (
	"bytes"
	"encoding/json"
	"io"
	"time"

	"github.com/gin-gonic/gin"
)

type UserInfo struct {
	UserID         string
	UserName       string
	UserIdentifier string
}

type GinMiddlewareOptions struct {
	GetUserInfo         func(*gin.Context) UserInfo
	CaptureRequestBody  bool
	CaptureResponseBody bool
	CaptureHeaders      bool
}

type bodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func GinMiddleware(exporter *Exporter, options GinMiddlewareOptions) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Capture request body if needed
		var requestBody map[string]interface{}
		if options.CaptureRequestBody && c.Request.Body != nil {
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err == nil {
				c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
				if c.ContentType() == "application/json" {
					json.Unmarshal(bodyBytes, &requestBody)
				}
			}
		}

		// Capture request headers if needed
		var requestHeaders map[string]interface{}
		if options.CaptureHeaders {
			requestHeaders = make(map[string]interface{})
			for key, values := range c.Request.Header {
				if len(values) == 1 {
					requestHeaders[key] = values[0]
				} else {
					requestHeaders[key] = values
				}
			}
		}

		// Wrap response writer to capture response body
		var writer *bodyWriter
		if options.CaptureResponseBody {
			writer = &bodyWriter{
				ResponseWriter: c.Writer,
				body:           bytes.NewBufferString(""),
			}
			c.Writer = writer
		}

		// Process request
		c.Next()

		// Calculate response time
		responseTime := time.Since(startTime).Milliseconds()

		// Capture response body if needed
		var responseBody map[string]interface{}
		if options.CaptureResponseBody && writer != nil {
			if c.ContentType() == "application/json" {
				json.Unmarshal(writer.body.Bytes(), &responseBody)
			}
		}

		// Capture response headers if needed
		var responseHeaders map[string]interface{}
		if options.CaptureHeaders {
			responseHeaders = make(map[string]interface{})
			for key, values := range c.Writer.Header() {
				if len(values) == 1 {
					responseHeaders[key] = values[0]
				} else {
					responseHeaders[key] = values
				}
			}
		}

		// Get user info
		var userInfo UserInfo
		if options.GetUserInfo != nil {
			userInfo = options.GetUserInfo(c)
		}

		// Get error message if any
		errorMessage := ""
		if len(c.Errors) > 0 {
			errorMessage = c.Errors.String()
		}

		// Create log entry
		logEntry := APILogEntry{
			Method:          HTTPMethod(c.Request.Method),
			Path:            c.Request.URL.Path,
			StatusCode:      c.Writer.Status(),
			ResponseTimeMs:  responseTime,
			IPAddress:       c.ClientIP(),
			UserAgent:       c.Request.UserAgent(),
			UserID:          userInfo.UserID,
			UserName:        userInfo.UserName,
			UserIdentifier:  userInfo.UserIdentifier,
			RequestHeaders:  requestHeaders,
			ResponseHeaders: responseHeaders,
			RequestBody:     requestBody,
			ResponseBody:    responseBody,
			ErrorMessage:    errorMessage,
		}

		// Log asynchronously
		go func() {
			if err := exporter.Log(logEntry); err != nil {
				// Log error but don't fail the request
				println("Failed to log API request:", err.Error())
			}
		}()
	}
}
