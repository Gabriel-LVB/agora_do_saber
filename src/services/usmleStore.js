import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, limit, query, runTransaction, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanFirestoreData } from '../lib/firestoreData.js';
import { assetId, buildQuestionChunks } from './usmlePackage.js';
import { questionKey, reconcileSessionAnswers, recordableAnswers } from './usmleModel.js';

const userDoc = (uid, collectionName, id) => doc(db,'usmle_users',uid,collectionName,id);
const releaseRootDoc = (packageId,release) => doc(db,'usmle_packages',packageId,'releases',release);
const releaseDoc = (packageId,release,kind,id) => doc(db,'usmle_packages',packageId,'releases',release,kind,id);
export const watchUsmleCatalog = (next,error) => onSnapshot(collection(db,'usmle_packages'), { includeMetadataChanges:true }, snap => next(snap.docs.map(d => ({ ...d.data(), id:d.id })),!snap.metadata.fromCache),error);
export const watchUsmleProgress = (uid,next,error) => onSnapshot(collection(db,'usmle_users',uid,'questions'), { includeMetadataChanges:true }, snap => next(Object.fromEntries(snap.docs.map(d => [d.id,d.data()])),!snap.metadata.fromCache),error);
export const watchUsmleSessions = (uid,next,error) => onSnapshot(query(collection(db,'usmle_users',uid,'sessions'),orderBy('startedAt','desc'),limit(50)), { includeMetadataChanges:true }, snap => next(snap.docs.map(d => ({ ...d.data(),id:d.id })),!snap.metadata.fromCache),error);

export async function publishUsmlePackage(pack,onProgress = () => {}) {
  const parent = doc(db,'usmle_packages',pack.id);
  const previous = await getDoc(parent);
  const previousData = previous.data() || {};
  if (previousData.release === pack.release) {
    await setDoc(releaseRootDoc(pack.id,pack.release),{
      release:pack.release,
      packageId:pack.id,
      chunks:previousData.chunks || [],
      assetCount:Number(previousData.assetCount) || pack.assets.length,
      questionCount:Number(previousData.total) || pack.questions.length,
      createdAt:previousData.importedAt || Date.now(),
    },{ merge:true });
    await setDoc(parent,{ releases:[...new Set([...(previousData.releases || []),pack.release])] },{ merge:true });
    return { duplicate:true };
  }
  const chunks = buildQuestionChunks(pack.questions);
  const writes = [
    ...chunks.map(chunk => ({ ref:releaseDoc(pack.id,pack.release,'chunks',chunk.id),data:chunk })),
    ...pack.assets.map(asset => ({ ref:releaseDoc(pack.id,pack.release,'assets',asset.id),data:asset })),
  ];
  // The parent pointer is committed only after every immutable release document exists.
  // A failed/retried import never replaces a usable package with a partial one.
  let index = 0;
  while (index < writes.length) {
    const batch = writeBatch(db);
    let bytes = 0, count = 0;
    while (index < writes.length && count < 150 && bytes < 3000000) {
      const item = writes[index++];
      batch.set(item.ref,cleanFirestoreData(item.data));
      bytes += JSON.stringify(item.data).length * 2; count++;
    }
    await batch.commit();
    onProgress(Math.round(index/writes.length*95));
  }
  await setDoc(releaseRootDoc(pack.id,pack.release),{
    release:pack.release,
    packageId:pack.id,
    chunks:chunks.map(chunk => chunk.id),
    assetCount:pack.assets.length,
    questionCount:pack.questions.length,
    createdAt:Date.now(),
  },{ merge:true });
  const banks = [...new Set(pack.questions.map(q => q.questionBank))];
  const releases = [...new Set([...(previousData.releases || []),previousData.release,pack.release].filter(Boolean))];
  await setDoc(parent,{ title:pack.title,subject:pack.subject,step:pack.step,release:pack.release,
    published:true,total:pack.questions.length,assetCount:pack.assets.length,banks,warnings:pack.warnings,
    chunks:chunks.map(c => c.id),releases,importedAt:Date.now(),fileName:pack.fileName });
  onProgress(100);
  return { duplicate:false };
}

