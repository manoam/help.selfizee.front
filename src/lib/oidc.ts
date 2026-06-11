import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

import { AUTH_DISABLED } from "./authConfig";

const KC_URL = import.meta.env.VITE_KEYCLOAK_URL as string | undefined;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM as string | undefined;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined;

if (!AUTH_DISABLED && (!KC_URL || !REALM || !CLIENT_ID)) {
  throw new Error(
    "Missing VITE_KEYCLOAK_URL / VITE_KEYCLOAK_REALM / VITE_KEYCLOAK_CLIENT_ID " +
      "(set VITE_AUTH_DISABLED=true to bypass)",
  );
}

export const oidcConfig: AuthProviderProps = {
  authority: KC_URL ? `${KC_URL.replace(/\/$/, "")}/realms/${REALM}` : "",
  client_id: CLIENT_ID ?? "",
  redirect_uri: `${window.location.origin}/admin/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  // sessionStorage au lieu de localStorage : le token disparaît à la fermeture
  // du tab, ce qui limite la fenêtre d'attaque en cas de XSS résiduel.
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // Nettoie le `?code=...&state=...` après le callback OIDC
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, "/admin");
  },
};
