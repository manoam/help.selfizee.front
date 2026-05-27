import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, BarChart3, Sparkles } from "lucide-react";

import { useMe } from "../../hooks/useAuth";
import { api, type Post } from "../../lib/api";

export function DashboardPage() {
  const { data: me } = useMe();
  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "admin"],
    queryFn: async () => {
      const { data } = await api.get<Post[]>("/posts/admin/all");
      return data;
    },
  });

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    drafts: posts.filter((p) => p.status === "DRAFT").length,
    favourites: posts.filter((p) => p.isFavourite).length,
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[--k-text]">
          Bonjour {me?.name ?? me?.preferredUsername ?? me?.email ?? ""}
        </h1>
        <p className="text-sm text-[--k-muted] mt-1">
          Voici un résumé de l'espace d'assistance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total"
          value={stats.total}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          label="Publiés"
          value={stats.published}
          icon={BarChart3}
          color="emerald"
        />
        <StatCard
          label="Brouillons"
          value={stats.drafts}
          icon={FileText}
          color="amber"
        />
        <StatCard
          label="Favoris"
          value={stats.favourites}
          icon={Sparkles}
          color="rose"
        />
      </div>

      <div className="bg-white border border-[--k-border] rounded-xl2 shadow-soft p-6">
        <h2 className="text-sm font-semibold text-[--k-text] mb-3">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition shadow-sm shadow-[--k-primary]/30"
          >
            <Plus className="h-4 w-4" />
            Nouveau document
          </Link>
          <Link
            to="/admin/posts"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition"
          >
            <FileText className="h-4 w-4" />
            Tous les documents
          </Link>
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white border border-[--k-border] rounded-xl2 shadow-soft p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[--k-muted] uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}
        >
          <Icon className={`h-4 w-4 ${c.text}`} />
        </span>
      </div>
      <div className="text-2xl font-bold text-[--k-text]">{value}</div>
    </div>
  );
}
