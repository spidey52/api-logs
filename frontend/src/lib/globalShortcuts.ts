import type { KeyboardShortcut } from "./keyboardRegistry";

/**
 * Global keyboard shortcuts used across the application
 * These are centralized for easy management and documentation
 */

export const GLOBAL_SHORTCUTS = {
	// Navigation shortcuts
	TOGGLE_SIDEBAR: {
		key: "b",
		ctrl: true,
		description: "Toggle sidebar",
	},
	GO_TO_DASHBOARD: {
		key: "1",
		ctrl: true,
		description: "Go to Dashboard",
	},
	GO_TO_PROJECTS: {
		key: "2",
		ctrl: true,
		description: "Go to Projects",
	},
	GO_TO_LOGS: {
		key: "3",
		ctrl: true,
		description: "Go to Logs",
	},
	GO_TO_USERS: {
		key: "4",
		ctrl: true,
		description: "Go to Users",
	},

	// Search and filter shortcuts
	FOCUS_SEARCH: {
		key: "k",
		ctrl: true,
		description: "Focus search/filter",
	},
	CLEAR_FILTERS: {
		key: "l",
		ctrl: true,
		description: "Clear all filters",
	},

	// Table shortcuts
	TOGGLE_COLUMN_VISIBILITY: {
		key: "h",
		ctrl: true,
		shift: true,
		description: "Toggle column visibility menu",
	},
	TOGGLE_DENSITY: {
		key: "d",
		ctrl: true,
		shift: true,
		description: "Toggle density menu",
	},

	// Filter toolbar shortcuts
	TOGGLE_FILTER_EDIT_MODE: {
		key: "e",
		ctrl: true,
		shift: true,
		description: "Toggle filter edit mode",
	},
	OPEN_FILTER_DRAWER: {
		key: "f",
		ctrl: true,
		shift: true,
		description: "Open filter drawer",
	},

	// General shortcuts
	ESCAPE: {
		key: "escape",
		description: "Close dialogs/drawers",
	},
	REFRESH: {
		key: "r",
		ctrl: true,
		description: "Refresh current page",
	},
} as const satisfies Record<string, Omit<KeyboardShortcut, "handler">>;

/**
 * Get a keyboard shortcut configuration by name
 */
export function getShortcut(name: keyof typeof GLOBAL_SHORTCUTS): Omit<KeyboardShortcut, "handler"> {
	return GLOBAL_SHORTCUTS[name];
}
