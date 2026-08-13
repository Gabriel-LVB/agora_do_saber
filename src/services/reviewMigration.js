import {
  buildReviewCardKey,
  createReviewQueueItem,
  REVIEW_DAY_MS,
} from './reviewScheduler.js';
import { questionHasUnresolvedRequiredVisual } from './questionVisual.js';

export const INDIVIDUAL_REVIEW_PLAN_VERSION = 'curated-progressive-essential-fsrs-v11';
const LEGACY_PROGRESSIVE_PLAN_VERSION = 'curated-progressive-essential-fsrs-v5';
const BROKEN_SIBLING_REPLAN_VERSION = 'curated-progressive-essential-fsrs-v6';
const BROKEN_CALENDAR_RECOVERY_STRATEGY = 'v6-calendar-recovery';
const PROGRESSIVE_REVIEW_ROLLOUT_AT = Date.parse('2026-08-02T07:00:00-03:00');
export const REVIEW_FIRST_EXPOSURE_BATCH_SIZE = 10;
const EXPONENTIAL_FIRST_EXPOSURE_STRATEGY = 'exponential-batches-v1';
export const FSRS_PENDING_SCHEDULER_VERSION = 'fsrs-pending-first-review-v1';
const exponentialDayOffset = index => {
  if (index === 0) return 0;
  // 2^27 dias ultrapassa o intervalo seguro de Date. O fallback continua
  // criando dias distintos sem descartar cartões, embora uma aula real nunca
  // deva chegar perto de 270 questões ativas.
  return index <= 26 ? 2 ** index : 2 ** 26 + index - 26;
};
export const REVIEW_FIRST_EXPOSURE_WAVES = Object.freeze(
  Array.from({ length:7 }, (_, index) => Object.freeze({ dayOffset:exponentialDayOffset(index) }))
);

const answerIsCorrect = (question, answer) => {
  if (!answer) return false;
  if (question?.isFlashcard || question?.isCloze) return answer === 'CORRECT';
  if (question?.isOpen) {
    try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(error) { return false; }
  }
  return question?.options?.some(option => option?.isCorrect && option.letter === answer) || false;
};

const blockEntries = blocks => Array.isArray(blocks)
  ? blocks.map((block, index) => [String(block?.id || `block_${index}`), block])
  : Object.entries(blocks || {});

export const allocateReviewFirstExposureWaves = total => {
  const cleanTotal = Math.max(0, Math.floor(Number(total) || 0));
  const batchCount = Math.ceil(cleanTotal / REVIEW_FIRST_EXPOSURE_BATCH_SIZE);
  return Array.from({ length:batchCount }, (_, index) => {
    const count = Math.min(
      REVIEW_FIRST_EXPOSURE_BATCH_SIZE,
      cleanTotal - index * REVIEW_FIRST_EXPOSURE_BATCH_SIZE,
    );
    return {
      count,
      dayOffset:exponentialDayOffset(index),
      percentage:cleanTotal ? count / cleanTotal * 100 : 0,
    };
  });
};

// Cada onda recebe a próxima fatia da ordem canônica, sem reclassificar por
// nota, resultado anterior, conceito ou similaridade.
export const distributeReviewFirstExposureRows = (orderedRows = [], waves = []) => {
  const buckets = waves.map(wave => ({ ...wave, rows:[] }));
  let cursor = 0;
  buckets.forEach(bucket => {
    bucket.rows = orderedRows.slice(cursor, cursor + bucket.count);
    cursor += bucket.count;
  });
  return buckets;
};

// A cronologia publicada domina: diretas primeiro e clínicas depois.
const questionKindRank = row => String(
  row?.question?.libraryQuestionKind || row?.libraryQuestionKind || ''
).toLowerCase() === 'clinical' ? 1 : 0;

export const orderReviewFirstExposureRows = (rows = []) => [...rows].sort((left, right) =>
  questionKindRank(left) - questionKindRank(right)
  || Number(left.sourceIndex || 0) - Number(right.sourceIndex || 0)
  || String(left.qId).localeCompare(String(right.qId))
);

