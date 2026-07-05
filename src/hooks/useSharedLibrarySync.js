import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '../services/firebase.js';
import { mergeSharedLibraryQuestionChunks, SHARED_LIBRARY_CHUNKS_COLLECTION } from '../services/sharedLibraryContent.js';

const withFirestoreTimeout = (promise, ms = 15000) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('timeout');
      error.code = 'timeout';
      reject(error);
    }, ms);
  }),
]);

export const useSharedLibrarySync = ({
  addToast,
  canReadSharedLibrary,
  configDocId = 'shared_library_automation',
  contentCollection = 'shared_library',
  isAdmin,
  loadProgress = true,
  progressCollection = 'shared_library_progress',
  showLoadErrors = true,
  user,
}) => {
  const addToastRef = useRef(addToast);
  const [sharedLibraryItems, setSharedLibraryItems] = useState([]);
  const [sharedLibraryLoading, setSharedLibraryLoading] = useState(false);
  const [sharedLibraryError, setSharedLibraryError] = useState('');
  const [sharedLibraryTab, setSharedLibraryTab] = useState('apostila');
  const [sharedLibrarySubject, setSharedLibrarySubject] = useState('all');
  const [sharedLibrarySearch, setSharedLibrarySearch] = useState('');
  const [sharedLibraryActiveItemId, setSharedLibraryActiveItemId] = useState(null);
  const [sharedLibraryProgress, setSharedLibraryProgress] = useState({});
  const [sharedLibraryConfig, setSharedLibraryConfig] = useState({ subjectOrder:[], enabledSubjects:null });
  const [sharedLibraryRun, setSharedLibraryRun] = useState({ running:false, paused:false, stopping:false, stage:null, current:0, total:0, logs:[] });
  const [sharedLibraryPurging, setSharedLibraryPurging] = useState(false);
  const [sharedLibraryAudienceMode, setSharedLibraryAudienceMode] = useState('student');
  const [sharedLibraryRepairing, setSharedLibraryRepairing] = useState(false);
  const [sharedLibraryGenerationStages, setSharedLibraryGenerationStages] = useState(['summary','direct','clinical']);
  const [sharedLibraryGenerationSubject, setSharedLibraryGenerationSubject] = useState('all');
  const [sharedLibraryGenerationLesson, setSharedLibraryGenerationLesson] = useState('all');
  const sharedLibraryControlRef = useRef({ paused:false, stop:false });

  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  const clearSharedLibrary = useCallback(() => {
    setSharedLibraryItems([]);
    setSharedLibraryProgress({});
    setSharedLibraryError('');
    setSharedLibraryLoading(false);
  }, []);

  const getContentQuery = useCallback(() => {
    const contentRef = collection(db, contentCollection);
    return isAdmin ? contentRef : query(contentRef, where('published', '==', true));
  }, [contentCollection, isAdmin]);

  const hydrateSharedLibraryItems = useCallback(async (items) => {
    const chunkedItems = items.filter(item =>
      Object.values(item.questionChunks || {}).some(meta => meta?.chunked)
    );
    if (!chunkedItems.length) return items;
    const byId = new Map(items.map(item => [item.id, item]));
    await Promise.all(chunkedItems.map(async item => {
      const chunksSnap = await withFirestoreTimeout(getDocs(collection(db, contentCollection, item.id, SHARED_LIBRARY_CHUNKS_COLLECTION)));
      const chunkDocs = chunksSnap.docs.map(entry => ({ id:entry.id, ...(entry.data() || {}) }));
      byId.set(item.id, mergeSharedLibraryQuestionChunks(item, chunkDocs));
    }));
    return items.map(item => byId.get(item.id) || item);
  }, [contentCollection]);

  const refreshSharedLibrary = useCallback(async () => {
    if (!user || user.isAnonymous || !canReadSharedLibrary) {
      clearSharedLibrary();
      return;
    }
    setSharedLibraryLoading(true);
    setSharedLibraryError('');
    try {
      const [contentSnap, progressSnap, configSnap] = await Promise.all([
        withFirestoreTimeout(getDocs(getContentQuery())),
        loadProgress ? withFirestoreTimeout(getDocs(collection(db, 'users', user.uid, progressCollection))) : Promise.resolve(null),
        isAdmin ? withFirestoreTimeout(getDoc(doc(db, 'config', configDocId))) : Promise.resolve(null),
      ]);
      const items = [];
      contentSnap.forEach(entry => {
        const data = entry.data() || {};
        if (isAdmin || data.published !== false) items.push({ ...data, id:entry.id });
      });
      setSharedLibraryItems(await hydrateSharedLibraryItems(items));
      const progress = {};
      progressSnap?.forEach(entry => { progress[entry.id] = entry.data() || {}; });
      setSharedLibraryProgress(progress);
      if (configSnap?.exists()) {
        const saved = configSnap.data() || {};
        setSharedLibraryConfig(previous => ({ ...previous, ...saved }));
      }
    } catch(error) {
      console.error('Shared library load failed:', error);
      setSharedLibraryError(error?.code || error?.message || 'Falha ao carregar biblioteca compartilhada');
      if (showLoadErrors) addToastRef.current?.('Não consegui carregar a Biblioteca compartilhada.', 'error', 4500);
    } finally {
      setSharedLibraryLoading(false);
    }
  }, [
    canReadSharedLibrary,
    clearSharedLibrary,
    configDocId,
    contentCollection,
    getContentQuery,
    hydrateSharedLibraryItems,
    isAdmin,
    loadProgress,
    progressCollection,
    showLoadErrors,
    user,
  ]);

  useEffect(() => {
    if (!user || user.isAnonymous || !canReadSharedLibrary) {
      clearSharedLibrary();
      return;
    }
    refreshSharedLibrary();
  }, [canReadSharedLibrary, clearSharedLibrary, refreshSharedLibrary, user]);

  useEffect(() => {
    if (!user || user.isAnonymous || !canReadSharedLibrary) return undefined;
    let alive = true;
    const unsubscribe = onSnapshot(getContentQuery(), snapshot => {
      setSharedLibraryError('');
      const items = [];
      snapshot.forEach(entry => {
        const data = entry.data() || {};
        if (isAdmin || data.published !== false) items.push({ ...data, id:entry.id });
      });
      hydrateSharedLibraryItems(items)
        .then(hydrated => {
          if (alive) setSharedLibraryItems(hydrated);
        })
        .catch(error => {
          console.warn('Shared library chunk hydration failed:', error?.code || error?.message || error);
          if (alive) setSharedLibraryItems(items);
        });
    }, error => {
      console.warn('Shared library realtime sync failed:', error?.code || error?.message || error);
      setSharedLibraryError(error?.code || error?.message || 'Falha na sincronizacao em tempo real');
    });
    return () => { alive = false; unsubscribe(); };
  }, [canReadSharedLibrary, getContentQuery, hydrateSharedLibraryItems, isAdmin, user]);

  return {
    refreshSharedLibrary,
    setSharedLibraryActiveItemId,
    setSharedLibraryAudienceMode,
    setSharedLibraryConfig,
    setSharedLibraryGenerationLesson,
    setSharedLibraryGenerationStages,
    setSharedLibraryGenerationSubject,
    setSharedLibraryItems,
    setSharedLibraryProgress,
    setSharedLibraryPurging,
    setSharedLibraryRepairing,
    setSharedLibraryRun,
    setSharedLibrarySearch,
    setSharedLibrarySubject,
    setSharedLibraryTab,
    sharedLibraryActiveItemId,
    sharedLibraryAudienceMode,
    sharedLibraryConfig,
    sharedLibraryControlRef,
    sharedLibraryError,
    sharedLibraryGenerationLesson,
    sharedLibraryGenerationStages,
    sharedLibraryGenerationSubject,
    sharedLibraryItems,
    sharedLibraryLoading,
    sharedLibraryProgress,
    sharedLibraryPurging,
    sharedLibraryRepairing,
    sharedLibraryRun,
    sharedLibrarySearch,
    sharedLibrarySubject,
    sharedLibraryTab,
  };
};
