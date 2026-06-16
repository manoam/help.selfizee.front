import { useEffect } from "react";
import { X } from "lucide-react";

// Mini modale legere pour les dialogs internes au RichTextEditor admin.
// Pas de portail React (le z-index sticky save bar = z-20, on prend z-50).
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${widthClass} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[--k-border]">
          <h3 className="text-sm font-semibold text-[--k-text]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[--k-muted] hover:text-[--k-text] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-[--k-border] bg-white rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
