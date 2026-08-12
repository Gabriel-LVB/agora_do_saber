import { doc, writeBatch } from 'firebase/firestore';

import { cleanFirestoreData } from '../lib/firestoreData.js';
import { db } from './firebase.js';
import {
  DISABLED_COURSE_QUESTIONS_CONFIG_DOC,
  DISABLED_COURSE_QUESTIONS_VERSION,
  chunkDisabledCourseQuestionEntries,
  createDisabledCourseQuestionEntry,
  normalizeDisabledCourseQuestions,
  QUESTION_BANK_SIZING_BROAD_REASON,
} from './disabledCourseQuestions.js';

export const DISABLED_COURSE_QUESTION_BATCH_VERSION = 'agora-disabled-course-question-batch-v1';
export const DISABLED_COURSE_QUESTION_BATCH_CONFIG_TYPE = 'disabled-course-question-batch';
const safeIdPart = value => String(value || '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48);

export const entriesFromDisabledCourseQuestionBatchSnapshot = snapshot => {
  const entries = [];
  snapshot?.forEach?.(entry => entries.push(...normalizeDisabledCourseQuestions(entry.data() || [])));
  return normalizeDisabledCourseQuestions(entries);
};

export const prepareQuestionBankSizingDisabledEntries = ({
  entries = [],
  candidates = [],
  disabledAt = Date.now(),
  disabledBy = null,
} = {}) => normalizeDisabledCourseQuestions(
  entries.length
    ? entries
    : (candidates || []).map(candidate => createDisabledCourseQuestionEntry({
        aulaId:candidate?.aulaId,
        lessonId:candidate?.lessonId,
        sharedLibraryItemId:candidate?.sharedLibraryItemId,
        lessonAliases:candidate?.lessonAliases,
        questionId:candidate?.questionId,
        disabledAt,
        disabledBy,
        reason:QUESTION_BANK_SIZING_BROAD_REASON,
      }))
);

export const saveQuestionBankSizingDisabledBatch = async ({
  entries = [],
  candidates = [],
  disabledAt = Date.now(),
  disabledBy = null,
  reportSchema = null,
  reportGeneratedAt = null,
} = {}) => {
  const normalized = prepareQuestionBankSizingDisabledEntries({
    entries,
    candidates,
    disabledAt,
    disabledBy,
  });
  if (!normalized.length) return { runId:null, batchCount:0, entryCount:0, entries:[] };
  const chunks = chunkDisabledCourseQuestionEntries(normalized);
  const createdAt = Date.now();
  const runId = `sizing_${createdAt}_${safeIdPart(disabledBy) || 'admin'}`;
  const batch = writeBatch(db);
  chunks.forEach((chunk, index) => {
    const batchDocId = `${DISABLED_COURSE_QUESTIONS_CONFIG_DOC}__batch__${runId}_${String(index).padStart(3, '0')}`;
    batch.set(doc(db, 'config', batchDocId), cleanFirestoreData({
      configType:DISABLED_COURSE_QUESTION_BATCH_CONFIG_TYPE,
      version:DISABLED_COURSE_QUESTION_BATCH_VERSION,
      runId,
      batchIndex:index,
      batchCount:chunks.length,
      reason:QUESTION_BANK_SIZING_BROAD_REASON,
      entries:chunk,
      entryCount:chunk.length,
      createdAt,
      createdBy:disabledBy || null,
      reportSchema:reportSchema || null,
      reportGeneratedAt:Number(reportGeneratedAt) || null,
    }));
  });
  batch.set(doc(db, 'config', DISABLED_COURSE_QUESTIONS_CONFIG_DOC), cleanFirestoreData({
    version:DISABLED_COURSE_QUESTIONS_VERSION,
    bulkVersion:DISABLED_COURSE_QUESTION_BATCH_VERSION,
    bulkStorage:'config-sibling-v1',
    bulkUpdatedAt:createdAt,
    bulkUpdatedBy:disabledBy || null,
    lastBulkRunId:runId,
    lastBulkAddedCount:normalized.length,
    lastBulkBatchCount:chunks.length,
  }), { merge:true });
  await batch.commit();
  return { runId, batchCount:chunks.length, entryCount:normalized.length, entries:normalized };
};
