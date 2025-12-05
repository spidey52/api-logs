# Quick Start Guide

## ✅ Project Complete!

Your hexagonal architecture API logging service is ready to use!

## What's Been Created

### 📁 Project Structure

```
api-logs/
├── cmd/api/main.go              # Application entry point
├── internal/
│   ├── domain/                  # ✅ Business entities
│   ├── ports/                   # ✅ Interfaces
│   └── adapters/
│       ├── primary/             # ✅ Services & HTTP handlers (Gin)
│       └── secondary/           # ✅ MongoDB repositories (3 collections)
├── pkg/
│   ├── config/                  # ✅ Configuration
│   └── logger/                  # ✅ Structured logging
├── migrations/                  # ✅ MongoDB setup script
├── go.mod                       # ✅ Dependencies
├── .env.example                 # ✅ Environment template
└── README.md                    # ✅ Full documentation

```

## 🚀 How to Run

### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your existing MongoDB instance
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (MongoDB URI, port, etc.)
```

### 3. Run the Service

```bash
# Option 1: Run directly
go run cmd/api/main.go

# Option 2: Build and run
go build -o bin/api cmd/api/main.go
./bin/api
```

Server will start on **http://localhost:8080**

## 🧪 Test the API

### 1. Create a Project (Get API Key)

```bash
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Project",
    "description": "Testing API logs",
    "environment": "dev"
  }'

# Response includes your API key:
# {
#   "data": {
#     "id": "...",
#     "api_key": "apilog_abc123...",
#     ...
#   }
# }
```

### 2. Create a Log Entry

```bash
curl -X POST http://localhost:8080/api/v1/logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: apilog_abc123..." \
  -H "X-Environment: dev" \
  -d '{
    "method": "POST",
    "path": "/api/users",
    "status_code": 201,
    "response_time_ms": 145,
    "request_headers": {
      "content-type": "application/json"
    },
    "request_body": {
      "name": "John Doe"
    },
    "response_body": {
      "id": "user-123"
    }
  }'
```

### 3. List Logs

```bash
curl http://localhost:8080/api/v1/logs \
  -H "X-API-Key: apilog_abc123..." \
  -H "X-Environment: dev"
```

### 4. Get Statistics

```bash
curl http://localhost:8080/api/v1/logs/stats \
  -H "X-API-Key: apilog_abc123..." \
  -H "X-Environment: dev"
```

## 📊 MongoDB Collections

Your service uses 3 optimized collections:

1. **projects** - Project metadata & API keys
2. **api_logs** - Core log data (lean & fast)
3. **api_log_headers** - Request/response headers
4. **api_log_bodies** - Request/response bodies

**TTL (Auto-deletion):**

- Logs: 30 days
- Headers: 30 days
- Bodies: 14 days

## 🔧 Configuration

Edit `.env` file:

```env
# Server
PORT=8080
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=api_logs_db

# App
APP_ENV=development
LOG_LEVEL=info
```

## 📚 Full API Documentation

See `README.md` for complete API documentation including:

- All endpoints
- Request/response examples
- Error handling
- Swapping databases (PostgreSQL, etc.)

## 🎯 Key Features

✅ **Hexagonal Architecture** - Easy to swap databases  
✅ **API Key Auth** - Secure project-based authentication  
✅ **Dual Environments** - dev & production separation  
✅ **On-Demand Storage** - Store headers/bodies when needed  
✅ **Auto Cleanup** - TTL indexes handle old data  
✅ **Built-in Analytics** - Status codes, response times, etc.

## 🔄 Swapping to PostgreSQL

Thanks to hexagonal architecture:

1. Create new repo in `internal/adapters/secondary/repository/postgres/`
2. Implement the same interfaces
3. Change 1 line in `main.go`
4. Done! No other changes needed

## ⚡ Next Steps

- [ ] Add authentication for project management endpoints
- [ ] Implement rate limiting
- [ ] Add Elasticsearch for advanced search
- [ ] Create dashboard for analytics
- [ ] Add more filters (date ranges, etc.)
- [ ] Implement batch log insertion

---

**Enjoy your new API logging service!** 🎉
