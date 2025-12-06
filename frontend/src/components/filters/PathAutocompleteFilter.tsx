import { Autocomplete, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CustomFilterProps } from "../FilterToolbar";

export default function PathAutocompleteFilter({ value, onChange, disabled }: CustomFilterProps) {
 // Fetch unique paths from backend
 const { data: pathsData, isLoading } = useQuery({
  queryKey: ["unique-paths"],
  queryFn: async () => {
   const response = await api.get<{ data: string[] }>("logs/paths");
   return response.data.data;
  },
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
 });

 const paths = pathsData || [];

 return (
  <Autocomplete
   options={paths}
   value={value ? String(value) : ""}
   onChange={(_, newValue) => onChange(newValue || undefined)}
   disabled={disabled}
   loading={isLoading}
   renderInput={(params) => (
    <TextField
     {...params}
     placeholder='Select or type path...'
     size='small'
     sx={{
      minWidth: 200,
      "& .MuiInputBase-root": {
       height: 40,
      },
     }}
    />
   )}
   sx={{ flex: 1 }}
  />
 );
}
