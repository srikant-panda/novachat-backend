const cache = new Map();

export const setCache = (key, value, ttlms) => {
  console.log("SETTING:", key, value);
  cache.set(key, {
    value: value,
    expiresAt: Date.now() + ttlms,
  });
  setTimeout(() => {
    cache.delete(key);
  }, ttlms);
};

export const getCache = (key) => {
  const result = cache.get(key);
  if (!result) {
    return null;
  }
  console.log("GETTING:", key, result);
  if (Date.now() >= result.expiresAt) {
    cache.delete(key);
    return null;
  }
  return result.value;
};

export const deleteCache = (key) => {
  cache.delete(key);
  return true;
};
