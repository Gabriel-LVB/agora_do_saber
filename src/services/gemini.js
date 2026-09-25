export const GEMINI_THINKING_BUDGET_OFF = 0;
export const GEMINI_THINKING_BUDGET_DYNAMIC = -1;

export const getGeminiThinkingBudget = (enabled) =>
  enabled ? GEMINI_THINKING_BUDGET_DYNAMIC : GEMINI_THINKING_BUDGET_OFF;

export const normalizeGeminiApiKey = (value = '') => String(value || '').trim();

const GEMINI_BACKEND_URL = String(import.meta.env?.VITE_GEMINI_BACKEND_URL || '').replace(/\/+$/, '');
const geminiBackendEnabled = () => GEMINI_BACKEND_URL.length > 0;
const DEFAULT_GEMINI_TIMEOUT_MS = 55000;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const resolveGeminiTimeout = (opts = {}, fallback = DEFAULT_GEMINI_TIMEOUT_MS) => {
  const requested = Number(opts.timeoutMs);
  return Number.isFinite(requested) && requested > 0 ? Math.min(requested, 180000) : fallback;
};

const getGeminiRequestHeaders = (apiKey) => ({
  'Content-Type':'application/json',
  'x-goog-api-key':normalizeGeminiApiKey(apiKey),
});

const isGemini3Model = (model = '') => String(model).startsWith('gemini-3');
const isThinkingEnabled = (opts = {}) =>
  Number(opts.thinkingBudget ?? GEMINI_THINKING_BUDGET_OFF) !== GEMINI_THINKING_BUDGET_OFF;

const getGeminiThinkingConfig = (model, opts = {}) => {
  if (!isGemini3Model(model)) {
    return { thinkingBudget:opts.thinkingBudget ?? GEMINI_THINKING_BUDGET_OFF };
  }
  return { thinkingLevel:isThinkingEnabled(opts) ? 'medium' : 'minimal' };
};

export const buildGeminiPayload = ({ prompt, systemPrompt, images = [], opts = {}, model = '' }) => {
  const parts = [{ text:prompt }];
  images.forEach(img => parts.push({ inline_data:{ mime_type:img.mimeType, data:img.base64 } }));
  return {
    contents:[{ parts }],
    systemInstruction:{ parts:[{ text:systemPrompt }] },
    generationConfig:{
      thinkingConfig:getGeminiThinkingConfig(model, opts),
      ...(opts.maxTokens ? { maxOutputTokens:opts.maxTokens } : {}),
      ...(opts.responseMimeType ? { responseMimeType:opts.responseMimeType } : {}),
      ...(opts.responseSchema ? { responseSchema:opts.responseSchema } : {}),
    },
  };
};

const callGeminiBackend = async ({ prompt, systemPrompt, images = [], opts = {} }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolveGeminiTimeout(opts));
  try {
    const response = await fetch(`${GEMINI_BACKEND_URL}/generate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(buildGeminiPayload({ prompt, systemPrompt, images, opts })),
      signal:controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) await throwGeminiResponseError(response);
    const data = await response.json();
    const text = data.text || data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
    if (!text) throw new Error('CONNECTION_ERROR');
    return text;
  } catch(error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') throw new Error('REQUEST_TIMEOUT');
    throw error;
  }
};

const throwGeminiResponseError = async (response) => {
  const data = await response.clone().json().catch(() => ({}));
  const apiError = data?.error || {};
  const reasons = (apiError.details || []).map(detail => detail?.reason).filter(Boolean);
  if (
    [401,403].includes(response.status)
    || ['UNAUTHENTICATED','PERMISSION_DENIED'].includes(apiError.status)
    || reasons.includes('API_KEY_INVALID')
  ) throw new Error('API_KEY_INVALID');
  if (response.status === 400) throw new Error('REQUEST_INVALID');
  if (response.status === 404) throw new Error('RESOURCE_NOT_FOUND');
  if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
  if ([500,503].includes(response.status)) throw new Error('SERVER_OVERLOADED');
  throw new Error('CONNECTION_ERROR');
};

const useGeminiResponse = async ({ prompt, systemPrompt, apiKey, images, opts, model, action='generateContent', timeoutMs=DEFAULT_GEMINI_TIMEOUT_MS }, consume) => {
  const payload = buildGeminiPayload({ prompt, systemPrompt, images, opts, model });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolveGeminiTimeout(opts, timeoutMs));
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`;
    const res = await fetch(url,{method:'POST',headers:getGeminiRequestHeaders(apiKey),body:JSON.stringify(payload),signal:controller.signal});
    if (!res.ok) await throwGeminiResponseError(res);
    return await consume(res);
  } catch(error) {
    if (error.name === 'AbortError') throw new Error('REQUEST_TIMEOUT');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const callGeminiModel = (params) => useGeminiResponse(params, async res => {
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) throw new Error('CONNECTION_ERROR');
  return text;
});

export const callGemini = async (prompt, systemPrompt, apiKey, images=[], opts={}) => {
  if (geminiBackendEnabled() && opts.backend !== false) {
    return callGeminiBackend({ prompt, systemPrompt, images, opts });
  }
  if (!normalizeGeminiApiKey(apiKey)) throw new Error('API_KEY_MISSING');
  return callGeminiModel({
    prompt,
    systemPrompt,
    apiKey,
    images,
    opts,
    model:GEMINI_MODEL,
  });
};

const callGeminiStreamModel = ({ onProgress, ...params }) => useGeminiResponse(
  { ...params, action:'streamGenerateContent?alt=sse', timeoutMs:120000 },
  async res => {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    let pending = '';
    const consumeLine = (line) => {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) return;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
        if (text) {
          full += text;
          onProgress?.(full, (full.match(/##\s*(?:Quest[aã]o|Flashcard)\s*\[?\d/gi) || []).length);
        }
      } catch {}
    };
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      pending += dec.decode(value,{stream:true});
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      lines.forEach(consumeLine);
    }
    if (pending.trim()) consumeLine(pending.trim());
    return full;
  },
);

export const callGeminiStream = async (prompt, systemPrompt, apiKey, onProgress, images=[], opts={}) => {
  if (!normalizeGeminiApiKey(apiKey)) throw new Error('API_KEY_MISSING');
  return callGeminiStreamModel({
    prompt,
    systemPrompt,
    apiKey,
    onProgress,
    images,
    opts,
    model:GEMINI_MODEL,
  });
};
