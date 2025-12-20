package main

import (
	"log"
	"net/http"

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
