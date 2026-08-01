export const REVIEW_SCHEDULER_VERSION = 'agora-legacy-v2';
export const REVIEW_INTERVAL_DAYS = [3, 7, 14, 30, 90];
export const REVIEW_DAY_MS = 86400000;
export const DEFAULT_LESSON_REVIEW_SIZE = 12;

export const isReviewQueueItemScheduled = item => {
  const isCourseItem = item?.source === 'curso' || String(item?.cardKey || '').startsWith('course/');
  const policy = item?.learningPolicy;
  if (isCourseItem && (!policy || policy.tier === 'unclassified')) return false;
  return item?.dueDate != null
    && Number.isFinite(Number(item.dueDate))
    && !['dormant', 'disabled', 'awaiting-curation', 'awaiting-visual', 'paused'].includes(item?.adaptiveState)
    && policy?.tier !== 'disabled';
};

const safePart = value => encodeURIComponent(String(value ?? '').trim() || 'unknown');

export const buildReviewCardKey = ({
  source = 'curso',
  aulaId,
  subjectId,
  topicId,
  qId,
}) => {
  if (source === 'curso') return `course/${safePart(aulaId)}/${safePart(qId)}`;
  const container = [subjectId, topicId].filter(value => value != null && value !== '').map(safePart).join('/');
  return `${safePart(source || 'personal')}/${container || safePart(aulaId)}/${safePart(qId)}`;
};

export const createReviewQueueItem = ({
  source = 'curso',
  aulaId,
  blockId,
  qId,
  question,
  subjectId = null,
  topicId = null,
  aulaTitle = null,
  blockTitle = null,
  now = Date.now(),
}) => ({
  interval:0,
  dueDate:now + REVIEW_INTERVAL_DAYS[0] * REVIEW_DAY_MS,
  reviewSeed:Math.floor(Math.random() * 999999),
  source,
  subjectId,
  topicId,
  aulaTitle,
  blockTitle,
  question:question ? { ...question } : null,
  cardKey:buildReviewCardKey({ source, aulaId, blockId, qId, subjectId, topicId }),
  schedulerVersion:REVIEW_SCHEDULER_VERSION,
  state:'learning',
  reps:0,
  lapses:0,
  addedAt:now,
  lastReview:null,
});

const finiteDateOrNull = value => value != null && Number.isFinite(Number(value))
  ? Number(value)
  : null;

const mapLessonReviewItems = (queue, aulaId, mapper) => {
  const id = String(aulaId || '');
  const current = queue?.[id];
  if (!id || !current || typeof current !== 'object') return { queue, changed:false, count:0 };
  let changed = false;
  let count = 0;
  const nextBlocks = Object.fromEntries(Object.entries(current).map(([blockId, qMap]) => [
    blockId,
    Object.fromEntries(Object.entries(qMap || {}).map(([qId, item]) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [qId, item];
      const nextItem = mapper(item);
      if (nextItem !== item) {
        changed = true;
        count += 1;
      }
      return [qId, nextItem];
    })),
  ]));
  return changed
    ? { queue:{ ...(queue || {}), [id]:nextBlocks }, changed:true, count }
    : { queue, changed:false, count:0 };
};

// Pausar é reversível: datas, estado adaptativo e histórico FSRS permanecem no
// cartão, mas nenhuma questão da aula continua elegível para a fila diária.
export const pauseReviewLesson = ({ queue = {}, aulaId, now = Date.now() }) =>
  mapLessonReviewItems(queue, aulaId, item => {
    if (item.adaptiveState === 'paused') return item;
    const dueDate = finiteDateOrNull(item.dueDate);
    const parkedDueDate = finiteDateOrNull(item.parkedDueDate);
    return {
      ...item,
      adaptiveState:'paused',
      dueDate:null,
      parkedDueDate:dueDate ?? parkedDueDate,
      reviewPause:{
        adaptiveState:item.adaptiveState || null,
        dueDate,
        parkedDueDate,
        pausedAt:now,
      },
    };
  });

const policyBlocksScheduling = policy => !!policy && (
  policy.tier === 'disabled'
  || policy.reviewEligible === false
  || ['deprecated', 'review_required'].includes(policy.status)
);

