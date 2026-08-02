import {
  buildReviewCardKey,
  createReviewQueueItem,
} from './reviewScheduler.js';
import { questionHasUnresolvedRequiredVisual } from './questionVisual.js';

export const INDIVIDUAL_REVIEW_PLAN_VERSION = 'curated-progressive-essential-fsrs-v5';
export const FSRS_PENDING_SCHEDULER_VERSION = 'fsrs-pending-first-review-v1';
export const REVIEW_FIRST_EXPOSURE_WAVES = Object.freeze([
  Object.freeze({ percentage:35, dayOffset:0 }),
  Object.freeze({ percentage:30, dayOffset:1 }),
  Object.freeze({ percentage:20, dayOffset:4 }),
  Object.freeze({ percentage:10, dayOffset:8 }),
  Object.freeze({ percentage:5, dayOffset:15 }),
]);

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
  const rows = REVIEW_FIRST_EXPOSURE_WAVES.map((wave, index) => {
    const exact = cleanTotal * wave.percentage / 100;
    const count = Math.floor(exact);
    return { ...wave, count, fraction:exact - count, index };
  });
  let remaining = cleanTotal - rows.reduce((sum, row) => sum + row.count, 0);
  [...rows]
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index)
    .forEach(row => {
      if (remaining <= 0) return;
      rows[row.index].count += 1;
      remaining -= 1;
    });
  return rows.map(({ fraction:_fraction, index:_index, ...row }) => row);
};

const outcomeScore = outcome => outcome === 'wrong' ? 3000000 : outcome === 'unseen' ? 2000000 : 1000000;
const tierScore = tier => tier === 'essential' ? 300000 : tier === 'complementary' ? 150000 : 0;
const learningRoleScore = role => role === 'core' ? 16000 : role === 'reinforcement' ? 9000 : role === 'variation' ? 2000 : 0;
const cognitiveScore = level => level === 'reasoning' ? 5000 : level === 'application' ? 3000 : level === 'understanding' ? 1500 : 0;
const conceptKey = row => String(row.policy?.primaryConceptId || row.policy?.conceptIds?.[0] || '').trim();

// Importancia e qualidade dominam a ordem; dentro de questoes pedagogicamente
// proximas, conceitos ainda nao apresentados recebem preferencia para ampliar
// a cobertura da aula desde a primeira onda.
export const orderReviewFirstExposureRows = (rows = []) => {
  const remaining = [...rows];
  const ordered = [];
  const conceptCounts = new Map();
  while (remaining.length) {
    remaining.sort((left, right) => {
      const score = row => {
        const policy = row.policy || {};
        const concept = conceptKey(row);
        const diversityBonus = concept && !conceptCounts.has(concept) ? 10000 : 0;
        const repetitionPenalty = concept ? Math.min(5, conceptCounts.get(concept) || 0) * 1000 : 0;
        return outcomeScore(row.outcome)
          + tierScore(policy.tier)
          + (Number(policy.importance) || 0) * 20000
          + (Number(policy.qualityScore) || 0) * 150
          + learningRoleScore(policy.learningRole)
          + cognitiveScore(policy.cognitiveLevel)
          + diversityBonus
          - repetitionPenalty
          - (Number(policy.redundancyScore) || 0) * 12000;
      };
      return score(right) - score(left)
        || Number(left.sourceIndex || 0) - Number(right.sourceIndex || 0)
        || String(left.qId).localeCompare(String(right.qId));
    });
    const selected = remaining.shift();
    ordered.push(selected);
    const concept = conceptKey(selected);
    if (concept) conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
  }
  return ordered;
};

const firstExposureDueDate = ({ dayOffset, now, slot }) => {
  if (dayOffset === 0) return now - 60000 + slot;
  const due = new Date(now);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + dayOffset);
  return due.getTime() + slot;
};

