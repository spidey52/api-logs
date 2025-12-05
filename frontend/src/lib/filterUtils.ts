/**
 * Parses and converts URL query parameter values based on filter type
 * @param searchParams - URL search parameters object
 * @param filterId - The filter ID to look up
 * @param filterType - The type of filter (select, text, number, date)
 * @returns Parsed value with proper type, or undefined if not present
 */
export function getFilterValueFromUrl(searchParams: Record<string, string | undefined>, filterId: string, filterType: "select" | "text" | "number" | "date"): string | number | undefined {
	const value = searchParams[filterId];
	if (!value) return undefined;

	if (filterType === "number") {
		const parsed = parseInt(value);
		return isNaN(parsed) ? undefined : parsed;
	}

	return value;
}
