import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";

import { App } from "./App";
import { oidcConfig } from "./lib/oidc";
import { AUTH_DISABLED } from "./lib/authConfig";
import { AuthBridge } from "./components/AuthBridge";
import "./index.css";

// Délégation globale pour les accordéons (reproduit le data-toggle Bootstrap
// du WYSIWYG CRM sans dépendre de Bootstrap JS). Toggle .in sur .panel-collapse.
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const trigger = target.closest<HTMLElement>(".bootstrap-accordion-title");
  if (!trigger) return;
  e.preventDefault();
  const href = trigger.getAttribute("href");
  if (!href || !href.startsWith("#")) return;
  const panel = document.getElementById(href.slice(1));
  if (!panel) return;
  panel.classList.toggle("in");
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const appTree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {AUTH_DISABLED ? (
      appTree
    ) : (
      <AuthProvider {...oidcConfig}>
        <AuthBridge>{appTree}</AuthBridge>
      </AuthProvider>
    )}
  </StrictMode>,
);
