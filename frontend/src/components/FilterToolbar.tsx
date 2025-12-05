import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClearAll, Close, DragIndicator, Edit, FilterList, Visibility, VisibilityOff } from "@mui/icons-material";
import { Badge, Box, Button, Chip, Drawer, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import FilterItem from "./FilterItem";

export interface FilterConfig {
 id: string;
 label: string;
 type: "select" | "text" | "number" | "date";
 value: string | number | undefined;
 options?: { value: string; label: string }[];
 onChange: (value: string | number | undefined) => void;
 visible?: boolean; // Controls visibility in toolbar
 size?: 1 | 2 | 3 | 4; // Size ratio (1 = smallest, 4 = largest)
}

interface FilterToolbarProps {
 title: string;
 filters: FilterConfig[];
 onVisibilityToggle?: (filterId: string) => void;
 onReorder?: (newOrder: FilterConfig[]) => void;
 onClearAll?: () => void;
 maxToolbarUnits?: number; // Maximum units that fit in toolbar (default 12)
 actions?: React.ReactNode;
 syncWithUrl?: boolean; // Enable URL query parameter sync (default: true)
 urlPath?: string; // Path for navigation (e.g., '/logs', '/users')
}

// Sortable wrapper for drag-and-drop functionality
interface SortableFilterItemProps {
 filter: FilterConfig;
 disabled?: boolean;
 onVisibilityToggle?: (filterId: string) => void;
}

function SortableFilterItem({ filter, disabled, onVisibilityToggle }: SortableFilterItemProps) {
 const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: filter.id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
 };

 const inEditMode = disabled; // disabled prop indicates edit mode
 const inputDisabled = inEditMode; // In edit mode, disable input editing

 return (
  <Box ref={setNodeRef} style={style} sx={{ mb: 2.5 }}>
   {inEditMode ? (
    // Edit Mode: Card-style layout
    <Paper
     variant='outlined'
     sx={{
      p: 2,
      bgcolor: filter.visible ? "primary.50" : "action.hover",
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
        <Chip label={`Size: ${filter.size || 1}`} size='small' color={filter.visible ? "primary" : "default"} variant='filled' sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }} />
        {onVisibilityToggle && (
         <IconButton size='small' onClick={() => onVisibilityToggle(filter.id)} color={filter.visible ? "primary" : "default"}>
          {filter.visible ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
         </IconButton>
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

export default function FilterToolbar({ title, filters, onVisibilityToggle, onReorder, onClearAll, maxToolbarUnits = 12, actions, syncWithUrl = true, urlPath }: FilterToolbarProps) {
 const navigate = useNavigate();
 const currentSearch = useSearch({ strict: false }) as Record<string, string | undefined>;

 const [drawerOpen, setDrawerOpen] = useState(false);
 const [editMode, setEditMode] = useState(false);
 const [localFilters, setLocalFilters] = useState<FilterConfig[]>(filters);

 // Update local filters when prop changes
 useEffect(() => {
  setLocalFilters(filters);
 }, [filters]);

 // Sync filters with URL query parameters
 useEffect(() => {
  if (!syncWithUrl || !urlPath) return;

  // Get filter IDs to identify which params are filters
  const filterIds = new Set(filters.map((f) => f.id));

  // Start with current search params (to preserve non-filter params like logId)
  const params: Record<string, string> = {};

  // Copy non-filter params from current search
  Object.entries(currentSearch).forEach(([key, value]) => {
   if (!filterIds.has(key) && value !== undefined) {
    params[key] = value;
   }
  });

  // Add current filter values
  filters.forEach((filter) => {
   if (filter.value !== undefined && filter.value !== null && filter.value !== "") {
    params[filter.id] = String(filter.value);
   }
  });

  navigate({
   to: urlPath,
   search: params,
   replace: true,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [filters, syncWithUrl, urlPath]);

 const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  }),
 );

 // Calculate which filters fit in the toolbar based on visibility and size ratios
 const visibleInToolbar: FilterConfig[] = [];
 let usedUnits = 0;

 // Only show filters marked as visible and that fit
 for (const filter of localFilters) {
  if (filter.visible === false) continue; // Skip hidden filters

  const filterSize = filter.size || 1; // Default size is 2 units
  if (usedUnits + filterSize <= maxToolbarUnits) {
   visibleInToolbar.push(filter);
   usedUnits += filterSize;
  } else {
   break; // Can't fit more filters
  }
 }

 const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
   const oldIndex = localFilters.findIndex((f) => f.id === active.id);
   const newIndex = localFilters.findIndex((f) => f.id === over.id);

   const reordered = arrayMove(localFilters, oldIndex, newIndex);
   setLocalFilters(reordered);
   onReorder?.(reordered);
  }
 };

 const handleClearAll = () => {
  onClearAll?.();
 };

 // Count applied filters (filters with non-empty values)
 const appliedFilterCount = localFilters.filter((filter) => {
  const value = filter.value;
  if (value === undefined || value === null || value === "") return false;
  return true;
 }).length;

 const content = (
  <Stack direction='row' spacing={1.5} alignItems='center' sx={{ flexWrap: "nowrap", minHeight: 48 }}>
   <Typography variant='subtitle1' sx={{ minWidth: 100, flexShrink: 0, fontWeight: 600 }}>
    {title}
   </Typography>

   <Box sx={{ flex: 1 }} />

   <Stack direction='row' spacing={1.5} alignItems='center' sx={{ flexShrink: 0 }}>
    {visibleInToolbar.map((filter) => (
     <Box key={filter.id} sx={{ minWidth: 150, maxWidth: 250 }}>
      <FilterItem filter={filter} />
     </Box>
    ))}
    <Badge badgeContent={appliedFilterCount} color='primary' max={99}>
     <Button variant='outlined' startIcon={<FilterList />} onClick={() => setDrawerOpen(true)} size='small'>
      Filters
     </Button>
    </Badge>
    {actions}
   </Stack>
  </Stack>
 );

 return (
  <>
   <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>{content}</Box>

   {/* Filter Drawer */}
   <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}>
    <Box sx={{ width: 400, height: "100%", display: "flex", flexDirection: "column", mt: 8 }}>
     <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider" }}>
      <Typography variant='h6'>Filters</Typography>
      <Stack direction='row' spacing={1} alignItems='center'>
       <ToggleButtonGroup value={editMode ? "edit" : "view"} exclusive size='small' onChange={(_, value) => value && setEditMode(value === "edit")}>
        <ToggleButton value='view'>
         <Visibility fontSize='small' sx={{ mr: 0.5 }} />
         View
        </ToggleButton>
        <ToggleButton value='edit'>
         <Edit fontSize='small' sx={{ mr: 0.5 }} />
         Edit
        </ToggleButton>
       </ToggleButtonGroup>
       <IconButton onClick={() => setDrawerOpen(false)} size='small'>
        <Close />
       </IconButton>
      </Stack>
     </Box>

     {!editMode && appliedFilterCount > 0 && (
      <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
       <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
        <Typography variant='body2' color='text.secondary'>
         {appliedFilterCount} {appliedFilterCount === 1 ? "filter" : "filters"} applied
        </Typography>
        <Button size='small' startIcon={<ClearAll />} onClick={handleClearAll} color='error' variant='text'>
         Clear All
        </Button>
       </Stack>
      </Box>
     )}

     <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
       {editMode ? "Edit mode: Drag to reorder • Click eye icon to show/hide in toolbar" : "View mode: Apply filters to refine results"}
      </Typography>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
       <SortableContext items={localFilters.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        {localFilters.map((filter) => (
         <SortableFilterItem key={filter.id} filter={filter} disabled={editMode} onVisibilityToggle={onVisibilityToggle} />
        ))}
       </SortableContext>
      </DndContext>
     </Box>
    </Box>
   </Drawer>
  </>
 );
}
