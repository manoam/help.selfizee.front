import { Link, Outlet } from "react-router-dom";
import { LifeBuoy, Settings } from "lucide-react";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[--a-bg]">
      <header className="bg-white border-b border-[--a-surface-2] shadow-sm">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--a-accent-soft]">
              <LifeBuoy className="h-5 w-5 text-[--a-accent]" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[--a-text-muted]">
                Selfizee
              </span>
              <span className="text-sm font-semibold text-[--a-text]">
                Support &amp; assistance
              </span>
            </div>
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--a-text-muted] hover:text-[--a-text] transition"
          >
            <Settings className="h-3.5 w-3.5" />
            Admin
          </Link>
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
