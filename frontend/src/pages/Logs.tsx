import { Visibility } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { logsApi } from "../lib/api";
import type { LogFilters } from "../lib/types";

const getStatusColor = (statusCode: number) => {
 if (statusCode < 300) return "success";
 if (statusCode < 400) return "info";
 if (statusCode < 500) return "warning";
 return "error";
};

const getMethodColor = (method: string) => {
 switch (method) {
  case "GET":
   return "primary";
  case "POST":
   return "success";
  case "PUT":
   return "warning";
  case "DELETE":
   return "error";
  default:
   return "default";
 }
};

export default function LogsPage() {
 const [filters, setFilters] = useState<LogFilters>({
  page: 1,
  limit: 50,
 });

 const { data, isLoading } = useQuery({
  queryKey: ["logs", filters],
  queryFn: () => logsApi.getAll(filters).then((res) => res.data),
 });

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 return (
  <Box>
   <Typography variant='h4' gutterBottom>
    API Logs
   </Typography>

   <Paper sx={{ p: 2, mb: 3 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
     <FormControl fullWidth size='small'>
      <InputLabel>Method</InputLabel>
      <Select value={filters.method || ""} label='Method' onChange={(e) => setFilters({ ...filters, method: e.target.value || undefined })}>
       <MenuItem value=''>All</MenuItem>
       <MenuItem value='GET'>GET</MenuItem>
       <MenuItem value='POST'>POST</MenuItem>
       <MenuItem value='PUT'>PUT</MenuItem>
       <MenuItem value='DELETE'>DELETE</MenuItem>
      </Select>
     </FormControl>
     <FormControl fullWidth size='small'>
      <InputLabel>Environment</InputLabel>
      <Select value={filters.environment || ""} label='Environment' onChange={(e) => setFilters({ ...filters, environment: e.target.value || undefined })}>
       <MenuItem value=''>All</MenuItem>
       <MenuItem value='development'>Development</MenuItem>
       <MenuItem value='staging'>Staging</MenuItem>
       <MenuItem value='production'>Production</MenuItem>
      </Select>
     </FormControl>
     <TextField
      fullWidth
      size='small'
      label='Status Code'
      type='number'
      value={filters.statusCode || ""}
      onChange={(e) =>
       setFilters({
        ...filters,
        statusCode: e.target.value ? parseInt(e.target.value) : undefined,
       })
      }
     />
    </Stack>
   </Paper>

   <TableContainer component={Paper}>
    <Table>
     <TableHead>
      <TableRow>
       <TableCell>Method</TableCell>
       <TableCell>Path</TableCell>
       <TableCell>Status</TableCell>
       <TableCell>Response Time</TableCell>
       <TableCell>Environment</TableCell>
       <TableCell>Timestamp</TableCell>
       <TableCell>Actions</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {data?.data.map((log) => (
       <TableRow key={log.id}>
        <TableCell>
         <Chip label={log.method} size='small' color={getMethodColor(log.method)} />
        </TableCell>
        <TableCell>{log.path}</TableCell>
        <TableCell>
         <Chip label={log.status_code} size='small' color={getStatusColor(log.status_code)} />
        </TableCell>
        <TableCell>{log.response_time_ms}ms</TableCell>
        <TableCell>
         <Chip label={log.environment} size='small' />
        </TableCell>
        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
        <TableCell>
         <IconButton component={Link} to={`/logs/${log.id}`} size='small' color='primary'>
          <Visibility />
         </IconButton>
        </TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </TableContainer>
  </Box>
 );
}
