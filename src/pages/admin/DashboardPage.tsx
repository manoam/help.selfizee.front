import { Link } from "react-router-dom";

import { useMe } from "../../hooks/useAuth";

export function DashboardPage() {
  const { data } = useMe();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
      <p className="text-[color:var(--color-muted-foreground)] mb-6">
        Bienvenue {data?.name ?? data?.email}.
      </p>
      <div className="flex gap-3">
        <Link to="/admin/posts" className="border rounded px-4 py-2 text-sm hover:bg-[color:var(--color-muted)]">
          Voir les posts
        </Link>
        <Link to="/admin/posts/new" className="border rounded px-4 py-2 text-sm hover:bg-[color:var(--color-muted)]">
          + Nouveau post
        </Link>
      </div>
    </div>
  );
}
