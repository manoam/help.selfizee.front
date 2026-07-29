import { Node, mergeAttributes } from "@tiptap/core";

// Extension TipTap minimale pour la balise <video> (contenu legacy CRM).
// Sans elle, TipTap ne connaît pas <video>/<source> et les supprime au parsing,
// faisant disparaître les vidéos dans l'éditeur admin (elles restent pourtant
// dans le HTML côté public). On les rend en lecture seule dans l'éditeur.
//
// Le CRM stocke soit <video><source src=...></video>, soit <video src=...>.
// On capture la source (source enfant en priorité, sinon l'attribut src).

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
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
    // On génère <video controls><source src=...></video> pour un rendu correct.
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
});
