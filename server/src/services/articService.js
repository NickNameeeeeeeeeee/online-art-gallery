import { fetchJson } from "./fetchJson.js";
import { getCached, setCached } from "./cache.js";
import { HttpError } from "../utils/httpError.js";

const BASE_URL = "https://api.artic.edu/api/v1";
const FIELDS = [
  "id",
  "title",
  "image_id",
  "artist_display",
  "artist_title",
  "date_display",
  "date_start",
  "date_end",
  "medium_display",
  "place_of_origin",
  "description",
  "short_description",
  "credit_line",
  "is_public_domain",
  "department_title",
  "api_link",
].join(",");

const plainText = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const normalizeArticObject = (object, iiifUrl = "https://www.artic.edu/iiif/2") => ({
  source: "artic",
  sourceId: String(object.id),
  title: object.title || "Untitled",
  artist: object.artist_title || object.artist_display || "Unknown artist",
  date: object.date_display || "Date unknown",
  yearStart: Number.isFinite(object.date_start) ? object.date_start : null,
  yearEnd: Number.isFinite(object.date_end) ? object.date_end : null,
  medium: object.medium_display || "",
  culture: object.place_of_origin || "",
  department: object.department_title || "",
  description: plainText(object.short_description || object.description || ""),
  imageUrl: object.image_id ? `${iiifUrl}/${object.image_id}/full/1686,/0/default.jpg` : "",
  thumbnailUrl: object.image_id ? `${iiifUrl}/${object.image_id}/full/600,/0/default.jpg` : "",
  museumName: "Art Institute of Chicago",
  museumUrl: `https://www.artic.edu/artworks/${object.id}`,
  isPublicDomain: Boolean(object.is_public_domain),
  creditLine: object.credit_line || "",
  rights: object.is_public_domain ? "Public domain" : "See museum record for usage rights",
});

export const getArticArtwork = async (id) => {
  const cacheKey = `artic:detail:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const payload = await fetchJson(`${BASE_URL}/artworks/${encodeURIComponent(id)}?fields=${FIELDS}`);
  if (!payload?.data?.id) throw new HttpError(404, "Artwork not found at the Art Institute of Chicago.");

  const artwork = normalizeArticObject(payload.data, payload.config?.iiif_url);
  setCached(cacheKey, artwork, 24 * 60 * 60 * 1000);
  return artwork;
};

export const searchArtic = async ({ query, page, limit, publicDomainOnly }) => {
  const cacheKey = `artic:search:${query}:${page}:${limit}:${publicDomainOnly}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query || "art",
    page: String(page),
    limit: String(limit),
    fields: FIELDS,
  });

  if (publicDomainOnly) params.set("query[term][is_public_domain]", "true");

  const payload = await fetchJson(`${BASE_URL}/artworks/search?${params}`);
  let items = (payload.data || [])
    .map((object) => normalizeArticObject(object, payload.config?.iiif_url))
    .filter((artwork) => artwork.imageUrl);

  if (publicDomainOnly) items = items.filter((artwork) => artwork.isPublicDomain);

  const result = { items, total: payload.pagination?.total || items.length };
  setCached(cacheKey, result);
  return result;
};
