import { APILogsExporter } from "../src";

// Initialize the exporter with user auto-creation
const exporter = new APILogsExporter({
	apiKey: "your-api-key-here",
	environment: "dev",
	baseURL: "http://localhost:8080/api/v1",
	batchSize: 5,
	flushInterval: 3000,
	createUsers: true, // Auto-create users if they don't exist
});

console.log("Configuration:", exporter.getConfig());

// Example 1: Log with user_identifier (user will be auto-created)
async function example1() {
	await exporter.log({
		method: "GET",
		path: "/api/users/123",
		status_code: 200,
		response_time_ms: 45,
		user_identifier: "john@example.com",
		user_name: "John Doe",
	});

	console.log("✓ Logged API call (user will be auto-created if not exists)");
}

// Example 2: Batch logging with multiple users
async function example2() {
	const users = [
		{ identifier: "alice@example.com", name: "Alice Smith" },
		{ identifier: "bob@example.com", name: "Bob Johnson" },
		{ identifier: "carol@example.com", name: "Carol Williams" },
	];

	for (const user of users) {
		await exporter.log({
			method: "POST",
			path: "/api/orders",
			status_code: 201,
			response_time_ms: Math.floor(Math.random() * 100),
			user_identifier: user.identifier,
			user_name: user.name,
		});
	}

	console.log("✓ Logged 3 API calls with different users");
}

// Example 3: High traffic simulation (batching)
async function example3() {
	console.log("\nSimulating high-traffic scenario...");

	for (let i = 0; i < 15; i++) {
		await exporter.log({
			method: "GET",
			path: `/api/items/${i}`,
			status_code: 200,
			response_time_ms: Math.floor(Math.random() * 100),
			user_identifier: `user${i % 3}@example.com`,
			user_name: `User ${i % 3}`,
		});
	}

	console.log(`✓ Queued 15 logs (batch size: 5)`);
	console.log(`  Current queue size: ${exporter.getQueueSize()}`);
}

// Example 4: Log with full details
async function example4() {
	await exporter.log({
		method: "POST",
		path: "/api/products",
		status_code: 201,
		response_time_ms: 234,
		user_identifier: "admin@example.com",
		user_name: "Admin User",
		request_headers: {
			"content-type": "application/json",
			authorization: "Bearer token123",
		},
		response_headers: {
			"content-type": "application/json",
			"x-request-id": "req-abc-123",
		},
		request_body: {
			name: "New Product",
			price: 99.99,
		},
		response_body: {
			id: "prod-123",
			name: "New Product",
			price: 99.99,
		},
	});

	console.log("✓ Logged API call with full details and user auto-creation");
}

// Example 5: Error logging with user
async function example5() {
	await exporter.log({
		method: "DELETE",
		path: "/api/products/999",
		status_code: 404,
		response_time_ms: 23,
		error_message: "Product not found",
		user_identifier: "admin@example.com",
		user_name: "Admin User",
	});

	console.log("✓ Logged error response with user info");
}

// Run examples
async function main() {
	console.log("Running TypeScript SDK examples with user auto-creation...\n");

	await example1();
	await example2();
	await example3();
	await example4();
	await example5();

	console.log("\nFlushing remaining logs...");
	const result = await exporter.flush();

	if (result) {
		console.log("Batch result:", result);
	}

	console.log("Shutting down...");
	await exporter.shutdown();

	console.log("✓ Done!");
}

main().catch(console.error);
