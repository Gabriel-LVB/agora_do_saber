import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { cleanFirestoreData } from '../lib/firestoreData.js';
import { db } from './firebase.js';

const CONTENT_COLLECTION = 'famed_content';
const ASSET_COLLECTION = 'famed_assets';
const QUESTION_ASSET_VERSION = 'famed-question-package-v1';

const famedTrackForDiscipline = discipline => discipline === 'ABS'
  ? 'abs-gestante-rn'
  : ['Gastroenterologia','Endocrinologia'].includes(discipline)
    ? 'gastro-endocrino'
    : 'cardio-pneumo';

const famedAssetIdsFromSubject = subject => Array.from(new Set(
  (subject?.famedStudy?.pastQuestionSets || [])
    .flatMap(set => set?.questions || [])
    .flatMap(question => question?.images || [])
    .map(image => String(image?.assetId || '').trim())
    .filter(Boolean),
));

const setFamedAssetsPublished = async (assetIds, published) => {
  for (let index = 0; index < assetIds.length; index += 400) {
    const batch = writeBatch(db);
    assetIds.slice(index,index + 400).forEach(assetId => batch.update(doc(db, ASSET_COLLECTION, assetId), {
      published:published === true,
      updatedAt:serverTimestamp(),
    }));
    await batch.commit();
  }
};

export const subscribeFamedContent = ({ isAdmin=false, onData, onError }) => {
  const source = isAdmin
    ? collection(db, CONTENT_COLLECTION)
    : query(collection(db, CONTENT_COLLECTION), where('published', '==', true));
  return onSnapshot(source, snapshot => {
    const items = snapshot.docs
      .map(item => ({ id:item.id, ...item.data() }))
      .filter(item => isAdmin || (item.published === true && item.creationMode === 'academia'));
    onData?.(items);
  }, error => onError?.(error));
};

export const famedContentToAcademiaSubject = content => {
  if (!content?.academiaSubject) return null;
  return {
    ...content.academiaSubject,
    source:'academia',
    storageTarget:'famed',
    famedMeta:{
      contentId:content.id,
      scheduleItemId:content.scheduleItemId,
      discipline:content.discipline,
      track:content.track || famedTrackForDiscipline(content.discipline),
      semester:content.semester || 'S5',
      published:content.published === true,
    },
  };
};

export const saveFamedAcademiaSubject = async (subject, overrides={}) => {
  const meta = subject?.famedMeta || {};
  const contentId = String(overrides.contentId || meta.contentId || meta.scheduleItemId || '').trim();
  if (!contentId) throw new Error('A aula da FAMED não possui identificador válido.');
  const published = overrides.published ?? meta.published ?? false;
  const discipline = overrides.discipline || meta.discipline || '';
  const track = overrides.track || meta.track || famedTrackForDiscipline(discipline);
  const academiaSubject = cleanFirestoreData({
    ...subject,
    source:'academia',
    storageTarget:'famed',
    famedMeta:{
      ...meta,
      contentId,
      discipline,
      track,
      published:published === true,
    },
  });
  const payload = cleanFirestoreData({
    id:contentId,
    scheduleItemId:overrides.scheduleItemId || meta.scheduleItemId || contentId,
    discipline,
    semester:overrides.semester || meta.semester || 'S5',
    curriculum:'PPC 2018',
    track,
    title:academiaSubject.title || overrides.title || '',
    creationMode:'academia',
    academiaSubject,
    published:published === true,
    updatedAt:serverTimestamp(),
  });
  const assetIds = famedAssetIdsFromSubject(academiaSubject);
  if (published === true && assetIds.length) await setFamedAssetsPublished(assetIds,true);
  await setDoc(doc(db, CONTENT_COLLECTION, contentId), payload, { merge:false });
  if (published !== true && assetIds.length) await setFamedAssetsPublished(assetIds,false);
};

export const setFamedContentPublished = async (content, published) => {
  const subject = famedContentToAcademiaSubject(content);
  if (!subject) throw new Error('Conteúdo da Academia não encontrado.');
  await saveFamedAcademiaSubject(subject, { published:published === true });
};

