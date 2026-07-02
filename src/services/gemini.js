export const GEMINI_THINKING_BUDGET_OFF = 0;
export const GEMINI_THINKING_BUDGET_DYNAMIC = -1;

export const getGeminiThinkingBudget = (enabled) =>
  enabled ? GEMINI_THINKING_BUDGET_DYNAMIC : GEMINI_THINKING_BUDGET_OFF;

export const normalizeGeminiApiKey = (value = '') => String(value || '').trim();

const GEMINI_BACKEND_URL = String(import.meta.env?.VITE_GEMINI_BACKEND_URL || '').replace(/\/+$/, '');
const geminiBackendEnabled = () => GEMINI_BACKEND_URL.length > 0;

const getGeminiRequestHeaders = (apiKey) => ({
  'Content-Type':'application/json',
  'x-goog-api-key':normalizeGeminiApiKey(apiKey),
});

const buildGeminiPayload = ({ prompt, systemPrompt, images = [], opts = {} }) => {
  const parts = [{ text:prompt }];
  images.forEach(img => parts.push({ inline_data:{ mime_type:img.mimeType, data:img.base64 } }));
  return {
    contents:[{ parts }],
    systemInstruction:{ parts:[{ text:systemPrompt }] },
    generationConfig:{
      thinkingConfig:{ thinkingBudget:opts.thinkingBudget ?? opts.thinking ?? GEMINI_THINKING_BUDGET_OFF },
      ...(opts.maxTokens ? { maxOutputTokens:opts.maxTokens } : {}),
    },
  };
};

const callGeminiBackend = async ({ prompt, systemPrompt, images = [], opts = {} }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
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
    if (error.name === 'AbortError') throw new Error('CONNECTION_ERROR');
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

export const callGemini = async (prompt, systemPrompt, apiKey, images=[], opts={}) => {
  if (geminiBackendEnabled() && opts.backend !== false) {
    return callGeminiBackend({ prompt, systemPrompt, images, opts });
  }
  if (!normalizeGeminiApiKey(apiKey)) throw new Error('API_KEY_MISSING');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const payload = buildGeminiPayload({ prompt, systemPrompt, images, opts });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(url,{method:'POST',headers:getGeminiRequestHeaders(apiKey),body:JSON.stringify(payload),signal:controller.signal});
    clearTimeout(timeout);
    if (!res.ok) await throwGeminiResponseError(res);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
    if (!text) throw new Error('CONNECTION_ERROR');
    return text;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('CONNECTION_ERROR');
    throw e;
  }
};

export const callGeminiStream = async (prompt, systemPrompt, apiKey, onProgress, images=[], opts={}) => {
  if (!normalizeGeminiApiKey(apiKey)) throw new Error('API_KEY_MISSING');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';
  const parts = [{text:prompt}];
  images.forEach(img => parts.push({inline_data:{mime_type:img.mimeType,data:img.base64}}));
  const payload = {
    contents:[{parts}],
    systemInstruction:{parts:[{text:systemPrompt}]},
    generationConfig:{
      thinkingConfig:{ thinkingBudget: opts.thinkingBudget ?? opts.thinking ?? GEMINI_THINKING_BUDGET_OFF },
      ...(opts.maxTokens ? {maxOutputTokens:opts.maxTokens} : {}),
    },
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(url,{method:'POST',headers:getGeminiRequestHeaders(apiKey),body:JSON.stringify(payload),signal:controller.signal});
    if (!res.ok) await throwGeminiResponseError(res);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    let pending = '';
    const consumeLine = (line) => {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) return;
      try {
        const j = JSON.parse(line.slice(6));
        const t = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
        if (t) {
          full += t;
          onProgress?.(full, (full.match(/##\s*(?:Quest[aã]o|Flashcard)\s*\[?\d/gi) || []).length);
        }
      } catch(e) {}
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
    clearTimeout(timeout);
    return full;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('CONNECTION_ERROR');
    throw e;
  }
};
