import { CalendarToday, Clear } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { CustomFilterProps } from "../FilterToolbar";
import { formatDatePart, formatForDisplay, getTodayFormatted, getTodayISO, parsePartialDate } from "./shared/dateUtils";

export default function DateFilter({ value, onChange, disabled }: CustomFilterProps) {
 const dateValue = value ? (value as string) : "";
 const [input, setInput] = useState(() => (dateValue ? formatForDisplay(dateValue) : ""));
 const [infoAnchor, setInfoAnchor] = useState<HTMLButtonElement | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.ctrlKey && e.key === "d" && !e.shiftKey) {
    e.preventDefault();
    inputRef.current?.focus();
   }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, []);

 // Handle input changes with validation and formatting
 const handleChange = (rawInput: string) => {
  const sanitized = formatDatePart(rawInput);
  setInput(sanitized);
 };

 // On blur, parse and complete the date, then convert to ISO format
 const handleBlur = () => {
  if (!input.trim()) {
   onChange("");
   setInput("");
   return;
  }

  const parsed = parsePartialDate(input);
  if (parsed) {
   onChange(parsed); // Output as ISO (YYYY-MM-DD)
   setInput(formatForDisplay(parsed)); // Display as DD-MM-YYYY
  } else {
   // Invalid input, clear it
   onChange("");
   setInput("");
  }
 };

 // Insert today's date on Enter key
 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
   e.preventDefault();
   const today = getTodayISO();
   onChange(today);
   setInput(getTodayFormatted());
  }
 };

 const handleClear = () => {
  onChange("");
  setInput("");
  inputRef.current?.focus();
 };

 const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  setInfoAnchor(e.currentTarget);
 };

 const handleInfoClose = () => {
  setInfoAnchor(null);
 };

 return (
  <>
   <TextField
    inputRef={inputRef}
    placeholder='DD-MM-YYYY'
    value={input}
    onChange={(e) => handleChange(e.target.value)}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
    disabled={disabled}
    size='small'
    sx={{ width: "100%" }}
    slotProps={{
     input: {
      startAdornment: (
       <InputAdornment position='start'>
        <IconButton size='small' onClick={handleInfoClick} edge='start'>
         <CalendarToday fontSize='small' />
        </IconButton>
       </InputAdornment>
      ),
      endAdornment: input && (
       <InputAdornment position='end'>
        <IconButton size='small' onClick={handleClear} edge='end'>
         <Clear fontSize='small' />
        </IconButton>
       </InputAdornment>
      ),
     },
    }}
   />
   <Popover
    open={Boolean(infoAnchor)}
    anchorEl={infoAnchor}
    onClose={handleInfoClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    transformOrigin={{ vertical: "top", horizontal: "left" }}
   >
    <Box sx={{ p: 2, maxWidth: 300 }}>
     <Stack spacing={1}>
      <Typography variant='subtitle2'>Date Format</Typography>
      <Typography variant='body2'>Enter dates as DD-MM-YYYY</Typography>
      <Typography variant='caption' color='text.secondary'>
       Examples:
      </Typography>
      <Typography variant='caption' component='div' color='text.secondary'>
       • <strong>25</strong> → 25-{new Date().getMonth() + 1}-{new Date().getFullYear()}
       <br />• <strong>25-12</strong> → 25-12-{new Date().getFullYear()}
       <br />• <strong>25-12-24</strong> → 25-12-2024
       <br />• <strong>Enter key</strong> → Today's date
      </Typography>
      <Typography variant='caption' color='text.secondary'>
       Keyboard shortcut: <strong>Ctrl+D</strong>
      </Typography>
     </Stack>
    </Box>
   </Popover>
  </>
 );
}
