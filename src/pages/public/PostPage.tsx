import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";

import { api, type PostDetail } from "../../lib/api";
import { RichTextViewer } from "../../components/RichTextViewer";

export function PostPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await api.get<PostDetail>(`/posts/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });

  if (isLoading) return <p className="p-8">Chargement…</p>;
  if (isError || !data)
    return (
      <div className="p-8">
        <p>Article introuvable.</p>
        <Link to="/" className="underline">
          Retour
        </Link>
      </div>
    );

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-[color:var(--color-muted-foreground)] hover:underline">
        ← Retour
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">{data.titre}</h1>
      {data.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {data.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs bg-[color:var(--color-muted)] px-2 py-1 rounded"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <RichTextViewer content={data.contenu} />
    </article>
  );
}
