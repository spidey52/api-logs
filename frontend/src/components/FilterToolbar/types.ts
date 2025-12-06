export interface CustomFilterProps {
	value: string | number | undefined;
	onChange: (value: string | number | undefined) => void;
	disabled?: boolean;
	label: string;
}

export interface FilterConfig {
	id: string;
	label: string;
	type: "select" | "text" | "number" | "date" | "custom";
	value: string | number | undefined;
	options?: { value: string; label: string }[];
	onChange: (value: string | number | undefined) => void;
	visible?: boolean; // Controls visibility in toolbar
	size?: 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5; // Size ratio (0.5 = smallest, 5 = largest)
	customComponent?: React.ComponentType<CustomFilterProps>; // Custom filter component
}

export interface FilterToolbarProps {
	title: string;
	filters: FilterConfig[];
	onVisibilityToggle?: (filterId: string) => void;
	onReorder?: (newOrder: FilterConfig[]) => void;
	onSizeChange?: (filterId: string, newSize: FilterConfig["size"]) => void;
	onClearAll?: () => void;
	maxToolbarUnits?: number; // Maximum units that fit in toolbar (default 12)
	actions?: React.ReactNode;
	syncWithUrl?: boolean; // Enable URL query parameter sync (default: true)
	urlPath?: string; // Path for navigation (e.g., '/logs', '/users')
	// Preset props
	pageKey?: string;
	currentFilters?: Record<string, unknown>;
	onLoadPreset?: (filters: Record<string, unknown>, presetName: string) => void;
	activePresetName?: string | null;
}
