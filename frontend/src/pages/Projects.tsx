import { Add, Delete, Visibility } from "@mui/icons-material";
import { Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { projectsApi } from "../lib/api";

export default function ProjectsPage() {
 const queryClient = useQueryClient();
 const [open, setOpen] = useState(false);
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");

 const { data, isLoading } = useQuery({
  queryKey: ["projects"],
  queryFn: () => projectsApi.getAll().then((res) => res.data),
 });

 const createMutation = useMutation({
  mutationFn: projectsApi.create,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["projects"] });
   setOpen(false);
   setName("");
   setDescription("");
  },
 });

 const deleteMutation = useMutation({
  mutationFn: projectsApi.delete,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["projects"] });
  },
 });

 const handleCreate = () => {
  createMutation.mutate({ name, description });
 };

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 return (
  <Box>
   <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
    <Typography variant='h4'>Projects</Typography>
    <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)}>
     New Project
    </Button>
   </Box>

   <Box
    sx={{
     display: "grid",
     gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
     gap: 3,
    }}
   >
    {data?.data.map((project) => (
     <Card key={project.id}>
      <CardContent>
       <Typography variant='h6' gutterBottom>
        {project.name}
       </Typography>
       <Typography color='textSecondary' paragraph>
        {project.description}
       </Typography>
       <Chip label={`API Key: ${project.api_key.substring(0, 8)}...`} size='small' sx={{ mb: 1 }} />
       <Typography variant='caption' display='block'>
        Created: {new Date(project.created_at).toLocaleDateString()}
       </Typography>
      </CardContent>
      <CardActions>
       <IconButton component={Link} to={`/projects/${project.id}`} size='small' color='primary'>
        <Visibility />
       </IconButton>
       <IconButton size='small' color='error' onClick={() => deleteMutation.mutate(project.id)}>
        <Delete />
       </IconButton>
      </CardActions>
     </Card>
    ))}
   </Box>

   <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
    <DialogTitle>Create New Project</DialogTitle>
    <DialogContent>
     <TextField autoFocus margin='dense' label='Project Name' fullWidth value={name} onChange={(e) => setName(e.target.value)} />
     <TextField margin='dense' label='Description' fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setOpen(false)}>Cancel</Button>
     <Button onClick={handleCreate} variant='contained' disabled={!name || createMutation.isPending}>
      Create
     </Button>
    </DialogActions>
   </Dialog>
  </Box>
 );
}
