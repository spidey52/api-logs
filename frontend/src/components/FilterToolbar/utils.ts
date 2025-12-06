import type { FilterConfig } from "./types";

/**
 * Calculate which filters fit in the toolbar based on visibility and size ratios
 */
export const getVisibleFilters = (filters: FilterConfig[], maxToolbarUnits: number): FilterConfig[] => {
	const visibleInToolbar: FilterConfig[] = [];
	let usedUnits = 0;

	// Only show filters marked as visible and that fit
	for (const filter of filters) {
		if (filter.visible === false) continue; // Skip hidden filters

		const filterSize = filter.size || 1; // Default size is 1 unit
		if (usedUnits + filterSize <= maxToolbarUnits) {
			visibleInToolbar.push(filter);
			usedUnits += filterSize;
		} else {
			break; // Can't fit more filters
		}
	}

	return visibleInToolbar;
};

/**
 * Count applied filters (filters with non-empty values)
 */
export const countAppliedFilters = (filters: FilterConfig[]): number => {
	return filters.filter((filter) => {
		const value = filter.value;
		if (value === undefined || value === null || value === "") return false;
		return true;
	}).length;
};

/**
 * Build URL search params from filters, preserving non-filter params
 */
export const buildSearchParams = (filters: FilterConfig[], currentSearch: Record<string, string | undefined>): Record<string, string> => {
	const filterIds = new Set(filters.map((f) => f.id));
	const params: Record<string, string> = {};

	// Copy non-filter params from current search
	Object.entries(currentSearch).forEach(([key, value]) => {
		if (!filterIds.has(key) && value !== undefined) {
			params[key] = value;
		}
	});

	// Add current filter values
	filters.forEach((filter) => {
		if (filter.value !== undefined && filter.value !== null && filter.value !== "") {
			params[filter.id] = String(filter.value);
		}
	});

	return params;
};
