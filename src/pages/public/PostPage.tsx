import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  Tag as TagIcon,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  Download,
  Paperclip,
} from "lucide-react";

import { api, type PostDetail } from "../../lib/api";
import { RichTextViewer } from "../../components/RichTextViewer";
import { EmojiVote } from "../../components/public/EmojiVote";

type ViewTab = "client" | "callcenter" | "interne";

const VIEW_LABEL: Record<ViewTab, string> = {
  client: "Vue client",
  callcenter: "Vue call-center",
  interne: "Vue interne",
};

export function PostPage() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await api.get<PostDetail>(`/posts/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });

  // Détermine quelles vues sont disponibles (au moins un champ rempli).
  const availableViews = useMemo<ViewTab[]>(() => {
    if (!post) return [];
    const v: ViewTab[] = [];
    if (post.introClient || post.noticeClient || post.problemeClient)
      v.push("client");
    if (
      post.introCallCenter ||
      post.noticeCallCenter ||
      post.problemeCallCenter
    )
      v.push("callcenter");
    // Vue interne : on a toujours le `contenu` (TipTap) + intro/probleme.
    if (post.contenu || post.introInterne || post.problemeInterne)
      v.push("interne");
    return v;
  }, [post]);

  const [tab, setTab] = useState<ViewTab | null>(null);
  const activeTab = tab ?? availableViews[0] ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
        <p className="text-sm text-[--a-text-muted]">Chargement…</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
        <p className="text-sm text-[--a-text-muted]">Article introuvable.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[--a-accent] hover:underline"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    );
  }

  // Catégorie principale pour le breadcrumb
  const mainCat = post.categories[0];
  const updatedAt = post.publishedAt
    ? new Date(post.publishedAt)
    : null;

  return (
    <article className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[--a-text-muted] mb-4 flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-1 hover:text-[--a-text] transition"
        >
          <Home className="h-3 w-3" />
          Accueil
        </Link>
        {mainCat?.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              to={`/categorie/${mainCat.category.slug}`}
              className="hover:text-[--a-text] transition"
            >
              {mainCat.category.nom}
            </Link>
          </>
        )}
        {mainCat?.subCategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{mainCat.subCategory.nom}</span>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-[--a-text] font-medium truncate">
          {post.titre}
        </span>
      </nav>

      {/* Carte principale */}
      <div className="a-card p-5 md:p-8">
        {/* Header titre + meta */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="a-title-accent text-2xl md:text-3xl leading-tight">
              {post.titre}
            </h1>
            {post.resume && (
              <p className="text-sm text-[--a-text-muted] mt-2">
                {post.resume}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.isFavourite && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Favori
              </span>
            )}
            <span className="a-pill text-xs">Fiche N° {post.id}</span>
          </div>
        </div>

        {updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-[--a-text-muted] mb-6">
            <Calendar className="h-3.5 w-3.5" />
            <i>Dernière maj : {updatedAt.toLocaleDateString("fr-FR")}</i>
          </div>
        )}

        {/* Description du problème */}
        {post.descriptionProbleme && (
          <div className="a-problematique mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[--a-accent] mt-1 shrink-0" />
              <div
                className="a-html-content flex-1"
                dangerouslySetInnerHTML={{ __html: post.descriptionProbleme }}
              />
            </div>
          </div>
        )}

        {/* Onglets des vues */}
        {availableViews.length > 0 && (
          <>
            {availableViews.length > 1 && (
              <div className="a-tab-wrapper">
                {availableViews.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTab(v)}
                    className={`a-tab ${activeTab === v ? "is-active" : ""}`}
                  >
                    {VIEW_LABEL[v]}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2">
              {activeTab === "client" && (
                <ViewContent
                  intro={post.introClient}
                  contenu={post.noticeClient}
                  probleme={post.problemeClient}
                />
              )}
              {activeTab === "callcenter" && (
                <ViewContent
                  intro={post.introCallCenter}
                  contenu={post.noticeCallCenter}
                  probleme={post.problemeCallCenter}
                />
              )}
              {activeTab === "interne" && (
                <ViewContent
                  intro={post.introInterne}
                  contenuTipTap={post.contenu}
                  probleme={post.problemeInterne}
                />
              )}
            </div>
          </>
        )}

        {/* Questions */}
        {post.question && (
          <div className="mt-8 pt-6 border-t border-[--a-surface-2]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[--a-text] mb-3">
              Questions associées
            </h3>
            <div
              className="a-html-content"
              dangerouslySetInnerHTML={{ __html: post.question }}
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-6 pt-6 border-t border-[--a-surface-2]">
            <TagIcon className="h-3.5 w-3.5 text-[--a-text-muted]" />
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                to={`/tag/${tag.slug}`}
                className="a-pill text-xs hover:bg-[--a-surface-3] transition"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Vote utilisateur */}
        <EmojiVote postId={post.id} />
      </div>

      {/* Fichiers attachés */}
      {post.attachments.length > 0 && (
        <div className="a-card p-5 md:p-6 mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[--a-text] mb-4">
            <Paperclip className="h-4 w-4" />
            Ressources disponibles
          </h2>
          <div className="space-y-2">
            {post.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[--a-surface-2] bg-[--a-bg]"
              >
                <FileText className="h-5 w-5 text-[--a-accent] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[--a-text] truncate">
                    {att.label || att.originalName || att.filename}
                  </div>
                  {att.description && (
                    <p className="text-xs text-[--a-text-muted] truncate">
                      {att.description}
                    </p>
                  )}
                </div>
                <a
                  href={`/api/attachments/${att.id}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--a-accent] border border-[--a-accent-border] bg-[--a-accent-soft] rounded-full hover:brightness-95 transition"
                >
                  <Download className="h-3 w-3" />
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles liés */}
      {post.relatedTo.length > 0 && (
        <div className="a-card p-5 md:p-6 mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[--a-text] mb-4">
            Articles liés
          </h2>
          <div className="space-y-2">
            {post.relatedTo.map(({ to }) => (
              <Link
                key={to.id}
                to={`/post/${to.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[--a-surface-3] transition group"
              >
                <FileText className="h-4 w-4 text-[--a-text-muted] shrink-0" />
                <span className="flex-1 text-sm text-[--a-text] group-hover:text-[--a-accent] transition truncate">
                  {to.titre}
                </span>
                <ChevronRight className="h-4 w-4 text-[--a-text-muted] group-hover:text-[--a-accent] transition shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function ViewContent({
  intro,
  contenu,
  contenuTipTap,
  probleme,
}: {
  intro?: string | null;
  contenu?: string | null;
  contenuTipTap?: unknown;
  probleme?: string | null;
}) {
  const hasTiptapContent =
    contenuTipTap &&
    typeof contenuTipTap === "object" &&
    !Array.isArray(contenuTipTap);
  return (
    <div className="space-y-6">
      {intro && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[--a-text-muted] mb-2">
            Intro
          </h3>
          <div
            className="a-html-content"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </section>
      )}
      {contenu && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[--a-text-muted] mb-2">
            Contenu
          </h3>
          <div
            className="a-html-content"
            dangerouslySetInnerHTML={{ __html: contenu }}
          />
        </section>
      )}
      {hasTiptapContent && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[--a-text-muted] mb-2">
            Contenu
          </h3>
          <div className="a-html-content">
            <RichTextViewer content={contenuTipTap} />
          </div>
        </section>
      )}
      {probleme && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[--a-text-muted] mb-2">
            Problème
          </h3>
          <div
            className="a-html-content"
            dangerouslySetInnerHTML={{ __html: probleme }}
          />
        </section>
      )}
    </div>
  );
}
