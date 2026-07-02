import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function CoursePortalView() {
  const {
    addToast,
    appliedVideoaulasData,
    ArrowLeft,
    aulaDocId,
    aulaHasVqData,
    aulaQuestionCount,
    aulaVqKey,
    Award,
    blockValues,
    BrainIcon,
    CalendarCheck,
    callWithRotation,
    canUseAdvancedFeatures,
    capitalizeDisplayLabel,
    CheckCircle2,
    CheckIcon,
    ChevronDown,
    ChevronRight,
    cleanAulaTitle,
    COURSE_SCHEDULE_DEFAULT_MIX_PRESET,
    COURSE_SCHEDULE_DEFAULT_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_DEFAULT_WEEKS,
    COURSE_SCHEDULE_MAX_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_MIX_PRESETS,
    COURSE_SCHEDULE_PRESETS,
    courseLessonDisplayTitle,
    coursePlanLessonOrder,
    coursePlanLocked,
    coursePlanSubjects,
    courseScheduleMixPreset,
    courseSchedulePreset,
    courseScheduleSettingsOpen,
    courseScheduleSubjectBatchSize,
    courseScheduleSubjectsOpen,
    courseScheduleWeeks,
    cronograma,
    cronStartDate,
    cursoTab,
    curWeek,
    darkMode,
    dueCount,
    effectiveCoursePlanLessonOrder,
    EmptyState,
    extractAulas,
    flattenCourseLessons,
    FolderIcon,
    formatCourseDuration,
    getAulaId,
    getCurrentWeek,
    getDueReviews,
    getKey,
    getTodayKey,
    GraduationCap,
    isAdmin,
    isAnswerCorrect,
    isReviewItemFavorite,
    LayersIcon,
    LoadingState,
    looksLikeClinicalVignette,
    normalizeTextKey,
    openSpacedReview,
    parseVideoaulasData,
    PlayIcon,
    QuestionCard,
    RepeatIcon,
    reviewSession,
    saveCourseCycleReview,
    saveCoursePlanPrefs,
    saveCourseSchedulePrefs,
    saveCronStartDate,
    setActiveAula,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setCourseScheduleSettingsOpen,
    setCourseScheduleSubjectsOpen,
    setCursoTab,
    setCurWeek,
    setReviewNotebook,
    setReviewSession,
    settings,
    SettingsIcon,
    setView,
    setVqActiveBlock,
    setVqActiveBlockView,
    setVqAula,
    setVqExpandedSubj,
    setVqExpandedTopic,
    setVqGenModal,
    setVqQuestionParity,
    setVqSubject,
    setVqTopic,
    shortTopicName,
    sortCourseSubjectsForDisplay,
    Sparkles,
    toggleReviewFavorite,
    totalLessonSeconds,
    trackQuestionAnswered,
    updateReviewItem,
    videoaulasLoading,
    VideoIcon,
    vqBlocks,
    vqExpandedSubj,
    vqExpandedTopic,
    watchedAulas,
  } = useFeatureContext();

          const dm = darkMode;
          const currentWeek = getCurrentWeek();
          const activeWeek = curWeek ?? currentWeek ?? 1;
          const weekData = cronograma?.find(w=>w.week===activeWeek);

          // Progresso por tópico
          const watchedByTopic = {};
          if(appliedVideoaulasData){
            Object.values(appliedVideoaulasData).forEach(topics=>
              Object.entries(topics).forEach(([topic,cats])=>{
                const all=extractAulas(cats);
                const watched=all.filter(a=>watchedAulas[getAulaId(a)]).length;
                watchedByTopic[topic]={watched,total:all.length};
              })
            );
          }

          // Total geral de progresso
          const totalWatched = Object.values(watchedByTopic).reduce((a,b)=>a+b.watched,0);
          const totalAulas   = Object.values(watchedByTopic).reduce((a,b)=>a+b.total,0);
          const globalPct    = totalAulas>0?Math.round(totalWatched/totalAulas*100):0;
          const courseLessons = flattenCourseLessons(appliedVideoaulasData || {});
          const totalCourseDuration = formatCourseDuration(totalLessonSeconds(courseLessons));
          const courseSubjects = sortCourseSubjectsForDisplay([...new Set(courseLessons.map(lesson => lesson.subject))]);
          const courseSubjectByKey = new Map(courseSubjects.map(subject => [normalizeTextKey(subject), subject]));
          const savedPlanSubjects = coursePlanSubjects.map(subject => courseSubjectByKey.get(normalizeTextKey(subject))).filter(Boolean);
          const effectivePlanSubjects = [
            ...savedPlanSubjects,
            ...courseSubjects.filter(subject => !savedPlanSubjects.includes(subject)),
          ];
          const plannedSubjectSet = new Set(effectivePlanSubjects);
          const plannedLessons = courseLessons.filter(lesson => plannedSubjectSet.has(lesson.subject));
          const plannedWatched = plannedLessons.filter(lesson => watchedAulas[lesson.id]).length;
          const planPct = plannedLessons.length ? Math.round(plannedWatched / plannedLessons.length * 100) : 0;

          const tabs = [
            {id:'videoaulas', label:'Videoaulas',   icon:<VideoIcon className="w-4 h-4"/>},
            {id:'questoes',   label:'Questões',     icon:<GraduationCap className="w-4 h-4"/>},
            {id:'revisoes',   label:'Revisões',     icon:<RepeatIcon className="w-4 h-4"/>, badge: dueCount},
            {id:'cronograma', label:'Cronograma', icon:<CalendarCheck className="w-4 h-4"/>},
            isAdmin ? {id:'plano', label:'Jornada do Herói', icon:<Award className="w-4 h-4"/>} : null,
          ].filter(Boolean);

          return (
            <div className={`min-h-screen ${dm?'bg-gray-950':'bg-gray-50'}`}>

              {/* ── HERO HEADER ── */}
              <div className={`relative overflow-hidden ${dm?'bg-gray-900':'bg-white'} border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                <div className="max-w-5xl mx-auto px-4 pt-6 pb-0">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <button onClick={()=>setView('library')} className={`flex items-center gap-1.5 text-xs font-bold mb-3 transition-colors ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>
                        <ArrowLeft className="w-3 h-3"/>Início
                      </button>
                      <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-600 leading-tight">Portal do Curso</h1>
                      <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Videoaulas · Questões · {isAdmin?'Jornada do Herói':'Cronograma'}</p>
                    </div>
                    {/* Progresso global */}
                    <div className={`flex-shrink-0 text-right`}>
                      <div className={`text-3xl font-bold font-serif ${globalPct===100?'text-green-500':'text-yellow-600'}`}>{globalPct}<span className="text-lg">%</span></div>
                      <div className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>
                        {totalWatched}/{totalAulas} aulas{totalCourseDuration?` · ${totalCourseDuration}`:''}
                      </div>
                      {isAdmin&&plannedLessons.length>0
                        ? <div className={`text-xs font-bold mt-1 ${dm?'text-yellow-500':'text-yellow-600'}`}>Plano {planPct}%</div>
                        : currentWeek&&<div className={`text-xs font-bold mt-1 ${dm?'text-yellow-500':'text-yellow-600'}`}>Semana {currentWeek} de 46</div>}
                    </div>
                  </div>
                  {/* Barra de progresso global */}
                  <div className={`h-1 w-full rounded-full overflow-hidden mb-0 ${dm?'bg-gray-800':'bg-gray-100'}`}>
                    <div className={`h-full rounded-full transition-all duration-700 ${globalPct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${globalPct}%`}}/>
                  </div>
                  {/* Tabs */}
                  <div className="flex mt-1 -mb-px">
	                    {tabs.map(tab=>(
	                      <button key={tab.id} onClick={()=>tab.id==='revisoes'&&canUseAdvancedFeatures?openSpacedReview():setCursoTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all ${cursoTab===tab.id
                          ?'border-yellow-500 text-yellow-600'
                          :`border-transparent ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-700'}`}`}>
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {(tab.badge||0)>0&&<span className="absolute -top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center">{tab.badge>9?'9+':tab.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── TAB CONTENT ── */}
              <div className="max-w-5xl mx-auto px-4 py-6">

                {/* ── ABA VIDEOAULAS ── */}
                {cursoTab==='videoaulas'&&(()=>{
                  if(videoaulasLoading) return <LoadingState darkMode={dm} label="Carregando videoaulas..."/>;
                  if(!appliedVideoaulasData||Object.keys(appliedVideoaulasData).length===0) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<VideoIcon className="w-7 h-7"/>}
                      title="Nenhuma videoaula carregada"
                      message="Quando o conteúdo estiver disponível, ele aparece aqui organizado por assunto e tópico."
                    />
                  );
                  const parsedData = parseVideoaulasData(appliedVideoaulasData);
                  const subjects   = sortCourseSubjectsForDisplay(Object.keys(parsedData));
                  return (
                    <div className="space-y-3">
                      {subjects.map(subj=>{
                        const topics  = parsedData[subj];
                        const allAulas = Object.values(topics).flatMap(t=>[...t.main,...t.bonus]);
                        const watched  = allAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                        const pct = allAulas.length>0?Math.round(watched/allAulas.length*100):0;
                        const subjectDuration = formatCourseDuration(totalLessonSeconds(allAulas));
                        const isExp = vqExpandedSubj[subj]??false;
                        return (
                          <div key={subj} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            {/* Assunto header */}
                            <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExp}))}
                              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm ${pct===100?'bg-green-500 text-white':(dm?'bg-gray-800 text-yellow-400':'bg-yellow-100 text-yellow-700')}`}>
                                {pct===100?<CheckIcon className="w-5 h-5"/>:`${pct}%`}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{capitalizeDisplayLabel(subj)}</p>
                                <div className={`flex items-center gap-2 mt-1`}>
                                  <div className={`flex-1 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`} style={{maxWidth:'120px'}}>
                                    <div className={`h-full rounded-full ${pct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${pct}%`}}/>
                                  </div>
                                  <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>
                                    {watched}/{allAulas.length} aulas{subjectDuration?` · ${subjectDuration}`:''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={e=>{e.stopPropagation();setActiveSubjectVid(subj);setActiveSubtopicVid(null);setActiveAula(null);setView('videoaulas');}}
                                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${dm?'border-gray-700 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                  <PlayIcon className="w-3 h-3"/>Ver
                                </button>
                                {isExp?<ChevronDown className="w-4 h-4 opacity-40"/>:<ChevronRight className="w-4 h-4 opacity-40"/>}
                              </div>
                            </button>
                            {/* Tópicos expandidos */}
                            {isExp&&(
                              <div className={`border-t ${dm?'border-gray-800':'border-gray-100'}`}>
                                {Object.entries(topics).map(([topic,{main,bonus}])=>{
                                  const tAll=[...main,...bonus];
                                  const tW=tAll.filter(a=>watchedAulas[getAulaId(a)]).length;
                                  const tPct=tAll.length>0?Math.round(tW/tAll.length*100):0;
                                  const topicDuration = formatCourseDuration(totalLessonSeconds(tAll));
                                  const shortT=topic.replace(/^[A-ZÁÉÍÓÚ]{2,8}\s*\d+\s*[-–]\s*/i,'').trim();
                                  return (
                                    <button key={topic}
                                      onClick={()=>{setActiveSubjectVid(subj);setActiveSubtopicVid(`${topic}::main`);setActiveAula(null);setView('videoaulas');}}
                                      className={`w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors last:border-0 ${dm?'border-gray-800 hover:bg-gray-800':'border-gray-50 hover:bg-gray-50'}`}>
                                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${tPct===100?'bg-green-500 text-white':(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                                        {tPct===100?<CheckIcon className="w-3.5 h-3.5"/>:`${tPct}%`}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${dm?'text-gray-300':'text-gray-700'}`}>{shortT||topic}</p>
                                        <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>
                                          {tW}/{tAll.length} aulas{topicDuration?` · ${topicDuration}`:''}{bonus.length>0?` · ${bonus.length} bônus`:''}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── ABA QUESTÕES ── */}
                {cursoTab==='questoes'&&(()=>{
                  if(!appliedVideoaulasData) return <LoadingState darkMode={dm} label="Carregando questões do curso..."/>;

                  const parsedData = parseVideoaulasData(appliedVideoaulasData);
                  const subjects   = sortCourseSubjectsForDisplay(Object.keys(parsedData));

                  return (
                    <div className="space-y-2">
                      {subjects.map(subj => {
                        const topics   = parsedData[subj] || {};
                        const allAulas = Object.values(topics).flatMap(t=>[...t.main,...t.bonus]);
                        if (!allAulas.length) return null;
                        const isExpSubj = vqExpandedSubj[subj] ?? false;
                        const subjQs = allAulas.reduce((acc,a)=>{
                          return acc+aulaQuestionCount(a);
                        },0);
                        const subjReadyAulas = allAulas.filter(aula => aulaQuestionCount(aula) > 0).length;

                        return (
                          <div key={subj} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            {/* Assunto */}
                            <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExpSubj}))}
                              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                              <FolderIcon className="w-5 h-5 text-yellow-600 flex-shrink-0"/>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold">{capitalizeDisplayLabel(subj)}</p>
                                <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>
                                  {subjReadyAulas}/{allAulas.length} aulas com questões{subjQs>0?` · ${subjQs} questões`:''}</p>
                              </div>
                              {isExpSubj?<ChevronDown className="w-4 h-4 opacity-40 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0"/>}
                            </button>

                            {/* Tópicos */}
                            {isExpSubj&&Object.entries(topics).map(([topic, {main,bonus}])=>{
                              const topicAulas = [...main,...bonus];
                              if (!topicAulas.length) return null;
                              const shortT = topic.replace(/^[A-ZÁÉÍÓÚ]{2,8}\s*\d+\s*[-–]\s*/i,'').trim();
                              const topicKey = `q_${subj}_${topic}`;
                              const isExpTopic = vqExpandedTopic[topicKey] ?? false;
                              const topicQs = topicAulas.reduce((acc,a)=>{
                                return acc+aulaQuestionCount(a);
                              },0);
                              const topicReadyAulas = topicAulas.filter(aula => aulaQuestionCount(aula) > 0).length;

                              return (
                                <div key={topic} className={`border-t ${dm?'border-gray-800':'border-gray-100'}`}>
                                  <button onClick={()=>setVqExpandedTopic(p=>({...p,[topicKey]:!isExpTopic}))}
                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                                    <LayersIcon className="w-4 h-4 text-yellow-600 opacity-70 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${dm?'text-gray-300':'text-gray-700'}`}>{shortT||topic}</p>
                                      <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>
                                        {topicReadyAulas}/{topicAulas.length} aulas com questões{topicQs>0?` · ${topicQs} questões`:''}</p>
                                    </div>
                                    {isExpTopic?<ChevronDown className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>:<ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>}
                                  </button>

                                  {/* Aulas */}
                                  {isExpTopic&&topicAulas.map((aula,ai)=>{
                                    const key = aulaVqKey(aula);
                                    const d = vqBlocks[key];
                                    const qTotal = d?.blocks?blockValues(d.blocks).reduce((a,b)=>a+(b.questions?.length||0),0):0;
                                    const qAns   = d?.blocks?blockValues(d.blocks).reduce((a,b)=>a+Object.keys(b.answers||{}).length,0):0;
                                    const qPct   = qTotal>0?Math.round(qAns/qTotal*100):null;
                                    const hasQ   = qTotal > 0;
                                    return (
                                      <button key={ai}
                                        onClick={()=>{setVqSubject(subj);setVqTopic(topic);setVqAula(aula);setVqActiveBlock(null);setVqActiveBlockView(null);setView('videoquestions');}}
                                        className={`w-full flex items-center gap-3 px-5 py-3 border-t text-left transition-colors ${dm?'border-gray-800 hover:bg-gray-800':'border-gray-50 hover:bg-gray-50'}`}>
                                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${qPct===100?'bg-green-500 text-white':hasQ?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-800 text-gray-600':'bg-gray-100 text-gray-400')}`}>
                                          {qPct===100?<CheckIcon className="w-3.5 h-3.5"/>:hasQ?`${qPct}%`:<Sparkles className="w-3 h-3"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm truncate ${dm?'text-gray-300':'text-gray-700'}`}>{courseLessonDisplayTitle(aula)}</p>
                                          <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>
                                            {hasQ?`${qAns}/${qTotal} respondidas · ${Object.keys(d?.blocks||{}).length} bloco(s)`:'Sem questões'}
                                          </p>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  );
                })()}

                {/* ── ABA CRONOGRAMA ── */}
                {cursoTab==='revisoes'&&(()=>{
                  const dueItems = getDueReviews();
                  const dueFlashcardItems = dueItems.filter(item => item.question?.isFlashcard);
                  const dueQuestionItems = dueItems.filter(item => !item.question?.isFlashcard);
                  const SR_LABELS = ['3d','7d','14d','30d','90d'];
                  const intervalSummary = SR_LABELS
                    .map((label, interval) => ({ label, count:dueItems.filter(item => item.item?.interval === interval).length }))
                    .filter(item => item.count > 0);

                  if (!reviewSession) {
                    // Tela de lista de revisões pendentes
                    return (
                      <div>
                        {dueItems.length === 0 ? (
                          <EmptyState
                            darkMode={dm}
                            icon={<RepeatIcon className="w-7 h-7"/>}
                            title="Nenhuma revisão pendente"
                            message="Quando terminar um bloco de questões, adicione-o à revisão espaçada."
                          />
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
	                              <p className={`text-sm font-bold ${dm?'text-gray-400':'text-gray-500'}`}>
	                                {dueQuestionItems.length} quest{dueQuestionItems.length===1?'ão':'ões'} · {dueFlashcardItems.length} flashcard{dueFlashcardItems.length!==1?'s':''}
	                              </p>
                              <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                  disabled={!dueQuestionItems.length}
                                  onClick={()=>setReviewSession({items: dueQuestionItems, index: 0, sessionAnswers: {}})}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm disabled:opacity-35">
                                  <RepeatIcon className="w-4 h-4"/>Questões
                                </button>
                                <button
                                  disabled={!dueFlashcardItems.length}
                                  onClick={()=>setReviewSession({items: dueFlashcardItems, index: 0, sessionAnswers: {}})}
                                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm disabled:opacity-35 ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
                                  <BrainIcon className="w-4 h-4"/>Flashcards
                                </button>
                              </div>
                            </div>
                            <div className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dm?'text-gray-500':'text-gray-400'}`}>Distribuição da fila</p>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {(intervalSummary.length ? intervalSummary : [{label:'hoje', count:dueItems.length}]).map(item=>(
                                  <div key={item.label} className={`rounded-xl border px-3 py-2 text-center ${dm?'bg-gray-950/60 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                                    <p className="text-lg font-serif font-bold text-yellow-600">{item.count}</p>
                                    <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>{item.label}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Sessão de revisão ativa
                  const { items: sessionItems, index, sessionAnswers, sessionResults = {}, completed = false } = reviewSession;
                  const cur = sessionItems[index];
                  const total = sessionItems.length;
                  const done = Object.keys(sessionAnswers).length;
                  const finished = done === total;
                  const sessionAllFlashcards = sessionItems.every(item => item.question?.isFlashcard);
                  const reviewListMode = !sessionAllFlashcards && canUseAdvancedFeatures && (settings.questionDisplayMode || 'list') === 'list';

                  if (finished && completed) {
                    const correct = Object.values(sessionResults).filter(Boolean).length;
                    const pct = Math.round(correct / total * 100);
                    const wrong = total - correct;
                    const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
                    return (
                      <div className={`rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
                        <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Sessão encerrada</p>
                        <h3 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Revisão concluída</h3>
                        <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
                        <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correct}/{total} corretas · {wrong} para reforçar</p>
                        <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} As questões acertadas foram empurradas para o próximo intervalo; as erradas voltam para revisão mais cedo.</p>
                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-green-500">{correct}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>avançaram</p>
                          </div>
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-red-500">{wrong}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>reforço</p>
                          </div>
                        </div>
	                        <button onClick={()=>setReviewSession(null)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
	                          Voltar
	                        </button>
                      </div>
                    );
                  }

                  if (reviewListMode) {
                    return (
                      <div className="max-w-3xl mx-auto">
                        <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Sair</button>
                        <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${dm?'bg-gray-900':'bg-gray-50'}`}>
                          <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}><div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/></div>
                          <span className={`text-xs font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{done}/{total}</span>
                        </div>
                        {sessionItems.map((item, i)=>(
                          <QuestionCard
                            key={`${item.blockId}-${item.qId}`}
                            question={item.question}
                            index={i}
                            selectedLetter={sessionAnswers[item.qId]}
                            onAnswer={async (letter)=>{
                              const correct = isAnswerCorrect(item.question, letter);
                              trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                              setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]: letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
                              if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
                              await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                            }}
                            darkMode={dm}
                            isFavorite={isReviewItemFavorite(item)}
                            onToggleFavorite={()=>toggleReviewFavorite(item)}
                            showErrorNotebook={false}
                            apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
                            adminQuestionExplanations={isAdmin}
                          />
                        ))}
                        {finished&&(
                          <div className="text-center mt-2">
                            <button onClick={()=>setReviewSession(p=>({...p,completed:true}))} className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                              Concluir<CheckIcon className="w-4 h-4"/>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Questão atual da sessão com seed diferente para embaralhar alternativas
                  const item = cur;
                  const q = item.question;
                  const seed = item.item.reviewSeed || 42;
                  const shuffleWithSeed = (arr, s) => {
                    const a = [...arr]; let st = s;
                    for (let i = a.length-1; i>0; i--) {
                      st = (st * 1664525 + 1013904223) & 0xffffffff;
                      const j = Math.abs(st) % (i+1);
                      [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                  };
                  const correctText = q.options?.find(o=>o.isCorrect)?.text;
                  const shuffled = shuffleWithSeed(q.options||[], seed).map((opt,i)=>({...opt, letter:'ABCDE'[i], isCorrect: opt.text===correctText}));
                  const reviewQ = {...q, options: shuffled};

                  return (
                    <div className="max-w-2xl mx-auto">
                      {/* Progresso */}
                      <div className={`flex items-center gap-3 mb-6 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-200'}`}>
                          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/>
                        </div>
	                        <span className={`text-xs font-bold flex-shrink-0 ${dm?'text-gray-400':'text-gray-500'}`}>{index+1}/{total}</span>
		                        <button onClick={()=>setReviewSession(null)} className={`text-xs ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>Sair</button>
	                      </div>
	                      <QuestionCard
	                        question={reviewQ} index={index}
	                        selectedLetter={sessionAnswers[item.qId]}
			                        onAnswer={async (letter)=>{
			                          const correct = isAnswerCorrect(reviewQ, letter);
			                          trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
			                          setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]: letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
			                          if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
			                          await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
			                        }}
	                        darkMode={dm}
	                        isFavorite={isReviewItemFavorite(item)}
	                        onToggleFavorite={()=>toggleReviewFavorite(item)}
		                        showErrorNotebook={false}
	                        apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
	                        adminQuestionExplanations={isAdmin}
	                      />
	                      <div className="flex items-center justify-between gap-3 mt-4">
	                        <button onClick={()=>setReviewSession(p=>({...p,index:Math.max(0,index-1)}))} disabled={index===0}
	                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${index===0?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
	                          <ArrowLeft className="w-4 h-4"/>Voltar
	                        </button>
	                        <button
                            onClick={()=>setReviewSession(p=>(index===total-1?{...p,completed:true}:{...p,index:Math.min(total-1,index+1)}))}
                            disabled={index===total-1 && !finished}
	                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${(index===total-1 && !finished)?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}`}>
	                          {index===total-1?'Concluir':'Avançar'}
                            {index===total-1?<CheckIcon className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
	                        </button>
	                      </div>
                    </div>
                  );
                })()}

                {cursoTab==='plano'&&isAdmin&&(()=>{
                  if(videoaulasLoading) return <LoadingState darkMode={dm} label="Carregando jornada do curso..."/>;
                  if(!courseLessons.length) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<Award className="w-7 h-7"/>}
                      title="Nenhuma aula carregada"
                      message="A Jornada do Herói usa as videoaulas reais do portal. Quando elas carregarem, ela monta o próximo passo do estudo."
                    />
                  );

                  const normalizedSubjects = effectivePlanSubjects;
                  const dueCourseItems = getDueReviews().filter(item => item.source === 'curso' || vqBlocks[item.aulaId]);
                  const blockEntriesForLesson = (lesson) => {
                    const data = vqBlocks[aulaDocId(lesson.aula)] || vqBlocks[aulaVqKey(lesson.aula)];
                    const rawBlocks = data?.blocks || {};
                    const entries = Array.isArray(rawBlocks)
                      ? rawBlocks.map((block, index) => [`block${index + 1}`, block])
                      : Object.entries(rawBlocks);
                    return entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                  };
                  const questionInfoForLesson = (lesson) => {
                    const blockEntries = blockEntriesForLesson(lesson);
                    const total = blockEntries.reduce((sum, [, block]) => sum + ((Array.isArray(block.questions) ? block.questions : []).length), 0);
                    const answered = blockEntries.reduce((sum, [, block]) => {
                      const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                      return sum + Object.keys(answers).length;
                    }, 0);
                    return { total, answered, blocks:blockEntries.length, blockEntries };
                  };
                  const isClinicalCourseQuestion = (question = {}) =>
                    question.libraryQuestionKind === 'clinical' || looksLikeClinicalVignette(question);
                  const journeyStageMeta = (stage) => {
                    if (stage === 'direct-odd') return { type:'direct', parity:'odd' };
                    if (stage === 'direct-even') return { type:'direct', parity:'even' };
                    if (stage === 'clinical-odd') return { type:'clinical', parity:'odd' };
                    if (stage === 'clinical-even') return { type:'clinical', parity:'even' };
                    return null;
                  };
                  const lessonWatched = (lesson) => [
                    lesson.id,
                    lesson.docId,
                    getAulaId(lesson.aula),
                    aulaDocId(lesson.aula),
                    aulaVqKey(lesson.aula),
                  ].filter(Boolean).some(id => !!watchedAulas[id]);
                  const stageKey = (type, parity, suffix) => `${type}${parity === 'odd' ? 'Odd' : 'Even'}${suffix}`;
                  const journeyInfoForLesson = (lesson) => {
                    const blockEntries = blockEntriesForLesson(lesson);
                    const stats = {
                      total:0,
                      answered:0,
                      directTotal:0,
                      clinicalTotal:0,
                      directOddTotal:0,
                      directOddAnswered:0,
                      directEvenTotal:0,
                      directEvenAnswered:0,
                      clinicalOddTotal:0,
                      clinicalOddAnswered:0,
                      clinicalEvenTotal:0,
                      clinicalEvenAnswered:0,
                    };
                    let directIndex = 0;
                    let clinicalIndex = 0;
                    blockEntries.forEach(([, block]) => {
                      const questions = Array.isArray(block.questions) ? block.questions : [];
                      const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                      questions.forEach(question => {
                        const clinical = isClinicalCourseQuestion(question);
                        const type = clinical ? 'clinical' : 'direct';
                        const index = clinical ? ++clinicalIndex : ++directIndex;
                        const parity = index % 2 === 1 ? 'odd' : 'even';
                        const answered = Object.prototype.hasOwnProperty.call(answers, question.id);
                        stats.total += 1;
                        stats[`${type}Total`] += 1;
                        stats[stageKey(type, parity, 'Total')] += 1;
                        if (answered) {
                          stats.answered += 1;
                          stats[stageKey(type, parity, 'Answered')] += 1;
                        }
                      });
                    });
                    const done = (total, answered) => total > 0 && answered >= total;
                    const emptyOrDone = (total, answered) => total === 0 || answered >= total;
                    stats.directOddDone = done(stats.directOddTotal, stats.directOddAnswered);
                    stats.directEvenDone = emptyOrDone(stats.directEvenTotal, stats.directEvenAnswered);
                    stats.clinicalOddDone = emptyOrDone(stats.clinicalOddTotal, stats.clinicalOddAnswered);
                    stats.clinicalEvenDone = emptyOrDone(stats.clinicalEvenTotal, stats.clinicalEvenAnswered);
                    stats.primaryDone = lessonWatched(lesson) && stats.directOddDone;
                    stats.journeyDone = stats.primaryDone && stats.directEvenDone && stats.clinicalOddDone && stats.clinicalEvenDone;
                    return stats;
                  };
                  const firstQuestionBlockForLesson = (lesson, mode = 'pending') => {
                    const entries = questionInfoForLesson(lesson).blockEntries;
                    if (!entries.length) return null;
                    const stage = journeyStageMeta(mode);
                    if (mode === 'review') return entries.find(([, block]) => (Array.isArray(block.questions) ? block.questions : []).length > 0) || null;
                    if (stage) {
                      let directIndex = 0;
                      let clinicalIndex = 0;
                      let firstStageEntry = null;
                      for (const entry of entries) {
                        const [, block] = entry;
                        const questions = Array.isArray(block.questions) ? block.questions : [];
                        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                        let hasStageQuestion = false;
                        let hasPendingStageQuestion = false;
                        questions.forEach(question => {
                          const clinical = isClinicalCourseQuestion(question);
                          const type = clinical ? 'clinical' : 'direct';
                          const index = clinical ? ++clinicalIndex : ++directIndex;
                          const parity = index % 2 === 1 ? 'odd' : 'even';
                          if (type === stage.type && parity === stage.parity) {
                            hasStageQuestion = true;
                            if (!Object.prototype.hasOwnProperty.call(answers, question.id)) hasPendingStageQuestion = true;
                          }
                        });
                        if (hasStageQuestion && !firstStageEntry) firstStageEntry = entry;
                        if (hasPendingStageQuestion) return entry;
                      }
                      return firstStageEntry;
                    }
                    return entries.find(([, block]) => {
                      const questions = Array.isArray(block.questions) ? block.questions : [];
                      const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                      return questions.length > 0 && Object.keys(answers).length < questions.length;
                    }) || entries.find(([, block]) => (Array.isArray(block.questions) ? block.questions : []).length > 0) || null;
                  };
                  const lessonOrderIndex = new Map((effectiveCoursePlanLessonOrder || []).map((id, index) => [String(id), index]));
                  const planLessonRank = (lesson) => {
                    if (Number.isFinite(Number(lesson.aula?.display_plan_order))) return Number(lesson.aula.display_plan_order);
                    const ids = [lesson.docId, lesson.id, aulaDocId(lesson.aula), aulaVqKey(lesson.aula)].filter(Boolean).map(String);
                    const hit = ids.map(id => lessonOrderIndex.get(id)).find(index => Number.isFinite(index));
                    return Number.isFinite(hit) ? hit : Number.MAX_SAFE_INTEGER;
                  };
                  const lessonsBySubject = (subject) => courseLessons
                    .filter(lesson => lesson.subject === subject)
                    .sort((a, b) => {
                      const byPlan = planLessonRank(a) - planLessonRank(b);
                      if (byPlan) return byPlan;
                      return a.title.localeCompare(b.title, 'pt');
                    });
                  const topicsBySubject = (subject) => {
                    const map = {};
                    lessonsBySubject(subject).forEach(lesson => {
                      if (!map[lesson.topic]) map[lesson.topic] = [];
                      map[lesson.topic].push(lesson);
                    });
                    return map;
                  };
                  const subjectSummaries = normalizedSubjects.map(subject => {
                    const lessons = lessonsBySubject(subject);
                    const watched = lessons.filter(lessonWatched).length;
                    const completed = lessons.filter(lesson => journeyInfoForLesson(lesson).journeyDone).length;
                    const primaryCompleted = lessons.filter(lesson => journeyInfoForLesson(lesson).primaryDone).length;
                    const questionCount = lessons.reduce((acc, lesson) => acc + questionInfoForLesson(lesson).total, 0);
                    return {
                      subject,
                      lessons,
                      watched,
                      completed,
                      primaryCompleted,
                      total:lessons.length,
                      topics:Object.keys(topicsBySubject(subject)).length,
                      pct:lessons.length ? Math.round(completed / lessons.length * 100) : 0,
                      questions:questionCount,
                    };
                  });
                  const firstUnfinishedSubject = subjectSummaries.findIndex(item => item.total && item.primaryCompleted < item.total);
                  const unlockedSubjectLimit = firstUnfinishedSubject >= 0
                    ? Math.min(subjectSummaries.length, firstUnfinishedSubject + 4)
                    : Infinity;
                  const activeSubjectSummaries = subjectSummaries.filter((_, index) => index < unlockedSubjectLimit);
                  const lessonIds = (lesson) => [
                    lesson.id,
                    aulaVqKey(lesson.aula),
                    aulaDocId(lesson.aula),
                  ].filter(Boolean);
                  const reviewItemsForLesson = (lesson) => dueCourseItems.filter(item =>
                    lessonIds(lesson).includes(item.aulaId)
                    || cleanAulaTitle(item.aulaTitle || '') === lesson.title
                    || cleanAulaTitle(item.aulaTitle || '') === cleanAulaTitle(lesson.aula.title || '')
                  );
                  const openLesson = (lesson) => {
                    setActiveSubjectVid(lesson.subject);
                    setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
                    setActiveAulaAndReset(lesson.aula);
                    setView('videoaulas');
                  };
                  const openQuestions = (lesson, mode = 'direct-odd') => {
                    setVqSubject(lesson.subject);
                    setVqTopic(lesson.topic);
                    setVqAula(lesson.aula);
                    setVqActiveBlock(null);
                    setVqQuestionParity('all');
                    const journeyStage = journeyStageMeta(mode) ? mode : null;
                    const targetBlock = firstQuestionBlockForLesson(lesson, journeyStage || (mode === 'review-r3' || mode === 'review-r10' ? 'review' : 'pending'));
                    setVqActiveBlockView(targetBlock ? {
                      blockId:targetBlock[0],
                      showWrong:false,
                      fromPlan:true,
                      cycleStage:journeyStage || (mode === 'review-r3' ? 'r3' : mode === 'review-r10' ? 'r10' : null),
                    } : null);
                    if (aulaHasVqData(lesson.aula)) setView('videoquestions');
                    else setVqGenModal({aula:lesson.aula,aulaId:aulaDocId(lesson.aula),suggestedQ:15,subject:lesson.subject,topic:lesson.topic,fromConfig:true});
                  };
                  const goToLessonStep = (lesson) => {
                    const ji = journeyInfoForLesson(lesson);
                    if (!lessonWatched(lesson)) {
                      openLesson(lesson);
                      return;
                    }
                    if (ji.directTotal === 0) {
                      openQuestions(lesson, 'direct-odd');
                      return;
                    }
                    if (!ji.directOddDone) {
                      openQuestions(lesson, 'direct-odd');
                      return;
                    }
                    openQuestions(lesson, 'direct-even');
                  };
                  const isLessonPrimaryComplete = (lesson) => journeyInfoForLesson(lesson).primaryDone;
                  const openCycleReview = async (lesson, stage) => {
                    await saveCourseCycleReview(lesson.id, stage);
                    openQuestions(lesson, stage === 'r10' ? 'review-r10' : 'review-r3');
                  };
                  const reviewSubject = (items) => {
                    openSpacedReview(items);
                  };
	                  const lessonStep = (lesson) => {
	                    const ji = journeyInfoForLesson(lesson);
	                    if (!lessonWatched(lesson)) return { label:'Assistir aula', tone:'yellow', detail:'marque como assistida ao terminar' };
	                    if (ji.directTotal === 0) return { label:'Gerar questões', tone:'blue', detail:'fixação ímpar pendente' };
	                    if (!ji.directOddDone) return { label:'Fazer ímpares', tone:'green', detail:`${ji.directOddAnswered}/${ji.directOddTotal} respondidas` };
	                    return { label:'Próxima aula', tone:'yellow', detail:'ímpares concluídas' };
	                  };
                  const nextStepForSubject = (item) => {
                    const completedCutoff = item.lessons.findIndex(lesson => !isLessonPrimaryComplete(lesson));
                    const completedCount = completedCutoff === -1 ? item.lessons.length : completedCutoff;
                    const allPrimaryComplete = completedCount === item.lessons.length;
                    for (let idx = 0; idx < completedCount; idx += 1) {
                      const lesson = item.lessons[idx];
                      const ji = journeyInfoForLesson(lesson);
                      const completedAfter = completedCount - idx - 1;
                      if (ji.directEvenTotal > 0 && !ji.directEvenDone && completedAfter >= 3) {
                        return {
                          label:'Fazer pares',
                          tone:'red',
                          detail:lesson.title,
                          subdetail:`após ${completedAfter} aula${completedAfter!==1?'s':''} da matéria`,
                          action:()=>openQuestions(lesson, 'direct-even'),
                        };
                      }
                      if (ji.directEvenDone && (completedAfter >= 10 || allPrimaryComplete)) {
                        if (ji.clinicalOddTotal > 0 && !ji.clinicalOddDone) {
                          return {
                            label:'Clínicas ímpares',
                            tone:'red',
                            detail:lesson.title,
                            subdetail:'teste de raciocínio clínico',
                            action:()=>openQuestions(lesson, 'clinical-odd'),
                          };
                        }
                        if (ji.clinicalEvenTotal > 0 && !ji.clinicalEvenDone) {
                          return {
                            label:'Clínicas pares',
                            tone:'red',
                            detail:lesson.title,
                            subdetail:'segunda metade dos casos',
                            action:()=>openQuestions(lesson, 'clinical-even'),
                          };
                        }
                      }
                    }
                    const lesson = item.lessons.find(aula => {
                      const ji = journeyInfoForLesson(aula);
                      return !lessonWatched(aula) || ji.directTotal === 0 || !ji.directOddDone;
                    });
                    if (!lesson) {
                      return {
                        label:'Matéria em dia',
                        tone:'gray',
                        detail:'sem pendência agora',
                        action:()=>{},
                        done:true,
                      };
                    }
	                    const step = lessonStep(lesson);
	                    const lessonIndex = item.lessons.findIndex(aula => aula.id === lesson.id) + 1;
	                    return {
	                      ...step,
	                      detail:lesson.title,
	                      subdetail:`Aula ${lessonIndex || '?'} de ${item.total} · ${step.detail}`,
	                      action:()=>goToLessonStep(lesson),
	                    };
                  };
                  const moveSubject = (idx, dir) => {
                    const next = [...normalizedSubjects];
                    const target = idx + dir;
                    if (target < 0 || target >= next.length) return;
                    [next[idx], next[target]] = [next[target], next[idx]];
                    saveCoursePlanPrefs(next, coursePlanLocked);
                  };
                  const actionableSteps = activeSubjectSummaries
                    .map((item, index) => ({ item, index, step:nextStepForSubject(item) }))
                    .filter(entry => entry.step && !entry.step.done);
                  const urgentJourneyStep = actionableSteps.find(entry => entry.step.tone === 'red');
                  const journeyStepRank = (step = {}) => {
                    if (step.tone === 'red') return 0;
                    if (['Fazer ímpares', 'Gerar questões'].includes(step.label)) return 1;
                    if (step.label === 'Assistir aula') return 2;
                    return 3;
                  };
                  const balancedJourneyStep = actionableSteps
                    .filter(entry => entry.step.tone !== 'red')
                    .sort((a, b) => {
                      const byStep = journeyStepRank(a.step) - journeyStepRank(b.step);
                      if (byStep) return byStep;
                      const byPrimary = (a.item.primaryCompleted || 0) - (b.item.primaryCompleted || 0);
                      if (byPrimary) return byPrimary;
                      const byWatched = (a.item.watched || 0) - (b.item.watched || 0);
                      if (byWatched) return byWatched;
                      return a.index - b.index;
                    })[0];
                  const heroJourneyStep = urgentJourneyStep || balancedJourneyStep || actionableSteps[0] || null;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5">
                      <section className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                        <div className={`px-5 py-4 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Jornada do Herói</p>
	                          <h2 className="text-2xl font-serif font-bold text-yellow-600">Próximo ato</h2>
	                          <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Assista a aula, faça ímpares, deixe as pares para depois de 3 aulas e os casos clínicos para o teste de verdade.</p>
                        </div>
                        <div className="p-4 space-y-3">
                          {heroJourneyStep&&(
                            <button onClick={heroJourneyStep.step.action} className={`app-card group w-full rounded-xl px-3.5 py-3 text-left flex items-center gap-3 transition-all`}>
                              <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-yellow-600 ${dm?'bg-gray-800':'bg-yellow-50'}`}>
                                <Award className="w-5 h-5"/>
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${dm?'text-gray-500':'text-gray-400'}`}>Continuar</p>
                                <h3 className={`mt-0.5 text-sm md:text-[15px] font-bold truncate ${dm?'text-gray-100':'text-gray-900'}`}>{heroJourneyStep.step.detail}</h3>
                                <p className={`mt-0.5 text-xs truncate ${dm?'text-gray-400':'text-gray-600'}`}>
                                  {capitalizeDisplayLabel(heroJourneyStep.item.subject)} · {heroJourneyStep.step.label}{heroJourneyStep.step.subdetail?` · ${heroJourneyStep.step.subdetail}`:''}
                                </p>
                              </div>
                              <span className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-yellow-600 px-3.5 py-2 text-xs font-bold text-white group-hover:bg-yellow-700">
                                Continuar<ChevronRight className="w-3.5 h-3.5"/>
                              </span>
                            </button>
                          )}
                          {activeSubjectSummaries.map(item=>{
                            const step = nextStepForSubject(item);
                            const color = step.tone === 'green'
                              ? 'text-green-500'
                              : step.tone === 'blue'
                                ? 'text-blue-500'
                                : step.tone === 'red'
                                  ? 'text-red-500'
                                  : step.tone === 'gray'
                                    ? (dm?'text-gray-400':'text-gray-500')
                                    : 'text-yellow-600';
                            return (
                              <button key={item.subject} onClick={step.action} disabled={step.done}
                                className={`w-full rounded-xl border p-4 text-left transition-all ${dm?'bg-gray-950/50 border-gray-800 hover:border-yellow-800 hover:bg-gray-950':'bg-gray-50 border-gray-200 hover:border-yellow-300 hover:bg-white'}`}>
	                                <div className="flex items-center gap-3">
	                                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dm?'bg-gray-800 text-yellow-300':'bg-yellow-100 text-yellow-700'}`}>
	                                    {step.done?<CheckIcon className="w-4 h-4"/>:<PlayIcon className="w-4 h-4"/>}
	                                  </div>
	                                  <div className="min-w-0 flex-1">
	                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${dm?'text-gray-600':'text-gray-400'}`}>{capitalizeDisplayLabel(item.subject)}</p>
	                                    <p className="font-bold truncate mt-0.5">{step.detail}</p>
	                                    {step.subdetail&&<p className={`text-xs mt-1 truncate ${dm?'text-gray-500':'text-gray-500'}`}>{step.subdetail}</p>}
	                                  </div>
	                                  <div className="text-right flex-shrink-0">
	                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${dm?'text-gray-600':'text-gray-400'}`}>Agora</p>
	                                    <p className={`text-sm font-bold mt-0.5 ${color}`}>{step.label}</p>
	                                  </div>
	                                </div>
                              </button>
                            );
                          })}
                          {!activeSubjectSummaries.length&&(
                            <div className="p-8 text-center">
                              <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-3"/>
                              <p className="font-bold text-green-500">Curso em dia</p>
                              <p className={`text-sm mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>Quando houver algo para fazer, aparece aqui.</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <aside className="space-y-4">
                        <section className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Ordem</p>
                          <h3 className="text-xl font-serif font-bold text-yellow-600 mt-1">Matérias</h3>
                          <div className="mt-4 space-y-2">
                            {subjectSummaries.map((item, idx)=>{
                              const active = idx < unlockedSubjectLimit;
                              return (
                                <div key={item.subject} className={`rounded-xl border p-3 ${active?(dm?'bg-gray-950/70 border-gray-800':'bg-gray-50 border-gray-200'):(dm?'bg-gray-950/30 border-gray-900 opacity-50':'bg-gray-50/60 border-gray-100 opacity-60')}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${item.pct===100?'bg-green-500 text-white':(dm?'bg-gray-800 text-yellow-300':'bg-yellow-100 text-yellow-700')}`}>{item.pct===100?'✓':idx+1}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold truncate">{capitalizeDisplayLabel(item.subject)}</p>
                                      <p className={`text-[10px] ${dm?'text-gray-500':'text-gray-500'}`}>{item.completed}/{item.total} jornadas · {item.primaryCompleted} com ímpares</p>
                                    </div>
                                    <button onClick={()=>moveSubject(idx,-1)} disabled={idx===0} className={`px-1.5 py-1 rounded text-xs disabled:opacity-20 ${dm?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-100'}`}>↑</button>
                                    <button onClick={()=>moveSubject(idx,1)} disabled={idx===subjectSummaries.length-1} className={`px-1.5 py-1 rounded text-xs disabled:opacity-20 ${dm?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-100'}`}>↓</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        <section className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Revisão</p>
                          <h3 className="text-xl font-serif font-bold text-yellow-600 mt-1">{dueCourseItems.length} pendente{dueCourseItems.length!==1?'s':''}</h3>
                          <button onClick={()=>openSpacedReview()} disabled={!dueCourseItems.length}
                            className={`mt-4 w-full px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-35 ${dueCourseItems.length?'bg-yellow-600 hover:bg-yellow-700 text-white':(dm?'bg-gray-800 text-gray-500':'bg-gray-100 text-gray-400')}`}>
                            Revisar agora
                          </button>
                        </section>
                      </aside>
                    </div>
                  );
                })()}

                {cursoTab==='cronograma'&&(()=>{
                  if(videoaulasLoading) return <LoadingState darkMode={dm} label="Montando cronograma..."/>;
                  if(!courseLessons.length) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<CalendarCheck className="w-7 h-7"/>}
                      title="Nenhuma aula para montar cronograma"
                      message="Quando as videoaulas carregarem, o cronograma será montado pela organização atual do curso."
                    />
                  );

                  const lessonOrderIndex = new Map((effectiveCoursePlanLessonOrder || []).map((id, index) => [String(id), index]));
                  const lessonRank = (lesson) => {
                    if (Number.isFinite(Number(lesson.aula?.display_plan_order))) return Number(lesson.aula.display_plan_order);
                    const ids = [lesson.docId, lesson.id, aulaDocId(lesson.aula), aulaVqKey(lesson.aula)].filter(Boolean).map(String);
                    const hit = ids.map(id => lessonOrderIndex.get(id)).find(index => Number.isFinite(index));
                    return Number.isFinite(hit) ? hit : Number.MAX_SAFE_INTEGER;
                  };
                  const orderedSubjects = effectivePlanSubjects.filter(subject => courseSubjects.includes(subject));
                  const subjectBatchSize = Math.max(1, Math.min(COURSE_SCHEDULE_MAX_SUBJECT_BATCH_SIZE, Number(courseScheduleSubjectBatchSize) || COURSE_SCHEDULE_DEFAULT_SUBJECT_BATCH_SIZE));
                  const activeMixPreset = COURSE_SCHEDULE_MIX_PRESETS.find(preset => preset.id === courseScheduleMixPreset) || null;
                  const mixedScheduleActive = !!activeMixPreset;
                  const lessonsBySubject = new Map(orderedSubjects.map(subject => [
                    subject,
                    courseLessons
                      .filter(lesson => lesson.subject === subject)
                      .sort((a, b) => {
                        const byRank = lessonRank(a) - lessonRank(b);
                        if (byRank) return byRank;
                        return a.title.localeCompare(b.title, 'pt');
                      }),
                  ]));
                  const getSubjectLessons = subject => lessonsBySubject.get(subject) || [];
                  const interleaveSubjectBatch = (subjects) => {
                    const queues = subjects.map(getSubjectLessons).filter(queue => queue.length);
                    const max = queues.reduce((highest, queue) => Math.max(highest, queue.length), 0);
                    const lessons = [];
                    for (let index = 0; index < max; index += 1) {
                      queues.forEach(queue => {
                        if (queue[index]) lessons.push(queue[index]);
                      });
                    }
                    return lessons;
                  };
                  const allOrderedSubjectLessons = orderedSubjects.flatMap(getSubjectLessons);
                  const lessonText = (lesson) => normalizeTextKey([
                    lesson.subject,
                    lesson.topic,
                    lesson.topicTitle,
                    lesson.title,
                    lesson.aula?.ai_catalog?.description,
                  ].filter(Boolean).join(' '));
                  const patternRank = (text, rules, fallback = rules.length) => {
                    const hit = rules.findIndex(pattern => pattern.test(text));
                    return hit >= 0 ? hit : fallback;
                  };
                  const subjectRankFrom = (subjects = []) => {
                    const map = new Map(subjects.map((subject, index) => [normalizeTextKey(subject), index]));
                    return (subject) => map.has(normalizeTextKey(subject)) ? map.get(normalizeTextKey(subject)) : subjects.length + orderedSubjects.indexOf(subject);
                  };
                  const sortLessonsByStrategy = (strategy) => {
                    const ufcSubjectRank = subjectRankFrom(['Cardiologia','Pneumologia','Gastroenterologia','Endocrinologia','Nefrologia','Cirurgia','Obstetricia','Pediatria','Ginecologia','Infectologia','Dermatologia','Hematologia','Reumatologia','Ortopedia','Psiquiatria','Oftalmologia']);
                    const defaultSubjectRank = subjectRankFrom(orderedSubjects);
                    const ruleSets = {
                      'importance-life': [
                        /\b(sepse|choque|parada|pcr|trauma|traumatismo|hemorragia|sangramento|ave|iam|infarto|crise hipertensiva|ectopica|descolamento prematuro|hipercalemia|sdra|insuficiencia respiratoria)\b/,
                        /\b(hipertensao|diabetes|pneumonia|asma|dpoc|tuberculose|hiv|dengue|itu|pre[- ]?natal|parto|puerperio|anticoncepcao|depressao|ansiedade|anemia|apendicite|colecistite|drge|cirrose)\b/,
                        /\b(diagnostico|classificacao|rastreamento|prevencao|vacina|calendario|avaliacao)\b/,
                        /\b(tratamento|manejo|terapia|profilaxia|conduta)\b/,
                        /\b(neoplasia|tumor|cancer|transplante|cirurgias?|sindrome|hereditarias?|vasculites?)\b/,
                      ],
                      'basic-advanced': [
                        /\b(introducao|conceitos?|fundamentos?|anatomia|fisiologia|historia natural|nocoes|classificacao|bases?)\b/,
                        /\b(semiologia|diagnostico|avaliacao|rastreamento|achados|sorologia)\b/,
                        /\b(tratamento|manejo|terapia|profilaxia|assistencia|conduta)\b/,
                        /\b(complicacoes?|emergencias?|aguda|choque|hemorragia|insuficiencia|crise)\b/,
                        /\b(neoplasia|tumor|cancer|transplante|cirurgias?|rar[ao]s?|sindrome|malign[ao])\b/,
                      ],
                      'high-yield': [
                        /\b(sus|epidemiologia|testes diagnosticos|hipertensao|diabetes|pre[- ]?natal|parto|abortamento|ectopica|placenta previa|dpp|pneumonia|tuberculose|hiv|dengue|sepse|trauma|apendicite|colecistite|pancreatite|cirrose|anemia|leucemia|artrite reumatoide|lupus|vacinas?)\b/,
                        /\b(diagnostico|tratamento|manejo|classificacao|rastreamento|prevencao|complicacoes?)\b/,
                        /\b(anatomia|fisiologia|neoplasia|tumores?|rar[ao]s?|cirurgias?|transplante)\b/,
                      ],
                      'emergency-first': [
                        /\b(sepse|choque|parada|pcr|trauma|traumatismo|tce|ave|hemorragia|sangramento|dpp|ectopica|hipercalemia|hipoglicemia|cetoacidose|sdra|pneumotorax|queimaduras|intoxicacoes?|sofrimento fetal|prematuridade|amniorrexe)\b/,
                        /\b(aguda|crise|emergencia|urgencia|insuficiencia|obstrucao|isquemia|perfura[cç][aã]o)\b/,
                        /\b(tratamento|manejo|conduta|suporte|monitorizacao|profilaxia)\b/,
                        /\b(introducao|anatomia|fisiologia|neoplasia|tumor|cronica)\b/,
                      ],
                    };
                    const rules = ruleSets[strategy] || ruleSets['importance-life'];
                    const strategyLessons = strategy === 'medico-bicho'
                      ? allOrderedSubjectLessons.filter(lesson => normalizeTextKey(lesson.subject) !== 'preventiva')
                      : allOrderedSubjectLessons;
                    return [...strategyLessons].sort((a, b) => {
                      if (strategy === 'ufc-flow' || strategy === 'medico-bicho') {
                        const ufcValue = (lesson) => strategy === 'ufc-flow' && normalizeTextKey(lesson.subject) === 'preventiva'
                          ? lessonRank(lesson) * 250 + 1
                          : ufcSubjectRank(lesson.subject) * 1000 + lessonRank(lesson) + 2;
                        const ufcDiff = ufcValue(a) - ufcValue(b);
                        if (ufcDiff) return ufcDiff;
                        const subjectDiff = ufcSubjectRank(a.subject) - ufcSubjectRank(b.subject);
                        if (subjectDiff) return subjectDiff;
                        const rankDiff = lessonRank(a) - lessonRank(b);
                        if (rankDiff) return rankDiff;
                        return a.title.localeCompare(b.title, 'pt');
                      }
                      const textA = lessonText(a);
                      const textB = lessonText(b);
                      const ruleDiff = patternRank(textA, rules) - patternRank(textB, rules);
                      if (ruleDiff) return ruleDiff;
                      const subjectDiff = defaultSubjectRank(a.subject) - defaultSubjectRank(b.subject);
                      if (subjectDiff) return subjectDiff;
                      const rankDiff = lessonRank(a) - lessonRank(b);
                      if (rankDiff) return rankDiff;
                      return a.title.localeCompare(b.title, 'pt');
                    });
                  };
                  const orderedLessons = mixedScheduleActive
                    ? sortLessonsByStrategy(activeMixPreset.strategy)
                    : (() => {
                      const lessons = [];
                      for (let index = 0; index < orderedSubjects.length; index += subjectBatchSize) {
                        lessons.push(...interleaveSubjectBatch(orderedSubjects.slice(index, index + subjectBatchSize)));
                      }
                      return lessons;
                    })();
                  const weeksCount = Math.max(1, Math.min(104, Number(courseScheduleWeeks) || COURSE_SCHEDULE_DEFAULT_WEEKS));
                  const baseLessonsPerWeek = orderedLessons.length ? Math.floor(orderedLessons.length / weeksCount) : 0;
                  const extraLessonWeeks = orderedLessons.length ? orderedLessons.length % weeksCount : 0;
                  const maxLessonsPerWeek = orderedLessons.length ? Math.ceil(orderedLessons.length / weeksCount) : 0;
                  const lessonsPerWeekLabel = baseLessonsPerWeek === maxLessonsPerWeek
                    ? String(maxLessonsPerWeek)
                    : `${baseLessonsPerWeek}-${maxLessonsPerWeek}`;
                  const scheduleWeeks = Array.from({ length:weeksCount }, (_, index) => {
                    const start = index * baseLessonsPerWeek + Math.min(index, extraLessonWeeks);
                    const count = baseLessonsPerWeek + (index < extraLessonWeeks ? 1 : 0);
                    const lessons = orderedLessons.slice(start, start + count);
                    const watched = lessons.filter(lesson => watchedAulas[lesson.id]).length;
                    const subjects = [...new Set(lessons.map(lesson => lesson.subject))];
                    return {
                      week:index + 1,
                      lessons,
                      subjects,
                      watched,
                      pct:lessons.length ? Math.round(watched / lessons.length * 100) : 0,
                    };
                  }).filter(week => week.lessons.length || week.week <= weeksCount);
                  const scheduleCurrentWeek = cronStartDate
                    ? Math.max(1, Math.min(weeksCount, Math.floor((new Date() - new Date(cronStartDate)) / (7 * 24 * 60 * 60 * 1000)) + 1))
                    : 1;
                  const selectedWeek = Math.max(1, Math.min(weeksCount, curWeek || scheduleCurrentWeek || 1));
                  const selectedWeekData = scheduleWeeks.find(week => week.week === selectedWeek) || scheduleWeeks[0];
                  const openScheduleLesson = (lesson) => {
                    if (!lesson) return;
                    setActiveSubjectVid(lesson.subject);
                    setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
                    setActiveAulaAndReset(lesson.aula);
                    setView('videoaulas');
                  };
                  const applyPreset = async (preset) => {
                    const ordered = [
                      ...preset.subjects.filter(subject => courseSubjects.includes(subject)),
                      ...courseSubjects.filter(subject => !preset.subjects.includes(subject)),
                    ];
                    await saveCoursePlanPrefs(ordered, coursePlanLocked, coursePlanLessonOrder);
                    await saveCourseSchedulePrefs({ preset:preset.id, mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET, subjects:ordered });
                    addToast(`Preset "${preset.label}" aplicado ao cronograma.`, 'success', 2500);
                  };
                  const applyMixPreset = async (preset) => {
                    setCourseScheduleSubjectsOpen(false);
                    await saveCourseSchedulePrefs({ mixPreset:preset.id });
                    addToast(`Trilha "${preset.label}" aplicada.`, 'success', 2500);
                  };
                  const moveSubject = async (idx, dir) => {
                    const next = [...orderedSubjects];
                    const target = idx + dir;
                    if (target < 0 || target >= next.length) return;
                    [next[idx], next[target]] = [next[target], next[idx]];
                    await saveCoursePlanPrefs(next, coursePlanLocked, coursePlanLessonOrder);
                    await saveCourseSchedulePrefs({ preset:'custom', mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET, subjects:next });
                  };
                  const activePresetLabel = COURSE_SCHEDULE_PRESETS.find(preset => preset.id === courseSchedulePreset)?.label || 'Personalizado';
                  const activeMixLabel = activeMixPreset?.label || 'Ordem manual';
                  const completedLessons = orderedLessons.filter(lesson => watchedAulas[lesson.id]).length;
                  const schedulePct = orderedLessons.length ? Math.round(completedLessons / orderedLessons.length * 100) : 0;
                  const nextScheduleLesson = orderedLessons.find(lesson => !watchedAulas[lesson.id]) || orderedLessons[0] || null;
                  const currentWeekData = scheduleWeeks.find(week => week.week === selectedWeek) || selectedWeekData;
                  const nearbyWeeks = scheduleWeeks;

                  return (
                    <div className="space-y-5">
                      <section className={`rounded-2xl border p-5 md:p-6 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Cronograma</p>
                            <h2 className="text-2xl font-serif font-bold text-yellow-600 mt-1">Seu plano da semana</h2>
                            <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Acompanhe o avanço e abra a próxima aula sem mexer nas configurações.</p>
                          </div>
                          <button onClick={()=>setCourseScheduleSettingsOpen(open => !open)}
                            className={`px-4 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${dm?'border-gray-700 text-gray-200 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            <SettingsIcon className="w-4 h-4"/>
                            Configurações
                            {courseScheduleSettingsOpen?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-4 mt-5">
                          <div className={`rounded-2xl border p-4 ${dm?'bg-gray-950/50 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Progresso</p>
                            <div className="flex items-end justify-between gap-4 mt-2">
                              <div>
                                <p className="text-4xl font-serif font-bold text-yellow-600">{schedulePct}%</p>
                                <p className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>{completedLessons}/{orderedLessons.length} aulas concluídas</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center">
                                <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
                                  <p className="text-lg font-bold text-yellow-600">{weeksCount}</p>
                                  <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>semanas</p>
                                </div>
                                <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
                                  <p className="text-lg font-bold text-yellow-600">{lessonsPerWeekLabel}</p>
                                  <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>aulas/sem</p>
                                </div>
                              </div>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden mt-4 ${dm?'bg-gray-800':'bg-gray-200'}`}>
                              <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${schedulePct}%`}}/>
                            </div>
                          </div>
                          <button onClick={()=>openScheduleLesson(nextScheduleLesson)} disabled={!nextScheduleLesson}
                            className={`rounded-2xl border p-4 text-left transition-all disabled:opacity-50 ${dm?'bg-gray-950/50 border-gray-800 hover:border-yellow-700':'bg-gray-50 border-gray-100 hover:border-yellow-300'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Próxima aula</p>
                            <h3 className="text-xl font-serif font-bold text-yellow-600 mt-2">{nextScheduleLesson?.title || 'Nenhuma aula pendente'}</h3>
                            <p className={`text-sm mt-2 ${dm?'text-gray-400':'text-gray-500'}`}>{nextScheduleLesson ? `${capitalizeDisplayLabel(nextScheduleLesson.subject)} · ${shortTopicName(nextScheduleLesson.topic)}` : 'Tudo certo por aqui.'}</p>
                            {nextScheduleLesson&&<p className={`text-xs font-bold mt-4 ${dm?'text-yellow-300':'text-yellow-700'}`}>Abrir aula</p>}
                          </button>
                        </div>
                      </section>

                      {courseScheduleSettingsOpen&&(
                        <div className="space-y-5">
                          <section className={`rounded-2xl border p-5 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <div className={`grid grid-cols-1 ${mixedScheduleActive?'lg:grid-cols-[1fr_1.3fr]':'lg:grid-cols-[1fr_1.3fr_1fr]'} gap-4`}>
                              <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Data de início</label>
                                <input type="date" value={cronStartDate||''} onChange={e=>saveCronStartDate(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-medium ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                              </div>
                              <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Quero terminar em</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input type="number" min="1" max="104" value={weeksCount} onChange={e=>saveCourseSchedulePrefs({ weeks:e.target.value })}
                                    className={`w-full sm:w-28 p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                                  <div className="grid grid-cols-4 gap-1 flex-1 min-h-[46px]">
                                    {[12,16,24,36].map(weeks => (
                                      <button key={weeks} onClick={()=>saveCourseSchedulePrefs({ weeks })} className={`rounded-xl border text-xs font-bold ${weeksCount===weeks?(dm?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                        {weeks} semanas
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {!mixedScheduleActive&&(
                                <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Matérias em paralelo</label>
                                  <div className="grid grid-cols-6 gap-1 min-h-[46px]">
                                    {[1,2,3,4,5,6].map(size => (
                                      <button key={size} onClick={()=>saveCourseSchedulePrefs({ subjectBatchSize:size, mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET })}
                                        className={`rounded-xl border py-3 text-sm font-bold ${subjectBatchSize===size?(dm?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                        {size}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </section>

                          <section className={`rounded-2xl border p-5 space-y-5 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Presets prontos</p>
                              <h3 className="text-xl font-serif font-bold text-yellow-600">Escolha como o cronograma deve montar sua jornada</h3>
                            </div>

                            <div className={`rounded-2xl border p-4 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                              <div className="mb-3">
                                <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Estudar por matérias</p>
                                <h4 className="text-lg font-serif font-bold text-yellow-600">{mixedScheduleActive?'Desativado por uma mistura aula a aula':activePresetLabel}</h4>
                                <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>Mantém blocos de uma ou mais matérias por vez. Use quando quiser sentir que está fechando disciplinas.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {COURSE_SCHEDULE_PRESETS.map(preset => {
                                  const active = !mixedScheduleActive && courseSchedulePreset===preset.id;
                                  return (
                                    <button key={preset.id} onClick={()=>applyPreset(preset)}
                                      className={`rounded-xl border p-4 text-left transition-all h-full ${active?(dm?'border-yellow-600 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-800 bg-gray-950/40 hover:border-gray-700':'border-gray-200 bg-white hover:bg-gray-50')}`}>
                                      <p className="text-sm font-bold">{preset.label}</p>
                                      <p className={`text-xs mt-1 leading-snug ${dm?'text-gray-500':'text-gray-500'}`}>{preset.desc}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={`rounded-2xl border p-4 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                              <div className="mb-3">
                                <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Misturar aulas automaticamente</p>
                                <h4 className="text-lg font-serif font-bold text-yellow-600">{activeMixLabel}</h4>
                                <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>Ignora a ordem manual das matérias e mistura cada aula por prioridade, base, cobrança ou currículo.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {COURSE_SCHEDULE_MIX_PRESETS.map(preset => (
                                  <button key={preset.id} onClick={()=>applyMixPreset(preset)}
                                    className={`rounded-xl border p-4 text-left transition-all h-full ${courseScheduleMixPreset===preset.id?(dm?'border-yellow-600 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-800 bg-gray-950/40 hover:border-gray-700':'border-gray-200 bg-white hover:bg-gray-50')}`}>
                                    <p className="text-sm font-bold">{preset.label}</p>
                                    <p className={`text-xs mt-1 leading-snug ${dm?'text-gray-500':'text-gray-500'}`}>{preset.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </section>

                          <aside className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <button disabled={mixedScheduleActive} onClick={()=>setCourseScheduleSubjectsOpen(open => !open)}
                              className={`w-full flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed ${mixedScheduleActive?'opacity-60':''}`}>
                              <div>
                                <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Ordem das matérias</p>
                                <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>{mixedScheduleActive?`Bloqueada por "${activeMixLabel}".`:`${orderedSubjects.length} matérias na ordem manual.`}</p>
                              </div>
                              {!mixedScheduleActive&&(courseScheduleSubjectsOpen?<ChevronDown className="w-4 h-4 text-yellow-600"/>:<ChevronRight className="w-4 h-4 text-yellow-600"/>)}
                            </button>
                            {mixedScheduleActive ? (
                              <div className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed ${dm?'border-yellow-900/50 bg-yellow-950/20 text-yellow-200':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                                Esta trilha ordena as aulas automaticamente, então a ordem manual fica fechada.
                              </div>
                            ) : courseScheduleSubjectsOpen ? (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {orderedSubjects.map((subject, idx) => {
                                  const total = courseLessons.filter(lesson => lesson.subject === subject).length;
                                  return (
                                    <div key={subject} className={`rounded-xl border p-3 ${dm?'bg-gray-950/60 border-gray-800':'bg-gray-50 border-gray-200'}`}>
                                      <div className="flex items-center gap-2">
                                        <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${dm?'bg-gray-800 text-yellow-300':'bg-yellow-100 text-yellow-700'}`}>{idx + 1}</span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-bold truncate">{capitalizeDisplayLabel(subject)}</p>
                                          <p className={`text-[10px] ${dm?'text-gray-500':'text-gray-500'}`}>{total} aula{total!==1?'s':''}</p>
                                        </div>
                                        <button onClick={()=>moveSubject(idx,-1)} disabled={idx===0} className={`px-1.5 py-1 rounded text-xs disabled:opacity-20 ${dm?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-100'}`}>↑</button>
                                        <button onClick={()=>moveSubject(idx,1)} disabled={idx===orderedSubjects.length-1} className={`px-1.5 py-1 rounded text-xs disabled:opacity-20 ${dm?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-100'}`}>↓</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={`mt-4 rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/40':'border-gray-100 bg-gray-50'}`}>
                                <p className={`text-xs ${dm?'text-gray-500':'text-gray-500'}`}>Fechado por padrão. Abra só quando quiser ajustar a sequência manual.</p>
                              </div>
                            )}
                          </aside>
                        </div>
                      )}

                      <section className="space-y-3">
                          {currentWeekData&&(
                            <div className={`rounded-2xl border-2 border-yellow-500 overflow-hidden ${dm?'bg-gray-900':'bg-white'}`}>
                              <div className={`p-4 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Agenda da semana</p>
                                    <h3 className="text-xl font-serif font-bold text-yellow-600">Semana {currentWeekData.week}</h3>
                                    <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>{currentWeekData.subjects.join(' · ') || 'Sem aulas nessa semana'}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-2xl font-serif font-bold ${currentWeekData.pct===100?'text-green-500':'text-yellow-600'}`}>{currentWeekData.pct}%</p>
                                    <p className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{currentWeekData.watched}/{currentWeekData.lessons.length}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {currentWeekData.lessons.map((lesson, index) => {
                                  const watched = !!watchedAulas[lesson.id];
                                  return (
                                    <div key={`${lesson.id}-${index}`} onClick={()=>openScheduleLesson(lesson)} role="button" tabIndex={0}
                                      onKeyDown={event => {
                                        if (event.key === 'Enter' || event.key === ' ') openScheduleLesson(lesson);
                                      }}
                                      className={`rounded-xl border p-3 text-left transition-all ${watched?(dm?'border-green-800 bg-green-900/10':'border-green-200 bg-green-50'):(dm?'border-gray-800 bg-gray-950/50 hover:border-yellow-800':'border-gray-200 bg-gray-50 hover:bg-white hover:border-yellow-300')}`}>
                                      <div className="flex items-start gap-2">
                                        <span className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':(dm?'border border-gray-700 text-gray-500':'border border-gray-300 text-gray-400')}`}>
                                          {watched ? <CheckIcon className="w-3 h-3"/> : <PlayIcon className="w-3 h-3"/>}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold truncate">{lesson.title}</p>
                                          <p className={`text-[11px] mt-1 truncate ${dm?'text-gray-500':'text-gray-500'}`}>{capitalizeDisplayLabel(lesson.subject)} · {shortTopicName(lesson.topic)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dm?'text-gray-500':'text-gray-400'}`}>Agendas prévias e próximas</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {nearbyWeeks.map(week => {
                              const isSelected = week.week === selectedWeek;
                              const isCurrent = week.week === scheduleCurrentWeek;
                              return (
                                <button key={week.week} onClick={()=>setCurWeek(week.week)}
                                  className={`rounded-2xl border p-4 text-left transition-all ${isSelected?(dm?'border-yellow-600 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-800 bg-gray-900 hover:border-gray-700':'border-gray-200 bg-white hover:border-yellow-300')}`}>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${week.pct===100?'bg-green-500 text-white':isCurrent?(dm?'bg-yellow-900/60 text-yellow-400 ring-1 ring-yellow-500':'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400'):(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                                      {week.pct===100?<CheckIcon className="w-3.5 h-3.5"/>:week.week}
                                    </div>
                                    <span className={`text-[10px] font-bold ${week.pct===100?'text-green-500':dm?'text-gray-500':'text-gray-400'}`}>{week.pct}%</span>
                                  </div>
                                  <p className={`text-xs font-bold truncate mb-0.5 ${dm?'text-gray-300':'text-gray-700'}`}>{week.subjects.join(' + ') || 'Semana vazia'}</p>
                                  <p className={`text-[10px] truncate ${dm?'text-gray-600':'text-gray-400'}`}>{week.lessons[0]?.title || 'Sem aulas'}{week.lessons.length>1?` +${week.lessons.length-1}`:''}</p>
                                </button>
                              );
                            })}
                            </div>
                          </div>
                        </section>
                      </div>
                  );
                })()}
              </div>
            </div>
          );
}
