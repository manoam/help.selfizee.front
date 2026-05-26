import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api, type Post } from "../../lib/api";

export function PostsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["posts", "admin"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts/admin/all");
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="border rounded px-4 py-2 text-sm hover:bg-[color:var(--color-muted)]"
        >
          + Nouveau
        </Link>
      </div>
      {isLoading && <p>Chargement…</p>}
      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr>
            <th className="py-2">Titre</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Statut</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data?.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.titre}</td>
              <td className="py-2 text-[color:var(--color-muted-foreground)]">{p.slug}</td>
              <td className="py-2">{p.status}</td>
              <td className="py-2 text-right">
                <Link to={`/admin/posts/${p.id}`} className="underline">
                  Éditer
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
