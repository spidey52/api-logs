import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import App from "./App";
import ApiKeySetupPage from "./pages/ApiKeySetup";
import DashboardPage from "./pages/Dashboard";
import LogDetailPage from "./pages/LogDetail";
import LogsPage from "./pages/Logs";
import ProjectDetailPage from "./pages/ProjectDetail";
import ProjectsPage from "./pages/Projects";
import UsersPage from "./pages/Users";
import { appStore } from "./store/appStore";

const rootRoute = createRootRoute({
 component: App,
});

const apiKeySetupRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/setup",
 component: ApiKeySetupPage,
});

const checkAuth = () => {
 const apiKey = appStore.state.apiKey;
 if (!apiKey) {
  throw redirect({ to: "/setup" });
 }
};

const indexRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/",
 component: DashboardPage,
 beforeLoad: checkAuth,
});

const projectsRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/projects",
 component: ProjectsPage,
 beforeLoad: checkAuth,
});

const projectDetailRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/projects/$projectId",
 component: ProjectDetailPage,
 beforeLoad: checkAuth,
});

const logsRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/logs",
 component: LogsPage,
 beforeLoad: checkAuth,
});

const logDetailRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/logs/$logId",
 component: LogDetailPage,
 beforeLoad: checkAuth,
});

const usersRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/users",
 component: UsersPage,
 beforeLoad: checkAuth,
});

const routeTree = rootRoute.addChildren([apiKeySetupRoute, indexRoute, projectsRoute, projectDetailRoute, logsRoute, logDetailRoute, usersRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
 interface Register {
  router: typeof router;
 }
}
