import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, TableCell, TableSortLabel } from "@mui/material";
import type { Column, DensityType, SortOrder } from "./types";
import { getCellPadding } from "./utils";

interface SortableHeaderCellProps<T> {
 column: Column<T>;
 orderBy: string;
 order: SortOrder;
 density: DensityType;
 onSort: (columnId: string) => void;
}

export default function SortableHeaderCell<T>({ column, orderBy, order, density, onSort }: SortableHeaderCellProps<T>) {
 const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({ id: column.id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
 };

 return (
  <TableCell
   ref={setNodeRef}
   style={{ ...style, minWidth: column.minWidth }}
   align={column.align}
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
   <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
    <Box
     ref={setActivatorNodeRef}
     {...attributes}
     {...listeners}
     sx={{
      display: "flex",
      alignItems: "center",
      cursor: "grab",
      color: "text.secondary",
      "&:active": {
       cursor: "grabbing",
      },
      "&:hover": {
       color: "text.primary",
      },
     }}
    >
     <DragIndicatorIcon fontSize='small' />
    </Box>
    {column.sortable !== false ? (
     <TableSortLabel active={orderBy === column.id} direction={orderBy === column.id ? order : "asc"} sx={{ flex: 1 }}>
      {column.label}
     </TableSortLabel>
    ) : (
     <Box sx={{ flex: 1 }}>{column.label}</Box>
    )}
   </Box>
  </TableCell>
 );
}
