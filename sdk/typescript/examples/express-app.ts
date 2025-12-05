import express, { Request } from "express";
import { APILogsExporter, createExpressMiddleware } from "../src";

const app = express();
app.use(express.json());

// Initialize exporter with batch support and user auto-creation
const exporter = new APILogsExporter({
	apiKey: "your-api-key-here",
	environment: "dev",
	baseURL: "http://localhost:8080/api/v1",
	batchSize: 10,
	flushInterval: 5000,
	maxRetries: 3,
	createUsers: true, // Auto-create users
});

// Add logging middleware (auto-batches logs and creates users)
app.use(
	createExpressMiddleware(exporter, {
		captureRequestBody: true,
		captureResponseBody: true,
		captureHeaders: true,
		excludePaths: ["/health"],
		getUserInfo: (req: Request) => {
			// Extract user info from request (e.g., from JWT token)
			const user = (req as any).user;

			// You can also extract from headers or query params for testing
			const userEmail = req.get("X-User-Email") || user?.email;
			const userName = req.get("X-User-Name") || user?.name;

			return {
				user_identifier: userEmail,
				user_name: userName,
			};
		},
	}),
);

// Sample routes
app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.get("/api/users", (req, res) => {
	res.json({
		data: [
			{ id: 1, name: "John", email: "john@example.com" },
			{ id: 2, name: "Jane", email: "jane@example.com" },
		],
	});
});

app.post("/api/users", (req, res) => {
	res.status(201).json({
		data: {
			id: Math.floor(Math.random() * 1000),
			...req.body,
		},
	});
});

app.get("/api/error", (req, res) => {
	res.status(500).json({ error: "Internal server error" });
});

// Simulate high traffic to test batching
app.get("/api/stress", async (req, res) => {
	const count = parseInt(req.query.count as string) || 20;

	// This will trigger multiple log entries
	for (let i = 0; i < count; i++) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	res.json({
		message: "Stress test complete",
		logs_queued: exporter.getQueueSize(),
		config: exporter.getConfig(),
	});
});

// Get exporter status
app.get("/api/exporter/status", (req, res) => {
	res.json({
		queue_size: exporter.getQueueSize(),
		config: exporter.getConfig(),
		enabled: exporter.isEnabled(),
	});
});

// Manual flush endpoint
app.post("/api/exporter/flush", async (req, res) => {
	const result = await exporter.flush();
	res.json({
		message: "Logs flushed",
		result,
	});
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("\nShutting down gracefully...");
	await exporter.shutdown();
	process.exit(0);
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`✓ Express app listening on port ${PORT}`);
	console.log(`✓ API logging enabled (batching to ${exporter.getConfig().baseURL})`);
	console.log(`✓ User auto-creation: ENABLED`);
	console.log(`✓ Batch size: 10, Flush interval: 5s\n`);
	console.log("Try these endpoints:");
	console.log(`  GET  http://localhost:${PORT}/health`);
	console.log(`  GET  http://localhost:${PORT}/api/users`);
	console.log(`       -H "X-User-Email: alice@example.com"`);
	console.log(`       -H "X-User-Name: Alice Smith"`);
	console.log(`  POST http://localhost:${PORT}/api/users`);
	console.log(`       -H "X-User-Email: bob@example.com"`);
	console.log(`       -H "X-User-Name: Bob Johnson"`);
	console.log(`  GET  http://localhost:${PORT}/api/error`);
	console.log(`  GET  http://localhost:${PORT}/api/stress?count=20`);
	console.log(`  GET  http://localhost:${PORT}/api/exporter/status`);
	console.log(`  POST http://localhost:${PORT}/api/exporter/flush`);
	console.log("\nNote: Add X-User-Email and X-User-Name headers to auto-create users");
});
