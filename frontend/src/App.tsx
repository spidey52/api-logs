import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import Layout from "./components/Layout";
import { setRouterNavigate } from "./lib/api";
import { setStoreNavigate } from "./store/appStore";

function App() {
 const router = useRouterState();
 const navigate = useNavigate();
 const isSetupPage = router.location.pathname === "/setup";

 // Detect system dark mode preference
 const prefersDarkMode = useMediaQuery("(prefers-color-scheme: light)");

 // Create theme based on dark mode preference
 const theme = useMemo(
  () =>
   createTheme({
    palette: {
     mode: prefersDarkMode ? "dark" : "light",
    },
   }),
  [prefersDarkMode],
 );

 // Set router navigate function for API interceptor and store
 useEffect(() => {
  setRouterNavigate(navigate);
  setStoreNavigate(navigate);
 }, [navigate]);

 return (
  <ThemeProvider theme={theme}>
   <CssBaseline />
   {isSetupPage ? (
    <Outlet />
   ) : (
    <Layout>
     <Outlet />
    </Layout>
   )}
  </ThemeProvider>
 );
}

export default App;
