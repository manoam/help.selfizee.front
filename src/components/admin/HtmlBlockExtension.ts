import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewRenderer } from "@tiptap/core";

// Extension TipTap pour les blocs HTML CRM (accordéon, message info/note/attention).
// Ces blocs sont stockés tels quels (HTML brut) et rendus dans l'éditeur via un
// NodeView qui réinjecte le HTML, pour que l'utilisateur voie le vrai rendu et
// pas un placeholder texte.
//
// Au save (getHTML), on régénère le HTML d'origine via renderHTML.
//
// Atomique (atom: true) : non-éditable inline. Pour modifier, suppr + recréer.

export const HtmlBlock = Node.create({
  name: "htmlBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      html: { default: "" },
      kind: { default: "block" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.bootstrap-accordion",
        getAttrs: (dom: HTMLElement | string) => ({
          html: typeof dom === "string" ? "" : dom.outerHTML,
          kind: "accordion",
        }),
      },
      {
        tag: "div.info",
        getAttrs: (dom: HTMLElement | string) => ({
          html: typeof dom === "string" ? "" : dom.outerHTML,
          kind: "info",
        }),
      },
      {
        tag: "div.note",
        getAttrs: (dom: HTMLElement | string) => ({
          html: typeof dom === "string" ? "" : dom.outerHTML,
          kind: "note",
        }),
      },
      {
        tag: "div.attention",
        getAttrs: (dom: HTMLElement | string) => ({
          html: typeof dom === "string" ? "" : dom.outerHTML,
          kind: "attention",
        }),
      },
    ];
  },

  renderHTML({
    HTMLAttributes,
    node,
  }: {
    HTMLAttributes: Record<string, unknown>;
    node: { attrs: { html: string; kind: string } };
  }) {
    // Côté getHTML() (save), on rend un wrapper avec data-html-content
    // (HTML encodé). Le post-traitement rehydrateBlocks le remplace ensuite
    // par le HTML brut côté RichTextEditorHtml.
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-html-block": node.attrs.kind,
        "data-html-content": encodeURIComponent(node.attrs.html ?? ""),
      }),
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className = "tiptap-html-block";
      dom.setAttribute("data-block-kind", node.attrs.kind);
      dom.setAttribute("contenteditable", "false");

      const inner = document.createElement("div");
      inner.className = "tiptap-html-block-content";
      inner.innerHTML = (node.attrs.html as string | null) ?? "";
      dom.appendChild(inner);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "tiptap-html-block-delete";
      delBtn.setAttribute("title", "Supprimer ce bloc");
      delBtn.innerHTML = "✕";
      delBtn.addEventListener("click", (e: MouseEvent) => {
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
      dom.appendChild(delBtn);

      return { dom, contentDOM: null };
    };
  },
});
