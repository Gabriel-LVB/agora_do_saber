const COURSE_SOURCE = 'curso';

const TIER_LABELS = Object.freeze({
  essential:'Essencial',
  complementary:'Complementar',
  reserve:'Reserva',
  disabled:'Inativa',
});

const finiteScore = value => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const getReviewCurationAudit = reviewItem => {
  const source = reviewItem?.source || reviewItem?.item?.source;
  if (source !== COURSE_SOURCE) return null;

  const questionHasPolicy = Object.prototype.hasOwnProperty.call(
    reviewItem?.question || {},
    'learningPolicy',
  );
  const policy = questionHasPolicy
    ? reviewItem.question.learningPolicy
    : reviewItem?.item?.learningPolicy;
  const awaitingCuration = !policy
    || policy.status === 'awaiting_curation'
    || policy.selectionSource === 'awaiting-curation';
  const qualityScore = finiteScore(policy?.qualityScore);

  if (awaitingCuration || qualityScore === null) {
    return { status:'unavailable' };
  }

  const importance = finiteScore(policy.importance);
  return {
    status:'curated',
    qualityScore,
    importance:importance !== null ? importance : null,
    tier:policy.tier || null,
    tierLabel:TIER_LABELS[policy.tier] || null,
  };
};
