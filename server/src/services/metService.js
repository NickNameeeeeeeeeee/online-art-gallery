import { fetchJson } from "./fetchJson.js";
import { getCached, setCached } from "./cache.js";
import { HttpError } from "../utils/httpError.js";

const BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";

const normalizeMetObject = (object) => ({
  source: "met",
  sourceId: String(object.objectID),
  title: object.title || "Untitled",
  artist: object.artistDisplayName || object.artistDisplayBio || "Unknown artist",
  date: object.objectDate || "Date unknown",
  yearStart: Number.isFinite(object.objectBeginDate) ? object.objectBeginDate : null,
  yearEnd: Number.isFinite(object.objectEndDate) ? object.objectEndDate : null,
  medium: object.medium || "",
  culture: object.culture || object.country || "",
  department: object.department || "",
  description: object.objectName || "",
  imageUrl: object.primaryImage || object.primaryImageSmall || "",
  thumbnailUrl: object.primaryImageSmall || object.primaryImage || "",
  museumName: "The Metropolitan Museum of Art",
  museumUrl: object.objectURL || "https://www.metmuseum.org/art/collection",
  isPublicDomain: Boolean(object.isPublicDomain),
  creditLine: object.creditLine || "",
  rights: object.rightsAndReproduction || "",
});

export const getMetArtwork = async (id) => {
  const cacheKey = `met:detail:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const object = await fetchJson(`${BASE_URL}/objects/${encodeURIComponent(id)}`);
  if (!object?.objectID) throw new HttpError(404, "Artwork not found at The Met.");

  const artwork = normalizeMetObject(object);
  setCached(cacheKey, artwork, 24 * 60 * 60 * 1000);
  return artwork;
};

export const searchMet = async ({ query, page, limit, publicDomainOnly }) => {
  const cacheKey = `met:search:${query}:${page}:${limit}:${publicDomainOnly}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query || "art",
    hasImages: "true",
  });
  const search = await fetchJson(`${BASE_URL}/search?${params}`);
  const ids = search.objectIDs || [];
  const start = (page - 1) * limit;
  const pageIds = ids.slice(start, start + limit * 2);

  const settled = await Promise.allSettled(pageIds.map((id) => getMetArtwork(id)));
  const items = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((artwork) => artwork.imageUrl)
    .filter((artwork) => !publicDomainOnly || artwork.isPublicDomain)
    .slice(0, limit);

  const result = { items, total: search.total || 0 };
  setCached(cacheKey, result);
  return result;
};
