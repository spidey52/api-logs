import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import { setRouterNavigate } from "./lib/api";
import { setStoreNavigate } from "./store/appStore";

function App() {
 const router = useRouterState();
 const navigate = useNavigate();
 const isSetupPage = router.location.pathname === "/setup";

 // Detect system dark mode preference
 const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
 const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

 // Determine actual theme mode
 const actualMode = themeMode === "system" ? (prefersDarkMode ? "dark" : "light") : themeMode;

 // Create theme based on mode
 const theme = useMemo(
  () =>
   createTheme({
    palette: {
     mode: actualMode,
    },
   }),
  [actualMode],
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
    <Layout themeMode={themeMode} onThemeChange={setThemeMode}>
     <Outlet />
    </Layout>
   )}
  </ThemeProvider>
 );
}

export default App;
