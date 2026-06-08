import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Star, Home, ChevronRight, FileText } from "lucide-react";

import { api, type Post } from "../../lib/api";

export function FavorisPage() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", "favourite-only"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts?favourite=1");
      return data;
    },
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
        <span className="text-[--a-text] font-medium">Favoris</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
          <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[--a-text]">
            Articles favoris
          </h1>
          <p className="text-sm text-[--a-text-muted] mt-1">
            Les articles mis en avant par l'équipe.
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-[--a-text-muted]">Chargement…</p>
      )}

      {!isLoading && posts.length === 0 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Aucun article favori pour le moment.
        </p>
      )}

      <div className="space-y-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            to={`/post/${p.slug}`}
            className="a-card a-card-hover flex items-start gap-3 px-4 py-3 group"
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[--a-text] group-hover:text-[--a-accent] transition">
                {p.titre}
              </div>
              {p.resume && (
                <p className="text-xs text-[--a-text-muted] mt-0.5 line-clamp-2">
                  {p.resume}
                </p>
              )}
            </div>
            <FileText className="h-4 w-4 text-[--a-text-muted] group-hover:text-[--a-accent] transition shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
