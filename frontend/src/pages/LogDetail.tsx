import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import JsonView from "@uiw/react-json-view";
import { useState } from "react";
import { logsApi } from "../lib/api";

interface TabPanelProps {
 children?: React.ReactNode;
 index: number;
 value: number;
}

function TabPanel(props: TabPanelProps) {
 const { children, value, index, ...other } = props;
 return (
  <div role='tabpanel' hidden={value !== index} {...other}>
   {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
 );
}

export default function LogDetailPage() {
 const { logId } = useParams({ from: "/logs/$logId" });
 const [tabValue, setTabValue] = useState(0);
 const [copiedField, setCopiedField] = useState<string | null>(null);

 const { data: logDetails, isLoading } = useQuery({
  queryKey: ["logDetails", logId],
  queryFn: () => logsApi.getDetails(logId).then((res) => res.data.data),
 });

 const handleCopy = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text);
  setCopiedField(fieldName);
  setTimeout(() => setCopiedField(null), 2000);
 };

 const generateCurl = () => {
  if (!logDetails?.log) return "";

  const { log, headers } = logDetails;
  let curl = `curl -X ${log.method} '${log.path}'`;

  if (headers?.request_headers) {
   Object.entries(headers.request_headers).forEach(([key, value]) => {
    curl += ` \\\n  -H '${key}: ${value}'`;
   });
  }

  if (logDetails.body?.request_body) {
   curl += ` \\\n  -d '${JSON.stringify(logDetails.body.request_body)}'`;
  }

  return curl;
 };

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 if (!logDetails?.log) return <Typography>Log not found</Typography>;

 const { log, headers, body } = logDetails;
 const statusColor = log.status_code >= 200 && log.status_code < 300 ? "success" : log.status_code >= 400 ? "error" : "warning";

 return (
  <Box>
   <Box display='flex' gap={2} alignItems='center' mb={3} flexWrap='wrap'>
    <Typography variant='h4'>Log Details</Typography>
    <Chip label={log.method} color='primary' />
    <Chip label={log.status_code} color={statusColor} />
    <Chip label={log.environment} variant='outlined' />
    <Box flex={1} />
    <Button variant='outlined' startIcon={copiedField === "curl" ? <CheckIcon /> : <ContentCopyIcon />} onClick={() => handleCopy(generateCurl(), "curl")} size='small'>
     {copiedField === "curl" ? "Copied!" : "Copy cURL"}
    </Button>
   </Box>

   {/* Overview Card */}
   <Paper sx={{ p: 3, mb: 3 }}>
    <Stack spacing={2}>
     <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='h6'>Request Overview</Typography>
      <Tooltip title='Copy ID'>
       <IconButton size='small' onClick={() => handleCopy(log.id, "id")}>
        {copiedField === "id" ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
       </IconButton>
      </Tooltip>
     </Box>

     <Box display='grid' gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={2}>
      <Box>
       <Typography variant='caption' color='text.secondary'>
        Path
       </Typography>
       <Typography variant='body2' sx={{ wordBreak: "break-all" }}>
        {log.path}
       </Typography>
      </Box>

      <Box>
       <Typography variant='caption' color='text.secondary'>
        Response Time
       </Typography>
       <Typography variant='body2'>{log.response_time_ms}ms</Typography>
      </Box>

      <Box>
       <Typography variant='caption' color='text.secondary'>
        Content Length
       </Typography>
       <Typography variant='body2'>{log.content_length ? `${log.content_length} bytes` : "-"}</Typography>
      </Box>

      <Box>
       <Typography variant='caption' color='text.secondary'>
        IP Address
       </Typography>
       <Typography variant='body2'>{log.ip_address || "-"}</Typography>
      </Box>

      <Box>
       <Typography variant='caption' color='text.secondary'>
        Timestamp
       </Typography>
       <Typography variant='body2'>{new Date(log.timestamp).toLocaleString()}</Typography>
      </Box>

      <Box>
       <Typography variant='caption' color='text.secondary'>
        User ID
       </Typography>
       <Typography variant='body2'>{log.user_id || "-"}</Typography>
      </Box>
     </Box>

     {log.user_agent && (
      <Box>
       <Typography variant='caption' color='text.secondary'>
        User Agent
       </Typography>
       <Typography variant='body2' sx={{ wordBreak: "break-all" }}>
        {log.user_agent}
       </Typography>
      </Box>
     )}

     {log.error_message && (
      <Box>
       <Typography variant='caption' color='error'>
        Error Message
       </Typography>
       <Typography variant='body2' color='error'>
        {log.error_message}
       </Typography>
      </Box>
     )}
    </Stack>
   </Paper>

   {/* Tabs for Headers and Body */}
   <Paper sx={{ mb: 3 }}>
    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: "divider" }}>
     <Tab label='Request' />
     <Tab label='Response' />
     <Tab label='cURL Command' />
    </Tabs>

    {/* Request Tab */}
    <TabPanel value={tabValue} index={0}>
     <Stack spacing={3} sx={{ p: 2 }}>
      {headers?.request_headers && (
       <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
         <Typography variant='subtitle1' fontWeight='bold'>
          Request Headers
         </Typography>
         <IconButton size='small' onClick={() => handleCopy(JSON.stringify(headers.request_headers, null, 2), "reqHeaders")}>
          {copiedField === "reqHeaders" ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
         </IconButton>
        </Box>
        <Box sx={{ "& > div": { fontSize: "0.875rem" } }}>
         <JsonView value={headers.request_headers} collapsed={1} />
        </Box>
       </Box>
      )}

      {body?.request_body && (
       <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
         <Typography variant='subtitle1' fontWeight='bold'>
          Request Body
         </Typography>
         <IconButton size='small' onClick={() => handleCopy(JSON.stringify(body.request_body, null, 2), "reqBody")}>
          {copiedField === "reqBody" ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
         </IconButton>
        </Box>
        <Box sx={{ "& > div": { fontSize: "0.875rem" } }}>
         <JsonView value={body.request_body} collapsed={1} />
        </Box>
       </Box>
      )}

      {!headers?.request_headers && !body?.request_body && (
       <Typography color='text.secondary' align='center'>
        No request data available
       </Typography>
      )}
     </Stack>
    </TabPanel>

    {/* Response Tab */}
    <TabPanel value={tabValue} index={1}>
     <Stack spacing={3} sx={{ p: 2 }}>
      {headers?.response_headers && (
       <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
         <Typography variant='subtitle1' fontWeight='bold'>
          Response Headers
         </Typography>
         <IconButton size='small' onClick={() => handleCopy(JSON.stringify(headers.response_headers, null, 2), "resHeaders")}>
          {copiedField === "resHeaders" ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
         </IconButton>
        </Box>
        <Box sx={{ "& > div": { fontSize: "0.875rem" } }}>
         <JsonView value={headers.response_headers} collapsed={1} />
        </Box>
       </Box>
      )}

      {body?.response_body && (
       <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
         <Typography variant='subtitle1' fontWeight='bold'>
          Response Body
         </Typography>
         <IconButton size='small' onClick={() => handleCopy(JSON.stringify(body.response_body, null, 2), "resBody")}>
          {copiedField === "resBody" ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
         </IconButton>
        </Box>
        <Box sx={{ "& > div": { fontSize: "0.875rem" } }}>
         <JsonView value={body.response_body} collapsed={1} />
        </Box>
       </Box>
      )}

      {!headers?.response_headers && !body?.response_body && (
       <Typography color='text.secondary' align='center'>
        No response data available
       </Typography>
      )}
     </Stack>
    </TabPanel>

    {/* cURL Tab */}
    <TabPanel value={tabValue} index={2}>
     <Box sx={{ p: 2 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
       <Typography variant='subtitle1' fontWeight='bold'>
        cURL Command
       </Typography>
       <Button size='small' startIcon={copiedField === "curl" ? <CheckIcon /> : <ContentCopyIcon />} onClick={() => handleCopy(generateCurl(), "curl")}>
        {copiedField === "curl" ? "Copied!" : "Copy"}
       </Button>
      </Box>
      <Paper sx={{ p: 2, bgcolor: "grey.900", color: "grey.100", borderRadius: 1 }}>
       <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "0.875rem", fontFamily: "monospace" }}>{generateCurl()}</pre>
      </Paper>
     </Box>
    </TabPanel>
   </Paper>
  </Box>
 );
}
