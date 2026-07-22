import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { cleanFirestoreData } from '../lib/firestoreData.js';
import { db } from './firebase.js';

const CONTENT_COLLECTION = 'famed_content';
const LEGACY_ASSET_COLLECTION = 'famed_assets';

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
  const academiaSubject = cleanFirestoreData({
    ...subject,
    source:'academia',
    storageTarget:'famed',
    famedMeta:{
      ...meta,
      contentId,
      published:published === true,
    },
  });
  await setDoc(doc(db, CONTENT_COLLECTION, contentId), cleanFirestoreData({
    id:contentId,
    scheduleItemId:overrides.scheduleItemId || meta.scheduleItemId || contentId,
    discipline:overrides.discipline || meta.discipline || '',
    semester:overrides.semester || meta.semester || 'S5',
    curriculum:'PPC 2018',
    track:'cardio-pneumo',
    title:academiaSubject.title || overrides.title || '',
    creationMode:'academia',
    academiaSubject,
    published:published === true,
    updatedAt:serverTimestamp(),
  }), { merge:false });
};

export const setFamedContentPublished = async (content, published) => {
  const subject = famedContentToAcademiaSubject(content);
  if (!subject) throw new Error('Conteúdo da Academia não encontrado.');
  await saveFamedAcademiaSubject(subject, { published:published === true });
};

export const deleteFamedContent = async contentId => {
  const id = String(contentId || '').trim();
  if (!id) throw new Error('Aula inválida.');
  await deleteDoc(doc(db, CONTENT_COLLECTION, id));
};

export const deleteLegacyFamedContent = async legacyItems => {
  const legacyIds = (legacyItems || [])
    .filter(item => item?.id && item.creationMode !== 'academia')
    .map(item => String(item.id));
  const assetSnapshot = await getDocs(collection(db, LEGACY_ASSET_COLLECTION));
  const references = [
    ...legacyIds.map(id => doc(db, CONTENT_COLLECTION, id)),
    ...assetSnapshot.docs.map(item => item.ref),
  ];
  for (let index = 0; index < references.length; index += 450) {
    const batch = writeBatch(db);
    references.slice(index, index + 450).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
  return { lessons:legacyIds.length, assets:assetSnapshot.size };
};
