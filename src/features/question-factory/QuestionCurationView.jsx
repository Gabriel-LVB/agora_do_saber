import React from 'react';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { useFeatureContext } from '../FeatureContext.jsx';
import { db } from '../../services/firebase.js';
import {
  buildLearningSelectionSnapshot,
  buildConceptAnalysisPrompt,
  buildQuestionMetadataBatches,
  buildQuestionMetadataPrompt,
  flattenSharedLibraryQuestions,
  normalizeConcepts,
  normalizeQuestionMetadata,
  parseGeminiJson,
  LEARNING_SELECTION_VERSION,
  QUESTION_METADATA_ANALYSIS_VERSION,
  QUESTION_METADATA_BATCH_SIZE,
  QUESTION_METADATA_VERSION,
  questionSetSignature,
  selectLearningQuestions,
} from '../../services/questionMetadata.js';
import {
  loadQuestionMetadataAnalysis,
  loadQuestionMetadataManifest,
  publishLearningSelection,
  questionMetadataBatchDocId,
  saveQuestionMetadataBatch,
  saveQuestionMetadataManifest,
} from '../../services/questionMetadataStore.js';

const EMPTY_ANALYSIS = { manifest:null, batches:{}, metadataByQuestion:{} };
const EMPTY_ANALYSES_BY_ITEM = {};
const STRUCTURAL_RESPONSE_ERRORS = new Set([
  'METADATA_JSON_INVALID',
  'METADATA_CONCEPTS_EMPTY',
  'METADATA_BATCH_INCOMPLETE',
]);
const MAX_STRUCTURAL_RESPONSE_ATTEMPTS = 3;
const questionMetadataBatchAlias = index => `q${index + 1}`;
const normalizeQuestionMetadataBatchAlias = value => {
  const raw = String(value ?? '').trim().toLowerCase();
  const match = raw.match(/^(?:q(?:uestion)?[\s:_-]*)?0*(\d+)$/i);
  return match ? `q${Number(match[1])}` : raw;
};
const CURATION_ERROR_LABELS = {
  API_KEY_INVALID:'chave inválida',
  API_KEY_MISSING:'chave ausente',
  CONNECTION_ERROR:'falha de conexão',
  METADATA_BATCH_INCOMPLETE:'resposta incompleta',
  METADATA_CONCEPTS_EMPTY:'mapa conceitual vazio',
  METADATA_JSON_INVALID:'JSON inválido ou truncado',
  QUOTA_EXCEEDED:'cota esgotada',
  REQUEST_INVALID:'requisição rejeitada',
  REQUEST_TIMEOUT:'tempo limite excedido',
  SERVER_OVERLOADED:'Gemini sobrecarregado',
};
const curationErrorLabel = error => {
  const label = CURATION_ERROR_LABELS[error?.message] || error?.message || 'erro desconhecido';
  return error?.validationSummary ? `${label} (${error.validationSummary})` : label;
};
const fieldClass = darkMode =>
  `w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${darkMode
    ? 'border-gray-700 bg-gray-900 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900'}`;

const compact = (value, max = 180) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

const itemQuestionCount = item => flattenSharedLibraryQuestions(item).length;
const analysisMatchesItem = (item, manifest) => manifest?.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION
  && manifest?.questionSignature === questionSetSignature(flattenSharedLibraryQuestions(item));
const analysisIsCompleteForItem = (item, analysis) => {
  const questions = flattenSharedLibraryQuestions(item);
  const manifest = analysis?.manifest;
  return questions.length > 0
    && analysisMatchesItem(item, manifest)
    && manifest?.status === 'complete'
    && Number(manifest?.completedCount) === questions.length
    && Array.isArray(manifest?.concepts)
    && manifest.concepts.length > 0;
};
const learningSelectionMatchesAnalysis = (item, manifest) => {
  const completedAt = Number(manifest?.completedAt || 0);
  return completedAt > 0
    && item?.learningSelection?.version === LEARNING_SELECTION_VERSION
    && item.learningSelection.questionSignature === questionSetSignature(flattenSharedLibraryQuestions(item))
    && Number(item.learningSelection.metadataCompletedAt || 0) === completedAt;
};
const itemLessonKeys = item => [...new Set([
  item?.id,
  item?.lessonId,
  item?.sourceLessonId,
  item?.bunny_id,
  item?.sourceBunnyId,
].filter(Boolean).map(String))];

