import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { galleryApi, getErrorMessage, toSnapshot } from "../api/client";
import type { Artwork, Collection } from "../types";
import { useAuth } from "../context/AuthContext";
import { ErrorPanel, Loading } from "../components/Status";
import { ArtworkViewer } from "../components/ArtworkViewer";

export const ArtworkPage = () => {
  const { source = "", id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError("");
    galleryApi.artwork(source, id).then(setArtwork).catch((reason) => setError(getErrorMessage(reason)));
  }, [source, id]);

  useEffect(() => {
    if (!user) return;
    galleryApi.collections().then((items) => {
      setCollections(items);
      if (items[0]) setSelectedCollection(items[0]._id);
    }).catch(() => undefined);
  }, [user]);

  const returnTo = (location.state as { from?: string } | null)?.from;
  const goBack = () => {
    if (returnTo) navigate(-1);
    else navigate("/explore");
  };

  const backButton = (
    <button className="detail-back-button" type="button" onClick={goBack}>
      <span aria-hidden="true">←</span> Back to {returnTo?.startsWith("/favorites") ? "favorites" : returnTo?.startsWith("/exhibitions") ? "exhibition" : "gallery"}
    </button>
  );

  if (error) return <div className="artwork-detail-page"><div className="detail-navigation">{backButton}</div><ErrorPanel message={error} /></div>;
  if (!artwork) return <div className="artwork-detail-page"><div className="detail-navigation">{backButton}</div><Loading label="Opening artwork…" /></div>;

  const saveFavorite = async () => {
    setSaving(true);
    setMessage("");
    try {
      await galleryApi.addFavorite(toSnapshot(artwork));
      setMessage("Added to your favorites.");
    } catch (reason) {
      setMessage(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  const addToCollection = async () => {
    const collection = collections.find((item) => item._id === selectedCollection);
    if (!collection) return;
    if (collection.items.some((item) => item.artwork.source === artwork.source && item.artwork.sourceId === artwork.sourceId)) {
      setMessage("This artwork is already in that exhibition.");
      return;
    }

    setSaving(true);
    try {
      const updated = await galleryApi.updateCollection(collection._id, {
        ...collection,
        items: [
          ...collection.items,
          { artwork: toSnapshot(artwork), curatorNote: "", position: collection.items.length },
        ],
      });
      setCollections((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setMessage(`Added to “${collection.title}.”`);
    } catch (reason) {
      setMessage(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="artwork-detail-page">
      <div className="detail-navigation">{backButton}</div>
      <article className="artwork-detail">
        <ArtworkViewer src={artwork.imageUrl} alt={artwork.title} />
      <div className="detail-copy">
        <p className="eyebrow">{artwork.museumName}</p>
        <h1>{artwork.title}</h1>
        <p className="artist-line">{artwork.artist}</p>
        <dl className="metadata-list">
          <div><dt>Date</dt><dd>{artwork.date}</dd></div>
          {artwork.medium && <div><dt>Medium</dt><dd>{artwork.medium}</dd></div>}
          {artwork.culture && <div><dt>Origin</dt><dd>{artwork.culture}</dd></div>}
          {artwork.department && <div><dt>Department</dt><dd>{artwork.department}</dd></div>}
          <div><dt>Image rights</dt><dd>{artwork.rights || (artwork.isPublicDomain ? "Public domain" : "See museum record")}</dd></div>
        </dl>
        {artwork.description && <p className="detail-description">{artwork.description}</p>}

        {user ? (
          <div className="detail-actions">
            <button className="button primary" type="button" onClick={saveFavorite} disabled={saving}>Save favorite</button>
            {collections.length ? (
              <div className="collection-picker">
                <label htmlFor="collection-select">Add to exhibition</label>
                <div>
                  <select id="collection-select" value={selectedCollection} onChange={(event) => setSelectedCollection(event.target.value)}>
                    {collections.map((collection) => <option value={collection._id} key={collection._id}>{collection.title}</option>)}
                  </select>
                  <button className="button secondary" type="button" onClick={addToCollection} disabled={saving}>Add</button>
                </div>
              </div>
            ) : (
              <Link className="button secondary" to="/collections/new">Create an exhibition</Link>
            )}
          </div>
        ) : (
          <p className="signin-callout"><Link to="/login">Sign in</Link> to save this work or add it to an exhibition.</p>
        )}
        {message && <p className="form-message" role="status">{message}</p>}

        <div className="source-credit">
          <p>{artwork.creditLine}</p>
          <a href={artwork.museumUrl} target="_blank" rel="noreferrer">View the official museum record ↗</a>
        </div>
      </div>
      </article>
    </div>
  );
};
