import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanFirestoreData } from '../lib/firestoreData.js';

export const saveUserVqBlockPatch = async ({ userId, aulaId, blockId, patch }) => {
  if (!userId) throw new Error('USER_MISSING');
  await setDoc(
    doc(db, 'users', userId, 'vq_blocks', String(aulaId)),
    cleanFirestoreData({ blocks:{ [blockId]:patch } }),
    { merge:true }
  );
};
