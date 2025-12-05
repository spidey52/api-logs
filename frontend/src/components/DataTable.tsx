import { ViewColumn } from "@mui/icons-material";
import {
	Box,
	Checkbox,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Paper,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Tooltip,
	Typography,
} from "@mui/material";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
import { columnVisibilityStore, isColumnVisible, toggleColumn } from "../store/columnVisibilityStore";

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

interface DataTableProps<T = unknown> {
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
}

export default function DataTable<T extends Record<string, unknown>>({
 columns,
 data,
 loading = false,
 page = 0,
 rowsPerPage = 10,
 totalRows,
 onPageChange,
 onRowsPerPageChange,
 onRowClick,
 actions,
 emptyMessage = "No data available",
 stickyHeader = true,
 pageKey,
 density = "standard",
}: DataTableProps<T>) {
 const [orderBy, setOrderBy] = useState<string>("");
 const [order, setOrder] = useState<"asc" | "desc">("asc");
 const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

 // Subscribe to column visibility store
 useStore(columnVisibilityStore);

 // Filter visible columns and get density
 const visibleColumns = columns.filter((col) => isColumnVisible(pageKey, col.id));
 //  const density = getDensity(pageKey);

 // Calculate row height based on density
 const getRowHeight = () => {
  switch (density) {
   case "comfortable":
    return 64;
   case "compact":
    return 40;
   default:
    return 52; // standard
  }
 };

 const getCellPadding = () => {
  switch (density) {
   case "comfortable":
    return "16px";
   case "compact":
    return "6px";
   default:
    return "12px"; // standard
  }
 };

 const handleSort = (columnId: string) => {
  const isAsc = orderBy === columnId && order === "asc";
  setOrder(isAsc ? "desc" : "asc");
  setOrderBy(columnId);
 };

 const handleChangePage = (_event: unknown, newPage: number) => {
  onPageChange?.(newPage);
 };

 const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  onRowsPerPageChange?.(parseInt(event.target.value, 10));
  onPageChange?.(0);
 };

 const sortedData = [...data].sort((a, b) => {
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

  return 0;
 });

 return (
  <Paper sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
   <TableContainer sx={{ flex: 1, overflow: "auto" }}>
    <Table stickyHeader={stickyHeader}>
     <TableHead>
      <TableRow sx={{ height: getRowHeight() }}>
       {visibleColumns.map((column) => (
        <TableCell
         key={column.id}
         align={column.align}
         style={{ minWidth: column.minWidth }}
         sortDirection={orderBy === column.id ? order : false}
         onClick={() => column.sortable !== false && handleSort(column.id)}
         sx={{
          bgcolor: "grey.100",
          fontWeight: 600,
          cursor: column.sortable !== false ? "pointer" : "default",
          userSelect: "none",
          padding: getCellPadding(),
          "&:hover": column.sortable !== false ? { bgcolor: "grey.200" } : {},
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
       ))}
       {actions && actions.length > 0 && (
        <TableCell align='right' style={{ minWidth: 120 }} sx={{ bgcolor: "grey.100", fontWeight: 600, padding: getCellPadding() }}>
         Actions
        </TableCell>
       )}
       <TableCell align='center' style={{ width: 100 }} sx={{ bgcolor: "grey.100", padding: getCellPadding() }}>
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
         <Tooltip title='Show/Hide Columns'>
          <IconButton size='small' onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
           <ViewColumn fontSize='small' />
          </IconButton>
         </Tooltip>
        </Box>
       </TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {loading ? (
       // Loading skeletons
       Array.from({ length: rowsPerPage }).map((_, index) => (
        <TableRow key={`skeleton-${index}`} sx={{ height: getRowHeight() }}>
         {visibleColumns.map((column) => (
          <TableCell key={column.id} sx={{ padding: getCellPadding() }}>
           <Skeleton animation='wave' />
          </TableCell>
         ))}
         {actions && actions.length > 0 && (
          <TableCell sx={{ padding: getCellPadding() }}>
           <Skeleton animation='wave' />
          </TableCell>
         )}
         <TableCell />
        </TableRow>
       ))
      ) : sortedData.length === 0 ? (
       // Empty state
       <TableRow sx={{ height: getRowHeight() }}>
        <TableCell colSpan={visibleColumns.length + (actions ? 1 : 0) + 1} align='center' sx={{ padding: getCellPadding() }}>
         <Box sx={{ py: 4 }}>
          <Typography variant='body1' color='text.secondary'>
           {emptyMessage}
          </Typography>
         </Box>
        </TableCell>
       </TableRow>
      ) : (
       // Data rows
       sortedData.map((row, index) => (
        <TableRow hover key={index} onClick={() => onRowClick?.(row)} sx={{ cursor: onRowClick ? "pointer" : "default", height: getRowHeight() }}>
         {visibleColumns.map((column) => {
          const value = row[column.id];
          return (
           <TableCell key={column.id} align={column.align} sx={{ padding: getCellPadding() }}>
            {column.format ? column.format(value, row) : (value as React.ReactNode)}
           </TableCell>
          );
         })}
         {actions && actions.length > 0 && (
          <TableCell align='right' sx={{ padding: getCellPadding() }}>
           <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
            {actions.map((action, actionIndex) => (
             <Tooltip key={actionIndex} title={action.label}>
              <IconButton
               size='small'
               color={action.color || "default"}
               onClick={(e) => {
                e.stopPropagation();
                action.onClick(row);
               }}
              >
               {action.icon}
              </IconButton>
             </Tooltip>
            ))}
           </Box>
          </TableCell>
         )}
         <TableCell />
        </TableRow>
       ))
      )}
     </TableBody>
    </Table>
   </TableContainer>

   {/* Column Visibility Menu */}
   <Menu anchorEl={columnMenuAnchor} open={Boolean(columnMenuAnchor)} onClose={() => setColumnMenuAnchor(null)}>
    <MenuItem disabled sx={{ opacity: "1 !important", fontWeight: 600 }}>
     <ListItemText primary='Show/Hide Columns' />
    </MenuItem>
    {columns.map((column) => (
     <MenuItem key={column.id} onClick={() => toggleColumn(pageKey, column.id)} dense>
      <ListItemIcon>
       <Checkbox edge='start' checked={isColumnVisible(pageKey, column.id)} tabIndex={-1} disableRipple size='small' />
      </ListItemIcon>
      <ListItemText primary={column.label} />
     </MenuItem>
    ))}
   </Menu>

   <TablePagination
    rowsPerPageOptions={[5, 10, 25, 50, 100]}
    component='div'
    count={totalRows ?? data.length}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={handleChangePage}
    onRowsPerPageChange={handleChangeRowsPerPage}
   />
  </Paper>
 );
}
