import { Outlet } from "@tanstack/react-router";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Layout from "./components/Layout";

const theme = createTheme({
 palette: {
  mode: "light",
  primary: {
   main: "#1976d2",
  },
  secondary: {
   main: "#dc004e",
  },
 },
});

function App() {
 return (
  <ThemeProvider theme={theme}>
   <CssBaseline />
   <Layout>
    <Outlet />
   </Layout>
  </ThemeProvider>
 );
}

export default App;
