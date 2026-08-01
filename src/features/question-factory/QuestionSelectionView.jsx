import React from 'react';

import { useFeatureContext } from '../FeatureContext.jsx';
import {
  buildLearningSelectionSnapshot,
  flattenSharedLibraryQuestions,
  questionSetSignature,
  selectLearningQuestions,
} from '../../services/questionMetadata.js';
import {
  loadQuestionMetadataAnalysis,
  publishLearningSelection,
} from '../../services/questionMetadataStore.js';

const labels = {
  essential:'Essenciais',
  complementary:'Complementares',
  reserve:'Reserva',
  disabled:'Desativadas/revisão',
};

const emptySelection = () => ({
  essential:[],
  complementary:[],
  reserve:[],
  disabled:[],
  totals:{ available:0, essential:0, complementary:0, reserve:0, disabled:0 },
});

const fieldClass = darkMode =>
  `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${darkMode
    ? 'border-gray-700 bg-gray-900 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900'}`;

export default function QuestionSelectionView({ items = [], subjectOrder = [] }) {
  const { addToast, darkMode, refreshSharedLibrary, Spinner } = useFeatureContext();
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const orderedItems = React.useMemo(() => [...items].sort((left, right) => {
    const leftRank = subjectOrder.indexOf(left.subject);
    const rightRank = subjectOrder.indexOf(right.subject);
    return (leftRank < 0 ? Number.MAX_SAFE_INTEGER : leftRank)
      - (rightRank < 0 ? Number.MAX_SAFE_INTEGER : rightRank)
      || String(left.title).localeCompare(String(right.title), 'pt-BR');
  }), [items, subjectOrder]);
  const subjects = React.useMemo(
    () => [...new Set(orderedItems.map(item => item.subject).filter(Boolean))],
    [orderedItems],
  );
  const [selectedSubject, setSelectedSubject] = React.useState(subjects[0] || '');
  const [selectedItemId, setSelectedItemId] = React.useState('all');
  const [analysesByItem, setAnalysesByItem] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [group, setGroup] = React.useState('essential');

  React.useEffect(() => {
    if (subjects.includes(selectedSubject)) return;
    setSelectedSubject(subjects[0] || '');
    setSelectedItemId('all');
  }, [selectedSubject, subjects]);

  const subjectItems = React.useMemo(
    () => orderedItems.filter(item => item.subject === selectedSubject),
    [orderedItems, selectedSubject],
  );
  React.useEffect(() => {
    if (selectedItemId === 'all') return;
    if (subjectItems.some(item => String(item.id) === String(selectedItemId))) return;
    setSelectedItemId('all');
  }, [selectedItemId, subjectItems]);

  const targetItems = React.useMemo(
    () => selectedItemId === 'all'
      ? subjectItems
      : subjectItems.filter(item => String(item.id) === String(selectedItemId)),
    [selectedItemId, subjectItems],
  );
  const targetKey = targetItems.map(item => {
    const questions = flattenSharedLibraryQuestions(item);
    return `${item.id}:${questionSetSignature(questions)}`;
  }).join('|');

  React.useEffect(() => {
    let alive = true;
    const requestedItems = targetItems;
    if (!requestedItems.length) {
      setAnalysesByItem({});
      setLoading(false);
      return () => { alive = false; };
    }

    setAnalysesByItem({});
    setLoading(true);
    Promise.allSettled(requestedItems.map(async item => [
      String(item.id),
      await loadQuestionMetadataAnalysis(item.id),
    ]))
      .then(results => {
        if (!alive) return;
        const successful = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        setAnalysesByItem(Object.fromEntries(successful));
        const failedCount = results.length - successful.length;
        if (failedCount) {
          addToastRef.current(`Não consegui carregar os metadados de ${failedCount} aula(s).`, 'error', 4500);
        }
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
    // targetKey é uma assinatura primitiva e estável. Usar targetItems ou addToast aqui
    // reiniciava a consulta a cada renderização do App e prendia a página no topo.
  }, [targetKey]);

  const itemResults = React.useMemo(() => targetItems.map(item => {
    const questions = flattenSharedLibraryQuestions(item);
    const analysis = analysesByItem[String(item.id)];
    const ready = analysis?.manifest?.status === 'complete'
      && analysis.manifest.questionSignature === questionSetSignature(questions);
    return {
      item,
      questions,
      analysis,
      ready,
      selection:ready
        ? selectLearningQuestions({
            questions,
            metadataByQuestion:analysis.metadataByQuestion || {},
            concepts:analysis.manifest.concepts || [],
          })
        : null,
    };
  }), [analysesByItem, targetItems]);

  const readyItems = itemResults.filter(result => result.ready);
  const pendingItems = itemResults.filter(result => !result.ready);
  const selection = React.useMemo(() => itemResults.reduce((combined, result) => {
    if (!result.selection) return combined;
    Object.keys(labels).forEach(key => {
      combined[key].push(...result.selection[key].map(row => ({ ...row, item:result.item })));
      combined.totals[key] += result.selection.totals[key];
    });
    combined.totals.available += result.selection.totals.available;
    return combined;
  }, emptySelection()), [itemResults]);
  const visibleRows = selection[group] || [];
  const publishedReadyItems = readyItems.filter(({ item, questions }) =>
    item?.learningSelection?.questionSignature === questionSetSignature(questions)
    && Number(item?.learningSelection?.metadataCompletedAt || 0)
      === Number(analysesByItem[String(item.id)]?.manifest?.completedAt || 0)
  );
  const publishReadySelections = async () => {
    if (!readyItems.length || publishing) return;
    setPublishing(true);
    const publishedAt = Date.now();
    try {
      await Promise.all(readyItems.map(result => publishLearningSelection({
        itemId:result.item.id,
        learningSelection:buildLearningSelectionSnapshot({
          selection:result.selection,
          questionSignature:questionSetSignature(result.questions),
          metadataCompletedAt:result.analysis?.manifest?.completedAt,
          publishedAt,
        }),
      })));
      await refreshSharedLibrary?.();
      addToastRef.current(
        `${readyItems.length} seleção${readyItems.length === 1 ? '' : 'ões'} publicada${readyItems.length === 1 ? '' : 's'} na revisão adaptativa.`,
        'success',
        5500,
      );
    } catch(error) {
      console.error('Learning selection publication failed:', error);
      addToastRef.current('Não consegui publicar a seleção na revisão.', 'error', 5000);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-5 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Seleção determinística</p>
        <h3 className="mt-1 font-serif text-2xl font-bold">Seleção por matéria, sem obrigar o aluno a zerar o banco</h3>
        <p className={`mt-1 max-w-3xl text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>
          Escolha a matéria inteira ou uma aula específica. Na matéria completa, cada aula preserva sua própria cobertura conceitual e os resultados são reunidos em uma única visão.
        </p>

        <div className={`mt-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${darkMode?'border-blue-900/60 bg-blue-950/20':'border-blue-200 bg-blue-50'}`}>
          <div>
            <p className="text-sm font-bold">Publicação para a revisão</p>
            <p className={`mt-0.5 text-xs ${darkMode?'text-blue-200/70':'text-blue-800/70'}`}>
              A prévia só controla a fila dos alunos depois de publicada. A curadoria completa continua privada.
            </p>
          </div>
          <button
            type="button"
            onClick={publishReadySelections}
            disabled={publishing || loading || !readyItems.length || publishedReadyItems.length === readyItems.length}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-45"
          >
            {publishing&&<Spinner className="h-4 w-4"/>}
            {publishedReadyItems.length === readyItems.length && readyItems.length
              ? 'Seleção já publicada'
              : `Publicar ${readyItems.length || ''} ${readyItems.length === 1 ? 'aula' : 'aulas'}`}
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-bold">Matéria
            <select value={selectedSubject} onChange={event=>{setSelectedSubject(event.target.value);setSelectedItemId('all');}} className={fieldClass(darkMode)}>
              {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Aula específica
            <select value={selectedItemId} onChange={event=>setSelectedItemId(event.target.value)} className={fieldClass(darkMode)}>
              <option value="all">Todas as aulas da matéria ({subjectItems.length})</option>
              {subjectItems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <div className={`min-w-44 rounded-xl border px-4 py-3 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <p className="font-serif text-2xl font-bold text-yellow-600">{loading ? '…' : `${readyItems.length}/${targetItems.length}`}</p>
            <p className="text-[10px] font-bold uppercase opacity-50">aulas prontas</p>
          </div>
        </div>

        {selectedItemId === 'all' && targetItems.length > 1 && !loading && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {itemResults.map(({ item, ready, questions }) => <div key={item.id} className={`rounded-xl border px-3 py-2.5 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <strong className="min-w-0 truncate">{item.title}</strong>
                <span className={ready?'text-emerald-500':'text-orange-500'}>{ready ? `${questions.length} questões` : 'Curadoria pendente'}</span>
              </div>
            </div>)}
          </div>
        )}
      </section>

      {loading
        ? <div className="flex items-center justify-center gap-2 py-12 text-sm opacity-60"><Spinner className="h-4 w-4"/>Montando seleção…</div>
        : !readyItems.length
          ? <section className={`rounded-2xl border p-8 text-center ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
              <p className="font-bold">Analise todos os lotes deste recorte na Curadoria primeiro.</p>
              <p className="mt-1 text-sm opacity-55">A seleção não toma decisões com metadados incompletos.</p>
            </section>
          : <>
            {!!pendingItems.length&&<section className={`rounded-xl border px-4 py-3 text-sm ${darkMode?'border-orange-900/60 bg-orange-950/20 text-orange-200':'border-orange-200 bg-orange-50 text-orange-800'}`}>
              A seleção abaixo já reúne {readyItems.length} aula(s). Ainda faltam {pendingItems.length} na Curadoria: {pendingItems.map(result => result.item.title).join(', ')}.
            </section>}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ['available', 'Geradas'],
                ['essential', 'Essenciais'],
                ['complementary', 'Complementares'],
                ['reserve', 'Reserva'],
                ['disabled', 'Desativadas'],
              ].map(([key, label]) => <div key={key} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
                <p className="font-serif text-2xl font-bold text-yellow-600">{selection.totals[key]}</p>
                <p className="text-[10px] font-bold uppercase opacity-50">{label}</p>
              </div>)}
            </section>
            <section className={`rounded-2xl border p-5 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
              <div className="flex flex-wrap gap-2">
                {Object.keys(labels).map(key =>
                  <button key={key} type="button" onClick={()=>setGroup(key)} className={`rounded-lg px-3 py-2 text-xs font-bold ${group===key?'bg-yellow-600 text-white':darkMode?'bg-gray-900 text-gray-300':'bg-gray-100 text-gray-700'}`}>{labels[key]} · {selection.totals[key]}</button>)}
              </div>
              <div className="mt-4 space-y-2">
                {!visibleRows.length&&<p className="py-8 text-center text-sm opacity-45">Nenhuma questão neste grupo.</p>}
                {visibleRows.map(row => <article key={`${row.item.id}:${row.question.id}`} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-yellow-600">{row.item.subject} · {row.item.title}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                    <span className="text-yellow-600">{row.metadata.learningRole}</span>
                    <span className="opacity-40">importância {row.metadata.importance}/5</span>
                    <span className="opacity-40">qualidade {Math.round(row.metadata.qualityScore)}</span>
                    <span className="opacity-40">redundância {Math.round(row.metadata.redundancyScore * 100)}%</span>
                  </div>
                  <p className="mt-2 text-sm">{row.question.statement}</p>
                  {row.reason&&<p className="mt-2 text-xs opacity-55">{row.reason}</p>}
                </article>)}
              </div>
            </section>
          </>}
    </div>
  );
}
