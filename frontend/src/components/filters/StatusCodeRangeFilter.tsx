import { FormControl, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import type { CustomFilterProps } from "../FilterToolbar";

const STATUS_RANGES = [
 { value: "all", label: "All Status Codes", min: undefined, max: undefined },
 { value: "1xx", label: "1xx - Informational", min: 100, max: 199 },
 { value: "2xx", label: "2xx - Success", min: 200, max: 299 },
 { value: "3xx", label: "3xx - Redirection", min: 300, max: 399 },
 { value: "4xx", label: "4xx - Client Error", min: 400, max: 499 },
 { value: "5xx", label: "5xx - Server Error", min: 500, max: 599 },
 { value: "custom", label: "Custom Range", min: undefined, max: undefined },
];

export default function StatusCodeRangeFilter({ value, onChange, disabled }: CustomFilterProps) {
 // Parse value: format is "min-max" or "exact" or empty
 const parseValue = () => {
  if (!value || value === "") return { mode: "all", min: "", max: "" };

  const strValue = String(value);

  // Check if it's a range
  if (strValue.includes("-")) {
   const [min, max] = strValue.split("-");
   // Match with predefined ranges
   const range = STATUS_RANGES.find((r) => r.min?.toString() === min && r.max?.toString() === max);
   if (range) {
    return { mode: range.value, min, max };
   }
   return { mode: "custom", min, max };
  }

  // Single exact value
  return { mode: "exact", min: strValue, max: strValue };
 };

 const { mode, min, max } = parseValue();

 const handleModeChange = (newMode: string) => {
  const range = STATUS_RANGES.find((r) => r.value === newMode);
  if (!range) return;

  if (newMode === "all") {
   onChange(undefined);
  } else if (newMode === "custom") {
   // Keep current values or set empty
   if (min && max) {
    onChange(`${min}-${max}`);
   } else {
    onChange(undefined);
   }
  } else if (range.min && range.max) {
   onChange(`${range.min}-${range.max}`);
  }
 };

 const handleCustomRangeChange = (newMin: string, newMax: string) => {
  if (newMin && newMax) {
   onChange(`${newMin}-${newMax}`);
  } else if (newMin && !newMax) {
   onChange(newMin);
  } else {
   onChange(undefined);
  }
 };

 return (
  <Stack spacing={1}>
   <FormControl fullWidth size='small' disabled={disabled}>
    <Select value={mode === "exact" ? "custom" : mode} onChange={(e) => handleModeChange(e.target.value)} displayEmpty>
     {STATUS_RANGES.map((range) => (
      <MenuItem key={range.value} value={range.value}>
       {range.label}
      </MenuItem>
     ))}
    </Select>
   </FormControl>

   {mode === "custom" && (
    <Stack direction='row' spacing={1} alignItems='center'>
     <TextField size='small' label='Min' type='number' value={min} disabled={disabled} onChange={(e) => handleCustomRangeChange(e.target.value, max)} sx={{ flex: 1 }} />
     <Typography variant='body2' color='text.secondary'>
      to
     </Typography>
     <TextField
      size='small'
      label='Max'
      type='number'
      value={max}
      disabled={disabled}
      onChange={(e) => handleCustomRangeChange(min, e.target.value)}
      inputProps={{ min: 100, max: 599 }}
      sx={{ flex: 1 }}
     />
    </Stack>
   )}

   {/* {value && value !== "" && (
    <Box>
     {mode === "custom" || mode === "exact" ? (
      <Chip label={min === max ? `Status: ${min}` : `Status: ${min} - ${max}`} size='small' color={getStatusColor(min)} />
     ) : (
      <Chip label={STATUS_RANGES.find((r) => r.value === mode)?.label} size='small' color={getStatusColor(min)} />
     )}
    </Box>
   )} */}
  </Stack>
 );
}
