package app

import (
	"context"
	"net/http"

	"github.com/spidey52/api-logs/pkg/config"
)

type App struct {
	Server *http.Server
}

func New(cfg *config.Config) (*App, func(context.Context) error, error) {
	// init infra
	infra, infraCleanup, err := newInfrastructure(cfg)
	if err != nil {
		return nil, nil, err
	}

	// init http server
	server := newHTTPServer(cfg, infra)

	cleanup := func(ctx context.Context) error {
		return infraCleanup(ctx)
	}

	return &App{Server: server}, cleanup, nil
}