const firstExposureDueDate = ({ dayOffset, now, slot }) => {
  if (dayOffset === 0) return now - 60000 + slot;
  const due = new Date(now);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + dayOffset);
  return due.getTime() + slot;
};

const buildFirstExposurePlan = ({
  rows = [],
  now = Date.now(),
  useOriginalAnchor = false,
}) => {
  const byLesson = new Map();
  rows.forEach(row => {
    const key = String(row.aulaId);
    byLesson.set(key, [...(byLesson.get(key) || []), row]);
  });
  const plannedByCardKey = new Map();
  const buckets = [];
  byLesson.forEach(lessonRows => {
    const ordered = orderReviewFirstExposureRows(lessonRows);
    const lessonWaves = allocateReviewFirstExposureWaves(ordered.length);
    const distributedWaves = distributeReviewFirstExposureRows(ordered, lessonWaves);
    const originalAnchors = lessonRows
      .map(row => Number(row.firstExposureAnchor))
      .filter(Number.isFinite);
    const scheduleAnchor = useOriginalAnchor && originalAnchors.length
      ? Math.min(...originalAnchors)
      : now;
    let cursor = 0;
    distributedWaves.forEach((wave, bucketIndex) => {
      if (!buckets[bucketIndex]) buckets[bucketIndex] = { ...wave, count:0 };
      buckets[bucketIndex].count += wave.rows.length;
      wave.rows.forEach((row, slot) => {
        const rowAnchor = useOriginalAnchor && Number.isFinite(Number(row.firstExposureAnchor))
          ? Number(row.firstExposureAnchor)
          : scheduleAnchor;
        cursor += 1;
        plannedByCardKey.set(row.cardKey, {
          bucketIndex,
          dayOffset:wave.dayOffset,
          dueDate:firstExposureDueDate({ dayOffset:wave.dayOffset, now:rowAnchor, slot }),
          percentage:wave.percentage,
          sequenceIndex:cursor - 1,
          siblingStrategy:EXPONENTIAL_FIRST_EXPOSURE_STRATEGY,
          plannedAt:rowAnchor,
        });
      });
    });
  });
  return {
    buckets,
    plannedByCardKey,
    total:rows.length,
  };
};

const normalizedLearningPolicy = question => {
  const policy = question?.learningPolicy;
  if (!policy || typeof policy !== 'object') return null;
  return {
    ...policy,
    tier:['essential', 'complementary', 'reserve', 'disabled'].includes(policy.tier)
      ? policy.tier
      : 'disabled',
    conceptIds:Array.isArray(policy.conceptIds) ? policy.conceptIds.map(String) : [],
    redundancyClusterId:policy.redundancyClusterId ? String(policy.redundancyClusterId) : null,
    canonicalQuestionId:policy.canonicalQuestionId ? String(policy.canonicalQuestionId) : null,
  };
};

const policyBlocksReview = policy => !!policy && (
  policy.tier === 'disabled'
  || policy.reviewEligible === false
  || ['deprecated', 'review_required'].includes(policy.status)
);

const fallbackPolicy = Object.freeze({
  tier:'unclassified',
  conceptIds:[],
  primaryConceptId:null,
  importance:3,
  difficulty:3,
  learningRole:'reinforcement',
  qualityScore:0,
  reviewEligible:false,
  status:'awaiting_curation',
  selectionSource:'awaiting-curation',
});

const setQueueItem = (queue, aulaId, blockId, qId, item) => {
  const nextAula = { ...(queue[aulaId] || {}) };
  nextAula[blockId] = { ...(nextAula[blockId] || {}), [qId]:item };
  queue[aulaId] = nextAula;
};

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const hasObservedReview = item => !!item?.fsrs
  || !!item?.lastReview
  || Number(item?.reps || 0) > 0;

const originalFirstExposureAnchor = item => Number(
  item?.migration?.createdAt
  || item?.addedAt
  || item?.migration?.firstExposure?.plannedAt
);

