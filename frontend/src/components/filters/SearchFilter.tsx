import { Search } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useDebounce } from "../../lib/hooks/useDebounce";
import type { CustomFilterProps } from "../FilterToolbar";

export default function SearchFilter({ value, onChange }: CustomFilterProps) {
 const placeholder = "Search logs...";
 const stringValue = typeof value === "string" ? value : "";
 const [searchText, setSearchText] = useState(stringValue);
 const debouncedSearch = useDebounce(searchText, 500);

 useEffect(() => {
  if (debouncedSearch !== stringValue) {
   onChange(debouncedSearch || undefined);
  }
 }, [debouncedSearch, onChange, stringValue]);

 return (
  <TextField
   size='small'
   fullWidth
   placeholder={placeholder}
   value={searchText}
   onChange={(e) => setSearchText(e.target.value)}
   InputProps={{
    startAdornment: (
     <InputAdornment position='start'>
      <Search fontSize='small' />
     </InputAdornment>
    ),
   }}
  />
 );
}
