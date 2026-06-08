import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Home,
  FileText,
  Star,
  FolderOpen,
  Tag as TagIcon,
} from "lucide-react";

import {
  api,
  type Post,
  type SubCategoryWithParent,
  type SubSubCategoryWithParent,
  type TagDto,
} from "../../lib/api";

type Source = "sous-cat" | "sous-sous-cat" | "tag";

export function ListeDocumentsPage({ source }: { source: Source }) {
  const { slug } = useParams<{ slug: string }>();

  // Charge l'entité parente (selon source) pour récupérer son ID + breadcrumb
  const { data: parent, isLoading: parentLoading } = useQuery({
    queryKey: [source, "by-slug", slug],
    queryFn: async () => {
      if (source === "sous-cat") {
        const { data } = await api.get<SubCategoryWithParent>(
          `/categories/sub/by-slug/${slug}`,
        );
        return { kind: "sous-cat" as const, data };
      }
      if (source === "sous-sous-cat") {
        const { data } = await api.get<SubSubCategoryWithParent>(
          `/categories/sub-sub/by-slug/${slug}`,
        );
        return { kind: "sous-sous-cat" as const, data };
      }
      const { data } = await api.get<TagDto>(`/tags/by-slug/${slug}`);
      return { kind: "tag" as const, data };
    },
    enabled: !!slug,
  });

  const filterParam =
    parent?.kind === "sous-cat"
      ? `subCategoryId=${parent.data.id}`
      : parent?.kind === "sous-sous-cat"
        ? `subSubCategoryId=${parent.data.id}`
        : parent?.kind === "tag"
          ? `tagId=${parent.data.id}`
          : null;

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "by-source", source, slug],
    queryFn: async () => {
      const { data } = await api.get<Post[]>(`/posts?${filterParam}`);
      return data;
    },
    enabled: !!filterParam,
  });

  if (parentLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <p className="text-sm text-[--a-text-muted]">Chargement…</p>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <p className="text-sm text-[--a-text-muted]">Section introuvable.</p>
      </div>
    );
  }

  // Breadcrumb selon source
  const breadcrumbItems: { label: string; to?: string }[] = [
    { label: "Accueil", to: "/" },
  ];
  if (parent.kind === "sous-cat") {
    breadcrumbItems.push({
      label: parent.data.category.nom,
      to: `/categorie/${parent.data.category.slug}`,
    });
    breadcrumbItems.push({ label: parent.data.nom });
  } else if (parent.kind === "sous-sous-cat") {
    breadcrumbItems.push({
      label: parent.data.subCategory.category.nom,
      to: `/categorie/${parent.data.subCategory.category.slug}`,
    });
    breadcrumbItems.push({ label: parent.data.subCategory.nom });
    breadcrumbItems.push({ label: parent.data.nom });
  } else {
    breadcrumbItems.push({ label: `Tag : ${parent.data.name}` });
  }

  const headerTitle =
    parent.kind === "tag" ? `Tag : ${parent.data.name}` : parent.data.nom;
  const HeaderIcon =
    parent.kind === "tag" ? TagIcon : FolderOpen;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
      <nav className="flex items-center gap-1.5 text-xs text-[--a-text-muted] mb-6 flex-wrap">
        {breadcrumbItems.map((it, idx) => (
          <span key={idx} className="inline-flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="h-3 w-3" />}
            {it.to ? (
              <Link
                to={it.to}
                className="inline-flex items-center gap-1 hover:text-[--a-text] transition"
              >
                {idx === 0 && <Home className="h-3 w-3" />}
                {it.label}
              </Link>
            ) : (
              <span className="text-[--a-text] font-medium">{it.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="bg-[--a-surface-2] rounded-xl p-5 md:p-6 mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shrink-0">
          <HeaderIcon className="h-6 w-6 text-[--a-accent]" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="a-title-accent text-xl md:text-2xl">{headerTitle}</h1>
          <p className="text-sm text-[--a-text-muted] mt-1">
            {posts.length} article{posts.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-[--a-text-muted] text-center py-12">
          Aucun article dans cette section.
        </p>
      )}

      <div className="space-y-2">
        {posts.map((p) => (
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
    </div>
  );
}
