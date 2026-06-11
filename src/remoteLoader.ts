import * as React from "react";
import * as ReactDOM from "react-dom";

// Allowlist stricte des origines autorisées à servir le hub Module Federation.
// Si VITE_PLATEFORM_URL pointe ailleurs, on refuse (RCE protection).
const ALLOWED_HUB_ORIGINS = new Set([
  "https://plateformdev.orkessi.com",
  "https://plateforme.konitys.fr",
  "https://plateform.konitys.fr",
]);

const RAW_PLATEFORM_URL =
  (import.meta.env.VITE_PLATEFORM_URL as string | undefined) ||
  "https://plateformdev.orkessi.com";

const PLATEFORM_URL = (() => {
  try {
    const u = new URL(RAW_PLATEFORM_URL);
    if (u.protocol !== "https:") {
      console.error("[remoteLoader] only HTTPS allowed:", u.toString());
      return null;
    }
    if (!ALLOWED_HUB_ORIGINS.has(u.origin)) {
      console.error(
        "[remoteLoader] origin not in allowlist:",
        u.origin,
        "; allowed:",
        [...ALLOWED_HUB_ORIGINS],
      );
      return null;
    }
    return u.origin;
  } catch {
    console.error("[remoteLoader] invalid VITE_PLATEFORM_URL:", RAW_PLATEFORM_URL);
    return null;
  }
})();

interface RemoteContainer {
  init: (shareScope: Record<string, unknown>) => void;
  get: (module: string) => Promise<() => unknown>;
}

function ensureSharedScope() {
  const g = globalThis as unknown as {
    __federation_shared__?: Record<string, Record<string, Record<string, unknown>>>;
  };
  g.__federation_shared__ = g.__federation_shared__ || {};
  g.__federation_shared__["default"] = g.__federation_shared__["default"] || {};

  const shared = g.__federation_shared__["default"];

  const reactEntry = {
    get: () => () => React,
    loaded: true,
    scope: "default",
  };
  const reactDomEntry = {
    get: () => () => ReactDOM,
    loaded: true,
    scope: "default",
  };

  if (!shared["react"]) shared["react"] = {};
  shared["react"][React.version] = reactEntry;
  shared["react"]["18.3.1"] = reactEntry;
  shared["react"]["18.0.0"] = reactEntry;

  if (!shared["react-dom"]) shared["react-dom"] = {};
  shared["react-dom"][React.version] = reactDomEntry;
  shared["react-dom"]["18.3.1"] = reactDomEntry;
  shared["react-dom"]["18.0.0"] = reactDomEntry;
}

let containerPromise: Promise<RemoteContainer> | null = null;

function loadRemoteEntry(): Promise<RemoteContainer> {
  if (containerPromise) return containerPromise;

  if (!PLATEFORM_URL) {
    return Promise.reject(new Error("hub URL not allowed"));
  }

  ensureSharedScope();

  // Timeout 5s : si le hub ne répond pas, on fallback au lieu de bloquer 30s.
  const fetchPromise = import(
    /* @vite-ignore */ `${PLATEFORM_URL}/assets/remoteEntry.js`
  );
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("hub load timeout 5s")), 5000),
  );

  containerPromise = Promise.race([fetchPromise, timeoutPromise])
    .then((container: RemoteContainer) => {
      const g = globalThis as unknown as {
        __federation_shared__?: Record<string, Record<string, unknown>>;
      };
      container.init(g.__federation_shared__?.["default"] || {});
      return container;
    })
    .catch((err) => {
      containerPromise = null;
      throw err;
    });

  return containerPromise;
}

export async function loadRemoteComponent(
  moduleName: string,
): Promise<{ default: React.ComponentType<unknown> }> {
  const container = await loadRemoteEntry();
  const factory = await container.get(moduleName);
  const result = factory();

  if (result && typeof result === "object" && "default" in result) {
    return result as { default: React.ComponentType<unknown> };
  }
  return { default: result as React.ComponentType<unknown> };
}
