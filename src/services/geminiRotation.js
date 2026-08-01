export const DEFAULT_GEMINI_RETRYABLE_ERRORS = [
  'SERVER_OVERLOADED',
  'CONNECTION_ERROR',
  'NETWORK_ERROR',
  'REQUEST_TIMEOUT',
  'QUOTA_EXCEEDED',
  'API_KEY_INVALID',
];

const notify = (callback, ...args) => {
  try {
    callback?.(...args);
  } catch(error) {}
};

export const executeGeminiRotation = async ({
  invoke,
  keys = [],
  minimumAttempts = 1,
  onAttempt,
  onError,
  onSuccess,
  retryableErrors = DEFAULT_GEMINI_RETRYABLE_ERRORS,
  retryDelayMs = 700,
  rotate,
  validateResult,
}) => {
  if (!keys.length) throw new Error('API_KEY_MISSING');
  const retryable = new Set(retryableErrors);
  const maxAttempts = Math.max(keys.length, Math.min(3, Number(minimumAttempts) || 1));
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const keyIndex = attempt % keys.length;
    const key = keys[keyIndex];
    const attemptInfo = {
      attempt:attempt + 1,
      total:maxAttempts,
      keyIndex,
      keyLabel:key?.keyLabel || `Chave ${keyIndex + 1}/${keys.length}`,
    };
    try {
      notify(onAttempt, attemptInfo);
      const result = await invoke(key, attemptInfo);
      const validated = validateResult ? await validateResult(result, attemptInfo) : result;
      await Promise.resolve(rotate?.()).catch(() => {});
      notify(onSuccess, attemptInfo);
      return validated;
    } catch(error) {
      lastError = error;
      await Promise.resolve(rotate?.()).catch(() => {});
      notify(onError, error, attemptInfo);
      const canRetry = retryable.has(error?.message)
        && attempt + 1 < maxAttempts
        && !(keys.length === 1 && ['QUOTA_EXCEEDED', 'API_KEY_INVALID'].includes(error?.message));
      if (!canRetry) break;
      if (retryDelayMs > 0) {
        await new Promise(resolve => setTimeout(
          resolve,
          Math.min(2500, retryDelayMs * (attempt + 1)),
        ));
      }
    }
  }

  throw lastError || new Error('CONNECTION_ERROR');
};
