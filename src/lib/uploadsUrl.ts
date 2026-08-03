import { api } from "./api";

// Source de vérité unique pour le préfixage des URLs d'images/vidéos du contenu.
//
// Les fichiers uploadés (/uploads/... rapatriés, /upload/... WYSIWYG) sont servis
// par l'API, pas par le front. En base on stocke du RELATIF (portable si le NDD
// change) ; à l'affichage on préfixe par l'URL de l'API. D'où deux sens :
//   - toDisplay* : /uploads/x -> {API_BASE}/uploads/x  (pour afficher)
//   - toStorage* : {API_BASE}/uploads/x -> /uploads/x  (pour sauvegarder)
//
// Avant, cette logique était recopiée (et divergente) dans LegacyHtml,
// RichTextEditorHtml et VideoExtension.

// baseURL sans slash final (évite un double slash à la concaténation).
export const API_BASE = (api.defaults.baseURL ?? "").replace(/\/+$/, "");

// Cible les attributs src/href dont la valeur commence par /uploads/ ou /upload/.
const HTML_PREFIX_RE = /(src|href)=("|')(\/uploads?\/)/gi;

// Préfixe les URLs d'un fragment HTML pour l'AFFICHAGE.
export function toDisplayHtml(html: string): string {
  if (!API_BASE) return html;
  return html.replace(
    HTML_PREFIX_RE,
    (_m, attr, quote, pathStart) => `${attr}=${quote}${API_BASE}${pathStart}`,
  );
}

// Retire le préfixe API d'un fragment HTML pour le STOCKAGE (relatif).
export function toStorageHtml(html: string): string {
  if (!API_BASE) return html;
  const escaped = API_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`${escaped}(/uploads?/)`, "gi"), "$1");
}

// Préfixe une seule URL (src) pour l'affichage — ex. <source src> d'une vidéo.
export function toDisplaySrc(src: string): string {
  if (!API_BASE || !src) return src;
  return src.replace(/^(\/uploads?\/)/i, `${API_BASE}$1`);
}
