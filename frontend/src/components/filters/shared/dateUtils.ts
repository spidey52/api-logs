// Constants
export const DATE_SEPARATOR = " to ";
export const MAX_DATE_LENGTH = 10; // DD-MM-YYYY
export const DATE_VALIDATION = {
	DAY_MAX: 31,
	MONTH_MAX: 12,
	YEAR_MIN: 1900,
	YEAR_MAX: 2100,
} as const;

// Utility: Get current date parts
export const getCurrentDate = () => {
	const now = new Date();
	return {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate(),
	};
};

// Utility: Format today's date for display (DD-MM-YYYY)
export const getTodayFormatted = () => {
	const { year, month, day } = getCurrentDate();
	return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
};

// Utility: Get today as ISO string (YYYY-MM-DD)
export const getTodayISO = () => {
	const { year, month, day } = getCurrentDate();
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Utility: Complete incomplete year based on current year
// Examples (current year = 2025):
//   "4" → 2024, "24" → 2024, "024" → 2024, "2024" → 2024
export const completeYear = (yearPart: string, currentYear: number): number => {
	const yearLength = yearPart.length;
	const parsedYear = parseInt(yearPart);

	// Handle invalid input
	if (!yearPart || isNaN(parsedYear)) return currentYear;

	// Full year - validate range
	if (yearLength === 4) {
		return parsedYear >= DATE_VALIDATION.YEAR_MIN && parsedYear <= DATE_VALIDATION.YEAR_MAX ? parsedYear : currentYear;
	}

	// Partial year - complete with current year prefix
	if (yearLength > 0 && yearLength < 4) {
		const currentYearStr = currentYear.toString();
		const missingDigits = 4 - yearLength;
		const prefix = currentYearStr.substring(0, missingDigits);
		return parseInt(prefix + yearPart);
	}

	return currentYear;
};

// Parse partial date input and complete it with defaults
export const parsePartialDate = (input: string): string | null => {
	if (!input?.trim()) return null;

	const cleaned = input.replace(/[^\d-]/g, "");
	const parts = cleaned.split("-").filter((p) => p !== "");
	if (parts.length === 0) return null;

	const { year: currentYear, month: currentMonth, day: currentDay } = getCurrentDate();

	let day: number;
	let month: number;
	let year: number;

	if (parts.length === 1) {
		day = parseInt(parts[0]) || currentDay;
		month = currentMonth;
		year = currentYear;
	} else if (parts.length === 2) {
		day = parseInt(parts[0]) || currentDay;
		month = parseInt(parts[1]) || currentMonth;
		year = currentYear;
	} else {
		day = parseInt(parts[0]) || currentDay;
		month = parseInt(parts[1]) || currentMonth;
		year = completeYear(parts[2], currentYear);
	}

	// Clamp values to valid ranges
	month = Math.max(1, Math.min(DATE_VALIDATION.MONTH_MAX, month));
	day = Math.max(1, Math.min(DATE_VALIDATION.DAY_MAX, day));

	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Convert ISO date (YYYY-MM-DD) to display format (DD-MM-YYYY)
export const formatForDisplay = (date: string): string => {
	if (!date) return "";
	const [year, month, day] = date.split("-");
	return `${day}-${month}-${year}`;
};

// Validate individual date parts (day, month, year)
export const validateDatePart = (parts: string[], originalPart: string): string | null => {
	// Validate day
	if (parts[0]?.length > 0) {
		const day = parseInt(parts[0]);
		if (isNaN(day) || day === 0 || (parts[0].length === 2 && day > DATE_VALIDATION.DAY_MAX)) {
			return originalPart;
		}
	}

	// Validate month
	if (parts[1]?.length > 0) {
		const month = parseInt(parts[1]);
		if (isNaN(month) || month === 0 || (parts[1].length === 2 && month > DATE_VALIDATION.MONTH_MAX)) {
			return originalPart;
		}
	}

	// Validate year
	if (parts[2]?.length > 0) {
		const year = parseInt(parts[2]);
		const isComplete = parts[2].length === 4;
		if (isNaN(year) || year === 0 || (isComplete && (year < DATE_VALIDATION.YEAR_MIN || year > DATE_VALIDATION.YEAR_MAX))) {
			return originalPart;
		}
	}

	return null; // Valid
};

// Format a single date part with proper structure and validation
export const formatDatePart = (part: string): string => {
	// Remove non-digit and non-hyphen characters
	let cleaned = part.replace(/[^\d-]/g, "").substring(0, MAX_DATE_LENGTH);

	// Auto-insert hyphens at correct positions
	if (cleaned.length >= 3 && cleaned[2] !== "-") {
		cleaned = cleaned.substring(0, 2) + "-" + cleaned.substring(2).replace(/-/g, "");
	}
	if (cleaned.length >= 6 && cleaned[5] !== "-") {
		const parts = cleaned.split("-");
		if (parts.length >= 2) {
			cleaned = `${parts[0]}-${parts[1].substring(0, 2)}-${parts[1].substring(2)}${parts[2] || ""}`;
		}
	}

	// Enforce max length per segment: DD (2), MM (2), YYYY (4)
	const parts = cleaned.split("-");
	parts[0] = parts[0]?.substring(0, 2) || "";
	parts[1] = parts[1]?.substring(0, 2) || "";
	parts[2] = parts[2]?.substring(0, 4) || "";
	cleaned = parts.filter((p) => p !== "").join("-");

	// Final length enforcement
	cleaned = cleaned.substring(0, MAX_DATE_LENGTH);

	// Validate and return previous state if invalid
	const validationError = validateDatePart(parts, part);
	return validationError || cleaned;
};
