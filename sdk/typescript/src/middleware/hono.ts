import type { Context, MiddlewareHandler, Next } from "hono";
import type { APILogsExporter } from "../index";
import type { APILogEntry } from "../types";

export interface HonoMiddlewareOptions {
	exporter: APILogsExporter;
	getUserInfo?: (c: Context) => {
		user_identifier?: string;
		user_name?: string;
		user_id?: string;
	};
	captureRequestBody?: boolean;
	captureResponseBody?: boolean;
	captureHeaders?: boolean;
}

export function createHonoMiddleware(options: HonoMiddlewareOptions): MiddlewareHandler {
	const { exporter, getUserInfo, captureRequestBody = false, captureResponseBody = false, captureHeaders = false } = options;

	return async (c: Context, next: Next) => {
		const startTime = Date.now();
		const method = c.req.method;
		const path = c.req.path;

		// Capture request data
		let requestBody: any;
		if (captureRequestBody) {
			try {
				const contentType = c.req.header("content-type");
				if (contentType?.includes("application/json")) {
					// Clone and parse the request body
					const clonedReq = c.req.raw.clone();
					requestBody = await clonedReq.json();
				}
			} catch (error) {
				// Ignore body parsing errors
			}
		}

		let requestHeaders: Record<string, any> | undefined;
		if (captureHeaders) {
			requestHeaders = {};
			c.req.raw.headers.forEach((value: string, key: string) => {
				requestHeaders![key] = value;
			});
		}

		// Execute the route handler
		await next();

		const responseTime = Date.now() - startTime;

		// Capture response data
		let responseBody: any;
		if (captureResponseBody && c.res) {
			try {
				const contentType = c.res.headers.get("content-type");
				if (contentType?.includes("application/json")) {
					const clonedResponse = c.res.clone();
					responseBody = await clonedResponse.json();
				}
			} catch (error) {
				// Ignore response parsing errors
			}
		}

		let responseHeaders: Record<string, any> | undefined;
		if (captureHeaders && c.res) {
			responseHeaders = {};
			c.res.headers.forEach((value: string, key: string) => {
				responseHeaders![key] = value;
			});
		}

		// Get user info
		let userInfo: any = {};
		if (getUserInfo) {
			userInfo = getUserInfo(c);
		}

		// Parse query params into object
		const url = new URL(c.req.url);
		const queryParams: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			queryParams[key] = value;
		});

		// Get content length (default to 0 if not set)
		const contentLength = c.req.header("content-length") ? parseInt(c.req.header("content-length")!) : 0;

		// Create log entry
		const logEntry: APILogEntry = {
			method: method as any,
			path,
			status_code: c.res?.status || 500,
			response_time_ms: responseTime,
			ip_address: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
			user_agent: c.req.header("user-agent"),
			query_params: queryParams,
			content_length: contentLength,
			...userInfo,
			...(requestHeaders && { request_headers: requestHeaders }),
			...(responseHeaders && { response_headers: responseHeaders }),
			...(requestBody && { request_body: requestBody }),
			...(responseBody && { response_body: responseBody }),
		};

		// Log asynchronously
		exporter.log(logEntry).catch((err) => {
			console.error("Failed to log API request:", err);
		});
	};
}
