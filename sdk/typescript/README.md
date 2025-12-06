# API Logs SDK - TypeScript/JavaScript

TypeScript SDK for the API logging service with **Express** and **Hono** middleware support, automatic batching, and user auto-creation.

## Features

✅ **Framework Support** - Express and Hono middleware included  
✅ **Automatic Batching** - Efficiently queues and sends logs in batches  
✅ **User Auto-Creation** - Automatically creates users if they don't exist  
✅ **Type Safety** - Full TypeScript support with type definitions  
✅ **Retry Logic** - Exponential backoff for failed requests  
✅ **Configurable** - Highly customizable batch size, intervals, etc.  
✅ **Graceful Shutdown** - Ensures no logs are lost on exit

## Installation

```bash
npm install @spidey52/api-logs-sdk
# or
yarn add @spidey52/api-logs-sdk
# or
pnpm add @spidey52/api-logs-sdk
```

## Quick Start

```typescript
import { APILogsExporter } from "@spidey52/api-logs-sdk";

const exporter = new APILogsExporter({
 apiKey: "your-api-key-here",
 environment: "production",
 baseURL: "https://api-logs.example.com/api/v1",
 batchSize: 10,
 flushInterval: 5000,
 createUsers: true, // Auto-create users
});

// Log an API call with user info
await exporter.log({
 method: "GET",
 path: "/api/users",
 status_code: 200,
 response_time_ms: 45,
 user_identifier: "john@example.com",
 user_name: "John Doe",
});
```

## Configuration Options

```typescript
interface ExporterConfig {
 apiKey: string; // Required: Your API key
 environment?: "dev" | "production"; // Default: 'dev'
 baseURL?: string; // API logs service URL
 batchSize?: number; // Batch size (default: 10)
 flushInterval?: number; // Auto-flush interval in ms (default: 5000)
 enabled?: boolean; // Enable/disable logging (default: true)
 maxRetries?: number; // Max retry attempts (default: 3)
 retryDelay?: number; // Initial retry delay in ms (default: 1000)
 createUsers?: boolean; // Auto-create users (default: true)
}
```

## User Auto-Creation

When `createUsers: true` (default), the SDK will automatically create users in your database when logging with `user_identifier`:

```typescript
// User will be auto-created if doesn't exist
await exporter.log({
 method: "POST",
 path: "/api/orders",
 status_code: 201,
 response_time_ms: 156,
 user_identifier: "alice@example.com", // Used to find/create user
 user_name: "Alice Smith", // Stored with user
});
```

**Benefits:**

- No need to manually create users before logging
- Seamless tracking across API calls
- Automatic user discovery from API usage

**How it works:**

1. SDK sends `user_identifier` and `user_name` in log
2. Backend checks if user exists by identifier
3. If not found, creates new user automatically
4. Associates log with user ID

## Manual Logging

```typescript
// Simple log
await exporter.log({
 method: "GET",
 path: "/api/items",
 status_code: 200,
 response_time_ms: 45,
});

// With user info (auto-creates user)
await exporter.log({
 method: "POST",
 path: "/api/orders",
 status_code: 201,
 response_time_ms: 156,
 user_identifier: "bob@example.com",
 user_name: "Bob Johnson",
});

// With full details
await exporter.log({
 method: "POST",
 path: "/api/products",
 status_code: 201,
 response_time_ms: 234,
 user_identifier: "admin@example.com",
 user_name: "Admin User",
 request_headers: {
  "content-type": "application/json",
 },
 request_body: {
  name: "Product",
 },
 response_body: {
  id: "prod-123",
 },
});
```

## Express Middleware

```typescript
import express from "express";
import { APILogsExporter, createExpressMiddleware } from "@spidey52/api-logs-sdk";

const app = express();
const exporter = new APILogsExporter({
 apiKey: "your-api-key",
 createUsers: true,
});

// Add middleware
app.use(
 createExpressMiddleware(exporter, {
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  excludePaths: ["/health", "/metrics"],
  getUserInfo: (req) => ({
   user_identifier: req.user?.email,
   user_name: req.user?.name,
  }),
 }),
);

// Your routes automatically logged
app.get("/api/users", (req, res) => {
 res.json({ users: [] });
});
```

## Hono Middleware

```typescript
import { Hono } from "hono";
import { APILogsExporter, createHonoMiddleware } from "@spidey52/api-logs-sdk";

const app = new Hono();
const exporter = new APILogsExporter({
 apiKey: "your-api-key",
 createUsers: true,
});

// Add middleware
app.use(
 "*",
 createHonoMiddleware({
  exporter,
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  getUserInfo: (c) => ({
   user_identifier: c.req.header("x-user-email"),
   user_name: c.req.header("x-user-name"),
  }),
 }),
);

app.get("/api/users", (c) => c.json({ users: [] }));
```

### Testing with Headers

You can pass user info via headers for testing:

```bash
curl http://localhost:3000/api/users \
  -H "X-User-Email: alice@example.com" \
  -H "X-User-Name: Alice Smith"
```

