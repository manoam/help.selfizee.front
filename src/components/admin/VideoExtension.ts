import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewRenderer } from "@tiptap/core";

import { toDisplaySrc } from "../../lib/uploadsUrl";

// Les vidéos sont servies par l'API (/uploads/...), pas par le front. Dans le
// NodeView on charge la vidéo depuis l'URL de l'API (toDisplaySrc), sinon elle
// se charge depuis le front admin (index.html) et ne s'affiche pas. Le src
// stocké en base reste relatif.
const displaySrc = toDisplaySrc;

// Extension TipTap pour la balise <video> (contenu legacy CRM). Sans elle,
// TipTap ne connaît pas <video>/<source> et les supprime au parsing.
//
// Dans l'éditeur, un NodeView rend la vidéo en aperçu NON-jouable (un overlay
// capte le clic pour sélectionner le node au lieu de lancer la lecture), avec :
//  - un bouton supprimer,
//  - un champ largeur / hauteur pour redimensionner.
// Au save (renderHTML), on régénère <video controls><source src=...></video>.

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      // src SANS le fragment #t=… (stocké à part dans posterTime).
      src: { default: null },
      // Temps (en secondes) de la vignette de départ -> devient #t=… au rendu.
      posterTime: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
        getAttrs: (dom) => {
          if (typeof dom === "string") return {};
          const el = dom as HTMLElement;
          const source = el.querySelector("source");
          const rawSrc =
            el.getAttribute("src") || source?.getAttribute("src") || "";
          // Sépare le fragment #t=… (media fragment = vignette de départ).
          const hashIdx = rawSrc.indexOf("#t=");
          const src = hashIdx >= 0 ? rawSrc.slice(0, hashIdx) : rawSrc || null;
          const posterTime =
            hashIdx >= 0 ? rawSrc.slice(hashIdx + 3) || null : null;
          return {
            src,
            posterTime,
            width: el.getAttribute("width"),
            height: el.getAttribute("height"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as {
      src?: string | null;
      posterTime?: string | null;
      width?: string | null;
      height?: string | null;
    };
    // Recompose src#t=… (comme le CRM) pour que le public affiche la vignette.
    const fullSrc = attrs.src
      ? attrs.posterTime
        ? `${attrs.src}#t=${attrs.posterTime}`
        : attrs.src
      : null;
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "controls",
        ...(attrs.width ? { width: attrs.width } : {}),
        ...(attrs.height ? { height: attrs.height } : {}),
      }),
      fullSrc ? ["source", { src: fullSrc }] : ["source", {}],
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ({ node, getPos, editor }) => {
      const attrs = node.attrs as {
        src?: string | null;
        posterTime?: string | null;
        width?: string | null;
        height?: string | null;
      };

      const setAttr = (patch: Record<string, unknown>) => {
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...patch });
            return true;
          })
          .run();
      };

      const dom = document.createElement("div");
      dom.className = "tiptap-video-block";
      dom.setAttribute("contenteditable", "false");

      const video = document.createElement("video");
      video.className = "tiptap-video";
      // Contrôles natifs actifs : on peut lire/pauser pour choisir la vignette.
      video.setAttribute("controls", "controls");
      // preload=auto : charge assez de données pour afficher la frame de la
      // vignette (metadata seul laisse un écran noir après le seek).
      video.setAttribute("preload", "auto");
      const t =
        attrs.posterTime != null ? parseFloat(attrs.posterTime) : NaN;
      const hasPoster = !Number.isNaN(t) && t > 0;
      if (attrs.src) {
        const source = document.createElement("source");
        // On met le #t=… directement dans l'URL (media fragment natif), comme
        // côté public : le navigateur positionne l'aperçu tout seul.
        source.src = displaySrc(attrs.src) + (hasPoster ? `#t=${t}` : "");
        video.appendChild(source);
      }
      if (attrs.width) video.setAttribute("width", String(attrs.width));
      if (attrs.height) video.setAttribute("height", String(attrs.height));
      // Renfort JS : force le seek dès que possible (certains navigateurs
      // n'appliquent pas le media fragment #t= sur <source> seul).
      if (hasPoster) {
        const seek = () => {
          try {
            if (video.currentTime < t) video.currentTime = t;
          } catch {
            /* ignore */
          }
        };
        video.addEventListener("loadeddata", seek, { once: true });
        if (video.readyState >= 2) seek();
      }
      dom.appendChild(video);

      // Barre d'outils (au survol / sélection).
      const toolbar = document.createElement("div");
      toolbar.className = "tiptap-video-toolbar";

      // Bouton "Vignette ici" : enregistre le temps courant comme #t=…
      const poster = document.createElement("button");
      poster.type = "button";
      poster.className = "tiptap-video-poster";
      const posterLabel = () =>
        attrs.posterTime
          ? `📌 Vignette : ${attrs.posterTime}s`
          : "📌 Définir la vignette ici";
      poster.textContent = posterLabel();
      poster.title =
        "Mettez la vidéo en pause sur l'image voulue, puis cliquez pour l'enregistrer comme vignette de départ.";
      poster.addEventListener("mousedown", (e) => e.stopPropagation());
      poster.addEventListener("click", (e) => {
        e.preventDefault();
        const t = Math.round(video.currentTime * 10) / 10; // arrondi 0.1s
        setAttr({ posterTime: t > 0 ? String(t) : null });
      });
      toolbar.appendChild(poster);

      const mkDim = (
        label: string,
        key: "width" | "height",
        value: string | null | undefined,
      ) => {
        const wrap = document.createElement("label");
        wrap.className = "tiptap-video-dim";
        wrap.textContent = label;
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.placeholder = "auto";
        input.value = value != null ? String(value) : "";
        input.addEventListener("mousedown", (e) => e.stopPropagation());
        input.addEventListener("change", () => {
          const v = input.value.trim();
          setAttr({ [key]: v === "" ? null : v });
        });
        wrap.appendChild(input);
        return wrap;
      };

      toolbar.appendChild(mkDim("L", "width", attrs.width));
      toolbar.appendChild(mkDim("H", "height", attrs.height));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "tiptap-video-delete";
      del.title = "Supprimer la vidéo";
      del.textContent = "✕";
      del.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + node.nodeSize })
          .run();
      });
      toolbar.appendChild(del);
      dom.appendChild(toolbar);

      return { dom, contentDOM: null };
    };
  },
});
