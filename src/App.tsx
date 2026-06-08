import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/public/HomePage";
import { PostPage } from "./pages/public/PostPage";
import { CategoryPage } from "./pages/public/CategoryPage";
import { SearchPage } from "./pages/public/SearchPage";
import { FavorisPage } from "./pages/public/FavorisPage";
import { ListeDocumentsPage } from "./pages/public/ListeDocumentsPage";
import { CallbackPage } from "./pages/admin/CallbackPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { PostsListPage } from "./pages/admin/PostsListPage";
import { PostEditPage } from "./pages/admin/PostEditPage";
import { TagsAdminPage } from "./pages/admin/TagsAdminPage";
import { RequireAuth } from "./components/RequireAuth";

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

      <Route path="admin">
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
