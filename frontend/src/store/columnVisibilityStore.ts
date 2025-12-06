import { createLocalStorageAdapter, createPersistedStore } from "./persistenceMiddleware";

export type DensityType = "comfortable" | "standard" | "compact";

interface ColumnVisibilityState {
	hiddenColumns: Record<string, string[]>; // page -> array of hidden column ids
	density: Record<string, DensityType>; // page -> density setting
	columnOrder: Record<string, string[]>; // page -> array of column ids in order
}

// Create store with automatic localStorage persistence
export const columnVisibilityStore = createPersistedStore<ColumnVisibilityState>(
	{
		hiddenColumns: {},
		density: {},
		columnOrder: {},
	},
	createLocalStorageAdapter<ColumnVisibilityState>("column-visibility-storage"),
);

// Helper functions
export const toggleColumn = (page: string, columnId: string) => {
	columnVisibilityStore.setState((state) => {
		const pageHidden = state.hiddenColumns[page] || [];
		const isHidden = pageHidden.includes(columnId);

		return {
			...state,
			hiddenColumns: {
				...state.hiddenColumns,
				[page]: isHidden ? pageHidden.filter((id) => id !== columnId) : [...pageHidden, columnId],
			},
		};
	});
};

export const isColumnVisible = (page: string, columnId: string): boolean => {
	const state = columnVisibilityStore.state;
	const pageHidden = state.hiddenColumns[page] || [];
	return !pageHidden.includes(columnId);
};

export const getVisibleColumns = (page: string, allColumnIds: string[]): string[] => {
	const state = columnVisibilityStore.state;
	const pageHidden = state.hiddenColumns[page] || [];
	return allColumnIds.filter((id) => !pageHidden.includes(id));
};

export const setDensity = (page: string, density: DensityType) => {
	columnVisibilityStore.setState((state) => ({
		...state,
		density: {
			...state.density,
			[page]: density,
		},
	}));
};

export const getDensity = (page: string): DensityType => {
	const state = columnVisibilityStore.state;
	return state.density[page] || "standard";
};

export const getColumnOrder = (page: string, defaultOrder: string[]): string[] => {
	const state = columnVisibilityStore.state;
	const storedOrder = state.columnOrder[page];

	if (!storedOrder) {
		return defaultOrder;
	}

	// Merge stored order with default order to include new columns
	const newColumns = defaultOrder.filter((id) => !storedOrder.includes(id));
	return [...storedOrder, ...newColumns];
};

export const setColumnOrder = (page: string, columnOrder: string[]) => {
	columnVisibilityStore.setState((state) => ({
		...state,
		columnOrder: {
			...state.columnOrder,
			[page]: columnOrder,
		},
	}));
};
