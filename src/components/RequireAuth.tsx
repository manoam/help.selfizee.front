import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      void auth.signinRedirect();
    }
  }, [auth]);

  if (auth.isLoading) {
    return (
      <div className="p-8 text-sm text-[color:var(--color-muted-foreground)]">
        Chargement…
      </div>
    );
  }
  if (auth.error) {
    return (
      <div className="p-8 text-sm text-red-600">
        Erreur d'authentification : {auth.error.message}
      </div>
    );
  }
  if (!auth.isAuthenticated) {
    return (
      <div className="p-8 text-sm text-[color:var(--color-muted-foreground)]">
        Redirection vers Keycloak…
      </div>
    );
  }
  return <>{children}</>;
}
