package app

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/spidey52/api-logs/internal/adapters/secondary/repository/mongodb"
	"github.com/spidey52/api-logs/pkg/cache"
	"github.com/spidey52/api-logs/pkg/config"
	"github.com/spidey52/api-logs/pkg/logger"
)

type Infrastructure struct {
	Mongo *mongodb.Client
	Cache cache.Cache
}

func newInfrastructure(cfg *config.Config) (*Infrastructure, func(context.Context) error, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongo, err := mongodb.NewClient(ctx, cfg.MongoDB.URI, cfg.MongoDB.Database)
	if err != nil {
		return nil, nil, err
	}

	if err := mongo.CreateIndexes(ctx); err != nil {
		return nil, nil, err
	}

	cacheClient := cache.NewRedisCache(&redis.Options{
		Addr: "localhost:6379",
	})

	cleanup := func(ctx context.Context) error {
		if err := mongo.Close(ctx); err != nil {
			logger.Error("mongo close failed", "error", err)
		}
		if err := cacheClient.Close(); err != nil {
			logger.Error("redis close failed", "error", err)
		}
		return nil
	}

	return &Infrastructure{
		Mongo: mongo,
		Cache: cacheClient,
	}, cleanup, nil
}
