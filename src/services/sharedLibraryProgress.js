import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanFirestoreData } from '../lib/firestoreData.js';

const SHARED_LIBRARY_PROGRESS_COLLECTION = 'shared_library_progress';

const sharedLibraryProgressDoc = (userId, itemId) =>
  doc(db, 'users', userId, SHARED_LIBRARY_PROGRESS_COLLECTION, String(itemId));

export const saveSharedLibraryProgressPatch = async ({ userId, itemId, patch }) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!itemId) throw new Error('ITEM_MISSING');
  await setDoc(
    sharedLibraryProgressDoc(userId, itemId),
    cleanFirestoreData(patch),
    { merge:true }
  );
};

export const saveSharedLibraryAnswerPatch = ({ userId, itemId, questionId, letter, updatedAt = Date.now() }) =>
  saveSharedLibraryProgressPatch({
    userId,
    itemId,
    patch:{
      answers:{ [questionId]:letter },
      updatedAt,
    },
  });

export const resetSharedLibraryAnswersPatch = async ({ userId, itemId, updatedAt = Date.now() }) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!itemId) throw new Error('ITEM_MISSING');
  await setDoc(
    sharedLibraryProgressDoc(userId, itemId),
    cleanFirestoreData({
      answers:{},
      updatedAt,
    })
  );
};
