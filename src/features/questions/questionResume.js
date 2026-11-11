import { readStorageJson, writeStorageJson } from '../../lib/safeStorage.js';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { cleanFirestoreData } from '../../lib/firestoreData.js';

const keyFor = userId => `agora_question_resume_${userId}`;
export const readQuestionResume = userId => userId ? (readStorageJson(keyFor(userId), []) || []) : [];

export const buildResumeUpdate = (entries, target, answers, total, now = Date.now(), complete = Object.keys(answers).length >= total) => {
  const answered = Object.keys(answers).length;
  const entry = {...target, signature:JSON.stringify(answers), answered, total, updatedAt:now, completed:answered === 0 || complete};
  const next = entries.filter(item => item.key !== target.key);
  if (!entry.completed) next.unshift(entry);
  return {entry, next:next.slice(0, 30)};
};

export const missingLegacyEntries = (legacy, remote) => {
  const remoteKeys = new Set(remote.map(item => item.key));
  return legacy.filter(item => item?.key && !remoteKeys.has(item.key));
};

let requestedKey = null;
export const requestQuestionResume = key => { requestedKey = key; };
export const consumeQuestionResume = key => {
  if (!key || requestedKey !== key) return false;
  requestedKey = null;
  return true;
};

export const subscribeQuestionResume = (userId, onChange) => {
  const legacyEntries = readQuestionResume(userId);
  let migrated = false;
  return onSnapshot(
  collection(db, 'users', userId, 'question_resume'), { includeMetadataChanges:true },
  snapshot => {
    if (!snapshot.metadata.fromCache && !migrated) {
      migrated = true;
      missingLegacyEntries(legacyEntries, snapshot.docs.map(item => item.data())).forEach(item => {
        setDoc(doc(db, 'users', userId, 'question_resume', encodeURIComponent(item.key)), cleanFirestoreData({...item, completed:false}))
          .catch(error => console.warn('Falha ao migrar retomada:', error));
      });
    }
    const entries = snapshot.docs.map(item => item.data()).filter(item => item.key && !item.completed)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!snapshot.metadata.fromCache) writeStorageJson(keyFor(userId), entries);
    onChange(entries);
  },
  error => { console.warn('Falha ao sincronizar retomada:', error); onChange(readQuestionResume(userId)); },
); };

export const saveQuestionResume = (userId, target, answers, total, complete) => {
  if (!userId || !target?.key || !total) return;
  const entries = readQuestionResume(userId);
  const {entry, next} = buildResumeUpdate(entries, target, answers, total, Date.now(), complete);
  writeStorageJson(keyFor(userId), next);
  setDoc(doc(db, 'users', userId, 'question_resume', encodeURIComponent(target.key)), cleanFirestoreData(entry))
    .catch(error => console.warn('Falha ao salvar retomada:', error));
};
