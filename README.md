# API Logs Service

A hexagonal architecture-based API logging service built with Go, Gin, and MongoDB. Store and analyze API request/response logs with support for multiple environments (dev/production).

## Features

- ✅ **Hexagonal Architecture** - Clean separation of concerns, easily swappable database
- ✅ **MongoDB Storage** - 3 collections for optimal performance (logs, headers, bodies)
- ✅ **Environment Support** - Separate dev and production environments
- ✅ **API Key Authentication** - Secure project-based authentication
- ✅ **Flexible Storage** - Store headers and bodies on-demand
- ✅ **Auto TTL** - Automatic cleanup (30 days for logs, 14 days for bodies)
- ✅ **Analytics** - Built-in stats (status codes, response times, etc.)
- ✅ **RESTful API** - Gin-based HTTP handlers

## Architecture

```
cmd/api/                        # Application entry point
internal/
  ├── domain/                   # Business entities and logic
  ├── ports/
  │   ├── input/               # Service interfaces (use cases)
  │   └── output/              # Repository interfaces
  └── adapters/
      ├── primary/             # Input adapters
      │   ├── http/           # Gin HTTP handlers
      │   └── service/        # Service implementations
      └── secondary/           # Output adapters
          └── repository/
              └── mongodb/     # MongoDB implementation
pkg/
  ├── config/                  # Configuration management
  └── logger/                  # Logging utilities
```

## Quick Start

### Prerequisites

- Go 1.21 or higher
- MongoDB 5.0 or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/spidey52/api-logs.git
cd api-logs
```

2. Install dependencies:

```bash
go mod download
```

3. Copy environment file:

```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=api_logs_db
PORT=8080
```

5. Run the service:

```bash
go run cmd/api/main.go
```

The service will start on `http://localhost:8080`

## API Endpoints

### Health Check

```bash
GET /health
```

### Projects (Management)

#### Create Project

```bash
POST /api/v1/projects
Content-Type: application/json

{
  "name": "My API Project",
  "description": "Production API",
  "environment": "production"
}

Response:
{
  "data": {
    "id": "...",
    "api_key": "apilog_abc123...",
    "name": "My API Project",
    "environment": "production",
    "is_active": true
  }
}
```

#### List Projects

```bash
GET /api/v1/projects
```

#### Get Project

```bash
GET /api/v1/projects/:id
```

#### Update Project

```bash
PUT /api/v1/projects/:id
```

#### Delete Project

```bash
DELETE /api/v1/projects/:id
```

#### Regenerate API Key

```bash
POST /api/v1/projects/:id/regenerate-key
```

### API Logs (Requires API Key)

#### Create Log

```bash
POST /api/v1/logs
X-API-Key: apilog_abc123...
X-Environment: production
Content-Type: application/json

{
  "method": "POST",
  "path": "/api/users",
  "status_code": 201,
  "response_time_ms": 145,
  "request_headers": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0"
  },
  "request_body": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "response_body": {
    "id": "user-123",
    "created": true
  }
}
```

#### List Logs

```bash
GET /api/v1/logs
X-API-Key: apilog_abc123...
X-Environment: production
```

#### Get Log Details

```bash
GET /api/v1/logs/:id/details
X-API-Key: apilog_abc123...
X-Environment: production
```

#### Get Log Headers

```bash
GET /api/v1/logs/:id/headers
X-API-Key: apilog_abc123...
X-Environment: production
```

#### Get Log Body

```bash
GET /api/v1/logs/:id/body
X-API-Key: apilog_abc123...
X-Environment: production
```

#### Get Stats

```bash
GET /api/v1/logs/stats
X-API-Key: apilog_abc123...
X-Environment: production

Response:
{
  "data": {
    "total_logs": 15234,
    "average_response_time_ms": 234.5,
    "status_code_distribution": {
      "200": 12000,
      "201": 2000,
      "400": 500,
      "500": 734
    }
  }
}
```

## MongoDB Collections

### projects

- Stores project metadata and API keys
- TTL: None (permanent)

### api_logs

- Stores core log data (method, path, status, response time)
- TTL: 30 days

### api_log_headers

- Stores request/response headers
- TTL: 30 days

### api_log_bodies

- Stores request/response bodies
- TTL: 14 days (configurable)

## Environment Variables

| Variable           | Description                              | Default                     |
| ------------------ | ---------------------------------------- | --------------------------- |
| `APP_ENV`          | Application environment                  | `development`               |
| `LOG_LEVEL`        | Logging level (debug, info, warn, error) | `info`                      |
| `PORT`             | Server port                              | `8080`                      |
| `HOST`             | Server host                              | `0.0.0.0`                   |
| `MONGODB_URI`      | MongoDB connection string                | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | MongoDB database name                    | `api_logs_db`               |

## Development

### Build

```bash
go build -o bin/api cmd/api/main.go
```

### Run

```bash
./bin/api
```

### Test

```bash
go test ./...
```

## Swapping Database

Thanks to hexagonal architecture, swapping MongoDB for PostgreSQL is simple:

1. Create new repository implementation in `internal/adapters/secondary/repository/postgres/`
2. Implement the same interfaces from `internal/ports/output/`
3. Update `cmd/api/main.go` to use PostgreSQL repositories
4. Done! No changes needed to domain or service layers

## License

MIT

## Author

[@spidey52](https://github.com/spidey52)