// Retomar restaura o ponto exato em que cada cartão parou. Se a data venceu
// durante a pausa, a questão reaparece normalmente como vencida.
export const resumeReviewLesson = ({ queue = {}, aulaId, now = Date.now() }) =>
  mapLessonReviewItems(queue, aulaId, item => {
    if (item.adaptiveState !== 'paused') return item;
    const pause = item.reviewPause || {};
    const fallbackState = item.learningPolicy?.tier === 'essential' ? 'core' : 'dormant';
    const previousState = pause.adaptiveState || fallbackState;
    const adaptiveState = policyBlocksScheduling(item.learningPolicy)
      ? 'disabled'
      : item.question?.visualRequirement?.status === 'unresolved' ? 'awaiting-visual' : previousState;
    const scheduled = !['dormant', 'disabled', 'awaiting-curation', 'awaiting-visual', 'paused'].includes(adaptiveState);
    const restoredDueDate = finiteDateOrNull(pause.dueDate)
      ?? finiteDateOrNull(item.parkedDueDate)
      ?? (scheduled ? now : null);
    const { reviewPause:_reviewPause, ...base } = item;
    return {
      ...base,
      adaptiveState,
      dueDate:scheduled ? restoredDueDate : null,
      parkedDueDate:scheduled ? null : (finiteDateOrNull(pause.parkedDueDate) ?? finiteDateOrNull(item.parkedDueDate)),
    };
  });

export const scheduleReviewOutcome = ({ item = {}, correct, now = Date.now() }) => {
  const currentInterval = Math.max(0, Number(item.interval) || 0);
  const interval = correct
    ? Math.min(currentInterval + 1, REVIEW_INTERVAL_DAYS.length - 1)
    : 0;
  return {
    ...item,
    interval,
    dueDate:now + REVIEW_INTERVAL_DAYS[interval] * REVIEW_DAY_MS,
    reviewSeed:Math.floor(Math.random() * 999999),
    schedulerVersion:REVIEW_SCHEDULER_VERSION,
    state:correct && interval === REVIEW_INTERVAL_DAYS.length - 1 ? 'review' : 'learning',
    reps:(Number(item.reps) || 0) + 1,
    lapses:(Number(item.lapses) || 0) + (correct ? 0 : 1),
    lastReview:now,
  };
};

const reviewSessionEntryKey = entry => entry?.item?.cardKey
  || `${entry?.aulaId || ''}/${entry?.blockId || ''}/${entry?.qId || ''}`;

// Um reforço liberado durante a sessão entra uma única vez no fim da fila já
// aberta. Se o aluno já concluiu enquanto o salvamento terminava, a sessão é
// reaberta diretamente no reforço, sem exigir sair e entrar novamente.
export const appendAdaptiveSupportToReviewSession = (session, supportItem) => {
  if (!session || !supportItem?.question) return session;
  const items = Array.isArray(session.items) ? session.items : [];
  const supportKey = reviewSessionEntryKey(supportItem);
  if (items.some(item => reviewSessionEntryKey(item) === supportKey)) return session;
  const allFlashcards = items.length > 0 && items.every(item => !!item?.question?.isFlashcard);
  const allQuestions = items.length > 0 && items.every(item => !item?.question?.isFlashcard);
  if ((allFlashcards && !supportItem.question.isFlashcard)
    || (allQuestions && supportItem.question.isFlashcard)) return session;
  const wasCompleted = !!session.completed;
  return {
    ...session,
    items:[...items, supportItem],
    index:wasCompleted ? items.length : Math.max(0, Math.min(Number(session.index) || 0, items.length)),
    completed:false,
    adaptiveSupportAdded:(Number(session.adaptiveSupportAdded) || 0) + 1,
  };
};

const answerIsCorrect = (question, answer) => {
  if (!answer) return false;
  if (question?.isFlashcard || question?.isCloze) return answer === 'CORRECT';
  if (question?.isOpen) {
    try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(error) { return false; }
  }
  return question?.options?.some(option => option?.isCorrect && option.letter === answer) || false;
};

// Distribui a entrada da aula entre os blocos. Dentro de cada bloco, questões
// erradas vêm antes das não respondidas e das já acertadas.
export const selectLessonReviewSeed = (blocks = [], limit = DEFAULT_LESSON_REVIEW_SIZE) => {
  const queues = blocks.map(block => ({
    ...block,
    rows:(block.questions || [])
      .map((question, index) => {
        const answer = block.answers?.[question.id];
        const priority = answer ? (answerIsCorrect(question, answer) ? 2 : 0) : 1;
        return { blockId:block.blockId, blockTitle:block.title, question, index, priority };
      })
      .sort((left, right) => left.priority - right.priority || left.index - right.index),
  })).filter(block => block.rows.length);
  const selected = [];
  const target = Math.max(1, Number(limit) || DEFAULT_LESSON_REVIEW_SIZE);
  while (selected.length < target && queues.some(block => block.rows.length)) {
    queues.forEach(block => {
      if (selected.length >= target || !block.rows.length) return;
      selected.push(block.rows.shift());
    });
  }
  return selected;
};

