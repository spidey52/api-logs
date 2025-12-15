export interface Column<T = unknown> {
	id: string;
	label: string;
	minWidth?: number;
	align?: "left" | "right" | "center";
	sortable?: boolean;
	format?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableAction<T = unknown> {
	icon: React.ReactNode;
	label: string;
	onClick: (row: T) => void;
	color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export interface DataTableProps<T = unknown> {
	columns: Column<T>[];
	data: T[];
	loading?: boolean;
	page?: number;
	rowsPerPage?: number;
	totalRows?: number;
	onPageChange?: (page: number) => void;
	onRowsPerPageChange?: (rowsPerPage: number) => void;
	onRowClick?: (row: T) => void;
	actions?: DataTableAction<T>[];
	emptyMessage?: string;
	stickyHeader?: boolean;
	pageKey: string; // Required for column visibility persistence
	density?: "comfortable" | "standard" | "compact";
	showIndex?: boolean;
}

export type DensityType = "comfortable" | "standard" | "compact";
export type SortOrder = "asc" | "desc";
