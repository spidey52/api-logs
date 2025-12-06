import { Box, Card, CardContent, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { logsApi } from "../lib/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

export default function DashboardPage() {
 // Fetch stats from backend
 const { data: statsData, isLoading: statsLoading } = useQuery({
  queryKey: ["logStats"],
  queryFn: () => logsApi.getStats().then((res) => res.data.data),
 });

 // Fallback to fetching logs for basic stats if stats endpoint fails
 const { data: logs, isLoading: logsLoading } = useQuery({
  queryKey: ["logs", { limit: 100 }],
  queryFn: () => logsApi.getAll({ limit: 100 }).then((res) => res.data),
  enabled: !statsData && !statsLoading,
 });

 const isLoading = statsLoading || (logsLoading && !statsData);

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 // Calculate stats from either source
 let totalLogs = 0;
 let successRate = 0;
 let avgResponseTime = 0;
 let errorLogs = 0;
 let statusCodeData: any[] = [];
 let timeSeriesData: any[] = [];
 let topEndpointsData: any[] = [];
 let methodDistributionData: any[] = [];

 if (statsData) {
  totalLogs = statsData.total_logs || 0;
  avgResponseTime = Math.round(statsData.average_response_time_ms || 0);

  // Status code distribution
  const statusDist = statsData.status_code_distribution || {};
  statusCodeData = Object.entries(statusDist).map(([code, count]) => ({
   name: `${code}`,
   value: count,
  }));

  // Calculate success rate and error count
  let successCount = 0;
  errorLogs = 0;
  Object.entries(statusDist).forEach(([code, count]) => {
   const statusCode = parseInt(code);
   if (statusCode >= 200 && statusCode < 300) successCount += count as number;
   if (statusCode >= 400) errorLogs += count as number;
  });
  successRate = totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 0;

  // Time series
  timeSeriesData = (statsData.time_series || []).map((item: any) => ({
   time: new Date(item.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
   requests: item.count,
  }));

  // Top endpoints
  topEndpointsData = (statsData.top_endpoints || []).map((item: any) => ({
   endpoint: item._id || "Unknown",
   requests: item.count,
   avgTime: Math.round(item.avg_response_time || 0),
  }));

  // Method distribution
  const methodDist = statsData.method_distribution || {};
  methodDistributionData = Object.entries(methodDist).map(([method, count]) => ({
   name: method,
   value: count,
  }));
 } else if (logs?.data) {
  // Fallback calculations from logs
  totalLogs = logs.total || 0;
  const logData = logs.data || [];
  const successLogs = logData.filter((l) => l.status_code >= 200 && l.status_code < 300).length;
  errorLogs = logData.filter((l) => l.status_code >= 400).length;
  avgResponseTime = logData.length > 0 ? Math.round(logData.reduce((sum, log) => sum + log.response_time_ms, 0) / logData.length) : 0;
  successRate = logData.length > 0 ? Math.round((successLogs / logData.length) * 100) : 0;
 }

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
    {/* Time Series Chart */}
    <Box sx={{ flex: "1 1 calc(66.66% - 12px)", minWidth: 400 }}>
     <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant='h6' gutterBottom>
       Requests Over Time
      </Typography>
      {timeSeriesData.length > 0 ? (
       <ResponsiveContainer width='100%' height='90%'>
        <LineChart data={timeSeriesData}>
         <CartesianGrid strokeDasharray='3 3' />
         <XAxis dataKey='time' />
         <YAxis />
         <Tooltip />
         <Legend />
         <Line type='monotone' dataKey='requests' stroke='#8884d8' strokeWidth={2} />
        </LineChart>
       </ResponsiveContainer>
      ) : (
       <Box display='flex' alignItems='center' justifyContent='center' height='90%'>
        <Typography color='text.secondary'>No time series data available</Typography>
       </Box>
      )}
     </Paper>
    </Box>

    {/* Status Code Distribution */}
    <Box sx={{ flex: "1 1 calc(33.33% - 12px)", minWidth: 300 }}>
     <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant='h6' gutterBottom>
       Status Code Distribution
      </Typography>
      {statusCodeData.length > 0 ? (
       <ResponsiveContainer width='100%' height='90%'>
        <PieChart>
         <Pie data={statusCodeData} cx='50%' cy='50%' labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} fill='#8884d8' dataKey='value'>
          {statusCodeData.map((_entry, index) => (
           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
         </Pie>
         <Tooltip />
        </PieChart>
       </ResponsiveContainer>
      ) : (
       <Box display='flex' alignItems='center' justifyContent='center' height='90%'>
        <Typography color='text.secondary'>No status code data available</Typography>
       </Box>
      )}
     </Paper>
    </Box>

    {/* Top Endpoints */}
    <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: 300 }}>
     <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant='h6' gutterBottom>
       Top Endpoints
      </Typography>
      {topEndpointsData.length > 0 ? (
       <ResponsiveContainer width='100%' height='90%'>
        <BarChart data={topEndpointsData} layout='horizontal'>
         <CartesianGrid strokeDasharray='3 3' />
         <XAxis type='number' />
         <YAxis dataKey='endpoint' type='category' width={150} />
         <Tooltip />
         <Legend />
         <Bar dataKey='requests' fill='#8884d8' />
        </BarChart>
       </ResponsiveContainer>
      ) : (
       <Box display='flex' alignItems='center' justifyContent='center' height='90%'>
        <Typography color='text.secondary'>No endpoint data available</Typography>
       </Box>
      )}
     </Paper>
    </Box>

    {/* Method Distribution */}
    <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: 300 }}>
     <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant='h6' gutterBottom>
       HTTP Method Distribution
      </Typography>
      {methodDistributionData.length > 0 ? (
       <ResponsiveContainer width='100%' height='90%'>
        <BarChart data={methodDistributionData}>
         <CartesianGrid strokeDasharray='3 3' />
         <XAxis dataKey='name' />
         <YAxis />
         <Tooltip />
         <Legend />
         <Bar dataKey='value' fill='#82ca9d' />
        </BarChart>
       </ResponsiveContainer>
      ) : (
       <Box display='flex' alignItems='center' justifyContent='center' height='90%'>
        <Typography color='text.secondary'>No method data available</Typography>
       </Box>
      )}
     </Paper>
    </Box>
   </Box>
  </Box>
 );
}
