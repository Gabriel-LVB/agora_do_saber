import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { QuestionView } from '../questions/QuestionFeature.jsx';
import {
  deleteFamedContent,
  deleteLegacyFamedContent,
  famedContentToAcademiaSubject,
  saveFamedAcademiaSubject,
  setFamedContentPublished,
  subscribeFamedContent,
} from '../../services/famedContent.js';
import { FAMED_PROGRAM } from './famedCatalog.js';
import FamedScheduleView from './FamedScheduleView.jsx';
import { FAMED_S5_SCHEDULE } from './famedSchedule.js';

const AcademiaTopicView = React.lazy(() => import('../academia/AcademiaTopicView.jsx'));
const AdminStudyMapTopicList = React.lazy(() => import('../admin/AdminStudyMapTopicList.jsx'));

const readStoredObject = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch(error) {
    return {};
  }
};

const topicFixationQuestions = topic => Object.values(topic?.fixationQuestions || {}).flat();
const topicAllQuestions = topic => [
  ...topicFixationQuestions(topic),
  ...(topic?.extraBattery || []).flatMap(block => block.questions || block || []),
];
const normalizeQuestions = questions => (questions || []).map(question => ({
  ...question,
  libraryQuestionKind:question.libraryQuestionKind || (question.caseContext ? 'clinical' : 'direct'),
}));

