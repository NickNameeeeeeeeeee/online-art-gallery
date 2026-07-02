import type { Artwork, ArtworkSnapshot } from "../types";
import { ArtworkCard } from "./ArtworkCard";

export const ArtworkGrid = ({ artworks }: { artworks: Array<Artwork | ArtworkSnapshot> }) => (
  <div className="art-grid">
    {artworks.map((artwork) => (
      <ArtworkCard key={`${artwork.source}-${artwork.sourceId}`} artwork={artwork} />
    ))}
  </div>
);
