import { useEffect, useRef } from "react";
import { safeHtml } from "../../lib/sanitize";

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

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest<HTMLElement>(
        ".bootstrap-accordion-title, .panel-title a, [data-toggle='collapse']",
      );
      if (!trigger || !root.contains(trigger)) return;
      e.preventDefault();
      // On bascule simplement .is-open sur le conteneur .panel : le CSS gère
      // l'affichage du .panel-collapse et la rotation du chevron.
      const panel = trigger.closest(".panel");
      panel?.classList.toggle("is-open");
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
