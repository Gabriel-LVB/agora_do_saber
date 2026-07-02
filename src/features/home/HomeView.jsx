import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { useCourseHeroJourney } from '../course/useCourseHeroJourney.js';

export default function HomeView() {
  const {
    AcademiaIcon,
    adminHomeMode,
    appliedVideoaulasData,
    aulaDocId,
    aulaHasVqData,
    aulaVqKey,
    Award,
    BookOpen,
    capitalizeDisplayLabel,
    ChevronRight,
    courseLessonDisplayTitle,
    coursePrefsLoaded,
    coursePlanSubjects,
    dailyStats,
    darkMode,
    DEFAULT_HOME_MOTTO,
    dueCount,
    effectiveCoursePlanLessonOrder,
    Flame,
    flattenCourseLessons,
    FolderIcon,
    getAulaId,
    getDailyLessonSeconds,
    GraduationCap,
    homeCanSeeSharedLibrary,
    homeCanSeeVideoaulas,
    homeCanUseAcademia,
    homeCanUseAdvancedFeatures,
    isAdmin,
    Landmark,
    looksLikeClinicalVignette,
    normalizeTextKey,
    openSpacedReview,
    openViewWithReturn,
    RepeatIcon,
    saveSettings,
    setActiveAulaAndReset,
    setActiveFolderId,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setExamSetup,
    setLibFilter,
    setSharedLibraryActiveItemId,
    setCursoTab,
    settings,
    settingsRef,
    setView,
    setVqActiveBlock,
    setVqActiveBlockView,
    setVqAula,
    setVqGenModal,
    setVqQuestionParity,
    setVqSubject,
    setVqTopic,
    siteConfig,
    sortCourseSubjectsForDisplay,
    vqBlocks,
    vqBlocksLoaded,
    watchedAulas,
    Zap,
  } = useFeatureContext();

			    const sharedLibraryCard = homeCanSeeSharedLibrary ? {key:'shared-library', icon:<BookOpen className="w-5 h-5"/>, title:'Biblioteca', desc:'Aulas, questões de fixação e casos clínicos prontos para estudar.', action:()=>{setSharedLibraryActiveItemId(null);setView('shared-library');}} : null;
			    const academiaCard = homeCanUseAcademia ? {key:'academia', icon:<AcademiaIcon className="w-5 h-5"/>, title:'Academia do Saber', desc:'Aprenda um assunto com aula personalizada e questões de fixação.', action:()=>{setLibFilter('academia');setActiveFolderId(null);setView('sub-library');}} : null;
			    const cursoCard = homeCanSeeVideoaulas ? {key:'curso', icon:<GraduationCap className="w-5 h-5"/>, title:'Portal do Curso', desc:'Videoaulas, questões, cronograma e organização do curso.', action:()=>setView('curso')} : null;
			    const geminiCard = {key:'gemini', icon:<Landmark className="w-5 h-5"/>, title:'Oráculo', desc:'Ferramenta complementar para criar e revisar bancos de questões.', action:()=>{setLibFilter('gemini');setActiveFolderId(null);setView('sub-library');}};
			    const externalCard = {key:'external', icon:<FolderIcon className="w-5 h-5"/>, title:'Acervo Externo', desc:'Importações, provas e listas coladas.', action:()=>{setLibFilter('external');setActiveFolderId(null);setView('sub-library');}};
			    const studyCards = [sharedLibraryCard, academiaCard, cursoCard].filter(Boolean);
			    const archiveCards = [geminiCard, externalCard].filter(Boolean);
                const questionGoal = Math.max(1, parseInt(settings.dailyQuestionGoal, 10) || 120);
                const minuteGoal = Math.max(1, parseInt(settings.dailyLectureMinutesGoal, 10) || 90);
                const dailyQuestions = Object.keys(dailyStats.questionKeys || {}).length;
	                const dailyMinutes = Math.floor(getDailyLessonSeconds(dailyStats) / 60);
                  const { heroJourneyStep } = useCourseHeroJourney({ enabled:homeCanSeeVideoaulas });
                  const homeJourney = heroJourneyStep ? {
                    ...heroJourneyStep.step,
                    helper:heroJourneyStep.step.subdetail
                      ? `${capitalizeDisplayLabel(heroJourneyStep.item.subject)} · ${heroJourneyStep.step.subdetail}`
                      : `${capitalizeDisplayLabel(heroJourneyStep.item.subject)} · ${heroJourneyStep.step.label}`,
                  } : null;
                  const renderHomeCard = (card) => (
                    <button key={card.key} onClick={card.action} className="app-card group rounded-xl px-3.5 py-3 text-left flex items-center gap-3 transition-all">
                      <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-yellow-600 transition-transform group-hover:scale-105 ${darkMode?'bg-gray-800':'bg-yellow-50'}`}>{card.icon}</span>
                      <span className="min-w-0 flex-1">
                        <strong className={`block text-sm md:text-[15px] leading-tight ${darkMode?'text-gray-100':'text-gray-900'}`}>{card.title}</strong>
                        <span className={`mt-1 block text-[11px] leading-snug line-clamp-2 ${darkMode?'text-gray-400':'text-gray-600'}`}>{card.desc}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-25 flex-shrink-0 transition-transform group-hover:translate-x-0.5"/>
                    </button>
                  );
				            return (
				              <div className="desktop-content-limit space-y-6 md:space-y-8">
                        <section className="app-hero rounded-2xl px-4 py-4 md:px-6 md:py-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                            <div className="min-w-0">
                              <p className={`text-[8px] font-bold uppercase tracking-[0.16em] mb-1.5 ${darkMode?'text-gray-500':'text-gray-500'}`}>Feito por Gabriel Barbosa</p>
                              <h2 className="font-serif text-xl md:text-3xl font-bold leading-tight text-yellow-600">“{siteConfig.homeMotto || DEFAULT_HOME_MOTTO}”</h2>
                            </div>
                            {homeCanUseAdvancedFeatures&&(
                              <div className={`grid grid-cols-2 rounded-xl border overflow-hidden flex-shrink-0 ${darkMode?'border-gray-800 divide-x divide-gray-800':'border-gray-200 divide-x divide-gray-200'}`}>
                                <div className="px-4 py-2.5 min-w-[104px]">
                                  <span className="block text-[8px] font-bold uppercase tracking-wide opacity-50">Questões</span>
                                  <strong className="block text-sm mt-0.5 tabular-nums">{dailyQuestions}<span className="font-normal opacity-40">/{questionGoal}</span></strong>
                                  <div className={`h-1 mt-1.5 rounded-full overflow-hidden ${darkMode?'bg-gray-800':'bg-gray-200'}`}><div className="h-full bg-yellow-500" style={{width:`${Math.min(100,dailyQuestions/questionGoal*100)}%`}}/></div>
                                </div>
                                <div className="px-4 py-2.5 min-w-[104px]">
                                  <span className="block text-[8px] font-bold uppercase tracking-wide opacity-50">Aulas</span>
                                  <strong className="block text-sm mt-0.5 tabular-nums">{dailyMinutes}<span className="font-normal opacity-40">/{minuteGoal}min</span></strong>
                                  <div className={`h-1 mt-1.5 rounded-full overflow-hidden ${darkMode?'bg-gray-800':'bg-gray-200'}`}><div className="h-full bg-yellow-500" style={{width:`${Math.min(100,dailyMinutes/minuteGoal*100)}%`}}/></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>

                        {homeJourney&&(
                          <section className={`app-card rounded-xl px-3.5 py-3 flex items-center gap-3`}>
                            <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-yellow-600 ${darkMode?'bg-gray-800':'bg-yellow-50'}`}>
                              <Award className="w-5 h-5"/>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${darkMode?'text-gray-500':'text-gray-400'}`}>Ciclo de Estudos</p>
                              <h3 className={`mt-0.5 text-sm md:text-[15px] font-bold truncate ${darkMode?'text-gray-100':'text-gray-900'}`}>{courseLessonDisplayTitle(homeJourney.lesson?.aula || { title:homeJourney.lesson?.title || homeJourney.label })}</h3>
                              <p className={`mt-0.5 text-xs truncate ${darkMode?'text-gray-400':'text-gray-600'}`}>{homeJourney.helper || 'Próximo passo'} · {homeJourney.label}</p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <button onClick={()=>{setCursoTab('plano');setView('curso');}} className={`hidden sm:inline-flex min-h-[38px] items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                Ajustar
                              </button>
                              <button onClick={homeJourney.action} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-yellow-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-yellow-700">
                                Continuar<ChevronRight className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </section>
                        )}

                        <section className="space-y-3">
                          <h3 className={`text-[11px] font-bold uppercase tracking-[0.18em] px-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>Ações rápidas</h3>
                          <div className={`grid grid-cols-1 ${homeCanUseAdvancedFeatures?'md:grid-cols-3':'md:grid-cols-1'} gap-3`}>
                            {homeCanUseAdvancedFeatures&&(
                              <button onClick={()=>openViewWithReturn('quick')} className="app-card rounded-xl p-4 text-left flex items-start gap-3">
                                <Flame className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0"/>
                                <span><strong className="block text-base">Centelha</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Tire uma dúvida pontual e pratique o essencial em poucos minutos.</span></span>
                              </button>
                            )}
                            {homeCanUseAdvancedFeatures&&(
                              <button onClick={()=>openSpacedReview()} className="app-card rounded-xl p-4 text-left flex items-start gap-3">
                                <RepeatIcon className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0"/>
                                <span><strong className="block text-base">Revisão espaçada {dueCount>0&&`· ${dueCount}`}</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Revise conteúdos no momento certo para não esquecer.</span></span>
                              </button>
                            )}
                            <button onClick={()=>setExamSetup({})} className="app-card rounded-xl p-4 text-left flex items-start gap-3">
                              <Zap className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0"/>
                              <span><strong className="block text-base">Modo prova</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Monte um simulado e veja o resultado somente ao terminar.</span></span>
                            </button>
                          </div>
                        </section>

                        {isAdmin&&adminHomeMode!=='admin'&&(
                          <div className={`rounded-xl border px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${darkMode?'bg-gray-900 border-gray-800 text-gray-400':'bg-white border-gray-200 text-gray-600'}`}>
                            <span>Prévia ativa: {adminHomeMode==='course'?'aluno com curso':'aluno sem curso'}</span>
                            <button onClick={()=>saveSettings({...settingsRef.current, adminHomeMode:'admin'})} className="text-xs font-bold text-yellow-600 hover:underline self-start sm:self-auto">Voltar para admin</button>
                          </div>
                        )}

                        <section className="space-y-4">
                          <div className="px-1">
                            <h3 className={`text-[11px] font-bold uppercase tracking-[0.18em] ${darkMode?'text-gray-500':'text-gray-500'}`}>Áreas de estudo</h3>
                            <p className="hidden md:block text-xs opacity-50 mt-1">Todo o seu conteúdo organizado em um único lugar.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {[...studyCards, ...archiveCards].map(renderHomeCard)}
                          </div>
                        </section>
	              </div>
	            );
}
