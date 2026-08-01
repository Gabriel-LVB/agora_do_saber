import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import { cleanFirestoreData } from '../lib/firestoreData.js';
import { db } from './firebase.js';

export const QUESTION_METADATA_COLLECTION = 'metadata_chunks';
export const QUESTION_METADATA_MANIFEST_DOC = 'manifest';
export const questionMetadataBatchDocId = index => `batch_${String(index).padStart(3, '0')}`;

const metadataCollection = itemId =>
  collection(db, 'shared_library', String(itemId), QUESTION_METADATA_COLLECTION);

export const loadQuestionMetadataAnalysis = async itemId => {
  const snapshot = await getDocs(metadataCollection(itemId));
  let manifest = null;
  const storedBatches = [];
  const batches = {};
  const metadataByQuestion = {};
  snapshot.forEach(entry => {
    const data = entry.data() || {};
    if (entry.id === QUESTION_METADATA_MANIFEST_DOC) {
      manifest = data;
      return;
    }
    storedBatches.push({ id:entry.id, data });
  });
  const expectedBatchCount = Number(manifest?.batchCount);
  storedBatches.forEach(({ id, data }) => {
    const batchIndex = Number(String(id).replace(/^batch_/, ''));
    const belongsToManifest = !manifest || (
      data.analysisVersion === manifest.analysisVersion
      && data.questionSignature === manifest.questionSignature
      && (!Number.isFinite(expectedBatchCount) || batchIndex < expectedBatchCount)
    );
    if (!belongsToManifest) return;
    batches[id] = data;
    (data.items || []).forEach(item => {
      if (item?.questionId) metadataByQuestion[String(item.questionId)] = item;
    });
  });
  return { manifest, batches, metadataByQuestion };
};

export const loadQuestionMetadataManifest = async itemId => {
  const snapshot = await getDoc(doc(
    db,
    'shared_library',
    String(itemId),
    QUESTION_METADATA_COLLECTION,
    QUESTION_METADATA_MANIFEST_DOC,
  ));
  return snapshot.exists() ? snapshot.data() || null : null;
};

export const saveQuestionMetadataManifest = ({ itemId, manifest }) =>
  setDoc(
    doc(db, 'shared_library', String(itemId), QUESTION_METADATA_COLLECTION, QUESTION_METADATA_MANIFEST_DOC),
    cleanFirestoreData(manifest),
    { merge:true },
  );

export const saveQuestionMetadataBatch = ({ itemId, batchIndex, batch }) =>
  setDoc(
    doc(db, 'shared_library', String(itemId), QUESTION_METADATA_COLLECTION, questionMetadataBatchDocId(batchIndex)),
    cleanFirestoreData(batch),
    { merge:false },
  );

export const publishLearningSelection = ({ itemId, learningSelection }) =>
  setDoc(
    doc(db, 'shared_library', String(itemId)),
    cleanFirestoreData({
      learningSelection,
      learningSelectionUpdatedAt:learningSelection?.publishedAt || Date.now(),
    }),
    { merge:true },
  );
