package cache

import (
	"context"
	"time"
)

type Cache interface {
	Get(ctx context.Context, key string, dest any) (bool, error)
	Set(ctx context.Context, key string, value any, duration time.Duration) error // expirySeconds: 0 means no expiry
	Delete(ctx context.Context, key string) error

	// extra methods can be added here
	Incr(ctx context.Context, key string) (int64, error)
	IncrBy(ctx context.Context, key string, delta int64) (int64, error)
}