export const summarizeReviewQueue = (queue = {}, now = Date.now()) => {
  const items = Object.values(queue || {}).flatMap(blocks =>
    Object.values(blocks || {}).flatMap(qMap => Object.values(qMap || {}))
  ).filter(isReviewQueueItemScheduled);
  const futureDates = items.map(item => Number(item.dueDate)).filter(date => date > now);
  const fsrsRecords = items.map(item => {
    const fsrsState = item.fsrs || item.fsrsShadow;
    const metrics = fsrsState?.metrics;
    const fallbackDelta = fsrsState?.lastComparison?.deltaDays;
    const hasMetrics = Number(metrics?.responses) > 0;
    const responses = Number(metrics?.responses) || (Number.isFinite(Number(fallbackDelta)) ? 1 : 0);
    return responses ? {
      responses,
      earlier:hasMetrics ? Number(metrics.earlier) || 0 : (Number(fallbackDelta) < -0.05 ? 1 : 0),
      same:hasMetrics ? Number(metrics.same) || 0 : (Math.abs(Number(fallbackDelta)) <= 0.05 ? 1 : 0),
      later:hasMetrics ? Number(metrics.later) || 0 : (Number(fallbackDelta) > 0.05 ? 1 : 0),
      deltaDaysTotal:hasMetrics ? Number(metrics.deltaDaysTotal) || 0 : Number(fallbackDelta) || 0,
    } : null;
  }).filter(Boolean);
  const fsrsResponses = fsrsRecords.reduce((sum, record) => sum + record.responses, 0);
  const averageFsrsDeltaDays = fsrsResponses
    ? Math.round(fsrsRecords.reduce((sum, record) => sum + record.deltaDaysTotal, 0) / fsrsResponses * 10) / 10
    : null;
  return {
    total:items.length,
    due:items.filter(item => Number(item.dueDate) <= now).length,
    nextDue:futureDates.length ? Math.min(...futureDates) : null,
    fsrs:{
      compared:fsrsResponses,
      cards:fsrsRecords.length,
      earlier:fsrsRecords.reduce((sum, record) => sum + record.earlier, 0),
      same:fsrsRecords.reduce((sum, record) => sum + record.same, 0),
      later:fsrsRecords.reduce((sum, record) => sum + record.later, 0),
      averageDeltaDays:averageFsrsDeltaDays,
    },
  };
};

const localDaySerial = value => {
  const date = new Date(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / REVIEW_DAY_MS;
};

export const buildReviewForecast = (queue = {}, { now = Date.now(), days = 30 } = {}) => {
  const range = Math.max(1, Math.min(90, Number(days) || 30));
  const todaySerial = localDaySerial(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length:range }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      index,
      date:date.getTime(),
      total:0,
      unseen:0,
      review:0,
    };
  });
  const allItems = Object.values(queue || {}).flatMap(blocks =>
    Object.values(blocks || {}).flatMap(qMap => Object.values(qMap || {}))
  ).filter(Boolean);
  const items = allItems.filter(isReviewQueueItemScheduled);
  let overdue = 0;
  let beyondRange = 0;
  let fsrsActive = 0;
  let awaitingFirstFsrsReview = 0;
  items.forEach(item => {
    const index = localDaySerial(Number(item.dueDate)) - todaySerial;
    const unseen = item.migration?.priorOutcome === 'unseen' && !item.fsrs;
    if (item.fsrs) fsrsActive += 1;
    else awaitingFirstFsrsReview += 1;
    if (index < 0) {
      overdue += 1;
      return;
    }
    if (index >= range) {
      beyondRange += 1;
      return;
    }
    const bucket = buckets[index];
    bucket.total += 1;
    bucket[unseen ? 'unseen' : 'review'] += 1;
  });
  return {
    days:buckets,
    overdue,
    dueNow:items.filter(item => Number(item.dueDate) <= now).length,
    beyondRange,
    total:items.length,
    fsrsActive,
    awaitingFirstFsrsReview,
    adaptive:{
      essentialActive:items.filter(item => item.learningPolicy?.tier === 'essential').length,
      remediationActive:items.filter(item => item.adaptiveState === 'remediation').length,
      complementaryWaiting:allItems.filter(item =>
        item.adaptiveState === 'dormant' && item.learningPolicy?.tier === 'complementary'
      ).length,
      reserveWaiting:allItems.filter(item =>
        item.adaptiveState === 'dormant' && item.learningPolicy?.tier === 'reserve'
      ).length,
      awaitingCuration:allItems.filter(item => item.adaptiveState === 'awaiting-curation').length,
      awaitingVisual:allItems.filter(item => item.adaptiveState === 'awaiting-visual').length,
      disabled:allItems.filter(item => item.adaptiveState === 'disabled').length,
    },
  };
};
