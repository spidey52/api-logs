package config

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var defaultRedis = connectRedis()

func DefaultRedis() *redis.Client {
	return defaultRedis
}

func NewRedis() *redis.Client {
	return connectRedis()
}

func connectRedis() *redis.Client {
	// redisUri := "redis://localhost:6379"

	redisUri := "localhost:6379"

	if redisUri == "" {
		log.Fatal("REDIS_URI is not set")
	}

	client := redis.NewClient(&redis.Options{
		Addr:     redisUri,
		Password: "",
		DB:       0,
	})

	_, err := client.Ping(context.Background()).Result()

	if err != nil {
		log.Fatal("Error in connecting to the redis: ", err)
	}

	return client
}
