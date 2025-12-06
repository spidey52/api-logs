import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Box } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import FilterDrawer from "./FilterDrawer";
import FilterToolbarContent from "./FilterToolbarContent";
import type { FilterConfig, FilterToolbarProps } from "./types";
import { buildSearchParams, countAppliedFilters, getVisibleFilters } from "./utils";

export default function FilterToolbar({ title, filters, onVisibilityToggle, onReorder, onSizeChange, onClearAll, maxToolbarUnits = 12, actions, syncWithUrl = true, urlPath }: FilterToolbarProps) {
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

  const params = buildSearchParams(filters, currentSearch);

  navigate({
   to: urlPath,
   search: params,
   replace: true,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [filters, syncWithUrl, urlPath]);

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

 const visibleInToolbar = getVisibleFilters(localFilters, maxToolbarUnits);
 const appliedFilterCount = countAppliedFilters(localFilters);

 return (
  <>
   <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
    <FilterToolbarContent title={title} visibleFilters={visibleInToolbar} appliedFilterCount={appliedFilterCount} onOpenDrawer={() => setDrawerOpen(true)} actions={actions} />
   </Box>

   <FilterDrawer
    open={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    filters={localFilters}
    editMode={editMode}
    onEditModeChange={setEditMode}
    appliedFilterCount={appliedFilterCount}
    onClearAll={onClearAll}
    onDragEnd={handleDragEnd}
    onVisibilityToggle={onVisibilityToggle}
    onSizeChange={onSizeChange}
    maxToolbarUnits={maxToolbarUnits}
   />
  </>
 );
}
