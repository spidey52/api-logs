import { ViewColumn } from "@mui/icons-material";
import { Box, Checkbox, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { isColumnVisible, toggleColumn } from "../../store/columnVisibilityStore";
import type { Column } from "./types";

interface ColumnVisibilityMenuProps<T> {
 columns: Column<T>[];
 pageKey: string;
 anchorEl: HTMLElement | null;
 onClose: () => void;
}

export function ColumnVisibilityMenu<T>({ columns, pageKey, anchorEl, onClose }: ColumnVisibilityMenuProps<T>) {
 return (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
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
 );
}

interface ColumnVisibilityButtonProps {
 onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ColumnVisibilityButton({ onClick }: ColumnVisibilityButtonProps) {
 return (
  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
   <Tooltip title='Show/Hide Columns'>
    <IconButton size='small' onClick={onClick}>
     <ViewColumn fontSize='small' />
    </IconButton>
   </Tooltip>
  </Box>
 );
}
