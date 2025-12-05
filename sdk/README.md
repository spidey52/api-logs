# SDK Overview

This directory contains SDKs for integrating with the API Logs service in multiple languages and frameworks.

## Available SDKs

### 1. TypeScript/JavaScript SDK (`/typescript`)

- **Frameworks**: Express, Hono
- **Package**: `@your-org/api-logs-sdk`
- **Installation**: `npm install @your-org/api-logs-sdk`
- **Features**:
  - Full TypeScript type safety
  - Express middleware for automatic logging
  - Hono middleware for automatic logging
  - Automatic batching and retry logic
  - User auto-creation support
  - Configurable flush intervals
  - Graceful shutdown handling

**Quick Start (Express):**

```typescript
import { APILogsExporter, createExpressMiddleware } from "@your-org/api-logs-sdk";

const exporter = new APILogsExporter({
 apiKey: "your-api-key",
 environment: "production",
 createUsers: true,
});

app.use(createExpressMiddleware(exporter));
```

**Quick Start (Hono):**

```typescript
import { APILogsExporter, createHonoMiddleware } from "@your-org/api-logs-sdk";

const exporter = new APILogsExporter({
 apiKey: "your-api-key",
 environment: "production",
 createUsers: true,
});

app.use("*", createHonoMiddleware({ exporter }));
```

### 2. Golang SDK (`/golang`)

- **Framework**: Gin
- **Package**: `github.com/your-org/api-logs/sdk/golang`
- **Installation**: `go get github.com/your-org/api-logs/sdk/golang`
- **Features**:
  - Native Go types and interfaces
  - Gin middleware for automatic logging
  - Concurrent-safe batching with goroutines
  - User auto-creation support
  - Configurable batch size and flush interval
  - Context-aware error handling

**Quick Start:**

```go
import (
    "github.com/gin-gonic/gin"
    apilog "github.com/your-org/api-logs/sdk/golang"
)

r := gin.Default()
exporter := apilog.NewExporter(apilog.ExporterConfig{
    APIKey:      "your-api-key",
    Environment: apilog.EnvProduction,
    CreateUsers: true,
})
defer exporter.Shutdown()

r.Use(apilog.GinMiddleware(exporter, apilog.GinMiddlewareOptions{
    GetUserInfo: func(c *gin.Context) apilog.UserInfo {
        return apilog.UserInfo{
            UserIdentifier: c.GetHeader("X-User-Email"),
        }
    },
}))
```

## Common Features

All SDKs support:

1. **Automatic Batching**
   - Logs are queued in memory
   - Sent in batches when batch size reached or interval elapsed
   - Reduces HTTP overhead significantly

2. **User Auto-Creation**
   - Pass `user_identifier` and `user_name` with logs
   - Backend automatically creates users if they don't exist
   - No need to manage users separately

3. **Retry Logic**
   - Exponential backoff on failed requests
   - Configurable max retries and delay
   - Prevents log loss on temporary network issues

4. **Graceful Shutdown**
   - Flush remaining logs before exit
   - Ensure no logs are lost
   - Clean resource cleanup

5. **Framework Middleware**
   - Automatic logging for all routes
   - Minimal configuration required
   - Capture request/response data optionally

## Publishing

### TypeScript SDK to NPM

See [typescript/PUBLISHING.md](typescript/PUBLISHING.md) for detailed instructions.

Quick steps:

```bash
cd sdk/typescript
npm login
npm version patch
npm publish --access public
```

### Golang SDK

Golang SDKs are published via Git tags:

```bash
cd sdk/golang
git tag golang/v1.0.0
git push origin golang/v1.0.0
```

Users install with:

```bash
go get github.com/your-org/api-logs/sdk/golang@v1.0.0
```

## Configuration Comparison

| Feature               | TypeScript              | Golang                      |
| --------------------- | ----------------------- | --------------------------- |
| API Key               | ✅                      | ✅                          |
| Environment           | `"dev" \| "production"` | `EnvDev \| EnvProduction`   |
| Base URL              | ✅                      | ✅                          |
| Batch Size            | ✅ (default: 10)        | ✅ (default: 100)           |
| Flush Interval        | ✅ (ms, default: 5000)  | ✅ (Duration, default: 10s) |
| Create Users          | ✅ (default: true)      | ✅ (default: true)          |
| Max Retries           | ✅ (default: 3)         | ✅ (default: 3)             |
| Retry Delay           | ✅ (ms, default: 1000)  | ✅ (Duration, default: 1s)  |
| Capture Request Body  | ✅                      | ✅                          |
| Capture Response Body | ✅                      | ✅                          |
| Capture Headers       | ✅                      | ✅                          |

## Examples

Each SDK includes comprehensive examples:

- **TypeScript**:
  - `examples/basic.ts` - Manual logging examples
  - `examples/express-app.ts` - Express server with middleware
  - `examples/hono-app.ts` - Hono server with middleware

- **Golang**:
  - `examples/basic/main.go` - Manual logging examples
  - `examples/gin-server/main.go` - Gin server with middleware

## API Compatibility

All SDKs are compatible with the API Logs service API v1:

- **Endpoint**: `POST /api/v1/logs/batch`
- **Authentication**: `X-API-Key` header
- **Environment**: `X-Environment` header
- **Request Format**:
  ```json
  {
    "logs": [...],
    "create_users": true
  }
  ```
- **Response Format**:
  ```json
  {
   "success_count": 10,
   "failed_count": 0,
   "total": 10,
   "errors": []
  }
  ```

## Best Practices

1. **Initialize Once**: Create exporter instance at startup, reuse throughout app
2. **Graceful Shutdown**: Always call `shutdown()` before exit
3. **User Context**: Extract user info from auth middleware/JWT
4. **Sensitive Data**: Avoid capturing request/response bodies with passwords/tokens
5. **Environment Variables**: Store API keys in env vars, not code
6. **Error Handling**: Log SDK errors but don't block your application
7. **Batch Size**: Tune based on traffic (low traffic = smaller batches, high traffic = larger)
8. **Testing**: Use separate API keys for dev/staging/production

## Contributing

To add a new SDK:

1. Create directory: `sdk/{language}`
2. Implement core features:
   - Exporter class with batching
   - Framework middleware (if applicable)
   - User auto-creation support
   - Retry logic with exponential backoff
   - Graceful shutdown
3. Add examples showing basic usage and middleware
4. Write comprehensive README
5. Add publishing instructions
6. Update this overview document

## Support

- **Documentation**: See individual SDK README files
- **Issues**: https://github.com/your-org/api-logs/issues
- **Discussions**: https://github.com/your-org/api-logs/discussions

## License

All SDKs are released under the MIT License.
