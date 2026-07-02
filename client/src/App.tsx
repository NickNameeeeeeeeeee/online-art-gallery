import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ArtworkPage } from "./pages/ArtworkPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { FavoritesPage } from "./pages/FavoritesPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { CollectionEditorPage } from "./pages/CollectionEditorPage";
import { PublicCollectionPage } from "./pages/PublicCollectionPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="artworks/:source/:id" element={<ArtworkPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="exhibitions/:slug" element={<PublicCollectionPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/new" element={<CollectionEditorPage />} />
          <Route path="collections/:id/edit" element={<CollectionEditorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
