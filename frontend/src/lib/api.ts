import axios from "axios";
import { appStore, clearApiKey } from "../store/appStore";
import type { APILog, LogFilters, PaginatedResponse, Project, User } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach API key from store
api.interceptors.request.use((config) => {
  const state = appStore.state;
  if (state.apiKey) {
    config.headers["X-API-Key"] = state.apiKey;
    config.headers["X-Environment"] = state.environment;
  }
  return config;
});

// Store router reference for navigation
let routerNavigate: ((opts: { to: string }) => void) | null = null;

export const setRouterNavigate = (navigateFn: (opts: { to: string }) => void) => {
  routerNavigate = navigateFn;
};

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear API key from store and localStorage
      clearApiKey();

      // Use router navigate if available, otherwise fall back to window.location
      if (routerNavigate) {
        routerNavigate({ to: "/setup" });
      } else {
        window.location.href = "/setup";
      }
    }
    return Promise.reject(error);
  },
);

// Re-export types
export type { APILog, LogFilters, PaginatedResponse, Project, User };

// API Functions
export const projectsApi = {
  getAll: () => api.get<PaginatedResponse<Project>>("/projects"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description: string; environment: string }) => api.post<Project>("/projects", data),
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
  getDetails: (id: string) => api.get(`/logs/${id}/details`),
  delete: (id: string) => api.delete(`/logs/${id}`),
  getStats: (projectId?: string) => api.get("/logs/stats", { params: { projectId } }),
};
