import { useCallback } from 'react';

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

  const callWithRotation = useCallback(async (prompt, sys) => {
    const orderedKeys = getOrderedKeys();
    let lastErr;
    for (const { k } of orderedKeys) {
      try {
        const result = await callGemini(prompt, sys, k, [], getGeminiOptions());
        await rotateKey();
        return result;
      } catch(error) {
        lastErr = error;
        await rotateKey();
        throw error;
      }
    }
    throw lastErr;
  }, [callGemini, getGeminiOptions, getOrderedKeys, rotateKey]);

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
