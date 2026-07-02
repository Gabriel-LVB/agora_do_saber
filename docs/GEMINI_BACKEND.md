# Backend Gemini

O frontend ja aceita um backend opcional para chamadas Gemini nao-stream.

Importante: no modelo atual do Agora, cada usuario pode informar a propria chave gratis do Gemini. Se `VITE_GEMINI_BACKEND_URL` for configurado hoje, as chamadas nao-stream passam a ir para o backend sem enviar a chave do usuario; portanto esse modo presume uma chave do projeto/site no servidor.

## Variavel

Configure no deploy:

```bash
VITE_GEMINI_BACKEND_URL=https://SEU_BACKEND
```

Quando vazia, o app continua usando o modo cliente atual com `x-goog-api-key` fornecida pelo usuario.

## Endpoint esperado

`POST /generate`

Body recebido do frontend:

```json
{
  "contents": [{ "parts": [{ "text": "prompt" }] }],
  "systemInstruction": { "parts": [{ "text": "system prompt" }] },
  "generationConfig": {
    "thinkingConfig": { "thinkingBudget": 0 },
    "maxOutputTokens": 12000
  }
}
```

Resposta aceita:

```json
{ "text": "resposta do Gemini" }
```

O backend tambem pode devolver o formato bruto do Gemini (`candidates[0].content.parts`).

## Modelos possiveis

1. Chave do site no backend: melhor seguranca operacional, rate limit centralizado e nenhuma chave Gemini no navegador. Exige custo/quota do dono do site.
2. Chave gratis por usuario no cliente: e o modo atual. Mantem custo individual, mas a chave fica no navegador do proprio usuario e a seguranca depende de nao salvar segredo sensivel em texto puro fora do dispositivo.
3. Chave por usuario via backend: o usuario ainda usa a propria key, mas o backend valida login, aplica rate limit e chama Gemini. Para isso, a chave deve ser enviada por HTTPS a cada chamada ou guardada em cofre/criptografada; nao basta ligar `VITE_GEMINI_BACKEND_URL` do jeito atual.

## Requisitos de seguranca para o modelo com chave do site

- A chave Gemini deve ficar somente no backend.
- O backend deve validar Firebase Auth ID token antes de chamar Gemini.
- O backend deve aplicar allowlist/admin ou rate limit por usuario.
- O frontend nao deve enviar chave Gemini para esse endpoint.

## Ainda pendente

As rotas de streaming (`callGeminiStream`) continuam no modo cliente ate existir um endpoint SSE equivalente.

Se a decisao for preservar chaves gratis por usuario, a pendencia correta nao e "remover todas as chaves do cliente" imediatamente; e criar um backend de proxy/cofre por usuario, com consentimento claro, HTTPS, limite por conta e migracao gradual das chamadas.
