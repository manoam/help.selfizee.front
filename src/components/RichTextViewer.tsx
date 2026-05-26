import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function RichTextViewer({ content }: { content: unknown }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content as object | string | null,
    editable: false,
  });
  return (
    <div className="prose prose-sm max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
