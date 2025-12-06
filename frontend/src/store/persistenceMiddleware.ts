import { Store } from "@tanstack/react-store";

export interface PersistenceAdapter<T> {
	load: () => Promise<T | null> | T | null;
	save: (state: T) => Promise<void> | void;
}

/**
 * Deep merge two objects, preserving arrays and adding new properties from source
 * @param target - The target object (stored state)
 * @param source - The source object (default state with new properties)
 * @returns Merged object with all properties from both
 */
function deepMerge<T>(target: T, source: T): T {
	if (!target || typeof target !== "object") return source;
	if (!source || typeof source !== "object") return target;

	const merged = { ...target };

	for (const key in source) {
		const targetValue = target[key];
		const sourceValue = source[key];

		// If source has a property that target doesn't, add it
		if (!(key in target)) {
			(merged as Record<string, unknown>)[key] = sourceValue;
			continue;
		}

		// Handle arrays: merge arrays by combining unique values for string arrays
		if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
			// For arrays, keep target values but ensure all source values are present
			const targetSet = new Set(targetValue);
			const newValues = sourceValue.filter((v: unknown) => !targetSet.has(v));
			(merged as Record<string, unknown>)[key] = [...targetValue, ...newValues];
			continue;
		}

		// Handle nested objects: recursively merge
		if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
			(merged as Record<string, unknown>)[key] = deepMerge(targetValue, sourceValue);
			continue;
		}

		// For primitives, keep target value
		(merged as Record<string, unknown>)[key] = targetValue;
	}

	return merged;
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
				// Deep merge loaded state with default state to include new properties
				const merged = deepMerge(loaded, defaultState);
				store.setState(() => merged);
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
