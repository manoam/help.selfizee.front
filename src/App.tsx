import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { PublicLayout } from "./layouts/PublicLayout";
import { HomePage } from "./pages/public/HomePage";
import { PostPage } from "./pages/public/PostPage";
import { CategoryPage } from "./pages/public/CategoryPage";
import { SearchPage } from "./pages/public/SearchPage";
import { FavorisPage } from "./pages/public/FavorisPage";
import { ListeDocumentsPage } from "./pages/public/ListeDocumentsPage";
import { RequireAuth } from "./components/RequireAuth";

// Lazy-load des pages admin : TipTap + StarterKit + RichTextEditor + tout le
// PostEditPage (~700 lignes) ne sont chargés que quand un user entre en /admin.
// Le bundle public initial est ainsi plus léger.
const AdminLayout = lazy(() =>
  import("./layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const CallbackPage = lazy(() =>
  import("./pages/admin/CallbackPage").then((m) => ({
    default: m.CallbackPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const PostsListPage = lazy(() =>
  import("./pages/admin/PostsListPage").then((m) => ({
    default: m.PostsListPage,
  })),
);
const PostEditPage = lazy(() =>
  import("./pages/admin/PostEditPage").then((m) => ({
    default: m.PostEditPage,
  })),
);
const TagsAdminPage = lazy(() =>
  import("./pages/admin/TagsAdminPage").then((m) => ({
    default: m.TagsAdminPage,
  })),
);

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-screen text-sm text-[--k-muted]">
      Chargement…
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="recherche" element={<SearchPage />} />
        <Route path="favoris" element={<FavorisPage />} />
        <Route path="categorie/:slug" element={<CategoryPage />} />
        <Route
          path="sous-categorie/:slug"
          element={<ListeDocumentsPage source="sous-cat" />}
        />
        <Route
          path="sous-sous-categorie/:slug"
          element={<ListeDocumentsPage source="sous-sous-cat" />}
        />
        <Route
          path="tag/:slug"
          element={<ListeDocumentsPage source="tag" />}
        />
        <Route path="post/:slug" element={<PostPage />} />
      </Route>

      <Route
        path="admin"
        element={
          <Suspense fallback={<LazyFallback />}>
            <RouteOutlet />
          </Suspense>
        }
      >
        <Route path="callback" element={<CallbackPage />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="posts" element={<PostsListPage />} />
          <Route path="posts/new" element={<PostEditPage />} />
          <Route path="posts/:id" element={<PostEditPage />} />
          <Route path="tags" element={<TagsAdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Petit wrapper pour rendre les routes enfants sous <Suspense>.
// (React Router v7 ne supporte pas Suspense directement comme `element` parent.)
function RouteOutlet() {
  return <Outlet />;
}
