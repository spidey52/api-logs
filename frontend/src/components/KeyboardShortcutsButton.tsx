import { Close, Keyboard } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { GLOBAL_SHORTCUTS } from "../lib/globalShortcuts";
import { formatShortcut, useKeyboardShortcut } from "../lib/keyboardRegistry";

interface ShortcutCategory {
 name: string;
 shortcuts: Array<{
  name: string;
  shortcut: (typeof GLOBAL_SHORTCUTS)[keyof typeof GLOBAL_SHORTCUTS];
 }>;
}

const shortcutCategories: ShortcutCategory[] = [
 {
  name: "Navigation",
  shortcuts: [
   { name: "Toggle Sidebar", shortcut: GLOBAL_SHORTCUTS.TOGGLE_SIDEBAR },
   { name: "Dashboard", shortcut: GLOBAL_SHORTCUTS.GO_TO_DASHBOARD },
   { name: "Projects", shortcut: GLOBAL_SHORTCUTS.GO_TO_PROJECTS },
   { name: "Logs", shortcut: GLOBAL_SHORTCUTS.GO_TO_LOGS },
   { name: "Users", shortcut: GLOBAL_SHORTCUTS.GO_TO_USERS },
  ],
 },
 {
  name: "Search & Filters",
  shortcuts: [
   { name: "Focus Search", shortcut: GLOBAL_SHORTCUTS.FOCUS_SEARCH },
   { name: "Clear Filters", shortcut: GLOBAL_SHORTCUTS.CLEAR_FILTERS },
   { name: "Toggle Filter Edit Mode", shortcut: GLOBAL_SHORTCUTS.TOGGLE_FILTER_EDIT_MODE },
   { name: "Open Filter Drawer", shortcut: GLOBAL_SHORTCUTS.OPEN_FILTER_DRAWER },
  ],
 },
 {
  name: "Table Controls",
  shortcuts: [
   { name: "Toggle Column Visibility", shortcut: GLOBAL_SHORTCUTS.TOGGLE_COLUMN_VISIBILITY },
   { name: "Toggle Density", shortcut: GLOBAL_SHORTCUTS.TOGGLE_DENSITY },
  ],
 },
 {
  name: "General",
  shortcuts: [
   { name: "Close Dialog/Drawer", shortcut: GLOBAL_SHORTCUTS.ESCAPE },
   { name: "Refresh Page", shortcut: GLOBAL_SHORTCUTS.REFRESH },
  ],
 },
];

export function KeyboardShortcutsButton() {
 const [open, setOpen] = useState(false);

 // Register shortcut to open this dialog (Ctrl+/)
 useKeyboardShortcut(
  "show-keyboard-shortcuts",
  {
   key: "/",
   ctrl: true,
   description: "Show keyboard shortcuts",
   handler: () => setOpen(true),
  },
  [],
 );

 // Close on Escape
 useKeyboardShortcut(
  "close-keyboard-shortcuts",
  open
   ? {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      handler: () => setOpen(false),
     }
   : null,
  [open],
 );

 return (
  <>
   <Tooltip title='Keyboard Shortcuts (Ctrl+/)'>
    <IconButton color='inherit' onClick={() => setOpen(true)} sx={{ mr: 1 }}>
     <Keyboard />
    </IconButton>
   </Tooltip>

   <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
     <Typography variant='h6'>Keyboard Shortcuts</Typography>
     <IconButton onClick={() => setOpen(false)} size='small'>
      <Close />
     </IconButton>
    </DialogTitle>
    <DialogContent>
     {shortcutCategories.map((category) => (
      <Box key={category.name} sx={{ mb: 3 }}>
       <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 1 }}>
        {category.name}
       </Typography>
       <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
         <TableHead>
          <TableRow>
           <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50" }}>Action</TableCell>
           <TableCell align='right' sx={{ fontWeight: 600, bgcolor: "grey.50" }}>
            Shortcut
           </TableCell>
          </TableRow>
         </TableHead>
         <TableBody>
          {category.shortcuts.map((item) => (
           <TableRow key={item.name}>
            <TableCell>{item.name}</TableCell>
            <TableCell align='right'>
             <Box
              component='kbd'
              sx={{
               px: 1,
               py: 0.5,
               bgcolor: "grey.100",
               border: "1px solid",
               borderColor: "grey.300",
               borderRadius: 1,
               fontFamily: "monospace",
               fontSize: "0.875rem",
              }}
             >
              {formatShortcut({ ...item.shortcut, handler: () => {} })}
             </Box>
            </TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       </TableContainer>
      </Box>
     ))}
     <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
      <Typography variant='body2' color='info.dark'>
       💡 <strong>Tip:</strong> Press <kbd>Ctrl+/</kbd> anytime to view this shortcuts panel
      </Typography>
     </Box>
    </DialogContent>
   </Dialog>
  </>
 );
}
