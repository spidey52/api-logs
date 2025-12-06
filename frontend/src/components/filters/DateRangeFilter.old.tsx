import { CalendarToday, Clear, Info } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { CustomFilterProps } from "../FilterToolbar";

// Parse partial date input and complete it
const parsePartialDate = (input: string): string | null => {
 if (!input || input.trim() === "") return null;

 // Remove any non-digit characters except hyphens, slashes, and dots
 // Then normalize all separators to hyphens
 const cleaned = input.replace(/[^\d\-/.]/g, "").replace(/[/.]/g, "-");
 const parts = cleaned.split("-").filter((p) => p !== "");
 if (parts.length === 0) return null;

 const now = new Date();
 const currentYear = now.getFullYear();
 const currentMonth = now.getMonth() + 1; // 0-indexed
 const currentDay = now.getDate();

 let day: number;
 let month: number;
 let year: number;

 if (parts.length === 1) {
  // Only day provided (e.g., "15")
  day = parseInt(parts[0]) || currentDay;
  month = currentMonth;
  year = currentYear;
 } else if (parts.length === 2) {
  // Day and month provided (e.g., "15-06" or "4-4")
  day = parseInt(parts[0]) || currentDay;
  month = parseInt(parts[1]) || currentMonth;
  year = currentYear;
 } else {
  // Full date provided (e.g., "15-06-2025")
  day = parseInt(parts[0]) || currentDay;
  month = parseInt(parts[1]) || currentMonth;
  year = parseInt(parts[2]) || currentYear;
 }

 // Validate and adjust
 month = Math.max(1, Math.min(12, month));
 day = Math.max(1, Math.min(31, day));

 // Convert to YYYY-MM-DD format
 const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 return formatted;
}; // Format date from YYYY-MM-DD to DD-MM-YYYY for display
const formatForDisplay = (date: string): string => {
 if (!date) return "";
 const [year, month, day] = date.split("-");
 return `${day}-${month}-${year}`;
};

