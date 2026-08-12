export const DISABLED_COURSE_QUESTIONS_CONFIG_DOC = 'disabled_course_questions';
export const DISABLED_COURSE_QUESTIONS_VERSION = 'agora-disabled-course-questions-v1';
export const NON_CONTENT_COURSE_QUESTION_POLICY = 'agora-non-content-course-question-v1';
export const QUESTION_BANK_SIZING_BROAD_REASON = 'question-bank-sizing-broad-v1';
export const DISABLED_COURSE_QUESTION_BATCH_SIZE = 250;

const disabledIndexCache = new WeakMap();
const normalizedDisabledArrays = new WeakSet();
const normalizedDisabledSourceCache = new WeakMap();

const cleanId = value => String(value ?? '').trim();

const uniqueIds = values => [...new Set((values || []).map(cleanId).filter(Boolean))];

const normalizeSearchText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const NON_CONTENT_PATTERNS = [
  {
    code:'study-importance',
    reason:'Pergunta sobre a importância de estudar o tema',
    pattern:/\b(?:importancia|relevancia|necessidade|beneficio|valor)\b.{0,100}\b(?:estudar|aprender|aprendizado|aprendizagem)\b|\b(?:estudar|aprender|aprendizado|aprendizagem)\b.{0,100}\b(?:importante|fundamental|essencial|relevante)\b/,
  },
  {
    code:'study-why',
    reason:'Pergunta sobre por que estudar ou conhecer o tema',
    pattern:/\bpor que\b.{0,70}\b(?:estudar|compreender|conhecer|aprender)\b|\bjustifica\b.{0,70}\b(?:o estudo|estudar|a inclusao (?:deste|desse|do) tema)\b/,
  },
  {
    code:'lesson-purpose',
    reason:'Pergunta sobre objetivo ou finalidade da aula',
    pattern:/\b(?:objetivo|finalidade|proposito)\b.{0,70}\b(?:aula|videoaula|modulo do curso|curso (?:medico|de medicina|da graduacao|da faculdade))\b|\b(?:aula|videoaula|modulo do curso|curso (?:medico|de medicina|da graduacao|da faculdade))\b.{0,70}\b(?:objetivo|finalidade|proposito)\b|\b(?:objetivo|finalidade|proposito)\b.{0,50}\b(?:de estudar|do estudo (?:deste|desse|do) tema|da aprendizagem)\b/,
  },
  {
    code:'course-relevance',
    reason:'Pergunta sobre a relevância do tema no curso ou na formação',
    pattern:/\b(?:importancia|relevancia|contribuicao|papel)\b.{0,120}\b(?:aula|videoaula|aprendizado|aprendizagem|formacao (?:medica|profissional|do aluno|do estudante)|curso (?:medico|de medicina|da graduacao|da faculdade))\b|\b(?:razao|motivo)\b.{0,80}\b(?:incluir|abordar|apresentar)\b.{0,80}\b(?:aula|videoaula|modulo do curso|curso (?:medico|de medicina|da graduacao|da faculdade))\b/,
  },
  {
    code:'lesson-outcome',
    reason:'Pergunta sobre o aprendizado ou a mensagem da aula',
    pattern:/\b(?:ao final|apos|depois) (?:desta|da) (?:aula|videoaula)\b.{0,100}\b(?:aluno|estudante|aprender|compreender|capaz)\b|\b(?:mensagem|aprendizado) (?:principal|central)\b.{0,80}\b(?:aula|videoaula)\b/,
  },
];

export const detectNonContentCourseQuestion = question => {
  const text = normalizeSearchText([
    question?.statement,
    question?.question,
    question?.front,
    question?.caseContext,
  ].filter(Boolean).join(' '));
  if (!text) return null;
  const match = NON_CONTENT_PATTERNS.find(rule => rule.pattern.test(text));
  return match ? { code:match.code, reason:match.reason } : null;
};

export const findNonContentCourseQuestions = (items = []) => {
  const matches = [];
  const seen = new Set();
  (items || []).forEach(item => {
    [...(item?.directQuestions || []), ...(item?.clinicalQuestions || [])].forEach(question => {
      const detection = detectNonContentCourseQuestion(question);
      const key = `${cleanId(item?.id || item?.lessonId)}::${cleanId(question?.id)}`;
      if (!detection || !question?.id || seen.has(key)) return;
      seen.add(key);
      matches.push({
        aulaId:item?.lessonId || item?.id,
        lessonId:item?.lessonId,
        sharedLibraryItemId:item?.id,
        lessonTitle:cleanId(item?.title),
        question,
        detection,
      });
    });
  });
  return matches;
};

export const createNonContentCourseQuestionPolicyEntry = ({
  enabledAt = Date.now(),
  enabledBy = null,
  matchedCount = 0,
} = {}) => ({
  id:`policy::${NON_CONTENT_COURSE_QUESTION_POLICY}`,
  entryType:'policy',
  policy:NON_CONTENT_COURSE_QUESTION_POLICY,
  enabled:true,
  enabledAt,
  enabledBy:enabledBy || null,
  matchedCount:Math.max(0, Number(matchedCount) || 0),
});

