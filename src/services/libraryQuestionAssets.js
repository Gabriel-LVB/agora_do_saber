import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { cleanFirestoreData } from '../lib/firestoreData.js';
import { auth, db } from './firebase.js';

const ASSET_COLLECTION = 'library_assets';
const STORAGE_VERSION = 'library-question-package-v1';
const assetCache = new Map();

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
