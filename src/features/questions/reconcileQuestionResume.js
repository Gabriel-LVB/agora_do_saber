import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase.js';

const isMemory = question => !!(question.isFlashcard || question.isCloze);

export const resumeProgressFromQuestions = (questions, answers, studyKind) => {
  const memory = questions.filter(isMemory);
  const ordinary = questions.filter(question => !isMemory(question));
  const selected = memory.length && ordinary.length
    ? (studyKind === 'flashcards' ? memory : ordinary)
    : questions;
  const allMemory = selected.length > 0 && selected.every(isMemory);
  const completed = Object.fromEntries(selected.filter(question => {
    const answer = answers[question.id];
    if (!answer || answer === 'SKIPPED') return false;
    if (question.isOpen) {
      try { const value = JSON.parse(answer); return !!value?.answer && value?.score != null; } catch { return false; }
    }
    return true;
  }).map(question => [question.id, allMemory ? answers[question.id] : true]));
  const answered = Object.keys(completed).length;
  const complete = allMemory ? selected.every(question => answers[question.id] === 'CORRECT') : answered === selected.length;
  return {answered, total:selected.length, completed:!answered || complete, signature:JSON.stringify(completed)};
};

export const reconcileVisibleQuestionResume = async (userId, key, questions, answers, studyKind, openedAt) => {
  if (!userId || !key || !questions.length) return;
  const progress = resumeProgressFromQuestions(questions, answers, studyKind);
  const ref = doc(db, 'users', userId, 'question_resume', encodeURIComponent(key));
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (!snapshot.exists() || current.updatedAt > openedAt || current.total !== progress.total) return;
    if (current.signature !== progress.signature || !!current.completed !== progress.completed) transaction.update(ref, progress);
  });
};

export const reconcileQuestionResume = async (userId, entry) => {
  if (!userId || !entry?.key) return;
  let questions, answers;
  if (entry.type === 'course') {
    const aulaId = entry.aula?.bunny_id || String(entry.aula?.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 100);
    if (!aulaId) return;
    const snapshot = await getDocFromServer(doc(db, 'users', userId, 'vq_blocks', aulaId));
    const block = snapshot.data()?.blocks?.[entry.blockId];
    questions = block?.questions;
    answers = block?.answers || {};
  } else if (entry.type === 'library' || entry.type === 'quick') {
    const [subjectSnapshot, progressSnapshot] = await Promise.all([
      getDocFromServer(doc(db, 'users', userId, 'library', String(entry.subjectId))),
      getDocFromServer(doc(db, 'users', userId, 'library_progress', `${entry.subjectId}__${entry.topicId}`)),
    ]);
    const topic = subjectSnapshot.data()?.topics?.find(item => String(item.id) === String(entry.topicId));
    if (!topic || topic.origin?.source === 'customStudy') return;
    questions = topic.questions;
    if (topic.questionStorage === 'library-question-chunks-v1') {
      const chunks = await Promise.all((topic.questionChunkIds || []).map(id => getDocFromServer(doc(db, 'users', userId, 'library', String(id)))));
      if (chunks.some(chunk => !chunk.exists())) return;
      questions = chunks.flatMap(chunk => chunk.data()?.questions || []);
    }
    answers = progressSnapshot.exists() && Object.hasOwn(progressSnapshot.data(), 'answers')
      ? progressSnapshot.data().answers || {} : topic.answers || {};
  }
  if (!Array.isArray(questions) || !questions.length) return;
  const progress = resumeProgressFromQuestions(questions, answers, entry.studyKind);
  // Um tamanho diferente pode indicar conteúdo filtrado ou ainda não hidratado.
  if (progress.total !== entry.total) return;
  if (progress.signature === entry.signature && progress.completed === !!entry.completed) return;
  const ref = doc(db, 'users', userId, 'question_resume', encodeURIComponent(entry.key));
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    const data = current.data();
    if (!current.exists() || data.signature !== entry.signature || data.updatedAt !== entry.updatedAt) return;
    transaction.update(ref, progress);
  });
};
