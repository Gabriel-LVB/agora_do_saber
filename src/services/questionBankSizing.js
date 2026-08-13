import { auditQuestionCollection, collectAuditableQuestions } from './questionAudit.js';
import { isCourseQuestionDisabled, normalizeDisabledCourseQuestions } from './disabledCourseQuestions.js';
import {
  flattenSharedLibraryQuestions,
  LEARNING_SELECTION_VERSION,
  questionSetSignature,
} from './questionMetadata.js';

export const QUESTION_BANK_SIZING_VERSION = 'agora-question-bank-sizing-v2';
export const QUESTION_BANK_CURATED_HIGH_YIELD_REASON = 'question-bank-sizing-curated-high-yield-v1';

const emptyCountMap = keys => Object.fromEntries(keys.map(key => [key, 0]));
const increment = (counts, key) => {
  counts[key] = (counts[key] || 0) + 1;
};
const questionKey = (itemId, kind, questionId) => `library|${itemId}|${kind}|${questionId}`;
const questionKind = question => question?.libraryQuestionKind === 'clinical' ? 'clinical' : 'direct';
const isSelectionCurrent = (item, questions) => item?.learningSelection?.version === LEARNING_SELECTION_VERSION
  && item.learningSelection.questionSignature === questionSetSignature(questions)
  && item.learningSelection.questionPolicies
  && typeof item.learningSelection.questionPolicies === 'object';

const qualityBand = quality => {
  if (quality < 60) return 'below60';
  if (quality < 75) return 'usable60to74';
  if (quality < 90) return 'strong75to89';
  return 'exceptional90plus';
};

const isHardMetadataExclusion = policy => policy?.tier === 'disabled'
  || policy?.reviewEligible === false
  || ['deprecated', 'review_required'].includes(policy?.status);

const isStrongMetadataCandidate = policy => !!policy && (
  isHardMetadataExclusion(policy)
  || Number(policy.qualityScore) < 60
  || (
    policy.tier === 'reserve'
    && (
      Number(policy.importance) <= 2
      || ['variation', 'exam_only'].includes(policy.learningRole)
      || (
        Number(policy.redundancyScore) >= 0.75
        && policy.canonicalQuestionId
      )
    )
  )
);

const isReviewCore = policy => policy?.tier === 'essential'
  && policy.reviewEligible !== false
  && !['deprecated', 'review_required'].includes(policy.status);

export const isCuratedHighYieldKeeper = policy => !!policy
  && !isHardMetadataExclusion(policy)
  && (
    policy.tier === 'essential'
    || Number(policy.importance) === 5
    || (Number(policy.importance) === 4 && Number(policy.qualityScore) >= 90)
  );

const keeperScore = row => {
  const policy = row?.policy;
  if (!policy) return 0;
  const tierScore = { essential:400, complementary:260, reserve:100, disabled:-100 }[policy.tier] || 0;
  const canonicalBonus = policy.canonicalQuestionId === row.questionId ? 80 : 0;
  return tierScore
    + (Number(policy.importance) || 0) * 20
    + (Number(policy.qualityScore) || 0)
    + canonicalBonus
    - (Number(policy.redundancyScore) || 0) * 25;
};

const countSetByKind = (keys, rowByKey) => {
  const counts = { total:keys.size, direct:0, clinical:0 };
  keys.forEach(key => increment(counts, rowByKey.get(key)?.kind || 'unknown'));
  return counts;
};

