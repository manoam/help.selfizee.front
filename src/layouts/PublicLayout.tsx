import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Search, Star, Settings } from "lucide-react";

// Layout public reproduisant l'espace assistance du CRM Selfizee :
//  - header rose plein (#e71e56) avec logo blanc + "Centre d'assistance"
//  - bloc de recherche rose séparé sous le header (champ rose clair #f6adc1)
// Cf. src/Template/Element/menu_assistance.ctp + css/Header/header-assistance.css.
export function PublicLayout() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = () => {
    const trimmed = q.trim();
    navigate(trimmed.length >= 2 ? `/recherche?q=${encodeURIComponent(trimmed)}` : "/recherche");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--a-bg)]">
      {/* Header rose */}
      <header className="bg-[var(--a-accent)] sticky top-0 z-30">
        <div className="mx-auto max-w-[1025px] px-4 md:px-6 h-[64px] flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-2xl font-bold text-white leading-none">
              Selfizee
              <sup className="text-[10px] font-normal align-super">™</sup>
            </span>
            <span className="hidden sm:inline text-white/90 text-sm font-light">
              Centre d'assistance
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/favoris"
              title="Favoris"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-white/90 hover:bg-white/15 transition"
            >
              <Star className="h-5 w-5" />
            </Link>
            <Link
              to="/admin"
              title="Espace admin"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-white/90 hover:bg-white/15 transition"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bloc de recherche rose (sous le header) */}
      <div className="bg-[var(--a-accent)] pb-4 pt-1">
        <div className="mx-auto max-w-[1025px] px-4 md:px-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80 pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              placeholder="Problématique ou numéro de fiche"
              aria-label="Rechercher"
              className="w-full h-11 pl-12 pr-4 text-sm rounded-lg bg-[var(--a-search)] text-[var(--a-text)] placeholder-white/90 border-0 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            />
          </div>
        </div>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-6 mt-8">
        <div className="mx-auto max-w-[1025px] px-4 md:px-6 text-center text-xs text-[var(--a-text-muted)]">
          © {new Date().getFullYear()} Selfizee — Centre d'assistance
        </div>
      </footer>
    </div>
  );
}
