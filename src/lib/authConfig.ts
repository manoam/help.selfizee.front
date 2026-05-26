// Centralise le flag bypass auth pour le front.
// Quand VITE_AUTH_DISABLED=true, on ne monte pas AuthProvider, on skippe les redirects
// Keycloak, et on injecte un user fictif côté useMe().
export const AUTH_DISABLED =
  (import.meta.env.VITE_AUTH_DISABLED as string | undefined) === "true";

export const BYPASS_USER = {
  sub: "auth-disabled-bypass",
  email: "bypass@selfizee.local",
  name: "Bypass User",
  preferredUsername: "bypass",
  roles: ["admin"],
};
