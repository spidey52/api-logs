import { Add, Delete, Edit, Visibility } from "@mui/icons-material";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
import DataTable, { type Column, type DataTableAction } from "../components/DataTable";
import FilterToolbar, { type FilterConfig } from "../components/FilterToolbar";
import { projectsApi } from "../lib/api";
import { getFilterValueFromUrl } from "../lib/filterUtils";
import { formatters } from "../lib/formatters";
import type { Project } from "../lib/types";
import { filterPreferencesStore, setFilterOrder, toggleFilterVisibility } from "../store/filterPreferencesStore";

export default function ProjectsPage() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const searchParams = useSearch({ from: "/projects" }) as Record<string, string | undefined>;

 const [open, setOpen] = useState(false);
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");

 // Default filter configurations
 const defaultVisibleFilters = ["name"];
 const defaultFilterOrder = ["name", "startDate", "endDate"];

 // Get filter preferences from store
 const filterPreferences = useStore(filterPreferencesStore);
 const visibleFilters = filterPreferences.visibleFilters.projects || defaultVisibleFilters;
 const filterOrder = filterPreferences.filterOrder.projects || defaultFilterOrder;

 // Initialize filter states from URL query params
 const [searchName, setSearchName] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "name", "text") as string | undefined);
 const [startDate, setStartDate] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "startDate", "date") as string | undefined);
 const [endDate, setEndDate] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "endDate", "date") as string | undefined);

 const handleVisibilityToggle = (filterId: string) => {
  toggleFilterVisibility("projects", filterId, defaultVisibleFilters);
 };

 const handleReorder = (newOrder: FilterConfig[]) => {
  const orderIds = newOrder.map((f) => f.id);
  setFilterOrder("projects", orderIds);
 };

 const handleClearAll = () => {
  setSearchName(undefined);
  setStartDate(undefined);
  setEndDate(undefined);
 };

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

 // Filter projects based on filter values
 const filteredProjects =
  data?.data.filter((project) => {
   if (searchName && !project.name.toLowerCase().includes(searchName.toLowerCase())) return false;
   if (startDate && new Date(project.created_at) < new Date(startDate)) return false;
   if (endDate && new Date(project.created_at) > new Date(endDate)) return false;
   return true;
  }) || [];

 const filterConfigsMap: Record<string, FilterConfig> = {
  name: {
   id: "name",
   label: "Project Name",
   type: "text",
   value: searchName,
   onChange: (value) => setSearchName(value as string),
   visible: visibleFilters.includes("name"),
   size: 2,
  },
  startDate: {
   id: "startDate",
   label: "Start Date",
   type: "date",
   value: startDate,
   onChange: (value) => setStartDate(value as string),
   visible: visibleFilters.includes("startDate"),
   size: 2,
  },
  endDate: {
   id: "endDate",
   label: "End Date",
   type: "date",
   value: endDate,
   onChange: (value) => setEndDate(value as string),
   visible: visibleFilters.includes("endDate"),
   size: 2,
  },
 };

 const filterConfigs: FilterConfig[] = filterOrder.map((id) => filterConfigsMap[id]).filter(Boolean);

 const columns: Column<Project>[] = [
  {
   id: "name",
   label: "Project Name",
   minWidth: 200,
  },
  {
   id: "description",
   label: "Description",
   minWidth: 300,
   format: (value) => formatters.truncate(value as string, 80),
  },
  {
   id: "api_key",
   label: "API Key",
   minWidth: 150,
   format: (value) => <Chip label={`${(value as string).substring(0, 12)}...`} size='small' variant='outlined' />,
  },
  {
   id: "created_at",
   label: "Created",
   minWidth: 160,
   format: (value) => formatters.dateTime(value as string),
  },
 ];

 const actions: DataTableAction<Project>[] = [
  {
   icon: <Visibility />,
   label: "View Details",
   onClick: (project) => navigate({ to: `/projects/${project.id}` }),
   color: "primary",
  },
  {
   icon: <Edit />,
   label: "Edit",
   onClick: () => {},
   color: "info",
  },
  {
   icon: <Delete />,
   label: "Delete",
   onClick: (project) => {
    if (confirm(`Delete project "${project.name}"?`)) {
     deleteMutation.mutate(project.id);
    }
   },
   color: "error",
  },
 ];

 return (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
   <Paper sx={{ border: 1, borderColor: "divider", borderRadius: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <FilterToolbar
     title='Projects'
     filters={filterConfigs}
     onVisibilityToggle={handleVisibilityToggle}
     onReorder={handleReorder}
     onClearAll={handleClearAll}
     maxToolbarUnits={12}
     urlPath='/projects'
     actions={
      <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)} size='small'>
       New Project
      </Button>
     }
    />

    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
     <DataTable columns={columns} data={filteredProjects} loading={isLoading} actions={actions} onRowClick={(project) => navigate({ to: `/projects/${project.id}` })} stickyHeader pageKey='projects' />
    </Box>
   </Paper>

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