## Batching Behavior

Logs are sent in batches automatically:

1. **Batch Size Trigger**: Queue reaches `batchSize` (default: 10)
2. **Time Trigger**: Every `flushInterval` ms (default: 5000ms)
3. **Manual Trigger**: Call `flush()` explicitly
4. **Shutdown Trigger**: Call `shutdown()` before exit

### Example:

```typescript
const exporter = new APILogsExporter({
 apiKey: "key",
 batchSize: 5,
 flushInterval: 3000,
});

// These 5 logs sent together
for (let i = 0; i < 5; i++) {
 await exporter.log({
  /* log */
 });
} // Batch sent here!

// These sent after 3 seconds
await exporter.log({
 /* log 6 */
});
await exporter.log({
 /* log 7 */
});
// Auto-flushed after 3s
```

## API Methods

### `log(entry: APILogEntry): Promise<void>`

Add a log entry to the queue. Automatically batches and sends.

### `flush(): Promise<BatchResponse | null>`

Immediately send all queued logs. Returns batch result with success/failure counts.

### `shutdown(): Promise<void>`

Flush remaining logs and stop auto-flush timer. **Always call before exiting!**

### `getQueueSize(): number`

Get current number of logs in the queue.

### `clearQueue(): void`

Clear all queued logs (use with caution).

### `isEnabled(): boolean`

Check if exporter is enabled.

### `setEnabled(enabled: boolean): void`

Enable or disable the exporter dynamically.

### `getConfig(): object`

Get current configuration (safe - masks API key).

## Batch Response

When flushing, you get a response with results:

```typescript
const result = await exporter.flush();
console.log(result);
// {
//   success_count: 8,
//   failed_count: 2,
//   total: 10,
//   errors: ['error msg 1', 'error msg 2']
// }
```

## Best Practices

### 1. Graceful Shutdown

Always flush logs before exiting:

```typescript
process.on("SIGINT", async () => {
 await exporter.shutdown();
 process.exit(0);
});
```

### 2. Error Handling

The SDK retries automatically, but you can monitor:

```typescript
const result = await exporter.flush();
if (result && result.failed_count > 0) {
 console.warn("Some logs failed:", result.errors);
}
```

### 3. Performance Tuning

For high-traffic APIs:

```typescript
const exporter = new APILogsExporter({
 batchSize: 50, // Larger batches
 flushInterval: 10000, // Less frequent flushes
 maxRetries: 5, // More retries
});
```

### 4. Privacy

Be careful with sensitive data:

```typescript
createExpressMiddleware(exporter, {
 captureHeaders: false, // Don't capture auth headers
 captureRequestBody: false, // Don't capture passwords
 captureResponseBody: true,
});
```

### 5. User Tracking

For authenticated APIs:

```typescript
app.use(
 createExpressMiddleware(exporter, {
  getUserInfo: (req) => {
   const token = req.headers.authorization;
   const user = decodeJWT(token); // Your auth logic

   return {
    user_identifier: user.email,
    user_name: user.displayName,
    user_id: user.id, // Optional: if you manage users separately
   };
  },
 }),
);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run examples
npm run example
npm run example:express

# Watch mode
npm run dev

# Test
npm test
```

## Examples

See `examples/` directory:

- `basic.ts` - Manual logging with user auto-creation
- `express-app.ts` - Express middleware with batching

## Testing the Batch Endpoint

```bash
# Start your Go backend
cd ../../
make dev

# In another terminal, run the example
cd sdk/typescript
npm run example:express

# Test with curl
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "X-User-Email: test@example.com" \
  -H "X-User-Name: Test User" \
  -d '{"name": "Test", "email": "test@example.com"}'

# Check exporter status
curl http://localhost:3000/api/exporter/status

# Manual flush
curl -X POST http://localhost:3000/api/exporter/flush
```

## API Log Entry Fields

```typescript
interface APILogEntry {
 // Required
 method: HTTPMethod;
 path: string;
 status_code: number;
 response_time_ms: number;

 // Optional - Connection info
 ip_address?: string;
 user_agent?: string;

 // Optional - User info (for auto-creation)
 user_id?: string; // If you manage users
 user_name?: string; // Display name
 user_identifier?: string; // Email or username (unique)

 // Optional - Headers & Bodies
 request_headers?: Record<string, any>;
 response_headers?: Record<string, any>;
 request_body?: Record<string, any>;
 response_body?: Record<string, any>;

 // Optional - Error info
 error_message?: string;
}
```

## Troubleshooting

### Logs not being sent

1. Check API key is valid
2. Verify backend URL is accessible
3. Check queue size: `exporter.getQueueSize()`
4. Manually flush: `await exporter.flush()`

### Users not being created

1. Ensure `createUsers: true` in config
2. Provide both `user_identifier` and `user_name`
3. Check backend logs for errors
4. Verify user service is initialized

### High memory usage

1. Reduce `batchSize` or increase `flushInterval`
2. Call `flush()` more frequently
3. Check for long-running processes not shutting down

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
