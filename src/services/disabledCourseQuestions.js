export const DISABLED_COURSE_QUESTIONS_CONFIG_DOC = 'disabled_course_questions';
export const DISABLED_COURSE_QUESTIONS_VERSION = 'agora-disabled-course-questions-v1';

const cleanId = value => String(value ?? '').trim();

const uniqueIds = values => [...new Set((values || []).map(cleanId).filter(Boolean))];

const questionAliases = ({
  aulaId,
  lessonId,
  sharedLibraryItemId,
  lessonAliases = [],
  question,
} = {}) => uniqueIds([
  aulaId,
  lessonId,
  sharedLibraryItemId,
  ...(lessonAliases || []),
  question?.lessonId,
  question?.sourceLessonId,
  question?._sourceLessonId,
  question?.sharedLibraryItemId,
]);

export const normalizeDisabledCourseQuestions = value => {
  const source = Array.isArray(value) ? value : value?.entries;
  if (!Array.isArray(source)) return [];
  return source.map(entry => {
    const questionId = cleanId(entry?.questionId || entry?.qId);
    const lessonAliases = uniqueIds(entry?.lessonAliases || [
      entry?.aulaId,
      entry?.lessonId,
      entry?.sharedLibraryItemId,
    ]);
    if (!questionId || !lessonAliases.length) return null;
    return {
      ...entry,
      id:cleanId(entry?.id) || `${encodeURIComponent(lessonAliases[0])}::${encodeURIComponent(questionId)}`,
      questionId,
      lessonAliases,
    };
  }).filter(Boolean);
};

export const createDisabledCourseQuestionEntry = ({
  aulaId,
  lessonId,
  sharedLibraryItemId,
  lessonAliases,
  question,
  questionId,
  disabledAt = Date.now(),
  disabledBy = null,
  reason = 'admin-manual',
} = {}) => {
  const cleanQuestionId = cleanId(questionId || question?.id);
  const aliases = questionAliases({ aulaId, lessonId, sharedLibraryItemId, lessonAliases, question });
  if (!cleanQuestionId || !aliases.length) return null;
  return {
    id:`${encodeURIComponent(aliases[0])}::${encodeURIComponent(cleanQuestionId)}`,
    questionId:cleanQuestionId,
    lessonAliases:aliases,
    reason,
    disabledAt,
    disabledBy:disabledBy || null,
    statement:cleanId(question?.statement || question?.question || question?.front).slice(0, 320),
  };
};

const aliasesOverlap = (left = [], right = []) => {
  const rightSet = new Set(uniqueIds(right));
  return uniqueIds(left).some(alias => rightSet.has(alias));
};

export const isCourseQuestionDisabled = (entries, context = {}) => {
  const questionId = cleanId(context.questionId || context.qId || context.question?.id);
  if (!questionId) return false;
  const aliases = questionAliases(context);
  if (!aliases.length) return false;
  const normalizedEntries = Array.isArray(entries)
    && entries.every(entry => entry?.questionId && Array.isArray(entry?.lessonAliases))
    ? entries
    : normalizeDisabledCourseQuestions(entries);
  return normalizedEntries.some(entry =>
    entry.questionId === questionId && aliasesOverlap(entry.lessonAliases, aliases)
  );
};

export const upsertDisabledCourseQuestion = (entries, nextEntry) => {
  const normalized = normalizeDisabledCourseQuestions(entries);
  if (!nextEntry) return normalized;
  const matchIndex = normalized.findIndex(entry =>
    entry.questionId === nextEntry.questionId
    && aliasesOverlap(entry.lessonAliases, nextEntry.lessonAliases)
  );
  if (matchIndex < 0) return [...normalized, nextEntry];
  const next = [...normalized];
  next[matchIndex] = {
    ...next[matchIndex],
    ...nextEntry,
    id:next[matchIndex].id,
    lessonAliases:uniqueIds([
      ...next[matchIndex].lessonAliases,
      ...nextEntry.lessonAliases,
    ]),
  };
  return next;
};

const filterBlock = (block, context) => {
  const questions = Array.isArray(block?.questions) ? block.questions : [];
  const nextQuestions = questions.filter(question => !isCourseQuestionDisabled(context.entries, {
    ...context,
    question,
  }));
  return nextQuestions.length === questions.length ? block : { ...block, questions:nextQuestions };
};

