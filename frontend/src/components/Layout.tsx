import { DarkMode, Dashboard, Description, Folder, LightMode, Logout, Menu as MenuIcon, People, SettingsBrightness } from "@mui/icons-material";
import { AppBar, Box, Divider, Drawer, FormControl, IconButton, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Toolbar, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useMemo, type ReactNode } from "react";
import { projectsApi } from "../lib/api";
import { GLOBAL_SHORTCUTS } from "../lib/globalShortcuts";
import { useKeyboardShortcut } from "../lib/keyboardRegistry";
import { appStore, clearApiKey, setApiKey, toggleSidebar } from "../store/appStore";
import { KeyboardShortcutsButton } from "./KeyboardShortcutsButton";

const drawerWidth = 240;

const menuItems = [
 { path: "/", label: "Dashboard", icon: <Dashboard /> },
 { path: "/projects", label: "Projects", icon: <Folder /> },
 { path: "/logs", label: "Logs", icon: <Description /> },
 { path: "/users", label: "Users", icon: <People /> },
];

interface LayoutProps {
 children: ReactNode;
 themeMode: "light" | "dark" | "system";
 onThemeChange: (mode: "light" | "dark" | "system") => void;
}

export default function Layout({ children, themeMode, onThemeChange }: LayoutProps) {
 const sidebarOpen = useStore(appStore, (state) => state.sidebarOpen);
 const router = useRouterState();
 const navigate = useNavigate();
 const currentPath = router.location.pathname;

 const handleThemeToggle = () => {
  const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
  const currentIndex = modes.indexOf(themeMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  onThemeChange(modes[nextIndex]);
 };

 const handleLogout = () => {
  clearApiKey();
  navigate({ to: "/setup" });
 };

 const { apiKey } = useStore(appStore);

 const { data: projectsData } = useQuery({
  queryKey: ["layout-projects"],
  queryFn: () => projectsApi.getAll().then((res) => res.data),
  staleTime: 5 * 60 * 1000,
 });

 const projects = useMemo(() => projectsData?.data || [], [projectsData]);

 const selectedProject = useMemo(() => {
  const project = projects.find((p) => p.api_key === apiKey);
  return project || null;
 }, [apiKey, projects]);

 // Register global keyboard shortcuts
 useKeyboardShortcut(
  "layout-toggle-sidebar",
  {
   ...GLOBAL_SHORTCUTS.TOGGLE_SIDEBAR,
   handler: () => toggleSidebar(),
  },
  [],
 );

 useKeyboardShortcut(
  "layout-go-to-dashboard",
  {
   ...GLOBAL_SHORTCUTS.GO_TO_DASHBOARD,
   handler: () => navigate({ to: "/" }),
  },
  [],
 );

 useKeyboardShortcut(
  "layout-go-to-projects",
  {
   ...GLOBAL_SHORTCUTS.GO_TO_PROJECTS,
   handler: () => navigate({ to: "/projects" }),
  },
  [],
 );

 useKeyboardShortcut(
  "layout-go-to-logs",
  {
   ...GLOBAL_SHORTCUTS.GO_TO_LOGS,
   handler: () => navigate({ to: "/logs" }),
  },
  [],
 );

 useKeyboardShortcut(
  "layout-go-to-users",
  {
   ...GLOBAL_SHORTCUTS.GO_TO_USERS,
   handler: () => navigate({ to: "/users" }),
  },
  [],
 );

 return (
  <Box sx={{ display: "flex" }}>
   <AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
    <Toolbar>
     <IconButton color='inherit' edge='start' onClick={toggleSidebar} sx={{ mr: 2 }}>
      <MenuIcon />
     </IconButton>
     <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }}>
      API Logs Dashboard
     </Typography>
     {/* Project switcher */}
     <FormControl size='small' sx={{ minWidth: 200, mr: 2, color: "inherit" }}>
      <InputLabel id='project-switcher-label'>Project</InputLabel>
      <Select
       labelId='project-switcher-label'
       label='Project'
       value={selectedProject ? selectedProject.id : ""}
       onChange={(e) => {
        const val = e.target.value || null;
        setApiKey(projects.find((p) => p.id === val)?.api_key || "", val ? (val.startsWith("dev_") ? "dev" : "production") : "production");
       }}
      >
       {projects.map((p) => (
        <MenuItem key={p.id} value={p.id}>
         {p.name}
        </MenuItem>
       ))}
      </Select>
     </FormControl>
     <KeyboardShortcutsButton />
     <IconButton color='inherit' onClick={handleThemeToggle} title={`Theme: ${themeMode}`}>
      {themeMode === "light" ? <LightMode /> : themeMode === "dark" ? <DarkMode /> : <SettingsBrightness />}
     </IconButton>
     <IconButton color='inherit' onClick={handleLogout} title='Change API Key'>
      <Logout />
     </IconButton>
    </Toolbar>
   </AppBar>
   <Drawer
    variant='persistent'
    open={sidebarOpen}
    sx={{
     width: drawerWidth,
     flexShrink: 0,
     "& .MuiDrawer-paper": {
      width: drawerWidth,
      boxSizing: "border-box",
     },
    }}
   >
    <Toolbar />
    <Box sx={{ overflow: "auto", display: "flex", flexDirection: "column", height: "100%" }}>
     <List>
      {menuItems.map((item) => (
       <ListItem key={item.path} disablePadding>
        <ListItemButton component={Link} to={item.path} selected={currentPath === item.path}>
         <ListItemIcon>{item.icon}</ListItemIcon>
         <ListItemText primary={item.label} />
        </ListItemButton>
       </ListItem>
      ))}
     </List>
     <Box sx={{ flexGrow: 1 }} />
     <Divider />
     <List>
      <ListItem disablePadding>
       <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
         <Logout />
        </ListItemIcon>
        <ListItemText primary='Change API Key' />
       </ListItemButton>
      </ListItem>
     </List>
    </Box>
   </Drawer>
   <Box
    component='main'
    sx={{
     flexGrow: 1,
     height: "100vh",
     overflow: "hidden",
     display: "flex",
     flexDirection: "column",
     transition: "margin 0.3s",
     marginLeft: sidebarOpen ? 0 : `-${drawerWidth}px`,
    }}
   >
    <Toolbar />
    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>{children}</Box>
   </Box>
  </Box>
 );
}
