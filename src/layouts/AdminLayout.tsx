import AppLayout from "../components/layout/AppLayout";

// AdminLayout délègue à AppLayout, qui charge HeaderBar + Sidebar depuis le hub
// Konitys (Module Federation). Voir src/components/layout/AppLayout.tsx.
export function AdminLayout() {
  return <AppLayout />;
}
