import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/public/HomePage";
import { PostPage } from "./pages/public/PostPage";
import { CategoryPage } from "./pages/public/CategoryPage";
import { CallbackPage } from "./pages/admin/CallbackPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { PostsListPage } from "./pages/admin/PostsListPage";
import { PostEditPage } from "./pages/admin/PostEditPage";
import { RequireAuth } from "./components/RequireAuth";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="categorie/:slug" element={<CategoryPage />} />
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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
