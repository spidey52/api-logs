.PHONY: help build run dev test clean install docker-up docker-down docker-logs migrate lint fmt vet tidy docs-bundle docs-lint docs-preview

# Variables
BINARY_NAME=api
BINARY_PATH=bin/$(BINARY_NAME)
MAIN_PATH=cmd/api/main.go
GO=go
GOFLAGS=-v
DOCKER_COMPOSE=docker-compose

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Build targets
build: ## Build the application binary
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p bin
	$(GO) build $(GOFLAGS) -o $(BINARY_PATH) $(MAIN_PATH)
	@echo "Binary created at $(BINARY_PATH)"

build-linux: ## Build for Linux (useful for Docker)
	@echo "Building $(BINARY_NAME) for Linux..."
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 $(GO) build $(GOFLAGS) -o $(BINARY_PATH)-linux $(MAIN_PATH)
	@echo "Linux binary created at $(BINARY_PATH)-linux"

# Run targets
run: build ## Build and run the application
	@echo "Running $(BINARY_NAME)..."
	./$(BINARY_PATH)

dev: ## Run the application with hot reload (requires 'go install github.com/cosmtrek/air@latest')
	@echo "Starting development server with hot reload..."
	@which air > /dev/null || (echo "Installing air..." && $(GO) install github.com/cosmtrek/air@latest)
	air

start: ## Run without building (assumes binary exists)
	@echo "Starting $(BINARY_NAME)..."
	./$(BINARY_PATH)

# Development targets
install: ## Download dependencies
	@echo "Downloading dependencies..."
	$(GO) mod download

tidy: ## Tidy go.mod and go.sum
	@echo "Tidying dependencies..."
	$(GO) mod tidy

fmt: ## Format Go code
	@echo "Formatting code..."
	$(GO) fmt ./...

vet: ## Run go vet
	@echo "Running go vet..."
	$(GO) vet ./...

lint: ## Run golangci-lint (requires golangci-lint installed)
	@echo "Running linter..."
	@which golangci-lint > /dev/null || (echo "golangci-lint not found. Install from https://golangci-lint.run/usage/install/" && exit 1)
	golangci-lint run ./...

# Test targets
test: ## Run all tests
	@echo "Running tests..."
	$(GO) test -v ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	$(GO) test -v -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated at coverage.html"

test-race: ## Run tests with race detector
	@echo "Running tests with race detector..."
	$(GO) test -race -v ./...

# Docker targets
docker-up: ## Start MongoDB with Docker Compose
	@echo "Starting MongoDB..."
	docker run -d -p 27017:27017 --name api-logs-mongodb mongo:latest || docker start api-logs-mongodb
	@echo "MongoDB started at localhost:27017"

docker-down: ## Stop MongoDB Docker container
	@echo "Stopping MongoDB..."
	docker stop api-logs-mongodb || true
	@echo "MongoDB stopped"

docker-rm: ## Remove MongoDB Docker container
	@echo "Removing MongoDB container..."
	docker stop api-logs-mongodb || true
	docker rm api-logs-mongodb || true
	@echo "MongoDB container removed"

docker-logs: ## Show MongoDB logs
	docker logs -f api-logs-mongodb

docker-shell: ## Open MongoDB shell
	docker exec -it api-logs-mongodb mongosh

# MongoDB targets
migrate: ## Run MongoDB migrations
	@echo "Running MongoDB migrations..."
	@which mongosh > /dev/null || (echo "mongosh not found. Install from https://www.mongodb.com/docs/mongodb-shell/install/" && exit 1)
	mongosh mongodb://localhost:27017/api_logs_db < migrations/mongodb_setup.js
	@echo "Migrations completed"

# Cleanup targets
clean: ## Remove binary and build artifacts
	@echo "Cleaning..."
	rm -f $(BINARY_PATH)
	rm -f $(BINARY_PATH)-linux
	rm -f coverage.out coverage.html
	rm -rf bin/
	@echo "Cleanup complete"

clean-all: clean docker-rm ## Remove everything including Docker containers
	@echo "Full cleanup complete"

# Environment setup
setup: install docker-up ## Initial setup: install dependencies and start MongoDB
	@echo "Copying .env.example to .env..."
	@if [ ! -f .env ]; then cp .env.example .env; echo ".env created - please configure it"; else echo ".env already exists"; fi
	@echo "Setup complete! Edit .env and run 'make run'"

# Quick commands
all: clean install build ## Clean, install dependencies, and build
	@echo "Build complete!"

check: fmt vet lint test ## Run all checks (format, vet, lint, test)
	@echo "All checks passed!"

deploy: check build ## Run checks and build for deployment
	@echo "Ready for deployment!"

# Monitor and debug
ps: ## Show running processes
	@echo "Checking if $(BINARY_NAME) is running..."
	@ps aux | grep $(BINARY_PATH) | grep -v grep || echo "Not running"

logs: ## Tail application logs (if using file logging)
	@echo "Tailing logs..."
	tail -f logs/app.log

# Info targets
version: ## Show Go version and environment info
	@$(GO) version
	@$(GO) env

deps: ## List all dependencies
	@echo "Direct dependencies:"
	@$(GO) list -m all | grep -v "^github.com/spidey52/api-logs"

# Documentation targets
docs-bundle: ## Bundle split OpenAPI files into single spec
	@echo "Bundling OpenAPI specification..."
	npm run bundle
	@echo "✅ OpenAPI spec bundled to openapi.yaml"

docs-lint: ## Lint OpenAPI specification
	@echo "Linting OpenAPI specification..."
	npm run lint

docs-preview: ## Preview OpenAPI docs locally
	@echo "Starting Redocly preview server..."
	@echo "Open http://localhost:8080 in your browser"
	npm run preview
