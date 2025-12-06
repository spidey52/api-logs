export interface Project {
  id: string;
  name: string;
  description: string;
  api_key: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  projectId: string;
  identifier: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface APILog {
  id: string;
  project_id: string;
  environment: string;
  method: string;
  path: string;
  query_params: Record<string, string>;
  status_code: number;
  response_time_ms: number;
  content_length: number;
  ip_address: string;
  user_agent: string;
  has_headers: boolean;
  has_body: boolean;
  timestamp: string;
  request_headers?: Record<string, unknown>;
  response_headers?: Record<string, unknown>;
  request_body?: Record<string, unknown> | string;
  response_body?: Record<string, unknown> | string;
  error_message?: string;
  user_id?: string;
  user_name?: string;
  user_identifier?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;

  // id: string;
  // projectId: string;
  // environment: string;
  // method: string;
  // path: string;
  // statusCode: number;
  // responseTimeMs: number;
  // ipAddress: string;
  // userAgent: string;
  // hasHeaders: boolean;
  // hasBody: boolean;
  // timestamp: string;
  // requestHeaders?: Record<string, unknown>;
  // responseHeaders?: Record<string, unknown>;
  // requestBody?: Record<string, unknown> | string;
  // responseBody?: Record<string, unknown> | string;
  // errorMessage?: string;
  // userId?: string;
  // userName?: string;
  // userIdentifier?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  //  pagination?: {
  //   page: number;
  //   limit: number;
  //   total: number;
  //   totalPages: number;
  //  };
}

export interface LogFilters {
  projectId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number | string; // Support range format like "400-499"
  environment?: string;
  startDate?: string;
  endDate?: string;
  date?: string; // Format: "YYYY-MM-DD" (single date)
  dateRange?: string; // Format: "YYYY-MM-DD|YYYY-MM-DD"
  search?: string; // Full-text search across logs
  page?: number;
  limit?: number;
}
