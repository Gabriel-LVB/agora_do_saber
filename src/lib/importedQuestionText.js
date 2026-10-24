const LIST_ITEM_RE = /^\s*(?:[-*•]\s+|\d{1,3}[.)]\s+|[A-H][.)]\s+)/i;
const STRUCTURED_LINE_RE = /^\s*(?:#{1,6}\s+|\[{1,2}\s*ALT\s*[:\-]?\s*[A-H]\s*\]{1,2}|(?:Aula|Alternativas)\s*:)/i;

const isStandaloneHeading = (line = '') => {
  const plain = String(line)
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/[*_`]/g, '')
    .trim();
  if (!plain || plain.length > 90 || /[.!?;,]$/.test(plain)) return false;
  const letters = plain.match(/[A-Za-zÀ-ÖØ-Þà-öø-ÿ]/g);
  if (!letters?.length) return false;
  return plain === plain.toLocaleUpperCase('pt-BR') && plain.split(/\s+/).length <= 12;
};

const isStructuralLine = (line = '') => (
  LIST_ITEM_RE.test(line)
  || STRUCTURED_LINE_RE.test(line)
  || isStandaloneHeading(line)
);

// PDFs e OCRs costumam inserir uma quebra a cada largura da página. No pacote
// importado, quebras simples dentro de prosa são apenas visuais; linhas em branco,
// títulos e itens de lista continuam sendo limites semânticos.
export const normalizeImportedQuestionText = (value = '') => {
  const lines = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.trim());

  const normalized = [];
  for (const line of lines) {
    if (!line) {
      if (normalized.length && normalized[normalized.length - 1] !== '') normalized.push('');
      continue;
    }

    const previous = normalized[normalized.length - 1];
    if (
      previous == null
      || previous === ''
      || isStructuralLine(previous)
      || isStructuralLine(line)
      || /<br\s*\/?>\s*$/i.test(previous)
    ) {
      normalized.push(line);
      continue;
    }

    normalized[normalized.length - 1] = `${previous} ${line}`.replace(/[ \t]{2,}/g, ' ');
  }

  while (normalized[0] === '') normalized.shift();
  while (normalized[normalized.length - 1] === '') normalized.pop();
  return normalized.join('\n');
};
