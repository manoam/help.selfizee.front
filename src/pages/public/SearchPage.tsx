import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Search, FileText, ChevronRight, Home, Star } from "lucide-react";

import { api, type Post } from "../../lib/api";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [input, setInput] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  // Debounce de 300ms pour ne pas spammer l'API à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(input), 300);
    return () => clearTimeout(t);
  }, [input]);

  // Sync URL avec la dernière recherche débouncée.
  useEffect(() => {
    if (debouncedQ) {
      setParams({ q: debouncedQ }, { replace: true });
    } else {
      setParams({}, { replace: true });
    }
  }, [debouncedQ, setParams]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", debouncedQ],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/search", {
        params: { q: debouncedQ },
      });
      return data;
    },
    enabled: debouncedQ.trim().length >= 2,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
      <nav className="flex items-center gap-1.5 text-xs text-[--a-text-muted] mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 hover:text-[--a-text] transition"
        >
          <Home className="h-3 w-3" />
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[--a-text] font-medium">Recherche</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-[--a-text] mb-6">
        Rechercher
      </h1>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[--a-text-muted]" />
        <input
          autoFocus
          className="w-full pl-11 pr-4 py-3 text-base bg-white border border-[--a-surface-2] rounded-xl shadow-sm focus:outline-none focus:border-[--a-accent] focus:ring-2 focus:ring-[--a-accent]/20"
          placeholder="Tapez votre recherche..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {debouncedQ.trim().length < 2 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Tapez au moins 2 caractères pour lancer la recherche.
        </p>
      )}

      {isLoading && debouncedQ.trim().length >= 2 && (
        <p className="text-sm text-[--a-text-muted]">Recherche…</p>
      )}

      {!isLoading && debouncedQ.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Aucun résultat pour "{debouncedQ}".
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="text-xs text-[--a-text-muted] mb-3">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {results.map((p) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className="a-card a-card-hover flex items-start gap-3 px-4 py-3 group"
              >
                <FileText className="h-4 w-4 text-[--a-text-muted] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[--a-text] group-hover:text-[--a-accent] transition flex items-center gap-2">
                    {p.titre}
                    {p.isFavourite && (
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {p.resume && (
                    <p className="text-xs text-[--a-text-muted] mt-0.5 line-clamp-2">
                      {p.resume}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-[--a-text-muted] group-hover:text-[--a-accent] transition shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
