package http

import (
	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all HTTP routes
func SetupRoutes(
	router *gin.Engine,
	projectHandler *ProjectHandler,
	apiLogHandler *APILogHandler,
	userHandler *UserHandler,
) {
	// API Documentation (Scalar UI)
	docsHandler := NewDocsHandler()
	router.GET("/docs", docsHandler.ServeDocs)
	// router.Static("/openapi.yaml", "./openapi.yaml")
	// router.StaticFile("/openapi.yaml", "./openapi.yaml")
	router.GET("/openapi.yaml", func(c *gin.Context) {
		c.File("./openapi.yaml")

	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Project routes (admin/management - no auth required for now)
		projects := v1.Group("/projects")
		{
			projects.POST("", projectHandler.CreateProject)
			projects.GET("", projectHandler.ListProjects)
			projects.GET("/:id", projectHandler.GetProject)
			projects.PUT("/:id", projectHandler.UpdateProject)
			projects.DELETE("/:id", projectHandler.DeleteProject)
			projects.POST("/:id/regenerate-key", projectHandler.RegenerateAPIKey)
		}

		// User routes (admin/management - no auth required for now)
		users := v1.Group("/users")
		{
			users.POST("", userHandler.CreateUser)
			users.GET("", userHandler.ListUsers)
			users.GET("/by-identifier", userHandler.GetUserByIdentifier)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
		}

		// Log routes (requires API key authentication)
		logs := v1.Group("/logs")
		logs.Use(apiLogHandler.AuthMiddleware())
		{
			logs.POST("", apiLogHandler.CreateLog)
			logs.POST("/batch", apiLogHandler.CreateBatchLogs)
			logs.GET("", apiLogHandler.ListLogs)
			logs.GET("/stats", apiLogHandler.GetStats)
			logs.GET("/:id", apiLogHandler.GetLog)
			logs.GET("/:id/details", apiLogHandler.GetLogWithDetails)
			logs.GET("/:id/headers", apiLogHandler.GetLogHeaders)
			logs.GET("/:id/body", apiLogHandler.GetLogBody)
		}
	}
}
