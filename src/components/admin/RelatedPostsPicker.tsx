import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, FileText, Link2 } from "lucide-react";

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

  const { data: results = [], isLoading } = useQuery({
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
      {selectedDetails.length > 0 ? (
        <div className="space-y-1.5">
          {selectedDetails.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 bg-[--k-surface-2] rounded-lg text-sm group hover:bg-[--k-primary-2] transition"
            >
              <FileText className="h-3.5 w-3.5 text-[--k-muted] shrink-0" />
              <span className="flex-1 truncate text-[--k-text]">{p.titre}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-[--k-muted] hover:text-[--k-danger] opacity-0 group-hover:opacity-100 transition shrink-0"
                title="Retirer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[--k-muted] italic">Aucun article lié</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[--k-primary] hover:underline"
      >
        <Link2 className="h-3.5 w-3.5" />
        {open ? "Fermer le sélecteur" : "Lier un article"}
      </button>

      {open && (
        <div className="border border-[--k-border] rounded-lg p-3 space-y-2 bg-white shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--k-muted]" />
            <input
              className="input-field pl-9"
              placeholder="Rechercher un titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {isLoading && (
              <p className="text-xs text-[--k-muted] py-2 text-center">
                Chargement…
              </p>
            )}
            {!isLoading && results.length === 0 && (
              <p className="text-xs text-[--k-muted] py-3 text-center italic">
                Aucun résultat
              </p>
            )}
            {results.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    add(p.id);
                    setSearch("");
                  }}
                  disabled={isSelected}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-[--k-surface-2] disabled:opacity-50 flex items-center gap-2 transition"
                >
                  <FileText className="h-3.5 w-3.5 text-[--k-muted] shrink-0" />
                  <span className="flex-1 truncate">{p.titre}</span>
                  {isSelected && (
                    <span className="text-[10px] text-[--k-muted] shrink-0">
                      ajouté
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
