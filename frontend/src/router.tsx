import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import App from "./App";
import DashboardPage from "./pages/Dashboard";
import ProjectsPage from "./pages/Projects";
import LogsPage from "./pages/Logs";
import UsersPage from "./pages/Users";
import ProjectDetailPage from "./pages/ProjectDetail";
import LogDetailPage from "./pages/LogDetail";

const rootRoute = createRootRoute({
 component: App,
});

const indexRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/",
 component: DashboardPage,
});

const projectsRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/projects",
 component: ProjectsPage,
});

const projectDetailRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/projects/$projectId",
 component: ProjectDetailPage,
});

const logsRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/logs",
 component: LogsPage,
});

const logDetailRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/logs/$logId",
 component: LogDetailPage,
});

const usersRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/users",
 component: UsersPage,
});

const routeTree = rootRoute.addChildren([indexRoute, projectsRoute, projectDetailRoute, logsRoute, logDetailRoute, usersRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
 interface Register {
  router: typeof router;
 }
}
