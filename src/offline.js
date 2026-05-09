/**
 * ÁGORA DO SABER — SUPORTE OFFLINE
 *
 * Este módulo adiciona:
 * 1. IndexedDB como cache local de todos os dados críticos
 * 2. Fila de operações pendentes quando offline
 * 3. Sincronização automática ao reconectar
 *
 * COMO USAR NO App.jsx:
 *   import { offlineDB, useOnlineStatus, syncPendingOps } from './offline.js';
 *
 * OPERAÇÕES SUPORTADAS OFFLINE:
 *   - Responder questões (handleAnswer / vqAnswers)
 *   - Marcar aulas como assistidas
 *   - Favoritar questões
 *   - Salvar progresso de revisão espaçada
 *
 * LEITURA OFFLINE:
 *   - library, vqBlocks, vqAnswers, watchedAulas, reviewQueue
 *   - todos lidos do IndexedDB quando Firestore não está disponível
 */

// ─── CONFIGURAÇÃO DO BANCO ────────────────────────────────────────────────────

const DB_NAME    = 'agora_offline';
const DB_VERSION = 1;

const STORES = {
  // Dados principais (espelhos do Firestore)
  library:      'library',       // array de subjects
  vqBlocks:     'vq_blocks',     // { aulaId: aulaData }
  vqAnswers:    'vq_answers',    // { aulaId_blockId: { qId: letter } }
  watchedAulas: 'watched_aulas', // { bunnyId: true }
  reviewQueue:  'review_queue',  // { aulaId: { blockId: { qId: item } } }
  settings:     'settings',      // { ...settings }

  // Fila de operações pendentes
  pendingOps:   'pending_ops',   // [{ id, type, payload, timestamp }]
};

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────

let _db = null;

export const initOfflineDB = () => new Promise((resolve, reject) => {
  if (_db) return resolve(_db);

  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    Object.values(STORES).forEach(name => {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath: 'key' });
      }
    });
  };

  req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
  req.onerror   = (e) => reject(e.target.error);
});

// Garante que o DB está inicializado antes de usar
const getDB = async () => {
  if (_db) return _db;
  return initOfflineDB();
};

// ─── OPERAÇÕES GENÉRICAS ──────────────────────────────────────────────────────

const dbGet = async (storeName, key) => {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => res(req.result?.value ?? null);
    req.onerror   = () => rej(req.error);
  });
};

const dbSet = async (storeName, key, value) => {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put({ key, value });
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
};

const dbGetAll = async (storeName) => {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => res(req.result.map(r => ({ key: r.key, value: r.value })));
    req.onerror   = () => rej(req.error);
  });
};

const dbDelete = async (storeName, key) => {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
};

// ─── API PÚBLICA — CACHE ──────────────────────────────────────────────────────

export const offlineDB = {
  // Library
  saveLibrary:     (data)    => dbSet(STORES.library, 'all', data),
  loadLibrary:     ()        => dbGet(STORES.library, 'all'),

  // VQ Blocks (por aulaId)
  saveVqBlocks:    (data)    => dbSet(STORES.vqBlocks, 'all', data),
  loadVqBlocks:    ()        => dbGet(STORES.vqBlocks, 'all'),
  saveVqBlock:     (id, d)   => dbSet(STORES.vqBlocks, id, d),
  loadVqBlock:     (id)      => dbGet(STORES.vqBlocks, id),

  // Respostas de videoaulas (por "aulaId_blockId")
  saveVqAnswer:    (key, d)  => dbSet(STORES.vqAnswers, key, d),
  loadVqAnswer:    (key)     => dbGet(STORES.vqAnswers, key),
  loadAllVqAnswers: ()       => dbGetAll(STORES.vqAnswers),

  // Aulas assistidas
  saveWatched:     (data)    => dbSet(STORES.watchedAulas, 'all', data),
  loadWatched:     ()        => dbGet(STORES.watchedAulas, 'all'),

  // Fila de revisão espaçada
  saveReviewQueue: (data)    => dbSet(STORES.reviewQueue, 'all', data),
  loadReviewQueue: ()        => dbGet(STORES.reviewQueue, 'all'),

  // Settings
  saveSettings:    (data)    => dbSet(STORES.settings, 'main', data),
  loadSettings:    ()        => dbGet(STORES.settings, 'main'),
};

// ─── FILA DE OPERAÇÕES PENDENTES ─────────────────────────────────────────────

export const pendingQueue = {
  async add(type, payload) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await dbSet(STORES.pendingOps, id, { id, type, payload, timestamp: Date.now() });
    return id;
  },

  async getAll() {
    const all = await dbGetAll(STORES.pendingOps);
    return all
      .map(r => r.value)
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  async remove(id) {
    await dbDelete(STORES.pendingOps, id);
  },

  async clear() {
    const all = await this.getAll();
    await Promise.all(all.map(op => dbDelete(STORES.pendingOps, op.id)));
  },
};

// ─── HOOK — STATUS ONLINE ─────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

/**
 * Retorna { isOnline, justReconnected }
 * justReconnected fica true por 2s após reconexão — use para disparar sync.
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2000);
    };
    const handleOffline = () => { setIsOnline(false); };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, justReconnected };
};

// ─── SINCRONIZAÇÃO ────────────────────────────────────────────────────────────

/**
 * Processa a fila de operações pendentes quando volta a conexão.
 *
 * @param {object} firestoreHandlers — objeto com as funções que escrevem no Firestore:
 *   {
 *     saveAnswer(subjectId, topicId, qId, letter) → Promise
 *     saveVqAnswer(aulaId, blockId, qId, letter)  → Promise
 *     markWatched(bunnyId, value)                  → Promise
 *     saveReviewItem(aulaId, blockId, qId, item)   → Promise
 *   }
 * @param {function} onProgress(done, total) — callback de progresso (opcional)
 */
export const syncPendingOps = async (firestoreHandlers, onProgress) => {
  const ops = await pendingQueue.getAll();
  if (!ops.length) return 0;

  let done = 0;
  for (const op of ops) {
    try {
      switch (op.type) {

        case 'ANSWER': {
          // Resposta de questão da biblioteca
          const { subjectId, topicId, qId, letter } = op.payload;
          await firestoreHandlers.saveAnswer(subjectId, topicId, qId, letter);
          break;
        }

        case 'VQ_ANSWER': {
          // Resposta de questão de videoaula
          const { aulaId, blockId, answers } = op.payload;
          await firestoreHandlers.saveVqBlockAnswers(aulaId, blockId, answers);
          break;
        }

        case 'WATCHED': {
          const { bunnyId, value } = op.payload;
          await firestoreHandlers.markWatched(bunnyId, value);
          break;
        }

        case 'REVIEW_ITEM': {
          const { aulaId, blockId, qId, item } = op.payload;
          await firestoreHandlers.saveReviewItem(aulaId, blockId, qId, item);
          break;
        }

        case 'FAVORITE': {
          const { subjectId, topicId, favorites } = op.payload;
          await firestoreHandlers.saveFavorites(subjectId, topicId, favorites);
          break;
        }

        default:
          console.warn('[Offline] Tipo de operação desconhecido:', op.type);
      }

      await pendingQueue.remove(op.id);
      done++;
      onProgress?.(done, ops.length);

    } catch (e) {
      // Se falhar, deixa na fila para tentar de novo
      console.warn('[Offline] Falha ao sincronizar op:', op.type, e.message);
      // Se for erro de autenticação/permissão, não adianta tentar mais
      if (e.code === 'permission-denied' || e.code === 'unauthenticated') {
        await pendingQueue.remove(op.id);
      }
    }
  }

  return done;
};
