const cache = new Map();

export const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCached = (key, value, ttlMs = 10 * 60 * 1000) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });

  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};
