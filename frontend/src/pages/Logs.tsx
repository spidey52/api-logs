import { Close, Download, MoreVert, Visibility } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import dayjs from "dayjs";
import { useState } from "react";
import DataTable, { type Column, type DataTableAction } from "../components/DataTable";
import FilterToolbar, { type FilterConfig } from "../components/FilterToolbar";
import DateFilter from "../components/filters/DateFilter";
import DateRangeFilter from "../components/filters/DateRangeFilter";
import PathAutocompleteFilter from "../components/filters/PathAutocompleteFilter";
import SearchFilter from "../components/filters/SearchFilter";
import StatusCodeRangeFilter from "../components/filters/StatusCodeRangeFilter";
import { logsApi } from "../lib/api";
import { getFilterValueFromUrl } from "../lib/filterUtils";
import { formatters } from "../lib/formatters";
import type { APILog, LogFilters } from "../lib/types";
import { filterPreferencesStore, setFilterOrder, setFilterSize, toggleFilterVisibility } from "../store/filterPreferencesStore";

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
 const navigate = useNavigate();
 const searchParams = useSearch({ from: "/logs" }) as Record<string, string | undefined>;

 // Get logId from query params for dialog
 const selectedLogId = searchParams.logId;
 const [activePresetName, setActivePresetName] = useState<string | null>(null);
 const [isExporting, setIsExporting] = useState(false);
 const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);

 // Default filter configurations
 const defaultVisibleFilters = ["method", "environment", "statusCode", "search"];
 const defaultFilterOrder = ["search", "method", "environment", "statusCode", "date", "dateRange", "path", "projectId"];

 // Get filter preferences from store
 const filterPreferences = useStore(filterPreferencesStore);
 const visibleFilters = filterPreferences.visibleFilters.logs || defaultVisibleFilters;
 const filterOrder = filterPreferences.filterOrder.logs || defaultFilterOrder;

 // Initialize filters from URL query params
 const [filters, setFilters] = useState<LogFilters>(() => ({
  page: searchParams.page ? parseInt(searchParams.page) : 1,
  limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
  method: getFilterValueFromUrl(searchParams, "method", "text") as string | undefined,
  environment: getFilterValueFromUrl(searchParams, "environment", "text") as string | undefined,
  statusCode: getFilterValueFromUrl(searchParams, "statusCode", "text") as string | number | undefined,
  date: getFilterValueFromUrl(searchParams, "date", "text") as string | undefined,
  dateRange: (getFilterValueFromUrl(searchParams, "dateRange", "text") as string) || `${dayjs().format("YYYY-MM-DD")}|${dayjs().format("YYYY-MM-DD")}`,
  path: getFilterValueFromUrl(searchParams, "path", "text") as string | undefined,
  projectId: getFilterValueFromUrl(searchParams, "projectId", "text") as string | undefined,
  search: getFilterValueFromUrl(searchParams, "search", "text") as string | undefined,
 }));

 const handleVisibilityToggle = (filterId: string) => {
  toggleFilterVisibility("logs", filterId, defaultVisibleFilters);
 };

 const handleReorder = (newOrder: FilterConfig[]) => {
  const orderIds = newOrder.map((f) => f.id);
  setFilterOrder("logs", orderIds);
 };

 const handleSizeChange = (filterId: string, newSize: FilterConfig["size"]) => {
  if (newSize) {
   setFilterSize("logs", filterId, newSize);
  }
 };

 const handleClearAll = () => {
  setFilters({
   page: 1,
   limit: 50,
  });
  setActivePresetName(null);
 };

 const handleLoadPreset = (presetFilters: Record<string, unknown>, presetName: string) => {
  // Clear all filters and apply preset
  setFilters({
   page: 1,
   limit: 50,
   ...presetFilters,
  } as LogFilters);
  setActivePresetName(presetName);
 };

 const exportToCSV = async () => {
  try {
   setIsExporting(true);
   // Fetch all data with current filters (without pagination)
   const response = await logsApi.getAll({ ...filters, page: 1, limit: 10000 });
   const logs = response.data.data;

   // Create CSV headers
   const headers = ["Method", "Path", "Status Code", "Response Time (ms)", "Environment", "Timestamp"];
   const csvContent = [
    headers.join(","),
    ...logs.map((log) => [log.method, `"${log.path}"`, log.status_code, log.response_time, log.environment, new Date(log.timestamp).toISOString()].join(",")),
   ].join("\n");

   // Download file
   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
   const link = document.createElement("a");
   link.href = URL.createObjectURL(blob);
   link.download = `api-logs-${new Date().toISOString().split("T")[0]}.csv`;
   link.click();
   URL.revokeObjectURL(link.href);
  } catch (error) {
   console.error("Export failed:", error);
  } finally {
   setIsExporting(false);
  }
 };

 const exportToJSON = async () => {
  try {
   setIsExporting(true);
   // Fetch all data with current filters (without pagination)
   const response = await logsApi.getAll({ ...filters, page: 1, limit: 10000 });
   const logs = response.data.data;

   // Download file
   const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
   const link = document.createElement("a");
   link.href = URL.createObjectURL(blob);
   link.download = `api-logs-${new Date().toISOString().split("T")[0]}.json`;
   link.click();
   URL.revokeObjectURL(link.href);
  } catch (error) {
   console.error("Export failed:", error);
  } finally {
   setIsExporting(false);
  }
 };

 const { data, isLoading } = useQuery({
  queryKey: ["logs", filters],
  queryFn: () => logsApi.getAll(filters).then((res) => res.data),
 });

 // Fetch selected log details
 const { data: selectedLog, isLoading: isLoadingLog } = useQuery({
  queryKey: ["log", selectedLogId],
  queryFn: () => logsApi.getById(selectedLogId!).then((res) => res.data),
  enabled: !!selectedLogId,
 });

 const handleCloseDialog = () => {
  const rest = Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== "logId"));
  navigate({
   to: "/logs",
   search: rest,
   replace: true,
  });
 };

 const handleOpenDialog = (logId: string) => {
  navigate({
   to: "/logs",
   search: { ...searchParams, logId },
   replace: true,
  });
 };

 const filterConfigsMap: Record<string, FilterConfig> = {
  search: {
   id: "search",
   label: "Search",
   type: "custom",
   value: filters.search,
   onChange: (value) => setFilters({ ...filters, search: value as string }),
   visible: visibleFilters.includes("search"),
   size: 3,
   customComponent: SearchFilter,
  },
  method: {
   id: "method",
   label: "Method",
   type: "select",
   value: filters.method,
   options: [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" },
    { value: "PATCH", label: "PATCH" },
   ],
   onChange: (value) => setFilters({ ...filters, method: value as string }),
   visible: visibleFilters.includes("method"),
   size: 1,
  },
  environment: {
   id: "environment",
   label: "Environment",
   type: "select",
   value: filters.environment,
   options: [
    { value: "dev", label: "Development" },
    { value: "staging", label: "Staging" },
    { value: "production", label: "Production" },
   ],
   onChange: (value) => setFilters({ ...filters, environment: value as string }),
   visible: visibleFilters.includes("environment"),
   size: 1,
  },
  statusCode: {
   id: "statusCode",
   label: "Status Code",
   type: "custom",
   value: filters.statusCode,
   onChange: (value) => setFilters({ ...filters, statusCode: value as number | string }),
   visible: visibleFilters.includes("statusCode"),
   size: 1.5,
   customComponent: StatusCodeRangeFilter,
  },
  date: {
   id: "date",
   label: "Date",
   type: "custom",
   value: filters.date,
   onChange: (value) => setFilters({ ...filters, date: value as string }),
   visible: visibleFilters.includes("date"),
   size: 1.5,
   customComponent: DateFilter,
  },
  dateRange: {
   id: "dateRange",
   label: "Date Range",
   type: "custom",
   value: filters.dateRange,
   onChange: (value) => setFilters({ ...filters, dateRange: value as string }),
   visible: visibleFilters.includes("dateRange"),
   size: 2.5,
   customComponent: DateRangeFilter,
  },
  path: {
   id: "path",
   label: "Path",
   type: "custom",
   value: filters.path,
   onChange: (value) => setFilters({ ...filters, path: value as string }),
   visible: visibleFilters.includes("path"),
   size: 2,
   customComponent: PathAutocompleteFilter,
  },
  projectId: {
   id: "projectId",
   label: "Project ID",
   type: "text",
   value: filters.projectId,
   onChange: (value) => setFilters({ ...filters, projectId: value as string }),
   visible: visibleFilters.includes("projectId"),
   size: 3,
  },
 };

 // Order filters based on saved order
 const filterConfigs: FilterConfig[] = filterOrder
  .map((id) => {
   const config = filterConfigsMap[id];
   if (!config) return null;

   // Apply custom size from store if available
   const customSize = filterPreferences.filterSizes?.logs?.[id];
   if (customSize !== undefined && customSize !== null) {
    return { ...config, size: customSize as FilterConfig["size"] };
   }
   return config;
  })
  .filter(Boolean) as FilterConfig[];

 const columns: Column<APILog>[] = [
  {
   id: "method",
   label: "Method",
   minWidth: 80,
   format: (value) => <Chip label={value as string} size='small' color={getMethodColor(value as string)} />,
  },
  {
   id: "path",
   label: "Path",
   minWidth: 200,
  },
  {
   id: "status_code",
   label: "Status",
   minWidth: 80,
   format: (value) => formatters.statusBadge(value as number),
  },
  {
   id: "response_time_ms",
   label: "Response Time",
   minWidth: 120,
   format: (value) => formatters.duration(value as number),
  },
  {
   id: "environment",
   label: "Environment",
   minWidth: 100,
   format: (value) => <Chip label={value as string} size='small' />,
  },
  {
   id: "timestamp",
   label: "Timestamp",
   minWidth: 160,
   format: (value) => formatters.dateTime(value as string),
  },
 ];

 const actions: DataTableAction<APILog>[] = [
  {
   icon: <Visibility />,
   label: "View Details",
   onClick: (log) => handleOpenDialog(log.id),
   color: "primary",
  },
 ];

 return (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
   <Paper sx={{ border: 1, borderColor: "divider", borderRadius: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <FilterToolbar
     title='API Logs'
     filters={filterConfigs}
     onVisibilityToggle={handleVisibilityToggle}
     onReorder={handleReorder}
     onSizeChange={handleSizeChange}
     onClearAll={handleClearAll}
     maxToolbarUnits={12}
     urlPath='/logs'
     pageKey='logs'
     currentFilters={filters as Record<string, unknown>}
     onLoadPreset={handleLoadPreset}
     activePresetName={activePresetName}
     actions={
      <Button variant='outlined' startIcon={<MoreVert />} size='small' onClick={(e) => setActionsAnchorEl(e.currentTarget)} sx={{ height: 40, minWidth: 120 }}>
       Actions
      </Button>
     }
    />

    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
     <DataTable
      columns={columns}
      data={data?.data || []}
      loading={isLoading}
      page={filters.page ? filters.page - 1 : 0}
      rowsPerPage={filters.limit || 50}
      totalRows={data?.total}
      onPageChange={(page) => setFilters({ ...filters, page: page + 1 })}
      onRowsPerPageChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
      actions={actions}
      stickyHeader
      density='compact'
      pageKey='logs'
     />
    </Box>
   </Paper>

   {/* Log Details Dialog */}
   <Dialog open={!!selectedLogId} onClose={handleCloseDialog} maxWidth='lg' fullWidth>
    <DialogTitle>
     <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Box display='flex' gap={2} alignItems='center'>
       <Typography variant='h6'>Log Details</Typography>
       {selectedLog && (
        <>
         <Chip label={selectedLog.method} color={getMethodColor(selectedLog.method)} size='small' />
         <Chip label={selectedLog.status_code} size='small' />
         <Chip label={selectedLog.environment} variant='outlined' size='small' />
        </>
       )}
      </Box>
      <IconButton onClick={handleCloseDialog} size='small'>
       <Close />
      </IconButton>
     </Box>
    </DialogTitle>
    <DialogContent dividers>
     {isLoadingLog ? (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
       <CircularProgress />
      </Box>
     ) : selectedLog ? (
      <Stack spacing={3}>
       <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Paper sx={{ p: 2, flex: 1 }} variant='outlined'>
         <Typography variant='subtitle1' fontWeight='bold' gutterBottom>
          Request Info
         </Typography>
         <Typography variant='body2'>
          <strong>Path:</strong> {selectedLog.path}
         </Typography>
         <Typography variant='body2'>
          <strong>Method:</strong> {selectedLog.method}
         </Typography>
         <Typography variant='body2'>
          <strong>Status:</strong> {selectedLog.status_code}
         </Typography>
         <Typography variant='body2'>
          <strong>Response Time:</strong> {selectedLog.response_time_ms}ms
         </Typography>
         <Typography variant='body2'>
          <strong>IP Address:</strong> {selectedLog.ip_address || "-"}
         </Typography>
         <Typography variant='body2'>
          <strong>User Agent:</strong> {selectedLog.user_agent || "-"}
         </Typography>
         <Typography variant='body2'>
          <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
         </Typography>
        </Paper>

        {selectedLog.request_headers && (
         <Paper sx={{ p: 2, flex: 1 }} variant='outlined'>
          <Typography variant='subtitle1' fontWeight='bold' gutterBottom>
           Request Headers
          </Typography>
          <pre style={{ fontSize: "0.875rem", overflow: "auto", margin: 0 }}>{JSON.stringify(selectedLog.request_headers, null, 2)}</pre>
         </Paper>
        )}
       </Stack>

       {selectedLog.response_headers && (
        <Paper sx={{ p: 2 }} variant='outlined'>
         <Typography variant='subtitle1' fontWeight='bold' gutterBottom>
          Response Headers
         </Typography>
         <pre style={{ fontSize: "0.875rem", overflow: "auto", margin: 0 }}>{JSON.stringify(selectedLog.response_headers, null, 2)}</pre>
        </Paper>
       )}
      </Stack>
     ) : (
      <Typography>Log not found</Typography>
     )}
    </DialogContent>
   </Dialog>

   {/* Actions Menu */}
   <Menu
    anchorEl={actionsAnchorEl}
    open={Boolean(actionsAnchorEl)}
    onClose={() => setActionsAnchorEl(null)}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
   >
    <MenuItem
     onClick={() => {
      exportToCSV();
      setActionsAnchorEl(null);
     }}
     disabled={isExporting || !data?.data?.length}
    >
     <ListItemIcon>
      <Download fontSize='small' />
     </ListItemIcon>
     <ListItemText primary='Export as CSV' secondary='Download filtered data as CSV' />
    </MenuItem>
    <MenuItem
     onClick={() => {
      exportToJSON();
      setActionsAnchorEl(null);
     }}
     disabled={isExporting || !data?.data?.length}
    >
     <ListItemIcon>
      <Download fontSize='small' />
     </ListItemIcon>
     <ListItemText primary='Export as JSON' secondary='Download filtered data as JSON' />
    </MenuItem>
   </Menu>
  </Box>
 );
}
