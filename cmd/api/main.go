package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	httpHandler "github.com/spidey52/api-logs/internal/adapters/primary/http"
	"github.com/spidey52/api-logs/internal/adapters/primary/service"
	"github.com/spidey52/api-logs/internal/adapters/secondary/repository/mongodb"
	"github.com/spidey52/api-logs/pkg/config"
	"github.com/spidey52/api-logs/pkg/logger"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	if err := logger.Init(cfg.App.LogLevel); err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}

	logger.Info("Starting API Logs service",
		"environment", cfg.App.Environment,
		"port", cfg.Server.Port,
	)

	// Create context for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	logger.Info("Connecting to MongoDB...", "uri", cfg.MongoDB.URI)

	// Initialize MongoDB client
	mongoClient, err := mongodb.NewClient(ctx, cfg.MongoDB.URI, cfg.MongoDB.Database)
	if err != nil {
		logger.Fatal("Failed to connect to MongoDB", "error", err)
	}
	defer func() {
		if err := mongoClient.Close(context.Background()); err != nil {
			logger.Error("Failed to close MongoDB connection", "error", err)
		}
	}()

	logger.Info("Connected to MongoDB successfully")

	// Create indexes
	if err := mongoClient.CreateIndexes(ctx); err != nil {
		logger.Fatal("Failed to create MongoDB indexes", "error", err)
	}
	logger.Info("MongoDB indexes created successfully")

	// Initialize repositories
	projectRepo := mongodb.NewProjectRepository(mongoClient)
	logRepo := mongodb.NewAPILogRepository(mongoClient)
	headersRepo := mongodb.NewHeadersRepository(mongoClient)
	bodyRepo := mongodb.NewBodyRepository(mongoClient)
	userRepo := mongodb.NewUserRepository(mongoClient)

	// Initialize services
	projectService := service.NewProjectService(projectRepo)
	logService := service.NewAPILogService(logRepo, headersRepo, bodyRepo)
	userService := service.NewUserService(userRepo)

	// Initialize HTTP handlers
	projectHandler := httpHandler.NewProjectHandler(projectService)
	apiLogHandler := httpHandler.NewAPILogHandler(logService, projectService, userService)
	userHandler := httpHandler.NewUserHandler(userService)

	// Setup Gin router
	if cfg.App.IsProductionMode() {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(gin.Logger())
	router.Use(corsMiddleware())

	// Setup routes
	httpHandler.SetupRoutes(router, projectHandler, apiLogHandler, userHandler)

	// Create HTTP server
	srv := &http.Server{
		Addr:         cfg.Server.Host + ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Server starting", "address", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", "error", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal("Server forced to shutdown", "error", err)
	}

	logger.Info("Server exited successfully")
}

// ginLogger is a custom Gin middleware for logging using zap
func ginLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()

		logger.Info("Request",
			"method", c.Request.Method,
			"path", path,
			"query", query,
			"status", statusCode,
			"latency", latency,
			"ip", c.ClientIP(),
			"user_agent", c.Request.UserAgent(),
		)
	}
}

// corsMiddleware adds CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-API-Key, X-Environment")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
