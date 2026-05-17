const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const readStorageText = (key, fallback = '') => {
  try {
    if (!canUseStorage()) return fallback;
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch(e) {
    return fallback;
  }
};

export const writeStorageText = (key, value) => {
  try {
    if (!canUseStorage()) return false;
    window.localStorage.setItem(key, String(value));
    return true;
  } catch(e) {
    return false;
  }
};

export const readStorageJson = (key, fallback = null) => {
  const raw = readStorageText(key, '');
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch(e) {
    return fallback;
  }
};

export const writeStorageJson = (key, value) => writeStorageText(key, JSON.stringify(value));

export const removeStorageItem = (key) => {
  try {
    if (!canUseStorage()) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch(e) {
    return false;
  }
};
