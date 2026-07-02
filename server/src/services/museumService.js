import { searchMet, getMetArtwork } from "./metService.js";
import { searchArtic, getArticArtwork } from "./articService.js";
import { HttpError } from "../utils/httpError.js";
import { getCached, setCached } from "./cache.js";

const interleave = (left, right) => {
  const result = [];
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index]) result.push(left[index]);
    if (right[index]) result.push(right[index]);
  }
  return result;
};

export const searchArtworks = async ({ query, source, page, limit, publicDomainOnly }) => {
  if (source === "met") {
    return { ...(await searchMet({ query, page, limit, publicDomainOnly })), warnings: [] };
  }
  if (source === "artic") {
    return { ...(await searchArtic({ query, page, limit, publicDomainOnly })), warnings: [] };
  }

  const eachLimit = Math.max(4, Math.ceil(limit / 2));
  const results = await Promise.allSettled([
    searchMet({ query, page, limit: eachLimit, publicDomainOnly }),
    searchArtic({ query, page, limit: eachLimit, publicDomainOnly }),
  ]);

  const metResult = results[0].status === "fulfilled" ? results[0].value : { items: [], total: 0 };
  const articResult = results[1].status === "fulfilled" ? results[1].value : { items: [], total: 0 };
  const warnings = results
    .map((result, index) =>
      result.status === "rejected"
        ? `${index === 0 ? "The Met" : "Art Institute of Chicago"} is temporarily unavailable.`
        : null
    )
    .filter(Boolean);

  if (!metResult.items.length && !articResult.items.length && warnings.length === 2) {
    throw new HttpError(502, "Both museum services are temporarily unavailable.");
  }

  return {
    items: interleave(metResult.items, articResult.items).slice(0, limit),
    total: metResult.total + articResult.total,
    warnings,
  };
};

export const getArtwork = async (source, id) => {
  if (source === "met") return getMetArtwork(id);
  if (source === "artic") return getArticArtwork(id);
  throw new HttpError(400, "Unknown museum source.");
};

export const getFeaturedArtworks = async () => {
  const cacheKey = "featured:v1";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = await searchArtworks({
    query: "impressionism",
    source: "all",
    page: 1,
    limit: 10,
    publicDomainOnly: true,
  });

  setCached(cacheKey, result.items, 12 * 60 * 60 * 1000);
  return result.items;
};
