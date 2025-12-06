import type { DensityType } from "./types";

export const getRowHeight = (density: DensityType): number => {
	switch (density) {
		case "comfortable":
			return 64;
		case "compact":
			return 40;
		default:
			return 52; // standard
	}
};

export const getCellPadding = (density: DensityType): string => {
	switch (density) {
		case "comfortable":
			return "16px";
		case "compact":
			return "6px";
		default:
			return "12px"; // standard
	}
};

export const sortData = <T extends Record<string, unknown>>(data: T[], orderBy: string, order: "asc" | "desc"): T[] => {
	return [...data].sort((a, b) => {
		if (!orderBy) return 0;
		const aVal = a[orderBy];
		const bVal = b[orderBy];

		// Type guard for comparison
		if (typeof aVal === "string" && typeof bVal === "string") {
			return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		if (typeof aVal === "number" && typeof bVal === "number") {
			return order === "asc" ? aVal - bVal : bVal - aVal;
		}

		if (aVal instanceof Date && bVal instanceof Date) {
			return order === "asc" ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
		}

		return 0;
	});
};
