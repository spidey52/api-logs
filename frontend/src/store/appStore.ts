import { Store } from "@tanstack/react-store";

interface AppState {
  sidebarOpen: boolean;
  apiKey: string | null;
  environment: "dev" | "production";
}

// Initialize from localStorage
const initialApiKey = localStorage.getItem("apiKey");
const initialEnvironment = (localStorage.getItem("environment") || "dev") as "dev" | "production";

export const appStore = new Store<AppState>({
  sidebarOpen: true,
  apiKey: initialApiKey,
  environment: initialEnvironment,
});

export const toggleSidebar = () => {
  appStore.setState((state) => ({
    ...state,
    sidebarOpen: !state.sidebarOpen,
  }));
};

export const setApiKey = (apiKey: string, environment: "dev" | "production") => {
  // Update localStorage
  localStorage.setItem("apiKey", apiKey);
  localStorage.setItem("environment", environment);

  // Update store
  appStore.setState((state) => ({
    ...state,
    apiKey,
    environment,
  }));
};

export const clearApiKey = () => {
  // Clear localStorage
  localStorage.removeItem("apiKey");
  localStorage.removeItem("environment");

  // Clear store
  appStore.setState((state) => ({
    ...state,
    apiKey: null,
    environment: "dev",
  }));

  // Navigate to setup if router is available
  if (storeNavigate) {
    storeNavigate({ to: "/setup" });
  }
};

// Store router reference for navigation
let storeNavigate: ((opts: { to: string }) => void) | null = null;

export const setStoreNavigate = (navigateFn: (opts: { to: string }) => void) => {
  storeNavigate = navigateFn;
};

// Sync store with localStorage changes (e.g., manual deletion, other tabs)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "apiKey") {
      const newApiKey = e.newValue;
      const currentApiKey = appStore.state.apiKey;

      // Only update if changed
      if (newApiKey !== currentApiKey) {
        appStore.setState((state) => ({
          ...state,
          apiKey: newApiKey,
        }));

        // If API key was removed, navigate to setup
        if (!newApiKey && storeNavigate) {
          storeNavigate({ to: "/setup" });
        }
      }
    } else if (e.key === "environment") {
      const newEnvironment = (e.newValue || "dev") as "dev" | "production";
      appStore.setState((state) => ({
        ...state,
        environment: newEnvironment,
      }));
    }
  });

  // Also check localStorage on focus (for manual devtools changes)
  window.addEventListener("focus", () => {
    const storageApiKey = localStorage.getItem("apiKey");
    const storeApiKey = appStore.state.apiKey;

    if (storageApiKey !== storeApiKey) {
      appStore.setState((state) => ({
        ...state,
        apiKey: storageApiKey,
        environment: (localStorage.getItem("environment") || "dev") as "dev" | "production",
      }));

      // If API key was removed, navigate to setup
      if (!storageApiKey && storeNavigate) {
        storeNavigate({ to: "/setup" });
      }
    }
  });
}
