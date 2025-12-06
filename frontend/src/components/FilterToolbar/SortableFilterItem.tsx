import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragIndicator, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Chip, IconButton, MenuItem, Paper, Select, Stack, Tooltip, Typography } from "@mui/material";
import FilterItem from "./FilterItem";
import type { FilterConfig } from "./types";

interface SortableFilterItemProps {
 filter: FilterConfig;
 filters?: FilterConfig[];
 disabled?: boolean;
 onVisibilityToggle?: (filterId: string) => void;
 onSizeChange?: (filterId: string, newSize: FilterConfig["size"]) => void;
 maxToolbarUnits?: number;
}

export default function SortableFilterItem({ filter, filters, disabled, onVisibilityToggle, onSizeChange, maxToolbarUnits = 12 }: SortableFilterItemProps) {
 const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: filter.id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
 };

 const inEditMode = disabled; // disabled prop indicates edit mode
 const inputDisabled = inEditMode; // In edit mode, disable input editing

 // Calculate available units for this filter
 const calculateAvailableUnits = (newSize: number): boolean => {
  if (!filters) return true;

  // Calculate total units used by visible filters (excluding current filter)
  const usedUnits = filters.filter((f) => f.visible && f.id !== filter.id).reduce((sum, f) => sum + (f.size || 1), 0);

  // Check if new size would fit
  return usedUnits + newSize <= maxToolbarUnits;
 };

 // Check if this filter can be made visible
 const canToggleVisible = (): boolean => {
  if (!filters) return true;

  // If already visible, can always hide
  if (filter.visible) return true;

  // If hidden, check if showing it would exceed max units
  const currentSize = filter.size || 1;
  return calculateAvailableUnits(currentSize);
 };

 const handleVisibilityToggle = () => {
  if (!onVisibilityToggle) return;

  // Prevent showing if it would exceed max units
  if (!filter.visible && !canToggleVisible()) {
   return;
  }

  onVisibilityToggle(filter.id);
 };

 return (
  <Box ref={setNodeRef} style={style} sx={{ mb: 2.5 }}>
   {inEditMode ? (
    // Edit Mode: Card-style layout
    <Paper
     variant='outlined'
     sx={{
      p: 2,
      bgcolor: (theme) => (filter.visible ? (theme.palette.mode === "dark" ? "primary.900" : "primary.50") : "action.hover"),
      borderColor: filter.visible ? "primary.main" : "divider",
      borderWidth: filter.visible ? 2 : 1,
     }}
    >
     <Stack spacing={1.5}>
      <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
       <Stack direction='row' spacing={1} alignItems='center'>
        <Box {...attributes} {...listeners} sx={{ cursor: "grab", display: "flex", alignItems: "center", color: "text.secondary" }}>
         <DragIndicator fontSize='small' />
        </Box>
        <Typography variant='subtitle2' fontWeight={600}>
         {filter.label}
        </Typography>
       </Stack>
       <Stack direction='row' spacing={1} alignItems='center'>
        {onSizeChange ? (
         <Select
          size='small'
          value={filter.size || 1}
          onChange={(e) => {
           const newSize = Number(e.target.value);
           if (filter.visible && !calculateAvailableUnits(newSize)) {
            return; // Don't allow change if it exceeds max units
           }
           onSizeChange(filter.id, newSize as FilterConfig["size"]);
          }}
          onClick={(e) => e.stopPropagation()}
          sx={{ height: 28, fontSize: "0.75rem", fontWeight: 600, minWidth: 80 }}
         >
          <MenuItem value={0.5} disabled={filter.visible && !calculateAvailableUnits(0.5)}>
           0.5
          </MenuItem>
          <MenuItem value={1} disabled={filter.visible && !calculateAvailableUnits(1)}>
           1
          </MenuItem>
          <MenuItem value={1.5} disabled={filter.visible && !calculateAvailableUnits(1.5)}>
           1.5
          </MenuItem>
          <MenuItem value={2} disabled={filter.visible && !calculateAvailableUnits(2)}>
           2
          </MenuItem>
          <MenuItem value={2.5} disabled={filter.visible && !calculateAvailableUnits(2.5)}>
           2.5
          </MenuItem>
          <MenuItem value={3} disabled={filter.visible && !calculateAvailableUnits(3)}>
           3
          </MenuItem>
          <MenuItem value={3.5} disabled={filter.visible && !calculateAvailableUnits(3.5)}>
           3.5
          </MenuItem>
          <MenuItem value={4} disabled={filter.visible && !calculateAvailableUnits(4)}>
           4
          </MenuItem>
          <MenuItem value={4.5} disabled={filter.visible && !calculateAvailableUnits(4.5)}>
           4.5
          </MenuItem>
          <MenuItem value={5} disabled={filter.visible && !calculateAvailableUnits(5)}>
           5
          </MenuItem>
         </Select>
        ) : (
         <Chip label={`Size: ${filter.size || 1}`} size='small' color={filter.visible ? "primary" : "default"} variant='filled' sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }} />
        )}
        {onVisibilityToggle && (
         <Tooltip title={!filter.visible && !canToggleVisible() ? `Cannot show: exceeds toolbar limit (${maxToolbarUnits} units)` : ""}>
          <span>
           <IconButton size='small' onClick={handleVisibilityToggle} color={filter.visible ? "primary" : "default"} disabled={!filter.visible && !canToggleVisible()}>
            {filter.visible ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
           </IconButton>
          </span>
         </Tooltip>
        )}
       </Stack>
      </Stack>
      <Box sx={{ opacity: 0.6 }}>
       <FilterItem filter={filter} disabled={inputDisabled} showVisibilityButton={false} />
      </Box>
     </Stack>
    </Paper>
   ) : (
    // View Mode: Simple layout
    <Box>
     <FilterItem filter={filter} disabled={inputDisabled} showVisibilityButton={false} />
    </Box>
   )}
  </Box>
 );
}
