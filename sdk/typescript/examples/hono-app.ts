import { Hono } from "hono";
import { APILogsExporter } from "../src/index";
import { createHonoMiddleware } from "../src/middleware/hono";

const app = new Hono();

// Initialize the exporter
const exporter = new APILogsExporter({
	apiKey: "your-api-key-here",
	environment: "dev",
	baseURL: "http://localhost:8080",
	batchSize: 10,
	flushInterval: 5000,
	createUsers: true,
});

// Add logging middleware
app.use(
	"*",
	createHonoMiddleware({
		exporter,
		getUserInfo: (c) => {
			// Extract user info from headers or context
			const userEmail = c.req.header("x-user-email");
			const userName = c.req.header("x-user-name");
			const userId = c.req.header("x-user-id");

			return {
				user_identifier: userEmail,
				user_name: userName,
				user_id: userId,
			};
		},
		captureHeaders: true,
		captureRequestBody: true,
		captureResponseBody: true,
	}),
);

// Routes
app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

app.get("/users/:id", (c) => {
	const id = c.req.param("id");
	return c.json({ id, name: "John Doe", email: "john@example.com" });
});

app.post("/users", async (c) => {
	const body = await c.req.json();
	return c.json({ id: "123", ...body }, 201);
});

app.get("/error", (c) => {
	throw new Error("Something went wrong!");
});

// Graceful shutdown
const server = {
	port: 3000,
	fetch: app.fetch,
};

process.on("SIGINT", async () => {
	console.log("\nShutting down gracefully...");
	await exporter.shutdown();
	process.exit(0);
});

console.log("Hono server with API logging running on http://localhost:3000");
console.log("Try these endpoints:");
console.log("  GET  http://localhost:3000/");
console.log("  GET  http://localhost:3000/users/123");
console.log("  POST http://localhost:3000/users");
console.log("\nAdd these headers to test user auto-creation:");
console.log('  -H "x-user-email: test@example.com"');
console.log('  -H "x-user-name: Test User"');

export default server;