const buildFirstExposurePlan = ({ rows = [], now = Date.now() }) => {
  const byLesson = new Map();
  rows.forEach(row => {
    const key = String(row.aulaId);
    byLesson.set(key, [...(byLesson.get(key) || []), row]);
  });
  const plannedByCardKey = new Map();
  const buckets = REVIEW_FIRST_EXPOSURE_WAVES.map(wave => ({ ...wave, count:0 }));
  byLesson.forEach(lessonRows => {
    const ordered = orderReviewFirstExposureRows(lessonRows);
    const lessonWaves = allocateReviewFirstExposureWaves(ordered.length);
    let cursor = 0;
    lessonWaves.forEach((wave, bucketIndex) => {
      buckets[bucketIndex].count += wave.count;
      for (let slot = 0; slot < wave.count; slot += 1) {
        const row = ordered[cursor];
        cursor += 1;
        plannedByCardKey.set(row.cardKey, {
          bucketIndex,
          dayOffset:wave.dayOffset,
          dueDate:firstExposureDueDate({ dayOffset:wave.dayOffset, now, slot }),
          percentage:wave.percentage,
          sequenceIndex:cursor - 1,
        });
      }
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

// Constroi uma unica agenda por questao para as aulas ativadas pelo aluno.
// Toda questao curada e elegivel recebe uma primeira exposicao nas ondas
// 35/30/20/10/5. Depois dela, somente as essenciais seguem para o FSRS.
// Aulas sem selecao publicada continuam fora da carga ate a curadoria.
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

  const intendedAdaptiveState = row => {
    const existingItem = existingByCardKey.get(row.cardKey)?.item;
    const existingAdaptiveState = existingItem?.adaptiveState;
    const isOneTimeQuestion = ['complementary', 'reserve'].includes(row.policy?.tier);
    const wasAlreadyReviewed = existingAdaptiveState === 'completed-once'
      || !!existingItem?.fsrs
      || !!existingItem?.lastReview
      || Number(existingItem?.reps) > 0;
    if (isOneTimeQuestion && wasAlreadyReviewed) return 'completed-once';
    if (row.outcome === 'wrong') return 'remediation';
    if (isOneTimeQuestion && existingItem?.adaptiveActivation?.reason === 'related-error') return 'introduction';
    if (['remediation', 'manual'].includes(existingAdaptiveState)) return existingAdaptiveState;
    if (row.policy?.tier === 'essential') return 'core';
    return 'introduction';
  };
  const classify = row => {
    const existingAdaptiveState = existingByCardKey.get(row.cardKey)?.item?.adaptiveState;
    if (existingAdaptiveState === 'paused' || pausedLessonIds.has(String(row.aulaId))) {
      return { active:false, adaptiveState:'paused', intendedAdaptiveState:intendedAdaptiveState(row) };
    }
    if (!row.policy) return { active:false, adaptiveState:'awaiting-curation' };
    if (policyBlocksReview(row.policy)) return { active:false, adaptiveState:'disabled' };
    if (questionHasUnresolvedRequiredVisual(row.question)) {
      return { active:false, adaptiveState:'awaiting-visual' };
    }
    const adaptiveState = intendedAdaptiveState(row);
    return { active:adaptiveState !== 'completed-once', adaptiveState };
  };
  candidates.forEach(row => Object.assign(row, classify(row)));

  const firstExposure = buildFirstExposurePlan({
    rows:candidates.filter(row => row.policy
      && !policyBlocksReview(row.policy)
      && !questionHasUnresolvedRequiredVisual(row.question)
      && row.adaptiveState !== 'completed-once'),
    now,
  });
  const { plannedByCardKey } = firstExposure;

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
    const plan = plannedByCardKey.get(row.cardKey) || {
      bucketIndex:null,
      dayOffset:null,
      dueDate:null,
      percentage:null,
      sequenceIndex:null,
    };
    const learningPolicy = row.policy || fallbackPolicy;
    const savedFirstExposure = existing?.migration?.firstExposure;
    const firstExposurePlan = savedFirstExposure?.version === INDIVIDUAL_REVIEW_PLAN_VERSION
      ? savedFirstExposure
      : plan.dayOffset != null ? {
          version:INDIVIDUAL_REVIEW_PLAN_VERSION,
          bucketIndex:plan.bucketIndex,
          dayOffset:plan.dayOffset,
          percentage:plan.percentage,
          sequenceIndex:plan.sequenceIndex,
          plannedAt:now,
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
      const existingDue = retiredAdaptiveSupport ? null : existing?.dueDate;
      const parkedDue = retiredAdaptiveSupport ? null : existing?.parkedDueDate;
      const fsrsDue = retiredAdaptiveSupport ? null : existing?.fsrs?.nextDue;
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
      const currentDue = existing?.dueDate;
      const completedWhilePaused = row.adaptiveState === 'paused'
        && row.intendedAdaptiveState === 'completed-once';
      nextItem.parkedDueDate = row.adaptiveState === 'completed-once' || completedWhilePaused
        ? null
        : currentDue != null && Number.isFinite(Number(currentDue))
          ? Number(currentDue)
          : existing?.parkedDueDate || (row.adaptiveState === 'paused' ? plan.dueDate : null);
      nextItem.dueDate = null;
      if (row.adaptiveState === 'paused') {
        adaptive.paused += 1;
        nextItem.reviewPause = completedWhilePaused
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