const commitDeletes = async refs => {
  for (let index = 0; index < refs.length; index += 400) {
    const batch = writeBatch(db);
    refs.slice(index,index + 400).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
};

export async function deleteAllUsmlePackages({ catalog=[],uid='',onProgress=()=>{} } = {}) {
  const releasesByPackage = new Map();
  const remember = (packageId,release) => {
    const normalizedPackageId = String(packageId || '').trim();
    const normalizedRelease = String(release || '').trim();
    if (!normalizedPackageId || !normalizedRelease) return;
    if (!releasesByPackage.has(normalizedPackageId)) releasesByPackage.set(normalizedPackageId,new Set());
    releasesByPackage.get(normalizedPackageId).add(normalizedRelease);
  };
  (catalog || []).forEach(pack => {
    remember(pack?.id,pack?.release);
    (pack?.releases || []).forEach(release => remember(pack?.id,release));
  });
  if (uid) {
    try {
      const sessions = await getDocs(collection(db,'usmle_users',uid,'sessions'));
      sessions.docs.forEach(snapshot => {
        (snapshot.data()?.questionRefs || []).forEach(reference => remember(reference?.packageId,reference?.release));
      });
    } catch(error) {
      // O histórico é apenas uma fonte extra para versões antigas. A remoção dos
      // pacotes atuais não deve falhar se essa leitura auxiliar estiver indisponível.
    }
  }
  const catalogPackageIds = (catalog || []).map(pack => String(pack?.id || '').trim()).filter(Boolean);
  const packageIds = [...new Set([...catalogPackageIds,...releasesByPackage.keys()])];
  let deletedDocuments = 0;
  for (let packageIndex = 0; packageIndex < packageIds.length; packageIndex += 1) {
    const packageId = packageIds[packageIndex];
    const releases = [...(releasesByPackage.get(packageId) || [])];
    for (const release of releases) {
      for (const kind of ['chunks','assets']) {
        const snapshot = await getDocs(collection(db,'usmle_packages',packageId,'releases',release,kind));
        await commitDeletes(snapshot.docs.map(item => item.ref));
        deletedDocuments += snapshot.size;
      }
      await deleteDoc(releaseRootDoc(packageId,release));
      deletedDocuments += 1;
    }
    await deleteDoc(doc(db,'usmle_packages',packageId));
    deletedDocuments += 1;
    onProgress(Math.round(((packageIndex + 1) / Math.max(1,packageIds.length)) * 100));
  }
  return { packages:packageIds.length,releases:[...releasesByPackage.values()].reduce((total,set)=>total + set.size,0),documents:deletedDocuments };
}

export async function loadUsmleQuestions(pack,release = pack.release) {
  let chunks;
  if (release === pack.release) {
    chunks = [];
    for (let i = 0; i < pack.chunks.length; i += 3) {
      const batch = await Promise.all(pack.chunks.slice(i,i+3).map(id => getDoc(releaseDoc(pack.id,release,'chunks',id))));
      if (batch.some(snap => !snap.exists())) throw new Error('O pacote está incompleto. Importe novamente para repará-lo.');
      chunks.push(...batch.map(s => s.data()));
    }
  } else {
    chunks = (await getDocs(collection(db,'usmle_packages',pack.id,'releases',release,'chunks'))).docs.map(d => d.data());
  }
  return chunks.sort((a,b) => a.id.localeCompare(b.id)).flatMap(c => c.questions).map(q => ({ ...q, packageId:pack.id,release,key:questionKey(pack.id,q.id) }));
}

export async function loadUsmleAsset(question,path) {
  const snap = await getDoc(releaseDoc(question.packageId,question.release,'assets',assetId(path)));
  if (!snap.exists()) throw new Error('Imagem ou áudio indisponível. Tente carregar novamente.');
  return snap.data().dataUrl;
}

export const saveUsmleAnnotation = (uid,key,patch) => setDoc(userDoc(uid,'questions',key),cleanFirestoreData(patch),{ merge:true });

export async function saveUsmleSession(uid,session,questions) {
  const ref = userDoc(uid,'sessions',session.id);
  const qMap = new Map(questions.map(q => [q.key,q]));
  return runTransaction(db,async transaction => {
    const previous = await transaction.get(ref);
    const old = previous.data();
    if ((old?.version || 0) !== session.version) throw new Error('Este bloco mudou em outra aba ou dispositivo. Reabra-o pelo histórico para continuar.');
    const entries = recordableAnswers(session,old);
    const progress = await Promise.all(entries.map(([key]) => transaction.get(userDoc(uid,'questions',key))));
    const next = cleanFirestoreData({ ...session,answers:reconcileSessionAnswers(session,old),version:session.version+1,updatedAt:Date.now() });
    entries.forEach(([key,answer],index) => {
      const q = qMap.get(key);
      if (!q) throw new Error('Não foi possível confirmar o conteúdo do bloco. Reabra a sessão.');
      const p = progress[index].data() || {};
      const correct = answer.letter === q.correctAnswer;
      transaction.set(userDoc(uid,'questions',key),{
        lastAnswer:answer.letter,lastCorrect:correct,lastAnsweredAt:answer.answeredAt,attempts:(p.attempts || 0)+1,
        firstCorrect:p.lastAnswer ? !!p.firstCorrect : correct,firstSeconds:p.lastAnswer ? p.firstSeconds || 0 : answer.seconds || 0,
      },{ merge:true });
      next.answers[key] = { ...answer,recorded:true };
    });
    transaction.set(ref,next);
    return next;
  });
}
