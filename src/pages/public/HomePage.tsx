import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, FolderOpen, Star } from "lucide-react";

import { api, type Post } from "../../lib/api";

type CategoryWithChildren = {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  subCategories: {
    id: number;
    nom: string;
    slug: string;
  }[];
};

export function HomePage() {
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: async () => {
      const { data } = await api.get<CategoryWithChildren[]>(
        "/categories?tree=1",
      );
      return data;
    },
  });

  const { data: favourites = [] } = useQuery({
    queryKey: ["posts", "favourite-only"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts?favourite=1");
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[--a-text] mb-2">
          Support &amp; assistance Selfizee
        </h1>
        <p className="text-sm text-[--a-text-muted]">
          Choisissez une catégorie pour accéder aux articles d'aide.
        </p>
      </div>

      {favourites.length > 0 && (
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[--a-text] mb-3 uppercase tracking-wide">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            À la une
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favourites.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className="a-card a-card-hover p-4 flex items-start gap-3 group"
              >
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[--a-text] group-hover:text-[--a-accent] transition">
                    {p.titre}
                  </div>
                  {p.resume && (
                    <p className="text-xs text-[--a-text-muted] mt-1 line-clamp-2">
                      {p.resume}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {catLoading && (
        <p className="text-sm text-[--a-text-muted]">Chargement…</p>
      )}

      <div className="space-y-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/categorie/${cat.slug}`}
            className="a-card a-card-hover block px-5 py-4 group"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[--a-accent-soft] shrink-0">
                <FolderOpen className="h-6 w-6 text-[--a-accent]" />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="a-title-accent text-lg leading-tight group-hover:underline">
                  {cat.nom}
                </h3>
                {cat.description && (
                  <p className="text-sm text-[--a-text-muted] mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-[--a-text-muted] group-hover:text-[--a-accent] transition shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {!catLoading && categories.length === 0 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Aucune catégorie disponible pour le moment.
        </p>
      )}
    </div>
  );
}
