import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '../services/firebase.js';
import {
  mergeSharedLibraryQuestionChunks,
  SHARED_LIBRARY_CHUNKED_FIELDS,
  SHARED_LIBRARY_CHUNKS_COLLECTION,
} from '../services/sharedLibraryContent.js';

const withFirestoreTimeout = (promise, ms = 15000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    const error = new Error('timeout');
    error.code = 'timeout';
    reject(error);
  }, ms);
  Promise.resolve(promise).then(
    value => { clearTimeout(timer); resolve(value); },
    error => { clearTimeout(timer); reject(error); },
  );
});

const chunkFingerprint = (item) => JSON.stringify(item?.questionChunks || {});
const hasChunkedQuestions = (item) => Object.values(item?.questionChunks || {}).some(meta => meta?.chunked);
const mergeCachedHydration = (item, cachedItem) => {
  const merged = { ...cachedItem, ...item };
  SHARED_LIBRARY_CHUNKED_FIELDS.forEach(field => {
    if (item?.questionChunks?.[field]?.chunked && Array.isArray(cachedItem?.[field])) {
      merged[field] = cachedItem[field];
    }
  });
  return merged;
};

export const useSharedLibrarySync = ({
  addToast,
  canReadSharedLibrary,
  configDocId = 'shared_library_automation',
  contentCollection = 'shared_library',
  contentDocIds = [],
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
  const [sharedLibraryRepairing, setSharedLibraryRepairing] = useState(false);
  const [sharedLibraryGenerationStages, setSharedLibraryGenerationStages] = useState(['summary','direct','clinical']);
  const [sharedLibraryGenerationSubject, setSharedLibraryGenerationSubject] = useState('all');
  const [sharedLibraryGenerationLesson, setSharedLibraryGenerationLesson] = useState('all');
  const sharedLibraryControlRef = useRef({ paused:false, stop:false });
  const sharedLibraryItemsRef = useRef([]);
  const hydratedItemsRef = useRef(new Map());
  const hydrationPromisesRef = useRef(new Map());
  const contentDocIdsKey = [...new Set((Array.isArray(contentDocIds) ? contentDocIds : []).filter(Boolean).map(String))]
    .sort()
    .join('|');

  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  useEffect(() => {
    sharedLibraryItemsRef.current = sharedLibraryItems;
  }, [sharedLibraryItems]);

  const clearSharedLibrary = useCallback(() => {
    setSharedLibraryItems([]);
    setSharedLibraryProgress({});
    setSharedLibraryError('');
    setSharedLibraryLoading(false);
    sharedLibraryItemsRef.current = [];
    hydratedItemsRef.current.clear();
    hydrationPromisesRef.current.clear();
  }, []);

  const getContentQuery = useCallback(() => {
    const contentRef = collection(db, contentCollection);
    return isAdmin ? contentRef : query(contentRef, where('published', '==', true));
  }, [contentCollection, isAdmin]);

  const hydrateSharedLibraryItem = useCallback(async (item) => {
    if (!item || !hasChunkedQuestions(item)) return item;
    const fingerprint = chunkFingerprint(item);
    const cached = hydratedItemsRef.current.get(item.id);
    if (cached?.fingerprint === fingerprint) return mergeCachedHydration(item, cached.item);
    const hydrationKey = `${item.id}:${fingerprint}`;
    if (hydrationPromisesRef.current.has(hydrationKey)) {
      return hydrationPromisesRef.current.get(hydrationKey);
    }
    const hydration = withFirestoreTimeout(
      getDocs(collection(db, contentCollection, item.id, SHARED_LIBRARY_CHUNKS_COLLECTION)),
    ).then(chunksSnap => {
      const chunkDocs = chunksSnap.docs.map(entry => ({ id:entry.id, ...(entry.data() || {}) }));
      const hydrated = mergeSharedLibraryQuestionChunks(item, chunkDocs);
      hydratedItemsRef.current.set(item.id, { fingerprint, item:hydrated });
      return hydrated;
    }).finally(() => {
      hydrationPromisesRef.current.delete(hydrationKey);
    });
    hydrationPromisesRef.current.set(hydrationKey, hydration);
    return hydration;
  }, [contentCollection]);

  const hydrateSharedLibraryItems = useCallback(async (items, concurrency = 3) => {
    const hydrated = [...items];
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        hydrated[index] = await hydrateSharedLibraryItem(items[index]);
      }
    };
    const workerCount = Math.min(Math.max(1, concurrency), items.length);
    await Promise.all(Array.from({ length:workerCount }, () => worker()));
    return hydrated;
  }, [hydrateSharedLibraryItem]);

  const hydrateSharedLibraryItemIds = useCallback(async (itemIds = []) => {
    const wanted = new Set((Array.isArray(itemIds) ? itemIds : [itemIds]).map(String));
    if (!wanted.size) return [];
    const current = sharedLibraryItemsRef.current;
    const targets = current.filter(item => wanted.has(String(item.id)));
    if (!targets.length) return [];
    try {
      const hydrated = await hydrateSharedLibraryItems(targets, 3);
      const byId = new Map(hydrated.map(item => [String(item.id), item]));
      setSharedLibraryItems(previous => previous.map(item => byId.get(String(item.id)) || item));
      return hydrated;
    } catch(error) {
      console.warn('Shared library targeted hydration failed:', error?.code || error?.message || error);
      throw error;
    }
  }, [hydrateSharedLibraryItems]);

  const refreshSharedLibrary = useCallback(async () => {
    if (!user || user.isAnonymous || !canReadSharedLibrary) {
      clearSharedLibrary();
      return [];
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
      const hydratedItems = await hydrateSharedLibraryItems(items);
      setSharedLibraryItems(hydratedItems);
      const progress = {};
      progressSnap?.forEach(entry => { progress[entry.id] = entry.data() || {}; });
      setSharedLibraryProgress(progress);
      if (configSnap?.exists()) {
        const saved = configSnap.data() || {};
        setSharedLibraryConfig(previous => ({ ...previous, ...saved }));
      }
      return hydratedItems;
    } catch(error) {
      console.error('Shared library load failed:', error);
      setSharedLibraryError(error?.code || error?.message || 'Falha ao carregar biblioteca compartilhada');
      if (showLoadErrors) addToastRef.current?.('Não consegui carregar a Biblioteca compartilhada.', 'error', 4500);
      return null;
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
      return undefined;
    }
    let alive = true;
    setSharedLibraryLoading(true);
    const requestedDocIds = contentDocIdsKey ? contentDocIdsKey.split('|') : [];
    if (requestedDocIds.length && !loadProgress) {
      Promise.all(requestedDocIds.map(id => withFirestoreTimeout(getDoc(doc(db, contentCollection, id)))))
        .then(snapshots => {
          if (!alive) return;
          const items = snapshots
            .filter(snapshot => snapshot.exists())
            .map(snapshot => ({ ...(snapshot.data() || {}), id:snapshot.id }))
            .filter(item => isAdmin || item.published === true);
          setSharedLibraryItems(items);
          setSharedLibraryError('');
          setSharedLibraryLoading(false);
        })
        .catch(error => {
          if (!alive) return;
          console.warn('Shared library targeted document load failed:', error?.code || error?.message || error);
          setSharedLibraryError(error?.code || error?.message || 'Falha ao carregar a aula');
          setSharedLibraryLoading(false);
        });
      return () => { alive = false; };
    }
    const unsubscribe = onSnapshot(getContentQuery(), snapshot => {
      setSharedLibraryError('');
      const items = [];
      snapshot.forEach(entry => {
        const data = entry.data() || {};
        if (isAdmin || data.published !== false) items.push({ ...data, id:entry.id });
      });
      const visibleItems = loadProgress
        ? hydrateSharedLibraryItems(items, 3)
        : Promise.resolve(items.map(item => {
          const cached = hydratedItemsRef.current.get(item.id);
          return cached?.fingerprint === chunkFingerprint(item)
            ? mergeCachedHydration(item, cached.item)
            : item;
        }));
      visibleItems
        .then(hydrated => {
          if (alive) {
            setSharedLibraryItems(hydrated);
            setSharedLibraryLoading(false);
          }
        })
        .catch(error => {
          console.warn('Shared library chunk hydration failed:', error?.code || error?.message || error);
          if (alive) {
            setSharedLibraryItems(items);
            setSharedLibraryLoading(false);
          }
        });
    }, error => {
      console.warn('Shared library realtime sync failed:', error?.code || error?.message || error);
      setSharedLibraryError(error?.code || error?.message || 'Falha na sincronizacao em tempo real');
      setSharedLibraryLoading(false);
    });
    return () => { alive = false; unsubscribe(); };
  }, [canReadSharedLibrary, clearSharedLibrary, contentCollection, contentDocIdsKey, getContentQuery, hydrateSharedLibraryItems, isAdmin, loadProgress, user]);

  useEffect(() => {
    if (!user || user.isAnonymous || !canReadSharedLibrary || !loadProgress) return undefined;
    let alive = true;
    Promise.all([
      withFirestoreTimeout(getDocs(collection(db, 'users', user.uid, progressCollection))),
      isAdmin ? withFirestoreTimeout(getDoc(doc(db, 'config', configDocId))) : Promise.resolve(null),
    ]).then(([progressSnap, configSnap]) => {
      if (!alive) return;
      const progress = {};
      progressSnap?.forEach(entry => { progress[entry.id] = entry.data() || {}; });
      setSharedLibraryProgress(progress);
      if (configSnap?.exists()) {
        const saved = configSnap.data() || {};
        setSharedLibraryConfig(previous => ({ ...previous, ...saved }));
      }
    }).catch(error => {
      console.warn('Shared library supplemental data load failed:', error?.code || error?.message || error);
      if (alive && showLoadErrors) addToastRef.current?.('Não consegui carregar todo o progresso da Biblioteca.', 'error', 4500);
    });
    return () => { alive = false; };
  }, [canReadSharedLibrary, configDocId, isAdmin, loadProgress, progressCollection, showLoadErrors, user]);

  return {
    hydrateSharedLibraryItemIds,
    refreshSharedLibrary,
    setSharedLibraryActiveItemId,
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
