const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

export const appEnvironment = import.meta.env.VITE_APP_ENV || 'agora-2-dev';
export const isPrivate2Environment = appEnvironment !== 'production';

export const featureFlags = {
  todayHome: TRUE_VALUES.has(String(import.meta.env.VITE_FEATURE_TODAY_HOME || '').toLowerCase()),
  globalSearch: TRUE_VALUES.has(String(import.meta.env.VITE_FEATURE_GLOBAL_SEARCH || '').toLowerCase()),
  newNavigation: TRUE_VALUES.has(String(import.meta.env.VITE_FEATURE_NEW_NAVIGATION || '').toLowerCase()),
  localGeminiKeys: TRUE_VALUES.has(String(import.meta.env.VITE_FEATURE_LOCAL_GEMINI_KEYS || '').toLowerCase()),
};
