import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type PostAttachmentDto } from "../../lib/api";

export function AttachmentsManager({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [pendingDescription, setPendingDescription] = useState("");

  const { data: list = [] } = useQuery({
    queryKey: ["post-attachments", postId],
    queryFn: async () => {
      // Le détail post inclut déjà les attachments, mais on les recharge ici
      // pour refresh facile après upload/delete.
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

  return (
    <div className="space-y-4">
      {list.length > 0 && (
        <div className="space-y-2">
          {list.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-3 border border-[--k-border] rounded-lg bg-[--k-surface-2]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {att.label || att.originalName || att.filename}
                </div>
                {att.description && (
                  <div className="text-xs text-[--k-muted] truncate">
                    {att.description}
                  </div>
                )}
                <div className="text-xs text-[--k-muted]">
                  {att.mimeType ?? "?"} ·{" "}
                  {att.sizeBytes
                    ? `${Math.round(att.sizeBytes / 1024)} Ko`
                    : "?"}
                </div>
              </div>
              <a
                href={`/api/attachments/${att.id}/download`}
                className="text-xs text-[--k-primary] hover:underline"
              >
                Télécharger
              </a>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Supprimer ce fichier ?")) remove.mutate(att.id);
                }}
                className="text-xs text-[--k-danger] hover:underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-[--k-muted] mb-1">
            Fichier
          </label>
          <input
            ref={fileInput}
            type="file"
            className="text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
            }}
            disabled={upload.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[--k-muted] mb-1">
            Titre (optionnel)
          </label>
          <input
            className="input-field"
            value={pendingLabel}
            onChange={(e) => setPendingLabel(e.target.value)}
            disabled={upload.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[--k-muted] mb-1">
            Description (optionnel)
          </label>
          <input
            className="input-field"
            value={pendingDescription}
            onChange={(e) => setPendingDescription(e.target.value)}
            disabled={upload.isPending}
          />
        </div>
      </div>

      {upload.isPending && (
        <p className="text-xs text-[--k-muted]">Upload en cours…</p>
      )}
      {upload.isError && (
        <p className="text-xs text-[--k-danger]">Erreur lors de l'upload.</p>
      )}
    </div>
  );
}
