package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	MongoDB  MongoDBConfig
	App      AppConfig
	Postgres PostgresConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string
	Host string
}

// MongoDBConfig holds MongoDB configuration
type MongoDBConfig struct {
	URI      string
	Database string
}

type PostgresConfig struct {
	URI string
}

// AppConfig holds application-specific configuration
type AppConfig struct {
	Environment string
	LogLevel    string
}

func (cnf *AppConfig) IsDevMode() bool {
	return cnf.Environment == "development"
}

func (cnf *AppConfig) IsProductionMode() bool {
	return cnf.Environment == "production"
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file if it exists (ignore error if file doesn't exist)
	_ = godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Host: getEnv("HOST", "0.0.0.0"),
		},
		MongoDB: MongoDBConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "api_logs_db"),
		},
		Postgres: PostgresConfig{
			URI: getEnv("POSTGRES_URI", "postgresql://myuser:mypassword@localhost:5433/api_logs_db?sslmode=disable"),
		},
		App: AppConfig{
			Environment: getEnv("APP_ENV", "development"),
			LogLevel:    getEnv("LOG_LEVEL", "info"),
		},
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as int or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// getEnvAsBool gets an environment variable as bool or returns a default value
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}
