// Centralise le flag bypass auth pour le front.
// Quand VITE_AUTH_DISABLED=true, on ne monte pas AuthProvider, on skippe les redirects
// Keycloak, et on injecte un user fictif côté useMe().
export const AUTH_DISABLED =
  (import.meta.env.VITE_AUTH_DISABLED as string | undefined) === "true";

// Garde-fou : le bypass auth ne doit JAMAIS être actif dans un build de prod.
// On ne peut pas "faire échouer le boot" côté front, mais on alerte bruyamment.
// (Le back, lui, refuse de démarrer dans ce cas — cf. config/env.ts.)
if (AUTH_DISABLED && import.meta.env.PROD) {
  console.error(
    "%c⚠️ SÉCURITÉ : VITE_AUTH_DISABLED=true dans un build de PRODUCTION — " +
      "l'admin est accessible sans authentification. Mettre VITE_AUTH_DISABLED=false.",
    "color:#fff;background:#dc2626;font-size:14px;font-weight:bold;padding:4px 8px;",
  );
}

export const BYPASS_USER = {
  sub: "auth-disabled-bypass",
  email: "bypass@selfizee.local",
  name: "Bypass User",
  preferredUsername: "bypass",
  roles: ["admin"],
};
