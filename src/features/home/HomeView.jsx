import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { useCourseHeroJourney } from '../course/useCourseHeroJourney.js';
import BrandIdentity from '../../components/BrandIdentity.jsx';

export default function HomeView() {
  const {
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
    FamedIcon,
    Flame,
    flattenCourseLessons,
    getAulaId,
    getDailyLessonSeconds,
    GraduationCap,
    homeCanSeeFamed,
    homeCanSeeSharedLibrary,
    homeCanSeeVideoaulas,
    homeCanUseAcademia,
    homeCanUseAdvancedFeatures,
    isAdmin,
    FolderIcon,
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
    settings,
    sortCourseSubjectsForDisplay,
    vqBlocks,
    vqBlocksLoaded,
    watchedAulas,
    Zap,
  } = useFeatureContext();

			    const sharedLibraryCard = homeCanSeeSharedLibrary ? {key:'shared-library', icon:<BookOpen className="w-5 h-5"/>, title:'Biblioteca', desc:'Questões do curso organizadas por aula e prontas para praticar.', action:()=>{setSharedLibraryActiveItemId(null);setView('shared-library');}} : null;
			    const famedCard = homeCanSeeFamed ? {key:'famed', icon:<FamedIcon className="w-5 h-5"/>, title:'FAMED', desc:'Aulas e questões da faculdade', action:()=>setView('famed')} : null;
			    const creationCard = {key:'creation', icon:<FolderIcon className="w-5 h-5"/>, title:'Meus materiais', desc:'Acesse, crie ou importe suas aulas e bancos de questões.', action:()=>{setLibFilter(homeCanUseAcademia?'academia':'gemini');setActiveFolderId(null);setView('sub-library');}};
			    const cursoCard = homeCanSeeVideoaulas ? {key:'curso', icon:<GraduationCap className="w-5 h-5"/>, title:'Portal do Curso', desc:'Videoaulas, questões, cronograma e organização do curso.', action:()=>setView('curso')} : null;
			    const studyCards = [famedCard, sharedLibraryCard, creationCard, cursoCard].filter(Boolean);
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
                    <button key={card.key} onClick={card.action} className="app-card home-study-card group rounded-xl px-4 py-4 text-left flex items-start gap-3.5 transition-all">
                      <span className="home-study-card__icon mt-0.5 flex-shrink-0 text-yellow-600 transition-transform group-hover:scale-105">{card.icon}</span>
                      <span className="min-w-0 flex-1">
                        <strong className={`block text-sm md:text-[15px] leading-tight ${darkMode?'text-gray-100':'text-gray-900'}`}>{card.title}</strong>
                        <span className={`mt-1 block text-[11px] leading-snug line-clamp-2 ${darkMode?'text-gray-400':'text-gray-600'}`}>{card.desc}</span>
                      </span>
                      <ChevronRight className="mt-1.5 w-4 h-4 opacity-25 flex-shrink-0 transition-transform group-hover:translate-x-0.5"/>
                    </button>
                  );
				            return (
				              <div className="desktop-content-limit space-y-7 md:space-y-9">
                        <section className="app-hero home-brand-hero rounded-2xl px-5 pt-7 pb-5 md:px-8 md:pt-9 md:pb-7">
                          <div className="home-brand-hero__ornament" aria-hidden="true"/>
                          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
                            <div className="min-w-0 flex-1">
                              <BrandIdentity variant="hero"/>
                              <div className="home-hero-motto mt-3 md:mt-4">
                                <h2 className="font-serif text-lg md:text-2xl font-semibold leading-snug">“{siteConfig.homeMotto || DEFAULT_HOME_MOTTO}”</h2>
                                <p className="home-author mt-1">— Pórtico da academia do Gabigol</p>
                              </div>
                            </div>
                            {homeCanUseAdvancedFeatures&&(
                              <aside className="home-progress-card w-full rounded-2xl p-4 md:w-64 md:flex-shrink-0" aria-label="Progresso de hoje">
                                <p className="home-progress-card__title">Hoje</p>
                                <div className="home-progress-card__metric">
                                  <div className="flex items-baseline justify-between gap-3"><span>Questões</span><strong>{dailyQuestions}<small>/{questionGoal}</small></strong></div>
                                  <div className="home-progress-card__track"><i style={{width:`${Math.min(100,dailyQuestions/questionGoal*100)}%`}}/></div>
                                </div>
                                <div className="home-progress-card__metric">
                                  <div className="flex items-baseline justify-between gap-3"><span>Aulas</span><strong>{dailyMinutes}<small>/{minuteGoal} min</small></strong></div>
                                  <div className="home-progress-card__track"><i style={{width:`${Math.min(100,dailyMinutes/minuteGoal*100)}%`}}/></div>
                                </div>
                              </aside>
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
                          <h3 className={`home-section-heading text-[11px] font-bold uppercase tracking-[0.18em] px-1 ${darkMode?'text-gray-500':'text-gray-500'}`}><span>Ações rápidas</span></h3>
                          <div className={`grid grid-cols-1 ${homeCanUseAdvancedFeatures?'md:grid-cols-3':'md:grid-cols-1'} gap-3`}>
                            {homeCanUseAdvancedFeatures&&(
                              <button onClick={()=>openViewWithReturn('quick')} className="app-card home-action-card rounded-xl p-4 text-left flex items-start gap-3">
                                <Flame className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0"/>
                                <span><strong className="block text-base">Dúvida Rápida</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Tire uma dúvida pontual e escolha como quer estudá-la.</span></span>
                              </button>
                            )}
                            {homeCanUseAdvancedFeatures&&(
                              <button onClick={()=>openSpacedReview()} className="app-card home-action-card rounded-xl p-4 text-left flex items-start gap-3">
                                <RepeatIcon className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0"/>
                                <span><strong className="block text-base">Revisão espaçada {dueCount>0&&`· ${dueCount}`}</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Revise conteúdos no momento certo para não esquecer.</span></span>
                              </button>
                            )}
                            <button onClick={()=>setExamSetup({})} className="app-card home-action-card rounded-xl p-4 text-left flex items-start gap-3">
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
                            <h3 className={`home-section-heading text-[11px] font-bold uppercase tracking-[0.18em] ${darkMode?'text-gray-500':'text-gray-500'}`}><span>Áreas de estudo</span></h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {studyCards.map(renderHomeCard)}
                          </div>
                        </section>
	              </div>
	            );
}
