import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  ExternalLink,
  Star,
} from "lucide-react";

import { api, type Post } from "../../lib/api";

const STATUS_META = {
  DRAFT: { label: "Brouillon", bg: "bg-amber-50", text: "text-amber-700" },
  PUBLISHED: { label: "Publié", bg: "bg-emerald-50", text: "text-emerald-700" },
  ARCHIVED: { label: "Archivé", bg: "bg-slate-100", text: "text-slate-600" },
} as const;

export function PostsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Post["status"]>("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["posts", "admin"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts/admin/all");
      return data;
    },
  });

  const filtered = data
    .filter((p) =>
      search.trim()
        ? p.titre.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
        : true,
    )
    .filter((p) => (statusFilter ? p.status === statusFilter : true));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[--k-text]">Documents</h1>
          <p className="text-sm text-[--k-muted] mt-1">
            {data.length} document{data.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition shadow-sm shadow-[--k-primary]/30"
        >
          <Plus className="h-4 w-4" />
          Nouveau document
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--k-muted]" />
          <input
            className="input-field pl-9"
            placeholder="Rechercher par titre ou slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field max-w-[160px]"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | Post["status"])
          }
        >
          <option value="">Tous statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
      </div>

      <div className="bg-white border border-[--k-border] rounded-xl2 shadow-soft overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-sm text-[--k-muted]">
            Chargement…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-[--k-muted] opacity-50" />
            <p className="text-sm font-medium text-[--k-text]">
              Aucun document
            </p>
            <p className="text-xs text-[--k-muted] mt-1">
              {search || statusFilter
                ? "Essayez d'élargir vos filtres."
                : "Commencez par créer votre premier document."}
            </p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left border-b border-[--k-border] bg-[--k-surface-2]/40">
              <tr>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[--k-muted]">
                  Titre
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[--k-muted]">
                  Slug
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[--k-muted]">
                  Statut
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-[--k-muted]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const meta = STATUS_META[p.status];
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[--k-border] last:border-0 hover:bg-[--k-surface-2]/40 transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[--k-muted] shrink-0" />
                        <Link
                          to={`/admin/posts/${p.id}`}
                          className="font-medium text-[--k-text] hover:text-[--k-primary] transition truncate max-w-md"
                        >
                          {p.titre}
                        </Link>
                        {p.isFavourite && (
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[--k-muted] font-mono text-xs truncate max-w-[200px]">
                      {p.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {p.status === "PUBLISHED" && (
                          <a
                            href={`/post/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[--k-muted] hover:text-[--k-primary] hover:bg-[--k-primary-2] transition"
                            title="Voir la page publique"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          to={`/admin/posts/${p.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[--k-muted] hover:text-[--k-primary] hover:bg-[--k-primary-2] transition"
                          title="Éditer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
