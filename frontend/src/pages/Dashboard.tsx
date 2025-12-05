import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { logsApi, projectsApi } from "../lib/api";

export default function DashboardPage() {
 const { data: projects, isLoading: projectsLoading } = useQuery({
  queryKey: ["projects"],
  queryFn: () => projectsApi.getAll().then((res) => res.data),
 });

 const { data: logs, isLoading: logsLoading } = useQuery({
  queryKey: ["logs", { limit: 10 }],
  queryFn: () => logsApi.getAll({ limit: 10 }).then((res) => res.data),
 });

 if (projectsLoading || logsLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 return (
  <Box>
   <Typography variant='h4' gutterBottom>
    Dashboard
   </Typography>
   <Box
    sx={{
     display: "grid",
     gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
     gap: 3,
    }}
   >
    <Card>
     <CardContent>
      <Typography color='textSecondary' gutterBottom>
       Total Projects
      </Typography>
      <Typography variant='h3'>{projects?.total || 0}</Typography>
     </CardContent>
    </Card>
    <Card>
     <CardContent>
      <Typography color='textSecondary' gutterBottom>
       Total Logs
      </Typography>
      <Typography variant='h3'>{logs?.total || 0}</Typography>
     </CardContent>
    </Card>
    <Card>
     <CardContent>
      <Typography color='textSecondary' gutterBottom>
       Recent Logs
      </Typography>
      <Typography variant='h3'>{logs?.data.length || 0}</Typography>
     </CardContent>
    </Card>
    <Card>
     <CardContent>
      <Typography color='textSecondary' gutterBottom>
       Success Rate
      </Typography>
      <Typography variant='h3'>{logs?.data.filter((l) => l.status_code < 400).length || 0}</Typography>
     </CardContent>
    </Card>
   </Box>
  </Box>
 );
}
