import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { BookmarkBorder, ClearAll, Close, Edit, FilterList, Visibility } from "@mui/icons-material";
import { Box, Button, Drawer, IconButton, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import PresetsPanel from "./PresetsPanel";
import SortableFilterItem from "./SortableFilterItem";
import type { FilterConfig } from "./types";

interface FilterDrawerProps {
 open: boolean;
 onClose: () => void;
 filters: FilterConfig[];
 editMode: boolean;
 onEditModeChange: (editMode: boolean) => void;
 appliedFilterCount: number;
 onClearAll?: () => void;
 onDragEnd: (event: DragEndEvent) => void;
 onVisibilityToggle?: (filterId: string) => void;
 onSizeChange?: (filterId: string, newSize: FilterConfig["size"]) => void;
 maxToolbarUnits?: number;
 // Presets props
 pageKey?: string;
 currentFilters?: Record<string, unknown>;
 onLoadPreset?: (filters: Record<string, unknown>, presetName: string) => void;
 activePresetName?: string | null;
}

export default function FilterDrawer({
 open,
 onClose,
 filters,
 editMode,
 onEditModeChange,
 appliedFilterCount,
 onClearAll,
 onDragEnd,
 onVisibilityToggle,
 onSizeChange,
 maxToolbarUnits = 12,
 pageKey,
 currentFilters,
 onLoadPreset,
 activePresetName,
}: FilterDrawerProps) {
 const [currentTab, setCurrentTab] = useState(0);
 const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  }),
 );

 return (
  <Drawer anchor='right' open={open} onClose={onClose}>
   <Box sx={{ width: 400, height: "100vh", display: "flex", flexDirection: "column" }}>
    {/* Header */}
    <Toolbar />
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider" }}>
     <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} sx={{ flex: 1, minHeight: 48, "& .MuiTab-root": { minHeight: 48, py: 1 } }}>
      <Tab label='Filters' icon={<FilterList fontSize='small' />} iconPosition='start' />
      <Tab label='Presets' icon={<BookmarkBorder fontSize='small' />} iconPosition='start' />
     </Tabs>
     <IconButton onClick={onClose} size='small' sx={{ mr: 1 }}>
      <Close />
     </IconButton>
    </Box>

    {/* Tab Content */}
    {currentTab === 0 ? (
     <>
      {/* Edit Mode Toggle - Only in Filters Tab */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
       <ToggleButtonGroup value={editMode ? "edit" : "view"} exclusive size='small' onChange={(_, value) => value && onEditModeChange(value === "edit")} fullWidth>
        <ToggleButton value='view'>
         <Visibility fontSize='small' sx={{ mr: 0.5 }} />
         View
        </ToggleButton>
        <ToggleButton value='edit'>
         <Edit fontSize='small' sx={{ mr: 0.5 }} />
         Edit
        </ToggleButton>
       </ToggleButtonGroup>
      </Box>

      {/* Applied Filters Banner */}
      {!editMode && appliedFilterCount > 0 && (
       <Box sx={{ px: 2, py: 1.5, bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "action.hover"), borderBottom: 1, borderColor: "divider" }}>
        <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
         <Typography variant='body2' color='text.secondary'>
          {appliedFilterCount} {appliedFilterCount === 1 ? "filter" : "filters"} applied
         </Typography>
         <Button size='small' startIcon={<ClearAll />} onClick={onClearAll} color='error' variant='text'>
          Clear All
         </Button>
        </Stack>
       </Box>
      )}

      {/* Filter List */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2, pb: 4 }}>
       <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        {editMode ? "Edit mode: Drag to reorder • Click eye icon to show/hide in toolbar" : "View mode: Apply filters to refine results"}
       </Typography>

       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filters.map((f) => f.id)} strategy={verticalListSortingStrategy}>
         {filters.map((filter) => (
          <SortableFilterItem
           key={filter.id}
           filter={filter}
           filters={filters}
           disabled={editMode}
           onVisibilityToggle={onVisibilityToggle}
           onSizeChange={onSizeChange}
           maxToolbarUnits={maxToolbarUnits}
          />
         ))}
        </SortableContext>
       </DndContext>
      </Box>
     </>
    ) : (
     <PresetsPanel pageKey={pageKey || ""} currentFilters={currentFilters || {}} onLoadPreset={onLoadPreset || (() => {})} activePresetName={activePresetName || null} />
    )}
   </Box>
  </Drawer>
 );
}
