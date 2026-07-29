import { useEffect, useRef } from "react";
import { safeHtml } from "../../lib/sanitize";

// Rend du HTML legacy du CRM (champs notice/intro/probleme, stockés en HTML brut)
// et réactive les accordéons Bootstrap « bootstrap-accordion ».
//
// Dans le CRM, chaque panneau est masqué par CSS (.panel-collapse.collapse:not(.in)
// { display:none }) et c'est le JS Bootstrap qui ajoutait/retirait la classe `.in`
// au clic sur le titre. Ce JS n'existe pas ici : sans lui, cliquer sur un titre ne
// fait rien et le contenu reste caché. On reproduit donc le toggle à la main via un
// délégué de clic sur le conteneur.
export function LegacyHtml({
  html,
  className = "a-html-content",
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const togglePanel = (trigger: HTMLElement) => {
      // Cible : #collapse-XXX via href, sinon le .panel-collapse du même .panel.
      const href = trigger.getAttribute("href") || "";
      let panel: HTMLElement | null = null;
      if (href.startsWith("#") && href.length > 1) {
        try {
          panel = root.querySelector<HTMLElement>(
            `#${CSS.escape(href.slice(1))}`,
          );
        } catch {
          panel = null;
        }
      }
      if (!panel) {
        panel =
          trigger
            .closest(".panel")
            ?.querySelector<HTMLElement>(".panel-collapse") ?? null;
      }
      if (!panel) return;

      const opening = !panel.classList.contains("in");
      panel.classList.toggle("in", opening);
      trigger.classList.toggle("is-open", opening);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest<HTMLElement>(
        ".bootstrap-accordion-title, .panel-title a, [data-toggle='collapse']",
      );
      if (!trigger || !root.contains(trigger)) return;
      e.preventDefault();
      togglePanel(trigger);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [html]);

  if (!html) return null;

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
}
