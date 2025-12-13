package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(options *redis.Options) *RedisCache {
	return &RedisCache{
		client: redis.NewClient(options),
	}
}

var _ Cache = (*RedisCache)(nil)

// Delete implements Cache.
func (r *RedisCache) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// Get implements Cache.
func (r *RedisCache) Get(ctx context.Context, key string, dest any) (bool, error) {
	return false, nil
}

// Incr implements Cache.
func (r *RedisCache) Incr(ctx context.Context, key string) (int64, error) {
	val, err := r.client.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	return val, nil
}

// IncrBy implements Cache.
func (r *RedisCache) IncrBy(ctx context.Context, key string, delta int64) (int64, error) {
	val, err := r.client.IncrBy(ctx, key, delta).Result()
	if err != nil {
		return 0, err
	}
	return val, nil
}

// Set implements Cache.
func (r *RedisCache) Set(ctx context.Context, key string, value any, duration time.Duration) error {
	return r.client.Set(ctx, key, value, duration).Err()
}

func (r *RedisCache) Close() error {
	return r.client.Close()
}
