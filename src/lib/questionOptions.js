import {
  normalizeDeclaredCorrectAlternativeReferences,
  normalizeDisplayedAlternativeReferences,
} from './questionExplanation.js';

export const QUESTION_OPTION_SHUFFLE_VERSION = 'agora-deterministic-options-v1';

const DISPLAY_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const legacyDisplayCache = new WeakMap();

const seedFrom = value => String(value || '')
  .split('')
  .reduce((seed, character) => seed + character.charCodeAt(0), 0);

const seededShuffle = (items, seed) => {
  const shuffled = [...items];
  let state = seed;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    const target = Math.abs(state) % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

export const shuffleQuestionOptions = (question = {}, seedValue = question?.id) => {
  const options = Array.isArray(question?.options) ? question.options : [];
  if (options.length < 2 || options.length > DISPLAY_LETTERS.length) return question;
  if (question.optionShuffleVersion === QUESTION_OPTION_SHUFFLE_VERSION) return question;

  const correctOptions = options.filter(option => option?.isCorrect === true);
  if (correctOptions.length !== 1) return question;

  const seed = seedFrom(seedValue || question.statement);
  const sourceAlternatives = question.explanationParts?.alternatives || {};
  const payloads = options.map((option, index) => {
    const originalLetter = String(option.originalLetter || option.letter || DISPLAY_LETTERS[index] || '')
      .trim()
      .toUpperCase();
    return {
      ...option,
      originalLetter,
      explanation:String(
        option.explanation
        || sourceAlternatives[originalLetter]
        || sourceAlternatives[String(option.letter || '').trim().toUpperCase()]
        || ''
      ),
    };
  });
  const correctOption = payloads.find(option => option.isCorrect);
  const distractors = seededShuffle(payloads.filter(option => !option.isCorrect), seed);
  const correctPosition = Math.abs(seed * 2654435761) % payloads.length;
  const ordered = [...distractors];
  ordered.splice(correctPosition, 0, correctOption);

  const shuffledOptions = ordered.map((option, index) => {
    const letter = DISPLAY_LETTERS[index];
    return {
      ...option,
      letter,
      explanation:normalizeDisplayedAlternativeReferences(option.explanation, letter),
    };
  });
  const correctLetter = shuffledOptions.find(option => option.isCorrect)?.letter || '';
  const explanation = normalizeDeclaredCorrectAlternativeReferences(question.explanation, correctLetter);
  const explanationParts = question.explanationParts
    ? {
      ...question.explanationParts,
      lesson:normalizeDeclaredCorrectAlternativeReferences(
        question.explanationParts.lesson || explanation,
        correctLetter,
      ),
      alternatives:Object.fromEntries(
        shuffledOptions
          .filter(option => option.explanation)
          .map(option => [option.letter, option.explanation]),
      ),
    }
    : question.explanationParts;

  return {
    ...question,
    options:shuffledOptions,
    explanation,
    ...(question.explanationParts ? { explanationParts } : {}),
    optionShuffleVersion:QUESTION_OPTION_SHUFFLE_VERSION,
  };
};

export const legacyImportedQuestionForDisplay = (question = {}) => {
  if (question.libraryQuestionKind !== 'old_exam' || question.optionShuffleVersion) return question;
  if (!legacyDisplayCache.has(question)) legacyDisplayCache.set(question, shuffleQuestionOptions(question, question.id));
  return legacyDisplayCache.get(question);
};

export const mapStoredQuestionAnswerToDisplay = (storedQuestion, displayQuestion, answer) => {
  if (storedQuestion === displayQuestion || typeof answer !== 'string') return answer;
  const storedOption = (storedQuestion?.options || []).find(option => option.letter === answer);
  if (!storedOption) return answer;
  const originalLetter = String(storedOption.originalLetter || storedOption.letter || '').toUpperCase();
  return (displayQuestion?.options || []).find(option => option.originalLetter === originalLetter)?.letter || answer;
};

export const mapDisplayedQuestionAnswerToStorage = (storedQuestion, displayQuestion, answer) => {
  if (storedQuestion === displayQuestion || typeof answer !== 'string') return answer;
  const displayOption = (displayQuestion?.options || []).find(option => option.letter === answer);
  if (!displayOption) return answer;
  const originalLetter = String(displayOption.originalLetter || '').toUpperCase();
  return (storedQuestion?.options || []).find((option, index) => (
    String(option.originalLetter || option.letter || DISPLAY_LETTERS[index] || '').toUpperCase() === originalLetter
  ))?.letter || answer;
};

export const legacyImportedAnswerAdapter = (storedQuestion, displayQuestion, storedAnswer, onStoredAnswer) => ({
  selectedLetter:mapStoredQuestionAnswerToDisplay(storedQuestion, displayQuestion, storedAnswer),
  onAnswer:answer => onStoredAnswer?.(
    mapDisplayedQuestionAnswerToStorage(storedQuestion, displayQuestion, answer)
  ),
});
