import { useAuth as useOidc } from "react-oidc-context";

import type { Me } from "../lib/api";
import { AUTH_DISABLED, BYPASS_USER } from "../lib/authConfig";

// Adapte react-oidc-context vers la forme attendue par les composants existants.
// En mode AUTH_DISABLED, on retourne directement le user fictif sans appeler useOidc()
// (le AuthProvider n'est pas monté dans ce mode -> useOidc planterait).
export function useMe(): { data: Me | null; isLoading: boolean } {
  if (AUTH_DISABLED) {
    return { data: BYPASS_USER, isLoading: false };
  }
  return useMeOidc();
}

function useMeOidc(): { data: Me | null; isLoading: boolean } {
  const auth = useOidc();
  if (auth.isLoading) return { data: null, isLoading: true };
  if (!auth.isAuthenticated || !auth.user) return { data: null, isLoading: false };

  const claims = auth.user.profile as Record<string, unknown>;
  const realmAccess = claims.realm_access as { roles?: string[] } | undefined;

  return {
    isLoading: false,
    data: {
      sub: String(claims.sub),
      email: claims.email as string | undefined,
      name: claims.name as string | undefined,
      preferredUsername: claims.preferred_username as string | undefined,
      roles: realmAccess?.roles ?? [],
    },
  };
}
