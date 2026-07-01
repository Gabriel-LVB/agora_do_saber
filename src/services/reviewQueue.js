import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanFirestoreData } from '../lib/firestoreData.js';

const REVIEW_COLLECTION = 'vq_review';

const reviewDoc = (userId, aulaId) =>
  doc(db, 'users', userId, REVIEW_COLLECTION, String(aulaId));

export const saveReviewAulaQueue = ({ userId, aulaId, data }) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!aulaId) throw new Error('AULA_MISSING');
  return setDoc(reviewDoc(userId, aulaId), cleanFirestoreData(data || {}));
};

export const deleteReviewAulaQueue = ({ userId, aulaId }) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!aulaId) throw new Error('AULA_MISSING');
  return deleteDoc(reviewDoc(userId, aulaId));
};

export const persistReviewQueueChanges = async ({ userId, changedEntries = [], removedAulaIds = [] }) => {
  if (!userId) throw new Error('USER_MISSING');
  await Promise.all([
    ...changedEntries.map(([aulaId, data]) => saveReviewAulaQueue({ userId, aulaId, data })),
    ...removedAulaIds.map(aulaId => deleteReviewAulaQueue({ userId, aulaId })),
  ]);
};
