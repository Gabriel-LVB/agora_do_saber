const LOWERCASE_A_GRAMMATICAL_CONTINUATIONS = new Set([
  'algo', 'aquela', 'aquelas', 'aquele', 'aqueles',
  'curto', 'essa', 'essas', 'esse', 'esses',
  'esta', 'estas', 'este', 'estes', 'favor',
  'longo', 'o', 'os', 'qual', 'quais', 'que',
  'respeito', 'uma', 'umas', 'um', 'uns',
]);

const isLowercaseAPreposition = ({ match, open, storedLetter, close, offset, source }) => {
  if (storedLetter !== 'a' || open || close) return false;

  const continuation = String(source || '').slice(offset + match.length);
  const nextWord = continuation.match(/^\s+([a-zà-ÿ]+(?:-se)?)/i)?.[1]?.toLowerCase();
  if (!nextWord) return false;

  // Depois de "a", um infinitivo ou um complemento nominal indica a
  // preposição do português, não o rótulo da alternativa A.
  return /(?:ar|er|ir)(?:-se)?$/.test(nextWord)
    || nextWord === 'pôr'
    || LOWERCASE_A_GRAMMATICAL_CONTINUATIONS.has(nextWord);
};

const referenceGroupReplacer = letter => (
  (match, prefix, open = '', storedLetter, close = '', offset, source) => {
    if (isLowercaseAPreposition({ match, open, storedLetter, close, offset, source })) return match;
    return `${prefix}${open}${letter}${close}`;
  }
);

// Referências que declaram explicitamente qual é a resposta correta. Estas
// expressões são seguras também na explicação geral da questão: a letra deve
// acompanhar a alternativa correta depois do embaralhamento.
export const DECLARED_CORRECT_ALTERNATIVE_REFERENCE_PATTERNS = [
  /\b((?:(?:a|o)\s+)?(?:alternativa|op[cç][aã]o|resposta)\s+correta\s*(?:(?:é|e)\s+|[:\-–—]\s*)?(?:a\s+)?(?:(?:alternativa|op[cç][aã]o|letra)\s+)?)(\*{0,2})([A-H])(\*{0,2})(?=\b)/gi,
  /\b((?:o\s+)?gabarito(?:\s+(?:correto|oficial))?\s*(?:(?:é|e)\s+|[:\-–—]\s*)(?:a\s+)?)(\*{0,2})([A-H])(\*{0,2})(?=\b)/gi,
];

// Referências locais usadas na análise de uma alternativa. Além das declarações
// acima, aqui é correto ajustar "alternativa A", "opção B" ou "letra C" para a
// letra atualmente exibida daquela própria opção.
export const DISPLAYED_ALTERNATIVE_REFERENCE_PATTERNS = [
  ...DECLARED_CORRECT_ALTERNATIVE_REFERENCE_PATTERNS,
  /\b((?:a\s+)?(?:alternativa|op[cç][aã]o|letra)\s+)(\*{0,2})([A-H])(\*{0,2})(?=\b)/gi,
];

const normalizeAlternativeReferences = (text = '', displayLetter = '', patterns = []) => {
  const letter = String(displayLetter || '').trim().toUpperCase();
  if (!letter) return String(text || '');
  return patterns.reduce(
    (result, pattern) => result.replace(pattern, referenceGroupReplacer(letter)),
    String(text || ''),
  );
};

export const normalizeDisplayedAlternativeReferences = (text = '', displayLetter = '') => (
  normalizeAlternativeReferences(text, displayLetter, DISPLAYED_ALTERNATIVE_REFERENCE_PATTERNS)
);

export const normalizeDeclaredCorrectAlternativeReferences = (text = '', correctLetter = '') => (
  normalizeAlternativeReferences(text, correctLetter, DECLARED_CORRECT_ALTERNATIVE_REFERENCE_PATTERNS)
);
