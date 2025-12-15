import { Box, IconButton, TableCell, Tooltip } from "@mui/material";
import type { DataTableAction, DensityType } from "./types";
import { getCellPadding } from "./utils";

interface DataTableRowProps<T> {
 row: T;
 columns: { id: string; align?: "left" | "right" | "center"; format?: (value: unknown, row: T) => React.ReactNode }[];
 actions?: DataTableAction<T>[];
 density: DensityType;
 idx?: number;
 showIndex?: boolean;
}

export default function DataTableRow<T extends Record<string, unknown>>({ row, columns, actions, density, idx, showIndex }: DataTableRowProps<T>) {
 return (
  <>
   {showIndex && (
    <TableCell align='left' sx={{ padding: getCellPadding(density), fontWeight: 500, width: 40, minWidth: 40 }}>
     {idx}
    </TableCell>
   )}

   {columns.map((column) => {
    const value = row[column.id];
    return (
     <TableCell key={column.id} align={column.align} sx={{ padding: getCellPadding(density) }}>
      {column.format ? column.format(value, row) : (value as React.ReactNode)}
     </TableCell>
    );
   })}
   {actions && actions.length > 0 && (
    <TableCell align='right' sx={{ padding: getCellPadding(density) }}>
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
         sx={{
          color: action.color ? undefined : "text.secondary",
          "&:hover": {
           bgcolor: "action.hover",
          },
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
  </>
 );
}