export const isNonContentCourseQuestionPolicyEnabled = entries =>
  normalizeDisabledCourseQuestions(entries).some(entry =>
    entry?.entryType === 'policy'
    && entry?.policy === NON_CONTENT_COURSE_QUESTION_POLICY
    && entry?.enabled !== false
  );

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
  if (Array.isArray(value) && normalizedDisabledArrays.has(value)) return value;
  if (Array.isArray(value) && normalizedDisabledSourceCache.has(value)) {
    return normalizedDisabledSourceCache.get(value);
  }
  const source = Array.isArray(value) ? value : value?.entries;
  if (!Array.isArray(source)) return [];
  const normalized = source.map(entry => {
    if (entry?.entryType === 'policy' && entry?.policy === NON_CONTENT_COURSE_QUESTION_POLICY) {
      return {
        ...entry,
        id:cleanId(entry.id) || `policy::${NON_CONTENT_COURSE_QUESTION_POLICY}`,
        enabled:entry.enabled !== false,
      };
    }
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
  const byId = new Map();
  normalized.forEach(entry => {
    const current = byId.get(entry.id);
    if (!current) {
      byId.set(entry.id, entry);
      return;
    }
    byId.set(entry.id, entry.entryType === 'policy'
      ? { ...current, ...entry, id:current.id }
      : {
          ...current,
          ...entry,
          id:current.id,
          lessonAliases:uniqueIds([...(current.lessonAliases || []), ...(entry.lessonAliases || [])]),
        });
  });
  const result = [...byId.values()];
  normalizedDisabledArrays.add(result);
  if (Array.isArray(value)) normalizedDisabledSourceCache.set(value, result);
  return result;
};

export const mergeDisabledCourseQuestions = (...values) => normalizeDisabledCourseQuestions(
  values.flatMap(value => normalizeDisabledCourseQuestions(value))
);

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

export const createQuestionBankSizingDisabledEntries = ({
  candidates = [],
  disabledAt = Date.now(),
  disabledBy = null,
} = {}) => normalizeDisabledCourseQuestions((candidates || []).map(candidate =>
  createDisabledCourseQuestionEntry({
    aulaId:candidate?.aulaId,
    lessonId:candidate?.lessonId,
    sharedLibraryItemId:candidate?.sharedLibraryItemId,
    lessonAliases:candidate?.lessonAliases,
    questionId:candidate?.questionId,
    disabledAt,
    disabledBy,
    reason:QUESTION_BANK_SIZING_BROAD_REASON,
  })
));

export const chunkDisabledCourseQuestionEntries = (
  entries = [],
  size = DISABLED_COURSE_QUESTION_BATCH_SIZE,
) => {
  const normalized = normalizeDisabledCourseQuestions(entries);
  const safeSize = Math.max(1, Number(size) || DISABLED_COURSE_QUESTION_BATCH_SIZE);
  const chunks = [];
  for (let index = 0; index < normalized.length; index += safeSize) {
    chunks.push(normalized.slice(index, index + safeSize));
  }
  return chunks;
};

const aliasesOverlap = (left = [], right = []) => {
  const rightSet = new Set(uniqueIds(right));
  return uniqueIds(left).some(alias => rightSet.has(alias));
};

const disabledCourseQuestionIndex = entries => {
  const cached = disabledIndexCache.get(entries);
  if (cached) return cached;
  const explicit = new Set();
  const policies = new Set();
  entries.forEach(entry => {
    if (entry?.entryType === 'policy') {
      if (entry.enabled !== false && entry.policy) policies.add(entry.policy);
      return;
    }
    (entry.lessonAliases || []).forEach(alias => {
      explicit.add(`${cleanId(alias)}\u0000${cleanId(entry.questionId)}`);
    });
  });
  const index = { explicit, policies };
  disabledIndexCache.set(entries, index);
  return index;
};

export const isCourseQuestionDisabled = (entries, context = {}) => {
  const normalizedEntries = normalizeDisabledCourseQuestions(entries);
  const index = disabledCourseQuestionIndex(normalizedEntries);
  const policyEnabled = index.policies.has(NON_CONTENT_COURSE_QUESTION_POLICY);
  if (policyEnabled && detectNonContentCourseQuestion(context.question)) return true;
  const questionId = cleanId(context.questionId || context.qId || context.question?.id);
  if (!questionId) return false;
  const aliases = questionAliases(context);
  if (!aliases.length) return false;
  return aliases.some(alias => index.explicit.has(`${cleanId(alias)}\u0000${questionId}`));
};

export const upsertDisabledCourseQuestion = (entries, nextEntry) => {
  const normalized = normalizeDisabledCourseQuestions(entries);
  if (!nextEntry) return normalized;
  if (nextEntry?.entryType === 'policy') {
    const policyIndex = normalized.findIndex(entry =>
      entry?.entryType === 'policy' && entry?.policy === nextEntry.policy
    );
    if (policyIndex < 0) return [...normalized, nextEntry];
    const next = [...normalized];
    next[policyIndex] = { ...next[policyIndex], ...nextEntry, id:next[policyIndex].id };
    return next;
  }
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