export const deleteFamedContent = async contentId => {
  const id = String(contentId || '').trim();
  if (!id) throw new Error('Aula inválida.');
  const assetSnapshot = await getDocs(query(collection(db, ASSET_COLLECTION), where('contentId','==',id)));
  for (let index = 0; index < assetSnapshot.docs.length; index += 400) {
    const batch = writeBatch(db);
    assetSnapshot.docs.slice(index,index + 400).forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, CONTENT_COLLECTION, id));
};

export const saveFamedQuestionAssets = async ({ contentId, setId, assets, published=false }) => {
  const normalizedContentId = String(contentId || '').trim();
  const normalizedSetId = String(setId || '').trim();
  if (!normalizedContentId || !normalizedSetId) throw new Error('O pacote de questões não possui destino válido.');
  const saved = [];
  const sourceAssets = Array.isArray(assets) ? assets : [];
  try {
    for (const asset of sourceAssets) {
      const reference = doc(collection(db, ASSET_COLLECTION));
      await setDoc(reference, cleanFirestoreData({
        id:reference.id,
        contentId:normalizedContentId,
        setId:normalizedSetId,
        file:String(asset.file || ''),
        fileName:String(asset.fileName || ''),
        mimeType:String(asset.mimeType || ''),
        byteLength:Number(asset.byteLength) || 0,
        dataUrl:String(asset.dataUrl || ''),
        published:published === true,
        storageVersion:QUESTION_ASSET_VERSION,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
      }), { merge:false });
      saved.push({ file:String(asset.file || ''), assetId:reference.id });
    }
  } catch(error) {
    try { await deleteFamedQuestionAssets(saved.map(asset => asset.assetId)); } catch(cleanupError) {}
    throw error;
  }
  return saved;
};

export const loadFamedQuestionAssets = async assetIds => {
  const uniqueIds = Array.from(new Set((assetIds || []).map(id => String(id || '').trim()).filter(Boolean)));
  const entries = await Promise.all(uniqueIds.map(async assetId => {
    const snapshot = await getDoc(doc(db, ASSET_COLLECTION, assetId));
    if (!snapshot.exists()) return [assetId,null];
    const data = snapshot.data();
    return [assetId,{
      id:assetId,
      url:String(data.dataUrl || ''),
      mimeType:String(data.mimeType || ''),
      fileName:String(data.fileName || ''),
    }];
  }));
  return Object.fromEntries(entries.filter(([,asset])=>asset?.url));
};

export const deleteFamedQuestionAssets = async assetIds => {
  const uniqueIds = Array.from(new Set((assetIds || []).map(id => String(id || '').trim()).filter(Boolean)));
  for (let index = 0; index < uniqueIds.length; index += 400) {
    const batch = writeBatch(db);
    uniqueIds.slice(index,index + 400).forEach(assetId => batch.delete(doc(db, ASSET_COLLECTION, assetId)));
    await batch.commit();
  }
  return uniqueIds.length;
};

export const deleteLegacyFamedContent = async legacyItems => {
  const legacyIds = (legacyItems || [])
    .filter(item => item?.id && item.creationMode !== 'academia')
    .map(item => String(item.id));
  const assetSnapshot = await getDocs(collection(db, ASSET_COLLECTION));
  const legacyAssetDocs = assetSnapshot.docs.filter(item => {
    const data = item.data() || {};
    if (data.storageVersion === QUESTION_ASSET_VERSION) return false;
    const ownerId = String(data.contentId || data.lessonId || '').trim();
    return !ownerId || legacyIds.includes(ownerId);
  });
  const references = [
    ...legacyIds.map(id => doc(db, CONTENT_COLLECTION, id)),
    ...legacyAssetDocs.map(item => item.ref),
  ];
  for (let index = 0; index < references.length; index += 450) {
    const batch = writeBatch(db);
    references.slice(index, index + 450).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
  return { lessons:legacyIds.length, assets:legacyAssetDocs.length };
};
