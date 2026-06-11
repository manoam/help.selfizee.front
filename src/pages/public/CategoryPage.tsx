import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  FolderOpen,
  Home,
  FileText,
  ArrowLeft,
} from "lucide-react";

import { api } from "../../lib/api";

type CategoryDetail = {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  subCategories: {
    id: number;
    nom: string;
    slug: string;
    subSubCategories: {
      id: number;
      nom: string;
      slug: string;
      _count?: { posts: number };
    }[];
    _count?: { posts: number };
  }[];
};

type PublicPost = {
  id: number;
  titre: string;
  slug: string;
  resume: string | null;
};

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await api.get<CategoryDetail>(
        `/categories/by-slug/${slug}`,
      );
      return data;
    },
    enabled: !!slug,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "by-category-direct", category?.id],
    queryFn: async () => {
      // directOnly=1 : on ne récupère que les posts DIRECTEMENT attachés à la cat
      // (sans sous-cat), pour éviter la duplication avec la nav par sous-cat.
      const { data } = await api.get<PublicPost[]>(
        `/posts?categoryId=${category!.id}&directOnly=1`,
      );
      return data;
    },
    enabled: !!category,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <p className="text-sm text-[--a-text-muted]">Chargement…</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <p className="text-sm text-[--a-text-muted]">Catégorie introuvable.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[--a-accent] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[--a-text-muted] mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 hover:text-[--a-text] transition"
        >
          <Home className="h-3 w-3" />
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[--a-text] font-medium">{category.nom}</span>
      </nav>

      {/* Header catégorie */}
      <div className="bg-[--a-surface-2] rounded-xl p-5 md:p-6 mb-6">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shrink-0">
            <FolderOpen className="h-6 w-6 text-[--a-accent]" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="a-title-accent text-xl md:text-2xl">
              {category.nom}
            </h1>
            {category.description && (
              <p className="text-sm text-[--a-text-muted] mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sous-catégories */}
      {category.subCategories.length > 0 && (
        <div className="space-y-3 mb-8">
          {category.subCategories.map((sub) => (
            <div key={sub.id} className="a-card p-5">
              <Link
                to={`/sous-categorie/${sub.slug}`}
                className="text-base font-semibold text-[--a-text] mb-1 hover:text-[--a-accent] transition inline-block"
              >
                {sub.nom}
                {sub._count?.posts !== undefined &&
                  sub._count.posts > 0 && (
                    <span className="ml-2 text-xs text-[--a-text-muted] font-normal">
                      ({sub._count.posts})
                    </span>
                  )}
              </Link>
              {sub.subSubCategories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                  {sub.subSubCategories.map((ssc) => (
                    <Link
                      key={ssc.id}
                      to={`/sous-sous-categorie/${ssc.slug}`}
                      className="a-pill hover:bg-[--a-surface-3] justify-between"
                    >
                      <span className="truncate">{ssc.nom}</span>
                      {ssc._count?.posts !== undefined && (
                        <span className="text-xs text-[--a-text-muted]">
                          ({ssc._count.posts})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Posts directement rattachés à la catégorie */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[--a-text] mb-3 uppercase tracking-wide">
            Articles
          </h2>
          <div className="space-y-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className="a-card a-card-hover flex items-start gap-3 px-4 py-3 group"
              >
                <FileText className="h-4 w-4 text-[--a-text-muted] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[--a-text] group-hover:text-[--a-accent] transition">
                    {p.titre}
                  </div>
                  {p.resume && (
                    <p className="text-xs text-[--a-text-muted] mt-0.5 line-clamp-1">
                      {p.resume}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-[--a-text-muted] group-hover:text-[--a-accent] transition shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {category.subCategories.length === 0 && posts.length === 0 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Aucun contenu disponible dans cette catégorie.
        </p>
      )}
    </div>
  );
}
