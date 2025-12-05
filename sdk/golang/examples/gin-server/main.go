package main

import (
	"time"

	"github.com/gin-gonic/gin"
	apilog "github.com/spidey52/api-logs/sdk/golang"
)

func main() {
	r := gin.Default()

	// Initialize the exporter
	exporter := apilog.NewExporter(apilog.ExporterConfig{
		APIKey:        "your-api-key-here",
		Environment:   apilog.EnvDev,
		BaseURL:       "http://localhost:8080",
		BatchSize:     50,
		FlushInterval: 10 * time.Second,
		CreateUsers:   true,
	})
	defer exporter.Shutdown()

	// Add logging middleware
	r.Use(apilog.GinMiddleware(exporter, apilog.GinMiddlewareOptions{
		GetUserInfo: func(c *gin.Context) apilog.UserInfo {
			// Extract user info from headers (in production, use JWT/session)
			return apilog.UserInfo{
				UserIdentifier: c.GetHeader("X-User-Email"),
				UserName:       c.GetHeader("X-User-Name"),
				UserID:         c.GetHeader("X-User-ID"),
			}
		},
		CaptureRequestBody:  true,
		CaptureResponseBody: true,
		CaptureHeaders:      true,
	}))

	// Routes
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello from Gin with API Logging!",
		})
	})

	r.GET("/users", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"users": []gin.H{
				{"id": "1", "name": "John Doe", "email": "john@example.com"},
				{"id": "2", "name": "Jane Smith", "email": "jane@example.com"},
			},
		})
	})

	r.GET("/users/:id", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"id":    c.Param("id"),
			"name":  "John Doe",
			"email": "john@example.com",
		})
	})

	r.POST("/users", func(c *gin.Context) {
		var user map[string]interface{}
		if err := c.BindJSON(&user); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}
		user["id"] = "123"
		c.JSON(201, user)
	})

	r.PUT("/users/:id", func(c *gin.Context) {
		var user map[string]interface{}
		if err := c.BindJSON(&user); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}
		user["id"] = c.Param("id")
		c.JSON(200, user)
	})

	r.DELETE("/users/:id", func(c *gin.Context) {
		c.JSON(204, nil)
	})

	r.GET("/error", func(c *gin.Context) {
		c.JSON(500, gin.H{"error": "Something went wrong!"})
	})

	println("Gin server with API logging running on http://localhost:3000")
	println("Try these endpoints:")
	println("  GET  http://localhost:3000/")
	println("  GET  http://localhost:3000/users")
	println("  POST http://localhost:3000/users")
	println("\nAdd these headers to test user auto-creation:")
	println(`  -H "X-User-Email: test@example.com"`)
	println(`  -H "X-User-Name: Test User"`)

	r.Run(":3000")
}
