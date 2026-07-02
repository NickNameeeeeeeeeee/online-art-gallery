import { HttpError } from "../utils/httpError.js";

export const fetchJson = async (url, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OnlineArtGallery/1.0 (educational project)" },
    });

    if (!response.ok) {
      throw new HttpError(502, `Museum service returned ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpError(504, "The museum service took too long to respond.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
