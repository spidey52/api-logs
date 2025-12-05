# API Logs SDK for Go (Gin)

Go SDK for the API logging service with built-in Gin middleware support.

## Installation

```bash
go get github.com/your-org/api-logs/sdk/golang
```

## Quick Start

### Basic Usage

```go
package main

import (
	"time"
	apilog "github.com/your-org/api-logs/sdk/golang"
)

func main() {
	// Initialize the exporter
	exporter := apilog.NewExporter(apilog.ExporterConfig{
		APIKey:      "your-api-key-here",
		Environment: "dev",
		BaseURL:     "http://localhost:8080",
		BatchSize:   10,
		FlushInterval: 5 * time.Second,
		CreateUsers: true,
	})
	defer exporter.Shutdown()

	// Log a single API call
	err := exporter.Log(apilog.APILogEntry{
		Method:         "GET",
		Path:           "/api/users",
		StatusCode:     200,
		ResponseTimeMs: 45,
		IPAddress:      "192.168.1.1",
		UserAgent:      "Mozilla/5.0",
		UserIdentifier: "user@example.com",
		UserName:       "John Doe",
	})
	if err != nil {
		panic(err)
	}

	// Wait for batch to flush
	time.Sleep(6 * time.Second)
}
```

### Gin Middleware

```go
package main

import (
	"github.com/gin-gonic/gin"
	apilog "github.com/your-org/api-logs/sdk/golang"
	"time"
)

func main() {
	r := gin.Default()

	// Initialize the exporter
	exporter := apilog.NewExporter(apilog.ExporterConfig{
		APIKey:        "your-api-key-here",
		Environment:   "production",
		BaseURL:       "https://api-logs.yourdomain.com",
		BatchSize:     50,
		FlushInterval: 10 * time.Second,
		CreateUsers:   true,
	})
	defer exporter.Shutdown()

	// Add logging middleware
	r.Use(apilog.GinMiddleware(exporter, apilog.GinMiddlewareOptions{
		GetUserInfo: func(c *gin.Context) apilog.UserInfo {
			// Extract user info from JWT, session, or headers
			userEmail := c.GetHeader("X-User-Email")
			userName := c.GetHeader("X-User-Name")
			userId := c.GetString("user_id") // from auth middleware

			return apilog.UserInfo{
				UserIdentifier: userEmail,
				UserName:       userName,
				UserID:         userId,
			}
		},
		CaptureRequestBody:  true,
		CaptureResponseBody: true,
		CaptureHeaders:      true,
	}))

	// Your routes
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello World"})
	})

	r.GET("/users/:id", func(c *gin.Context) {
		c.JSON(200, gin.H{"id": c.Param("id"), "name": "John Doe"})
	})

	r.POST("/users", func(c *gin.Context) {
		var user map[string]interface{}
		c.BindJSON(&user)
		c.JSON(201, gin.H{"id": "123", "data": user})
	})

	r.Run(":8080")
}
```

## Configuration

### ExporterConfig

| Field           | Type            | Default                             | Description                                         |
| --------------- | --------------- | ----------------------------------- | --------------------------------------------------- |
| `APIKey`        | `string`        | _required_                          | Your project API key                                |
| `Environment`   | `string`        | `"production"`                      | Environment name (`dev`, `staging`, `production`)   |
| `BaseURL`       | `string`        | `"https://api-logs.yourdomain.com"` | API base URL                                        |
| `BatchSize`     | `int`           | `100`                               | Number of logs to batch before sending              |
| `FlushInterval` | `time.Duration` | `10s`                               | Time interval to auto-flush logs                    |
| `Enabled`       | `bool`          | `true`                              | Enable/disable logging                              |
| `MaxRetries`    | `int`           | `3`                                 | Maximum retry attempts for failed requests          |
| `RetryDelay`    | `time.Duration` | `1s`                                | Initial delay between retries (exponential backoff) |
| `CreateUsers`   | `bool`          | `true`                              | Auto-create users if they don't exist               |

### GinMiddlewareOptions

| Field                 | Type                          | Default | Description                          |
| --------------------- | ----------------------------- | ------- | ------------------------------------ |
| `GetUserInfo`         | `func(*gin.Context) UserInfo` | `nil`   | Function to extract user information |
| `CaptureRequestBody`  | `bool`                        | `false` | Capture request body in logs         |
| `CaptureResponseBody` | `bool`                        | `false` | Capture response body in logs        |
| `CaptureHeaders`      | `bool`                        | `false` | Capture request/response headers     |

## User Auto-Creation

When `CreateUsers` is enabled (default), the SDK automatically creates users in your database if they don't exist when logging API calls with a `user_identifier`. This eliminates the need to manually manage users before logging their API activity.

```go
exporter.Log(apilog.APILogEntry{
	Method:         "POST",
	Path:           "/api/orders",
	StatusCode:     201,
	ResponseTimeMs: 120,
	UserIdentifier: "newuser@example.com",  // User will be auto-created
	UserName:       "New User",
})
```

## Batching

The SDK batches logs client-side for efficiency:

- Logs are queued in memory
- Batch is sent when it reaches `BatchSize` or `FlushInterval` expires
- Automatic retry with exponential backoff on failure
- Graceful shutdown ensures all logs are sent before exit

```go
exporter := apilog.NewExporter(apilog.ExporterConfig{
	APIKey:        "your-api-key",
	BatchSize:     50,                    // Send batch after 50 logs
	FlushInterval: 5 * time.Second,       // Or after 5 seconds
})
defer exporter.Shutdown()  // Flushes remaining logs
```

## Error Handling

The SDK provides detailed error information for debugging:

```go
err := exporter.Log(entry)
if err != nil {
	log.Printf("Failed to queue log: %v", err)
}

// Check batch response
response, err := exporter.Flush()
if err != nil {
	log.Printf("Batch send failed: %v", err)
}
if response.FailedCount > 0 {
	log.Printf("Some logs failed: %v", response.Errors)
}
```

## Best Practices

1. **Initialize Once**: Create a single exporter instance and reuse it
2. **Graceful Shutdown**: Always call `Shutdown()` to flush pending logs
3. **User Context**: Use middleware's `GetUserInfo` to extract user data
4. **Sensitive Data**: Avoid capturing request/response bodies with sensitive data
5. **Environment Variables**: Store API keys in environment variables
6. **Error Logging**: Log exporter errors for debugging but don't block your app

## Example with Authentication

```go
r.Use(apilog.GinMiddleware(exporter, apilog.GinMiddlewareOptions{
	GetUserInfo: func(c *gin.Context) apilog.UserInfo {
		// Get user from JWT claims (set by auth middleware)
		if claims, exists := c.Get("claims"); exists {
			userClaims := claims.(*JWTClaims)
			return apilog.UserInfo{
				UserID:         userClaims.UserID,
				UserIdentifier: userClaims.Email,
				UserName:       userClaims.Name,
			}
		}
		return apilog.UserInfo{}
	},
	CaptureHeaders: true,
}))
```

## License

MIT
