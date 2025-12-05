import { Dashboard, Description, Folder, Logout, Menu as MenuIcon, People } from "@mui/icons-material";
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import type { ReactNode } from "react";
import { GLOBAL_SHORTCUTS } from "../lib/globalShortcuts";
import { useKeyboardShortcut } from "../lib/keyboardRegistry";
import { appStore, clearApiKey, toggleSidebar } from "../store/appStore";
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
}

export default function Layout({ children }: LayoutProps) {
 const sidebarOpen = useStore(appStore, (state) => state.sidebarOpen);
 const router = useRouterState();
 const navigate = useNavigate();
 const currentPath = router.location.pathname;

 const handleLogout = () => {
  clearApiKey();
  navigate({ to: "/setup" });
 };

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
     <KeyboardShortcutsButton />
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
    <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1 }}>{children}</Box>
   </Box>
  </Box>
 );
}
