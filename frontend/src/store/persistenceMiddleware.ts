import { Store } from "@tanstack/react-store";

export interface PersistenceAdapter<T> {
	load: () => Promise<T | null> | T | null;
	save: (state: T) => Promise<void> | void;
}

/**
 * LocalStorage adapter for persistence
 */
export function createLocalStorageAdapter<T>(storageKey: string): PersistenceAdapter<T> {
	return {
		load: () => {
			try {
				const stored = localStorage.getItem(storageKey);
				return stored ? JSON.parse(stored) : null;
			} catch {
				return null;
			}
		},
		save: (state: T) => {
			try {
				localStorage.setItem(storageKey, JSON.stringify(state));
			} catch (error) {
				console.error(`Failed to save to localStorage "${storageKey}":`, error);
			}
		},
	};
}

/**
 * Backend API adapter for persistence
 * @param fetchFn - Function to fetch state from backend
 * @param saveFn - Function to save state to backend
 */
export function createBackendAdapter<T>(fetchFn: () => Promise<T | null>, saveFn: (state: T) => Promise<void>): PersistenceAdapter<T> {
	return {
		load: fetchFn,
		save: saveFn,
	};
}

/**
 * Hybrid adapter: Uses localStorage for immediate sync, backend for persistence
 * Loads from localStorage first (fast), then syncs with backend
 */
export function createHybridAdapter<T>(storageKey: string, backendAdapter: PersistenceAdapter<T>): PersistenceAdapter<T> {
	const localAdapter = createLocalStorageAdapter<T>(storageKey);

	return {
		load: async () => {
			// Load from localStorage first (fast)
			const localData = localAdapter.load();
			if (localData) return localData;

			// Fallback to backend if no local data
			return await backendAdapter.load();
		},
		save: async (state: T) => {
			// Save to localStorage immediately (fast)
			localAdapter.save(state);

			// Sync to backend in background
			try {
				await backendAdapter.save(state);
			} catch (error) {
				console.error("Failed to sync to backend:", error);
			}
		},
	};
}

/**
 * Creates a TanStack Store with automatic persistence
 * @param defaultState - The default state to use if no stored state exists
 * @param adapter - The persistence adapter to use (localStorage, backend, or hybrid)
 * @returns A configured store instance with persistence
 */
export function createPersistedStore<T>(defaultState: T, adapter: PersistenceAdapter<T>): Store<T> {
	// Create store with default state initially
	const store = new Store<T>(defaultState);

	// Load initial state from adapter (async supported)
	const loadInitialState = async () => {
		try {
			const loaded = await adapter.load();
			if (loaded !== null) {
				store.setState(() => loaded);
			}
		} catch (error) {
			console.error("Failed to load persisted state:", error);
		}
	};

	// Start loading immediately
	loadInitialState();

	// Subscribe to changes and save via adapter
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	store.subscribe(() => {
		// Debounce saves to avoid too many backend calls
		if (saveTimeout) clearTimeout(saveTimeout);

		saveTimeout = setTimeout(() => {
			adapter.save(store.state);
		}, 500); // 500ms debounce
	});

	return store;
}
