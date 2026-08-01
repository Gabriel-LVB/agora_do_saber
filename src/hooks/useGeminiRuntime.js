import { useCallback } from 'react';

import { executeGeminiRotation } from '../services/geminiRotation.js';

export const useGeminiRuntime = ({
  callGemini,
  errorConfigs,
  getActiveGeminiKeyId,
  getConfiguredGeminiKeys,
  getGeminiThinkingBudget,
  normalizeGeminiKeys,
  saveSettings,
  settingsRef,
  setErrorModal,
  withGeminiKeys,
}) => {
  const getKey = useCallback(() => {
    const settings = settingsRef.current;
    const keys = getConfiguredGeminiKeys(settings);
    const activeId = getActiveGeminiKeyId(settings);
    return keys.find(item => item.id === activeId)?.k || keys[0]?.k || settings.apiKey1 || settings.apiKey;
  }, [getActiveGeminiKeyId, getConfiguredGeminiKeys, settingsRef]);

  const getGeminiOptions = useCallback((sourceSettings = settingsRef.current) => ({
    thinkingBudget:getGeminiThinkingBudget(!!sourceSettings.geminiThinkingEnabled),
  }), [getGeminiThinkingBudget, settingsRef]);

  const showApiError = useCallback((errCode, extra = '') => {
    const cfg = errorConfigs[errCode] || { title:'Erro Desconhecido', message:extra || 'Tente novamente.', link:null };
    setErrorModal({ title:cfg.title, message:cfg.message + (extra ? `\n${extra}` : ''), link:cfg.link, isAlert:true });
  }, [errorConfigs, setErrorModal]);

  const checkKey = useCallback(() => {
    if (!getKey()?.trim()) {
      showApiError('API_KEY_MISSING');
      return false;
    }
    return true;
  }, [getKey, showApiError]);

  const getOrderedKeys = useCallback(() => {
    const settings = settingsRef.current;
    const slots = getConfiguredGeminiKeys(settings);
    const activeId = getActiveGeminiKeyId(settings);
    const startIdx = Math.max(0, slots.findIndex(item => item.id === activeId));
    return [...slots.slice(startIdx), ...slots.slice(0, startIdx)];
  }, [getActiveGeminiKeyId, getConfiguredGeminiKeys, settingsRef]);

  const rotateKey = useCallback(async () => {
    const settings = settingsRef.current;
    const slots = getConfiguredGeminiKeys(settings);
    if (slots.length <= 1) return;
    const activeId = getActiveGeminiKeyId(settings);
    const curIdx = Math.max(0, slots.findIndex(item => item.id === activeId));
    const nextId = slots[(curIdx + 1) % slots.length].id;
    await saveSettings(withGeminiKeys(settings, normalizeGeminiKeys(settings), nextId));
  }, [
    getActiveGeminiKeyId,
    getConfiguredGeminiKeys,
    normalizeGeminiKeys,
    saveSettings,
    settingsRef,
    withGeminiKeys,
  ]);

  const callWithRotation = useCallback(async (prompt, sys, options = {}) => {
    const {
      keyCursorRef,
      keyPool,
      minimumAttempts = 1,
      onAttempt,
      onError,
      onSuccess,
      retryableErrors,
      retryDelayMs = 700,
      validateResult,
      ...geminiOptions
    } = options || {};
    const hasExternalPool = Array.isArray(keyPool);
    const externalKeys = hasExternalPool
      ? keyPool.map((entry, index) => ({
        ...entry,
        id:entry?.id || `pool-${index}`,
        k:String(entry?.k || entry?.value || '').trim(),
        keyLabel:entry?.keyLabel
          || (entry?.fingerprint ? `Chave ${entry.fingerprint}` : `Chave ${index + 1}/${keyPool.length}`),
      })).filter(entry => entry.k)
      : [];
    const configuredKeys = hasExternalPool ? externalKeys : getOrderedKeys();
    const fallbackKey = getKey();
    const baseKeys = configuredKeys.length
      ? configuredKeys
      : !hasExternalPool && fallbackKey
        ? [{ id:'fallback', k:fallbackKey }]
        : [];
    const startIndex = hasExternalPool && baseKeys.length
      ? Math.max(0, Number(keyCursorRef?.current) || 0) % baseKeys.length
      : 0;
    const orderedKeys = startIndex
      ? [...baseKeys.slice(startIndex), ...baseKeys.slice(0, startIndex)]
      : baseKeys;
    if (!orderedKeys.length) throw new Error('API_KEY_MISSING');
    return executeGeminiRotation({
      keys:orderedKeys,
      minimumAttempts,
      onAttempt,
      onError,
      onSuccess,
      retryableErrors,
      retryDelayMs,
      rotate:hasExternalPool ? undefined : rotateKey,
      validateResult,
      invoke:async ({ k }, attemptInfo) => {
        try {
          return await callGemini(prompt, sys, k, [], {
            ...getGeminiOptions(),
            ...geminiOptions,
          });
        } finally {
          if (hasExternalPool && keyCursorRef && baseKeys.length) {
            keyCursorRef.current = (startIndex + attemptInfo.attempt) % baseKeys.length;
          }
        }
      },
    });
  }, [callGemini, getGeminiOptions, getKey, getOrderedKeys, rotateKey]);

  return {
    callWithRotation,
    checkKey,
    getGeminiOptions,
    getKey,
    getOrderedKeys,
    rotateKey,
    showApiError,
  };
};
