import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';

export const FSRS_SCHEDULER_VERSION = 'ts-fsrs-5.4.1-fsrs6-active-v1';
export const FSRS_PARAMETERS = Object.freeze({
  request_retention:0.9,
  maximum_interval:36500,
  enable_fuzz:false,
  enable_short_term:false,
});

const scheduler = fsrs(FSRS_PARAMETERS);

const toTimestamp = value => {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const serializeCard = card => ({
  ...card,
  due:toTimestamp(card.due),
  last_review:toTimestamp(card.last_review),
});

const hydrateCard = card => ({
  ...card,
  due:new Date(Number(card.due)),
  ...(card.last_review != null ? { last_review:new Date(Number(card.last_review)) } : {}),
});

const serializeLog = log => ({
  ...log,
  due:toTimestamp(log.due),
  review:toTimestamp(log.review),
});

const ratingForOutcome = correct => correct ? Rating.Good : Rating.Again;

const compareDueDates = (legacyDue, fsrsDue) => {
  const legacy = Number(legacyDue);
  const nextDue = Number(fsrsDue);
  if (!Number.isFinite(legacy) || !Number.isFinite(nextDue)) return null;
  return {
    deltaDays:Math.round((nextDue - legacy) / 86400000 * 10) / 10,
    legacyDue:legacy,
    fsrsDue:nextDue,
  };
};

export const advanceFsrsCard = ({ previous = null, correct, legacyDue = null, now = Date.now() }) => {
  const reviewDate = new Date(now);
  const hasCard = previous?.card && Number.isFinite(Number(previous.card.due));
  const card = hasCard ? hydrateCard(previous.card) : createEmptyCard(reviewDate);
  const rating = ratingForOutcome(correct);
  const result = scheduler.next(card, reviewDate, rating);
  const serializedCard = serializeCard(result.card);
  const comparison = compareDueDates(legacyDue, serializedCard.due);
  const previousMetrics = previous?.metrics || {};
  const responses = (Number(previousMetrics.responses) || 0) + (comparison ? 1 : 0);
  const deltaDaysTotal = (Number(previousMetrics.deltaDaysTotal) || 0) + (comparison?.deltaDays || 0);
  return {
    mode:'active',
    version:FSRS_SCHEDULER_VERSION,
    parameterProfile:'default-r90-day-level-v1',
    baseline:hasCard ? (previous.baseline || 'first-observed-review') : 'first-observed-review',
    input:correct ? 'good' : 'again',
    rating,
    calculatedAt:now,
    nextDue:serializedCard.due,
    intervalDays:Number(result.card.scheduled_days) || 0,
    card:serializedCard,
    lastLog:serializeLog(result.log),
    lastComparison:comparison,
    metrics:{
      responses,
      earlier:(Number(previousMetrics.earlier) || 0) + (comparison?.deltaDays < -0.05 ? 1 : 0),
      same:(Number(previousMetrics.same) || 0) + (comparison && Math.abs(comparison.deltaDays) <= 0.05 ? 1 : 0),
      later:(Number(previousMetrics.later) || 0) + (comparison?.deltaDays > 0.05 ? 1 : 0),
      deltaDaysTotal:Math.round(deltaDaysTotal * 10) / 10,
    },
  };
};

export const compareFsrsWithLegacy = ({ legacyDue, fsrsState }) =>
  compareDueDates(legacyDue, fsrsState?.nextDue);
