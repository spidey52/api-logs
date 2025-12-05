import { Store } from "@tanstack/react-store";
import type { Project } from "../lib/types";

interface AppState {
 selectedProject: Project | null;
 sidebarOpen: boolean;
}

export const appStore = new Store<AppState>({
 selectedProject: null,
 sidebarOpen: true,
});

export const setSelectedProject = (project: Project | null) => {
 appStore.setState((state) => ({
  ...state,
  selectedProject: project,
 }));
};

export const toggleSidebar = () => {
 appStore.setState((state) => ({
  ...state,
  sidebarOpen: !state.sidebarOpen,
 }));
};
