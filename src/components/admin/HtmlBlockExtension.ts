import { Node, mergeAttributes } from "@tiptap/core";

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
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).outerHTML,
          kind: "accordion",
        }),
      },
      {
        tag: "div.info",
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).outerHTML,
          kind: "info",
        }),
      },
      {
        tag: "div.note",
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).outerHTML,
          kind: "note",
        }),
      },
      {
        tag: "div.attention",
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).outerHTML,
          kind: "attention",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Côté getHTML() (save), on rend un wrapper vide avec data-html-kind.
    // Le contenu HTML réel est dans node.attrs.html — on le post-traite pour
    // remplacer le wrapper par le HTML brut (cf. extractRawBlocks dans
    // RichTextEditorHtml).
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-html-block": node.attrs.kind,
        "data-html-content": encodeURIComponent(node.attrs.html ?? ""),
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className = "tiptap-html-block";
      dom.setAttribute("data-block-kind", node.attrs.kind);
      // contenteditable=false : ProseMirror ne touche pas au contenu interne.
      dom.setAttribute("contenteditable", "false");

      // Wrapper qui rend le HTML réel
      const inner = document.createElement("div");
      inner.className = "tiptap-html-block-content";
      inner.innerHTML = node.attrs.html ?? "";
      dom.appendChild(inner);

      // Bouton supprimer en overlay
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "tiptap-html-block-delete";
      delBtn.setAttribute("title", "Supprimer ce bloc");
      delBtn.innerHTML = "✕";
      delBtn.addEventListener("click", (e) => {
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
