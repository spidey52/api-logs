import { Box, Card, CardContent, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { logsApi, projectsApi } from "../lib/api";

export default function ProjectDetailPage() {
 const { projectId } = useParams({ from: "/projects/$projectId" });

 const { data: project, isLoading: projectLoading } = useQuery({
  queryKey: ["project", projectId],
  queryFn: () => projectsApi.getById(projectId).then((res) => res.data),
 });

 const { data: logs } = useQuery({
  queryKey: ["logs", { projectId }],
  queryFn: () => logsApi.getAll({ projectId }).then((res) => res.data),
 });

 if (projectLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 return (
  <Box>
   <Typography variant='h4' gutterBottom>
    {project?.name}
   </Typography>
   <Typography color='textSecondary' paragraph>
    {project?.description}
   </Typography>

   <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2 }}>
    <Card sx={{ flex: 1 }}>
     <CardContent>
      <Typography variant='h6' gutterBottom>
       API Key
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
       <Typography fontFamily='monospace'>{project?.api_key}</Typography>
      </Paper>
     </CardContent>
    </Card>
    <Card sx={{ flex: 1 }}>
     <CardContent>
      <Typography variant='h6' gutterBottom>
       Statistics
      </Typography>
      <Typography>Total Logs: {logs?.total || 0}</Typography>
      <Typography>Created: {project && new Date(project.created_at).toLocaleString()}</Typography>
     </CardContent>
    </Card>
   </Stack>
  </Box>
 );
}
