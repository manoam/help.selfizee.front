import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "react-oidc-context";

import { useMe } from "../hooks/useAuth";

export function AdminLayout() {
  const { data: me } = useMe();
  const oidc = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded text-sm ${
      isActive
        ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
        : "hover:bg-[color:var(--color-muted)]"
    }`;

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-[color:var(--color-muted)] p-4 flex flex-col gap-1">
        <Link to="/admin" className="font-semibold text-lg mb-4">
          Admin
        </Link>
        <NavLink to="/admin" end className={navItemClass}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/posts" className={navItemClass}>
          Posts
        </NavLink>
        <div className="mt-auto pt-4 border-t text-xs text-[color:var(--color-muted-foreground)]">
          <div>{me?.email ?? me?.preferredUsername}</div>
          <button
            onClick={() => void oidc.signoutRedirect()}
            className="mt-2 underline"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
