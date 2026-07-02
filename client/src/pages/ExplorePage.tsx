import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Artwork } from "../types";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { EmptyState, ErrorPanel, Loading } from "../components/Status";

export const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const query = searchParams.get("query") || "art";
  const source = (searchParams.get("source") || "all") as "all" | "met" | "artic";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const publicDomain = searchParams.get("publicDomain") === "true";

  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => setDraftQuery(query), [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    galleryApi
      .search({ query, source, page, limit: 16, publicDomain })
      .then((response) => {
        if (!active) return;
        setArtworks(response.data);
        setWarnings(response.meta?.warnings || []);
      })
      .catch((reason) => active && setError(getErrorMessage(reason)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, source, page, publicDomain]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  return (
    <div className="page-section page-top">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Unified museum search</p>
          <h1>Explore the collection</h1>
        </div>
        <p>Discover paintings, sculpture, textiles, decorative arts, and more.</p>
      </div>

      <form
        className="filter-panel"
        onSubmit={(event) => {
          event.preventDefault();
          update({ query: draftQuery || "art", page: "1" });
        }}
      >
        <div className="field grow">
          <label htmlFor="art-search">Search</label>
          <input id="art-search" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="museum-source">Museum</label>
          <select id="museum-source" value={source} onChange={(event) => update({ source: event.target.value, page: "1" })}>
            <option value="all">All museums</option>
            <option value="met">The Met</option>
            <option value="artic">Art Institute of Chicago</option>
          </select>
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={publicDomain}
            onChange={(event) => update({ publicDomain: event.target.checked ? "true" : "", page: "1" })}
          />
          Public-domain works only
        </label>
        <button className="button primary" type="submit">Search</button>
      </form>

      {warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorPanel message={error} />
      ) : artworks.length ? (
        <>
          <ArtworkGrid artworks={artworks} />
          <nav className="pagination" aria-label="Search result pages">
            <button className="button secondary" disabled={page === 1} onClick={() => update({ page: String(page - 1) })}>
              Previous
            </button>
            <span>Page {page}</span>
            <button className="button secondary" disabled={artworks.length < 16} onClick={() => update({ page: String(page + 1) })}>
              Next
            </button>
          </nav>
        </>
      ) : (
        <EmptyState title="No artworks found" message="Try a broader artist, style, period, or medium." />
      )}
    </div>
  );
};
