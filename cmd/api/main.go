package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spidey52/api-logs/internal/app"
	"github.com/spidey52/api-logs/pkg/config"
	"github.com/spidey52/api-logs/pkg/logger"
)

func main() {
	cfg := config.Load()

	if err := logger.Init(cfg.App.LogLevel); err != nil {
		log.Fatal(err)
	}

	app, cleanup, err := app.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		if err := app.Server.ListenAndServe(); err != nil &&
			err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	waitForShutdown(app.Server, cleanup)
}

func waitForShutdown(
	server *http.Server,
	cleanup func(context.Context) error,
) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(quit)

	<-quit
	logger.Info("shutdown signal received")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("http server shutdown failed", "error", err)
	}

	if err := cleanup(ctx); err != nil {
		logger.Error("cleanup failed", "error", err)
	}

	logger.Info("server exited gracefully")
}
