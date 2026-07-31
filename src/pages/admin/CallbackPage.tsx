import { useAuth } from "react-oidc-context";

/**
 * Page atterrie par Keycloak après login (redirect_uri).
 * react-oidc-context gère automatiquement l'échange code → tokens et, via
 * onSigninCallback, nettoie l'URL. Cette page affiche l'état / les erreurs
 * éventuelles au lieu de rester bloquée silencieusement (utile pour diagnostiquer
 * une boucle de connexion).
 */
export function CallbackPage() {
  const auth = useAuth();

  if (auth.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-red-600">
          Erreur d'authentification
        </p>
        <p className="text-xs text-[color:var(--color-muted-foreground)] max-w-md break-words">
          {auth.error.message}
        </p>
        <a
          href="/admin"
          className="text-xs text-blue-600 underline"
        >
          Réessayer
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--color-muted-foreground)]">
      Finalisation de la connexion…
    </div>
  );
}
