export type Environment = "dev" | "production";

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface APILogEntry {
	method: HTTPMethod;
	path: string;
	query_params: Record<string, string>;
	status_code: number;
	response_time_ms: number;
	content_length: number;
	ip_address?: string;
	user_agent?: string;
	user_id?: string;
	user_name?: string;
	user_identifier?: string;
	request_headers?: Record<string, any>;
	response_headers?: Record<string, any>;
	request_body?: Record<string, any>;
	response_body?: Record<string, any>;
	error_message?: string;
}

export interface ExporterConfig {
	apiKey: string;
	environment?: Environment;
	baseURL?: string;
	batchSize?: number;
	flushInterval?: number;
	enabled?: boolean;
	maxRetries?: number;
	retryDelay?: number;
	createUsers?: boolean; // Auto-create users if they don't exist
}

export interface BatchResponse {
	success_count: number;
	failed_count: number;
	total: number;
	errors?: string[];
}
