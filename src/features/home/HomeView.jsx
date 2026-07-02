import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

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
                  const buildHomeJourneyState = () => {
                    if (!isAdmin || !homeCanSeeVideoaulas || !appliedVideoaulasData) return null;
                    const lessons = flattenCourseLessons(appliedVideoaulasData || {});
                    if (!lessons.length) return null;
                    const subjects = sortCourseSubjectsForDisplay([...new Set(lessons.map(lesson => lesson.subject))]);
                    const subjectByKey = new Map(subjects.map(subject => [normalizeTextKey(subject), subject]));
                    const savedSubjects = coursePlanSubjects.map(subject => subjectByKey.get(normalizeTextKey(subject))).filter(Boolean);
                    const orderedSubjects = [...savedSubjects, ...subjects.filter(subject => !savedSubjects.includes(subject))];
                    const lessonOrderIndex = new Map((effectiveCoursePlanLessonOrder || []).map((id, index) => [String(id), index]));
                    const lessonWatched = (lesson) => [
                      lesson.id,
                      lesson.docId,
                      getAulaId(lesson.aula),
                      aulaDocId(lesson.aula),
                      aulaVqKey(lesson.aula),
                    ].filter(Boolean).some(id => !!watchedAulas[id]);
                    const blockEntriesForLesson = (lesson) => {
                      const data = vqBlocks[aulaDocId(lesson.aula)] || vqBlocks[aulaVqKey(lesson.aula)];
                      const rawBlocks = data?.blocks || {};
                      const entries = Array.isArray(rawBlocks)
                        ? rawBlocks.map((block, index) => [`block${index + 1}`, block])
                        : Object.entries(rawBlocks);
                      return entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                    };
                    const isClinical = (question = {}) => question.libraryQuestionKind === 'clinical' || looksLikeClinicalVignette(question);
                    const stageMeta = (stage) => {
                      if (stage === 'direct-odd') return { type:'direct', parity:'odd' };
                      if (stage === 'direct-even') return { type:'direct', parity:'even' };
                      if (stage === 'clinical-odd') return { type:'clinical', parity:'odd' };
                      if (stage === 'clinical-even') return { type:'clinical', parity:'even' };
                      return null;
                    };
                    const statKey = (type, parity, suffix) => `${type}${parity === 'odd' ? 'Odd' : 'Even'}${suffix}`;
                    const journeyInfo = (lesson) => {
                      const stats = {
                        total:0, answered:0, directTotal:0, clinicalTotal:0,
                        directOddTotal:0, directOddAnswered:0, directEvenTotal:0, directEvenAnswered:0,
                        clinicalOddTotal:0, clinicalOddAnswered:0, clinicalEvenTotal:0, clinicalEvenAnswered:0,
                      };
                      let directIndex = 0;
                      let clinicalIndex = 0;
                      blockEntriesForLesson(lesson).forEach(([, block]) => {
                        const questions = Array.isArray(block.questions) ? block.questions : [];
                        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                        questions.forEach(question => {
                          const type = isClinical(question) ? 'clinical' : 'direct';
                          const index = type === 'clinical' ? ++clinicalIndex : ++directIndex;
                          const parity = index % 2 === 1 ? 'odd' : 'even';
                          const answered = Object.prototype.hasOwnProperty.call(answers, question.id);
                          stats.total += 1;
                          stats[`${type}Total`] += 1;
                          stats[statKey(type, parity, 'Total')] += 1;
                          if (answered) {
                            stats.answered += 1;
                            stats[statKey(type, parity, 'Answered')] += 1;
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
                    const planRank = (lesson) => {
                      if (Number.isFinite(Number(lesson.aula?.display_plan_order))) return Number(lesson.aula.display_plan_order);
                      const ids = [lesson.docId, lesson.id, aulaDocId(lesson.aula), aulaVqKey(lesson.aula)].filter(Boolean).map(String);
                      const hit = ids.map(id => lessonOrderIndex.get(id)).find(index => Number.isFinite(index));
                      return Number.isFinite(hit) ? hit : Number.MAX_SAFE_INTEGER;
                    };
                    const lessonsBySubject = (subject) => lessons
                      .filter(lesson => lesson.subject === subject)
                      .sort((a, b) => {
                        const byPlan = planRank(a) - planRank(b);
                        if (byPlan) return byPlan;
                        return a.title.localeCompare(b.title, 'pt');
                      });
                    const subjectSummaries = orderedSubjects.map(subject => {
                      const subjectLessons = lessonsBySubject(subject);
                      return {
                        subject,
                        lessons:subjectLessons,
                        total:subjectLessons.length,
                        watched:subjectLessons.filter(lessonWatched).length,
                        completed:subjectLessons.filter(lesson => journeyInfo(lesson).journeyDone).length,
                        primaryCompleted:subjectLessons.filter(lesson => journeyInfo(lesson).primaryDone).length,
                      };
                    });
                    const firstUnfinishedSubject = subjectSummaries.findIndex(item => item.total && item.primaryCompleted < item.total);
                    const activeLimit = firstUnfinishedSubject >= 0 ? Math.min(subjectSummaries.length, firstUnfinishedSubject + 4) : Infinity;
                    const activeSubjects = subjectSummaries.filter((_, index) => index < activeLimit);
                    const firstBlockForStage = (lesson, stage) => {
                      const meta = stageMeta(stage);
                      const entries = blockEntriesForLesson(lesson);
                      if (!entries.length) return null;
                      if (!meta) return entries.find(([, block]) => (Array.isArray(block.questions) ? block.questions : []).length > 0) || null;
                      let directIndex = 0;
                      let clinicalIndex = 0;
                      let firstStageEntry = null;
                      for (const entry of entries) {
                        const [, block] = entry;
                        const questions = Array.isArray(block.questions) ? block.questions : [];
                        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
                        let hasStage = false;
                        let hasPending = false;
                        questions.forEach(question => {
                          const type = isClinical(question) ? 'clinical' : 'direct';
                          const index = type === 'clinical' ? ++clinicalIndex : ++directIndex;
                          const parity = index % 2 === 1 ? 'odd' : 'even';
                          if (type === meta.type && parity === meta.parity) {
                            hasStage = true;
                            if (!Object.prototype.hasOwnProperty.call(answers, question.id)) hasPending = true;
                          }
                        });
                        if (hasStage && !firstStageEntry) firstStageEntry = entry;
                        if (hasPending) return entry;
                      }
                      return firstStageEntry;
                    };
                    const openLesson = (lesson) => {
                      setActiveSubjectVid(lesson.subject);
                      setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
                      setActiveAulaAndReset(lesson.aula);
                      setView('videoaulas');
                    };
                    const openQuestions = (lesson, stage = 'direct-odd') => {
                      setVqSubject(lesson.subject);
                      setVqTopic(lesson.topic);
                      setVqAula(lesson.aula);
                      setVqActiveBlock(null);
                      setVqQuestionParity('all');
                      const targetBlock = firstBlockForStage(lesson, stage);
                      setVqActiveBlockView(targetBlock ? { blockId:targetBlock[0], showWrong:false, fromPlan:true, cycleStage:stage } : null);
                      if (aulaHasVqData(lesson.aula)) setView('videoquestions');
                      else setVqGenModal({ aula:lesson.aula, aulaId:aulaDocId(lesson.aula), suggestedQ:15, subject:lesson.subject, topic:lesson.topic, fromConfig:true });
                    };
                    const stepForLesson = (lesson) => {
                      const ji = journeyInfo(lesson);
                      if (!lessonWatched(lesson)) return { lesson, label:'Assistir aula', tone:'yellow', action:()=>openLesson(lesson) };
                      if (ji.directTotal === 0) return { lesson, label:'Gerar questões', tone:'blue', action:()=>openQuestions(lesson, 'direct-odd') };
                      if (!ji.directOddDone) return { lesson, label:'Fazer ímpares', tone:'green', action:()=>openQuestions(lesson, 'direct-odd') };
                      return { lesson, label:'Próxima aula', tone:'yellow', action:()=>openQuestions(lesson, 'direct-even') };
                    };
                    const nextStepForSubject = (item) => {
                      const completedCutoff = item.lessons.findIndex(lesson => !journeyInfo(lesson).primaryDone);
                      const completedCount = completedCutoff === -1 ? item.lessons.length : completedCutoff;
                      const allPrimaryComplete = completedCount === item.lessons.length;
                      for (let idx = 0; idx < completedCount; idx += 1) {
                        const lesson = item.lessons[idx];
                        const ji = journeyInfo(lesson);
                        const completedAfter = completedCount - idx - 1;
                        if (ji.directEvenTotal > 0 && !ji.directEvenDone && completedAfter >= 3) {
                          return { item, lesson, label:'Fazer pares', tone:'red', helper:`${capitalizeDisplayLabel(item.subject)} · após ${completedAfter} aulas`, action:()=>openQuestions(lesson, 'direct-even') };
                        }
                        if (ji.directEvenDone && (completedAfter >= 10 || allPrimaryComplete)) {
                          if (ji.clinicalOddTotal > 0 && !ji.clinicalOddDone) return { item, lesson, label:'Clínicas ímpares', tone:'red', helper:`${capitalizeDisplayLabel(item.subject)} · teste de verdade`, action:()=>openQuestions(lesson, 'clinical-odd') };
                          if (ji.clinicalEvenTotal > 0 && !ji.clinicalEvenDone) return { item, lesson, label:'Clínicas pares', tone:'red', helper:`${capitalizeDisplayLabel(item.subject)} · segunda metade`, action:()=>openQuestions(lesson, 'clinical-even') };
                        }
                      }
                      const lesson = item.lessons.find(aula => {
                        const ji = journeyInfo(aula);
                        return !lessonWatched(aula) || ji.directTotal === 0 || !ji.directOddDone;
                      });
                      if (!lesson) return { item, done:true, label:'Matéria em dia', tone:'gray' };
                      const step = stepForLesson(lesson);
                      return { ...step, item, helper:`${capitalizeDisplayLabel(item.subject)} · aula ${item.lessons.findIndex(aula => aula.id === lesson.id) + 1}/${item.total}` };
                    };
                    const steps = activeSubjects.map((item, index) => ({ item, index, step:nextStepForSubject(item) })).filter(entry => entry.step && !entry.step.done);
                    const urgent = steps.find(entry => entry.step.tone === 'red');
                    const stepRank = (step = {}) => {
                      if (step.tone === 'red') return 0;
                      if (['Fazer ímpares', 'Gerar questões'].includes(step.label)) return 1;
                      if (step.label === 'Assistir aula') return 2;
                      return 3;
                    };
                    const balanced = steps.filter(entry => entry.step.tone !== 'red').sort((a, b) => {
                      const byStep = stepRank(a.step) - stepRank(b.step);
                      if (byStep) return byStep;
                      const byPrimary = (a.item.primaryCompleted || 0) - (b.item.primaryCompleted || 0);
                      if (byPrimary) return byPrimary;
                      const byWatched = (a.item.watched || 0) - (b.item.watched || 0);
                      if (byWatched) return byWatched;
                      return a.index - b.index;
                    })[0];
                    const selected = urgent || balanced || steps[0] || null;
                    const total = subjectSummaries.reduce((sum, item) => sum + item.total, 0);
                    const completed = subjectSummaries.reduce((sum, item) => sum + item.completed, 0);
                    const primary = subjectSummaries.reduce((sum, item) => sum + item.primaryCompleted, 0);
                    const watched = subjectSummaries.reduce((sum, item) => sum + item.watched, 0);
                    return selected ? { ...selected.step, progress:{ total, completed, primary, watched, pct:total ? Math.round(completed / total * 100) : 0 }, activeCount:activeSubjects.length } : null;
                  };
                  const homeJourney = buildHomeJourneyState();
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
                              <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${darkMode?'text-gray-500':'text-gray-400'}`}>Jornada do Herói</p>
                              <h3 className={`mt-0.5 text-sm md:text-[15px] font-bold truncate ${darkMode?'text-gray-100':'text-gray-900'}`}>{courseLessonDisplayTitle(homeJourney.lesson?.aula || { title:homeJourney.lesson?.title || homeJourney.label })}</h3>
                              <p className={`mt-0.5 text-xs truncate ${darkMode?'text-gray-400':'text-gray-600'}`}>{homeJourney.helper || 'Próximo passo'} · {homeJourney.label}</p>
                            </div>
                            <button onClick={homeJourney.action} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-yellow-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-yellow-700">
                              Continuar<ChevronRight className="w-3.5 h-3.5"/>
                            </button>
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
