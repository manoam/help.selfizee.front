import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const KC_URL = import.meta.env.VITE_KEYCLOAK_URL as string;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM as string;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string;

if (!KC_URL || !REALM || !CLIENT_ID) {
  throw new Error(
    "Missing VITE_KEYCLOAK_URL / VITE_KEYCLOAK_REALM / VITE_KEYCLOAK_CLIENT_ID",
  );
}

export const oidcConfig: AuthProviderProps = {
  authority: `${KC_URL.replace(/\/$/, "")}/realms/${REALM}`,
  client_id: CLIENT_ID,
  redirect_uri: `${window.location.origin}/admin/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Nettoie le `?code=...&state=...` après le callback OIDC
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, "/admin");
  },
};
