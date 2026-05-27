import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Paperclip,
} from "lucide-react";

import { api, type PostAttachmentDto } from "../../lib/api";

export function AttachmentsManager({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [pendingDescription, setPendingDescription] = useState("");
  const [dragging, setDragging] = useState(false);

  const { data: list = [] } = useQuery({
    queryKey: ["post-attachments", postId],
    queryFn: async () => {
      const { data } = await api.get<{ attachments: PostAttachmentDto[] }>(
        `/posts/by-id/${postId}`,
      );
      return data.attachments;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      if (pendingLabel) fd.append("label", pendingLabel);
      if (pendingDescription) fd.append("description", pendingDescription);
      const { data } = await api.post<PostAttachmentDto>(
        `/attachments/${postId}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      setPendingLabel("");
      setPendingDescription("");
      if (fileInput.current) fileInput.current.value = "";
      qc.invalidateQueries({ queryKey: ["post-attachments", postId] });
      qc.invalidateQueries({ queryKey: ["post-edit", String(postId)] });
    },
  });

  const remove = useMutation({
    mutationFn: async (attId: number) => {
      await api.delete(`/attachments/${attId}`);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["post-attachments", postId] }),
  });

  const handleFile = (f: File) => upload.mutate(f);

  return (
    <div className="space-y-4">
      {list.length > 0 && (
        <div className="space-y-2">
          {list.map((att) => {
            const isImage = att.mimeType?.startsWith("image/");
            const Icon = isImage ? ImageIcon : FileText;
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 p-3 border border-[--k-border] rounded-lg bg-white hover:bg-[--k-surface-2]/40 transition group"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                    isImage ? "bg-blue-50" : "bg-[--k-surface-2]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isImage ? "text-blue-600" : "text-[--k-muted]"
                    }`}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[--k-text] truncate">
                    {att.label || att.originalName || att.filename}
                  </div>
                  {att.description && (
                    <div className="text-xs text-[--k-muted] truncate">
                      {att.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-[--k-muted] mt-0.5">
                    <span>{att.mimeType ?? "?"}</span>
                    <span>·</span>
                    <span>
                      {att.sizeBytes
                        ? formatBytes(att.sizeBytes)
                        : "taille inconnue"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <a
                    href={`/api/attachments/${att.id}/download`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[--k-muted] hover:text-[--k-primary] hover:bg-[--k-primary-2] transition"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Supprimer ce fichier ?"))
                        remove.mutate(att.id);
                    }}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[--k-muted] hover:text-[--k-danger] hover:bg-red-50 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileInput.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragging
            ? "border-[--k-primary] bg-[--k-primary-2]"
            : "border-[--k-border] hover:border-[--k-primary] hover:bg-[--k-surface-2]/40"
        }`}
      >
        <Paperclip className="h-8 w-8 mx-auto mb-2 text-[--k-muted]" />
        <p className="text-sm font-medium text-[--k-text]">
          Glissez un fichier ici ou{" "}
          <span className="text-[--k-primary] underline">choisissez-en un</span>
        </p>
        <p className="text-xs text-[--k-muted] mt-1">PDF, images, docs — 50 Mo max</p>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={upload.isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
            Titre du prochain upload
          </label>
          <input
            className="input-field"
            value={pendingLabel}
            onChange={(e) => setPendingLabel(e.target.value)}
            placeholder="(optionnel)"
            disabled={upload.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[--k-text] mb-1.5">
            Description
          </label>
          <input
            className="input-field"
            value={pendingDescription}
            onChange={(e) => setPendingDescription(e.target.value)}
            placeholder="(optionnel)"
            disabled={upload.isPending}
          />
        </div>
      </div>

      {upload.isPending && (
        <div className="flex items-center gap-2 text-xs text-[--k-muted]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Upload en cours…
        </div>
      )}
      {upload.isError && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-[--k-danger]">
          <AlertCircle className="h-3.5 w-3.5" />
          Erreur lors de l'upload.
        </div>
      )}
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`;
}

// Silence unused import warning (used via lucide-react).
void Upload;
