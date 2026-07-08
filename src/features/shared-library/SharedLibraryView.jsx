import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function SharedLibraryView() {
  const {
    isAdmin,
    sharedLibraryAudienceMode,
    sharedLibraryTab,
    setSharedLibraryTab,
    setSharedLibraryActiveItemId,
    sharedLibraryConfig,
    sharedLibraryItems,
    sharedLibrarySubject,
    setSharedLibrarySubject,
    sharedLibrarySearch,
    setSharedLibrarySearch,
    sharedLibraryActiveItemId,
    sharedLibraryProgress,
    sharedLibraryRun,
    sharedLibraryLoading,
    sharedLibraryError,
    sharedLibraryPurging,
    sharedLibraryGenerationStages,
    sharedLibraryGenerationSubject,
    sharedLibraryGenerationLesson,
    sharedLibraryRepairing,
    settings,
    setSettings,
    saveSettings,
    settingsRef,
    appliedVideoaulasData,
    videoaulasData,
    flattenCourseLessons,
    sortSubjects,
    normalizeTextKey,
    supportsSharedLibraryClinicalVersion,
    sharedLibraryDocIdForLesson,
    saveSharedLibraryConfig,
    countSharedLibraryIncompleteQuestions,
    getSharedLibraryTargets,
    renderRichText,
    restartSharedLibraryItem,
    restartSharedLibrarySubjectQuestions,
    repairSharedLibraryIncompleteQuestions,
    saveSharedLibraryAnswer,
    resetSharedLibraryAnswers,
    purgeSharedLibrary,
    refreshSharedLibrary,
    setSharedLibraryAudienceMode,
    setSharedLibraryGenerationStages,
    setSharedLibraryGenerationSubject,
    setSharedLibraryGenerationLesson,
    startSharedLibraryGuidedGeneration,
    pauseSharedLibraryAutomation,
    resumeSharedLibraryAutomation,
    stopSharedLibraryAutomation,
    getKey,
    callWithRotation,
    setOpenAnswerModal,
    SHARED_LIBRARY_STAGE_LABELS,
    darkMode,
    BookOpen,
    FileText,
    PillIcon,
    GraduationCap,
    RotateCcw,
    Trash2,
    Spinner,
    AlertTriangle,
    SettingsIcon,
    PlayIcon,
    CheckIcon,
    ShieldAlert,
    ChevronUp,
    ChevronDown,
    Sparkles,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    QuestionView,
    LoadingState,
    EmptyState,
  } = useFeatureContext();

            const showSharedLibraryAdminTools = isAdmin && sharedLibraryAudienceMode === 'admin';
            const tabs = [
              { id:'apostila', label:'Apostila', icon:<BookOpen className="w-4 h-4"/> },
              { id:'summary', label:'Sumários', icon:<BookOpen className="w-4 h-4"/>, adminOnly:true },
              { id:'exams', label:'Exames', icon:<FileText className="w-4 h-4"/>, shelf:true },
              { id:'pharmacology', label:'Farmacologia', icon:<PillIcon className="w-4 h-4"/>, shelf:true },
              { id:'famed', label:'Famed', icon:<GraduationCap className="w-4 h-4"/>, shelf:true },
            ];
            const visibleTabs = tabs.filter(tab => !tab.adminOnly || showSharedLibraryAdminTools);
            const currentSharedLibraryTab = visibleTabs.some(tab => tab.id === sharedLibraryTab)
              ? sharedLibraryTab
              : 'apostila';
            const shelfInfo = {
              exams:{
                title:'Exames',
                description:'Prateleira para treinar interpretação de exames do ciclo clínico, internato, UBS, plantão e residência.',
                cards:['Radiologia', 'ECG', 'Hemograma', 'Urina, função renal e gasometria'],
              },
              pharmacology:{
                title:'Farmacologia',
                description:'Classes, medicamentos principais, nomes comerciais, mecanismos, efeitos adversos, indicações, contraindicações e doses úteis.',
                cards:['Antibióticos', 'Cardiovasculares', 'Endócrino-metabólicos', 'Analgesia e sedação'],
              },
              famed:{
                title:'Famed',
                description:'Espaço para deixar aulas, slides, resumos antigos e questões da faculdade já prontos antes do semestre começar.',
                cards:['Slides e aulas', 'Resumos antigos', 'Listas e monitorias', 'Provas antigas'],
              },
            };
            const itemQuestions = item => {
              const clinicalReady = !item.clinicalPartial
                && !!item.clinicalCompletedAt
                && supportsSharedLibraryClinicalVersion(item.clinicalGenerationVersion)
                && item.clinicalSummaryVersion === item.summaryVersion;
              return [
                ...(item.directQuestions || []).map(question => ({ ...question, libraryQuestionKind:'direct' })),
                ...(clinicalReady ? (item.clinicalQuestions || []).map(question => ({ ...question, libraryQuestionKind:'clinical' })) : []),
              ];
            };
            // Mesma fonte do Portal: matéria, total e sequência não podem divergir.
            const sharedCourseLessons = flattenCourseLessons(appliedVideoaulasData || videoaulasData || {});
            const courseSubjects = sortSubjects([...new Set(sharedCourseLessons.map(lesson=>lesson.subject).filter(Boolean))]);
            const courseSubjectByKey = new Map(courseSubjects.map(subject => [normalizeTextKey(subject), subject]));
            const configuredSubjectOrder = (sharedLibraryConfig.subjectOrder || [])
              .map(subject => courseSubjectByKey.get(normalizeTextKey(subject)))
              .filter(Boolean);
            const subjectOrder = configuredSubjectOrder.length
              ? [...new Set([...configuredSubjectOrder, ...courseSubjects])]
              : courseSubjects;
            const configuredEnabledKeys = new Set((sharedLibraryConfig.enabledSubjects || courseSubjects).map(normalizeTextKey));
            const enabledSubjects = courseSubjects.filter(subject => configuredEnabledKeys.has(normalizeTextKey(subject)));
            const sharedItemByLesson = new Map();
            sharedLibraryItems.forEach(item => {
              sharedItemByLesson.set(String(item.id), item);
              if (item.lessonId) sharedItemByLesson.set(String(item.lessonId), item);
            });
            const sharedLessonByItemId = new Map();
            sharedCourseLessons.forEach(lesson => {
              sharedLessonByItemId.set(sharedLibraryDocIdForLesson(lesson), lesson);
              sharedLessonByItemId.set(String(lesson.id), lesson);
            });
            // Itens antigos podem ter salvo a matéria bruta. Para exibição e
            // filtros, projeta os metadados canônicos sem trocar o documento/ID.
            const displayedSharedLibraryItems = sharedLibraryItems.map(item => {
              const lesson = sharedLessonByItemId.get(String(item.id)) || sharedLessonByItemId.get(String(item.lessonId));
              return lesson ? {
                ...item,
                subject:lesson.subject,
                topic:lesson.topicTitle || lesson.topic,
                title:lesson.title || item.title,
              } : item;
            });
            const isSharedLessonComplete = lesson => {
              const item = sharedItemByLesson.get(sharedLibraryDocIdForLesson(lesson)) || sharedItemByLesson.get(String(lesson.id));
              if (!item?.summaryText || !Array.isArray(item.summaryBlocks) || !item.summaryBlocks.length) return false;
              const expectedDirect = item.summaryBlocks.reduce((total, block) => total + (Array.isArray(block?.subtopics) ? block.subtopics.length : 0), 0);
              const directIds = new Set((item.directQuestions || []).map(question => String(question?.id || '')).filter(Boolean));
              const directComplete = expectedDirect > 0
                && !item.directPartial
                && !!item.directCompletedAt
                && item.directSummaryVersion === item.summaryVersion
                && (item.directQuestions || []).length === expectedDirect
                && directIds.size === expectedDirect;
              const clinicalComplete = !item.clinicalPartial
                && !!item.clinicalCompletedAt
                && supportsSharedLibraryClinicalVersion(item.clinicalGenerationVersion)
                && item.clinicalSummaryVersion === item.summaryVersion;
              return directComplete && clinicalComplete;
            };
            const subjectCoverage = new Map(courseSubjects.map(subject => {
              const lessons = sharedCourseLessons.filter(lesson => normalizeTextKey(lesson.subject) === normalizeTextKey(subject));
              return [subject, { complete:lessons.filter(isSharedLessonComplete).length, total:lessons.length }];
            }));
            const sharedLessonOrder = new Map(sharedCourseLessons.map((lesson, index) => [sharedLibraryDocIdForLesson(lesson), index]));
            const moveSubject = async (subject, direction) => {
              const index = subjectOrder.indexOf(subject);
              const target = index + direction;
              if (index < 0 || target < 0 || target >= subjectOrder.length) return;
              const nextOrder = [...subjectOrder];
              [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
              await saveSharedLibraryConfig({ ...sharedLibraryConfig, subjectOrder:nextOrder, enabledSubjects });
            };
            const availableItems = displayedSharedLibraryItems.filter(item => {
              const hasContent = currentSharedLibraryTab === 'summary'
                ? !!item.summaryText
                : currentSharedLibraryTab === 'apostila'
                  ? itemQuestions(item).length > 0
                  : false;
              const matchesSubject = sharedLibrarySubject === 'all' || item.subject === sharedLibrarySubject;
              const needle = normalizeTextKey(sharedLibrarySearch);
              const matchesSearch = !needle || normalizeTextKey(`${item.title} ${item.subject} ${item.topic}`).includes(needle);
              return hasContent && matchesSubject && matchesSearch;
            }).sort((a,b) => (subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject))
              || (sharedLessonOrder.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) - (sharedLessonOrder.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER)
              || String(a.title).localeCompare(String(b.title),'pt'));
            const repairScopeItems = displayedSharedLibraryItems.filter(item => {
              const matchesSubject = sharedLibrarySubject === 'all' || item.subject === sharedLibrarySubject;
              const needle = normalizeTextKey(sharedLibrarySearch);
              const matchesSearch = !needle || normalizeTextKey(`${item.title} ${item.subject} ${item.topic}`).includes(needle);
              return matchesSubject && matchesSearch;
            });
            const incompleteQuestionCount = showSharedLibraryAdminTools ? countSharedLibraryIncompleteQuestions(repairScopeItems) : 0;
            const generationBaseLessons = getSharedLibraryTargets();
            const generationLessons = generationBaseLessons
              .filter(lesson => sharedLibraryGenerationSubject === 'all' || normalizeTextKey(lesson.subject) === normalizeTextKey(sharedLibraryGenerationSubject))
              .sort((a,b) => (sharedLessonOrder.get(sharedLibraryDocIdForLesson(a)) ?? Number.MAX_SAFE_INTEGER) - (sharedLessonOrder.get(sharedLibraryDocIdForLesson(b)) ?? Number.MAX_SAFE_INTEGER)
                || String(a.title).localeCompare(String(b.title), 'pt'));
            const sharedLibraryFieldClass = `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${darkMode?'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-yellow-600 disabled:bg-gray-800 disabled:text-gray-500':'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 disabled:bg-gray-100 disabled:text-gray-400'}`;
            const generationStageOptions = [
              { id:'summary', title:'Sumários internos', desc:'Base para questões e conferência. Prioridade máxima agora.' },
              { id:'direct', title:'Questões diretas', desc:'Uma por subtópico cobrável, em lotes de 15.' },
              { id:'clinical', title:'Questões clínicas', desc:'Casos integradores para raciocínio clínico.' },
              { id:'writtenLesson', title:'Aulas escritas/apostila', desc:'Fica para depois; ainda não vou gastar request nisso.', disabled:true },
            ];
            const toggleGenerationStage = (stageId) => {
              if (sharedLibraryRun.running) return;
              setSharedLibraryGenerationStages(current => current.includes(stageId)
                ? current.filter(stage => stage !== stageId)
                : [...current, stageId]);
            };
            const activeShelf = shelfInfo[currentSharedLibraryTab];
            const activeItem = displayedSharedLibraryItems.find(item => item.id === sharedLibraryActiveItemId);
            if (activeItem) {
              if (currentSharedLibraryTab === 'summary') return (
                <div className="desktop-content-limit">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <button onClick={()=>setSharedLibraryActiveItemId(null)} className={`flex items-center gap-2 font-bold ${darkMode?'text-gray-400':'text-gray-600'}`}><ArrowLeft className="w-4 h-4"/>Biblioteca</button>
                    {showSharedLibraryAdminTools&&<button onClick={()=>restartSharedLibraryItem(activeItem)} disabled={sharedLibraryRun.running} className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-3 py-2 text-xs font-bold text-red-500 disabled:opacity-40"><RotateCcw className="w-4 h-4"/>Apagar e gerar novamente</button>}
                  </div>
                  <article className={`rounded-2xl border p-5 md:p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">{activeItem.subject} · {activeItem.topic}</p>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-6">{activeItem.title}</h2>
                    <div className="prose-like leading-relaxed">{renderRichText(activeItem.summaryText || '', true)}</div>
                  </article>
                </div>
              );
              const questions = itemQuestions(activeItem);
              return <QuestionView
                title={activeItem.title}
                onBack={()=>setSharedLibraryActiveItemId(null)}
                backLabel="Biblioteca"
                questions={questions}
                answers={sharedLibraryProgress[activeItem.id]?.answers || {}}
                favorites={[]}
                onAnswer={(questionId, letter)=>saveSharedLibraryAnswer(activeItem.id, questionId, letter)}
                onToggleFavorite={()=>{}}
                onReset={()=>resetSharedLibraryAnswers(activeItem.id)}
                onRegenerate={showSharedLibraryAdminTools?()=>restartSharedLibraryItem(activeItem):null}
                darkMode={darkMode}
                apiKey={getKey()}
                oracleLength={settings.oracleLength || 'medium'}
                onCall={callWithRotation}
                onOpenAnswer={question=>setOpenAnswerModal({question,isEssay:question.isEssay})}
                displayMode={settings.questionDisplayMode || 'list'}
                onDisplayModeChange={mode=>saveSettings({...settingsRef.current, questionDisplayMode:mode})}
                adminQuestionExplanations={showSharedLibraryAdminTools}
              />;
            }
            return (
              <div className="desktop-content-limit space-y-5">
                <section className={`rounded-2xl border p-5 md:p-7 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-yellow-600">Acervo compartilhado</p>
                      <h2 className="font-serif text-3xl font-bold mt-1">Biblioteca</h2>
                      <p className={`text-sm mt-2 max-w-2xl ${darkMode?'text-gray-400':'text-gray-600'}`}>Aulas, questões e coleções prontas para estudar. O conteúdo é comum a todos; respostas e progresso continuam pessoais.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin&&(
                        <div className={`inline-flex items-center rounded-xl border p-1 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
                          {[['student','Prévia aluno'],['admin','Admin']].map(([mode,label])=>(
                            <button key={mode} onClick={()=>setSharedLibraryAudienceMode(mode)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${sharedLibraryAudienceMode===mode?(darkMode?'bg-yellow-900/50 text-yellow-300':'bg-yellow-100 text-yellow-800'):(darkMode?'text-gray-400 hover:text-gray-200':'text-gray-600 hover:text-gray-900')}`}>{label}</button>
                          ))}
                        </div>
                      )}
                      {showSharedLibraryAdminTools&&<button onClick={purgeSharedLibrary} disabled={sharedLibraryRun.running||sharedLibraryPurging} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 ${darkMode?'border-red-900/80 text-red-400 hover:bg-red-950/30':'border-red-200 text-red-600 hover:bg-red-50'}`}>
                        {sharedLibraryPurging?<Spinner className="w-4 h-4"/>:<Trash2 className="w-4 h-4"/>}{sharedLibraryPurging?'Apagando...':'Apagar Biblioteca antiga'}
                      </button>}
                      <button onClick={refreshSharedLibrary} disabled={sharedLibraryLoading||sharedLibraryPurging} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${darkMode?'border-gray-600':'border-gray-300'}`}>
                        {sharedLibraryLoading?<Spinner className="w-4 h-4"/>:<RotateCcw className="w-4 h-4"/>}Atualizar
                      </button>
                    </div>
                  </div>
                  {(sharedLibraryLoading || sharedLibraryError) && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${sharedLibraryError ? (darkMode?'border-red-900/60 bg-red-950/20 text-red-200':'border-red-200 bg-red-50 text-red-800') : (darkMode?'border-gray-700 bg-gray-900 text-gray-300':'border-gray-200 bg-gray-50 text-gray-700')}`}>
                      {sharedLibraryLoading ? <Spinner className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600"/> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0"/>}
                      <span className="min-w-0 flex-1">
                        {sharedLibraryLoading ? 'Carregando Biblioteca...' : `Nao consegui sincronizar a Biblioteca (${sharedLibraryError}). Confira login, regras do Firestore e conexão.`}
                      </span>
                    </div>
                  )}
                </section>

                <div className={`grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 p-1 rounded-xl border ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                  {visibleTabs.map(tab=><button key={tab.id} disabled={tab.disabled} onClick={()=>{setSharedLibraryTab(tab.id);setSharedLibraryActiveItemId(null);}}
                    className={`relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold ${tab.disabled?'opacity-35 cursor-not-allowed':currentSharedLibraryTab===tab.id?(darkMode?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(darkMode?'text-gray-400':'text-gray-600')}`}>
                    {tab.icon}<span>{tab.label}</span>{tab.disabled&&<span className="absolute -top-1 -right-1 text-[7px] px-1 rounded bg-gray-600 text-white">em breve</span>}
                  </button>)}
                </div>

                {showSharedLibraryAdminTools&&(
                  <details className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    <summary className="cursor-pointer font-bold flex items-center gap-2"><SettingsIcon className="w-4 h-4"/>Automação da Biblioteca</summary>
                    <div className="mt-5 grid lg:grid-cols-[1.05fr_.95fr] gap-5">
                      <div className="space-y-4">
                        <div className={`rounded-2xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
                          <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Gerar conteúdo do curso</p>
                          <h3 className="mt-1 font-serif text-xl font-bold">Prioridade: sumários e questões</h3>
                          <p className={`mt-1 text-xs ${darkMode?'text-gray-400':'text-gray-600'}`}>Por enquanto, a automação deve alimentar o Portal do Curso e a Apostila com sumários internos e questões. Aulas escritas completas ficam para bem depois.</p>
                          <div className="mt-4 grid gap-3">
                            <div>
                              <p className="text-xs font-bold">O que gerar</p>
                              <div className="mt-2 grid gap-2">
                                {generationStageOptions.map(option => {
                                  const checked = sharedLibraryGenerationStages.includes(option.id);
                                  return <button type="button" key={option.id} disabled={sharedLibraryRun.running||option.disabled} onClick={()=>!option.disabled&&toggleGenerationStage(option.id)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-45 ${checked?(darkMode?'border-yellow-700 bg-yellow-950/20':'border-yellow-400 bg-yellow-50'):(darkMode?'border-gray-700 bg-gray-900 hover:border-gray-600':'border-gray-200 bg-white hover:border-gray-300')}`}>
                                    <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${checked?(darkMode?'border-yellow-500 bg-yellow-500 text-gray-950':'border-yellow-500 bg-yellow-500 text-white'):(darkMode?'border-gray-600':'border-gray-300')}`}>{checked&&<CheckIcon className="w-3.5 h-3.5"/>}</span>
                                    <span className="min-w-0 flex-1">
                                      <strong className="block text-sm">{option.title}</strong>
                                      <span className={`mt-0.5 block text-xs ${darkMode?'text-gray-400':'text-gray-600'}`}>{option.desc}</span>
                                    </span>
                                  </button>;
                                })}
                              </div>
                            </div>
                            <label className="block text-xs font-bold">Matéria
                              <select value={sharedLibraryGenerationSubject} disabled={sharedLibraryRun.running} onChange={e=>{setSharedLibraryGenerationSubject(e.target.value);setSharedLibraryGenerationLesson('all');}} className={sharedLibraryFieldClass} style={{colorScheme:darkMode?'dark':'light'}}>
                                <option value="all">Todas as matérias habilitadas</option>
                                {subjectOrder.filter(subject=>enabledSubjects.includes(subject)).map(subject=>{const coverage=subjectCoverage.get(subject)||{complete:0,total:0};return <option key={subject} value={subject}>{subject} · {coverage.complete}/{coverage.total}</option>;})}
                              </select>
                            </label>
                            <label className="block text-xs font-bold">Aula específica
                              <select value={sharedLibraryGenerationLesson} disabled={sharedLibraryRun.running} onChange={e=>setSharedLibraryGenerationLesson(e.target.value)} className={sharedLibraryFieldClass} style={{colorScheme:darkMode?'dark':'light'}}>
                                <option value="all">Todas as aulas do recorte</option>
                                {generationLessons.map(lesson=><option key={sharedLibraryDocIdForLesson(lesson)} value={sharedLibraryDocIdForLesson(lesson)}>{lesson.subject} · {lesson.title}</option>)}
                              </select>
                            </label>
                          </div>
                          {!sharedLibraryRun.running?<button onClick={startSharedLibraryGuidedGeneration} disabled={sharedLibraryLoading||sharedLibraryPurging} className="mt-4 w-full rounded-xl bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-3 font-bold flex items-center justify-center gap-2"><PlayIcon className="w-4 h-4"/>Gerar seleção</button>:<div className="mt-4 grid grid-cols-2 gap-2">
                            <button onClick={sharedLibraryRun.paused?resumeSharedLibraryAutomation:pauseSharedLibraryAutomation} className={`rounded-xl border py-2.5 font-bold ${darkMode?'border-gray-600':'border-gray-300'}`}>{sharedLibraryRun.paused?'Continuar':'Pausar'}</button>
                            <button onClick={stopSharedLibraryAutomation} disabled={sharedLibraryRun.stopping} className="rounded-xl border border-red-400 text-red-500 py-2.5 font-bold">{sharedLibraryRun.stopping?'Parando...':'Parar'}</button>
                          </div>}
                        </div>
                        <label className="block text-xs font-bold">Pausa entre aulas (s)<input type="number" min="0" max="120" value={settings.sharedLibraryDelaySeconds || 0} disabled={sharedLibraryRun.running} onChange={e=>{const next={...settings,sharedLibraryDelaySeconds:Number(e.target.value)};setSettings(next);saveSettings(next);}} className={sharedLibraryFieldClass} style={{colorScheme:darkMode?'dark':'light'}}/></label>
                        <div className={`rounded-xl border p-3 text-xs ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
                          Ordem por aula: <strong>sumário completo → uma direta por subtópico → provas clínicas integradoras por tópico → próxima aula</strong>. As clínicas selecionam apenas o que exige raciocínio e podem conectar subtópicos distantes. Sumários são ferramenta interna do admin; o aluno vê aulas e questões.
                        </div>
                        <button onClick={()=>repairSharedLibraryIncompleteQuestions(repairScopeItems)} disabled={sharedLibraryRepairing||sharedLibraryRun.running||sharedLibraryPurging||!incompleteQuestionCount} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-45 ${darkMode?'border-yellow-800/70 text-yellow-300 hover:bg-yellow-950/25':'border-yellow-200 text-yellow-800 hover:bg-yellow-50'}`}>
                          {sharedLibraryRepairing?<Spinner className="w-4 h-4"/>:<ShieldAlert className="w-4 h-4"/>}
                          Revisar questões incompletas{incompleteQuestionCount?` (${incompleteQuestionCount})`:''}
                        </button>
                        <div className="flex items-center justify-between text-xs"><span>{SHARED_LIBRARY_STAGE_LABELS[sharedLibraryRun.stage] || 'Parada'}</span><span>{sharedLibraryRun.current}/{sharedLibraryRun.total}</span></div>
                        <div className={`h-2 rounded-full overflow-hidden ${darkMode?'bg-gray-700':'bg-gray-200'}`}><div className="h-full bg-yellow-600" style={{width:`${sharedLibraryRun.total?Math.round(sharedLibraryRun.current/sharedLibraryRun.total*100):0}%`}}/></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div><p className="font-bold text-sm">Fila avançada</p><p className="text-xs opacity-50">Define a ordem quando você gera várias matérias.</p></div>
                        </div>
                        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                          {subjectOrder.map((subject,index)=>{ const coverage=subjectCoverage.get(subject)||{complete:0,total:0}; return <div key={subject} className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${darkMode?'border-gray-700':'border-gray-200'}`}>
                            <input type="checkbox" checked={enabledSubjects.includes(subject)} onChange={async e=>{
                              const nextEnabled = e.target.checked ? [...new Set([...enabledSubjects,subject])] : enabledSubjects.filter(value=>value!==subject);
                              await saveSharedLibraryConfig({ ...sharedLibraryConfig, subjectOrder, enabledSubjects:nextEnabled });
                            }}/>
                            <span className="min-w-0 flex-1 text-sm font-bold"><span className="block truncate">{index+1}. {subject}</span><span className="block text-[10px] font-medium opacity-50">{coverage.complete}/{coverage.total} aulas completas</span></span>
                            <button onClick={()=>moveSubject(subject,-1)} disabled={index===0} className="p-1 disabled:opacity-20"><ChevronUp className="w-4 h-4"/></button>
                            <button onClick={()=>moveSubject(subject,1)} disabled={index===subjectOrder.length-1} className="p-1 disabled:opacity-20"><ChevronDown className="w-4 h-4"/></button>
                          </div>})}
                        </div>
                        <div className={`max-h-56 overflow-y-auto rounded-xl border p-2 space-y-1 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
                          {!sharedLibraryRun.logs.length&&<p className="text-xs opacity-40 p-2">Os eventos da fila aparecerão aqui.</p>}
                          {sharedLibraryRun.logs.map(log=><p key={log.id} className={`text-xs ${log.type==='error'?'text-red-500':log.type==='success'?'text-green-500':log.type==='warning'?'text-yellow-500':'opacity-60'}`}><span className="opacity-50">{log.time}</span> {log.msg}</p>)}
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                <div className="grid md:grid-cols-[220px_1fr] gap-4">
                  <div className="space-y-2">
                    <input value={sharedLibrarySearch} onChange={e=>setSharedLibrarySearch(e.target.value)} placeholder="Buscar conteúdo..." className={`w-full rounded-xl border px-3 py-2.5 text-sm ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}/>
                    <select value={sharedLibrarySubject} onChange={e=>setSharedLibrarySubject(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}><option value="all">Todas as matérias</option>{subjectOrder.map(subject=>{const coverage=subjectCoverage.get(subject)||{complete:0,total:0};return <option key={subject} value={subject}>{subject} · {coverage.complete}/{coverage.total}</option>;})}</select>
                    {showSharedLibraryAdminTools&&sharedLibrarySubject!=='all'&&<button onClick={()=>restartSharedLibrarySubjectQuestions(sharedLibrarySubject)} disabled={sharedLibraryRun.running} className={`w-full rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-40 ${darkMode?'border-red-900/70 text-red-400 hover:bg-red-950/30':'border-red-200 text-red-600 hover:bg-red-50'}`}><RotateCcw className="mr-1.5 inline h-3.5 w-3.5"/>Regerar questões da matéria</button>}
                  </div>
                  <div className="space-y-2">
                    {sharedLibraryLoading?<LoadingState message="Abrindo o acervo..."/>:activeShelf?(
                      <div className={`rounded-2xl border p-5 md:p-6 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                        <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Prateleira pronta</p>
                        <h3 className="font-serif text-2xl font-bold mt-1">{activeShelf.title}</h3>
                        <p className={`mt-2 text-sm max-w-2xl ${darkMode?'text-gray-400':'text-gray-600'}`}>{activeShelf.description}</p>
                        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {activeShelf.cards.map(card => (
                            <div key={card} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
                              <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${darkMode?'bg-yellow-900/30 text-yellow-300':'bg-yellow-100 text-yellow-800'}`}><Sparkles className="w-4 h-4"/></span>
                              <strong className="block text-sm">{card}</strong>
                              <span className="mt-1 block text-xs opacity-50">Conteúdo em preparação</span>
                            </div>
                          ))}
                        </div>
                        {showSharedLibraryAdminTools&&<p className="mt-4 text-xs opacity-55">Quando formos criar essa prateleira de verdade, ela deve publicar aulas, questões e materiais internos como entidades separadas — sem chamar sumário de aula.</p>}
                      </div>
                    ):availableItems.length===0?<EmptyState icon={<BookOpen className="w-7 h-7"/>} title="Ainda não há conteúdo nesta seção" description={showSharedLibraryAdminTools?'Use a automação acima para publicar as primeiras aulas.':'O acervo está sendo preparado pelo professor.'}/>:availableItems.map(item=>{
                      const questions = itemQuestions(item);
                      const answered = Object.keys(sharedLibraryProgress[item.id]?.answers || {}).filter(id=>questions.some(q=>String(q.id)===String(id))).length;
                      return <button key={item.id} onClick={()=>setSharedLibraryActiveItemId(item.id)} className={`w-full rounded-xl border p-4 text-left flex items-center gap-3 transition-colors ${darkMode?'bg-gray-800 border-gray-700 hover:border-yellow-600':'bg-white border-gray-200 hover:border-yellow-500'}`}>
                        <span className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'bg-gray-900 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>{currentSharedLibraryTab==='summary'?<BookOpen className="w-5 h-5"/>:<CheckCircle2 className="w-5 h-5"/>}</span>
                        <span className="min-w-0 flex-1"><strong className="block truncate">{item.title}</strong><span className="block text-xs opacity-50 mt-0.5 truncate">{item.subject} · {item.topic}{currentSharedLibraryTab!=='summary'?` · ${questions.length} questões${answered?` · ${answered} respondidas`:''}`:''}</span></span>
                        <ChevronRight className="w-4 h-4 opacity-35"/>
                      </button>;
                    })}
                  </div>
                </div>
              </div>
            );
}
