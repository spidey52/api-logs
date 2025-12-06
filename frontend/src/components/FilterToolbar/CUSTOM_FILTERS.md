# Custom Filter Examples

## Basic Usage

You can create custom filters by setting `type: "custom"` and providing a `customComponent`:

```tsx
import { Autocomplete, TextField, Chip, Stack } from "@mui/material";
import type { CustomFilterProps } from "../components/FilterToolbar";

// Example 1: Multi-Select Autocomplete Filter
function MultiSelectFilter({ value, onChange, disabled, label }: CustomFilterProps) {
 const options = ["Option 1", "Option 2", "Option 3"];
 const values = value ? (value as string).split(",") : [];

 return (
  <Autocomplete
   multiple
   size='small'
   options={options}
   value={values}
   disabled={disabled}
   onChange={(_, newValue) => onChange(newValue.length > 0 ? newValue.join(",") : undefined)}
   renderInput={(params) => <TextField {...params} label={label} />}
   renderTags={(value, getTagProps) => value.map((option, index) => <Chip {...getTagProps({ index })} key={option} label={option} size='small' />)}
  />
 );
}

// Example 2: Date Range Filter
function DateRangeFilter({ value, onChange, disabled, label }: CustomFilterProps) {
 const [startDate, endDate] = value ? (value as string).split("|") : ["", ""];

 const handleChange = (start: string, end: string) => {
  if (start && end) {
   onChange(`${start}|${end}`);
  } else {
   onChange(undefined);
  }
 };

 return (
  <Stack direction='row' spacing={1}>
   <TextField
    size='small'
    label={`${label} From`}
    type='date'
    value={startDate}
    disabled={disabled}
    onChange={(e) => handleChange(e.target.value, endDate)}
    InputLabelProps={{ shrink: true }}
    sx={{ flex: 1 }}
   />
   <TextField
    size='small'
    label={`${label} To`}
    type='date'
    value={endDate}
    disabled={disabled}
    onChange={(e) => handleChange(startDate, e.target.value)}
    InputLabelProps={{ shrink: true }}
    sx={{ flex: 1 }}
   />
  </Stack>
 );
}

// Example 3: Slider Filter
import { Slider, Typography } from "@mui/material";

function SliderFilter({ value, onChange, disabled, label }: CustomFilterProps) {
 const numValue = typeof value === "number" ? value : 50;

 return (
  <Stack spacing={1}>
   <Typography variant='caption'>{label}</Typography>
   <Slider
    value={numValue}
    onChange={(_, newValue) => onChange(newValue as number)}
    disabled={disabled}
    valueLabelDisplay='auto'
    min={0}
    max={100}
    marks={[
     { value: 0, label: "0" },
     { value: 50, label: "50" },
     { value: 100, label: "100" },
    ]}
   />
  </Stack>
 );
}

// Usage in FilterToolbar:
const filters: FilterConfig[] = [
 // Standard filters
 {
  id: "status",
  label: "Status",
  type: "select",
  value: statusFilter,
  options: [
   { value: "active", label: "Active" },
   { value: "inactive", label: "Inactive" },
  ],
  onChange: setStatusFilter,
  visible: true,
  size: 2,
 },

 // Custom multi-select filter
 {
  id: "tags",
  label: "Tags",
  type: "custom",
  value: tagsFilter,
  onChange: setTagsFilter,
  customComponent: MultiSelectFilter,
  visible: true,
  size: 3,
 },

 // Custom date range filter
 {
  id: "dateRange",
  label: "Date Range",
  type: "custom",
  value: dateRangeFilter,
  onChange: setDateRangeFilter,
  customComponent: DateRangeFilter,
  visible: true,
  size: 4,
 },

 // Custom slider filter
 {
  id: "priority",
  label: "Priority Level",
  type: "custom",
  value: priorityFilter,
  onChange: setPriorityFilter,
  customComponent: SliderFilter,
  visible: false,
  size: 2,
 },
];
```

## Key Points

1. **CustomFilterProps Interface**: Your custom component must accept these props:
   - `value`: Current filter value
   - `onChange`: Function to update the value
   - `disabled`: Whether the filter is disabled (edit mode)
   - `label`: Filter label

2. **Value Format**: You can store any format in the value (string, number), but you're responsible for:
   - Parsing it in your custom component
   - Serializing it when calling onChange
   - Handling URL sync if needed (convert to string for URL params)

3. **Size**: Custom filters work with the `size` prop just like standard filters

4. **Visibility**: Custom filters support show/hide and reordering like standard filters

5. **Edit Mode**: The `disabled` prop indicates when filters are in edit mode (for reordering)
