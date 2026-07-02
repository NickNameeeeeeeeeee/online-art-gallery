import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Collection } from "../types";
import { EmptyState, ErrorPanel, Loading } from "../components/Status";

export const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    galleryApi.collections().then(setCollections).catch((reason) => setError(getErrorMessage(reason))).finally(() => setLoading(false));
  }, []);

  const remove = async (collection: Collection) => {
    if (!window.confirm(`Delete “${collection.title}”? This cannot be undone.`)) return;
    try {
      await galleryApi.deleteCollection(collection._id);
      setCollections((items) => items.filter((item) => item._id !== collection._id));
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  };

  return (
    <div className="page-section page-top">
      <div className="section-heading">
        <div><p className="eyebrow">Your point of view</p><h1>My exhibitions</h1></div>
        <Link className="button primary" to="/collections/new">New exhibition</Link>
      </div>
      {loading ? <Loading /> : error ? <ErrorPanel message={error} /> : collections.length ? (
        <div className="collection-grid">
          {collections.map((collection) => (
            <article className="collection-card" key={collection._id}>
              <div className="collection-cover">
                {collection.items.slice(0, 3).map((item) => <img key={`${item.artwork.source}-${item.artwork.sourceId}`} src={item.artwork.thumbnailUrl || item.artwork.imageUrl} alt="" />)}
                {!collection.items.length && <span>Begin adding artworks</span>}
              </div>
              <div className="collection-card-copy">
                <div className="collection-card-meta"><span>{collection.items.length} works</span><span>{collection.isPublic ? "Public" : "Private"}</span></div>
                <h2>{collection.title}</h2>
                <p>{collection.description || "No description yet."}</p>
                <div className="card-actions">
                  <Link className="text-link" to={`/collections/${collection._id}/edit`}>Edit</Link>
                  {collection.isPublic && <Link className="text-link" to={`/exhibitions/${collection.slug}`}>View public page</Link>}
                  <button className="link-button danger" type="button" onClick={() => remove(collection)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="Curate your first exhibition" message="Create a collection, then add artworks from their detail pages." />}
    </div>
  );
};
