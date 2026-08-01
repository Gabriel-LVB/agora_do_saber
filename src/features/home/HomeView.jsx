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
    capitalizeDisplayLabel,
    ChevronRight,
    courseLessonDisplayTitle,
    coursePrefsLoaded,
    coursePlanSubjects,
    dailyStats,
    darkMode,
    dueCount,
    effectiveCoursePlanLessonOrder,
    FamedIcon,
    FactoryIcon,
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
    nextReviewAt,
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
    sortCourseSubjectsForDisplay,
    reviewScheduledCount,
    vqBlocks,
    vqBlocksLoaded,
    watchedAulas,
    Zap,
  } = useFeatureContext();

			    const sharedLibraryCard = homeCanSeeSharedLibrary ? {key:'shared-library', icon:<FactoryIcon className="w-5 h-5"/>, title:'Fábrica de Questões', desc:isAdmin?'Produção, curadoria, seleção e auditoria do banco de questões.':'Questões do curso organizadas por aula e prontas para praticar.', action:()=>{setSharedLibraryActiveItemId(null);setView('shared-library');}} : null;
			    const famedCard = homeCanSeeFamed ? {key:'famed', icon:<FamedIcon className="w-5 h-5"/>, title:'FAMED', desc:'Aulas e questões da faculdade', action:()=>setView('famed')} : null;
			    const creationCard = {key:'creation', icon:<FolderIcon className="w-5 h-5"/>, title:'Meus materiais', desc:'Acesse, crie ou importe suas aulas e bancos de questões.', action:()=>{setLibFilter(homeCanUseAcademia?'academia':'gemini');setActiveFolderId(null);setView('sub-library');}};
			    const cursoCard = homeCanSeeVideoaulas ? {key:'curso', icon:<GraduationCap className="w-5 h-5"/>, title:'Portal do Curso', desc:'Videoaulas, questões, cronograma e organização do curso.', action:()=>setView('curso')} : null;
			    const studyCards = [famedCard, sharedLibraryCard, creationCard, cursoCard].filter(Boolean);
                const questionGoal = Math.max(1, parseInt(settings.dailyQuestionGoal, 10) || 120);
                const minuteGoal = Math.max(1, parseInt(settings.dailyLectureMinutesGoal, 10) || 90);
                const dailyQuestions = Object.keys(dailyStats.questionKeys || {}).length;
	                const dailyMinutes = Math.floor(getDailyLessonSeconds(dailyStats) / 60);
                  const nextReviewLabel = nextReviewAt
                    ? new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short' }).format(new Date(nextReviewAt))
                    : null;
                  const { heroJourneyStep, progress:scheduleProgress, scheduleCurrentWeek } = useCourseHeroJourney({ enabled:homeCanSeeVideoaulas });
                  const homeJourney = heroJourneyStep ? {
                    ...heroJourneyStep.step,
                    helper:heroJourneyStep.step.subdetail
                      ? `${capitalizeDisplayLabel(heroJourneyStep.item.subject)} · ${heroJourneyStep.step.subdetail}`
                      : `${capitalizeDisplayLabel(heroJourneyStep.item.subject)} · ${heroJourneyStep.step.label}`,
                  } : null;
                  const renderHomeCard = (card) => (
                    <button key={card.key} onClick={card.action} className="home-study-card group rounded-xl px-4 py-4 text-left flex items-start gap-3.5 transition-colors">
                      <span className="home-icon home-study-card__icon mt-0.5">{card.icon}</span>
                      <span className="min-w-0 flex-1">
                        <strong className={`block text-sm md:text-[15px] leading-tight ${darkMode?'text-gray-100':'text-gray-900'}`}>{card.title}</strong>
                        <span className={`mt-1 block text-[11px] leading-snug line-clamp-2 ${darkMode?'text-gray-400':'text-gray-600'}`}>{card.desc}</span>
                      </span>
                      <ChevronRight className="mt-1.5 w-4 h-4 opacity-25 flex-shrink-0"/>
                    </button>
                  );
				            return (
				              <div className="desktop-content-limit space-y-8 md:space-y-10">
                        <header className="home-page-header">
                          <BrandIdentity variant="hero" showMark={false}/>
                          {homeCanUseAdvancedFeatures&&(
                            <div className={`home-progress-inline ${homeCanSeeVideoaulas?'has-lesson-stat':'questions-only'}`} aria-label="Progresso de hoje">
                              <p>Hoje</p>
                              <div className="home-progress-card__metric">
                                <div className="flex items-baseline justify-between gap-3"><span>Questões</span><strong>{dailyQuestions}<small>/{questionGoal}</small></strong></div>
                                <div className="home-progress-card__track"><i style={{width:`${Math.min(100,dailyQuestions/questionGoal*100)}%`}}/></div>
                              </div>
                              {homeCanSeeVideoaulas&&<div className="home-progress-card__metric">
                                <div className="flex items-baseline justify-between gap-3"><span>Aulas</span><strong>{dailyMinutes}<small>/{minuteGoal} min</small></strong></div>
                                <div className="home-progress-card__track"><i style={{width:`${Math.min(100,dailyMinutes/minuteGoal*100)}%`}}/></div>
                              </div>}
                            </div>
                          )}
                        </header>

                        {homeCanSeeVideoaulas&&dueCount>0&&(
                          <section className={`rounded-2xl border p-4 md:p-5 ${darkMode?'border-yellow-800/70 bg-yellow-950/20':'border-yellow-300 bg-yellow-50'}`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${darkMode?'bg-yellow-900/50 text-yellow-300':'bg-yellow-200 text-yellow-800'}`}><RepeatIcon className="h-5 w-5"/></span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-yellow-600">Prioridade de hoje</p>
                                <h2 className={`mt-0.5 font-serif text-xl font-bold ${darkMode?'text-gray-100':'text-gray-900'}`}>{dueCount} {dueCount===1?'questão pronta':'questões prontas'} para revisão</h2>
                                <p className={`mt-1 text-xs ${darkMode?'text-gray-400':'text-gray-600'}`}>Revise primeiro o que venceu; depois o fluxo aponta a próxima aula.</p>
                              </div>
                              <button onClick={()=>openSpacedReview()} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-yellow-700">Revisar agora<ChevronRight className="h-4 w-4"/></button>
                            </div>
                          </section>
                        )}

                        {homeJourney&&(
                          <section className="home-journey-row rounded-xl px-3.5 py-3 flex items-center gap-3">
                            <span className="home-icon mt-0.5">
                              <Award className="w-5 h-5"/>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${darkMode?'text-gray-500':'text-gray-400'}`}>Seu cronograma · semana {scheduleCurrentWeek}</p>
                              <h3 className={`mt-0.5 text-sm md:text-[15px] font-bold truncate ${darkMode?'text-gray-100':'text-gray-900'}`}>{courseLessonDisplayTitle(homeJourney.lesson?.aula || { title:homeJourney.lesson?.title || homeJourney.label })}</h3>
                              <p className={`mt-0.5 text-xs truncate ${darkMode?'text-gray-400':'text-gray-600'}`}>{homeJourney.helper || 'Próximo passo'} · {homeJourney.label}</p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <button onClick={()=>{setCursoTab('cronograma');setView('curso');}} className={`hidden sm:inline-flex min-h-[38px] items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                Ver plano · {scheduleProgress.pct}%
                              </button>
                              <button onClick={homeJourney.action} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-yellow-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-yellow-700">
                                Continuar<ChevronRight className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </section>
                        )}

                        <section className="space-y-3">
                          <h3 className="home-section-heading px-1"><span>Ações rápidas</span></h3>
                          <div className={`grid grid-cols-1 ${homeCanSeeVideoaulas?'md:grid-cols-3':homeCanUseAdvancedFeatures?'md:grid-cols-2':'md:grid-cols-1'} gap-3`}>
                            {homeCanUseAdvancedFeatures&&(
                              <button onClick={()=>openViewWithReturn('quick')} className="home-action-card rounded-xl p-4 text-left flex items-start gap-3 transition-colors">
                                <Flame className="home-icon mt-0.5"/>
                                <span><strong className="block text-base">Dúvida Rápida</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">Tire uma dúvida pontual e escolha como quer estudá-la.</span></span>
                              </button>
                            )}
                            {homeCanSeeVideoaulas&&(
                              <button onClick={()=>openSpacedReview()} className="home-action-card rounded-xl p-4 text-left flex items-start gap-3 transition-colors">
                                <RepeatIcon className="home-icon mt-0.5"/>
                                <span><strong className="block text-base">Revisões {dueCount>0&&`· ${dueCount}`}</strong><span className="block text-xs opacity-50 mt-1 leading-relaxed">{dueCount>0?'Há conteúdo esperando por você.':reviewScheduledCount>0?`${reviewScheduledCount} questões agendadas${nextReviewLabel?` · próxima em ${nextReviewLabel}`:''}.`:'Adicione uma aula concluída e o sistema monta sua agenda.'}</span></span>
                              </button>
                            )}
                            <button onClick={()=>setExamSetup({})} className="home-action-card rounded-xl p-4 text-left flex items-start gap-3 transition-colors">
                              <Zap className="home-icon mt-0.5"/>
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
                            <h3 className="home-section-heading"><span>Áreas de estudo</span></h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {studyCards.map(renderHomeCard)}
                          </div>
                        </section>
	              </div>
	            );
}
