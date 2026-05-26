import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/react";

type Props = {
  value: JSONContent | null;
  onChange: (json: JSONContent, text: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getJSON(), editor.getText());
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2 py-1 text-xs rounded border ${
      active
        ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
        : "hover:bg-[color:var(--color-muted)]"
    }`;

  return (
    <div className="border rounded">
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
          B
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
        >
          • liste
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
        >
          1. liste
        </button>
      </div>
      <EditorContent editor={editor} className="p-3 min-h-[200px] prose prose-sm max-w-none" />
    </div>
  );
}
