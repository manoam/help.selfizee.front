import { useEditor, EditorContent } from "@tiptap/react";
import { useRef, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Loader2,
  Strikethrough,
  ChevronsUpDown,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { api } from "../../lib/api";
import { Modal } from "./Modal";

type MessageType = "info" | "note" | "attention";

const MESSAGE_LABEL: Record<MessageType, string> = {
  info: "Info (jaune)",
  note: "À noter (bleu)",
  attention: "Attention (rouge)",
};

type Props = {
  value: string | null;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

// Éditeur WYSIWYG TipTap qui produit du HTML pur (compatible avec les champs
// String du back : descriptionProbleme, question, intro/notice/probleme client/callcenter/interne).
//
// Diff avec RichTextEditor :
//  - sortie HTML (editor.getHTML()) au lieu de JSON.
//  - extensions Image (avec upload), Link, Table en plus du StarterKit.
//  - upload d'image branché sur /upload/image (route back authentifiée).
export function RichTextEditorHtml({
  value,
  onChange,
  placeholder,
  minHeight = 200,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  // Modals locaux : accordéon + message (reproduisent les plugins
  // bootstrapaccordion et messages du TinyMCE CRM original).
  const [accOpen, setAccOpen] = useState(false);
  const [accTitle, setAccTitle] = useState("");
  const [accContent, setAccContent] = useState("");

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgType, setMsgType] = useState<MessageType>("info");
  const [msgContent, setMsgContent] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value ?? "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const handleImageUpload = async (file: File) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ url: string }>("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const absUrl = `${api.defaults.baseURL ?? ""}${data.url}`;
      editor.chain().focus().setImage({ src: absUrl, alt: file.name }).run();
    } catch (err) {
      console.error("[richtext] upload failed:", err);
      alert("Upload échoué (image trop lourde ou format non supporté).");
    } finally {
      uploadingRef.current = false;
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const promptLink = () => {
    const prev = (editor.getAttributes("link") as { href?: string }).href ?? "";
    const url = window.prompt("URL du lien :", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  // Reproduit la structure HTML exacte du plugin TinyMCE bootstrapaccordion.
  const insertAccordion = () => {
    if (!accTitle.trim()) return;
    const ts = String(Math.floor(Math.random() * 1e10));
    const title = escapeHtmlAttr(accTitle);
    const html =
      `<div class="panel panel-default bootstrap-accordion">` +
      `<div class="panel-heading" role="tab" id="heading-${ts}">` +
      `<h4 class="panel-title">` +
      `<a role="button" class="bootstrap-accordion-title" data-toggle="collapse" data-parent="#accordion" href="#collapse-${ts}">` +
      `${title}` +
      `</a></h4></div>` +
      `<div id="collapse-${ts}" class="panel-collapse collapse" role="tabpanel">` +
      `<div class="panel-body bootstrap-accordion-content">` +
      `${accContent || "&nbsp;"}` +
      `</div></div></div><p></p>`;
    editor.chain().focus().insertContent(html).run();
    setAccTitle("");
    setAccContent("");
    setAccOpen(false);
  };

  // Reproduit la structure du plugin TinyMCE messages.
  const insertMessage = () => {
    if (!msgContent.trim()) return;
    const html =
      `<div class="${msgType}">${escapeHtmlAttr(msgContent)}</div><p></p>`;
    editor.chain().focus().insertContent(html).run();
    setMsgContent("");
    setMsgOpen(false);
  };

  return (
    <div className="border border-[--k-border] rounded-lg overflow-hidden bg-white">
      <div className="border-b border-[--k-border] bg-[--k-surface-2]/30 p-1.5 flex flex-wrap gap-0.5">
        <ToolBtn
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        />
        <ToolBtn
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        />
        <ToolBtn
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barré"
        />
        <Separator />
        <ToolBtn
          icon={Heading2}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Titre 2"
        />
        <ToolBtn
          icon={Heading3}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Titre 3"
        />
        <Separator />
        <ToolBtn
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        />
        <ToolBtn
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        />
        <ToolBtn
          icon={Quote}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
        />
        <ToolBtn
          icon={Code}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloc de code"
        />
        <Separator />
        <ToolBtn
          icon={LinkIcon}
          active={editor.isActive("link")}
          onClick={promptLink}
          title="Lien"
        />
        <ToolBtn
          icon={ImageIcon}
          onClick={() => fileInput.current?.click()}
          title="Insérer une image"
        />
        <ToolBtn icon={TableIcon} onClick={insertTable} title="Insérer un tableau" />
        <Separator />
        <ToolBtn
          icon={ChevronsUpDown}
          onClick={() => setAccOpen(true)}
          title="Insérer un accordéon"
        />
        <ToolBtn
          icon={MessageSquare}
          onClick={() => setMsgOpen(true)}
          title="Insérer un message (info / note / attention)"
        />
        <Separator />
        <ToolBtn
          icon={Undo}
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler"
          disabled={!editor.can().undo()}
        />
        <ToolBtn
          icon={Redo}
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
          disabled={!editor.can().redo()}
        />
        {uploadingRef.current && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-2 text-xs text-[--k-muted]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Upload…
          </span>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImageUpload(f);
        }}
      />

      <div
        // Cliquer n'importe où dans la zone (même les marges) focus l'éditeur,
        // pour ne pas obliger l'utilisateur à viser le texte.
        onClick={() => {
          if (!editor.isFocused) editor.commands.focus();
        }}
        className="cursor-text"
        style={{ minHeight: `${minHeight}px` }}
      >
        <EditorContent
          editor={editor}
          className="p-3 prose prose-sm max-w-none tiptap-noring"
        />
      </div>

      {!value && placeholder && (
        <div className="px-3 pb-2 text-xs text-[--k-muted] italic pointer-events-none">
          {placeholder}
        </div>
      )}

      {/* Dialog Accordéon (reproduit plugin TinyMCE bootstrapaccordion). */}
      <Modal
        open={accOpen}
        onClose={() => setAccOpen(false)}
        title="Ajouter un accordéon"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAccOpen(false)}
              className="px-3 py-1.5 text-sm text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={insertAccordion}
              disabled={!accTitle.trim()}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              Insérer
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
              Titre
            </label>
            <input
              className="input-field"
              value={accTitle}
              onChange={(e) => setAccTitle(e.target.value)}
              placeholder="Titre de l'accordéon"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
              Contenu
            </label>
            <textarea
              className="input-field"
              rows={5}
              value={accContent}
              onChange={(e) => setAccContent(e.target.value)}
              placeholder="Contenu de l'accordéon"
            />
          </div>
        </div>
      </Modal>

      {/* Dialog Message (reproduit plugin TinyMCE messages). */}
      <Modal
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        title="Ajouter un message"
        footer={
          <>
            <button
              type="button"
              onClick={() => setMsgOpen(false)}
              className="px-3 py-1.5 text-sm text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={insertMessage}
              disabled={!msgContent.trim()}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              Insérer
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
              Type
            </label>
            <select
              className="input-field"
              value={msgType}
              onChange={(e) => setMsgType(e.target.value as MessageType)}
            >
              {(Object.keys(MESSAGE_LABEL) as MessageType[]).map((t) => (
                <option key={t} value={t}>
                  {MESSAGE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
              Contenu
            </label>
            <textarea
              className="input-field"
              rows={4}
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              placeholder="Texte du message"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Échappe les caractères dangereux pour insertion dans un attribut/HTML inline.
// Le back DOMPurify sanitize au save, mais on évite déjà ici les soucis évidents.
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ToolBtn({
  icon: Icon,
  active,
  disabled,
  onClick,
  title,
}: {
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center h-7 w-7 rounded transition ${
        active
          ? "bg-[--k-primary] text-white"
          : "text-[--k-text] hover:bg-[--k-surface-2]"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Separator() {
  return <span className="mx-0.5 h-7 w-px bg-[--k-border] self-center" />;
}
