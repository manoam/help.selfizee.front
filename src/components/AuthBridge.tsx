import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

import { setAccessToken } from "../lib/api";

/**
 * Pousse l'access_token Keycloak dans axios à chaque changement (login, refresh, logout).
 * À monter une seule fois, sous AuthProvider.
 */
export function AuthBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null);
  }, [auth.user?.access_token]);

  return <>{children}</>;
}
