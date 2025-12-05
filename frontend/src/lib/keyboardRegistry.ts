import { useEffect } from "react";

export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean; // Command key on Mac
	description: string;
	handler: (event: KeyboardEvent) => void;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	enabled?: boolean;
}

interface ShortcutRegistration {
	id: string;
	shortcut: KeyboardShortcut;
}

class KeyboardRegistry {
	private shortcuts: Map<string, ShortcutRegistration> = new Map();
	private isListening = false;
	private isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

	/**
	 * Register a keyboard shortcut
	 * @param id - Unique identifier for the shortcut
	 * @param shortcut - Shortcut configuration
	 */
	register(id: string, shortcut: KeyboardShortcut): void {
		this.shortcuts.set(id, { id, shortcut });
		if (!this.isListening) {
			this.startListening();
		}
	}

	/**
	 * Unregister a keyboard shortcut
	 * @param id - Unique identifier for the shortcut to remove
	 */
	unregister(id: string): void {
		this.shortcuts.delete(id);
		if (this.shortcuts.size === 0) {
			this.stopListening();
		}
	}

	/**
	 * Get all registered shortcuts
	 */
	getAllShortcuts(): ShortcutRegistration[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Get a specific shortcut by id
	 */
	getShortcut(id: string): ShortcutRegistration | undefined {
		return this.shortcuts.get(id);
	}

	/**
	 * Check if a shortcut matches the keyboard event
	 */
	private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
		// Normalize key comparison (case-insensitive)
		const eventKey = event.key.toLowerCase();
		const shortcutKey = shortcut.key.toLowerCase();

		if (eventKey !== shortcutKey) return false;

		// On macOS, treat ctrl as meta (Command key)
		const expectsCtrl = shortcut.ctrl || false;
		const expectsMeta = shortcut.meta || false;

		if (this.isMac) {
			// On Mac: ctrl shortcuts should use Command key (meta)
			if (expectsCtrl && !event.metaKey) return false;
			if (expectsMeta && !event.metaKey) return false;
		} else {
			// On Windows/Linux: use ctrl as normal
			if (expectsCtrl !== event.ctrlKey) return false;
			if (expectsMeta !== event.metaKey) return false;
		}

		// Check other modifier keys
		if (!!shortcut.shift !== event.shiftKey) return false;
		if (!!shortcut.alt !== event.altKey) return false;

		return true;
	}

	/**
	 * Handle keyboard events
	 */
	private handleKeyDown = (event: KeyboardEvent): void => {
		// Ignore events from input elements unless explicitly allowed
		const target = event.target as HTMLElement;
		const isInputElement = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

		for (const { shortcut } of this.shortcuts.values()) {
			// Skip disabled shortcuts
			if (shortcut.enabled === false) continue;

			// Skip if event is from input element and shortcut doesn't explicitly allow it
			if (isInputElement && !shortcut.key.includes("escape")) continue;

			if (this.matchesShortcut(event, shortcut)) {
				if (shortcut.preventDefault !== false) {
					event.preventDefault();
				}
				if (shortcut.stopPropagation) {
					event.stopPropagation();
				}

				shortcut.handler(event);
				break; // Only trigger the first matching shortcut
			}
		}
	};

	/**
	 * Start listening for keyboard events
	 */
	private startListening(): void {
		if (!this.isListening) {
			window.addEventListener("keydown", this.handleKeyDown);
			this.isListening = true;
		}
	}

	/**
	 * Stop listening for keyboard events
	 */
	private stopListening(): void {
		if (this.isListening) {
			window.removeEventListener("keydown", this.handleKeyDown);
			this.isListening = false;
		}
	}

	/**
	 * Format shortcut for display (e.g., "Ctrl+Shift+K" or "⌘⇧K" on Mac)
	 */
	formatShortcut(shortcut: KeyboardShortcut): string {
		const parts: string[] = [];

		// On macOS, ctrl shortcuts are mapped to Command key
		if (this.isMac) {
			if (shortcut.ctrl || shortcut.meta) parts.push("⌘");
			if (shortcut.alt) parts.push("⌥");
			if (shortcut.shift) parts.push("⇧");
		} else {
			if (shortcut.ctrl) parts.push("Ctrl");
			if (shortcut.alt) parts.push("Alt");
			if (shortcut.shift) parts.push("Shift");
			if (shortcut.meta) parts.push("Win");
		}

		// Capitalize first letter of key
		parts.push(shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1));

		return parts.join(this.isMac ? "" : "+");
	}

	/**
	 * Clean up all listeners (useful for testing or app teardown)
	 */
	destroy(): void {
		this.stopListening();
		this.shortcuts.clear();
	}
}

// Create singleton instance
export const keyboardRegistry = new KeyboardRegistry();

/**
 * React hook for registering keyboard shortcuts
 * @param id - Unique identifier for the shortcut
 * @param shortcut - Shortcut configuration
 * @param deps - Dependencies array (like useEffect)
 */
export function useKeyboardShortcut(id: string, shortcut: KeyboardShortcut | null, deps: React.DependencyList = []): void {
	useEffect(() => {
		if (!shortcut) return;

		keyboardRegistry.register(id, shortcut);

		return () => {
			keyboardRegistry.unregister(id);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, ...deps]);
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
	return keyboardRegistry.formatShortcut(shortcut);
}
