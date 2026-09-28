import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { cleanFirestoreData } from '../lib/firestoreData.js';
import { auth, db } from './firebase.js';
import {
  LIBRARY_QUESTION_CHUNK_STORAGE,
  LIBRARY_QUESTION_CHUNK_TYPE,
} from './libraryQuestionChunks.js';

const ASSET_COLLECTION = 'library_assets';
const STORAGE_VERSION = 'library-question-package-v1';
const MAX_QUESTION_CHUNK_BYTES = 650 * 1024;
const MAX_QUESTION_CHUNKS_PER_BLOCK = 400;
const MAX_QUESTION_CHUNK_BATCH_BYTES = 8 * 1024 * 1024;
const assetCache = new Map();

const textBytes = value => new TextEncoder().encode(JSON.stringify(value ?? null)).length;

export const splitLibraryQuestionsIntoChunks = (questions, maxBytes = MAX_QUESTION_CHUNK_BYTES) => {
  const source = Array.isArray(questions) ? questions : [];
  const chunks = [];
  let current = [];
  source.forEach((question, index) => {
    if (textBytes(question) > maxBytes) {
      const error = new Error(`A questão ${index + 1} é grande demais para ser salva. Reduza textos ou imagens embutidas no JSON e gere o pacote novamente.`);
      error.code = 'library-question-too-large';
      throw error;
    }
    const candidate = [...current, question];
    if (current.length && textBytes(candidate) > maxBytes) {
      chunks.push(current);
      current = [question];
    } else current = candidate;
  });
  if (current.length) chunks.push(current);
  if (chunks.length > MAX_QUESTION_CHUNKS_PER_BLOCK) {
    const error = new Error('O pacote possui questões demais para uma única importação. Divida-o em mais de um ZIP.');
    error.code = 'library-question-package-too-large';
    throw error;
  }
  return chunks;
};

const assetRef = (userId, assetId) => doc(db, 'users', userId, ASSET_COLLECTION, assetId);

const currentUserId = () => {
  const userId = String(auth.currentUser?.uid || '').trim();
  if (!userId) throw new Error('Entre novamente para carregar as imagens desta questão.');
  return userId;
};

export const libraryQuestionAssetIds = questions => Array.from(new Set(
  (questions || [])
    .flatMap(question => question?.images || [])
    .filter(image => image?.assetStorage === 'library')
    .map(image => String(image?.assetId || '').trim())
    .filter(Boolean),
));

export async function saveLibraryQuestionAssets({ userId, subjectId, topicId, assets }) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) throw new Error('Entre novamente antes de importar o pacote.');
  const saved = [];
  try {
    for (const asset of Array.isArray(assets) ? assets : []) {
      const reference = doc(collection(db, 'users', normalizedUserId, ASSET_COLLECTION));
      await setDoc(reference, cleanFirestoreData({
        id:reference.id,
        subjectId:String(subjectId || ''),
        topicId:String(topicId || ''),
        file:String(asset?.file || ''),
        fileName:String(asset?.fileName || ''),
        mimeType:String(asset?.mimeType || ''),
        byteLength:Number(asset?.byteLength) || 0,
        dataUrl:String(asset?.dataUrl || ''),
        storageVersion:STORAGE_VERSION,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
      }), { merge:false });
      saved.push({ file:String(asset?.file || ''), assetId:reference.id });
    }
  } catch (error) {
    await deleteLibraryQuestionAssets({
      userId:normalizedUserId,
      assetIds:saved.map(asset => asset.assetId),
    }).catch(() => {});
    throw error;
  }
  return saved;
}

export async function loadLibraryQuestionAsset(assetId) {
  const normalizedAssetId = String(assetId || '').trim();
  if (!normalizedAssetId) throw new Error('A imagem desta questão não possui identificador válido.');
  const userId = currentUserId();
  const cacheKey = `${userId}:${normalizedAssetId}`;
  if (!assetCache.has(cacheKey)) {
    assetCache.set(cacheKey, getDoc(assetRef(userId, normalizedAssetId)).then(snapshot => {
      if (!snapshot.exists()) throw new Error('A imagem desta questão não está mais disponível.');
      const data = snapshot.data() || {};
      const url = String(data.dataUrl || '');
      if (!url) throw new Error('A imagem desta questão está vazia.');
      return {
        id:normalizedAssetId,
        url,
        mimeType:String(data.mimeType || ''),
        fileName:String(data.fileName || ''),
      };
    }).catch(error => {
      assetCache.delete(cacheKey);
      throw error;
    }));
  }
  return assetCache.get(cacheKey);
}

export async function deleteLibraryQuestionAssets({ userId, assetIds }) {
  const normalizedUserId = String(userId || '').trim();
  const uniqueIds = Array.from(new Set((assetIds || []).map(id => String(id || '').trim()).filter(Boolean)));
  if (!normalizedUserId || !uniqueIds.length) return 0;
  uniqueIds.forEach(assetId => assetCache.delete(`${normalizedUserId}:${assetId}`));
  for (let index = 0; index < uniqueIds.length; index += 400) {
    const batch = writeBatch(db);
    uniqueIds.slice(index, index + 400).forEach(assetId => batch.delete(assetRef(normalizedUserId, assetId)));
    await batch.commit();
  }
  return uniqueIds.length;
}

export async function saveLibraryQuestionChunks({ userId, subjectId, topicId, questions }) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) throw new Error('Entre novamente antes de importar o pacote.');
  const questionChunks = splitLibraryQuestionsIntoChunks(questions);
  const references = questionChunks.map(() => doc(collection(db, 'users', normalizedUserId, 'library')));
  const entries = references.map((reference, index) => ({ reference, data:cleanFirestoreData({
    id:reference.id,
    itemType:LIBRARY_QUESTION_CHUNK_TYPE,
    source:'external',
    parentSubjectId:String(subjectId || ''),
    topicId:String(topicId || ''),
    chunkIndex:index,
    chunkCount:references.length,
    questions:questionChunks[index],
    storageVersion:LIBRARY_QUESTION_CHUNK_STORAGE,
    createdAt:Date.now(),
  }) }));
  try {
    for (let start = 0; start < entries.length;) {
      let end = start;
      let batchBytes = 0;
      while (end < entries.length && end - start < 400) {
        const entryBytes = textBytes(entries[end].data);
        if (end > start && batchBytes + entryBytes > MAX_QUESTION_CHUNK_BATCH_BYTES) break;
        batchBytes += entryBytes;
        end += 1;
      }
      const batch = writeBatch(db);
      entries.slice(start,end).forEach(entry => batch.set(entry.reference,entry.data));
      await batch.commit();
      start = end;
    }
  } catch(error) {
    await deleteLibraryQuestionChunks({ userId:normalizedUserId, chunkIds:references.map(reference => reference.id) }).catch(() => {});
    throw error;
  }
  return references.map(reference => reference.id);
}

export async function deleteLibraryQuestionChunks({ userId, chunkIds }) {
  const normalizedUserId = String(userId || '').trim();
  const ids = Array.from(new Set((chunkIds || []).map(id => String(id || '').trim()).filter(Boolean)));
  if (!normalizedUserId || !ids.length) return 0;
  for (let index = 0; index < ids.length; index += 400) {
    const batch = writeBatch(db);
    ids.slice(index,index + 400).forEach(id => batch.delete(doc(db, 'users', normalizedUserId, 'library', id)));
    await batch.commit();
  }
  return ids.length;
}
