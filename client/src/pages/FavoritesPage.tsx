import { useEffect, useState } from "react";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Favorite } from "../types";
import { ArtworkCard } from "../components/ArtworkCard";
import { EmptyState, ErrorPanel, Loading } from "../components/Status";

export const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    galleryApi.favorites().then(setFavorites).catch((reason) => setError(getErrorMessage(reason))).finally(() => setLoading(false));
  }, []);

  const remove = async (favorite: Favorite) => {
    try {
      await galleryApi.removeFavorite(favorite.artwork.source, favorite.artwork.sourceId);
      setFavorites((items) => items.filter((item) => item._id !== favorite._id));
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  };

  return (
    <div className="page-section page-top">
      <div className="page-title-row"><div><p className="eyebrow">Saved for later</p><h1>Your favorites</h1></div></div>
      {loading ? <Loading /> : error ? <ErrorPanel message={error} /> : favorites.length ? (
        <div className="art-grid">
          {favorites.map((favorite) => (
            <div className="favorite-wrap" key={favorite._id}>
              <ArtworkCard artwork={favorite.artwork} />
              <button className="remove-button" type="button" onClick={() => remove(favorite)}>Remove</button>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No favorites yet" message="Open an artwork and save the pieces you want to revisit." />}
    </div>
  );
};
