import { NextFunction, Request, Response } from "express";
import { APILogsExporter } from "../index";
import { APILogEntry } from "../types";

export interface ExpressMiddlewareOptions {
	captureRequestBody?: boolean;
	captureResponseBody?: boolean;
	captureHeaders?: boolean;
	excludePaths?: string[];
	getUserInfo?: (req: Request) => {
		user_id?: string;
		user_name?: string;
		user_identifier?: string;
	} | null;
}

/**
 * Express middleware for automatic API logging
 */
export function createExpressMiddleware(exporter: APILogsExporter, options: ExpressMiddlewareOptions = {}) {
	const { captureRequestBody = false, captureResponseBody = false, captureHeaders = true, excludePaths = ["/health", "/metrics"], getUserInfo = null } = options;

	return (req: Request, res: Response, next: NextFunction) => {
		// Skip excluded paths
		if (excludePaths.some((path) => req.path.startsWith(path))) {
			return next();
		}

		const startTime = Date.now();

		// Capture request body if enabled
		let requestBody: any = null;
		if (captureRequestBody && req.body) {
			requestBody = req.body;
		}

		// Override res.json to capture response
		const originalJson = res.json.bind(res);
		let responseBody: any = null;

		res.json = function (body: any) {
			if (captureResponseBody) {
				responseBody = body;
			}
			return originalJson(body);
		};

		// Wait for response to finish
		res.on("finish", async () => {
			const responseTime = Date.now() - startTime;

			// Extract user info
			let userInfo: any = {};
			if (getUserInfo && typeof getUserInfo === "function") {
				userInfo = getUserInfo(req) || {};
			}

			// Build log entry
			const logEntry: APILogEntry = {
				method: req.method as any,
				path: req.path,
				status_code: res.statusCode,
				response_time_ms: responseTime,
				ip_address: req.ip || req.socket?.remoteAddress,
				user_agent: req.get("user-agent"),
				user_id: userInfo.user_id,
				user_name: userInfo.user_name,
				user_identifier: userInfo.user_identifier,
			};

			// Add headers if enabled
			if (captureHeaders) {
				logEntry.request_headers = req.headers as any;
				logEntry.response_headers = res.getHeaders() as any;
			}

			// Add bodies if captured
			if (requestBody) {
				logEntry.request_body = requestBody;
			}
			if (responseBody) {
				logEntry.response_body = responseBody;
			}

			// Add error message for 4xx and 5xx
			if (res.statusCode >= 400) {
				logEntry.error_message = `HTTP ${res.statusCode} ${res.statusMessage}`;
			}

			// Send to exporter (batched automatically)
			await exporter.log(logEntry);
		});

		next();
	};
}
