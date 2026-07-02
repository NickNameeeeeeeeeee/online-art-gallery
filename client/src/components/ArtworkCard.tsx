import { Link, useLocation } from "react-router-dom";
import type { Artwork, ArtworkSnapshot } from "../types";

type DisplayArtwork = Artwork | ArtworkSnapshot;

export const ArtworkCard = ({ artwork }: { artwork: DisplayArtwork }) => {
  const location = useLocation();
  const artworkPath = `/artworks/${artwork.source}/${artwork.sourceId}`;
  const navigationState = { from: `${location.pathname}${location.search}` };

  return (
    <article className="art-card">
      <Link to={artworkPath} state={navigationState} className="art-card-image-link">
        {artwork.thumbnailUrl || artwork.imageUrl ? (
          <img
            src={artwork.thumbnailUrl || artwork.imageUrl}
            alt={artwork.title}
            className="art-card-image"
            loading="lazy"
          />
        ) : (
          <div className="image-placeholder">Image unavailable</div>
        )}
      </Link>
      <div className="art-card-content">
        <p className="eyebrow">{artwork.museumName}</p>
        <h3><Link to={artworkPath} state={navigationState}>{artwork.title}</Link></h3>
        <p>{artwork.artist}</p>
        <p className="muted">{artwork.date}</p>
      </div>
    </article>
  );
};
