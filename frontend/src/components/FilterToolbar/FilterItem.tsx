import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Tooltip } from "@mui/material";
import type { FilterConfig } from "./types";

interface FilterItemProps {
 filter: FilterConfig;
 disabled?: boolean;
 showVisibilityButton?: boolean;
 onVisibilityToggle?: (filterId: string) => void;
 size?: number; // Size in percentage
}

function FilterItem({ filter, disabled = false, showVisibilityButton = false, onVisibilityToggle, size }: FilterItemProps) {
 const renderInput = () => {
  switch (filter.type) {
   case "custom": {
    if (!filter.customComponent) {
     return <TextField fullWidth size='small' label={filter.label} disabled value='Custom component not provided' />;
    }
    const CustomComponent = filter.customComponent;
    return <CustomComponent value={filter.value} onChange={filter.onChange} disabled={disabled} label={filter.label} />;
   }

   case "select":
    return (
     <FormControl fullWidth size='small' disabled={disabled}>
      <InputLabel>{filter.label}</InputLabel>
      <Select value={filter.value || ""} label={filter.label} onChange={(e) => filter.onChange(e.target.value || undefined)}>
       <MenuItem value=''>All</MenuItem>
       {filter.options?.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
         {opt.label}
        </MenuItem>
       ))}
      </Select>
     </FormControl>
    );

   case "number":
   case "text":
   case "date":
    return (
     <TextField
      fullWidth
      size='small'
      label={filter.label}
      type={filter.type}
      value={filter.value || ""}
      disabled={disabled}
      onChange={(e) => {
       const val = e.target.value;
       filter.onChange(val ? (filter.type === "number" ? parseInt(val) : val) : undefined);
      }}
     />
    );

   default:
    return null;
  }
 };

 return (
  <Box
   sx={{
    position: "relative",
    flex: size ? `0 0 calc(${size}% - 12px)` : "0 0 auto",
    minWidth: 100,
    maxWidth: "100%",
   }}
  >
   {showVisibilityButton && onVisibilityToggle && (
    <Tooltip title={filter.visible ? "Hide from toolbar" : "Show in toolbar"}>
     <IconButton
      size='small'
      onClick={() => onVisibilityToggle(filter.id)}
      sx={{
       position: "absolute",
       right: 8,
       top: -8,
       zIndex: 1,
       bgcolor: "background.paper",
       "&:hover": { bgcolor: "action.hover" },
      }}
     >
      {filter.visible ? <Visibility fontSize='small' color='primary' /> : <VisibilityOff fontSize='small' color='action' />}
     </IconButton>
    </Tooltip>
   )}
   {renderInput()}
  </Box>
 );
}

export default FilterItem;
