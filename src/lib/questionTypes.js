export const isMemoryQuestionType = (type) => type === 'flashcard' || type === 'cloze';

export const normalizeQuestionTypesForGeneration = (types = ['direct']) => {
  const uniqueTypes = [...new Set((Array.isArray(types) ? types : []).filter(Boolean))];
  const memoryType = uniqueTypes.find(isMemoryQuestionType);
  if (memoryType) return [memoryType];
  return uniqueTypes.length ? uniqueTypes : ['direct'];
};

export const shouldGenerateHybridClinicalPass = (questionStyle, types = ['direct']) =>
  questionStyle === 'hybrid' && !normalizeQuestionTypesForGeneration(types).some(isMemoryQuestionType);

export const toggleQuestionTypeSelection = (selected = [], type, { single = false } = {}) => {
  if (single || isMemoryQuestionType(type)) return [type];

  const ordinaryTypes = (Array.isArray(selected) ? selected : []).filter(value => !isMemoryQuestionType(value));
  const next = ordinaryTypes.includes(type)
    ? ordinaryTypes.filter(value => value !== type)
    : [...ordinaryTypes, type];

  return next.length ? next : (ordinaryTypes.length ? ordinaryTypes : [type]);
};
