package app

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	httpHandler "github.com/spidey52/api-logs/internal/adapters/primary/http"
	"github.com/spidey52/api-logs/internal/adapters/primary/service"
	"github.com/spidey52/api-logs/internal/adapters/secondary/repository/mongodb"
	"github.com/spidey52/api-logs/pkg/config"
)

func newHTTPServer(cfg *config.Config, infra *Infrastructure) *http.Server {
	// repositories
	projectRepo := mongodb.NewProjectRepository(infra.Mongo)
	logRepo := mongodb.NewAPILogRepository(infra.Mongo, infra.Cache)
	headersRepo := mongodb.NewHeadersRepository(infra.Mongo)
	bodyRepo := mongodb.NewBodyRepository(infra.Mongo)
	userRepo := mongodb.NewUserRepository(infra.Mongo)
	accessLogRepo := mongodb.NewMongoAccessLogRepository(infra.Mongo)

	// services
	projectService := service.NewProjectService(projectRepo)
	logService := service.NewAPILogService(logRepo, headersRepo, bodyRepo, userRepo)
	userService := service.NewUserService(userRepo)
	accessLogService := service.NewAccessLogService(accessLogRepo)

	// handlers
	projectHandler := httpHandler.NewProjectHandler(projectService)
	apiLogHandler := httpHandler.NewAPILogHandler(logService, projectService, userService)
	userHandler := httpHandler.NewUserHandler(userService)
	accessLogHandler := httpHandler.NewAccessLogHandler(accessLogService)

	if cfg.App.IsProductionMode() {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery(), gin.Logger(), corsMiddleware())

	httpHandler.SetupRoutes(httpHandler.SetupRoutesParams{
		Router:           router,
		ProjectHandler:   projectHandler,
		APILogHandler:    apiLogHandler,
		UserHandler:      userHandler,
		AccessLogHandler: accessLogHandler,
	})

	return &http.Server{
		Addr:         cfg.Server.Host + ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
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
