import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { resolveScheduleSubjectOrder } from '../../services/courseSchedule.js';
import { useCourseHeroJourney } from './useCourseHeroJourney.js';

export default function CoursePortalView() {
  const {
    addToast,
    appliedCourseSubjectOrder,
    appliedVideoaulasData,
    ArrowLeft,
    aulaDocId,
    aulaVqKey,
    Award,
    BrainIcon,
    CalendarCheck,
    callWithRotation,
    canUseAdvancedFeatures,
    capitalizeDisplayLabel,
    CheckCircle2,
    CheckIcon,
    ChevronDown,
    ChevronRight,
    COURSE_CYCLE_DEFAULT_SUBJECT_BATCH_SIZE,
    COURSE_CYCLE_MAX_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_DEFAULT_MIX_PRESET,
    COURSE_SCHEDULE_MIX_PRESETS,
    COURSE_SCHEDULE_PRESETS,
    courseLessonDisplayTitle,
    courseCycleSubjectBatchSize,
    coursePlanSubjects,
    courseScheduleCadence,
    courseScheduleDayCursor,
    courseScheduleEffortHours,
    courseScheduleEndDate,
    courseScheduleGoalMode,
    courseScheduleMixPreset,
    courseSchedulePreset,
    courseScheduleSettingsOpen,
    courseScheduleSubjectsOpen,
    courseScheduleStudyDays,
    courseScheduleWeeks,
    cronStartDate,
    cursoTab,
    curWeek,
    darkMode,
    dueCount,
    effectiveCoursePlanLessonOrder,
    EmptyState,
    extractAulas,
    flattenCourseLessons,
    formatCourseDuration,
    getAulaId,
    getDueReviews,
    getKey,
    getTodayKey,
    inactivateCourseQuestion,
    isAdmin,
    isAnswerCorrect,
    isReviewItemFavorite,
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
    saveCourseCyclePrefs,
    saveCourseSchedulePrefs,
    saveCronStartDate,
    setActiveAula,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setCourseScheduleSettingsOpen,
    setCourseScheduleDayCursor,
    setCourseScheduleSubjectsOpen,
    setCursoTab,
    setCurWeek,
    setReviewNotebook,
    setReviewSession,
    settings,
    SettingsIcon,
    setView,
    setVqExpandedSubj,
    shortTopicName,
    sortCourseSubjectsForDisplay,
    toggleReviewFavorite,
    totalLessonSeconds,
    trackQuestionAnswered,
    updateReviewItem,
    videoaulasLoading,
    VideoIcon,
    vqExpandedSubj,
    watchedAulas,
  } = useFeatureContext();

          const dm = darkMode;
          const scheduleJourney = useCourseHeroJourney({ enabled:true });
          const heroJourney = scheduleJourney; // compatibilidade do bloco legado, mantido inacessível
          React.useEffect(() => {
            if (cursoTab === 'plano') setCursoTab('cronograma');
          }, [cursoTab, setCursoTab]);
          const currentWeek = scheduleJourney.scheduleCurrentWeek;

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

          const tabs = [
            {id:'videoaulas', label:'Videoaulas',   icon:<VideoIcon className="w-4 h-4"/>},
            {id:'revisoes',   label:'Revisões',     icon:<RepeatIcon className="w-4 h-4"/>, badge: dueCount},
            {id:'cronograma', label:'Plano de estudos', icon:<CalendarCheck className="w-4 h-4"/>},
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
                      <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Videoaulas · Plano de estudos · Revisões</p>
                    </div>
                    {/* Progresso global */}
                    <div className={`flex-shrink-0 text-right`}>
                      <div className={`text-3xl font-bold font-serif ${globalPct===100?'text-green-500':'text-yellow-600'}`}>{globalPct}<span className="text-lg">%</span></div>
                      <div className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>
                        {totalWatched}/{totalAulas} aulas{totalCourseDuration?` · ${totalCourseDuration}`:''}
                      </div>
                      {plannedLessons.length>0
                        ? <div className={`text-xs font-bold mt-1 ${dm?'text-yellow-500':'text-yellow-600'}`}>Plano {scheduleJourney.progress.pct}%</div>
                        : currentWeek&&<div className={`text-xs font-bold mt-1 ${dm?'text-yellow-500':'text-yellow-600'}`}>Semana {currentWeek}</div>}
                    </div>
                  </div>
                  {/* Barra de progresso global */}
                  <div className={`h-1 w-full rounded-full overflow-hidden mb-0 ${dm?'bg-gray-800':'bg-gray-100'}`}>
                    <div className={`h-full rounded-full transition-all duration-700 ${globalPct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${globalPct}%`}}/>
                  </div>
                  {/* Tabs */}
                  <div className="flex overflow-x-auto mt-1 -mb-px">
	                    {tabs.map(tab=>(
	                      <button key={tab.id} onClick={()=>tab.id==='revisoes'&&canUseAdvancedFeatures?openSpacedReview():setCursoTab(tab.id)}
                        className={`relative flex flex-shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all ${cursoTab===tab.id
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
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExp}))}
                              onKeyDown={(event)=>{
                                if(event.key==='Enter'||event.key===' '){
                                  event.preventDefault();
                                  setVqExpandedSubj(p=>({...p,[subj]:!isExp}));
                                }
                              }}
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
                            </div>
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

                {/* ── ABA CRONOGRAMA ── */}
                {cursoTab==='revisoes'&&(()=>{
                  const dueItems = getDueReviews();
                  const dueFlashcardItems = dueItems.filter(item => item.question?.isFlashcard);
                  const dueQuestionItems = dueItems.filter(item => !item.question?.isFlashcard);

                  if (!reviewSession) {
                    // Tela de lista de revisões pendentes
                    return (
                      <div>
                        {dueItems.length === 0 ? (
                          <EmptyState
                            darkMode={dm}
                            icon={<RepeatIcon className="w-7 h-7"/>}
                            title="Nenhuma revisão pendente"
                            message="Quando terminar uma aula ou um bloco de questões, adicione-o à sua revisão."
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
                              <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Fila de hoje</p>
                              <p className={`mt-1 text-sm ${dm?'text-gray-300':'text-gray-600'}`}>As questões de todas as aulas são misturadas para você revisar o que precisa agora.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Sessão de revisão ativa
                  const { items: sessionItems, index, sessionAnswers, sessionResults = {}, completed = false } = reviewSession;
                  const cur = sessionItems[index];
                  const reviewSessionKey = item => item?.item?.cardKey || `${item?.aulaId}/${item?.blockId}/${item?.qId}`;
                  const total = sessionItems.length;
                  const done = Object.keys(sessionAnswers).length;
                  const finished = done === total;
                  const sessionAllFlashcards = sessionItems.every(item => item.question?.isFlashcard);
                  const reviewListMode = !sessionAllFlashcards && canUseAdvancedFeatures && (settings.questionDisplayMode || 'list') === 'list';

                  if (finished && completed) {
                    const correct = Object.values(sessionResults).filter(Boolean).length;
                    const pct = Math.round(correct / total * 100);
                    const wrong = total - correct;
                    const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns erros para revisar.' : 'Sessão útil para revelar lacunas importantes.';
                    return (
                      <div className={`rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
                        <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Sessão encerrada</p>
                        <h3 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Revisão concluída</h3>
                        <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
                        <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correct}/{total} corretas · {wrong} erros</p>
                        <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} As questões acertadas foram empurradas para o próximo intervalo; as erradas voltam para revisão mais cedo.</p>
                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-green-500">{correct}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>avançaram</p>
                          </div>
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-red-500">{wrong}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>erros</p>
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
                            selectedLetter={sessionAnswers[reviewSessionKey(item)]}
                            onAnswer={async (letter)=>{
                              const correct = isAnswerCorrect(item.question, letter);
                              trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                              const itemKey = reviewSessionKey(item);
                              setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [itemKey]: letter}, sessionResults:{...(p?.sessionResults||{}), [itemKey]:correct}}));
                              if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
                              await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                            }}
                            darkMode={dm}
                            isFavorite={isReviewItemFavorite(item)}
                            onToggleFavorite={()=>toggleReviewFavorite(item)}
                            showErrorNotebook={false}
                            apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
                            adminQuestionExplanations={isAdmin}
                            onAdminDisableQuestion={isAdmin ? (()=>inactivateCourseQuestion({
                              aulaId:item.aulaId,
                              blockId:item.blockId,
                              questionId:item.qId,
                              question:item.question,
                            })) : null}
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
                  const itemKey = reviewSessionKey(item);
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
	                        selectedLetter={sessionAnswers[itemKey]}
			                        onAnswer={async (letter)=>{
			                          const correct = isAnswerCorrect(reviewQ, letter);
			                          trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
		                          setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [itemKey]: letter}, sessionResults:{...(p?.sessionResults||{}), [itemKey]:correct}}));
			                          if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
			                          await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
			                        }}
	                        darkMode={dm}
	                        isFavorite={isReviewItemFavorite(item)}
	                        onToggleFavorite={()=>toggleReviewFavorite(item)}
		                        showErrorNotebook={false}
	                        apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
	                        adminQuestionExplanations={isAdmin}
	                        onAdminDisableQuestion={isAdmin ? (()=>inactivateCourseQuestion({
	                          aulaId:item.aulaId,
	                          blockId:item.blockId,
	                          questionId:item.qId,
	                          question:item.question,
	                        })) : null}
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

                {false&&cursoTab==='plano'&&(()=>{
                  if(videoaulasLoading || !heroJourney.isReady) return <LoadingState darkMode={dm} label="Carregando ciclo de estudos..."/>;
                  if(!courseLessons.length) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<Award className="w-7 h-7"/>}
                      title="Nenhuma aula carregada"
                      message="O Ciclo de Estudos usa as videoaulas reais do portal para montar o próximo comando de aula e questões."
                    />
                  );

                  const {
                    activeSubjectSummaries,
                    cycleSubjectBatchSize,
                    heroJourneyStep,
                    moveSubject,
                    nextStepForSubject,
                    progress,
                    subjectSummaries,
                  } = heroJourney;
                  const activeSubjectNames = new Set(activeSubjectSummaries.map(item => item.subject));
                  const cycleSubjectOptions = Array.from(
                    { length:Math.min(COURSE_CYCLE_MAX_SUBJECT_BATCH_SIZE, Math.max(COURSE_CYCLE_DEFAULT_SUBJECT_BATCH_SIZE, subjectSummaries.length || COURSE_CYCLE_DEFAULT_SUBJECT_BATCH_SIZE)) },
                    (_, index) => index + 1
                  );

                  return (
                    <div className="space-y-5">
                      <section className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                        <div className={`px-5 py-4 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Ciclo de Estudos</p>
	                          <h2 className="text-2xl font-serif font-bold text-yellow-600">Próximo comando</h2>
	                          <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Um roteiro cíclico para alternar matérias e espaçar revisões da mesma aula: diretas ímpares, diretas pares, clínicas ímpares e clínicas pares.</p>
                        </div>
                        <div className="p-4">
                          {heroJourneyStep&&(
                            <button onClick={heroJourneyStep.step.action} className={`app-card group w-full rounded-2xl px-4 py-4 text-left flex flex-col sm:flex-row sm:items-center gap-4 transition-all`}>
                              <span className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-yellow-600 ${dm?'bg-gray-800':'bg-yellow-50'}`}>
                                <Award className="w-6 h-6"/>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${dm?'text-gray-500':'text-gray-400'}`}>Agora</span>
                                <strong className={`mt-1 block text-lg md:text-xl font-serif leading-tight ${dm?'text-gray-100':'text-gray-900'}`}>{heroJourneyStep.step.detail}</strong>
                                <span className={`mt-1 block text-sm ${dm?'text-gray-400':'text-gray-600'}`}>
                                  {capitalizeDisplayLabel(heroJourneyStep.item.subject)} · {heroJourneyStep.step.label}{heroJourneyStep.step.subdetail?` · ${heroJourneyStep.step.subdetail}`:''}
                                </span>
                              </span>
                              <span className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-bold text-white group-hover:bg-yellow-700">
                                Continuar<ChevronRight className="w-4 h-4"/>
                              </span>
                            </button>
                          )}
                          {!activeSubjectSummaries.length&&(
                            <div className="p-8 text-center">
                              <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-3"/>
                              <p className="font-bold text-green-500">Curso em dia</p>
                              <p className={`text-sm mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>Quando houver algo para fazer, aparece aqui.</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
                        <section className={`rounded-2xl border p-4 md:p-5 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Progresso do ciclo</p>
                              <h3 className="text-xl font-serif font-bold text-yellow-600 mt-1">Matérias em rotação</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-950/40':'border-gray-100 bg-gray-50'}`}>
                                <strong className="block text-lg text-yellow-600">{progress.primary}</strong>
                                <span className="text-[10px] opacity-50">com base</span>
                              </div>
                              <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-950/40':'border-gray-100 bg-gray-50'}`}>
                                <strong className="block text-lg text-yellow-600">{progress.completed}</strong>
                                <span className="text-[10px] opacity-50">ciclos</span>
                              </div>
                              <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-950/40':'border-gray-100 bg-gray-50'}`}>
                                <strong className="block text-lg text-yellow-600">{progress.pct}%</strong>
                                <span className="text-[10px] opacity-50">geral</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-5 space-y-3">
                            {activeSubjectSummaries.map(item=>{
                              const step = nextStepForSubject(item);
                              const pct = item.total ? Math.round(item.completed / item.total * 100) : 0;
                              return (
                                <button key={item.subject} onClick={step.action} disabled={step.done}
                                  className={`w-full rounded-xl border p-4 text-left transition-all ${dm?'bg-gray-950/50 border-gray-800 hover:border-yellow-800 hover:bg-gray-950':'bg-gray-50 border-gray-200 hover:border-yellow-300 hover:bg-white'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dm?'bg-gray-800 text-yellow-300':'bg-yellow-100 text-yellow-700'}`}>
                                      {step.done?<CheckIcon className="w-4 h-4"/>:<PlayIcon className="w-4 h-4"/>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${dm?'text-gray-600':'text-gray-400'}`}>{capitalizeDisplayLabel(item.subject)}</p>
                                        <span className="text-xs font-bold text-yellow-600">{pct}%</span>
                                      </div>
                                      <div className={`mt-1.5 h-1.5 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}>
                                        <div className="h-full rounded-full bg-yellow-500" style={{width:`${pct}%`}}/>
                                      </div>
                                      <p className={`mt-2 text-xs truncate ${dm?'text-gray-500':'text-gray-500'}`}>{step.label} · {step.detail}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </section>

                        <aside className="space-y-4">
                          <section className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Configuração</p>
                            <h3 className="text-xl font-serif font-bold text-yellow-600 mt-1">Ritmo do ciclo</h3>
                            <p className={`mt-1 text-xs ${dm?'text-gray-500':'text-gray-500'}`}>Escolha quantas matérias ficam ativas antes do ciclo abrir novas frentes.</p>
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {cycleSubjectOptions.map(value=>(
                                <button key={value} onClick={()=>saveCourseCyclePrefs({ subjectBatchSize:value })}
                                  className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${cycleSubjectBatchSize===value?(dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300':'border-yellow-300 bg-yellow-50 text-yellow-800'):(dm?'border-gray-800 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                  {value}
                                </button>
                              ))}
                            </div>
                          </section>

                          <section className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Ordem</p>
                            <h3 className="text-xl font-serif font-bold text-yellow-600 mt-1">Matérias</h3>
                            <div className="mt-4 space-y-2">
                            {subjectSummaries.map((item, idx)=>{
                              const active = activeSubjectNames.has(item.subject);
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
                        </aside>
                      </div>
                    </div>
                  );
                })()}

                {(cursoTab==='cronograma'||cursoTab==='plano')&&(()=>{
                  if(videoaulasLoading) return <LoadingState darkMode={dm} label="Montando cronograma..."/>;
                  if(!courseLessons.length) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<CalendarCheck className="w-7 h-7"/>}
                      title="Nenhuma aula para montar cronograma"
                      message="Quando as videoaulas carregarem, o cronograma será montado pela organização atual do curso."
                    />
                  );

                  const {
                    activeMixPreset,
                    backlogLessons,
                    dailyScheduleActive,
                    lessonWatched,
                    lessonsPerDayLabel,
                    lessonsPerWeekLabel,
                    mixedScheduleActive,
                    nextScheduleLesson,
                    nextLessonStatus,
                    nextLessonDay,
                    nextLessonWeek,
                    openLesson:openScheduleLesson,
                    orderedLessons,
                    orderedSubjects,
                    plannedDailySeconds,
                    plannedWeeklySeconds,
                    progress:scheduleProgress,
                    scheduleCurrentWeek,
                    scheduleCurrentDay,
                    scheduleDays,
                    scheduleEndDate,
                    scheduleHasStarted,
                    scheduleWeeks,
                    selectedWeek,
                    selectedWeekData,
                    selectedDayData,
                    subjectBatchSize,
                    totalEffortSeconds,
                    weeksCount,
                  } = scheduleJourney;
                  const applyPreset = async (preset) => {
                    const lessonCounts = Object.fromEntries(courseSubjects.map(subject => [
                      subject,
                      courseLessons.filter(lesson => lesson.subject === subject).length,
                    ]));
                    const ordered = resolveScheduleSubjectOrder({
                      availableSubjects:courseSubjects,
                      lessonCounts,
                      orderBy:preset.orderBy,
                      preferredSubjects:preset.id === 'course-order'
                        ? (appliedCourseSubjectOrder?.length ? appliedCourseSubjectOrder : courseSubjects)
                        : preset.subjects,
                    });
                    await saveCourseSchedulePrefs({ preset:preset.id, mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET, subjects:ordered });
                    addToast(`Plano reorganizado: ${preset.label}.`, 'success', 2500);
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
                    await saveCourseSchedulePrefs({ preset:'custom', mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET, subjects:next });
                  };
                  const activePresetLabel = COURSE_SCHEDULE_PRESETS.find(preset => preset.id === courseSchedulePreset)?.label || 'Personalizado';
                  const activeMixLabel = activeMixPreset?.label || 'Ordem manual';
                  const completedLessons = scheduleProgress.completed;
                  const schedulePct = scheduleProgress.pct;
                  const currentAgendaData = dailyScheduleActive ? selectedDayData : selectedWeekData;
                  const visibleOrderPresets = COURSE_SCHEDULE_PRESETS.filter(preset => !preset.legacy || preset.id === courseSchedulePreset);
                  const visibleMixPresets = COURSE_SCHEDULE_MIX_PRESETS.filter(preset => !preset.legacy || preset.id === courseScheduleMixPreset);
                  const weekdayOptions = [
                    { id:1, label:'Seg' }, { id:2, label:'Ter' }, { id:3, label:'Qua' },
                    { id:4, label:'Qui' }, { id:5, label:'Sex' }, { id:6, label:'Sáb' }, { id:7, label:'Dom' },
                  ];
                  const scheduleGoalOptions = [
                    { id:'weeks', label:'Semanas' },
                    { id:'effort', label:'Carga horária' },
                    { id:'date', label:'Data final' },
                  ];
                  const minimumScheduleEndDate = [getTodayKey(), cronStartDate].filter(Boolean).sort().at(-1);
                  const formatPlanDate = date => date
                    ? date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '')
                    : '';
                  const weekDateLabel = week => week?.startDate && week?.endDate
                    ? `${formatPlanDate(week.startDate)} – ${formatPlanDate(week.endDate)}`
                    : '';
                  const finishDateLabel = formatPlanDate(scheduleEndDate);
                  const nextLessonLabel = nextLessonStatus === 'backlog'
                    ? dailyScheduleActive
                      ? `Pendente de ${formatPlanDate(nextLessonDay?.date)}`
                      : `Pendente da semana ${nextLessonWeek?.week || ''}`
                    : nextLessonStatus === 'current'
                      ? dailyScheduleActive ? 'Planejada para hoje' : 'Planejada para esta semana'
                      : nextLessonStatus === 'future'
                        ? dailyScheduleActive
                          ? `Planejada para ${formatPlanDate(nextLessonDay?.date)}`
                          : `Planejada para a semana ${nextLessonWeek?.week || ''}`
                        : 'Plano concluído';
                  const timelineEntries = dailyScheduleActive ? scheduleDays : scheduleWeeks;
                  const selectedTimelineIndex = dailyScheduleActive
                    ? Math.max(0, timelineEntries.findIndex(day => day.dateKey === selectedDayData?.dateKey))
                    : Math.max(0, timelineEntries.findIndex(week => week.week === selectedWeek));
                  const selectTimelineEntry = entry => dailyScheduleActive
                    ? setCourseScheduleDayCursor(entry?.dateKey || null)
                    : setCurWeek(entry?.week || scheduleCurrentWeek);
                  const selectRelativePeriod = direction => selectTimelineEntry(
                    timelineEntries[Math.max(0, Math.min(timelineEntries.length - 1, selectedTimelineIndex + direction))]
                  );
                  const selectCurrentPeriod = () => dailyScheduleActive
                    ? setCourseScheduleDayCursor(scheduleCurrentDay?.dateKey || null)
                    : setCurWeek(scheduleCurrentWeek);
                  const toggleStudyDay = day => {
                    const selected = courseScheduleStudyDays.includes(day);
                    if (selected && courseScheduleStudyDays.length === 1) {
                      addToast('Escolha pelo menos um dia de estudo.', 'info', 2500);
                      return;
                    }
                    const next = selected
                      ? courseScheduleStudyDays.filter(value => value !== day)
                      : [...courseScheduleStudyDays, day].sort((left,right)=>left-right);
                    setCourseScheduleDayCursor(null);
                    saveCourseSchedulePrefs({ studyDays:next });
                  };

                  return (
                    <div className="flex flex-col gap-5">
                      <section className={`order-1 rounded-2xl border p-5 md:p-6 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Plano de estudos</p>
                            <h2 className="text-2xl font-serif font-bold text-yellow-600 mt-1">Seu curso, em uma ordem clara</h2>
                            <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>A carga semanal considera a duração das aulas. Ao concluir uma aula, a seleção pedagógica segue para Revisões.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 mt-5">
                          <div className={`rounded-2xl border p-4 ${dm?'bg-gray-950/50 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Progresso</p>
                            <div className="flex items-end justify-between gap-4 mt-2">
                              <div>
                                <p className="text-4xl font-serif font-bold text-yellow-600">{schedulePct}%</p>
                                <p className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>{completedLessons}/{orderedLessons.length} aulas concluídas</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center">
                                <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
                                  <p className="text-lg font-bold text-yellow-600">{formatCourseDuration(dailyScheduleActive?plannedDailySeconds:plannedWeeklySeconds) || '—'}</p>
                                  <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>{dailyScheduleActive?'vídeo/dia':'vídeo/sem'}</p>
                                </div>
                                <div className={`rounded-xl border px-3 py-2 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
                                  <p className="text-lg font-bold text-yellow-600">{dailyScheduleActive?lessonsPerDayLabel:lessonsPerWeekLabel}</p>
                                  <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>{dailyScheduleActive?'aulas/dia':'aulas/sem'}</p>
                                </div>
                              </div>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden mt-4 ${dm?'bg-gray-800':'bg-gray-200'}`}>
                              <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${schedulePct}%`}}/>
                            </div>
                            <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>
                              <span>{formatCourseDuration(totalEffortSeconds) || 'Carga não informada'} de videoaulas</span>
                              <span>{finishDateLabel ? `Previsão: ${finishDateLabel}` : `${weeksCount} semanas`}</span>
                            </div>
                          </div>
                          <button onClick={()=>openScheduleLesson(nextScheduleLesson)} disabled={!nextScheduleLesson}
                            className={`rounded-2xl border p-4 text-left transition-all disabled:opacity-50 ${nextLessonStatus==='backlog'?(dm?'border-amber-800 bg-amber-950/20':'border-amber-200 bg-amber-50'):(dm?'bg-gray-950/50 border-gray-800 hover:border-yellow-700':'bg-gray-50 border-gray-100 hover:border-yellow-300')}`}>
                            <div className="flex items-center justify-between gap-3">
                              <p className={`text-xs font-bold uppercase tracking-widest ${nextLessonStatus==='backlog'?'text-amber-600':dm?'text-gray-500':'text-gray-400'}`}>Próxima aula</p>
                              <span className={`text-[10px] font-bold ${nextLessonStatus==='backlog'?'text-amber-600':dm?'text-gray-500':'text-gray-400'}`}>{nextLessonLabel}</span>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-yellow-600 mt-2">{nextScheduleLesson?.title || 'Nenhuma aula pendente'}</h3>
                            <p className={`text-sm mt-2 ${dm?'text-gray-400':'text-gray-500'}`}>{nextScheduleLesson ? `${capitalizeDisplayLabel(nextScheduleLesson.subject)} · ${shortTopicName(nextScheduleLesson.topic)}` : 'Tudo certo por aqui.'}</p>
                            {nextScheduleLesson&&<p className={`text-xs font-bold mt-4 ${dm?'text-yellow-300':'text-yellow-700'}`}>Abrir aula</p>}
                          </button>
                        </div>
                        {backlogLessons.length>0&&(
                          <div className={`mt-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center ${dm?'border-amber-900/70 bg-amber-950/15':'border-amber-200 bg-amber-50'}`}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-amber-600">{backlogLessons.length} {backlogLessons.length===1
                                ? `aula pendente de ${dailyScheduleActive?'dia anterior':'semana anterior'}`
                                : `aulas pendentes de ${dailyScheduleActive?'dias anteriores':'semanas anteriores'}`}</p>
                              <p className={`mt-0.5 text-xs ${dm?'text-gray-400':'text-gray-600'}`}>Elas entram antes das aulas futuras, sem alterar o que você já concluiu.</p>
                            </div>
                            <button onClick={()=>openScheduleLesson(backlogLessons[0])} className="min-h-[38px] rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">Retomar pendência</button>
                          </div>
                        )}
                      </section>

                      <div className="order-3 space-y-5">
                        <button onClick={()=>setCourseScheduleSettingsOpen(open => !open)}
                          className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${dm?'border-gray-700 text-gray-200 hover:bg-gray-800':'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                          <SettingsIcon className="w-4 h-4"/>
                          Configurar plano
                          {courseScheduleSettingsOpen?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                        </button>
                        {courseScheduleSettingsOpen&&(<>
                          <section className={`rounded-2xl border p-5 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            <div className="mb-4 grid grid-cols-2 gap-2">
                              {[
                                { id:'weekly', label:'Semanal', desc:'Organiza a carga por semana.' },
                                { id:'daily', label:'Diário', desc:'Divide a carga nos dias escolhidos.' },
                              ].map(option => (
                                <button key={option.id} onClick={()=>{setCourseScheduleDayCursor(null);saveCourseSchedulePrefs({cadence:option.id});}}
                                  className={`rounded-xl border p-3 text-left ${courseScheduleCadence===option.id?(dm?'border-yellow-600 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-800 bg-gray-950/35':'border-gray-200 bg-gray-50')}`}>
                                  <span className="block text-sm font-bold">{option.label}</span>
                                  <span className={`mt-1 block text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>{option.desc}</span>
                                </button>
                              ))}
                            </div>
                            {dailyScheduleActive&&(
                              <div className={`mb-4 rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Dias de estudo</label>
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                                  {weekdayOptions.map(day => {
                                    const selected = courseScheduleStudyDays.includes(day.id);
                                    return <button key={day.id} onClick={()=>toggleStudyDay(day.id)} aria-pressed={selected}
                                      className={`h-14 rounded-xl border px-3 py-4 text-sm font-bold ${selected?(dm?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-500':'border-gray-200 text-gray-500')}`}>{day.label}</button>;
                                  })}
                                </div>
                                <p className={`mt-2 text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>A duração das aulas é distribuída somente nesses dias.</p>
                              </div>
                            )}
                            <div className={`grid grid-cols-1 ${mixedScheduleActive?'lg:grid-cols-[1fr_1.3fr]':'lg:grid-cols-[1fr_1.3fr_1fr]'} gap-4`}>
                              <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Data de início</label>
                                <input type="date" value={cronStartDate||''} onChange={e=>saveCronStartDate(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-medium ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                                <p className={`mt-2 text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>{cronStartDate
                                  ? `${scheduleHasStarted?'Semana atual':'Início programado'}: ${scheduleCurrentWeek}`
                                  : dailyScheduleActive?'Sem data, o plano diário começa hoje.':'Sem data, o plano permanece na semana 1.'}</p>
                              </div>
                              <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Quero terminar em</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {scheduleGoalOptions.map(option => (
                                    <button key={option.id} onClick={()=>saveCourseSchedulePrefs({ goalMode:option.id })}
                                      className={`min-h-[42px] rounded-lg border px-2 py-2 text-[11px] font-bold ${courseScheduleGoalMode===option.id?(dm?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                                {courseScheduleGoalMode==='weeks'&&(
                                  <div className="mt-3 flex items-center gap-2">
                                    <input key={`weeks-${courseScheduleWeeks}`} type="number" min="1" max="104" defaultValue={courseScheduleWeeks}
                                      onBlur={e=>saveCourseSchedulePrefs({ weeks:e.target.value })}
                                      onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}
                                      className={`w-24 p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                                    <span className={`text-sm font-medium ${dm?'text-gray-300':'text-gray-600'}`}>semanas</span>
                                  </div>
                                )}
                                {courseScheduleGoalMode==='effort'&&(
                                  <div className="mt-3 flex items-center gap-2">
                                    <input key={`effort-${courseScheduleCadence}-${courseScheduleEffortHours}`} type="number" min="0.5" max="80" step="0.5" defaultValue={courseScheduleEffortHours}
                                      onBlur={e=>saveCourseSchedulePrefs({ effortHours:e.target.value })}
                                      onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}
                                      className={`w-24 p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                                    <span className={`text-sm font-medium ${dm?'text-gray-300':'text-gray-600'}`}>{dailyScheduleActive?'horas por dia de estudo':'horas por semana'}</span>
                                  </div>
                                )}
                                {courseScheduleGoalMode==='date'&&(
                                  <input type="date" min={minimumScheduleEndDate} value={courseScheduleEndDate||''} onChange={e=>saveCourseSchedulePrefs({ endDate:e.target.value })}
                                    className={`mt-3 w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${dm?'bg-gray-950 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                                )}
                                <p className={`mt-2 text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>
                                  {courseScheduleGoalMode==='date'
                                    ? courseScheduleEndDate ? `Carga distribuída até ${new Date(`${courseScheduleEndDate}T12:00:00`).toLocaleDateString('pt-BR')}.` : 'Escolha a data em que pretende concluir o curso.'
                                    : courseScheduleGoalMode==='effort'
                                      ? `Essa carga distribui as videoaulas em cerca de ${weeksCount} ${weeksCount===1?'semana':'semanas'}.`
                                      : `Estimativa média de ${formatCourseDuration(dailyScheduleActive?plannedDailySeconds:plannedWeeklySeconds) || 'carga não informada'} de videoaulas por ${dailyScheduleActive?'dia de estudo':'semana'}.`}
                                </p>
                              </div>
                              {!mixedScheduleActive&&(
                                <div className={`rounded-xl border p-3 ${dm?'border-gray-800 bg-gray-950/35':'border-gray-100 bg-gray-50/80'}`}>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Matérias por bloco</label>
                                  <div className="grid grid-cols-6 gap-1 min-h-[46px]">
                                    {[1,2,3,4,5,6].map(size => (
                                      <button key={size} onClick={()=>saveCourseSchedulePrefs({ subjectBatchSize:size, mixPreset:COURSE_SCHEDULE_DEFAULT_MIX_PRESET })}
                                        className={`rounded-xl border py-3 text-sm font-bold ${subjectBatchSize===size?(dm?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                        {size}
                                      </button>
                                    ))}
                                  </div>
                                  <p className={`mt-2 text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>Dentro do bloco, as aulas se alternam sem quebrar a ordem de cada matéria.</p>
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
                                {visibleOrderPresets.map(preset => {
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
                                <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>Reordena as aulas por objetivo. Apenas “Médico Bicho” deixa Preventiva fora, como indicado no próprio preset.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {visibleMixPresets.map(preset => (
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
                              <div className="mt-4 grid grid-cols-1 gap-2">
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
                        </>)}
                      </div>

                      <section className="order-2 space-y-3">
                          {currentAgendaData&&(
                            <div className={`rounded-2xl border-2 border-yellow-500 overflow-hidden ${dm?'bg-gray-900':'bg-white'}`}>
                              <div className={`p-4 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>{dailyScheduleActive?'Agenda do dia':'Agenda da semana'}</p>
                                      {(dailyScheduleActive?currentAgendaData.dateKey===scheduleCurrentDay?.dateKey:currentAgendaData.week===scheduleCurrentWeek)&&<span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-600">Atual</span>}
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-yellow-600">{dailyScheduleActive
                                      ? currentAgendaData.date.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
                                      : `Semana ${currentAgendaData.week}`}</h3>
                                    <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>
                                      {[dailyScheduleActive?`Semana ${currentAgendaData.week}`:weekDateLabel(currentAgendaData), currentAgendaData.subjects.join(' · ')].filter(Boolean).join(' · ') || `Sem aulas ${dailyScheduleActive?'neste dia':'nesta semana'}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <div className="text-left sm:text-right">
                                      <p className={`text-2xl font-serif font-bold ${currentAgendaData.pct===100?'text-green-500':'text-yellow-600'}`}>{currentAgendaData.pct}%</p>
                                      <p className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{currentAgendaData.watched}/{currentAgendaData.lessons.length} · {formatCourseDuration(currentAgendaData.effortSeconds) || 'sem carga'}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={()=>selectRelativePeriod(-1)} disabled={selectedTimelineIndex<=0} aria-label={dailyScheduleActive?'Dia anterior':'Semana anterior'} className={`h-10 w-10 rounded-lg border text-lg font-bold disabled:opacity-25 ${dm?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50'}`}>←</button>
                                      <button onClick={selectCurrentPeriod} className={`h-10 rounded-lg border px-3 text-xs font-bold ${dm?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50'}`}>Hoje</button>
                                      <button onClick={()=>selectRelativePeriod(1)} disabled={selectedTimelineIndex>=timelineEntries.length-1} aria-label={dailyScheduleActive?'Próximo dia':'Próxima semana'} className={`h-10 w-10 rounded-lg border text-lg font-bold disabled:opacity-25 ${dm?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50'}`}>→</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {currentAgendaData.lessons.map((lesson, index) => {
                                  const watched = lessonWatched(lesson);
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
                                          <p className="text-sm font-bold leading-snug line-clamp-2">{lesson.title}</p>
                                          <p className={`text-[11px] mt-1 ${dm?'text-gray-500':'text-gray-500'}`}>{capitalizeDisplayLabel(lesson.subject)} · {shortTopicName(lesson.topic)}{lesson.duration?` · ${lesson.duration}`:''}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {!currentAgendaData.lessons.length&&(
                                  <div className={`sm:col-span-2 rounded-xl border border-dashed p-5 text-center text-sm ${dm?'border-gray-700 text-gray-500':'border-gray-300 text-gray-500'}`}>Nenhuma aula foi distribuída {dailyScheduleActive?'neste dia':'nesta semana'}. Reduza a duração total do plano para evitar períodos vazios.</div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Visão geral {dailyScheduleActive?'dos dias':'das semanas'}</p>
                              <p className={`text-[11px] ${dm?'text-gray-500':'text-gray-500'}`}>Arraste para navegar</p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                            {timelineEntries.map(entry => {
                              const isSelected = dailyScheduleActive
                                ? entry.dateKey === selectedDayData?.dateKey
                                : entry.week === selectedWeek;
                              const isCurrent = dailyScheduleActive
                                ? entry.dateKey === scheduleCurrentDay?.dateKey
                                : entry.week === scheduleCurrentWeek;
                              return (
                                <button key={dailyScheduleActive?entry.dateKey:entry.week} onClick={()=>selectTimelineEntry(entry)}
                                  className={`min-w-[138px] max-w-[138px] snap-start rounded-xl border p-3 text-left transition-all ${isSelected?(dm?'border-yellow-600 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-800 bg-gray-900 hover:border-gray-700':'border-gray-200 bg-white hover:border-yellow-300')}`}>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${entry.pct===100?'bg-green-500 text-white':isCurrent?(dm?'bg-yellow-900/60 text-yellow-400 ring-1 ring-yellow-500':'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400'):(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                                      {entry.pct===100?<CheckIcon className="w-3.5 h-3.5"/>:dailyScheduleActive?entry.date.getDate():entry.week}
                                    </div>
                                    <span className={`text-[10px] font-bold ${entry.pct===100?'text-green-500':dm?'text-gray-500':'text-gray-400'}`}>{entry.pct}%</span>
                                  </div>
                                  <p className={`text-xs font-bold truncate ${dm?'text-gray-300':'text-gray-700'}`}>{dailyScheduleActive
                                    ? entry.date.toLocaleDateString('pt-BR', { weekday:'short' }).replace('.', '')
                                    : entry.subjects.join(' + ') || 'Semana vazia'}</p>
                                  <p className={`mt-1 text-[10px] ${dm?'text-gray-600':'text-gray-400'}`}>{entry.lessons.length} aula{entry.lessons.length!==1?'s':''} · {formatCourseDuration(entry.effortSeconds) || '—'}</p>
                                  <p className={`mt-0.5 truncate text-[10px] ${dm?'text-gray-600':'text-gray-400'}`}>{dailyScheduleActive
                                    ? `${formatPlanDate(entry.date)} · sem. ${entry.week}`
                                    : weekDateLabel(entry)}</p>
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
