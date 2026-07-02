import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Collection } from "../types";
import { ErrorPanel, Loading } from "../components/Status";

export const PublicCollectionPage = () => {
  const { slug = "" } = useParams();
  const location = useLocation();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    galleryApi.publicCollection(slug).then(setCollection).catch((reason) => setError(getErrorMessage(reason)));
  }, [slug]);

  if (error) return <div className="page-section page-top"><ErrorPanel message={error} /></div>;
  if (!collection) return <Loading label="Entering the exhibition…" />;

  return (
    <article className="public-exhibition">
      <header className="exhibition-hero">
        <p className="eyebrow">A virtual exhibition curated by {collection.ownerName}</p>
        <h1>{collection.title}</h1>
        {collection.description && <p>{collection.description}</p>}
      </header>
      <ol className="exhibition-sequence">
        {[...collection.items].sort((a, b) => a.position - b.position).map((item, index) => (
          <li className="exhibition-work" key={`${item.artwork.source}-${item.artwork.sourceId}`}>
            <div className="exhibition-number">{String(index + 1).padStart(2, "0")}</div>
            <img src={item.artwork.imageUrl || item.artwork.thumbnailUrl} alt={item.artwork.title} />
            <div>
              <p className="eyebrow">{item.artwork.museumName}</p>
              <h2><Link to={`/artworks/${item.artwork.source}/${item.artwork.sourceId}`} state={{ from: `${location.pathname}${location.search}` }}>{item.artwork.title}</Link></h2>
              <p className="artist-line">{item.artwork.artist}, {item.artwork.date}</p>
              {item.curatorNote && <p className="curator-note">{item.curatorNote}</p>}
              <p className="source-credit">{item.artwork.creditLine}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
};
