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
  // Le token (userStore) va en sessionStorage : il disparaît à la fermeture du
  // tab (limite la fenêtre d'attaque XSS). MAIS l'état PKCE transitoire
  // (state + code_verifier, stateStore) doit survivre à la redirection vers
  // Keycloak et au retour : on le laisse en localStorage (défaut). Les mettre
  // tous les deux en sessionStorage causait la perte du code_verifier au retour
  // -> échange code→token échoué -> boucle de connexion.
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),
  // Après le callback OIDC réussi : on remplace l'URL /admin/callback?code=…
  // par /admin ET on force une vraie navigation. `replaceState` seul ne
  // notifie pas React Router -> la page restait bloquée sur "Finalisation…"
  // alors que le token était bien reçu. window.location.replace recharge
  // proprement sur /admin (où RequireAuth voit désormais le user authentifié).
  onSigninCallback: () => {
    window.location.replace("/admin");
  },
};
