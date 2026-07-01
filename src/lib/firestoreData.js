export const cleanFirestoreData = (value) => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => {
    const clean = cleanFirestoreData(item);
    return clean === undefined ? null : clean;
  });
  const out = {};
  Object.entries(value).forEach(([key, item]) => {
    const clean = cleanFirestoreData(item);
    if (clean !== undefined) out[key] = clean;
  });
  return out;
};
