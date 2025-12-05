import { createLocalStorageAdapter, createPersistedStore } from "./persistenceMiddleware";

interface FilterPreferencesState {
	visibleFilters: Record<string, string[]>; // page -> array of visible filter ids
	filterOrder: Record<string, string[]>; // page -> array of filter ids in order
}

// Create store with automatic localStorage persistence
export const filterPreferencesStore = createPersistedStore<FilterPreferencesState>(
	{
		visibleFilters: {},
		filterOrder: {},
	},
	createLocalStorageAdapter<FilterPreferencesState>("filter-preferences-storage"),
);

// Helper functions
export const getVisibleFilters = (page: string, defaultVisible: string[]): string[] => {
	const state = filterPreferencesStore.state;
	return state.visibleFilters[page] || defaultVisible;
};

export const setVisibleFilters = (page: string, visibleFilters: string[]) => {
	filterPreferencesStore.setState((state) => ({
		...state,
		visibleFilters: {
			...state.visibleFilters,
			[page]: visibleFilters,
		},
	}));
};

export const toggleFilterVisibility = (page: string, filterId: string, defaultVisible: string[]) => {
	const current = getVisibleFilters(page, defaultVisible);
	const newVisible = current.includes(filterId) ? current.filter((id) => id !== filterId) : [...current, filterId];
	setVisibleFilters(page, newVisible);
};

export const getFilterOrder = (page: string, defaultOrder: string[]): string[] => {
	const state = filterPreferencesStore.state;
	return state.filterOrder[page] || defaultOrder;
};

export const setFilterOrder = (page: string, filterOrder: string[]) => {
	filterPreferencesStore.setState((state) => ({
		...state,
		filterOrder: {
			...state.filterOrder,
			[page]: filterOrder,
		},
	}));
};
