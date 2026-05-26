import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api, type Post } from "../../lib/api";

export function HomePage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", "public"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts");
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Base de connaissance</h1>
      <p className="text-[color:var(--color-muted-foreground)] mb-8">
        Articles publiés. Use the admin to add new content.
      </p>

      {isLoading && <p>Chargement…</p>}
      {posts?.length === 0 && (
        <p className="text-[color:var(--color-muted-foreground)]">Aucun article pour l'instant.</p>
      )}
      <ul className="space-y-4">
        {posts?.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <Link to={`/post/${p.slug}`} className="text-lg font-semibold hover:underline">
              {p.titre}
            </Link>
            {p.resume && (
              <p className="text-sm text-[color:var(--color-muted-foreground)] mt-1">
                {p.resume}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
