import {
  buildReviewCardKey,
  createReviewQueueItem,
  REVIEW_DAY_MS,
} from './reviewScheduler.js';
import { questionHasUnresolvedRequiredVisual } from './questionVisual.js';

export const INDIVIDUAL_REVIEW_PLAN_VERSION = 'curated-adaptive-individual-v3';
export const FSRS_PENDING_SCHEDULER_VERSION = 'fsrs-pending-first-review-v1';
export const INDIVIDUAL_REVIEW_DAILY_QUOTAS = Object.freeze({
  wrong:8,
  unseen:10,
  correct:6,
});

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

const roundRobinLessons = rows => {
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

const plannedDueDate = ({ outcome, index, now }) => {
  const quota = INDIVIDUAL_REVIEW_DAILY_QUOTAS[outcome];
  const baseDay = outcome === 'correct' ? 1 : 0;
  const dayOffset = baseDay + Math.floor(index / quota);
  const slot = index % quota;
  // Cartoes do dia zero ja estao vencidos. A diferenca de segundos mantem
  // erros, ineditas e aulas diferentes misturados de forma deterministica.
  const categoryOffset = outcome === 'wrong' ? -120000 : outcome === 'unseen' ? -60000 : 0;
  return {
    dayOffset,
    dueDate:now + dayOffset * REVIEW_DAY_MS + categoryOffset + slot * 1000,
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
// Essenciais entram no nucleo. Complementares e reserva ficam estacionadas e
// so sao ativadas por evidencia de dificuldade. Aulas sem selecao publicada
// ficam integralmente fora da carga ate a curadoria ser concluida e publicada.
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
        });
      });
    });
  });

  const classify = row => {
    const existingAdaptiveState = existingByCardKey.get(row.cardKey)?.item?.adaptiveState;
    if (existingAdaptiveState === 'paused' || pausedLessonIds.has(String(row.aulaId))) {
      return { active:false, adaptiveState:'paused' };
    }
    if (!row.policy) return { active:false, adaptiveState:'awaiting-curation' };
    if (policyBlocksReview(row.policy)) return { active:false, adaptiveState:'disabled' };
    if (questionHasUnresolvedRequiredVisual(row.question)) {
      return { active:false, adaptiveState:'awaiting-visual' };
    }
    if (row.outcome === 'wrong') return { active:true, adaptiveState:'remediation' };
    if (['remediation', 'manual'].includes(existingAdaptiveState)) {
      return { active:true, adaptiveState:existingAdaptiveState };
    }
    if (row.policy?.tier === 'essential') return { active:true, adaptiveState:'core' };
    return { active:false, adaptiveState:'dormant' };
  };
  candidates.forEach(row => Object.assign(row, classify(row)));

  const orderedByOutcome = Object.fromEntries(['wrong', 'unseen', 'correct'].map(outcome => [
    outcome,
    roundRobinLessons(candidates.filter(row => row.active && row.outcome === outcome)),
  ]));
  const plannedByCardKey = new Map();
  Object.entries(orderedByOutcome).forEach(([outcome, rows]) => {
    rows.forEach((row, index) => {
      plannedByCardKey.set(row.cardKey, plannedDueDate({ outcome, index, now }));
    });
  });

  const counts = { wrong:0, unseen:0, correct:0 };
  const adaptive = {
    essential:0,
    remediation:0,
    complementaryWaiting:0,
    reserveWaiting:0,
    awaitingCuration:0,
    awaitingVisual:0,
    disabled:0,
    paused:0,
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
    const plan = plannedByCardKey.get(row.cardKey) || { dayOffset:null, dueDate:null };
    const learningPolicy = row.policy || fallbackPolicy;
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
        plannedDayOffset:row.active ? plan.dayOffset : null,
      },
    };
    if (row.active) {
      const existingDue = existing?.dueDate;
      const parkedDue = existing?.parkedDueDate;
      const resumableDue = existingDue != null && Number.isFinite(Number(existingDue))
        ? Number(existingDue)
        : parkedDue != null && Number.isFinite(Number(parkedDue))
          ? Number(parkedDue)
          : null;
      nextItem.dueDate = resumableDue ?? plan.dueDate;
      nextItem.parkedDueDate = null;
      if (!existing) added += 1;
      counts[row.outcome] += 1;
      if (row.adaptiveState === 'remediation') adaptive.remediation += 1;
      else if (row.policy?.tier === 'essential') adaptive.essential += 1;
    } else {
      const currentDue = existing?.dueDate;
      nextItem.parkedDueDate = currentDue != null && Number.isFinite(Number(currentDue))
        ? Number(currentDue)
        : existing?.parkedDueDate || null;
      nextItem.dueDate = null;
      if (row.adaptiveState === 'paused') adaptive.paused += 1;
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
  };
};

const policiesOverlap = (left = {}, right = {}) => {
  const rightConcepts = new Set(right.conceptIds || []);
  return (left.conceptIds || []).some(conceptId => rightConcepts.has(conceptId));
};

// Um erro em uma questao ativa libera no maximo um reforco relacionado. A
// questao liberada entra na fila; as demais continuam fora da carga prevista.
export const activateAdaptiveSupportQuestion = ({
  queue = {},
  aulaId,
  answeredItem,
  now = Date.now(),
}) => {
  const answeredPolicy = answeredItem?.learningPolicy;
  if (!answeredPolicy || !['essential', 'complementary'].includes(answeredPolicy.tier)) {
    return { queue, activated:null };
  }
  const candidates = Object.entries(queue?.[aulaId] || {}).flatMap(([blockId, qMap]) =>
    Object.entries(qMap || {}).map(([qId, item]) => ({ blockId, qId, item }))
  ).filter(row =>
    row.item?.adaptiveState === 'dormant'
    && ['complementary', 'reserve'].includes(row.item?.learningPolicy?.tier)
    && policiesOverlap(answeredPolicy, row.item.learningPolicy)
  ).sort((left, right) => {
    const tierRank = tier => tier === 'complementary' ? 0 : 1;
    return tierRank(left.item.learningPolicy.tier) - tierRank(right.item.learningPolicy.tier)
      || Number(right.item.learningPolicy.importance || 0) - Number(left.item.learningPolicy.importance || 0)
      || Number(right.item.learningPolicy.qualityScore || 0) - Number(left.item.learningPolicy.qualityScore || 0);
  });
  const selected = candidates[0];
  if (!selected) return { queue, activated:null };
  const activatedItem = {
    ...selected.item,
    adaptiveState:'remediation',
    dueDate:now + 1000,
    adaptiveActivation:{
      reason:'related-error',
      sourceCardKey:answeredItem.cardKey || null,
      activatedAt:now,
    },
  };
  const nextQueue = { ...queue };
  setQueueItem(nextQueue, String(aulaId), selected.blockId, selected.qId, activatedItem);
  return {
    queue:nextQueue,
    activated:{
      aulaId:String(aulaId),
      blockId:selected.blockId,
      qId:selected.qId,
      item:activatedItem,
    },
  };
};
