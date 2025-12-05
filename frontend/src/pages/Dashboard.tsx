import { Box, Card, CardContent, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "../lib/api";

export default function DashboardPage() {
 const { data: logs, isLoading: logsLoading } = useQuery({
  queryKey: ["logs", { limit: 100 }],
  queryFn: () => logsApi.getAll({ limit: 100 }).then((res) => res.data),
 });

 if (logsLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 const totalLogs = logs?.total || 0;
 const successLogs = logs?.data?.filter((l) => l.status_code >= 200 && l.status_code < 300).length || 0;
 const errorLogs = logs?.data?.filter((l) => l.status_code >= 400).length || 0;
 const avgResponseTime = logs?.data && logs.data.length > 0 ? Math.round(logs.data.reduce((sum, log) => sum + log.response_time_ms, 0) / logs.data.length) : 0;
 const successRate = logs?.data && logs.data.length > 0 ? Math.round((successLogs / logs.data.length) * 100) : 0;

 return (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
   <Paper sx={{ p: 2, mb: 2 }}>
    <Typography variant='h5'>Dashboard</Typography>
   </Paper>

   {/* Stat Cards */}
   <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
    <Box sx={{ flex: "1 1 calc(25% - 18px)", minWidth: 250 }}>
     <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
      <CardContent>
       <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box>
         <Typography variant='body2' sx={{ opacity: 0.9 }}>
          Total Requests
         </Typography>
         <Typography variant='h3'>{totalLogs.toLocaleString()}</Typography>
        </Box>
        <Box sx={{ fontSize: 48, opacity: 0.3 }}>📈</Box>
       </Stack>
      </CardContent>
     </Card>
    </Box>

    <Box sx={{ flex: "1 1 calc(25% - 18px)", minWidth: 250 }}>
     <Card sx={{ bgcolor: "success.main", color: "success.contrastText" }}>
      <CardContent>
       <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box>
         <Typography variant='body2' sx={{ opacity: 0.9 }}>
          Success Rate
         </Typography>
         <Typography variant='h3'>{successRate}%</Typography>
        </Box>
        <Box sx={{ fontSize: 48, opacity: 0.3 }}>✅</Box>
       </Stack>
      </CardContent>
     </Card>
    </Box>

    <Box sx={{ flex: "1 1 calc(25% - 18px)", minWidth: 250 }}>
     <Card sx={{ bgcolor: "warning.main", color: "warning.contrastText" }}>
      <CardContent>
       <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box>
         <Typography variant='body2' sx={{ opacity: 0.9 }}>
          Avg Response Time
         </Typography>
         <Typography variant='h3'>{avgResponseTime}ms</Typography>
        </Box>
        <Box sx={{ fontSize: 48, opacity: 0.3 }}>⚡</Box>
       </Stack>
      </CardContent>
     </Card>
    </Box>

    <Box sx={{ flex: "1 1 calc(25% - 18px)", minWidth: 250 }}>
     <Card sx={{ bgcolor: "error.main", color: "error.contrastText" }}>
      <CardContent>
       <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box>
         <Typography variant='body2' sx={{ opacity: 0.9 }}>
          Failed Requests
         </Typography>
         <Typography variant='h3'>{errorLogs}</Typography>
        </Box>
        <Box sx={{ fontSize: 48, opacity: 0.3 }}>❌</Box>
       </Stack>
      </CardContent>
     </Card>
    </Box>
   </Box>

   {/* Charts Grid */}
   <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
    <Box sx={{ flex: "1 1 calc(66.66% - 12px)", minWidth: 400 }}>
     <Paper
      sx={{
       p: 3,
       height: 400,
       display: "flex",
       flexDirection: "column",
       alignItems: "center",
       justifyContent: "center",
       bgcolor: "background.default",
      }}
     >
      <Box sx={{ fontSize: 80, mb: 2 }}>📊</Box>
      <Typography variant='h5' gutterBottom>
       Requests Over Time
      </Typography>
      <Typography color='text.secondary' align='center'>
       Line chart showing API request trends
       <br />
       Connect to /api/v1/logs/stats endpoint for data
      </Typography>
     </Paper>
    </Box>

    <Box sx={{ flex: "1 1 calc(33.33% - 12px)", minWidth: 300 }}>
     <Paper
      sx={{
       p: 3,
       height: 400,
       display: "flex",
       flexDirection: "column",
       alignItems: "center",
       justifyContent: "center",
       bgcolor: "background.default",
      }}
     >
      <Box sx={{ fontSize: 80, mb: 2 }}>🥧</Box>
      <Typography variant='h5' gutterBottom>
       Status Code Distribution
      </Typography>
      <Typography color='text.secondary' align='center'>
       Pie chart showing response status breakdown
      </Typography>
     </Paper>
    </Box>

    <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: 300 }}>
     <Paper
      sx={{
       p: 3,
       height: 400,
       display: "flex",
       flexDirection: "column",
       alignItems: "center",
       justifyContent: "center",
       bgcolor: "background.default",
      }}
     >
      <Box sx={{ fontSize: 80, mb: 2 }}>📊</Box>
      <Typography variant='h5' gutterBottom>
       Top Endpoints
      </Typography>
      <Typography color='text.secondary' align='center'>
       Bar chart showing most requested endpoints
      </Typography>
     </Paper>
    </Box>

    <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: 300 }}>
     <Paper
      sx={{
       p: 3,
       height: 400,
       display: "flex",
       flexDirection: "column",
       alignItems: "center",
       justifyContent: "center",
       bgcolor: "background.default",
      }}
     >
      <Box sx={{ fontSize: 80, mb: 2 }}>⏱️</Box>
      <Typography variant='h5' gutterBottom>
       Response Time Histogram
      </Typography>
      <Typography color='text.secondary' align='center'>
       Distribution of API response times
      </Typography>
     </Paper>
    </Box>
   </Box>
  </Box>
 );
}