const buildDuplicateExcess = ({ issues, rowByKey }) => {
  const parent = new Map();
  const find = key => {
    if (!parent.has(key)) parent.set(key, key);
    const current = parent.get(key);
    if (current === key) return key;
    const root = find(current);
    parent.set(key, root);
    return root;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  const probable = issues.filter(issue => issue.severity === 'probable');
  probable.forEach(issue => union(issue.left.key, issue.right.key));
  const groupsByRoot = new Map();
  parent.forEach((value, key) => {
    const root = find(key);
    groupsByRoot.set(root, [...(groupsByRoot.get(root) || []), key]);
  });
  const groups = [...groupsByRoot.values()].filter(group => group.length > 1);
  const excess = new Set();
  groups.forEach(group => {
    const ranked = [...group].sort((left, right) =>
      keeperScore(rowByKey.get(right)) - keeperScore(rowByKey.get(left))
      || left.localeCompare(right)
    );
    ranked.slice(1).forEach(key => excess.add(key));
  });
  return {
    pairCount:probable.length,
    groupCount:groups.length,
    exactPairCount:probable.filter(issue => issue.exact).length,
    excess,
  };
};

const unionSets = (...sets) => {
  const result = new Set();
  sets.forEach(set => set.forEach(value => result.add(value)));
  return result;
};

export const buildQuestionBankSizingReport = ({
  sharedLibraryItems = [],
  disabledCourseQuestions = [],
  onProgress = () => {},
} = {}) => {
  const rows = [];
  const rowByKey = new Map();
  const lessons = { total:0, curated:0, pending:0 };
  const tier = emptyCountMap(['essential', 'complementary', 'reserve', 'disabled', 'uncurated']);
  const importance = emptyCountMap(['1', '2', '3', '4', '5', 'uncurated']);
  const quality = emptyCountMap(['below60', 'usable60to74', 'strong75to89', 'exceptional90plus', 'uncurated']);
  const learningRole = emptyCountMap(['core', 'reinforcement', 'variation', 'exam_only', 'uncurated']);
  const cognitiveLevel = emptyCountMap(['recognition', 'understanding', 'application', 'reasoning', 'uncurated']);
  const status = emptyCountMap(['active', 'reserve', 'deprecated', 'review_required', 'uncurated']);
  const kind = { direct:0, clinical:0 };
  const inactive = { total:0, direct:0, clinical:0 };
  const reviewCore = new Set();
  const highYieldEssential = new Set();
  const highYieldIndispensable = new Set();
  const highYieldImportantExceptional = new Set();
  const highYieldKeep = new Set();
  const highYieldRemoval = new Set();
  const hardMetadata = new Set();
  const strongMetadata = new Set();
  const broadMetadata = new Set();
  const highCurationRedundancy = new Set();

  const normalizedDisabled = normalizeDisabledCourseQuestions(disabledCourseQuestions);
  sharedLibraryItems.forEach(item => {
    const questions = flattenSharedLibraryQuestions(item);
    if (!questions.length) return;
    lessons.total += 1;
    const selectionCurrent = isSelectionCurrent(item, questions);
    if (selectionCurrent) lessons.curated += 1;
    else lessons.pending += 1;
    questions.forEach(question => {
      const qKind = questionKind(question);
      const lessonAliases = [...new Set([
        item?.id,
        item?.lessonId,
        item?.sourceLessonId,
        item?.bunny_id,
        item?.sourceBunnyId,
      ].filter(Boolean).map(String))];
      if (isCourseQuestionDisabled(normalizedDisabled, {
        aulaId:item?.lessonId || item?.id,
        lessonId:item?.lessonId,
        sharedLibraryItemId:item?.id,
        lessonAliases,
        question,
      })) {
        inactive.total += 1;
        increment(inactive, qKind);
        return;
      }
      const policy = selectionCurrent
        ? item.learningSelection.questionPolicies[String(question.id)] || null
        : null;
      const key = questionKey(item.id, qKind, question.id);
      const row = {
        key,
        itemId:String(item.id),
        questionId:String(question.id),
        subject:String(item.subject || 'Sem matéria'),
        kind:qKind,
        policy,
        aulaId:String(item?.lessonId || item?.id || ''),
        lessonId:item?.lessonId ? String(item.lessonId) : null,
        sharedLibraryItemId:String(item?.id || ''),
        lessonAliases,
      };
      rows.push(row);
      rowByKey.set(key, row);
      increment(kind, qKind);
      if (!policy) {
        increment(tier, 'uncurated');
        increment(importance, 'uncurated');
        increment(quality, 'uncurated');
        increment(learningRole, 'uncurated');
        increment(cognitiveLevel, 'uncurated');
        increment(status, 'uncurated');
        return;
      }
      increment(tier, policy.tier || 'uncurated');
      increment(importance, String(policy.importance || 'uncurated'));
      increment(quality, qualityBand(Number(policy.qualityScore) || 0));
      increment(learningRole, policy.learningRole || 'uncurated');
      increment(cognitiveLevel, policy.cognitiveLevel || 'uncurated');
      increment(status, policy.status || 'uncurated');
      if (isReviewCore(policy)) reviewCore.add(key);
      const policyEligible = !isHardMetadataExclusion(policy);
      if (policyEligible && policy.tier === 'essential') highYieldEssential.add(key);
      if (policyEligible && Number(policy.importance) === 5) highYieldIndispensable.add(key);
      if (policyEligible && Number(policy.importance) === 4 && Number(policy.qualityScore) >= 90) {
        highYieldImportantExceptional.add(key);
      }
      if (isCuratedHighYieldKeeper(policy)) highYieldKeep.add(key);
      else highYieldRemoval.add(key);
      if (isHardMetadataExclusion(policy)) hardMetadata.add(key);
      if (isStrongMetadataCandidate(policy)) strongMetadata.add(key);
      if (isStrongMetadataCandidate(policy) || ['reserve', 'disabled'].includes(policy.tier)) broadMetadata.add(key);
      if (
        Number(policy.redundancyScore) >= 0.75
        && policy.canonicalQuestionId
        && String(policy.canonicalQuestionId) !== String(question.id)
      ) highCurationRedundancy.add(key);
    });
  });

  const activeKeys = new Set(rows.map(row => row.key));
  const activeItems = sharedLibraryItems.map(item => ({
    ...item,
    directQuestions:(item?.directQuestions || []).filter(question =>
      activeKeys.has(questionKey(item.id, 'direct', question?.id))
    ),
    clinicalQuestions:(item?.clinicalQuestions || []).filter(question =>
      activeKeys.has(questionKey(item.id, 'clinical', question?.id))
    ),
  }));
  const auditRecords = collectAuditableQuestions({ sharedLibraryItems:activeItems, vqBlocks:{} });
  const recordsBySubject = new Map();
  auditRecords.forEach(record => {
    recordsBySubject.set(record.subject, [...(recordsBySubject.get(record.subject) || []), record]);
  });
  const subjects = [...recordsBySubject.keys()].sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const probableIssues = [];
  subjects.forEach((subject, index) => {
    const audit = auditQuestionCollection(recordsBySubject.get(subject));
    probableIssues.push(...audit.issues.filter(issue => issue.severity === 'probable'));
    onProgress({ current:index + 1, total:subjects.length, subject });
  });
  const duplicates = buildDuplicateExcess({ issues:probableIssues, rowByKey });
  const conservativeCombined = unionSets(strongMetadata, duplicates.excess);
  const broadCombined = unionSets(broadMetadata, duplicates.excess);

  const bySubject = new Map();
  rows.forEach(row => {
    const current = bySubject.get(row.subject) || {
      subject:row.subject,
      total:0,
      direct:0,
      clinical:0,
      curated:0,
      essential:0,
      conservative:0,
      broad:0,
      duplicateExcess:0,
      conservativeCombined:0,
      broadCombined:0,
      highYieldKeep:0,
      highYieldRemoval:0,
    };
    current.total += 1;
    current[row.kind] += 1;
    if (row.policy) current.curated += 1;
    if (reviewCore.has(row.key)) current.essential += 1;
    if (strongMetadata.has(row.key)) current.conservative += 1;
    if (broadMetadata.has(row.key)) current.broad += 1;
    if (duplicates.excess.has(row.key)) current.duplicateExcess += 1;
    if (conservativeCombined.has(row.key)) current.conservativeCombined += 1;
    if (broadCombined.has(row.key)) current.broadCombined += 1;
    if (highYieldKeep.has(row.key)) current.highYieldKeep += 1;
    if (highYieldRemoval.has(row.key)) current.highYieldRemoval += 1;
    bySubject.set(row.subject, current);
  });

  const curatedQuestions = rows.filter(row => row.policy).length;
  const broadCandidates = [...broadCombined].map(key => rowByKey.get(key)).filter(Boolean).map(row => ({
    aulaId:row.aulaId,
    lessonId:row.lessonId,
    sharedLibraryItemId:row.sharedLibraryItemId,
    lessonAliases:row.lessonAliases,
    questionId:row.questionId,
    kind:row.kind,
  }));
  const highYieldRemovalCandidates = [...highYieldRemoval].map(key => rowByKey.get(key)).filter(Boolean).map(row => ({
    aulaId:row.aulaId,
    lessonId:row.lessonId,
    sharedLibraryItemId:row.sharedLibraryItemId,
    lessonAliases:row.lessonAliases,
    questionId:row.questionId,
    kind:row.kind,
  }));
  return {
    schema:QUESTION_BANK_SIZING_VERSION,
    generatedAt:Date.now(),
    inventory:{
      total:rows.length,
      stored:rows.length + inactive.total,
      alreadyInactive:inactive.total,
      alreadyInactiveDirect:inactive.direct,
      alreadyInactiveClinical:inactive.clinical,
      direct:kind.direct,
      clinical:kind.clinical,
      curated:curatedQuestions,
      pending:rows.length - curatedQuestions,
      lessons,
    },
    breakdowns:{ tier, importance, quality, learningRole, cognitiveLevel, status },
    review:{
      essential:countSetByKind(reviewCore, rowByKey),
    },
    highYield:{
      essential:countSetByKind(highYieldEssential, rowByKey),
      indispensable:countSetByKind(highYieldIndispensable, rowByKey),
      importantExceptional:countSetByKind(highYieldImportantExceptional, rowByKey),
      keep:countSetByKind(highYieldKeep, rowByKey),
      remove:countSetByKind(highYieldRemoval, rowByKey),
    },
    removal:{
      hardMetadata:countSetByKind(hardMetadata, rowByKey),
      conservativeMetadata:countSetByKind(strongMetadata, rowByKey),
      broadMetadata:countSetByKind(broadMetadata, rowByKey),
      highCurationRedundancy:countSetByKind(highCurationRedundancy, rowByKey),
      probableDuplicates:{
        ...countSetByKind(duplicates.excess, rowByKey),
        pairCount:duplicates.pairCount,
        exactPairCount:duplicates.exactPairCount,
        groupCount:duplicates.groupCount,
      },
      conservativeCombined:countSetByKind(conservativeCombined, rowByKey),
      broadCombined:countSetByKind(broadCombined, rowByKey),
    },
    subjects:[...bySubject.values()].sort((left, right) =>
      right.total - left.total || left.subject.localeCompare(right.subject, 'pt-BR')
    ),
    actions:{
      broadCandidates,
      highYieldRemovalCandidates,
      highYieldRemovalReason:QUESTION_BANK_CURATED_HIGH_YIELD_REASON,
    },
  };
};
