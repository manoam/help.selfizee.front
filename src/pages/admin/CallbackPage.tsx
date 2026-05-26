/**
 * Page atterrie par Keycloak après login (redirect_uri).
 * react-oidc-context gère automatiquement l'échange code → tokens.
 * Cette page n'est qu'un fallback visuel — la config `onSigninCallback`
 * redirige déjà vers `/admin` une fois le token reçu.
 */
export function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--color-muted-foreground)]">
      Finalisation de la connexion…
    </div>
  );
}
