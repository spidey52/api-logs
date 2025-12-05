import { Box, Chip, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
import DataTable, { type Column } from "../components/DataTable";
import FilterToolbar, { type FilterConfig } from "../components/FilterToolbar";
import { usersApi } from "../lib/api";
import { getFilterValueFromUrl } from "../lib/filterUtils";
import { formatters } from "../lib/formatters";
import type { User } from "../lib/types";
import { filterPreferencesStore, setFilterOrder, toggleFilterVisibility } from "../store/filterPreferencesStore";

export default function UsersPage() {
 const searchParams = useSearch({ from: "/users" }) as Record<string, string | undefined>;

 // Default filter configurations
 const defaultVisibleFilters = ["name"];
 const defaultFilterOrder = ["name", "identifier", "email"];

 // Get filter preferences from store
 const filterPreferences = useStore(filterPreferencesStore);
 const visibleFilters = filterPreferences.visibleFilters.users || defaultVisibleFilters;
 const filterOrder = filterPreferences.filterOrder.users || defaultFilterOrder;

 // Initialize filter states from URL query params
 const [searchName, setSearchName] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "name", "text") as string | undefined);
 const [searchIdentifier, setSearchIdentifier] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "identifier", "text") as string | undefined);
 const [searchEmail, setSearchEmail] = useState<string | undefined>(getFilterValueFromUrl(searchParams, "email", "text") as string | undefined);

 const handleVisibilityToggle = (filterId: string) => {
  toggleFilterVisibility("users", filterId, defaultVisibleFilters);
 };

 const handleReorder = (newOrder: FilterConfig[]) => {
  const orderIds = newOrder.map((f) => f.id);
  setFilterOrder("users", orderIds);
 };

 const handleClearAll = () => {
  setSearchName("");
  setSearchIdentifier("");
  setSearchEmail("");
 };

 const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: () => usersApi.getAll().then((res) => res.data),
 });

 // Filter users based on filter values
 const filteredUsers =
  data?.data.filter((user) => {
   if (searchName && !user.name.toLowerCase().includes(searchName.toLowerCase())) return false;
   if (searchIdentifier && !user.identifier.toLowerCase().includes(searchIdentifier.toLowerCase())) return false;
   if (searchEmail && user.email && !user.email.toLowerCase().includes(searchEmail.toLowerCase())) return false;
   return true;
  }) || [];

 const filterConfigsMap: Record<string, FilterConfig> = {
  name: {
   id: "name",
   label: "Name",
   type: "text",
   value: searchName,
   onChange: (value) => setSearchName(value as string),
   visible: visibleFilters.includes("name"),
   size: 2,
  },
  identifier: {
   id: "identifier",
   label: "Identifier",
   type: "text",
   value: searchIdentifier,
   onChange: (value) => setSearchIdentifier(value as string),
   visible: visibleFilters.includes("identifier"),
   size: 2,
  },
  email: {
   id: "email",
   label: "Email",
   type: "text",
   value: searchEmail,
   onChange: (value) => setSearchEmail(value as string),
   visible: visibleFilters.includes("email"),
   size: 2,
  },
 };

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
    <FilterToolbar title='Users' filters={filterConfigs} onVisibilityToggle={handleVisibilityToggle} onReorder={handleReorder} onClearAll={handleClearAll} maxToolbarUnits={12} urlPath='/users' />

    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
     <DataTable columns={columns} data={filteredUsers} loading={isLoading} stickyHeader pageKey='users' />
    </Box>
   </Paper>
  </Box>
 );
}