const shouldRepairBrokenCalendar = item => {
  const originalAnchor = originalFirstExposureAnchor(item);
  const replannedAt = Number(item?.migration?.firstExposure?.plannedAt);
  const brokenV6Replan = item?.migration?.firstExposure?.version === BROKEN_SIBLING_REPLAN_VERSION
    && Number.isFinite(originalAnchor)
    && Number.isFinite(replannedAt)
    && replannedAt > originalAnchor;
  const brokenV7Recovery = item?.migration?.firstExposure?.siblingStrategy === BROKEN_CALENDAR_RECOVERY_STRATEGY;
  return (brokenV6Replan || brokenV7Recovery)
    && !hasObservedReview(item)
    && !['completed-once', 'manual'].includes(item?.adaptiveState);
};

const trustedProgressiveAnchor = item => {
  const firstExposure = item?.migration?.firstExposure;
  const plannedAt = Number(firstExposure?.plannedAt);
  if (!Number.isFinite(plannedAt)) return null;
  if (firstExposure?.version === LEGACY_PROGRESSIVE_PLAN_VERSION
    || firstExposure?.siblingStrategy === 'legacy-preserved') return plannedAt;
  return null;
};

const dominantTimestamp = values => {
  const counts = new Map();
  values.filter(Number.isFinite).forEach(value => {
    const timestamp = Number(value);
    counts.set(timestamp, (counts.get(timestamp) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0] - left[0])[0]?.[0] ?? null;
};

const legacyRoundRobinLessons = rows => {
  const byLesson = new Map();
  rows.forEach(row => {
    const key = String(row.aulaId);
    byLesson.set(key, [...(byLesson.get(key) || []), row]);
  });
  const queues = [...byLesson.values()];
  const ordered = [];
  while (queues.some(queue => queue.length)) {
    queues.forEach(queue => {
      if (queue.length) ordered.push(queue.shift());
    });
  }
  return ordered;
};

const LEGACY_DAILY_QUOTAS = Object.freeze({ wrong:8, unseen:10, correct:6 });
const legacyDuePlan = ({ row, index }) => {
  const outcome = row.outcome;
  const quota = LEGACY_DAILY_QUOTAS[outcome];
  const baseDay = outcome === 'correct' ? 1 : 0;
  const dayOffset = baseDay + Math.floor(index / quota);
  const slot = index % quota;
  const categoryOffset = outcome === 'wrong' ? -120000 : outcome === 'unseen' ? -60000 : 0;
  const anchor = Number(row.existing?.migration?.createdAt || row.existing?.addedAt);
  return {
    bucketIndex:null,
    dayOffset,
    dueDate:(Number.isFinite(anchor) ? anchor : PROGRESSIVE_REVIEW_ROLLOUT_AT)
      + dayOffset * REVIEW_DAY_MS + categoryOffset + slot * 1000,
    percentage:null,
    sequenceIndex:index,
    siblingStrategy:'legacy-schedule-restored',
    plannedAt:Number.isFinite(anchor) ? anchor : PROGRESSIVE_REVIEW_ROLLOUT_AT,
  };
};

// Constroi uma unica agenda por questao para as aulas ativadas pelo aluno.
// Aulas adicionadas recebem lotes de até dez questões nos deslocamentos
// 0, 2, 4, 8, 16, 32... dias. A migração replaneja somente cartões que nunca
// tiveram revisão observada e preserva integralmente os já respondidos.
// Depois da primeira exposição, somente as essenciais seguem para o FSRS.
export const buildWatchedLessonsIndividualPlan = ({
  lessons = [],
  existingQueue = {},
  isCorrect = answerIsCorrect,
  now = Date.now(),
}) => {
  const nextQueue = { ...(existingQueue || {}) };
  const existingByCardKey = new Map();
  Object.entries(existingQueue || {}).forEach(([aulaId, blocks]) => {
    Object.entries(blocks || {}).forEach(([blockId, qMap]) => {
      Object.entries(qMap || {}).forEach(([qId, item]) => {
        const cardKey = item?.cardKey || buildReviewCardKey({
          source:item?.source || 'curso',
          aulaId,
          blockId,
          qId,
        });
        existingByCardKey.set(cardKey, { aulaId, blockId, qId, item });
      });
    });
  });
  const pausedLessonIds = new Set(Object.entries(existingQueue || {})
    .filter(([, blocks]) => Object.values(blocks || {}).some(qMap =>
      Object.values(qMap || {}).some(item => item?.adaptiveState === 'paused')
    ))
    .map(([aulaId]) => String(aulaId)));
  const trustedAnchorsByLesson = new Map();
  const trustedAnchors = [];
  existingByCardKey.forEach(({ aulaId, item }) => {
    const anchor = trustedProgressiveAnchor(item);
    if (!Number.isFinite(anchor)) return;
    trustedAnchors.push(anchor);
    const lessonId = String(aulaId);
    trustedAnchorsByLesson.set(lessonId, [...(trustedAnchorsByLesson.get(lessonId) || []), anchor]);
  });
  const globalProgressiveAnchor = dominantTimestamp(trustedAnchors) || PROGRESSIVE_REVIEW_ROLLOUT_AT;

  const candidates = [];
  lessons.forEach(lesson => {
    const aulaId = String(lesson?.aulaId || '');
    if (!aulaId || !lesson?.aulaData) return;
    blockEntries(lesson.aulaData.blocks).forEach(([blockId, block]) => {
      const answers = block?.answers && typeof block.answers === 'object' && !Array.isArray(block.answers)
        ? block.answers
        : {};
      const errorNotebook = new Set(
        (Array.isArray(block?.errorNotebook) ? block.errorNotebook : []).map(String)
      );
      (Array.isArray(block?.questions) ? block.questions : []).forEach(question => {
        if (question?.id == null) return;
        const qId = String(question.id);
        const cardKey = buildReviewCardKey({ source:'curso', aulaId, qId });
        const answer = answers[question.id] ?? answers[qId];
        const answered = answer != null && answer !== '' && answer !== 'SKIPPED';
        const outcome = errorNotebook.has(qId) || (answered && !isCorrect(question, answer))
          ? 'wrong'
          : answered ? 'correct' : 'unseen';
        candidates.push({
          aulaId,
          blockId,
          qId,
          cardKey,
          question,
          outcome,
          lesson,
          policy:normalizedLearningPolicy(question),
          sourceIndex:candidates.length,
        });
      });
    });
  });

  candidates.forEach(row => {
    const existingItem = existingByCardKey.get(row.cardKey)?.item || null;
    const createdAt = originalFirstExposureAnchor(existingItem);
    const firstExposure = existingItem?.migration?.firstExposure;
    const plannedAt = Number(firstExposure?.plannedAt);
    const bornProgressive = firstExposure?.siblingStrategy !== BROKEN_CALENDAR_RECOVERY_STRATEGY
      && Number.isFinite(createdAt)
      && Number.isFinite(plannedAt)
      && plannedAt === createdAt;
    const lessonProgressiveAnchor = dominantTimestamp(trustedAnchorsByLesson.get(String(row.aulaId)) || [])
      || globalProgressiveAnchor;
    row.existing = existingItem;
    row.progressiveAnchor = lessonProgressiveAnchor;
    row.firstExposureAnchor = Number.isFinite(createdAt) ? createdAt : null;
    row.legacyCohort = !!existingItem
      && !bornProgressive
      && Number.isFinite(createdAt)
      && createdAt < lessonProgressiveAnchor;
    row.repairBrokenCalendar = shouldRepairBrokenCalendar(existingItem);
    row.redistributeUnseenFirstExposure = !!existingItem
      && !hasObservedReview(existingItem)
      && existingItem?.adaptiveState !== 'manual'
      && firstExposure?.version !== INDIVIDUAL_REVIEW_PLAN_VERSION;
  });

  const legacyAdaptiveState = row => {
    const existingAdaptiveState = row.existing?.adaptiveState;
    if (row.outcome === 'wrong') return 'remediation';
    if (['remediation', 'manual'].includes(existingAdaptiveState)) return existingAdaptiveState;
    if (row.policy?.tier === 'essential') return 'core';
    return 'introduction';
  };
  const intendedAdaptiveState = row => {
    const existingItem = row.existing;
    const existingAdaptiveState = existingItem?.adaptiveState;
    const isOneTimeQuestion = ['complementary', 'reserve'].includes(row.policy?.tier);
    const wasAlreadyReviewed = existingAdaptiveState === 'completed-once'
      || !!existingItem?.fsrs
      || !!existingItem?.lastReview
      || Number(existingItem?.reps) > 0;
    if (isOneTimeQuestion && wasAlreadyReviewed) return 'completed-once';
    if (row.legacyCohort) return legacyAdaptiveState(row);
    if (row.outcome === 'wrong') return 'remediation';
    if (isOneTimeQuestion && existingItem?.adaptiveActivation?.reason === 'related-error') return 'introduction';
    if (['remediation', 'manual'].includes(existingAdaptiveState)) return existingAdaptiveState;
    if (row.policy?.tier === 'essential') return 'core';
    return 'introduction';
  };
  const classify = row => {
    const existingAdaptiveState = row.existing?.adaptiveState;
    if (existingAdaptiveState === 'paused' || pausedLessonIds.has(String(row.aulaId))) {
      return { active:false, adaptiveState:'paused', intendedAdaptiveState:intendedAdaptiveState(row) };
    }
    if (!row.policy) return { active:false, adaptiveState:'awaiting-curation' };
    if (policyBlocksReview(row.policy)) return { active:false, adaptiveState:'disabled' };
    if (questionHasUnresolvedRequiredVisual(row.question)) {
      return { active:false, adaptiveState:'awaiting-visual' };
    }
    const adaptiveState = intendedAdaptiveState(row);
    return { active:!['completed-once', 'dormant'].includes(adaptiveState), adaptiveState };
  };
  candidates.forEach(row => Object.assign(row, classify(row)));

  const firstExposureRows = candidates.filter(row => row.policy
      && !policyBlocksReview(row.policy)
      && !questionHasUnresolvedRequiredVisual(row.question)
      && !hasObservedReview(row.existing)
      && row.adaptiveState !== 'completed-once');
  const firstExposure = buildFirstExposurePlan({
    rows:firstExposureRows,
    now,
  });
  const { plannedByCardKey } = firstExposure;
  const recoveryRows = candidates.filter(row => !row.legacyCohort
    && row.policy
    && !policyBlocksReview(row.policy)
    && !questionHasUnresolvedRequiredVisual(row.question));
  const recoveryFirstExposure = recoveryRows.some(row =>
    row.repairBrokenCalendar
  ) ? buildFirstExposurePlan({
      rows:recoveryRows,
      now,
      useOriginalAnchor:true,
    }) : null;
  const legacyPlannedByCardKey = new Map();
  ['wrong', 'unseen', 'correct'].forEach(outcome => {
    legacyRoundRobinLessons(candidates.filter(row => row.legacyCohort
      && row.outcome === outcome
      && ['core', 'remediation', 'manual'].includes(legacyAdaptiveState(row))))
      .forEach((row, index) => legacyPlannedByCardKey.set(row.cardKey, legacyDuePlan({ row, index })));
  });
  const counts = { wrong:0, unseen:0, correct:0 };
  const adaptive = {
    essential:0,
    remediation:0,
    complementaryScheduled:0,
    reserveScheduled:0,
    complementaryWaiting:0,
    reserveWaiting:0,
    awaitingCuration:0,
    awaitingVisual:0,
    disabled:0,
    paused:0,
    completedOnce:0,
  };
  let added = 0;
  let changed = 0;
  candidates.forEach(row => {
    const existing = existingByCardKey.get(row.cardKey)?.item || null;
    // Aula ainda não publicada não cria dívida nem documentos novos. Registros
    // legados já existentes continuam abaixo apenas para terem a data estacionada.
    if (!row.policy && !existing) {
      adaptive.awaitingCuration += 1;
      return;
    }
    const siblingPlan = plannedByCardKey.get(row.cardKey) || {
      bucketIndex:null,
      dayOffset:null,
      dueDate:null,
      percentage:null,
      sequenceIndex:null,
    };
    const learningPolicy = row.policy || fallbackPolicy;
    const savedFirstExposure = existing?.migration?.firstExposure;
    const repairBrokenPlan = row.repairBrokenCalendar;
    const legacyPlan = legacyPlannedByCardKey.get(row.cardKey) || siblingPlan;
    const plan = row.redistributeUnseenFirstExposure
      ? siblingPlan
      : row.legacyCohort
        ? legacyPlan
        : repairBrokenPlan
        ? recoveryFirstExposure?.plannedByCardKey.get(row.cardKey) || siblingPlan
        : siblingPlan;
    const repairLegacyEnrollment = row.legacyCohort && !hasObservedReview(existing)
      && existing?.adaptiveState !== 'manual';
    const redistributeUnseenFirstExposure = row.redistributeUnseenFirstExposure && plan.dayOffset != null;
    const repairDue = repairBrokenPlan || redistributeUnseenFirstExposure;
    const firstExposurePlan = savedFirstExposure && hasObservedReview(existing)
      ? savedFirstExposure
      : savedFirstExposure?.version === INDIVIDUAL_REVIEW_PLAN_VERSION
      ? savedFirstExposure
      : redistributeUnseenFirstExposure
        ? {
            version:INDIVIDUAL_REVIEW_PLAN_VERSION,
            bucketIndex:plan.bucketIndex,
            dayOffset:plan.dayOffset,
            percentage:plan.percentage,
            sequenceIndex:plan.sequenceIndex,
            siblingStrategy:EXPONENTIAL_FIRST_EXPOSURE_STRATEGY,
            plannedAt:now,
            redistributedAt:now,
            previousVersion:savedFirstExposure?.version || null,
          }
      : repairLegacyEnrollment
        ? {
            version:INDIVIDUAL_REVIEW_PLAN_VERSION,
            bucketIndex:plan.bucketIndex,
            dayOffset:plan.dayOffset,
            percentage:plan.percentage,
            sequenceIndex:plan.sequenceIndex,
            siblingStrategy:'legacy-schedule-restored',
            plannedAt:Number.isFinite(plan.plannedAt) ? plan.plannedAt : now,
            repairedAt:now,
          }
      : savedFirstExposure && !repairBrokenPlan
        ? {
            ...savedFirstExposure,
            version:INDIVIDUAL_REVIEW_PLAN_VERSION,
            siblingStrategy:savedFirstExposure.siblingStrategy || 'legacy-preserved',
            migratedAt:now,
          }
      : plan.dayOffset != null ? {
          version:INDIVIDUAL_REVIEW_PLAN_VERSION,
          bucketIndex:plan.bucketIndex,
          dayOffset:plan.dayOffset,
          percentage:plan.percentage,
          sequenceIndex:plan.sequenceIndex,
          siblingStrategy:repairBrokenPlan ? 'progressive-calendar-restored' : plan.siblingStrategy,
          plannedAt:repairBrokenPlan && Number.isFinite(plan.plannedAt) ? plan.plannedAt : now,
          ...(repairBrokenPlan ? { repairedAt:now } : {}),
        } : null;
    let nextItem = existing || {
      ...createReviewQueueItem({
        source:'curso',
        aulaId:row.aulaId,
        blockId:row.blockId,
        qId:row.qId,
        question:row.question,
        subjectId:row.lesson.subject || null,
        topicId:row.lesson.topic || null,
        aulaTitle:row.lesson.aulaTitle || null,
        blockTitle:row.lesson.blockTitles?.[row.blockId] || null,
        now,
      }),
      state:'new',
      schedulerVersion:FSRS_PENDING_SCHEDULER_VERSION,
      migration:{
        version:INDIVIDUAL_REVIEW_PLAN_VERSION,
        source:'watched-lessons',
        priorOutcome:row.outcome,
        plannedDayOffset:plan.dayOffset,
        ...(firstExposurePlan ? { firstExposure:firstExposurePlan } : {}),
        createdAt:now,
      },
    };
    nextItem = {
      ...nextItem,
      question:row.question ? { ...row.question } : nextItem.question,
      learningPolicy,
      adaptiveState:row.adaptiveState,
      migration:{
        ...(nextItem.migration || {}),
        version:INDIVIDUAL_REVIEW_PLAN_VERSION,
        priorOutcome:row.outcome,
        plannedDayOffset:row.active || row.adaptiveState === 'paused' ? (firstExposurePlan?.dayOffset ?? null) : null,
        ...(firstExposurePlan ? { firstExposure:firstExposurePlan } : {}),
      },
    };
    if (existing?.adaptiveActivation?.reason === 'related-error') {
      const { adaptiveActivation:_retiredAdaptiveActivation, ...withoutAdaptiveActivation } = nextItem;
      nextItem = withoutAdaptiveActivation;
    }
    if (row.active) {
      const retiredAdaptiveSupport = existing?.adaptiveActivation?.reason === 'related-error';
      const existingDue = retiredAdaptiveSupport || repairDue ? null : existing?.dueDate;
      const parkedDue = retiredAdaptiveSupport || repairDue ? null : existing?.parkedDueDate;
      const fsrsDue = retiredAdaptiveSupport || repairDue ? null : existing?.fsrs?.nextDue;
      const resumableDue = existingDue != null && Number.isFinite(Number(existingDue))
        ? Number(existingDue)
        : parkedDue != null && Number.isFinite(Number(parkedDue))
          ? Number(parkedDue)
          : fsrsDue != null && Number.isFinite(Number(fsrsDue))
            ? Number(fsrsDue)
          : null;
      nextItem.dueDate = resumableDue ?? plan.dueDate ?? now;
      nextItem.parkedDueDate = null;
      if (!existing) added += 1;
      counts[row.outcome] += 1;
      if (row.adaptiveState === 'remediation') adaptive.remediation += 1;
      else if (row.policy?.tier === 'essential') adaptive.essential += 1;
      else if (row.policy?.tier === 'complementary') adaptive.complementaryScheduled += 1;
      else if (row.policy?.tier === 'reserve') adaptive.reserveScheduled += 1;
    } else {
      const currentDue = repairDue ? null : existing?.dueDate;
      const completedWhilePaused = row.adaptiveState === 'paused'
        && row.intendedAdaptiveState === 'completed-once';
      nextItem.parkedDueDate = row.adaptiveState === 'completed-once' || completedWhilePaused
        ? null
        : currentDue != null && Number.isFinite(Number(currentDue))
          ? Number(currentDue)
          : repairDue
            ? plan.dueDate
            : existing?.parkedDueDate || (row.adaptiveState === 'paused' ? plan.dueDate : null);
      nextItem.dueDate = null;
      if (row.adaptiveState === 'paused') {
        adaptive.paused += 1;
        nextItem.reviewPause = repairDue
          ? {
              ...(existing?.reviewPause || {}),
              adaptiveState:row.intendedAdaptiveState || 'introduction',
              dueDate:null,
              parkedDueDate:plan.dueDate,
              pausedAt:existing?.reviewPause?.pausedAt || now,
            }
          : completedWhilePaused
          ? {
              ...(existing?.reviewPause || {}),
              adaptiveState:'completed-once',
              dueDate:null,
              parkedDueDate:null,
              pausedAt:existing?.reviewPause?.pausedAt || now,
            }
          : existing?.reviewPause || {
              adaptiveState:row.intendedAdaptiveState || 'introduction',
              dueDate:null,
              parkedDueDate:nextItem.parkedDueDate,
              pausedAt:now,
            };
      }
      else if (row.adaptiveState === 'completed-once') adaptive.completedOnce += 1;
      else if (row.adaptiveState === 'disabled') adaptive.disabled += 1;
      else if (row.adaptiveState === 'awaiting-visual') adaptive.awaitingVisual += 1;
      else if (row.policy?.tier === 'complementary') adaptive.complementaryWaiting += 1;
      else if (row.policy?.tier === 'reserve') adaptive.reserveWaiting += 1;
      else adaptive.awaitingCuration += 1;
    }
    if (!existing || !sameJson(existing, nextItem)) {
      setQueueItem(nextQueue, row.aulaId, row.blockId, row.qId, nextItem);
      changed += 1;
    }
  });

  return {
    queue:nextQueue,
    added,
    changed,
    evaluated:candidates.length,
    counts,
    adaptive,
    introduction:{
      buckets:firstExposure.buckets,
      total:firstExposure.total,
    },
  };
};
