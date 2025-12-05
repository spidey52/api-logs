// Example: How to use backend persistence for user preferences

import { createBackendAdapter, createHybridAdapter, createPersistedStore } from "./persistenceMiddleware";

// Example interface for user preferences stored in backend
interface UserPreferences {
	theme: "light" | "dark";
	language: string;
	notifications: boolean;
}

// Example 1: Pure backend persistence
export function createBackendPersistedStore() {
	const backendAdapter = createBackendAdapter<UserPreferences>(
		// Fetch from backend
		async () => {
			const response = await fetch("/api/user/preferences");
			if (!response.ok) return null;
			return response.json();
		},
		// Save to backend
		async (state) => {
			await fetch("/api/user/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(state),
			});
		},
	);

	return createPersistedStore<UserPreferences>(
		{
			theme: "light",
			language: "en",
			notifications: true,
		},
		backendAdapter,
	);
}

// Example 2: Hybrid persistence (localStorage + backend)
// This is the recommended approach for best UX:
// - Instant load from localStorage
// - Background sync with backend
// - Works offline
export function createHybridPersistedStore() {
	const backendAdapter = createBackendAdapter<UserPreferences>(
		async () => {
			const response = await fetch("/api/user/preferences");
			if (!response.ok) return null;
			const data = await response.json();
			return data;
		},
		async (state) => {
			await fetch("/api/user/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(state),
			});
		},
	);

	const hybridAdapter = createHybridAdapter<UserPreferences>("user-preferences", backendAdapter);

	return createPersistedStore<UserPreferences>(
		{
			theme: "light",
			language: "en",
			notifications: true,
		},
		hybridAdapter,
	);
}

// Usage in your app:
// export const userPreferencesStore = createHybridPersistedStore();

// Then in components:
// const prefs = useStore(userPreferencesStore);
// userPreferencesStore.setState((state) => ({ ...state, theme: 'dark' }));
