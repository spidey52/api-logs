import axios from "axios";
import type { APILog, LogFilters, PaginatedResponse, Project, User } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },

  transformRequest: [
    (data, headers) => {
      // Attach API key from localStorage if available
      const apiKey = localStorage.getItem("apiKey");
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
        // X - Environment
        headers["X-Environment"] = apiKey.startsWith("dev_") ? "dev" : "production";
      }

      // if not available, proceed without it
      localStorage.setItem("apiKey", "prod_38e7df59c0669e7ebee6a8d3052dbfdf");

      return JSON.stringify(data);
    },
  ],
});

// Re-export types
export type { APILog, LogFilters, PaginatedResponse, Project, User };

// API Functions
export const projectsApi = {
  getAll: () => api.get<PaginatedResponse<Project>>("/projects"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description: string }) => api.post<Project>("/projects", data),
  update: (id: string, data: { name: string; description: string }) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const usersApi = {
  getAll: (params?: { projectId?: string; page?: number; limit?: number }) => api.get<PaginatedResponse<User>>("/users", { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: { projectId: string; identifier: string; name: string; email?: string }) => api.post<User>("/users", data),
  update: (id: string, data: { name: string; email?: string }) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const logsApi = {
  getAll: (filters?: LogFilters) => api.get<PaginatedResponse<APILog>>("/logs", { params: filters }),
  getById: (id: string) => api.get<APILog>(`/logs/${id}`),
  delete: (id: string) => api.delete(`/logs/${id}`),
  getStats: (projectId?: string) => api.get("/logs/stats", { params: { projectId } }),
};
