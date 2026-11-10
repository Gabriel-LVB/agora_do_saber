import { readStorageJson, writeStorageJson } from '../../lib/safeStorage.js';

const keyFor = userId => `agora_question_resume_${userId}`;
export const readQuestionResume = userId => userId ? (readStorageJson(keyFor(userId), []) || []) : [];

export const saveQuestionResume = (userId, target, answers, total) => {
  if (!userId || !target?.key || !total) return;
  const entries = readQuestionResume(userId);
  const signature = JSON.stringify(answers);
  const previous = entries.find(entry => entry.key === target.key);
  if (!previous && !Object.keys(answers).length) return;
  if (previous?.signature === signature && previous.total === total) return;
  const next = entries.filter(entry => entry.key !== target.key);
  if (Object.keys(answers).length > 0 && Object.keys(answers).length < total) {
    next.unshift({...target, signature, answered:Object.keys(answers).length, total, updatedAt:Date.now()});
  }
  writeStorageJson(keyFor(userId), next.slice(0, 30));
};
