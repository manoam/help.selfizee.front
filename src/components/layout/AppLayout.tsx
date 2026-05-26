import React, { Suspense, useState, useEffect, Component } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

import { loadRemoteComponent } from "../../remoteLoader";
import { useMe } from "../../hooks/useAuth";
import { AUTH_DISABLED } from "../../lib/authConfig";

interface HeaderUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}
interface RemoteHeaderBarProps {
  user: HeaderUser | null;
  onLogout: () => void;
  currentAppName: string;
  onNavigate: (path: string) => void;
}
interface SidebarItem {
  icon?: string;
  label: string;
  path: string;
}
interface SidebarSection {
  label: string;
  items: SidebarItem[];
}
interface RemoteSidebarProps {
  sections: SidebarSection[];
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onCollapse: () => void;
  onHelpClick: () => void;
}

// Composants Topbar + Sidebar charg\xc3\xa9s depuis le hub Konitys (Module Federation).
const RemoteHeaderBar = React.lazy(
  () =>
    loadRemoteComponent("./HeaderBar") as Promise<{
      default: React.ComponentType<RemoteHeaderBarProps>;
    }>,
);
const RemoteSidebar = React.lazy(
  () =>
    loadRemoteComponent("./Sidebar") as Promise<{
      default: React.ComponentType<RemoteSidebarProps>;
    }>,
);

function HeaderFallback() {
  return <div className="h-12 shrink-0 border-b border-[--k-border] bg-white" />;
}
function SidebarFallback() {
  return <div className="w-[210px] shrink-0 bg-[--k-sidebar-bg] h-full" />;
}

interface EBProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
interface EBState {
  hasError: boolean;
}

class RemoteErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// Sections de la sidebar — adaptables au scope help-selfizee.
const SIDEBAR_SECTIONS = [
  {
    label: "Contenu",
    items: [
      { label: "Tableau de bord", path: "/admin" },
      { label: "Posts", path: "/admin/posts" },
    ],
  },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: me } = useMe();
  // useAuth() ne peut être appelé que si AuthProvider est monté (donc auth activée).
  const oidc = AUTH_DISABLED
    ? { signoutRedirect: () => Promise.resolve() }
    : useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("k_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("k_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const handleNavigate = (path: string) => navigate(path);

  // Mapping useMe() (sub/email/name/preferredUsername) -> shape attendue par le hub
  // (firstName, lastName, email, username). Le hub affiche initiales + nom.
  const headerUser = me
    ? {
        firstName: me.name?.split(" ")[0] ?? me.preferredUsername ?? "",
        lastName: me.name?.split(" ").slice(1).join(" ") ?? "",
        email: me.email ?? "",
        username: me.preferredUsername ?? me.sub,
      }
    : null;

  const handleLogout = () => {
    if (AUTH_DISABLED) return;
    void oidc.signoutRedirect();
  };

  return (
    <div className="h-screen flex flex-col bg-[--k-bg]">
      <RemoteErrorBoundary fallback={<HeaderFallback />}>
        <Suspense fallback={<HeaderFallback />}>
          <RemoteHeaderBar
            user={headerUser}
            onLogout={handleLogout}
            currentAppName="Espace assistance"
            onNavigate={handleNavigate}
          />
        </Suspense>
      </RemoteErrorBoundary>

      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block">
          <RemoteErrorBoundary fallback={<SidebarFallback />}>
            <Suspense fallback={<SidebarFallback />}>
              <RemoteSidebar
                sections={SIDEBAR_SECTIONS}
                activePath={location.pathname}
                onNavigate={handleNavigate}
                collapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed((v) => !v)}
                onHelpClick={() => {}}
              />
            </Suspense>
          </RemoteErrorBoundary>
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto p-3 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
