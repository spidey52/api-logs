import { FilterList } from "@mui/icons-material";
import { Badge, Box, Button, Stack, Typography } from "@mui/material";
import FilterItem from "./FilterItem";
import type { FilterConfig } from "./types";

interface FilterToolbarContentProps {
 title: string;
 visibleFilters: FilterConfig[];
 appliedFilterCount: number;
 onOpenDrawer: () => void;
 actions?: React.ReactNode;
}

export default function FilterToolbarContent({ title, visibleFilters, appliedFilterCount, onOpenDrawer, actions }: FilterToolbarContentProps) {
 return (
  <Stack direction='row' spacing={1.5} alignItems='center' sx={{ flexWrap: "nowrap", minHeight: 48 }}>
   <Typography variant='subtitle1' sx={{ minWidth: 100, flexShrink: 0, fontWeight: 600 }}>
    {title}
   </Typography>

   <Box sx={{ flex: 1 }} />

   <Stack direction='row' spacing={1.5} alignItems='center' sx={{ flexShrink: 0 }}>
    {visibleFilters.map((filter) => {
     const size = filter.size || 1;
     // Calculate width based on size ratio (0.5-5 maps to widths, ~100px per unit)
     const baseWidth = 100;
     const width = Math.round(baseWidth * size + 50); // Base formula: 50 + (size * 100)

     return (
      <Box key={filter.id} sx={{ minWidth: width, maxWidth: width }}>
       <FilterItem filter={filter} />
      </Box>
     );
    })}
    <Badge badgeContent={appliedFilterCount} color='primary' max={99}>
     <Button variant='outlined' startIcon={<FilterList />} onClick={onOpenDrawer} size='small'>
      Filters
     </Button>
    </Badge>
    {actions}
   </Stack>
  </Stack>
 );
}
