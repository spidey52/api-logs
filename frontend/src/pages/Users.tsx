import { Box, Chip, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import DataTable, { type Column } from "../components/DataTable";
import FilterToolbar, { type FilterConfig } from "../components/FilterToolbar";
import { usersApi } from "../lib/api";
import { formatters } from "../lib/formatters";
import type { User } from "../lib/types";
import { filterPreferencesStore, setFilterOrder, toggleFilterVisibility } from "../store/filterPreferencesStore";

export default function UsersPage() {
 // Default filter configurations
 const defaultVisibleFilters = ["name"];
 const defaultFilterOrder = ["name", "identifier", "email"];

 // Get filter preferences from store
 const filterPreferences = useStore(filterPreferencesStore);
 const filterOrder = filterPreferences.filterOrder.users || defaultFilterOrder;

 // Initialize filter states from URL query params
 const handleVisibilityToggle = (filterId: string) => {
  toggleFilterVisibility("users", filterId, defaultVisibleFilters);
 };

 const handleReorder = (newOrder: FilterConfig[]) => {
  const orderIds = newOrder.map((f) => f.id);
  setFilterOrder("users", orderIds);
 };

 const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: () =>
   usersApi
    .getAll({
     limit: 100,
     page: 1,
    })
    .then((res) => res.data),
 });

 // Filter users based on filter values
 const filteredUsers =
  data?.data.filter(() => {
   return true;
  }) || [];

 const filterConfigsMap: Record<string, FilterConfig> = {};
 const filterConfigs: FilterConfig[] = filterOrder.map((id) => filterConfigsMap[id]).filter(Boolean);

 const columns: Column<User>[] = [
  {
   id: "name",
   label: "Name",
   minWidth: 200,
  },
  {
   id: "identifier",
   label: "Identifier",
   minWidth: 150,
   format: (value) => <Chip label={value as string} size='small' variant='outlined' />,
  },
  {
   id: "email",
   label: "Email",
   minWidth: 200,
   format: (value) => (value as string) || "-",
  },
  {
   id: "createdAt",
   label: "Created At",
   minWidth: 160,
   format: (value) => formatters.dateTime(value as string),
  },
 ];

 return (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
   <Paper sx={{ border: 1, borderColor: "divider", borderRadius: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <FilterToolbar title='Users' filters={filterConfigs} onVisibilityToggle={handleVisibilityToggle} onReorder={handleReorder} maxToolbarUnits={12} urlPath='/users' />

    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
     <DataTable columns={columns} page={0} rowsPerPage={100} totalRows={data?.total} data={filteredUsers} loading={isLoading} stickyHeader pageKey='users' />
    </Box>
   </Paper>
  </Box>
 );
}
