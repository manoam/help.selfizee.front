import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

type Searchable = { id: number; titre: string; slug: string; status: string };

export function RelatedPostsPicker({
  selectedIds,
  excludeId,
  onChange,
}: {
  selectedIds: number[];
  excludeId?: number;
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["posts-searchable", search, excludeId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search.trim()) params.q = search.trim();
      if (excludeId) params.exclude = String(excludeId);
      const { data } = await api.get<Searchable[]>("/posts/admin/searchable", {
        params,
      });
      return data;
    },
    enabled: open,
  });

  // Pour afficher les titres des posts déjà sélectionnés sans rechargement.
  const { data: selectedDetails = [] } = useQuery({
    queryKey: ["posts-searchable-selected", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const { data } = await api.get<Searchable[]>("/posts/admin/searchable");
      return data.filter((p) => selectedIds.includes(p.id));
    },
    enabled: selectedIds.length > 0,
  });

  const remove = (id: number) =>
    onChange(selectedIds.filter((x) => x !== id));
  const add = (id: number) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      {selectedDetails.length > 0 && (
        <div className="space-y-1">
          {selectedDetails.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[--k-surface-2] rounded text-sm"
            >
              <span className="truncate">{p.titre}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-xs text-[--k-danger] hover:underline shrink-0"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[--k-primary] hover:underline"
      >
        {open ? "Fermer" : "+ Choisir depuis la liste"}
      </button>

      {open && (
        <div className="border border-[--k-border] rounded-lg p-3 space-y-2 bg-white">
          <input
            className="input-field"
            placeholder="Rechercher un titre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 && (
              <p className="text-xs text-[--k-muted] py-2 text-center">
                Aucun résultat
              </p>
            )}
            {results.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => add(p.id)}
                  disabled={isSelected}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-[--k-surface-2] disabled:opacity-50"
                >
                  {p.titre}
                  {isSelected && (
                    <span className="text-xs text-[--k-muted] ml-2">
                      (déjà ajouté)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
