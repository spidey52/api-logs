import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import { useStore } from "@tanstack/react-store";
import { useMemo, useState } from "react";
import { columnVisibilityStore, getColumnOrder, isColumnVisible, setColumnOrder } from "../../store/columnVisibilityStore";
import { ColumnVisibilityButton, ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import DataTableRow from "./DataTableRow";
import DataTableSkeletonRow from "./DataTableSkeletonRow";
import SortableHeaderCell from "./SortableHeaderCell";
import type { DataTableProps, SortOrder } from "./types";
import { getCellPadding, getRowHeight, sortData } from "./utils";

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
 showIndex = true,
}: DataTableProps<T>) {
 const [orderBy, setOrderBy] = useState<string>("");
 const [order, setOrder] = useState<SortOrder>("asc");
 const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

 // DnD sensors
 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: {
    distance: 8,
   },
  }),
  useSensor(KeyboardSensor),
 );

 // Subscribe to column visibility store
 useStore(columnVisibilityStore);

 // Get column order and apply it
 const defaultColumnOrder = columns.map((col) => col.id);
 const columnOrder = getColumnOrder(pageKey || "default", defaultColumnOrder);

 // Reorder columns based on stored order
 const orderedColumns = useMemo(() => {
  const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
  return [...columns].sort((a, b) => {
   const aIndex = orderMap.get(a.id) ?? Infinity;
   const bIndex = orderMap.get(b.id) ?? Infinity;
   return aIndex - bIndex;
  });
 }, [columns, columnOrder]);

 // Filter visible columns
 const visibleColumns = orderedColumns.filter((col) => isColumnVisible(pageKey, col.id));

 const rowHeight = getRowHeight(density);
 const cellPadding = getCellPadding(density);

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

 const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
   const oldIndex = columnOrder.indexOf(active.id as string);
   const newIndex = columnOrder.indexOf(over.id as string);

   if (oldIndex !== -1 && newIndex !== -1) {
    const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
    setColumnOrder(pageKey || "default", newOrder);
   }
  }
 };

 const sortedData = sortData(data, orderBy, order);

 // page is 1-based in your usage; normalize to zero-based index for calculations

 return (
  <Paper sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
   <TableContainer sx={{ flex: 1, overflow: "auto" }}>
    <Table stickyHeader={stickyHeader}>
     <TableHead>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
       <SortableContext items={visibleColumns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
        <TableRow sx={{ height: rowHeight }}>
         {showIndex && (
          <TableCell
           align='center'
           sx={{
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"),
            padding: cellPadding,
            fontWeight: 600,
            minWidth: 40,
            width: 40,
           }}
          >
           #
          </TableCell>
         )}
         {visibleColumns.map((column) => (
          <SortableHeaderCell key={column.id} column={column} orderBy={orderBy} order={order} density={density} onSort={handleSort} />
         ))}
         {actions && actions.length > 0 && (
          <TableCell
           align='right'
           style={{ minWidth: 120 }}
           sx={{
            //  bgcolor: "grey.100",
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"),
            borderRight: 1,
            borderColor: "divider",
            fontWeight: 600,
            padding: cellPadding,
           }}
          >
           Actions
          </TableCell>
         )}
         <TableCell
          align='center'
          style={{ width: 100 }}
          sx={{
           bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"),
           padding: cellPadding,
          }}
         >
          <ColumnVisibilityButton onClick={(e) => setColumnMenuAnchor(e.currentTarget)} />
         </TableCell>
        </TableRow>
       </SortableContext>
      </DndContext>
     </TableHead>
     <TableBody>
      {loading ? (
       // Loading skeletons
       Array.from({ length: rowsPerPage }).map((_, index) => (
        <TableRow key={`skeleton-${index}`} sx={{ height: rowHeight }}>
         <DataTableSkeletonRow columnCount={visibleColumns.length + (showIndex ? 1 : 0)} hasActions={!!actions && actions.length > 0} density={density} />
        </TableRow>
       ))
      ) : sortedData.length === 0 ? (
       // Empty state
       <TableRow sx={{ height: rowHeight }}>
        <TableCell colSpan={visibleColumns.length + (showIndex ? 1 : 0) + (actions ? 1 : 0) + 1} align='center' sx={{ padding: cellPadding }}>
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
        <TableRow hover key={index} onClick={() => onRowClick?.(row)} sx={{ cursor: onRowClick ? "pointer" : "default", height: rowHeight }}>
         <DataTableRow row={row} columns={visibleColumns} actions={actions} density={density} idx={page * rowsPerPage + index + 1} showIndex={showIndex} />
        </TableRow>
       ))
      )}
     </TableBody>
    </Table>
   </TableContainer>

   {/* Column Visibility Menu */}
   <ColumnVisibilityMenu columns={columns} pageKey={pageKey} anchorEl={columnMenuAnchor} onClose={() => setColumnMenuAnchor(null)} />

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
