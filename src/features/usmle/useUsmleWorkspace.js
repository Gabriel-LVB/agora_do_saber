import { useCallback, useEffect, useRef, useState } from 'react';
import { deferInteractionWork } from '../../lib/interaction.js';
import { readStorageJson, writeStorageJson, removeStorageItem } from '../../lib/safeStorage.js';
import { watchUsmleCatalog, watchUsmleProgress, watchUsmleSessions, loadUsmleQuestions, saveUsmleSession, saveUsmleAnnotation } from '../../services/usmleStore.js';

export default function useUsmleWorkspace(uid) {
  const [catalog,setCatalog] = useState([]);
  const [progress,setProgress] = useState({});
  const [sessions,setSessions] = useState([]);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  const [syncError,setSyncError] = useState('');
  const [saving,setSaving] = useState(0);
  const [active,setActive] = useState(null);
  const [recovery,setRecovery] = useState(() => readStorageJson(`agora_usmle_draft_${uid}`,null));
  const activeRef = useRef(null), cache = useRef(new Map()), queue = useRef(Promise.resolve());
  const versions = useRef(new Map()), failed = useRef(false), alive = useRef(true);
  const contentRef = useRef([]);
  const draftKey = `agora_usmle_draft_${uid}`;
  useEffect(() => {
    alive.current = true;
    const loaded = new Set();
    const received = key => { loaded.add(key); if (loaded.size === 3) setReady(true); };
    const fail = e => setError(e.code === 'permission-denied' ? 'Acesso USMLE indisponível. Confirme a conta administrativa e a publicação das regras do Firestore.' : 'Não foi possível sincronizar a área USMLE. Verifique sua conexão e tente novamente.');
    const stops = [watchUsmleCatalog((data,confirmed = true) => { setCatalog(data);if (confirmed) received('catalog'); },fail),
      watchUsmleProgress(uid,(data,confirmed = true) => { setProgress(data);if (confirmed) received('progress'); },fail),
      watchUsmleSessions(uid,(data,confirmed = true) => { setSessions(data);if (confirmed) received('sessions'); },fail)];
    return () => { alive.current = false; stops.forEach(stop => stop()); };
  },[uid]);

  const load = useCallback(async (pack,release = pack.release) => {
    const key = `${pack.id}/${release}`;
    if (!cache.current.has(key)) cache.current.set(key,loadUsmleQuestions(pack,release).catch(e => { cache.current.delete(key);throw e; }));
    return cache.current.get(key);
  },[]);
  const clearContentCache = useCallback(() => cache.current.clear(),[]);

  const persist = useCallback((snapshot,questions) => {
    setSaving(n => n+1);
    queue.current = queue.current.then(async () => {
      if (failed.current) return;
      await deferInteractionWork(async () => {
        writeStorageJson(draftKey,activeRef.current || snapshot);
        const saved = await saveUsmleSession(uid,{ ...snapshot,version:versions.current.get(snapshot.id) ?? snapshot.version },questions);
        versions.current.set(snapshot.id,saved.version);
        if (activeRef.current?.id === snapshot.id) {
          const latest = { ...activeRef.current,version:saved.version };
          activeRef.current = latest;
          writeStorageJson(draftKey,latest);
          if (alive.current) setActive(latest);
        }
        if (snapshot.status === 'completed' && activeRef.current?.updatedAt === snapshot.updatedAt) removeStorageItem(draftKey);
      });
    }).catch(e => {
      failed.current = true;
      if (alive.current) setSyncError(e.message || 'Falha ao salvar. Seu bloco permanece neste dispositivo.');
    }).finally(() => { if (alive.current) setSaving(n => Math.max(0,n-1)); });
  },[uid,draftKey]);

  const openSession = useCallback((session,questions,{ save = false } = {}) => {
    failed.current = false; setSyncError('');
    versions.current.set(session.id,session.version);
    contentRef.current = questions;
    activeRef.current = session; setActive(session); setRecovery(null);
    if (save) persist(session,questions);
  },[persist]);

  const updateSession = useCallback(update => {
    const previous = activeRef.current;
    if (!previous || failed.current) return;
    const next = { ...(typeof update === 'function' ? update(previous) : update),updatedAt:Math.max(Date.now(),(previous.updatedAt || 0)+1) };
    activeRef.current = next; setActive(next);
    persist(next,contentRef.current);
  },[persist]);

  const retry = () => { failed.current = false;setSyncError('');if (activeRef.current) persist(activeRef.current,contentRef.current); };
  const closeSession = () => { activeRef.current = null;setActive(null);setRecovery(readStorageJson(draftKey,null)); };
  const annotate = async (key,patch) => {
    const previous = progress[key] || {};
    setProgress(p => ({ ...p,[key]:{ ...p[key],...patch } }));
    try { await deferInteractionWork(() => saveUsmleAnnotation(uid,key,patch)); }
    catch (e) { setProgress(p => ({ ...p,[key]:previous }));throw new Error('Não foi possível salvar a anotação. Tente novamente.'); }
  };
  return { catalog,progress,sessions,ready,error,syncError,saving,active,recovery,load,clearContentCache,openSession,updateSession,closeSession,retry,annotate };
}
