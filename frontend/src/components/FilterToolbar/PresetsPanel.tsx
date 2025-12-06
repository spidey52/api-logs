import { CheckCircle, Delete, InfoOutlined, Save } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
import { deleteFilterPreset, filterPresetsStore, saveFilterPreset, type FilterPreset } from "../../store/filterPresetsStore";

interface PresetsPanelProps {
 pageKey: string;
 currentFilters: Record<string, unknown>;
 onLoadPreset: (filters: Record<string, unknown>, presetName: string) => void;
 activePresetName: string | null;
}

export default function PresetsPanel({ pageKey, currentFilters, onLoadPreset, activePresetName }: PresetsPanelProps) {
 const [presetName, setPresetName] = useState("");
 const [showSaveDialog, setShowSaveDialog] = useState(false);
 const [showDetailsId, setShowDetailsId] = useState<string | null>(null);
 const filterPresetsState = useStore(filterPresetsStore);

 // Filter presets for current page from the store state
 const presets = filterPresetsState.presets.filter((p) => p.pageKey === pageKey);
 const existingPreset = presets.find((p) => p.name === presetName.trim());

 const handleSave = () => {
  if (presetName.trim()) {
   saveFilterPreset(presetName.trim(), currentFilters, pageKey);
   setPresetName("");
   setShowSaveDialog(false);
  }
 };

 const handleLoad = (preset: FilterPreset) => {
  onLoadPreset(preset.filters, preset.name);
 };

 const handleDelete = (id: string) => {
  deleteFilterPreset(id);
 };

 return (
  <>
   <Box sx={{ p: 2 }}>
    <Button variant='contained' startIcon={<Save />} onClick={() => setShowSaveDialog(true)} fullWidth size='small'>
     Save Current Filters
    </Button>
    {activePresetName && (
     <Button variant='outlined' color='error' size='small' fullWidth sx={{ mt: 1 }} onClick={() => onLoadPreset({}, "")}>
      Clear Active Preset
     </Button>
    )}
   </Box>

   <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
     {presets.length === 0 ? (
      <Paper variant='outlined' sx={{ p: 2, textAlign: "center" }}>
       <Typography variant='body2' color='text.secondary'>
        No saved presets
       </Typography>
       <Typography variant='caption' color='text.secondary'>
        Save your current filters to create a preset
       </Typography>
      </Paper>
     ) : (
      presets.map((preset) => {
       const isActive = preset.name === activePresetName;
       const showingDetails = showDetailsId === preset.id;
       return (
        <Paper
         key={preset.id}
         variant='outlined'
         sx={{
          border: isActive ? 2 : 1,
          borderColor: isActive ? "primary.main" : "divider",
          bgcolor: isActive ? (theme) => (theme.palette.mode === "dark" ? "rgba(144, 202, 249, 0.08)" : "primary.50") : "transparent",
          transition: "all 0.2s",
         }}
        >
         <Box
          sx={{
           display: "flex",
           alignItems: "center",
           gap: 1,
           px: 1.5,
           py: 0.75,
           cursor: "pointer",
           "&:hover": {
            bgcolor: "action.hover",
           },
          }}
          onClick={() => handleLoad(preset)}
         >
          {isActive && <CheckCircle color='primary' sx={{ fontSize: 18 }} />}
          <Typography variant='body2' fontWeight={isActive ? 600 : 400} sx={{ flex: 1, fontSize: "0.875rem" }}>
           {preset.name}
          </Typography>
          <Typography variant='caption' color='text.secondary' sx={{ fontSize: "0.75rem" }}>
           {new Date(preset.createdAt).toLocaleDateString()}
          </Typography>
          <Tooltip title='Show filters'>
           <IconButton
            size='small'
            onClick={(e) => {
             e.stopPropagation();
             setShowDetailsId(showingDetails ? null : preset.id);
            }}
            sx={{ p: 0.5 }}
           >
            <InfoOutlined sx={{ fontSize: 18 }} />
           </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
           <IconButton
            size='small'
            onClick={(e) => {
             e.stopPropagation();
             handleDelete(preset.id);
            }}
            color='error'
            sx={{ p: 0.5 }}
           >
            <Delete sx={{ fontSize: 18 }} />
           </IconButton>
          </Tooltip>
         </Box>
         {showingDetails && (
          <Box sx={{ px: 1.5, pb: 1, pt: 0.5, borderTop: 1, borderColor: "divider", bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)") }}>
           <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {Object.entries(preset.filters).map(([key, value]) => {
             if (!value || key === "page" || key === "limit") return null;
             return (
              <Typography key={key} variant='caption' sx={{ fontSize: "0.75rem", display: "flex", gap: 1 }}>
               <span style={{ fontWeight: 600, minWidth: "80px" }}>{key}:</span>
               <span style={{ color: "text.secondary" }}>{String(value)}</span>
              </Typography>
             );
            })}
           </Box>
          </Box>
         )}
        </Paper>
       );
      })
     )}
    </Box>
   </Box>

   {/* Save Preset Dialog */}
   <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth='xs' fullWidth>
    <DialogTitle>Save Filter Preset</DialogTitle>
    <DialogContent>
     <TextField
      autoFocus
      margin='dense'
      label='Preset Name'
      fullWidth
      value={presetName}
      onChange={(e) => setPresetName(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSave()}
      helperText={existingPreset ? "A preset with this name exists and will be updated" : ""}
     />
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
     <Button onClick={handleSave} variant='contained' disabled={!presetName.trim()}>
      {existingPreset ? "Update" : "Save"}
     </Button>
    </DialogActions>
   </Dialog>
  </>
 );
}
