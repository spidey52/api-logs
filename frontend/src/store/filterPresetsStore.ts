import { Store } from "@tanstack/react-store";

export interface FilterPreset {
	id: string;
	name: string;
	filters: Record<string, unknown>;
	pageKey: string;
	createdAt: string;
}

interface FilterPresetsState {
	presets: FilterPreset[];
}

const STORAGE_KEY = "filterPresets";

// Load from localStorage
const loadPresets = (): FilterPreset[] => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
};

// Save to localStorage
const savePresets = (presets: FilterPreset[]) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
	} catch (error) {
		console.error("Failed to save filter presets:", error);
	}
};

export const filterPresetsStore = new Store<FilterPresetsState>({
	presets: loadPresets(),
});

export const saveFilterPreset = (name: string, filters: Record<string, unknown>, pageKey: string) => {
	const currentPresets = filterPresetsStore.state.presets;
	const existingIndex = currentPresets.findIndex((p) => p.name === name && p.pageKey === pageKey);

	let updatedPresets: FilterPreset[];
	let preset: FilterPreset;

	if (existingIndex !== -1) {
		// Update existing preset
		preset = {
			...currentPresets[existingIndex],
			filters,
			createdAt: new Date().toISOString(),
		};
		updatedPresets = [...currentPresets];
		updatedPresets[existingIndex] = preset;
	} else {
		// Create new preset
		preset = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			name,
			filters,
			pageKey,
			createdAt: new Date().toISOString(),
		};
		updatedPresets = [...currentPresets, preset];
	}

	filterPresetsStore.setState(() => ({ presets: updatedPresets }));
	savePresets(updatedPresets);

	return preset;
};

export const deleteFilterPreset = (id: string) => {
	const currentPresets = filterPresetsStore.state.presets;
	const updatedPresets = currentPresets.filter((p) => p.id !== id);

	filterPresetsStore.setState(() => ({ presets: updatedPresets }));
	savePresets(updatedPresets);
};

export const getPresetsForPage = (pageKey: string): FilterPreset[] => {
	return filterPresetsStore.state.presets.filter((p) => p.pageKey === pageKey);
};

export const updateFilterPreset = (id: string, updates: Partial<FilterPreset>) => {
	const currentPresets = filterPresetsStore.state.presets;
	const updatedPresets = currentPresets.map((p) => (p.id === id ? { ...p, ...updates } : p));

	filterPresetsStore.setState(() => ({ presets: updatedPresets }));
	savePresets(updatedPresets);
};
