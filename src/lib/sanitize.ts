import DOMPurify from "dompurify";

// Sanitize côté front du HTML legacy CRM avant `dangerouslySetInnerHTML`.
// Defense in depth - le back sanitize aussi à la sauvegarde.
const ALLOWED_TAGS = [
  "p", "div", "span", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote",
  "strong", "em", "b", "i", "u", "s", "sub", "sup", "code", "pre",
  "a", "img", "video", "source",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
];
const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "title",
  "width", "height", "loading",
  "controls", "type",
  "colspan", "rowspan",
  "class", "id",
  // `style` volontairement EXCLU (S6) : aucun usage légitime dans l'éditeur,
  // et il ouvrait une surface clickjacking (position:fixed) / exfiltration
  // (background:url()). DOMPurify le retire donc du HTML legacy.
  // Attributs utilisés par les accordéons (plugin bootstrapaccordion CRM).
  "role", "data-toggle", "data-parent",
];

// Hook (S7) : force rel="noopener noreferrer" sur tout lien target="_blank"
// pour empêcher le reverse tabnabbing. Enregistré une seule fois au chargement.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node instanceof Element && node.tagName === "A" &&
      node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function safeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
