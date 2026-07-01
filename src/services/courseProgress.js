import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanFirestoreData } from '../lib/firestoreData.js';

export const saveWatchedAulas = ({ userId, watched }) => {
  if (!userId) throw new Error('USER_MISSING');
  return setDoc(
    doc(db, 'users', userId, 'videoaulas_progress', 'watched'),
    cleanFirestoreData(watched || {})
  );
};

export const saveDailyStats = ({ userId, stats }) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!stats?.date) throw new Error('DATE_MISSING');
  return setDoc(
    doc(db, 'users', userId, 'daily_stats', stats.date),
    cleanFirestoreData(stats),
    { merge:false }
  );
};