export const filterDisabledCourseQuestionsFromVqBlocks = (vqBlocks = {}, entries = []) => {
  if (!normalizeDisabledCourseQuestions(entries).length) return vqBlocks;
  let changed = false;
  const next = Object.fromEntries(Object.entries(vqBlocks || {}).map(([aulaId, aulaData]) => {
    const context = {
      entries,
      aulaId,
      sharedLibraryItemId:aulaData?.meta?.sharedLibraryItemId,
      lessonId:aulaData?.meta?.lessonId,
    };
    const blocks = aulaData?.blocks;
    let nextBlocks = blocks;
    if (Array.isArray(blocks)) {
      nextBlocks = blocks.map(block => filterBlock(block, context));
      if (nextBlocks.some((block, index) => block !== blocks[index])) changed = true;
    } else if (blocks && typeof blocks === 'object') {
      nextBlocks = Object.fromEntries(Object.entries(blocks).map(([blockId, block]) => [
        blockId,
        filterBlock(block, context),
      ]));
      if (Object.keys(blocks).some(blockId => nextBlocks[blockId] !== blocks[blockId])) changed = true;
    }
    if (nextBlocks === blocks || !changed && nextBlocks === blocks) return [aulaId, aulaData];
    const totalQuestions = Object.values(nextBlocks || {}).reduce(
      (total, block) => total + (Array.isArray(block?.questions) ? block.questions.length : 0),
      0,
    );
    return [aulaId, { ...aulaData, meta:{ ...(aulaData?.meta || {}), totalQuestions }, blocks:nextBlocks }];
  }));
  return changed ? next : vqBlocks;
};

export const disableCourseReviewQueueItems = (queue = {}, entries = [], vqBlocks = {}) => {
  if (!normalizeDisabledCourseQuestions(entries).length) return queue;
  let changed = false;
  const next = Object.fromEntries(Object.entries(queue || {}).map(([aulaId, blocks]) => {
    const aulaData = vqBlocks?.[aulaId];
    const nextBlocks = Object.fromEntries(Object.entries(blocks || {}).map(([blockId, qMap]) => [
      blockId,
      Object.fromEntries(Object.entries(qMap || {}).map(([qId, item]) => {
        const courseItem = item?.source === 'curso' || !String(aulaId).startsWith('lib_');
        const disabled = courseItem && isCourseQuestionDisabled(entries, {
          aulaId,
          sharedLibraryItemId:aulaData?.meta?.sharedLibraryItemId,
          lessonId:aulaData?.meta?.lessonId,
          questionId:qId,
          question:item?.question,
        });
        if (!disabled || item?.globallyDisabled) return [qId, item];
        changed = true;
        return [qId, {
          ...item,
          adaptiveState:'disabled-global',
          dueDate:null,
          parkedDueDate:null,
          globallyDisabled:true,
        }];
      })),
    ]));
    return [aulaId, nextBlocks];
  }));
  return changed ? next : queue;
};

export const pruneDisabledCourseQuestionsFromSession = (session, entries = [], vqBlocks = {}) => {
  if (!session || !Array.isArray(session.items)) return session;
  const items = session.items.filter(item => {
    const aulaData = vqBlocks?.[item?.aulaId];
    return !isCourseQuestionDisabled(entries, {
      aulaId:item?.aulaId,
      sharedLibraryItemId:aulaData?.meta?.sharedLibraryItemId,
      lessonId:aulaData?.meta?.lessonId,
      questionId:item?.qId,
      question:item?.question,
    });
  });
  if (items.length === session.items.length) return session;
  if (!items.length) return null;
  const validKeys = new Set(items.map(item => item?.item?.cardKey || `${item?.aulaId}/${item?.blockId}/${item?.qId}`));
  return {
    ...session,
    items,
    index:Math.max(0, Math.min(Number(session.index) || 0, items.length - 1)),
    sessionAnswers:Object.fromEntries(Object.entries(session.sessionAnswers || {}).filter(([key]) => validKeys.has(key))),
    sessionResults:Object.fromEntries(Object.entries(session.sessionResults || {}).filter(([key]) => validKeys.has(key))),
    completed:false,
  };
};
