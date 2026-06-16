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
  "style",
  // Attributs utilisés par les accordéons (plugin bootstrapaccordion CRM).
  "role", "data-toggle", "data-parent",
];

export function safeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
