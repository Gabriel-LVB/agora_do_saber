import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { persistReviewQueueChanges } from './reviewQueue.js';

const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const isPersonalReviewDocument = aulaId => String(aulaId || '').startsWith('lib_');

export const isCourseReviewItem = item =>
  item?.source === 'curso' || String(item?.cardKey || '').startsWith('course/');

const countDocumentCards = blocks => Object.values(blocks || {}).reduce(
  (total, qMap) => total + (isObject(qMap) ? Object.keys(qMap).length : 0),
  0,
);

// Revisões pessoais usam documentos lib_*. Documentos das videoaulas usam o ID
// estável da aula; itens modernos também carregam source/cardKey para proteger
// eventuais documentos mistos e permitir a limpeza seletiva.
export const pruneCourseReviewQueue = ({ queue = {}, courseAulaIds = [] } = {}) => {
  const knownCourseIds = new Set((courseAulaIds || []).filter(Boolean).map(String));
  const nextQueue = {};
  const changedEntries = [];
  const removedAulaIds = [];
  let removedCardCount = 0;

  Object.entries(queue || {}).forEach(([aulaId, blocks]) => {
    const wholeDocumentIsCourse = knownCourseIds.has(String(aulaId)) || !isPersonalReviewDocument(aulaId);
    if (wholeDocumentIsCourse) {
      removedCardCount += countDocumentCards(blocks);
      removedAulaIds.push(aulaId);
      return;
    }

    let changed = false;
    const nextBlocks = {};
    Object.entries(blocks || {}).forEach(([blockId, qMap]) => {
      if (!isObject(qMap)) {
        nextBlocks[blockId] = qMap;
        return;
      }
      const nextQuestions = Object.fromEntries(Object.entries(qMap).filter(([, item]) => {
        if (!isCourseReviewItem(item)) return true;
        changed = true;
        removedCardCount += 1;
        return false;
      }));
      if (Object.keys(nextQuestions).length) nextBlocks[blockId] = nextQuestions;
      else if (Object.keys(qMap).length) changed = true;
    });

    if (!Object.keys(nextBlocks).length) {
      if (changed) removedAulaIds.push(aulaId);
      return;
    }
    nextQueue[aulaId] = nextBlocks;
    if (changed) changedEntries.push([aulaId, nextBlocks]);
  });

  return { queue:nextQueue, changedEntries, removedAulaIds, removedCardCount };
};

export const resetCourseReviewQueue = async ({ userId, courseAulaIds = [] }) => {
  if (!userId) throw new Error('USER_MISSING');
  const snapshot = await getDocs(collection(db, 'users', userId, 'vq_review'));
  const queue = Object.fromEntries(snapshot.docs.map(entry => [entry.id, entry.data()]));
  const result = pruneCourseReviewQueue({ queue, courseAulaIds });
  await persistReviewQueueChanges({
    userId,
    changedEntries:result.changedEntries,
    removedAulaIds:result.removedAulaIds,
  });
  return result;
};
