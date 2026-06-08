import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { LifeBuoy, Settings, Search, Star } from "lucide-react";

export function PublicLayout() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = () => {
    const trimmed = q.trim();
    if (trimmed.length >= 2) {
      navigate(`/recherche?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/recherche");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[--a-bg]">
      <header className="bg-white border-b border-[--a-surface-2] shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--a-accent-soft]">
              <LifeBuoy className="h-5 w-5 text-[--a-accent]" />
            </span>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[--a-text-muted]">
                Selfizee
              </span>
              <span className="text-sm font-semibold text-[--a-text]">
                Support &amp; assistance
              </span>
            </div>
          </Link>

          {/* Barre de recherche centrale */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--a-text-muted]" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Rechercher un article..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[--a-bg] border border-[--a-surface-2] rounded-lg focus:outline-none focus:border-[--a-accent] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/favoris"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--a-text-muted] hover:text-[--a-accent] transition"
            >
              <Star className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Favoris</span>
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--a-text-muted] hover:text-[--a-text] transition"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[--a-surface-2] bg-white py-6 mt-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6 text-center text-xs text-[--a-text-muted]">
          © {new Date().getFullYear()} Selfizee — Support &amp; assistance
        </div>
      </footer>
    </div>
  );
}
