import { Download, FileDownload } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, Paper, Typography } from "@mui/material";

interface ActionsPanelProps {
 onExportCSV: () => void;
 onExportJSON: () => void;
 isExporting: boolean;
 hasData: boolean;
}

export default function ActionsPanel({ onExportCSV, onExportJSON, isExporting, hasData }: ActionsPanelProps) {
 return (
  <Box sx={{ p: 2 }}>
   <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
    Export Data
   </Typography>

   <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Paper variant='outlined' sx={{ p: 2 }}>
     <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      <FileDownload color='action' />
      <Box>
       <Typography variant='body2' fontWeight={600}>
        CSV Export
       </Typography>
       <Typography variant='caption' color='text.secondary'>
        Export current filtered data as CSV
       </Typography>
      </Box>
     </Box>
     <Button fullWidth variant='outlined' size='small' onClick={onExportCSV} disabled={isExporting || !hasData} startIcon={isExporting ? <CircularProgress size={16} /> : <Download />}>
      {isExporting ? "Exporting..." : "Export CSV"}
     </Button>
    </Paper>

    <Paper variant='outlined' sx={{ p: 2 }}>
     <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      <FileDownload color='action' />
      <Box>
       <Typography variant='body2' fontWeight={600}>
        JSON Export
       </Typography>
       <Typography variant='caption' color='text.secondary'>
        Export current filtered data as JSON
       </Typography>
      </Box>
     </Box>
     <Button fullWidth variant='outlined' size='small' onClick={onExportJSON} disabled={isExporting || !hasData} startIcon={isExporting ? <CircularProgress size={16} /> : <Download />}>
      {isExporting ? "Exporting..." : "Export JSON"}
     </Button>
    </Paper>
   </Box>

   <Divider sx={{ my: 2 }} />

   <Typography variant='caption' color='text.secondary' sx={{ display: "block", textAlign: "center" }}>
    {hasData ? "Exports respect current filters and include up to 10,000 records" : "No data available to export"}
   </Typography>
  </Box>
 );
}
