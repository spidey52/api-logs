import { TableCell, TableSortLabel } from "@mui/material";
import type { Column, DensityType, SortOrder } from "./types";
import { getCellPadding } from "./utils";

interface DataTableHeaderCellProps<T> {
 column: Column<T>;
 orderBy: string;
 order: SortOrder;
 density: DensityType;
 onSort: (columnId: string) => void;
}

export default function DataTableHeaderCell<T>({ column, orderBy, order, density, onSort }: DataTableHeaderCellProps<T>) {
 return (
  <TableCell
   key={column.id}
   align={column.align}
   style={{ minWidth: column.minWidth }}
   sortDirection={orderBy === column.id ? order : false}
   onClick={() => column.sortable !== false && onSort(column.id)}
   sx={{
    bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"),
    fontWeight: 600,
    cursor: column.sortable !== false ? "pointer" : "default",
    userSelect: "none",
    padding: getCellPadding(density),
    borderRight: 1,
    borderColor: "divider",
    "&:hover":
     column.sortable !== false
      ? {
         bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.700" : "grey.200"),
        }
      : {},
   }}
  >
   {column.sortable !== false ? (
    <TableSortLabel active={orderBy === column.id} direction={orderBy === column.id ? order : "asc"} sx={{ width: "100%" }}>
     {column.label}
    </TableSortLabel>
   ) : (
    column.label
   )}
  </TableCell>
 );
}
