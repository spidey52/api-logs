import { Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { logsApi } from "../lib/api";

export default function LogDetailPage() {
 const { logId } = useParams({ from: "/logs/$logId" });

 const { data: log, isLoading } = useQuery({
  queryKey: ["log", logId],
  queryFn: () => logsApi.getById(logId).then((res) => res.data),
 });

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 if (!log) return <Typography>Log not found</Typography>;

 return (
  <Box>
   <Box display='flex' gap={2} alignItems='center' mb={3}>
    <Typography variant='h4'>Log Details</Typography>
    <Chip label={log.method} color='primary' />
    <Chip label={log.status_code} />
    <Chip label={log.environment} variant='outlined' />
   </Box>

   <Stack spacing={3}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
     <Paper sx={{ p: 2, flex: 1 }}>
      <Typography variant='h6' gutterBottom>
       Request Info
      </Typography>
      <Typography>
       <strong>Path:</strong> {log.path}
      </Typography>
      <Typography>
       <strong>Method:</strong> {log.method}
      </Typography>
      <Typography>
       <strong>Status:</strong> {log.status_code}
      </Typography>
      <Typography>
       <strong>Response Time:</strong> {log.response_time_ms}ms
      </Typography>
      <Typography>
       <strong>IP Address:</strong> {log.ip_address || "-"}
      </Typography>
      <Typography>
       <strong>User Agent:</strong> {log.user_agent || "-"}
      </Typography>
      <Typography>
       <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
      </Typography>
     </Paper>

     {log.request_headers && (
      <Paper sx={{ p: 2, flex: 1 }}>
       <Typography variant='h6' gutterBottom>
        Request Headers
       </Typography>
       <pre style={{ fontSize: "0.875rem", overflow: "auto" }}>{JSON.stringify(log.request_headers, null, 2)}</pre>
      </Paper>
     )}
    </Stack>

    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
     {/* {log.requestBody && (
      <Paper sx={{ p: 2, flex: 1 }}>
       <Typography variant='h6' gutterBottom>
        Request Body
       </Typography>
       <pre style={{ fontSize: "0.875rem", overflow: "auto" }}>{JSON.stringify(log.requestBody as object, null, 2)}</pre>
      </Paper>
     )} */}

     {log.response_headers && (
      <Paper sx={{ p: 2, flex: 1 }}>
       <Typography variant='h6' gutterBottom>
        Response Headers
       </Typography>
       <pre style={{ fontSize: "0.875rem", overflow: "auto" }}>{JSON.stringify(log.response_headers, null, 2)}</pre>
      </Paper>
     )}
    </Stack>

    {/* {log.responseBody && (
     <Paper sx={{ p: 2 }}>
      <Typography variant='h6' gutterBottom>
       Response Body
      </Typography>
      <pre style={{ fontSize: "0.875rem", overflow: "auto" }}>{JSON.stringify(log.responseBody as object, null, 2)}</pre>
     </Paper>
    )} */}
   </Stack>
  </Box>
 );
}
