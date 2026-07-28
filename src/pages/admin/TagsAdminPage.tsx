import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tag as TagIcon,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
} from "lucide-react";

import { api, type TagWithCount } from "../../lib/api";

export function TagsAdminPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<TagWithCount[]>("/tags")).data,
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/tags", { name });
      return data;
    },
    onSuccess: () => {
      setNewName("");
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await api.put(`/tags/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--k-text)]">Tags</h1>
          <p className="text-sm text-[var(--k-muted)] mt-1">
            {tags.length} tag{tags.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Nouveau tag */}
      <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft p-4 mb-6">
        <h2 className="text-sm font-semibold text-[var(--k-text)] mb-3">
          Créer un tag
        </h2>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Nom du tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) create.mutate(newName);
            }}
          />
          <button
            type="button"
            onClick={() => create.mutate(newName)}
            disabled={!newName.trim() || create.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition shadow-sm shadow-[var(--k-primary)]/30 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Créer
          </button>
        </div>
        {create.isError && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--k-danger)]">
            <AlertCircle className="h-3.5 w-3.5" />
            Erreur (doublon ?)
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-sm text-[var(--k-muted)]">
            Chargement…
          </div>
        )}
        {!isLoading && tags.length === 0 && (
          <div className="p-12 text-center">
            <TagIcon className="h-12 w-12 mx-auto mb-3 text-[var(--k-muted)] opacity-50" />
            <p className="text-sm font-medium text-[var(--k-text)]">
              Aucun tag
            </p>
          </div>
        )}
        {!isLoading && tags.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left border-b border-[var(--k-border)] bg-[var(--k-surface-2)]/40">
              <tr>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                  Nom
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                  Slug
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                  Posts
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--k-border)] last:border-0 hover:bg-[var(--k-surface-2)]/40 transition group"
                >
                  <td className="py-3 px-4">
                    {editingId === t.id ? (
                      <input
                        autoFocus
                        className="input-field"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            update.mutate({ id: t.id, name: editName });
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-[var(--k-muted)]" />
                        <span className="font-medium text-[var(--k-text)]">
                          {t.name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--k-muted)] font-mono text-xs">
                    {t.slug}
                  </td>
                  <td className="py-3 px-4 text-[var(--k-muted)]">
                    {t._count?.posts ?? 0}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === t.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            update.mutate({ id: t.id, name: editName })
                          }
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                          title="Enregistrer"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:bg-[var(--k-surface-2)] transition"
                          title="Annuler"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => startEdit(t.id, t.name)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-primary)] hover:bg-[var(--k-primary-2)] transition"
                          title="Éditer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Supprimer le tag "${t.name}" ? Les liens vers les posts seront aussi supprimés.`,
                              )
                            )
                              remove.mutate(t.id);
                          }}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-danger)] hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
