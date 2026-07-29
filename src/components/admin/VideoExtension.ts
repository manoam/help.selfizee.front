import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewRenderer } from "@tiptap/core";

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
      src: { default: null },
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
          const src =
            el.getAttribute("src") || source?.getAttribute("src") || null;
          return {
            src,
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
      width?: string | null;
      height?: string | null;
    };
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "controls",
        ...(attrs.width ? { width: attrs.width } : {}),
        ...(attrs.height ? { height: attrs.height } : {}),
      }),
      attrs.src ? ["source", { src: attrs.src }] : ["source", {}],
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ({ node, getPos, editor }) => {
      const attrs = node.attrs as {
        src?: string | null;
        width?: string | null;
        height?: string | null;
      };

      const dom = document.createElement("div");
      dom.className = "tiptap-video-block";
      dom.setAttribute("contenteditable", "false");

      const video = document.createElement("video");
      video.className = "tiptap-video";
      // Pas de `controls` dans l'éditeur : on ne veut pas jouer, mais manipuler.
      video.setAttribute("preload", "metadata");
      video.muted = true;
      if (attrs.src) {
        const source = document.createElement("source");
        source.src = attrs.src;
        video.appendChild(source);
      }
      if (attrs.width) video.setAttribute("width", String(attrs.width));
      if (attrs.height) video.setAttribute("height", String(attrs.height));
      dom.appendChild(video);

      // Overlay transparent : capte le clic pour SÉLECTIONNER le node (au lieu
      // de laisser la vidéo réagir). Double-clic ouvre l'aperçu réel.
      const overlay = document.createElement("div");
      overlay.className = "tiptap-video-overlay";
      overlay.innerHTML =
        '<span class="tiptap-video-badge">▶ Vidéo — cliquer pour sélectionner</span>';
      overlay.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos != null) {
          editor.commands.setNodeSelection(pos);
          editor.commands.focus();
        }
      });
      dom.appendChild(overlay);

      // Barre d'outils (visible quand le bloc est survolé/sélectionné) :
      // dimensions + suppression.
      const toolbar = document.createElement("div");
      toolbar.className = "tiptap-video-toolbar";

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
          const pos = typeof getPos === "function" ? getPos() : null;
          if (pos == null) return;
          const v = input.value.trim();
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [key]: v === "" ? null : v,
              });
              return true;
            })
            .run();
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
