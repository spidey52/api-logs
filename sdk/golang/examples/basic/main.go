package main

import (
	"fmt"
	"time"

	apilog "github.com/spidey52/api-logs/sdk/golang"
)

func main() {
	// Initialize the exporter
	exporter := apilog.NewExporter(apilog.ExporterConfig{
		APIKey:        "your-api-key-here",
		Environment:   apilog.EnvDev,
		BaseURL:       "http://localhost:8080",
		BatchSize:     10,
		FlushInterval: 5 * time.Second,
		CreateUsers:   true,
	})
	defer exporter.Shutdown()

	fmt.Println("Logging API requests...")

	// Example 1: Simple GET request
	exporter.Log(apilog.APILogEntry{
		Method:         apilog.MethodGET,
		Path:           "/api/users",
		StatusCode:     200,
		ResponseTimeMs: 45,
		IPAddress:      "192.168.1.1",
		UserAgent:      "Mozilla/5.0",
	})

	// Example 2: POST with user auto-creation
	exporter.Log(apilog.APILogEntry{
		Method:         apilog.MethodPOST,
		Path:           "/api/orders",
		StatusCode:     201,
		ResponseTimeMs: 120,
		IPAddress:      "192.168.1.2",
		UserAgent:      "PostmanRuntime/7.32.0",
		UserIdentifier: "john@example.com",
		UserName:       "John Doe",
	})

	// Example 3: Error case
	exporter.Log(apilog.APILogEntry{
		Method:         apilog.MethodGET,
		Path:           "/api/products/999",
		StatusCode:     404,
		ResponseTimeMs: 15,
		ErrorMessage:   "Product not found",
		UserIdentifier: "jane@example.com",
		UserName:       "Jane Smith",
	})

	// Example 4: With request/response bodies
	exporter.Log(apilog.APILogEntry{
		Method:         apilog.MethodPUT,
		Path:           "/api/users/123",
		StatusCode:     200,
		ResponseTimeMs: 85,
		UserIdentifier: "admin@example.com",
		UserName:       "Admin User",
		RequestBody: map[string]interface{}{
			"name":  "Updated Name",
			"email": "newemail@example.com",
		},
		ResponseBody: map[string]interface{}{
			"id":    "123",
			"name":  "Updated Name",
			"email": "newemail@example.com",
		},
	})

	// Example 5: Different user for auto-creation
	exporter.Log(apilog.APILogEntry{
		Method:         apilog.MethodPOST,
		Path:           "/api/comments",
		StatusCode:     201,
		ResponseTimeMs: 95,
		UserIdentifier: "newuser@example.com",
		UserName:       "New User",
	})

	fmt.Println("Logged 5 API requests. Waiting for batch to flush...")

	// Wait for batch to flush
	time.Sleep(6 * time.Second)

	fmt.Println("Done! Check your API logs dashboard.")
}