const mapWithConcurrency = async (items, concurrency, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length:Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

export default function QuestionCurationView({ items = [], subjectOrder = [] }) {
  const {
    addToast,
    callWithRotation,
    collectLikelySiteGeminiKeys,
    darkMode,
    refreshSharedLibrary,
    Spinner,
    user,
  } = useFeatureContext();
  const orderedItems = React.useMemo(() => [...items].sort((left, right) =>
    subjectOrder.indexOf(left.subject) - subjectOrder.indexOf(right.subject)
    || String(left.title).localeCompare(String(right.title), 'pt-BR')), [items, subjectOrder]);
  const subjects = React.useMemo(() => [...new Set(orderedItems.map(item => item.subject).filter(Boolean))], [orderedItems]);
  const subjectsKey = subjects.join('\u0001');
  const [selectedSubjects, setSelectedSubjects] = React.useState(() => subjects[0] ? [subjects[0]] : []);
  const [selectedItemId, setSelectedItemId] = React.useState('all');
  const [analysesByItem, setAnalysesByItem] = React.useState({});
  const [analysesLoading, setAnalysesLoading] = React.useState(false);
  const [analysisRead, setAnalysisRead] = React.useState({
    scopeKey:'',
    updatedAt:null,
    error:'',
    errorScopeKey:'',
  });
  const [running, setRunning] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [stopping, setStopping] = React.useState(false);
  const [progress, setProgress] = React.useState({ current:0, total:0, label:'' });
  const [runLogs, setRunLogs] = React.useState([]);
  const [runSummary, setRunSummary] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [watchedDemand, setWatchedDemand] = React.useState({
    loading:false,
    loaded:false,
    rows:[],
    error:'',
    updatedAt:null,
  });
  const controlRef = React.useRef({ paused:false, stop:false });
  const keyPoolRef = React.useRef([]);
  const keyCursorRef = React.useRef(0);

  const addRunLog = React.useCallback((type, message) => {
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour:'2-digit',
      minute:'2-digit',
      second:'2-digit',
    });
    setRunLogs(current => [{
      id:Date.now() + Math.random(),
      type,
      message,
      time,
    }, ...current].slice(0, 160));
  }, []);

  const waitForRunControl = React.useCallback(async () => {
    while (controlRef.current.paused && !controlRef.current.stop) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return !controlRef.current.stop;
  }, []);

  const pauseRun = React.useCallback(() => {
    controlRef.current.paused = true;
    setPaused(true);
    addRunLog('info', 'Fila pausada após a requisição atual.');
  }, [addRunLog]);

  const resumeRun = React.useCallback(() => {
    controlRef.current.paused = false;
    setPaused(false);
    addRunLog('info', 'Fila retomada.');
  }, [addRunLog]);

  const stopRun = React.useCallback(() => {
    controlRef.current.stop = true;
    controlRef.current.paused = false;
    setPaused(false);
    setStopping(true);
    addRunLog('warning', 'Parando após a requisição atual; lotes concluídos serão preservados.');
  }, [addRunLog]);

  const refreshWatchedDemand = React.useCallback(async () => {
    if (!orderedItems.length) {
      setWatchedDemand({ loading:false, loaded:true, rows:[], error:'', updatedAt:Date.now() });
      return;
    }
    setWatchedDemand(current => ({ ...current, loading:true, error:'' }));
    try {
      const deviceSnapshot = await getDocs(query(
        collection(db, 'user_devices'),
        orderBy('lastSeenAt', 'desc'),
        limit(1000),
      ));
      const uidSet = new Set(user?.uid ? [String(user.uid)] : []);
      deviceSnapshot.forEach(entry => {
        const uid = entry.data()?.uid;
        if (uid) uidSet.add(String(uid));
      });
      const keyToItemIds = new Map();
      orderedItems.forEach(item => itemLessonKeys(item).forEach(key => {
        keyToItemIds.set(key, [...(keyToItemIds.get(key) || []), String(item.id)]);
      }));
      const viewersByItem = new Map();
      await mapWithConcurrency([...uidSet], 6, async uid => {
        const snapshot = await getDoc(doc(db, 'users', uid, 'videoaulas_progress', 'watched'));
        if (!snapshot.exists()) return;
        Object.entries(snapshot.data() || {}).forEach(([lessonKey, watched]) => {
          if (!watched) return;
          (keyToItemIds.get(String(lessonKey)) || []).forEach(itemId => {
            const viewers = viewersByItem.get(itemId) || new Set();
            viewers.add(uid);
            viewersByItem.set(itemId, viewers);
          });
        });
      });
      const demandedItems = orderedItems.filter(item => viewersByItem.has(String(item.id)));
      const manifests = await mapWithConcurrency(demandedItems, 6, item =>
        loadQuestionMetadataManifest(item.id).catch(() => null)
      );
      const rows = demandedItems.map((item, index) => {
        const manifest = manifests[index];
        const curated = manifest?.status === 'complete' && analysisMatchesItem(item, manifest);
        const selectionPublished = curated && learningSelectionMatchesAnalysis(item, manifest);
        return {
          item,
          viewers:viewersByItem.get(String(item.id))?.size || 0,
          curated,
          selectionPublished,
        };
      }).filter(row => !row.selectionPublished)
        .sort((left, right) => right.viewers - left.viewers || String(left.item.title).localeCompare(String(right.item.title), 'pt-BR'));
      setWatchedDemand({ loading:false, loaded:true, rows, error:'', updatedAt:Date.now() });
    } catch(error) {
      console.warn('watched lessons curation demand failed:', error);
      setWatchedDemand(current => ({
        ...current,
        loading:false,
        loaded:true,
        error:error?.message || error?.code || 'Falha ao carregar',
      }));
    }
  }, [orderedItems, user?.uid]);

  React.useEffect(() => {
    setSelectedSubjects(current => {
      const valid = subjects.filter(subject => current.includes(subject));
      if (valid.length) {
        const unchanged = valid.length === current.length
          && valid.every((subject, index) => subject === current[index]);
        return unchanged ? current : valid;
      }
      return subjects[0] ? [subjects[0]] : [];
    });
  }, [subjectsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const subjectItems = React.useMemo(
    () => orderedItems.filter(item => selectedSubjects.includes(item.subject)),
    [orderedItems, selectedSubjects],
  );
  React.useEffect(() => {
    if (selectedSubjects.length !== 1) {
      if (selectedItemId !== 'all') setSelectedItemId('all');
      return;
    }
    if (selectedItemId === 'all') return;
    if (subjectItems.some(item => String(item.id) === String(selectedItemId))) return;
    setSelectedItemId('all');
  }, [selectedItemId, selectedSubjects.length, subjectItems]);

  const targetItems = React.useMemo(
    () => selectedItemId === 'all'
      ? subjectItems
      : subjectItems.filter(item => String(item.id) === String(selectedItemId)),
    [selectedItemId, subjectItems],
  );
  const selectedScopeLabel = selectedItemId !== 'all'
    ? 'aula'
    : selectedSubjects.length === 1
      ? 'matéria'
      : 'matérias';
  const analysisScopeKey = `${selectedSubjects.join('|')}::${selectedItemId}`;
  const analysesLoaded = analysisRead.scopeKey === analysisScopeKey;
  const displayedAnalysesByItem = analysesLoaded ? analysesByItem : EMPTY_ANALYSES_BY_ITEM;

  const refreshAnalyses = React.useCallback(async () => {
    const requestedScopeKey = analysisScopeKey;
    if (!targetItems.length) {
      setAnalysesByItem({});
      setAnalysisRead({ scopeKey:requestedScopeKey, updatedAt:Date.now(), error:'', errorScopeKey:'' });
      return;
    }
    setAnalysesLoading(true);
    setAnalysisRead(current => ({ ...current, error:'', errorScopeKey:'' }));
    try {
      const entries = await Promise.all(targetItems.map(async item => [
        String(item.id),
        await loadQuestionMetadataAnalysis(item.id),
      ]));
      setAnalysesByItem(Object.fromEntries(entries));
      setAnalysisRead({ scopeKey:requestedScopeKey, updatedAt:Date.now(), error:'', errorScopeKey:'' });
    } catch(error) {
      console.error('question metadata load failed:', error);
      setAnalysisRead(current => ({
        scopeKey:current.scopeKey === requestedScopeKey ? current.scopeKey : '',
        updatedAt:current.scopeKey === requestedScopeKey ? current.updatedAt : null,
        error:error?.message || error?.code || 'Falha ao carregar',
        errorScopeKey:requestedScopeKey,
      }));
      addToast('Não consegui carregar os metadados deste recorte.', 'error', 4500);
    } finally {
      setAnalysesLoading(false);
    }
  }, [addToast, analysisScopeKey, targetItems]);

  const buildSelectionForAnalysis = React.useCallback((item, analysis) => {
    const questions = flattenSharedLibraryQuestions(item);
    const signature = questionSetSignature(questions);
    const ready = analysis?.manifest?.status === 'complete'
      && analysis.manifest.questionSignature === signature
      && analysis.manifest.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION;
    if (!ready) return null;
    const selection = selectLearningQuestions({
      questions,
      metadataByQuestion:analysis.metadataByQuestion || {},
      concepts:analysis.manifest.concepts || [],
    });
    return { questions, selection, signature };
  }, []);

  const publishCompletedAnalysis = React.useCallback(async (item, knownAnalysis = null) => {
    const analysis = knownAnalysis || await loadQuestionMetadataAnalysis(item.id);
    const result = buildSelectionForAnalysis(item, analysis);
    if (!result) throw new Error('METADATA_ANALYSIS_NOT_COMPLETE');
    const learningSelection = buildLearningSelectionSnapshot({
      selection:result.selection,
      questionSignature:result.signature,
      metadataCompletedAt:analysis.manifest.completedAt,
      publishedAt:Date.now(),
    });
    await publishLearningSelection({ itemId:item.id, learningSelection });
    return { analysis, ...result, learningSelection };
  }, [buildSelectionForAnalysis]);

  const exportCurationAudit = React.useCallback(async item => {
    if (!item) return;
    try {
      const analysis = await loadQuestionMetadataAnalysis(item.id);
      const result = buildSelectionForAnalysis(item, analysis);
      if (!result) {
        addToast('Conclua a curadoria desta aula antes de exportar.', 'info', 4000);
        return;
      }
      const tierByQuestion = {};
      ['essential', 'complementary', 'reserve', 'disabled'].forEach(tier => {
        (result.selection[tier] || []).forEach(row => {
          tierByQuestion[String(row.question.id)] = { tier, reason:row.reason || '' };
        });
      });
      const payload = {
        schema:'agora-question-curation-audit-v1',
        exportedAt:new Date().toISOString(),
        lesson:{
          id:item.id,
          lessonId:item.lessonId || null,
          subject:item.subject || '',
          topic:item.topic || '',
          title:item.title || '',
          questionSignature:result.signature,
          questionCount:result.questions.length,
        },
        manifest:analysis.manifest,
        concepts:analysis.manifest?.concepts || [],
        automaticSelection:{
          version:LEARNING_SELECTION_VERSION,
          totals:result.selection.totals,
        },
        questions:result.questions.map(question => ({
          id:question.id,
          kind:question.libraryQuestionKind || (question.isFlashcard ? 'flashcard' : question.isOpen ? 'open' : 'objective'),
          caseContext:question.caseContext || '',
          statement:question.statement || '',
          options:question.options || [],
          expectedAnswer:question.expectedAnswer || '',
          explanation:question.explanation || '',
          metadata:analysis.metadataByQuestion?.[String(question.id)] || null,
          automaticSelection:tierByQuestion[String(question.id)] || null,
        })),
      };
      const safeTitle = String(item.title || item.id || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `curadoria-${safeTitle || 'aula'}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      addToast('Auditoria da curadoria exportada.', 'success', 3000);
    } catch(error) {
      console.error('question curation export failed:', error);
      addToast('Não consegui exportar a auditoria desta aula.', 'error', 4500);
    }
  }, [addToast, buildSelectionForAnalysis]);

  const callCurationGemini = React.useCallback(async ({
    label,
    maxTokens,
    prompt,
    system,
    validateResult,
  }) => {
    let displayedAttempt = 0;
    for (let shapeAttempt = 0; shapeAttempt < MAX_STRUCTURAL_RESPONSE_ATTEMPTS; shapeAttempt += 1) {
      try {
        return await callWithRotation(prompt, system, {
          keyCursorRef,
          keyPool:keyPoolRef.current,
          maxTokens,
          minimumAttempts:2,
          responseMimeType:'application/json',
          temperature:0.2,
          thinkingBudget:0,
          timeoutMs:180000,
          validateResult,
          onAttempt:({ keyLabel }) => {
            displayedAttempt += 1;
            addRunLog('info', `${label}: tentativa ${displayedAttempt} com ${keyLabel}.`);
          },
          onSuccess:({ keyLabel }) => {
            addRunLog('success', `${label}: ${keyLabel} concluiu e validou a resposta.`);
          },
          onError:(error, { keyLabel }) => {
            addRunLog('warning', `${label}: ${keyLabel} falhou (${curationErrorLabel(error)}).`);
          },
        });
      } catch(error) {
        const canRetryShape = STRUCTURAL_RESPONSE_ERRORS.has(error?.message)
          && shapeAttempt + 1 < MAX_STRUCTURAL_RESPONSE_ATTEMPTS;
        if (!canRetryShape || !await waitForRunControl()) throw error;
      }
    }
    throw new Error('METADATA_JSON_INVALID');
  }, [addRunLog, callWithRotation, waitForRunControl]);

  const analyzeItem = async ({ item, itemIndex, itemTotal, previousBatchCount, totalBatchCount }) => {
    const questions = flattenSharedLibraryQuestions(item);
    const signature = questionSetSignature(questions);
    const batches = buildQuestionMetadataBatches(questions, QUESTION_METADATA_BATCH_SIZE);
    addRunLog('info', `Aula ${itemIndex + 1}/${itemTotal}: ${item.title} · ${questions.length} questões em ${batches.length} lote(s).`);
    let currentAnalysis = await loadQuestionMetadataAnalysis(item.id);
    const hasCurrentConcepts = currentAnalysis.manifest?.questionSignature === signature
      && currentAnalysis.manifest?.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION
      && Array.isArray(currentAnalysis.manifest?.concepts)
      && currentAnalysis.manifest.concepts.length > 0;
    const alreadyComplete = hasCurrentConcepts
      && currentAnalysis.manifest?.status === 'complete'
      && Number(currentAnalysis.manifest?.completedCount) === questions.length;
    if (alreadyComplete) {
      addRunLog('info', `${item.title}: análise atual já estava completa; nenhuma chamada ao Gemini foi necessária.`);
      setProgress({
        current:previousBatchCount + batches.length,
        total:totalBatchCount,
        label:`${itemIndex + 1}/${itemTotal} · ${item.title} · pronta para publicar`,
      });
      return { stopped:false, batchCount:batches.length, reused:true };
    }
    const canResume = hasCurrentConcepts
      && Number(currentAnalysis.manifest?.batchSize) === QUESTION_METADATA_BATCH_SIZE
      && Number(currentAnalysis.manifest?.batchCount) === batches.length;
    let concepts = hasCurrentConcepts ? currentAnalysis.manifest.concepts : [];

    if (!canResume) {
      if (!concepts.length) {
        if (!await waitForRunControl()) return { stopped:true, batchCount:batches.length };
        setProgress({
          current:previousBatchCount,
          total:totalBatchCount,
          label:`${itemIndex + 1}/${itemTotal} · extraindo conceitos de ${item.title}`,
        });
        concepts = await callCurationGemini({
          label:`${item.title} · mapa conceitual`,
          maxTokens:6000,
          prompt:buildConceptAnalysisPrompt(item),
          system:'Você organiza conhecimento médico para estudo. Responda somente JSON válido e não alegue verificação externa.',
          validateResult:text => {
            const parsedConcepts = normalizeConcepts(parseGeminiJson(text)?.concepts || []);
            if (!parsedConcepts.length) throw new Error('METADATA_CONCEPTS_EMPTY');
            return parsedConcepts;
          },
        });
      } else {
        addRunLog('info', `${item.title}: mapa conceitual atual reutilizado.`);
      }
      if (!concepts.length) throw new Error('METADATA_CONCEPTS_EMPTY');
      await saveQuestionMetadataManifest({
        itemId:item.id,
        manifest:{
          metadataVersion:QUESTION_METADATA_VERSION,
          analysisVersion:QUESTION_METADATA_ANALYSIS_VERSION,
          status:'running',
          questionSignature:signature,
          questionCount:questions.length,
          batchSize:QUESTION_METADATA_BATCH_SIZE,
          batchCount:batches.length,
          completedBatches:[],
          completedCount:0,
          concepts,
          startedAt:Date.now(),
          completedAt:null,
          lastError:null,
          updatedAt:Date.now(),
        },
      });
      currentAnalysis = await loadQuestionMetadataAnalysis(item.id);
    }

    const completedBatches = new Set(currentAnalysis.manifest?.completedBatches || []);
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      if (!await waitForRunControl()) break;
      const batchQuestions = batches[batchIndex];
      const batchDocId = questionMetadataBatchDocId(batchIndex);
      const storedBatch = currentAnalysis.batches?.[batchDocId];
      const expectedIds = batchQuestions.map(question => String(question.id));
      const expectedResponseIds = batchQuestions.map((question, index) => questionMetadataBatchAlias(index));
      const storedIds = (storedBatch?.questionIds || []).map(String);
      const batchAlreadyComplete = storedBatch?.status === 'complete'
        && storedBatch?.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION
        && storedBatch?.questionSignature === signature
        && JSON.stringify(storedIds) === JSON.stringify(expectedIds);
      if (batchAlreadyComplete) {
        completedBatches.add(batchIndex);
        addRunLog('info', `${item.title}: lote ${batchIndex + 1}/${batches.length} já estava pronto.`);
        setProgress({
          current:previousBatchCount + completedBatches.size,
          total:totalBatchCount,
          label:`${itemIndex + 1}/${itemTotal} · ${item.title} · lote ${batchIndex + 1} pronto`,
        });
        continue;
      }

      setProgress({
        current:previousBatchCount + completedBatches.size,
        total:totalBatchCount,
        label:`${itemIndex + 1}/${itemTotal} · ${item.title} · lote ${batchIndex + 1}/${batches.length}`,
      });
      const normalizedItems = await callCurationGemini({
        label:`${item.title} · lote ${batchIndex + 1}/${batches.length}`,
        maxTokens:24000,
        prompt:buildQuestionMetadataPrompt({
          item,
          concepts,
          questions:batchQuestions.map((question, index) => ({
            ...question,
            id:questionMetadataBatchAlias(index),
          })),
          batchIndex,
          batchCount:batches.length,
        }),
        system:'Você é um curador de questões médicas. Classifique sem reescrever. Copie exatamente os IDs curtos q1, q2... e responda somente JSON válido.',
        validateResult:text => {
          const parsedItems = parseGeminiJson(text)?.items || [];
          const rawById = new Map(parsedItems.map(metadata => [
            normalizeQuestionMetadataBatchAlias(metadata?.questionId),
            metadata,
          ]));
          const hasExactIds = parsedItems.length === expectedResponseIds.length
            && rawById.size === expectedResponseIds.length
            && expectedResponseIds.every(id => rawById.has(id));
          if (!hasExactIds) {
            const missingIds = expectedResponseIds.filter(id => !rawById.has(id));
            const extraIds = [...rawById.keys()].filter(id => !expectedResponseIds.includes(id));
            const error = new Error('METADATA_BATCH_INCOMPLETE');
            error.validationSummary = `${rawById.size}/${expectedResponseIds.length}${missingIds.length ? `; faltaram ${missingIds.slice(0, 5).join(', ')}` : ''}${extraIds.length ? `; inesperados ${extraIds.slice(0, 3).join(', ')}` : ''}`;
            throw error;
          }
          return batchQuestions.map((question, index) => normalizeQuestionMetadata({
            raw:rawById.get(questionMetadataBatchAlias(index)),
            question,
            concepts,
            existing:currentAnalysis.metadataByQuestion?.[String(question.id)] || null,
          }));
        },
      });
      await saveQuestionMetadataBatch({
        itemId:item.id,
        batchIndex,
        batch:{
          metadataVersion:QUESTION_METADATA_VERSION,
          analysisVersion:QUESTION_METADATA_ANALYSIS_VERSION,
          questionSignature:signature,
          status:'complete',
          batchIndex,
          questionIds:expectedIds,
          items:normalizedItems,
          updatedAt:Date.now(),
        },
      });
      completedBatches.add(batchIndex);
      await saveQuestionMetadataManifest({
        itemId:item.id,
        manifest:{
          status:'running',
          completedBatches:[...completedBatches].sort((a, b) => a - b),
          completedCount:[...completedBatches].reduce(
            (total, index) => total + (batches[index]?.length || 0),
            0,
          ),
          lastError:null,
          updatedAt:Date.now(),
        },
      });
      addRunLog('success', `${item.title}: lote ${batchIndex + 1}/${batches.length} salvo (${normalizedItems.length} questões).`);
      currentAnalysis = await loadQuestionMetadataAnalysis(item.id);
    }

    const stopped = controlRef.current.stop;
    await saveQuestionMetadataManifest({
      itemId:item.id,
      manifest:{
        status:stopped ? 'paused' : 'complete',
        completedBatches:[...completedBatches].sort((a, b) => a - b),
        completedCount:[...completedBatches].reduce(
          (total, index) => total + (batches[index]?.length || 0),
          0,
        ),
        completedAt:stopped ? null : Date.now(),
        updatedAt:Date.now(),
      },
    });
    addRunLog(stopped ? 'warning' : 'success', stopped
      ? `${item.title}: processamento interrompido com os lotes anteriores preservados.`
      : `${item.title}: todos os metadados foram concluídos.`);
    return { stopped, batchCount:batches.length };
  };

  const processAnalysisItem = async ({
    item,
    itemIndex,
    itemTotal,
    knownAnalysis,
    previousBatchCount,
    totalBatchCount,
  }) => {
    const questions = flattenSharedLibraryQuestions(item);
    const signature = questionSetSignature(questions);
    const batchCount = buildQuestionMetadataBatches(questions, QUESTION_METADATA_BATCH_SIZE).length;
    const canReuseKnownAnalysis = analysisIsCompleteForItem(item, knownAnalysis);
    try {
      if (canReuseKnownAnalysis) {
        addRunLog('info', `${item.title}: metadados carregados reutilizados; sem releitura e sem Gemini.`);
        setProgress({
          current:previousBatchCount + batchCount,
          total:totalBatchCount,
          label:`${itemIndex + 1}/${itemTotal} · ${item.title} · pronta para publicar`,
        });
      } else {
        const result = await analyzeItem({
          item,
          itemIndex,
          itemTotal,
          previousBatchCount,
          totalBatchCount,
        });
        if (result.stopped) return { ...result, failed:false, published:false };
      }
    } catch(error) {
      console.error('question metadata lesson failed:', item?.title, error);
      const manifest = await loadQuestionMetadataManifest(item.id).catch(() => null);
      const sameAnalysis = manifest?.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION
        && manifest?.questionSignature === signature;
      await saveQuestionMetadataManifest({
        itemId:item.id,
        manifest:{
          metadataVersion:QUESTION_METADATA_VERSION,
          analysisVersion:QUESTION_METADATA_ANALYSIS_VERSION,
          status:'paused',
          questionSignature:signature,
          questionCount:questions.length,
          batchSize:QUESTION_METADATA_BATCH_SIZE,
          batchCount,
          completedBatches:sameAnalysis ? manifest?.completedBatches || [] : [],
          completedCount:sameAnalysis ? Number(manifest?.completedCount) || 0 : 0,
          concepts:sameAnalysis ? manifest?.concepts || [] : [],
          startedAt:sameAnalysis ? manifest?.startedAt || Date.now() : Date.now(),
          completedAt:null,
          lastError:error?.message || 'Falha inesperada',
          updatedAt:Date.now(),
        },
      }).catch(saveError => {
        addRunLog('warning', `${item.title}: não foi possível registrar a pausa (${curationErrorLabel(saveError)}).`);
      });
      addRunLog('error', `${item.title}: falhou após as tentativas disponíveis (${curationErrorLabel(error)}). A fila seguirá para a próxima aula.`);
      return { stopped:false, batchCount, failed:true, published:false };
    }

    try {
      await publishCompletedAnalysis(item, canReuseKnownAnalysis ? knownAnalysis : null);
      addRunLog('success', `${item.title}: seleção pedagógica publicada.`);
      return { stopped:false, batchCount, failed:false, published:true };
    } catch(error) {
      addRunLog('error', `${item.title}: metadados concluídos, mas a publicação falhou (${curationErrorLabel(error)}). A fila seguirá.`);
      return { stopped:false, batchCount, failed:true, published:false };
    }
  };

  const runAnalysis = async (requestedItems = null) => {
    const requestedAnalysisItems = Array.isArray(requestedItems) ? requestedItems : targetItems;
    const knownAnalysisByItem = analysesLoaded ? displayedAnalysesByItem : EMPTY_ANALYSES_BY_ITEM;
    const alreadyPublishedItems = requestedAnalysisItems.filter(item => {
      const analysis = knownAnalysisByItem[String(item.id)];
      return analysisIsCompleteForItem(item, analysis)
        && learningSelectionMatchesAnalysis(item, analysis.manifest);
    });
    const alreadyPublishedIds = new Set(alreadyPublishedItems.map(item => String(item.id)));
    const analysisItems = requestedAnalysisItems.filter(item => !alreadyPublishedIds.has(String(item.id)));
    const analysisScopeLabel = requestedAnalysisItems.length === 1 ? 'aula' : selectedScopeLabel;
    if (running || !requestedAnalysisItems.length) return;
    setRunning(true);
    setPaused(false);
    setStopping(false);
    setRunLogs([]);
    setRunSummary(null);
    controlRef.current = { paused:false, stop:false };
    const totalBatchCount = analysisItems.reduce(
      (total, item) => total + buildQuestionMetadataBatches(
        flattenSharedLibraryQuestions(item),
        QUESTION_METADATA_BATCH_SIZE,
      ).length,
      0,
    );
    setProgress({ current:0, total:totalBatchCount, label:'Preparando a fila de curadoria…' });
    let previousBatchCount = 0;
    let currentItem = null;
    let publishedCount = 0;
    let failedCount = 0;
    let processedCount = 0;
    try {
      if (alreadyPublishedItems.length) {
        addRunLog('success', `${alreadyPublishedItems.length} aula(s) já publicada(s) ficaram fora da fila com base nos metadados carregados.`);
      }
      if (!analysisItems.length) {
        setRunSummary({
          total:requestedAnalysisItems.length,
          queued:0,
          published:0,
          alreadyPublished:alreadyPublishedItems.length,
          failed:0,
          skipped:0,
          stopped:false,
        });
        setProgress({ current:0, total:0, label:'Nenhuma aula pendente.' });
        addRunLog('success', 'Nenhuma aula entrou na fila: todo o recorte já estava completo e publicado.');
        addToast(requestedAnalysisItems.length === 1
          ? 'Esta aula já está completa e publicada.'
          : 'Todas as aulas selecionadas já estão completas e publicadas.', 'success', 4000);
        return;
      }

      const requiresGemini = analysisItems.some(item =>
        !analysisIsCompleteForItem(item, knownAnalysisByItem[String(item.id)]));
      let siteKeys = [];
      if (requiresGemini) {
        siteKeys = await collectLikelySiteGeminiKeys({
          onError:message => addRunLog('warning', message),
        });
        if (!siteKeys.length) throw new Error('API_KEY_MISSING');
      }
      keyPoolRef.current = siteKeys;
      keyCursorRef.current = 0;
      addRunLog('info', `${analysisItems.length} aula(s) pendente(s) na fila · lotes de até ${QUESTION_METADATA_BATCH_SIZE}${requiresGemini ? ` · ${siteKeys.length} chave(s) do pool administrativo` : ' · somente publicação, sem Gemini'}.`);
      if (requiresGemini) addRunLog('info', 'Respostas em JSON estruturado, sem thinking, com rotação e validação automáticas.');
      for (let itemIndex = 0; itemIndex < analysisItems.length; itemIndex += 1) {
        if (!await waitForRunControl()) break;
        currentItem = analysisItems[itemIndex];
        const result = await processAnalysisItem({
          item:currentItem,
          itemIndex,
          itemTotal:analysisItems.length,
          knownAnalysis:knownAnalysisByItem[String(currentItem.id)] || null,
          previousBatchCount,
          totalBatchCount,
        });
        processedCount += 1;
        previousBatchCount += result.batchCount;
        if (result.stopped) {
          failedCount += 1;
          break;
        }
        if (result.published) publishedCount += 1;
        if (result.failed) failedCount += 1;
        setProgress({
          current:previousBatchCount,
          total:totalBatchCount,
          label:result.failed
            ? `${currentItem.title} pendente · seguindo para a próxima aula`
            : `${currentItem.title} concluída`,
        });
      }
      if (publishedCount) {
        await refreshSharedLibrary?.().catch(error => {
          addRunLog('warning', `As publicações foram concluídas, mas a atualização da tela falhou (${curationErrorLabel(error)}).`);
        });
      }
      const stopped = controlRef.current.stop;
      const skippedCount = Math.max(0, analysisItems.length - processedCount);
      setRunSummary({
        total:requestedAnalysisItems.length,
        queued:analysisItems.length,
        published:publishedCount,
        alreadyPublished:alreadyPublishedItems.length,
        failed:failedCount,
        skipped:skippedCount,
        stopped,
      });
      addRunLog(
        stopped ? 'warning' : failedCount ? 'warning' : 'success',
        stopped
          ? `Fila interrompida: ${publishedCount} publicada(s), ${alreadyPublishedItems.length} já pronta(s), ${failedCount} pendente(s) e ${skippedCount} não iniciada(s).`
          : `Fila concluída: ${publishedCount} publicada(s), ${alreadyPublishedItems.length} já estava(m) pronta(s) e ${failedCount} pendente(s).`,
      );
      addToast(
        stopped
          ? 'Fila interrompida com o progresso preservado.'
          : failedCount
            ? `Curadoria concluída: ${publishedCount} publicada(s) e ${failedCount} pendente(s) para retomar.`
            : publishedCount
              ? `${analysisScopeLabel === 'aula' ? 'Aula analisada' : 'Aulas analisadas'} e seleção automática publicada${publishedCount === 1 ? '' : 's'}.`
              : 'As aulas selecionadas já estavam completas e publicadas.',
        stopped || failedCount ? 'info' : 'success',
        4500,
      );
    } catch(error) {
      console.error('question metadata analysis failed:', error);
      addRunLog('error', `A fila encontrou um erro interno em ${currentItem?.title || 'uma aula'} (${curationErrorLabel(error)}).`);
      addToast(error?.message === 'API_KEY_MISSING'
        ? 'Nenhuma chave Gemini válida foi encontrada no pool administrativo.'
        : 'A fila encontrou um erro interno. Os lotes já concluídos foram preservados.', 'error', 5500);
    } finally {
      controlRef.current = { paused:false, stop:false };
      keyPoolRef.current = [];
      keyCursorRef.current = 0;
      setRunning(false);
      setPaused(false);
      setStopping(false);
    }
  };

  const questionRows = React.useMemo(() => targetItems.flatMap(item => {
    const questionById = new Map(flattenSharedLibraryQuestions(item).map(question => [String(question.id), question]));
    const analysis = displayedAnalysesByItem[String(item.id)] || EMPTY_ANALYSIS;
    if (!analysisMatchesItem(item, analysis.manifest)) return [];
    return Object.values(analysis.metadataByQuestion || {})
      .filter(metadata => metadata?.analysisVersion === QUESTION_METADATA_ANALYSIS_VERSION
        && questionById.has(String(metadata.questionId)))
      .map(metadata => ({
        key:`${item.id}::${metadata.questionId}`,
        item,
        question:questionById.get(String(metadata.questionId)),
        metadata,
      }));
  }), [displayedAnalysesByItem, targetItems]);
  const filteredRows = questionRows.filter(row => {
    const needle = search.toLocaleLowerCase('pt-BR').trim();
    const matchesSearch = !needle || `${row.item.title} ${row.question?.statement || ''} ${row.metadata.rationale || ''}`
      .toLocaleLowerCase('pt-BR').includes(needle);
    return matchesSearch
      && (statusFilter === 'all' || row.metadata.status === statusFilter)
      && (roleFilter === 'all' || row.metadata.learningRole === roleFilter);
  });
  const totalQuestions = targetItems.reduce((total, item) => total + itemQuestionCount(item), 0);
  const completedCount = targetItems.reduce((total, item) => {
    const manifest = displayedAnalysesByItem[String(item.id)]?.manifest;
    return total + (analysisMatchesItem(item, manifest)
      ? Math.min(Number(manifest?.completedCount) || 0, itemQuestionCount(item))
      : 0);
  }, 0);
  const completion = totalQuestions ? Math.round(completedCount / totalQuestions * 100) : 0;
  const alreadyPublishedCount = analysesLoaded ? targetItems.filter(item => {
    const analysis = displayedAnalysesByItem[String(item.id)];
    return analysisIsCompleteForItem(item, analysis)
      && learningSelectionMatchesAnalysis(item, analysis.manifest);
  }).length : 0;
  const pendingTargetCount = analysesLoaded
    ? Math.max(0, targetItems.length - alreadyPublishedCount)
    : targetItems.length;
  const pausedManifest = targetItems
    .map(item => ({ item, manifest:displayedAnalysesByItem[String(item.id)]?.manifest }))
    .find(entry => entry.manifest?.status === 'paused' && analysisMatchesItem(entry.item, entry.manifest));
  const exportableItem = selectedItemId === 'all' ? null : targetItems.find(item => {
    const analysis = displayedAnalysesByItem[String(item.id)];
    return !!buildSelectionForAnalysis(item, analysis);
  }) || null;

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-5 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Curadoria sem regeneração</p>
            <h3 className="mt-1 font-serif text-2xl font-bold">Metadados por matéria, em lotes otimizados</h3>
            <p className={`mt-1 max-w-3xl text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>
              Selecione uma ou mais matérias. Cada aula é analisada em lotes retomáveis de até 30 questões e a seleção pedagógica é publicada automaticamente ao terminar.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!running&&<button type="button" onClick={refreshAnalyses} disabled={analysesLoading||!targetItems.length} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-35 ${darkMode?'border-gray-600 text-gray-200':'border-gray-300 text-gray-700'}`}>{analysesLoading&&<Spinner className="h-4 w-4"/>}{analysesLoading?'Atualizando…':'Atualizar metadados'}</button>}
            {!running&&<button type="button" onClick={()=>exportCurationAudit(exportableItem)} disabled={!exportableItem} className={`rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-35 ${darkMode?'border-gray-600 text-gray-300':'border-gray-300 text-gray-700'}`}>{selectedItemId === 'all' ? 'Selecione uma aula para exportar' : 'Exportar auditoria'}</button>}
            {running
              ? <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={paused?resumeRun:pauseRun} disabled={stopping} className={`rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40 ${darkMode?'border-gray-600 text-gray-200':'border-gray-300 text-gray-700'}`}>{paused?'Continuar':'Pausar'}</button>
                  <button type="button" onClick={stopRun} disabled={stopping} className="rounded-xl border border-red-400 px-4 py-2.5 text-sm font-bold text-red-500 disabled:opacity-40">{stopping?'Parando…':'Parar'}</button>
                </div>
              : <button onClick={()=>runAnalysis()} disabled={analysesLoading||!pendingTargetCount||!totalQuestions} className="rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Curar e publicar {selectedScopeLabel}{analysesLoaded?` · ${pendingTargetCount} pendente${pendingTargetCount===1?'':'s'}`:''}</button>}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <div className={`rounded-xl border p-3 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold">Matérias <span className="font-medium opacity-50">({selectedSubjects.length} selecionada{selectedSubjects.length===1?'':'s'})</span></p>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <button type="button" disabled={running||analysesLoading||selectedSubjects.length===subjects.length} onClick={()=>{setSelectedSubjects(subjects);setSelectedItemId('all');}} className="text-yellow-600 disabled:opacity-35">Todas</button>
                <button type="button" disabled={running||analysesLoading||!selectedSubjects.length} onClick={()=>{setSelectedSubjects([]);setSelectedItemId('all');}} className="opacity-55 disabled:opacity-25">Limpar</button>
              </div>
            </div>
            <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {subjects.map(subject => {
                const checked = selectedSubjects.includes(subject);
                const count = orderedItems.filter(item => item.subject === subject).length;
                return <label key={subject} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${running||analysesLoading?'cursor-not-allowed opacity-50':''} ${checked?(darkMode?'border-yellow-700 bg-yellow-950/25 text-yellow-200':'border-yellow-400 bg-yellow-50 text-yellow-900'):(darkMode?'border-gray-700 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                  <input type="checkbox" checked={checked} disabled={running||analysesLoading} onChange={event=>{
                    const enabled = event.target.checked;
                    setSelectedSubjects(current => subjects.filter(value => enabled ? current.includes(value)||value===subject : current.includes(value)&&value!==subject));
                    setSelectedItemId('all');
                  }}/>
                  <span className="min-w-0 flex-1 truncate font-bold">{subject}</span>
                  <span className="flex-shrink-0 opacity-45">{count}</span>
                </label>;
              })}
            </div>
          </div>
          <label className="text-xs font-bold">Aula específica
            <select value={selectedItemId} onChange={event=>setSelectedItemId(event.target.value)} disabled={running||analysesLoading||selectedSubjects.length!==1} className={`mt-1 ${fieldClass(darkMode)}`}>
              <option value="all">{selectedSubjects.length===1?`Todas as aulas da matéria (${subjectItems.length})`:'Disponível ao selecionar uma matéria'}</option>
              {subjectItems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            {selectedSubjects.length>1&&<span className="mt-2 block text-[10px] font-medium opacity-50">Com várias matérias, a fila inclui todas as aulas selecionadas.</span>}
          </label>
          <div className={`min-w-44 rounded-xl border px-4 py-3 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <p className="text-2xl font-serif font-bold text-yellow-600">{analysesLoading ? '…' : analysesLoaded ? `${completion}%` : '—'}</p>
            <p className="text-[10px] font-bold uppercase opacity-50">{analysesLoaded ? `${completedCount}/${totalQuestions} analisadas` : 'Atualização manual'}</p>
            {analysesLoaded&&!!analysisRead.updatedAt&&<p className="mt-1 text-[10px] opacity-40">Atualizado às {new Date(analysisRead.updatedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>}
            {analysesLoaded&&!!alreadyPublishedCount&&<p className="mt-1 text-[10px] font-bold text-green-500">{alreadyPublishedCount} já publicada{alreadyPublishedCount===1?'':'s'} · fora da fila</p>}
          </div>
        </div>

        {analysisRead.error&&analysisRead.errorScopeKey===analysisScopeKey&&<p className="mt-4 rounded-xl border border-red-300 px-3 py-2 text-xs text-red-500">Não foi possível atualizar os metadados: {analysisRead.error}</p>}
        {!analysesLoaded&&!analysesLoading&&<p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode?'border-gray-700 bg-gray-900/50 text-gray-300':'border-gray-200 bg-gray-50 text-gray-700'}`}>Clique em Atualizar metadados para consultar o progresso desta seleção.</p>}

        {analysesLoaded && selectedItemId === 'all' && targetItems.length > 1 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {targetItems.map(item => {
              const manifest = displayedAnalysesByItem[String(item.id)]?.manifest;
              const total = itemQuestionCount(item);
              const done = analysisMatchesItem(item, manifest)
                ? Math.min(Number(manifest?.completedCount) || 0, total)
                : 0;
              const alreadyPublished = analysisIsCompleteForItem(item, displayedAnalysesByItem[String(item.id)])
                && learningSelectionMatchesAnalysis(item, manifest);
              return <div key={item.id} className={`rounded-xl border px-3 py-2.5 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <strong className="min-w-0 truncate">{item.title}</strong>
                  <span className={`flex-shrink-0 ${alreadyPublished?'text-green-500':'text-yellow-600'}`}>{alreadyPublished?'Publicada':`${done}/${total}`}</span>
                </div>
                <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-yellow-500" style={{width:`${total ? done / total * 100 : 0}%`}}/>
                </div>
              </div>;
            })}
          </div>
        )}

        {(running || pausedManifest)&&(
          <div className={`mt-4 rounded-xl border p-3 text-sm ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">{running&&!paused&&<Spinner className="h-4 w-4 flex-shrink-0"/>}<span className="truncate">{running ? paused ? 'Fila pausada; o próximo lote aguardará.' : progress.label : `Pausada em ${pausedManifest.item.title}; clique para retomar.`}</span></span>
              <strong className="flex-shrink-0">{running ? `${progress.current}/${progress.total}` : pausedManifest.manifest.lastError || ''}</strong>
            </div>
          </div>
        )}

        {runSummary&&!running&&(
          <div className={`mt-4 grid grid-cols-2 gap-2 rounded-xl border p-3 text-center sm:grid-cols-5 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <div><strong className="block text-lg text-green-500">{runSummary.published}</strong><span className="text-[10px] font-bold uppercase opacity-50">publicadas</span></div>
            <div><strong className="block text-lg text-blue-500">{runSummary.alreadyPublished || 0}</strong><span className="text-[10px] font-bold uppercase opacity-50">já prontas</span></div>
            <div><strong className="block text-lg text-orange-500">{runSummary.failed}</strong><span className="text-[10px] font-bold uppercase opacity-50">pendentes</span></div>
            <div><strong className="block text-lg">{runSummary.skipped}</strong><span className="text-[10px] font-bold uppercase opacity-50">não iniciadas</span></div>
            <div><strong className="block text-lg">{runSummary.total}</strong><span className="text-[10px] font-bold uppercase opacity-50">selecionadas</span></div>
          </div>
        )}

        {!!runLogs.length&&(
          <div className={`mt-4 rounded-xl border ${darkMode?'border-gray-700 bg-gray-950/60':'border-gray-200 bg-gray-50'}`}>
            <div className={`flex items-center justify-between border-b px-3 py-2 ${darkMode?'border-gray-700':'border-gray-200'}`}>
              <div><p className="text-xs font-bold">Registro da fila</p><p className="text-[10px] opacity-50">Tentativas, rotação de chaves, validação, salvamento e publicação</p></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${running?(paused?'bg-orange-500/15 text-orange-500':'bg-blue-500/15 text-blue-500'):'bg-gray-500/15 opacity-60'}`}>{running?(paused?'pausada':'executando'):'finalizada'}</span>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto p-3">
              {runLogs.map(log=><p key={log.id} className={`text-xs leading-relaxed ${log.type==='error'?'text-red-500':log.type==='success'?'text-green-500':log.type==='warning'?'text-orange-500':'opacity-65'}`}><span className="mr-1 opacity-50">{log.time}</span>{log.message}</p>)}
            </div>
          </div>
        )}
      </section>

      <section className={`rounded-2xl border p-5 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-500">Prioridade real</p>
            <h3 className="mt-1 font-serif text-xl font-bold">Aulas assistidas aguardando curadoria</h3>
            <p className={`mt-1 text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Essas aulas já foram concluídas por pelo menos uma pessoa. O processamento coletivo analisa e publica cada uma em sequência.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <button type="button" onClick={refreshWatchedDemand} disabled={watchedDemand.loading||running} className={`inline-flex min-h-[42px] flex-shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40 ${darkMode?'border-gray-600 text-gray-200':'border-gray-300 text-gray-700'}`}>
              {watchedDemand.loading&&<Spinner className="h-4 w-4"/>}
              {watchedDemand.loading?'Atualizando…':'Atualizar prioridades'}
            </button>
            {!!watchedDemand.rows.length&&<button type="button" onClick={()=>runAnalysis(watchedDemand.rows.map(row=>row.item))} disabled={running||watchedDemand.loading} className="inline-flex min-h-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Curar e publicar todas · {watchedDemand.rows.length}</button>}
            {!!watchedDemand.updatedAt&&!watchedDemand.loading&&<span className="text-[10px] opacity-45">Atualizado às {new Date(watchedDemand.updatedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</span>}
          </div>
        </div>
        {watchedDemand.error&&<p className="mt-4 rounded-xl border border-red-300 px-3 py-2 text-xs text-red-500">Não foi possível atualizar esta prioridade: {watchedDemand.error}</p>}
        {!watchedDemand.loaded&&!watchedDemand.loading&&<p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode?'border-gray-700 bg-gray-900/50 text-gray-300':'border-gray-200 bg-gray-50 text-gray-700'}`}>Clique em Atualizar prioridades quando quiser consultar as aulas assistidas.</p>}
        {watchedDemand.loaded&&!watchedDemand.loading&&!watchedDemand.rows.length&&!watchedDemand.error&&<p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode?'border-green-900 bg-green-950/20 text-green-300':'border-green-200 bg-green-50 text-green-800'}`}>Nenhuma aula assistida está pendente.</p>}
        {!!watchedDemand.rows.length&&<div className="mt-4 grid gap-2 lg:grid-cols-2">
          {watchedDemand.rows.map(({ item, viewers, curated })=><article key={item.id} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs opacity-55">{item.subject} · assistida por {viewers} {viewers===1?'pessoa':'pessoas'}</p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${curated?(darkMode?'bg-blue-950 text-blue-300':'bg-blue-100 text-blue-700'):(darkMode?'bg-orange-950 text-orange-300':'bg-orange-100 text-orange-700')}`}>{curated?'Analisada':'Pendente'}</span>
            </div>
          </article>)}
        </div>}
      </section>

      <section className={`rounded-2xl border p-5 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className="grid gap-2 md:grid-cols-[1fr_180px_180px]">
          <input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar aula, questão ou justificativa…" className={fieldClass(darkMode)}/>
          <select value={roleFilter} onChange={event=>setRoleFilter(event.target.value)} className={fieldClass(darkMode)}>
            <option value="all">Todos os papéis</option><option value="core">Essencial</option><option value="reinforcement">Reforço</option><option value="variation">Variação</option><option value="exam_only">Só prova</option>
          </select>
          <select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)} className={fieldClass(darkMode)}>
            <option value="all">Todos os status</option><option value="active">Ativa</option><option value="reserve">Reserva</option><option value="review_required">Revisar</option><option value="deprecated">Descontinuada</option>
          </select>
        </div>
        <div className="mt-4 space-y-2">
          {!questionRows.length
            ? <p className="py-8 text-center text-sm opacity-50">{analysesLoaded?'Esta seleção ainda não possui metadados analisados.':'Atualize os metadados acima para consultar esta seleção.'}</p>
            : filteredRows.map(({ key, item, question, metadata }) => <article key={key} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-yellow-600">{item.subject} · {item.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                <span>{metadata.learningRole}</span><span className="opacity-35">·</span><span>{metadata.status}</span><span className="opacity-35">·</span><span>importância {metadata.importance}/5</span><span className="opacity-35">·</span><span>qualidade {Math.round(metadata.qualityScore)}</span>
                {metadata.needsVisual&&<span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-blue-500">precisa {metadata.visualType}</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed">{compact(question?.statement || metadata.questionId)}</p>
              <p className="mt-2 text-xs opacity-55">{metadata.rationale || 'Sem justificativa textual.'}</p>
            </article>)}
        </div>
      </section>
    </div>
  );
}