export default function FamedPortalView() {
  const {
    academiaExtraBusy,
    academiaGenProgress,
    academiaGenerating,
    academiaTopicAnswers,
    addToast,
    bulkActionMenu,
    bulkGenerateModal,
    bulkGenerateRun,
    callWithRotation,
    ChevronDown,
    darkMode,
    findErrorNotebookReviewsForSource,
    generateAcademiaLesson,
    getBulkGenerateTargets,
    getKey,
    getTopicStudyPlan,
    isAdmin,
    openAcademiaRegenModal,
    openBulkGenerateModal,
    openErrorNotebookReviewResult,
    parseHtmlText,
    PlusIcon,
    Printer,
    reviewQueue,
    RotateCcw,
    saveSettings,
    setAcademiaExportModal,
    setAcademiaExtraModal,
    setAcademiaTopicAnswers,
    setBulkActionMenu,
    setOpenAnswerModal,
    setSettings,
    setSrModal,
    setView,
    settings,
    Spinner,
    startFamedAcademiaCreation,
    subjectProgress,
    trackQuestionAnswered,
    Zap,
  } = useFeatureContext();
  const [contentItems, setContentItems] = React.useState([]);
  const [contentLoading, setContentLoading] = React.useState(true);
  const [contentError, setContentError] = React.useState('');
  const [activeContentId, setActiveContentId] = React.useState(null);
  const [activeTopicId, setActiveTopicId] = React.useState(null);
  const [activePanel, setActivePanel] = React.useState('schedule');
  const [activeQuestionSet, setActiveQuestionSet] = React.useState(null);
  const [answersByBlock, setAnswersByBlock] = React.useState(()=>readStoredObject('agora_famed_answers'));
  const [favoritesByBlock, setFavoritesByBlock] = React.useState(()=>readStoredObject('agora_famed_favorites'));
  const [cleaningLegacy, setCleaningLegacy] = React.useState(false);
  const [savingContent, setSavingContent] = React.useState(false);
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('agora-famed-detail-layout', {
      detail:{ active:activePanel !== 'schedule' },
    }));
    return () => window.dispatchEvent(new CustomEvent('agora-famed-detail-layout', { detail:{ active:false } }));
  }, [activePanel]);
  React.useEffect(() => subscribeFamedContent({
    isAdmin,
    onData:items => {
      setContentItems(items);
      setContentLoading(false);
      setContentError('');
    },
    onError:error => {
      setContentLoading(false);
      setContentError(error?.message || 'Não foi possível carregar o conteúdo da FAMED.');
    },
  }), [isAdmin]);

  const contentByScheduleId = React.useMemo(() => Object.fromEntries(
    contentItems
      .filter(item => item.semester === 'S5' && item.creationMode === 'academia')
      .map(item => [item.scheduleItemId, item]),
  ), [contentItems]);
  const legacyContentItems = React.useMemo(() => contentItems.filter(item => item.creationMode !== 'academia'), [contentItems]);
  const activeContent = contentItems.find(item => item.id === activeContentId) || null;
  const activeSubject = React.useMemo(() => famedContentToAcademiaSubject(activeContent), [activeContent]);
  const activeSubjectWithProgress = React.useMemo(() => activeSubject ? ({
    ...activeSubject,
    topics:(activeSubject.topics || []).map(topic => ({
      ...topic,
      answers:{
        ...(topic.answers || {}),
        ...(answersByBlock[`${activeSubject.famedMeta.contentId}:${topic.id}:fixation:main`] || {}),
      },
    })),
  }) : null, [activeSubject, answersByBlock]);
  const activeTopic = activeSubject?.topics?.find(topic => String(topic.id) === String(activeTopicId)) || null;

  const returnToSchedule = () => {
    setActivePanel('schedule');
    setActiveContentId(null);
    setActiveTopicId(null);
    setActiveQuestionSet(null);
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openSubject = content => {
    const subject = famedContentToAcademiaSubject(content);
    setActiveContentId(content.id);
    const openSingleTopicDirectly = !isAdmin && subject?.topics?.length === 1;
    setActiveTopicId(openSingleTopicDirectly ? subject.topics[0].id : null);
    setActivePanel(openSingleTopicDirectly ? 'topic' : 'subject');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const saveAnswers = next => {
    setAnswersByBlock(next);
    localStorage.setItem('agora_famed_answers', JSON.stringify(next));
  };
  const saveFavorites = next => {
    setFavoritesByBlock(next);
    localStorage.setItem('agora_famed_favorites', JSON.stringify(next));
  };
  const persistSubject = async subject => {
    if (!isAdmin) return;
    await saveFamedAcademiaSubject(subject);
  };
  const openQuestions = (subject, topic, kind='fixation', block=null) => {
    const questions = kind === 'extra' ? (block?.questions || block || []) : topicFixationQuestions(topic);
    if (!questions.length) return;
    setActiveContentId(subject.famedMeta.contentId);
    setActiveTopicId(topic.id);
    setActiveQuestionSet({
      id:`${subject.famedMeta.contentId}:${topic.id}:${kind}:${block?.id || 'main'}`,
      title:kind === 'extra' ? (block?.title || 'Bateria extra') : 'Questões de fixação',
      questions:normalizeQuestions(questions),
    });
    setActivePanel('questions');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openAllQuestions = content => {
    const subject = famedContentToAcademiaSubject(content);
    const questions = normalizeQuestions((subject?.topics || []).flatMap(topicAllQuestions));
    if (!questions.length) return;
    setActiveContentId(content.id);
    setActiveTopicId(null);
    setActiveQuestionSet({ id:`${content.id}:all`, title:`${content.title} · Questões`, questions });
    setActivePanel('questions');
  };
  const handleAcademiaDelete = async payload => {
    if (payload?.type !== 'academia-extra-bloco' || !activeSubject) return;
    if (!window.confirm('Excluir esta bateria extra?')) return;
    const next = {
      ...activeSubject,
      topics:activeSubject.topics.map(topic => String(topic.id) === String(payload.topicId)
        ? {...topic, extraBattery:(topic.extraBattery || []).filter(block => String(block.id) !== String(payload.blocoId))}
        : topic),
    };
    await persistSubject(next);
  };
  const togglePublished = async () => {
    if (!activeContent || savingContent) return;
    setSavingContent(true);
    try {
      await setFamedContentPublished(activeContent, !activeContent.published);
      addToast?.(activeContent.published ? 'Aula retirada dos alunos.' : 'Aula publicada para os alunos.', 'success', 4500);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível alterar a publicação.', 'error', 5500);
    } finally {
      setSavingContent(false);
    }
  };
  const removeContent = async () => {
    if (!activeContent || !window.confirm(`Apagar toda a Academia “${activeContent.title}”?`)) return;
    setSavingContent(true);
    try {
      await deleteFamedContent(activeContent.id);
      addToast?.('Estrutura, aulas e questões apagadas.', 'success', 4500);
      returnToSchedule();
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível apagar o conteúdo.', 'error', 5500);
    } finally {
      setSavingContent(false);
    }
  };
  const cleanLegacyContent = async () => {
    if (cleaningLegacy || !window.confirm(`Apagar ${legacyContentItems.length} aula(s) do fluxo antigo e todas as imagens vinculadas? As Academias novas não serão afetadas.`)) return;
    setCleaningLegacy(true);
    try {
      const result = await deleteLegacyFamedContent(legacyContentItems);
      addToast?.(`${result.lessons} aula(s) antiga(s) e ${result.assets} imagem(ns) apagadas.`, 'success', 5500);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível limpar o conteúdo antigo.', 'error', 6500);
    } finally {
      setCleaningLegacy(false);
    }
  };
  const exportWholeSubject = () => {
    if (!activeSubject?.topics?.length) return;
    const boundaries = [];
    let offset = 0;
    activeSubject.topics.forEach(topic => {
      boundaries.push({ title:topic.title, start:offset, end:offset + (topic.subtopics || []).length });
      offset += (topic.subtopics || []).length;
    });
    const merged = {
      title:activeSubject.title,
      subtopics:activeSubject.topics.flatMap(topic => topic.subtopics || []),
      lessonSections:Object.assign({}, ...activeSubject.topics.map((topic, index) => {
        const topicOffset = boundaries[index].start;
        return Object.fromEntries(Object.entries(topic.lessonSections || {}).map(([key,value]) => [Number(key) + topicOffset, value]));
      })),
      fixationQuestions:Object.assign({}, ...activeSubject.topics.map((topic, index) => {
        const topicOffset = boundaries[index].start;
        return Object.fromEntries(Object.entries(topic.fixationQuestions || {}).map(([key,value]) => [Number(key) + topicOffset, value]));
      })),
      answers:Object.assign({}, ...activeSubject.topics.map(topic => topic.answers || {})),
      favorites:activeSubject.topics.flatMap(topic => topic.favorites || []),
      extraBattery:activeSubject.topics.flatMap(topic => topic.extraBattery || []),
      lessonGenerated:true,
      _topicBoundaries:boundaries,
    };
    setAcademiaExportModal({ topic:merged, subject:activeSubject });
  };

  if (activePanel === 'questions' && activeQuestionSet) {
    const blockAnswers = answersByBlock[activeQuestionSet.id] || {};
    const blockFavorites = favoritesByBlock[activeQuestionSet.id] || [];
    return <div className="desktop-content-limit"><QuestionView
      title={activeQuestionSet.title}
      backLabel={activeTopic ? activeTopic.title : 'FAMED · S5'}
      onBack={()=>setActivePanel(activeTopic?'topic':'subject')}
      questions={activeQuestionSet.questions}
      answers={blockAnswers}
      favorites={blockFavorites}
      onAnswer={(questionId,answer)=>saveAnswers({...answersByBlock,[activeQuestionSet.id]:{...blockAnswers,[questionId]:answer}})}
      onToggleFavorite={questionId=>saveFavorites({...favoritesByBlock,[activeQuestionSet.id]:blockFavorites.includes(questionId)?blockFavorites.filter(id=>id!==questionId):[...blockFavorites,questionId]})}
      onReset={()=>saveAnswers({...answersByBlock,[activeQuestionSet.id]:{}})}
      darkMode={darkMode}
      displayMode={settings.questionDisplayMode || 'list'}
      onDisplayModeChange={mode=>{const next={...settings,questionDisplayMode:mode};setSettings(next);saveSettings(next);}}
      onGoToAula={()=>setActivePanel(activeTopic?'topic':'subject')}
      goToAulaLabel="Abrir aula da Academia"
    /></div>;
  }

  if (activePanel === 'topic' && activeSubject && activeTopic) return <div className="desktop-content-limit"><React.Suspense fallback={<div className="py-20 text-center text-yellow-600">Abrindo Academia…</div>}><AcademiaTopicView
    topic={activeTopic}
    subject={activeSubject}
    library={[activeSubject]}
    darkMode={darkMode}
    isAdmin={isAdmin}
    canCreateFlashcards={isAdmin}
    canUseAcademia={isAdmin}
    academiaGenerating={academiaGenerating}
    academiaGenProgress={academiaGenProgress}
    academiaTopicAnswers={academiaTopicAnswers}
    setAcademiaTopicAnswers={setAcademiaTopicAnswers}
    academiaExtraBusy={academiaExtraBusy}
    settings={settings}
    setSettings={setSettings}
    saveSettings={saveSettings}
    updateSubject={persistSubject}
    generateAcademiaLesson={generateAcademiaLesson}
    setAcademiaExtraModal={setAcademiaExtraModal}
    setAcademiaRegenModal={openAcademiaRegenModal}
    setAcademiaExportModal={setAcademiaExportModal}
    setDeleteId={handleAcademiaDelete}
    setOpenAnswerModal={setOpenAnswerModal}
    getKey={getKey}
    callWithRotation={callWithRotation}
    parseHtmlText={parseHtmlText}
    onBack={()=>setActivePanel(!isAdmin&&activeSubject.topics.length === 1 ? 'schedule' : 'subject')}
    reviewQueue={reviewQueue}
    setSrModal={setSrModal}
    trackQuestionAnswered={trackQuestionAnswered}
    onOpenAcademiaQuestions={openQuestions}
    findErrorNotebookReviewsForSource={findErrorNotebookReviewsForSource}
    openErrorNotebookReviewResult={openErrorNotebookReviewResult}
  /></React.Suspense></div>;

  if (activePanel === 'subject' && activeContent && activeSubject) {
    const allReady = activeSubject.topics.length > 0 && activeSubject.topics.every(topic => topic.lessonGenerated && topicFixationQuestions(topic).length > 0);
    const allGenerated = activeSubject.topics.length > 0 && activeSubject.topics.every(topic => topic.lessonGenerated);
    const pendingCount = activeSubject.topics.filter(topic => !topic.lessonGenerated).length;
    const runningHere = bulkGenerateRun.running && bulkGenerateModal?.subjectId === activeSubject.id;
    const bulkActions = [
      {mode:'generate', label:'Gerar tudo', icon:<Zap className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'generate').length},
      {mode:'extra', label:'Gerar bateria extra de tudo', icon:<PlusIcon className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'extra').length},
      {divider:true},
      {mode:'regenAll', label:'Regenerar tudo', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenAll').length, danger:true},
      {mode:'regenLesson', label:'Regenerar aula', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenLesson').length, danger:true},
      {mode:'regenQuestions', label:'Regenerar questões', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenQuestions').length, danger:true},
    ];
    const scheduleItem = FAMED_S5_SCHEDULE.find(item => item.id === activeContent.scheduleItemId);
    const progress = subjectProgress(activeSubjectWithProgress || activeSubject);
    return <div className="desktop-content-limit">
      <button type="button" onClick={returnToSchedule} className={`flex items-center gap-2 mb-6 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>← Voltar às aulas</button>
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-45">FAMED · {activeContent.discipline}</p>
          <h2 className="text-3xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight">{activeSubject.title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-40 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${progress}%`}}/></div>
            <span className="text-sm font-bold text-yellow-600">{progress}% concluído</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin&&<div className="relative">
            <button type="button" onClick={()=>setBulkActionMenu(current=>current===activeSubject.id?null:activeSubject.id)} disabled={runningHere} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all disabled:opacity-50 ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>{runningHere?<Spinner className="w-4 h-4"/>:<Zap className="w-4 h-4"/>}{runningHere?'Rodando...':'Geração em lote'}<ChevronDown className="w-4 h-4 opacity-60"/></button>
            {bulkActionMenu===activeSubject.id&&<div className={`mobile-safe-action-menu absolute right-0 top-11 z-50 w-72 rounded-xl border shadow-xl overflow-hidden ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>{bulkActions.map((item,index)=>item.divider?<div key={`divider-${index}`} className={`my-1 border-t ${darkMode?'border-gray-700':'border-gray-100'}`}/>:<button type="button" key={item.mode} onClick={()=>openBulkGenerateModal(activeSubject,item.mode)} disabled={!item.count} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.danger?(darkMode?'text-orange-300 hover:bg-orange-900/20':'text-orange-700 hover:bg-orange-50'):(darkMode?'text-gray-200 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>{item.icon}<span className="flex-1">{item.label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${darkMode?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>{item.count}</span></button>)}</div>}
          </div>}
          <button type="button" onClick={allGenerated?exportWholeSubject:undefined} disabled={!allGenerated} title={allGenerated?'Exportar toda a pasta':`${pendingCount} aula(s) ainda não gerada(s)`} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${allGenerated?(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'):'opacity-40 cursor-not-allowed '+(darkMode?'border-gray-700 text-gray-500':'border-gray-200 text-gray-400')}`}><Printer className="w-4 h-4"/>{allGenerated?'Exportar pasta':`Exportar (${pendingCount} pendente${pendingCount!==1?'s':''})`}</button>
        </div>
      </div>
      {isAdmin&&<div className={`mb-6 rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={savingContent||(!activeContent.published&&!allReady)} onClick={togglePublished} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${activeContent.published?'bg-gray-600':'bg-green-600 hover:bg-green-700'}`}>{activeContent.published?'Retirar dos alunos':'Publicar para alunos'}</button><button type="button" onClick={()=>scheduleItem&&startFamedAcademiaCreation(scheduleItem)} className="rounded-xl border border-yellow-500 px-4 py-2.5 text-sm font-bold text-yellow-600">Refazer estrutura</button><button type="button" disabled={savingContent} onClick={removeContent} className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600">Apagar tudo</button></div>{!allReady&&<p className="mt-3 text-xs text-yellow-600">Gere a aula e as questões de fixação de todos os tópicos antes de publicar.</p>}</div>}
      <React.Suspense fallback={<div className="py-12 text-center text-yellow-600">Abrindo tópicos…</div>}><AdminStudyMapTopicList subject={activeSubjectWithProgress || activeSubject} darkMode={darkMode} getTopicStudyPlan={getTopicStudyPlan} onOpenTopic={topic=>{setActiveTopicId(topic.id);setActivePanel('topic');window.scrollTo?.({top:0,behavior:'smooth'});}}/></React.Suspense>
    </div>;
  }

  return <div className="desktop-content-limit famed-portal space-y-5 md:space-y-6">
    <button type="button" onClick={()=>setView('library')} className={`famed-back inline-flex min-h-[44px] items-center gap-2 text-sm font-bold ${darkMode?'text-gray-400 hover:text-yellow-400':'text-gray-600 hover:text-yellow-700'}`}>← Início</button>
    <section className="app-hero famed-hero rounded-2xl px-5 py-5 md:px-8 md:py-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-600">FAMED · {FAMED_PROGRAM.curriculum}</p>
      <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">Semestre 5</h1>
      <p className={`mt-2 text-sm md:text-base ${darkMode?'text-gray-400':'text-gray-600'}`}>Cardiologia e Pneumologia</p>
    </section>
    <section aria-label="Semestres" className="app-card famed-semesters rounded-2xl p-2 md:p-3"><div className="grid grid-cols-4 gap-2">{FAMED_PROGRAM.semesters.map(semester=><button key={semester.id} type="button" disabled={!semester.available} aria-current={semester.available?'page':undefined} className={`famed-semester flex min-h-[60px] w-full flex-col items-center justify-center rounded-xl border px-2 text-center md:min-h-[68px] ${semester.available?(darkMode?'border-yellow-800 bg-yellow-900/10 text-yellow-300':'border-yellow-400 bg-yellow-50 text-yellow-800'):(darkMode?'border-gray-800 bg-transparent text-gray-600':'border-gray-100 bg-gray-50 text-gray-300')} disabled:cursor-not-allowed`}><strong className="text-base md:text-lg">{semester.label}</strong><span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{semester.available?'Atual':'Em breve'}</span></button>)}</div></section>
    {contentError&&isAdmin&&<p className={`rounded-xl border px-4 py-3 text-sm ${darkMode?'border-red-900 bg-red-900 bg-opacity-20 text-red-200':'border-red-200 bg-red-50 text-red-800'}`}>{contentError}</p>}
    {isAdmin&&legacyContentItems.length>0&&<section className={`rounded-2xl border p-4 md:p-5 ${darkMode?'border-red-900 bg-red-950/20':'border-red-200 bg-red-50'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-red-600">Limpeza do fluxo antigo</p><p className={`mt-1 text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{legacyContentItems.length} conteúdo(s) antigo(s) estão ocultos e prontos para exclusão.</p></div><button type="button" disabled={cleaningLegacy} onClick={cleanLegacyContent} className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">{cleaningLegacy?'Apagando…':'Apagar conteúdo antigo'}</button></div></section>}
    <FamedScheduleView darkMode={darkMode} isAdmin={isAdmin} contentByScheduleId={contentByScheduleId} contentLoading={contentLoading} onOpenLesson={openSubject} onOpenQuestions={openAllQuestions} onCreate={startFamedAcademiaCreation}/>
  </div>;
}