export default function DateRangeFilter({ value, onChange, disabled }: CustomFilterProps) {
 const [startDate, endDate] = value ? (value as string).split("|") : ["", ""];
 const [input, setInput] = useState(() => {
  if (startDate && endDate) {
   return `${formatForDisplay(startDate)} to ${formatForDisplay(endDate)}`;
  } else if (startDate) {
   return formatForDisplay(startDate);
  }
  return "";
 });
 const [infoAnchor, setInfoAnchor] = useState<HTMLButtonElement | null>(null);
 const prevLength = useRef(0);
 const inputRef = useRef<HTMLInputElement>(null);

 // Keyboard shortcut: Ctrl+D to focus date field
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

 const handleClearStart = () => {
  setStartInput("");
  setIsStartComplete(false);
  prevStartLength.current = 0;
  // If end date exists, keep it; otherwise clear the filter
  if (endInput) {
   const endParsed = parsePartialDate(endInput);
   if (endParsed) {
    onChange(endParsed);
   } else {
    onChange(undefined);
   }
  } else {
   onChange(undefined);
  }
 };

 const handleClearEnd = () => {
  setEndInput("");
  setIsEndComplete(false);
  prevEndLength.current = 0;
  // If start date exists, keep it as single date; otherwise clear the filter
  if (startInput) {
   const startParsed = parsePartialDate(startInput);
   onChange(startParsed || undefined);
  } else {
   onChange(undefined);
  }
 };

 const handleStartChange = (input: string) => {
  // If date was already complete (length 10), clear and start fresh when user types
  if (isStartComplete && startInput.length === 10 && input.length > 0) {
   setIsStartComplete(false);
   setStartInput("");
   prevStartLength.current = 0;
   // Let this keystroke start a new entry
   input = input.slice(-1); // Take only the last character (what user just typed)
  }

  // Only allow numbers and hyphens
  let sanitized = input.replace(/[^\d-]/g, "");

  // Enforce max length: DD-MM-YYYY (10 characters)
  if (sanitized.length > 10) {
   sanitized = sanitized.substring(0, 10);
  }

  // Enforce hyphen at position 3 (after DD)
  if (sanitized.length === 3 && sanitized[2] !== "-") {
   sanitized = sanitized.substring(0, 2) + "-" + sanitized[2];
  }
  // Enforce hyphen at position 6 (after DD-MM)
  if (sanitized.length === 6 && sanitized[5] !== "-") {
   sanitized = sanitized.substring(0, 5) + "-" + sanitized[5];
  }
  // Ensure position 3 is always hyphen if length >= 3
  if (sanitized.length >= 3 && sanitized[2] !== "-") {
   sanitized = sanitized.substring(0, 2) + "-" + sanitized.substring(2).replace(/-/g, "");
  }
  // Ensure position 6 is always hyphen if length >= 6
  if (sanitized.length >= 6 && sanitized[5] !== "-") {
   const parts = sanitized.split("-");
   if (parts.length >= 2) {
    sanitized = parts[0] + "-" + parts[1].substring(0, 2) + "-" + parts[1].substring(2) + (parts[2] || "");
   }
  }

  // Validate parts as user types
  const parts = sanitized.split("-");
  if (parts.length >= 1 && parts[0].length === 2) {
   const day = parseInt(parts[0]);
   if (day === 0 || day > 31) {
    return; // Don't update if invalid day
   }
  }
  if (parts.length >= 2 && parts[1].length === 2) {
   const month = parseInt(parts[1]);
   if (month === 0 || month > 12) {
    return; // Don't update if invalid month
   }
  }
  if (parts.length >= 3 && parts[2].length > 0) {
   const year = parseInt(parts[2]);
   if (parts[2].length === 4 && (year === 0 || year < 1900 || year > 2100)) {
    return; // Don't update if invalid year
   }
  }

  prevStartLength.current = sanitized.length;
  setStartInput(sanitized);
 };

 const handleEndChange = (input: string) => {
  // If date was already complete (length 10), clear and start fresh when user types
  if (isEndComplete && endInput.length === 10 && input.length > 0) {
   setIsEndComplete(false);
   setEndInput("");
   prevEndLength.current = 0;
   // Let this keystroke start a new entry
   input = input.slice(-1); // Take only the last character (what user just typed)
  }

  // Only allow numbers and hyphens
  let sanitized = input.replace(/[^\d-]/g, "");

  // Enforce max length: DD-MM-YYYY (10 characters)
  if (sanitized.length > 10) {
   sanitized = sanitized.substring(0, 10);
  }

  // Enforce hyphen at position 3 (after DD)
  if (sanitized.length === 3 && sanitized[2] !== "-") {
   sanitized = sanitized.substring(0, 2) + "-" + sanitized[2];
  }
  // Enforce hyphen at position 6 (after DD-MM)
  if (sanitized.length === 6 && sanitized[5] !== "-") {
   sanitized = sanitized.substring(0, 5) + "-" + sanitized[5];
  }
  // Ensure position 3 is always hyphen if length >= 3
  if (sanitized.length >= 3 && sanitized[2] !== "-") {
   sanitized = sanitized.substring(0, 2) + "-" + sanitized.substring(2).replace(/-/g, "");
  }
  // Ensure position 6 is always hyphen if length >= 6
  if (sanitized.length >= 6 && sanitized[5] !== "-") {
   const parts = sanitized.split("-");
   if (parts.length >= 2) {
    sanitized = parts[0] + "-" + parts[1].substring(0, 2) + "-" + parts[1].substring(2) + (parts[2] || "");
   }
  }

  if (sanitized.length > 10) {
   sanitized = sanitized.substring(0, 10);
  }

  // Validate parts as user types
  const parts = sanitized.split("-");
  if (parts.length >= 1 && parts[0].length === 2) {
   const day = parseInt(parts[0]);
   if (day === 0 || day > 31) {
    return; // Don't update if invalid day
   }
  }
  if (parts.length >= 2 && parts[1].length === 2) {
   const month = parseInt(parts[1]);
   if (month === 0 || month > 12) {
    return; // Don't update if invalid month
   }
  }
  if (parts.length >= 3 && parts[2].length > 0) {
   const year = parseInt(parts[2]);
   if (parts[2].length === 4 && (year === 0 || year < 1900 || year > 2100)) {
    return; // Don't update if invalid year
   }
  }

  prevEndLength.current = sanitized.length;
  setEndInput(sanitized);
 };

 const handleStartFocus = () => {
  // Allow user to see existing value - only clear when they start typing
 };

 const handleEndFocus = () => {
  // Allow user to see existing value - only clear when they start typing
 };

 const handleStartBlur = () => {
  const parsed = parsePartialDate(startInput);
  if (parsed) {
   setStartInput(formatForDisplay(parsed));
   setIsStartComplete(true);
   // Don't call onChange here, only format the display
  } else {
   setStartInput("");
   setIsStartComplete(false);
  }
 };

 const handleEndBlur = () => {
  const parsed = parsePartialDate(endInput);
  const startParsed = parsePartialDate(startInput);

  if (parsed) {
   let finalStart = startParsed;
   let finalEnd = parsed;

   // Swap if end date is before start date
   if (startParsed && startParsed !== "" && parsed < startParsed) {
    finalStart = parsed;
    finalEnd = startParsed;
    // Update the display
    setStartInput(formatForDisplay(finalStart));
    setEndInput(formatForDisplay(finalEnd));
   } else {
    setEndInput(formatForDisplay(parsed));
   }

   setIsEndComplete(true);
   // Only apply filter when end date is set
   const newValue = finalStart && finalStart !== "" ? `${finalStart}|${finalEnd}` : finalEnd;
   onChange(newValue);
  } else {
   setEndInput("");
   setIsEndComplete(false);
   if (startParsed && startParsed !== "") {
    // If start date exists but end date is cleared, don't apply filter
    onChange(undefined);
   } else {
    onChange(undefined);
   }
  }
 };

 const handleStartKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
   e.preventDefault();

   // If input is empty, use today's date
   if (!startInput.trim()) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const formatted = `${dd}-${mm}-${yyyy}`;
    setStartInput(formatted);
    setIsStartComplete(true);
    endRef.current?.focus();
    return;
   }

   const parsed = parsePartialDate(startInput);
   if (parsed) {
    setStartInput(formatForDisplay(parsed));
   }
   endRef.current?.focus();
  }
 };

 const handleEndKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
   e.preventDefault();

   // If input is empty, use today's date
   if (!endInput.trim()) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const formatted = `${dd}-${mm}-${yyyy}`;
    setEndInput(formatted);
    setIsEndComplete(true);
    // Now apply the filter with the today's date
    handleEndBlur();
    endRef.current?.blur();
    return;
   }

   handleEndBlur();
   endRef.current?.blur();
  }
 };

 return (
  <Stack direction='row' spacing={1} alignItems='center'>
   <TextField
    inputRef={startRef}
    size='small'
    label='From'
    placeholder='DD-MM-YYYY'
    value={startInput}
    disabled={disabled}
    onChange={(e) => handleStartChange(e.target.value)}
    onFocus={handleStartFocus}
    onBlur={handleStartBlur}
    onKeyDown={handleStartKeyDown}
    InputProps={{
     startAdornment: (
      <InputAdornment position='start'>
       <CalendarToday fontSize='small' sx={{ fontSize: 16 }} />
      </InputAdornment>
     ),
     endAdornment: startInput ? (
      <InputAdornment position='end'>
       <IconButton size='small' onClick={handleClearStart} edge='end' disabled={disabled}>
        <Clear fontSize='small' sx={{ fontSize: 16 }} />
       </IconButton>
      </InputAdornment>
     ) : null,
    }}
    sx={{ flex: 1 }}
   />
   <TextField
    inputRef={endRef}
    size='small'
    label='To'
    placeholder='DD-MM-YYYY'
    value={endInput}
    disabled={disabled}
    onChange={(e) => handleEndChange(e.target.value)}
    onFocus={handleEndFocus}
    onBlur={handleEndBlur}
    onKeyDown={handleEndKeyDown}
    InputProps={{
     startAdornment: (
      <InputAdornment position='start'>
       <CalendarToday fontSize='small' sx={{ fontSize: 16 }} />
      </InputAdornment>
     ),
     endAdornment: endInput ? (
      <InputAdornment position='end'>
       <IconButton size='small' onClick={handleClearEnd} edge='end' disabled={disabled}>
        <Clear fontSize='small' sx={{ fontSize: 16 }} />
       </IconButton>
      </InputAdornment>
     ) : null,
    }}
    sx={{ flex: 1 }}
   />
   <IconButton size='small' onClick={(e) => setInfoAnchor(e.currentTarget)} sx={{ mt: 0.5 }}>
    <Info fontSize='small' />
   </IconButton>
   <Popover
    open={Boolean(infoAnchor)}
    anchorEl={infoAnchor}
    onClose={() => setInfoAnchor(null)}
    anchorOrigin={{
     vertical: "bottom",
     horizontal: "right",
    }}
    transformOrigin={{
     vertical: "top",
     horizontal: "right",
    }}
   >
    <Box sx={{ p: 2, maxWidth: 300 }}>
     <Typography variant='subtitle2' gutterBottom>
      Date Range Filter
     </Typography>
     <Typography variant='caption' component='div' color='text.secondary' sx={{ mb: 1 }}>
      • Type: DD, DD-MM, or DD-MM-YYYY
     </Typography>
     <Typography variant='caption' component='div' color='text.secondary' sx={{ mb: 1 }}>
      • Press Enter on empty to use today
     </Typography>
     <Typography variant='caption' component='div' color='text.secondary' sx={{ mb: 1 }}>
      • Keyboard: Ctrl+D (From), Ctrl+Shift+D (To)
     </Typography>
     <Typography variant='caption' component='div' color='text.secondary'>
      • Dates swap if end is before start
     </Typography>
    </Box>
   </Popover>
  </Stack>
 );
}
