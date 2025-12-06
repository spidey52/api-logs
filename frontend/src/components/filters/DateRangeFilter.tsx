import { CalendarToday, Clear } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { CustomFilterProps } from "../FilterToolbar";
import { DATE_SEPARATOR, formatDatePart, formatForDisplay, getTodayFormatted, getTodayISO, parsePartialDate } from "./shared/dateUtils";

export default function DateRangeFilter({ value, onChange, disabled }: CustomFilterProps) {
 const [startDate, endDate] = value ? (value as string).split("|") : ["", ""];
 const [input, setInput] = useState(() => {
  if (startDate && endDate) {
   return `${formatForDisplay(startDate)}${DATE_SEPARATOR}${formatForDisplay(endDate)}`;
  } else if (startDate) {
   return formatForDisplay(startDate);
  }
  return "";
 });
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

 // Handle input changes, preserving the " to " separator
 const handleChange = (rawInput: string) => {
  let sanitized = rawInput;

  if (sanitized.includes(DATE_SEPARATOR)) {
   const [startPart, endPart] = sanitized.split(DATE_SEPARATOR);
   sanitized = `${formatDatePart(startPart)}${DATE_SEPARATOR}${formatDatePart(endPart || "")}`;
  } else if (sanitized.includes(" t")) {
   // User is typing " to "
   const [startPart, rest] = sanitized.split(" t");
   sanitized = `${formatDatePart(startPart)} t${rest || ""}`;
  } else {
   sanitized = formatDatePart(sanitized);
  }

  setInput(sanitized);
 };

 // Apply and format date range when focus leaves the input
 const handleBlur = () => {
  const trimmed = input.trim();
  if (!trimmed) {
   onChange(undefined);
   return;
  }

  if (trimmed.includes(DATE_SEPARATOR)) {
   const [startPart, endPart] = trimmed.split(DATE_SEPARATOR).map((p) => p.trim());
   const startParsed = parsePartialDate(startPart);
   const endParsed = endPart ? parsePartialDate(endPart) : null;

   if (startParsed && endParsed) {
    // Both dates valid - swap if needed
    const [finalStart, finalEnd] = endParsed < startParsed ? [endParsed, startParsed] : [startParsed, endParsed];

    setInput(`${formatForDisplay(finalStart)}${DATE_SEPARATOR}${formatForDisplay(finalEnd)}`);
    onChange(`${finalStart}|${finalEnd}`);
   } else if (startParsed && !endPart) {
    // Only start date - wait for end date
    setInput(`${formatForDisplay(startParsed)}${DATE_SEPARATOR}`);
    onChange(undefined);
   } else if (startParsed && endPart) {
    // Start valid, end incomplete - use today as fallback
    const todayISO = getTodayISO();
    const [finalStart, finalEnd] = todayISO < startParsed ? [todayISO, startParsed] : [startParsed, todayISO];

    setInput(`${formatForDisplay(finalStart)}${DATE_SEPARATOR}${formatForDisplay(finalEnd)}`);
    onChange(`${finalStart}|${finalEnd}`);
   } else {
    // Invalid input
    setInput("");
    onChange(undefined);
   }
  } else {
   // No separator - add it and wait for end date
   const parsed = parsePartialDate(trimmed);
   if (parsed) {
    setInput(`${formatForDisplay(parsed)}${DATE_SEPARATOR}`);
    onChange(undefined);
   } else {
    setInput("");
    onChange(undefined);
   }
  }
 };

 // Handle Enter key - autocomplete dates and insert today's date when empty
 const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key !== "Enter") return;
  e.preventDefault();

  const cursorPos = inputRef.current?.selectionStart || 0;
  const separatorIndex = input.indexOf(DATE_SEPARATOR);

  // Empty input - insert today as start
  if (!input.trim()) {
   setInput(`${getTodayFormatted()}${DATE_SEPARATOR}`);
   setTimeout(() => {
    inputRef.current?.setSelectionRange(input.length + DATE_SEPARATOR.length + 10, input.length + DATE_SEPARATOR.length + 10);
   }, 0);
   return;
  }

  // No separator yet - autocomplete and add separator
  if (separatorIndex === -1) {
   const parsed = parsePartialDate(input.trim());
   if (parsed) {
    const newInput = `${formatForDisplay(parsed)}${DATE_SEPARATOR}`;
    setInput(newInput);
    setTimeout(() => inputRef.current?.setSelectionRange(newInput.length, newInput.length), 0);
   }
   return;
  }

  // Cursor before separator - autocomplete start date
  if (cursorPos <= separatorIndex + DATE_SEPARATOR.length) {
   const startPart = input.substring(0, separatorIndex).trim();
   const endPart = input.substring(separatorIndex + DATE_SEPARATOR.length).trim();
   const startParsed = parsePartialDate(startPart);

   if (startParsed) {
    const newInput = `${formatForDisplay(startParsed)}${DATE_SEPARATOR}${endPart}`;
    setInput(newInput);
    setTimeout(() => {
     const newSeparatorIndex = newInput.indexOf(DATE_SEPARATOR);
     inputRef.current?.setSelectionRange(newSeparatorIndex + DATE_SEPARATOR.length, newSeparatorIndex + DATE_SEPARATOR.length);
    }, 0);
   }
   return;
  }

  // Cursor after separator - autocomplete or insert today for end date
  const endPart = input.substring(separatorIndex + DATE_SEPARATOR.length).trim();
  if (!endPart) {
   const newInput = `${input.substring(0, separatorIndex + DATE_SEPARATOR.length)}${getTodayFormatted()}`;
   setInput(newInput);
   setTimeout(() => {
    handleBlur();
    inputRef.current?.blur();
   }, 0);
   return;
  }

  // End part exists - apply filter
  handleBlur();
  inputRef.current?.blur();
 };

 const handleClear = () => {
  setInput("");
  onChange(undefined);
 };

 return (
  <>
   <TextField
    inputRef={inputRef}
    size='small'
    label='Date Range'
    placeholder='15-06-2025 to 20-06-2025'
    value={input}
    disabled={disabled}
    onChange={(e) => handleChange(e.target.value)}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
    InputProps={{
     startAdornment: (
      <InputAdornment position='start'>
       <IconButton
        size='small'
        onClick={(e) => setInfoAnchor(e.currentTarget)}
        edge='start'
        sx={{
         p: 0.5,
         transition: "all 0.2s",
         "&:hover": {
          color: "primary.main",
         },
        }}
       >
        <CalendarToday
         sx={{
          fontSize: 18,
          color: input ? "primary.main" : "action.active",
          transition: "color 0.2s",
         }}
        />
       </IconButton>
      </InputAdornment>
     ),
     endAdornment: input ? (
      <InputAdornment position='end'>
       <IconButton
        size='small'
        onClick={handleClear}
        edge='end'
        disabled={disabled}
        sx={{
         transition: "all 0.2s",
         "&:hover": {
          backgroundColor: "error.lighter",
          color: "error.main",
         },
        }}
       >
        <Clear sx={{ fontSize: 18 }} />
       </IconButton>
      </InputAdornment>
     ) : null,
    }}
    sx={{
     width: "100%",
     "& .MuiOutlinedInput-root": {
      transition: "all 0.2s",
      "&:hover": {
       boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      },
      "&.Mui-focused": {
       boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      },
     },
    }}
   />
   <Popover
    open={Boolean(infoAnchor)}
    anchorEl={infoAnchor}
    onClose={() => setInfoAnchor(null)}
    anchorOrigin={{
     vertical: "bottom",
     horizontal: "left",
    }}
    transformOrigin={{
     vertical: "top",
     horizontal: "left",
    }}
    slotProps={{
     paper: {
      elevation: 8,
      sx: {
       borderRadius: 2,
       mt: 1,
       border: "1px solid",
       borderColor: "divider",
      },
     },
    }}
   >
    <Box sx={{ p: 2.5 }}>
     <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
      <CalendarToday sx={{ fontSize: 20, color: "primary.main" }} />
      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
       Date Range Filter
      </Typography>
     </Stack>

     <Stack spacing={1.5}>
      <Box>
       <Typography variant='caption' sx={{ fontWeight: 600, color: "text.primary", display: "block", mb: 0.5 }}>
        Format
       </Typography>
       <Typography variant='caption' color='text.secondary'>
        DD-MM-YYYY to DD-MM-YYYY
       </Typography>
      </Box>

      <Box>
       <Typography variant='caption' sx={{ fontWeight: 600, color: "text.primary", display: "block", mb: 0.5 }}>
        Quick Tips
       </Typography>
       <Stack spacing={0.5}>
        <Typography variant='caption' color='text.secondary'>
         • Type "15 to 20" → Autocompletes to current month/year
        </Typography>
        <Typography variant='caption' color='text.secondary'>
         • Press Enter on empty → Inserts today + " to "
        </Typography>
        <Typography variant='caption' color='text.secondary'>
         • Date without " to " → Adds " to " automatically
        </Typography>
        <Typography variant='caption' color='text.secondary'>
         • Dates swap if end is before start
        </Typography>
       </Stack>
      </Box>

      <Box
       sx={{
        pt: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
       }}
      >
       <Typography variant='caption' sx={{ fontWeight: 600, color: "text.primary", display: "block", mb: 0.5 }}>
        Keyboard Shortcut
       </Typography>
       <Box
        component='kbd'
        sx={{
         px: 1,
         py: 0.5,
         borderRadius: 0.5,
         backgroundColor: "action.hover",
         border: "1px solid",
         borderColor: "divider",
         fontFamily: "monospace",
         fontSize: "0.75rem",
         fontWeight: 600,
        }}
       >
        Ctrl + D
       </Box>
      </Box>
     </Stack>
    </Box>
   </Popover>
  </>
 );
}
