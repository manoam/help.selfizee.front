import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { safeHtml } from "../../lib/sanitize";
import { api } from "../../lib/api";

// Les images du contenu sont servies par l'API (/uploads/posts/...), pas par le
// front. Comme le HTML est rendu tel quel, on préfixe les src/href="/uploads..."
// par l'URL de base de l'API, sinon le navigateur les charge depuis le front
// (qui renvoie index.html -> image cassée).
// baseURL sans slash final, pour éviter un double slash quand on concatène /uploads.
const API_BASE = (api.defaults.baseURL ?? "").replace(/\/+$/, "");
function prefixUploads(html: string): string {
  if (!API_BASE) return html;
  // Cible /uploads/ (images rapatriées) et /upload/ (uploads WYSIWYG).
  return html.replace(
    /(src|href)=("|')(\/uploads?\/)/gi,
    (_m, attr, quote, pathStart) => `${attr}=${quote}${API_BASE}${pathStart}`,
  );
}

// Rend du HTML legacy du CRM (champs notice/intro/probleme, stockés en HTML brut)
// et réactive les accordéons Bootstrap « bootstrap-accordion ».
//
// Dans le CRM, c'est le JS Bootstrap qui ouvrait/fermait les panneaux au clic.
// Ce JS n'existe pas ici : on reproduit le toggle à la main via un délégué de
// clic qui bascule la classe .is-open sur le conteneur .panel. Le CSS
// (.bootstrap-accordion.is-open .panel-collapse) gère l'affichage et le chevron.
// On ne dépend plus de la classe .collapse (polluée par une utility Tailwind v4)
// ni de la résolution href="#collapse-X" -> id.
export function LegacyHtml({
  html,
  className = "a-html-content",
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1) Accordéon : clic sur un titre -> bascule .is-open sur le .panel.
      const accTrigger = target.closest<HTMLElement>(
        ".bootstrap-accordion-title, [data-toggle='collapse']",
      );
      if (accTrigger && root.contains(accTrigger)) {
        e.preventDefault();
        accTrigger.closest(".panel")?.classList.toggle("is-open");
        return;
      }

      // 2) Lien interne (issu des shortcodes [lien num_article=…]) : navigation
      // SPA au lieu d'un rechargement complet. On laisse le comportement natif
      // pour les liens target="_blank" (ouverture dans un nouvel onglet) et les
      // clics avec modificateur (Ctrl/Cmd/clic milieu = nouvel onglet).
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (link && root.contains(link)) {
        const opensNewTab =
          link.target === "_blank" ||
          e.ctrlKey ||
          e.metaKey ||
          e.button === 1;
        const href = link.getAttribute("href") || "";
        if (!opensNewTab && href.startsWith("/") && !href.startsWith("//")) {
          e.preventDefault();
          navigate(href);
        }
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [html, navigate]);

  if (!html) return null;

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: prefixUploads(safeHtml(html)) }}
    />
  );
}
