import { Dashboard, Description, Folder, Menu as MenuIcon, People } from "@mui/icons-material";
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import type { ReactNode } from "react";
import { appStore, toggleSidebar } from "../store/appStore";

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
 const currentPath = router.location.pathname;

 return (
  <Box sx={{ display: "flex" }}>
   <AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
    <Toolbar>
     <IconButton color='inherit' edge='start' onClick={toggleSidebar} sx={{ mr: 2 }}>
      <MenuIcon />
     </IconButton>
     <Typography variant='h6' noWrap component='div'>
      API Logs Dashboard
     </Typography>
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
    <Box sx={{ overflow: "auto" }}>
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
    </Box>
   </Drawer>
   <Box
    component='main'
    sx={{
     flexGrow: 1,
     p: 3,
     transition: "margin 0.3s",
     marginLeft: sidebarOpen ? 0 : `-${drawerWidth}px`,
    }}
   >
    <Toolbar />
    {children}
   </Box>
  </Box>
 );
}
