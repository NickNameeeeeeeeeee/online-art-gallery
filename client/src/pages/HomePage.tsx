import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Artwork } from "../types";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { ErrorPanel, Loading } from "../components/Status";

export const HomePage = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    galleryApi.featured().then(setArtworks).catch((reason) => setError(getErrorMessage(reason)));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A museum without walls</p>
          <h1>Extraordinary art, wherever you are.</h1>
          <p className="hero-lead">
            Explore works from The Metropolitan Museum of Art and the Art Institute of Chicago,
            then assemble your own virtual exhibition.
          </p>
          <form
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/explore?query=${encodeURIComponent(query || "art")}`);
            }}
          >
            <label className="sr-only" htmlFor="home-search">Search artworks</label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Monet, sculpture, Japan…"
            />
            <button className="button primary" type="submit">Explore</button>
          </form>
        </div>
        <div className="hero-frame" aria-hidden="true">
          {artworks[0]?.imageUrl ? <img src={artworks[0].imageUrl} alt="" /> : <div className="hero-placeholder" />}
          <span className="frame-label">Selected from open museum collections</span>
        </div>
      </section>

      <section className="page-section intro-section">
        <div>
          <p className="eyebrow">Two collections, one experience</p>
          <h2>Look closely. Follow your curiosity.</h2>
        </div>
        <p>
          Search across museums through one consistent interface. Every artwork retains its museum,
          credit line, and rights information so that discovery never loses context.
        </p>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured works</p>
            <h2>A place to begin</h2>
          </div>
          <Link className="text-link" to="/explore">View the full gallery →</Link>
        </div>
        {error ? <ErrorPanel message={error} /> : artworks.length ? <ArtworkGrid artworks={artworks.slice(0, 8)} /> : <Loading />}
      </section>

      <section className="curate-banner">
        <div>
          <p className="eyebrow">Become the curator</p>
          <h2>Build a story with art.</h2>
          <p>Save favorites, arrange works in sequence, add curator notes, and publish a shareable exhibition.</p>
        </div>
        <Link className="button light" to="/collections">Create an exhibition</Link>
      </section>
    </>
  );
};
