import axios, { AxiosInstance } from "axios";
import { APILogEntry, BatchResponse, Environment, ExporterConfig } from "./types";

export class APILogsExporter {
	private apiKey: string;
	private environment: Environment;
	private baseURL: string;
	private batchSize: number;
	private flushInterval: number;
	private enabled: boolean;
	private maxRetries: number;
	private retryDelay: number;
	private createUsers: boolean;

	private logQueue: APILogEntry[] = [];
	private timer: NodeJS.Timeout | null = null;
	private client: AxiosInstance;
	private isShuttingDown: boolean = false;

	constructor(config: ExporterConfig) {
		this.apiKey = config.apiKey;
		this.environment = config.environment || "dev";
		this.baseURL = config.baseURL || "http://localhost:8080/api/v1";
		this.batchSize = config.batchSize || 10;
		this.flushInterval = config.flushInterval || 5000;
		this.enabled = config.enabled !== false;
		this.maxRetries = config.maxRetries || 3;
		this.retryDelay = config.retryDelay || 1000;
		this.createUsers = config.createUsers !== false; // Default true

		this.client = axios.create({
			baseURL: this.baseURL,
			headers: {
				"X-API-Key": this.apiKey,
				"X-Environment": this.environment,
				"Content-Type": "application/json",
			},
			timeout: 10000,
		});

		if (this.enabled) {
			this.startAutoFlush();
		}
	}

	/**
	 * Log a single API request/response
	 */
	public async log(entry: APILogEntry): Promise<void> {
		if (!this.enabled || this.isShuttingDown) {
			return;
		}

		this.logQueue.push(entry);

		// Auto-flush if batch size reached
		if (this.logQueue.length >= this.batchSize) {
			await this.flush();
		}
	}

	/**
	 * Flush all queued logs to server in a batch
	 */
	public async flush(): Promise<BatchResponse | null> {
		if (this.logQueue.length === 0) {
			return null;
		}

		const logsToSend = [...this.logQueue];
		this.logQueue = [];

		try {
			const result = await this.sendBatch(logsToSend);
			return result;
		} catch (error) {
			console.error("Failed to flush logs:", error);
			// Re-queue failed logs if not shutting down
			if (!this.isShuttingDown) {
				this.logQueue.push(...logsToSend);
			}
			return null;
		}
	}

	/**
	 * Send logs in batch to the server
	 */
	private async sendBatch(logs: APILogEntry[], retryCount = 0): Promise<BatchResponse> {
		try {
			const response = await this.client.post<{ data: BatchResponse }>("/logs/batch", {
				logs,
				create_users: this.createUsers,
			});

			return response.data.data;
		} catch (error: any) {
			if (retryCount < this.maxRetries) {
				// Wait before retrying with exponential backoff
				await this.sleep(this.retryDelay * Math.pow(2, retryCount));
				return this.sendBatch(logs, retryCount + 1);
			}

			throw error;
		}
	}

	/**
	 * Send a single log (for individual logging)
	 */
	private async sendSingle(log: APILogEntry, retryCount = 0): Promise<void> {
		try {
			await this.client.post("/logs", log);
		} catch (error: any) {
			if (retryCount < this.maxRetries) {
				await this.sleep(this.retryDelay * Math.pow(2, retryCount));
				return this.sendSingle(log, retryCount + 1);
			}

			throw error;
		}
	}

	/**
	 * Start automatic flushing
	 */
	private startAutoFlush(): void {
		if (this.timer) {
			return;
		}

		this.timer = setInterval(() => {
			this.flush().catch((err) => {
				console.error("Auto-flush error:", err?.message || err);
			});
		}, this.flushInterval);

		// Ensure timer doesn't prevent process exit
		if (this.timer.unref) {
			this.timer.unref();
		}
	}

	/**
	 * Stop automatic flushing
	 */
	private stopAutoFlush(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	/**
	 * Shutdown the exporter gracefully
	 */
	public async shutdown(): Promise<void> {
		this.isShuttingDown = true;
		this.stopAutoFlush();
		await this.flush();
	}

	/**
	 * Helper to sleep
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Get queue size
	 */
	public getQueueSize(): number {
		return this.logQueue.length;
	}

	/**
	 * Clear the queue
	 */
	public clearQueue(): void {
		this.logQueue = [];
	}

	/**
	 * Check if exporter is enabled
	 */
	public isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Enable or disable the exporter
	 */
	public setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (enabled && !this.timer) {
			this.startAutoFlush();
		} else if (!enabled && this.timer) {
			this.stopAutoFlush();
		}
	}

	/**
	 * Get configuration
	 */
	public getConfig() {
		return {
			apiKey: this.apiKey.substring(0, 8) + "...",
			environment: this.environment,
			baseURL: this.baseURL,
			batchSize: this.batchSize,
			flushInterval: this.flushInterval,
			enabled: this.enabled,
			createUsers: this.createUsers,
		};
	}
}

export { createExpressMiddleware } from "./middleware/express";
export { createHonoMiddleware } from "./middleware/hono";
export * from "./types";

