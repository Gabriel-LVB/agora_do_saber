import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { useCourseHeroJourney } from './useCourseHeroJourney.js';

export default function VideoQuestionsView() {
  const {
    addToList,
    appliedVideoaulasData,
    ArrowLeft,
    aulaDocId,
    aulaHasVqData,
    aulaVqKey,
    blockActionMenu,
    blockValues,
    BookOpen,
    callWithRotation,
    canUseAdvancedFeatures,
    capitalizeDisplayLabel,
    CheckIcon,
    ChevronDown,
    ChevronRight,
    courseLessonDisplayTitle,
    darkMode,
    EmptyState,
    Eraser,
    exportFlashcardsToAnki,
    findErrorNotebookReviewsForSource,
    flattenCourseLessons,
    FolderIcon,
    generateVqBlock,
    getAulaId,
    getCourseVqQuestionPlan,
    getKey,
    GraduationCap,
    isAdmin,
    isAnswerCorrect,
    isFinalObjectiveAnswer,
    LayersIcon,
    looksLikeClinicalVignette,
    MoreIcon,
    openBizuario,
    openErrorNotebookReviewResult,
    openErrorReviewModal,
    parseVideoaulasData,
    PlayIcon,
    Printer,
    QuestionView,
    RepeatIcon,
    reviewQueue,
    RotateCcw,
    sameId,
    saveVqBlock,
    saveVqBlockPatch,
    saveSettings,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setBlockActionMenu,
    setCursoTab,
    setExportModal,
    setOpenAnswerModal,
    setSrModal,
    settings,
    settingsRef,
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
    Spinner,
    streamCount,
    toggleInList,
    trackQuestionAnswered,
    VideoIcon,
    vqActiveBlockView,
    vqAula,
    vqBlocks,
    vqBlocksRef,
    vqExpandedSubj,
    vqExpandedTopic,
    vqLoading,
    vqQuestionParity,
    vqSubject,
    vqTopic,
  } = useFeatureContext();

          const dm = darkMode;
          const courseCycle = useCourseHeroJourney({ enabled:true });
          const data     = parseVideoaulasData(appliedVideoaulasData || {});
          const subjects = sortCourseSubjectsForDisplay(Object.keys(data));

          // Count total questions for an aula
          const aulaQCount = (aula) => {
            const id = aulaVqKey(aula);
            const d = vqBlocks[id];
            if(!d?.blocks) return 0;
            return blockValues(d.blocks).reduce((acc,b)=>acc+(b.questions?.length||0),0);
          };

          // DETAIL VIEW: aula selecionada — mostra blocos
          if(vqAula && vqSubject && vqTopic) {
            const aulaId    = aulaVqKey(vqAula);
            const aulaIdNew = aulaDocId(vqAula);
            const aulaData  = vqBlocks[aulaIdNew] || vqBlocks[aulaId] || {};
            // blocks pode vir como array do Firestore em edge cases — normalizar para objeto
            const rawBlocks = aulaData.blocks || {};
            const blocks    = Array.isArray(rawBlocks) ? {} : rawBlocks;
            const meta      = aulaData.meta || {};
            const blockList = Object.entries(blocks).sort((a,b)=>a[0].localeCompare(b[0]));
	            const hasSetup  = aulaHasVqData(vqAula); // usa busca em todos os formatos de chave
	            const durationSecs = vqAula.duration_seconds || 0;
	            const suggestedQ   = getCourseVqQuestionPlan({ durationSecs, suggestedQ:10, isAdmin, maxPerBlock:20 }).totalQ;
	            const totalLessonQuestions = blockList.reduce((sum, [, block]) => sum + ((Array.isArray(block.questions) ? block.questions : []).length), 0);
	            const answeredLessonQuestions = blockList.reduce((sum, [, block]) => {
	              const ans = (block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers)) ? block.answers : {};
	              return sum + Object.keys(ans).length;
	            }, 0);
	            const allLessonQuestionsDone = totalLessonQuestions > 0 && answeredLessonQuestions >= totalLessonQuestions;
	            const courseLessonFlow = flattenCourseLessons(appliedVideoaulasData || {});
	            const currentCourseLessonIndex = courseLessonFlow.findIndex(lesson => getAulaId(lesson.aula) === getAulaId(vqAula));
	            const nextCourseLesson = currentCourseLessonIndex >= 0 ? courseLessonFlow[currentCourseLessonIndex + 1] : null;
	            const openCourseLessonFromVq = (lesson) => {
	              if (!lesson) return;
	              setView('videoaulas');
	              setActiveSubjectVid(lesson.subject);
	              setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
	              setActiveAulaAndReset(lesson.aula);
	            };
	            const openCurrentCourseAulaFromVq = () => {
	              setVqActiveBlockView(null);
	              setView('videoaulas');
	              setActiveSubjectVid(vqSubject);
	              setActiveSubtopicVid(`${vqTopic}::main`);
	              setActiveAulaAndReset(vqAula);
	            };
	            const backFromCourseQuestions = () => {
	              if (vqActiveBlockView?.fromPlan) {
	                setVqActiveBlockView(null);
	                setCursoTab('plano');
	                setView('curso');
	                return;
	              }
	              openCurrentCourseAulaFromVq();
	            };

            // ── VIEW COMPLETA DE UM BLOCO ── usa o mesmo QuestionView do topic
            if(vqActiveBlockView) {
              const { blockId, cycleStage } = vqActiveBlockView;
              const block = blocks[blockId] || {};
              const qs      = Array.isArray(block.questions) ? block.questions : [];
	              const journeyStage = (() => {
	                if (cycleStage === 'direct-odd') return { type:'direct', parity:'odd', label:'Fixação · Ímpares diretas' };
	                if (cycleStage === 'direct-even') return { type:'direct', parity:'even', label:'Fixação · Pares diretas' };
	                if (cycleStage === 'clinical-odd') return { type:'clinical', parity:'odd', label:'Clínicas · Ímpares' };
	                if (cycleStage === 'clinical-even') return { type:'clinical', parity:'even', label:'Clínicas · Pares' };
	                return null;
	              })();
	              const isClinicalVqQuestion = (question = {}) =>
	                question.libraryQuestionKind === 'clinical' || looksLikeClinicalVignette(question);
	              const blockQuestionOffset = blockList.slice(0, Math.max(0, blockList.findIndex(([id])=>id===blockId)))
	                .reduce((sum, [, item])=>sum + (Array.isArray(item.questions) ? item.questions.length : 0), 0);
	              const stageQuestionOffset = journeyStage
	                ? blockList.slice(0, Math.max(0, blockList.findIndex(([id])=>id===blockId))).reduce((sum, [, item]) => {
	                    const questions = Array.isArray(item.questions) ? item.questions : [];
	                    return sum + questions.filter(question => {
	                      const type = isClinicalVqQuestion(question) ? 'clinical' : 'direct';
	                      return type === journeyStage.type;
	                    }).length;
	                  }, 0)
	                : 0;
	              let stageQuestionNumber = stageQuestionOffset;
	              const parityQuestions = journeyStage
	                ? qs.filter(question => {
	                    const type = isClinicalVqQuestion(question) ? 'clinical' : 'direct';
	                    if (type !== journeyStage.type) return false;
	                    stageQuestionNumber += 1;
	                    return journeyStage.parity === 'odd' ? stageQuestionNumber % 2 === 1 : stageQuestionNumber % 2 === 0;
	                  })
	                : (vqQuestionParity === 'all' ? qs : qs.filter((question, index)=>{
	                    const lessonNumber = blockQuestionOffset + index + 1;
	                    return vqQuestionParity === 'odd' ? lessonNumber % 2 === 1 : lessonNumber % 2 === 0;
	                  }));
	              const ans     = (block.answers && typeof block.answers==='object' && !Array.isArray(block.answers)) ? block.answers : {};
	              const blockFavs = Array.isArray(block.favorites) ? block.favorites : [];
	              const blockNotebook = Array.isArray(block.errorNotebook) ? block.errorNotebook : [];
              const blockTitle = block.title||`Bloco ${blockId.replace('block','')}`;
              const currentBlockIndex = blockList.findIndex(([id]) => id === blockId);
              const nextBlockEntry = currentBlockIndex >= 0 ? blockList[currentBlockIndex + 1] : null;
              const nextBlockTitle = nextBlockEntry?.[1]?.title || (nextBlockEntry ? `Bloco ${nextBlockEntry[0].replace('block','')}` : '');
              const missedQuestions = parityQuestions.filter(q => ans[q.id] && !isAnswerCorrect(q, ans[q.id]));
              const clinicalReviewQuestions = parityQuestions.filter(question => isClinicalVqQuestion(question));
              const cycleBaseQuestions = cycleStage === 'r10'
                ? clinicalReviewQuestions
                : cycleStage === 'r3'
                  ? (missedQuestions.length ? missedQuestions : parityQuestions)
                  : parityQuestions;
              const visibleQuestions = cycleStage === 'r10'
                ? cycleBaseQuestions.map(q => {
                    const correct = (q.options || []).find(o => o.isCorrect)?.text || q.expectedAnswer || '';
                    return {
                      ...q,
                      id:`${q.id}__cycle_r10`,
                      statement:`Explique de forma objetiva: ${String(q.statement || '').replace(/\s+/g, ' ').trim()}`,
                      options:[],
                      expectedAnswer:[correct, q.explanation].filter(Boolean).join('. '),
                      explanation:q.explanation || correct,
                      isOpen:true,
                      isEssay:false,
                    };
                  })
                : cycleStage === 'r3'
                  ? cycleBaseQuestions.map(q => ({...q, id:`${q.id}__cycle_r3`}))
                  : parityQuestions;
              const visibleAnswers = Object.fromEntries(Object.entries(ans).filter(([id]) => visibleQuestions.some(q => sameId(q.id, id))));
              const visibleTitle = cycleStage === 'r10'
                ? `${blockTitle} · Revisão +10`
                : cycleStage === 'r3'
                  ? `${blockTitle} · Revisão +3`
                  : journeyStage
                    ? `${blockTitle} · ${journeyStage.label}`
                    : `${blockTitle}${vqQuestionParity==='odd'?' · Ímpares':vqQuestionParity==='even'?' · Pares':''}`;
              const blockErrorReviews = findErrorNotebookReviewsForSource({
                subjectTitle:vqAula.title,
                topicTitle:blockTitle,
                questionIds:visibleQuestions.map(q=>q.id),
              });
              const cycleContinueStep = cycleStage && courseCycle.isReady ? courseCycle.heroJourneyStep?.step : null;

  const handleVqAnswer = async (qId, letter) => {
    trackQuestionAnswered(`curso:${aulaIdNew}:${blockId}:${qId}`);
    const freshData = vqBlocksRef.current?.[aulaIdNew] || vqBlocksRef.current?.[aulaId] || aulaData;
    const freshBlocks = Array.isArray(freshData?.blocks) ? {} : (freshData?.blocks || {});
    const freshBlock = freshBlocks[blockId] || block;
    const freshAnswers = (freshBlock.answers && typeof freshBlock.answers === 'object' && !Array.isArray(freshBlock.answers)) ? freshBlock.answers : {};
    const q = (Array.isArray(freshBlock.questions) ? freshBlock.questions : qs).find(x => sameId(x.id, qId))
      || visibleQuestions.find(x => sameId(x.id, qId));
    if (isFinalObjectiveAnswer(q, freshAnswers[qId])) return;
	                await saveVqBlockPatch(
	                  aulaIdNew,
	                  blockId,
	                  currentBlock => {
	                    const answers = (currentBlock.answers && typeof currentBlock.answers === 'object' && !Array.isArray(currentBlock.answers)) ? currentBlock.answers : {};
	                    const notebook = Array.isArray(currentBlock.errorNotebook) ? currentBlock.errorNotebook : [];
	                    const errorNotebook = canUseAdvancedFeatures && !isAnswerCorrect(q, letter) ? addToList(notebook, qId) : notebook;
	                    return {...currentBlock, answers:{...answers, [qId]:letter}, errorNotebook};
	                  },
	                  nextBlock => ({ answers:{[qId]:letter}, errorNotebook:nextBlock.errorNotebook || [] })
	                );
	              };
	              const handleVqFavorite = async (qId) => {
	                await saveVqBlockPatch(
	                  aulaIdNew,
	                  blockId,
	                  currentBlock => ({...currentBlock, favorites:toggleInList(Array.isArray(currentBlock.favorites) ? currentBlock.favorites : [], qId)}),
	                  nextBlock => ({ favorites:nextBlock.favorites || [] })
	                );
	              };
	              const handleVqNotebook = async (qId) => {
	                if (!canUseAdvancedFeatures) return;
	                await saveVqBlockPatch(
	                  aulaIdNew,
	                  blockId,
	                  currentBlock => ({...currentBlock, errorNotebook:toggleInList(Array.isArray(currentBlock.errorNotebook) ? currentBlock.errorNotebook : [], qId)}),
	                  nextBlock => ({ errorNotebook:nextBlock.errorNotebook || [] })
	                );
              };
              const handleVqReset = async () => {
                if (cycleStage || vqQuestionParity !== 'all') {
                  const visibleIds = new Set(visibleQuestions.map(q => q.id));
                  const nextAnswers = Object.fromEntries(Object.entries(ans).filter(([id]) => !visibleIds.has(id)));
                  await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:nextAnswers}}});
                  return;
                }
                await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:{}}}});
              };

              return (
                <div className="w-full">
                  <QuestionView
                    title={visibleTitle}
                    onBack={backFromCourseQuestions}
                    backLabel={vqActiveBlockView?.fromPlan ? 'Voltar ao Ciclo' : 'Voltar à aula'}
                    questions={visibleQuestions}
                    answers={visibleAnswers}
	                    favorites={blockFavs}
	                    onAnswer={handleVqAnswer}
	                    onToggleFavorite={handleVqFavorite}
	                    errorNotebook={blockNotebook}
	                    showErrorNotebook={canUseAdvancedFeatures}
	                    onToggleErrorNotebook={handleVqNotebook}
                    onReset={visibleQuestions.length>0?handleVqReset:null}
                    onRegenerate={!meta.readOnly&&!cycleStage&&qs.length>0?()=>generateVqBlock(aulaIdNew,blockId):null}
                    onExport={visibleQuestions.length>0?()=>setExportModal({topic:{title:`${vqAula.title} — ${visibleTitle}`,questions:visibleQuestions},subject:null}):null}
                    isGenerating={!!block.generating}
                    streamCount={streamCount}
                    showBizuario={qs.length>0}
                    onBizuario={()=>{
                      openBizuario(
                        {id:`course-${aulaIdNew}-${blockId}`, title:visibleTitle, questions:visibleQuestions, subtopics:block.subtopics||[]},
                        {id:`course-${aulaIdNew}`, title:vqAula.title, sourceMaterials:''}
                      );
                    }}
                    darkMode={darkMode}
                    apiKey={getKey()}
	                    oracleLength={settings.oracleLength}
	                    onCall={callWithRotation}
	                    onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})}
		                    displayMode={canUseAdvancedFeatures ? (settings.questionDisplayMode || 'list') : 'list'}
		                    onDisplayModeChange={canUseAdvancedFeatures ? (mode=>saveSettings({...settingsRef.current, questionDisplayMode:mode})) : null}
		                    adminQuestionExplanations={isAdmin}
		                    onExportAnki={isAdmin ? (qs=>exportFlashcardsToAnki({
		                      questions:qs,
		                      title:visibleTitle,
		                      subjectTitle:vqAula.title,
		                      deckTitle:'Curso',
		                      source:'curso',
		                    })) : null}
		                    onAddToReview={(qs, ans)=>setSrModal({aulaId:aulaIdNew, blockId, blockTitle:visibleTitle, questions:qs, answers:ans, notebookIds:blockNotebook, meta:{source:'curso',aulaTitle:vqAula.title,blockTitle:visibleTitle}})}
                    onReviewErrorNotebook={blockNotebook.length ? (()=>openErrorReviewModal({
                      subject:{id:aulaIdNew, title:vqAula.title, source:'curso'},
                      topic:{id:blockId, title:blockTitle},
                      questions:visibleQuestions,
                      notebookIds:blockNotebook,
                      sourceLabel:'Curso',
                    })) : null}
                    onOpenErrorReviewResult={blockErrorReviews.length ? (()=>openErrorNotebookReviewResult(blockErrorReviews[0])) : null}
                    errorReviewResultCount={blockErrorReviews.length}
                    inReviewCount={Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length}
                    onGoToAula={openCurrentCourseAulaFromVq}
                    onNextUnit={cycleStage
                      ? (cycleContinueStep?.action || (()=>{setVqActiveBlockView(null); setCursoTab('plano'); setView('curso');}))
                      : (nextBlockEntry ? (()=>setVqActiveBlockView({blockId:nextBlockEntry[0],showWrong:false,fromPlan:vqActiveBlockView?.fromPlan||false})) : (nextCourseLesson ? (()=>openCourseLessonFromVq(nextCourseLesson)) : null))}
                    nextUnitLabel={cycleStage ? 'Continuar ciclo' : (nextBlockEntry ? 'Próximo tópico' : 'Próxima aula')}
                    nextUnitHelper={cycleStage ? (cycleContinueStep ? `${cycleContinueStep.label} · ${cycleContinueStep.detail}` : 'Continuar o roteiro guiado') : (nextBlockEntry ? nextBlockTitle : (nextCourseLesson?.aula ? courseLessonDisplayTitle(nextCourseLesson.aula) : 'Continuar sequência'))}
                    generateLabel="Gerar Questões"
                    onGenerate={meta.readOnly?null:()=>generateVqBlock(aulaIdNew,blockId)}
                    subtopics={block.subtopics||[]}
                  />
                </div>
              );
            }

            // ── LISTA DE BLOCOS DA AULA ──
            return (
              <div className="mx-auto max-w-5xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
                  <button onClick={()=>{setVqAula(null);setVqActiveBlockView(null);}}
                    className={`font-bold flex items-center gap-1 ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                    <ArrowLeft className="w-4 h-4"/>{capitalizeDisplayLabel(vqSubject)}
                  </button>
                  <span className="opacity-30">/</span>
                  <span className="opacity-50 text-xs truncate max-w-[140px]">{shortTopicName(vqTopic)}</span>
                  <span className="opacity-30">/</span>
                  <span className={`font-bold truncate max-w-[240px] ${dm?'text-yellow-400':'text-yellow-700'}`}>{courseLessonDisplayTitle(vqAula)}</span>
                </div>

	                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 pb-6 border-b ${dm?'border-gray-700':'border-gray-200'}`}>
	                  <div>
	                    <h2 className={`text-3xl font-serif font-bold ${dm?'text-gray-100':'text-gray-900'}`}>{courseLessonDisplayTitle(vqAula)}</h2>
	                    <div className="flex items-center gap-3 mt-1 flex-wrap">
	                      {vqAula.duration_formatted&&<p className="text-sm opacity-50">⏱ {vqAula.duration_formatted}</p>}
	                      {totalLessonQuestions>0&&<p className="text-sm opacity-50">{answeredLessonQuestions}/{totalLessonQuestions} respondidas</p>}
	                      {/* Progresso dos blocos */}
                      {blockList.length>0&&(()=>{
                        const done = blockList.filter(([,b])=>{
                          const qs = Array.isArray(b.questions)?b.questions:[];
                          const ans = (b.answers&&typeof b.answers==='object'&&!Array.isArray(b.answers))?b.answers:{};
                          return qs.length>0 && Object.keys(ans).length===qs.length;
                        }).length;
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done===blockList.length?(dm?'bg-green-900/40 text-green-400':'bg-green-100 text-green-700'):(dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600')}`}>
                            {done}/{blockList.length} blocos concluídos
                          </span>
                        );
                      })()}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {hasSetup&&!meta.readOnly&&(
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ,reset:true})}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <RotateCcw className="w-4 h-4"/>Regenerar
                      </button>
                    )}
                    {!hasSetup&&(
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm">
                        <Sparkles className="w-4 h-4"/>Gerar Questões
                      </button>
                    )}
                  </div>
                </div>

                {totalLessonQuestions>1&&(
                  <div className={`mb-6 rounded-2xl border p-2 ${dm?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        {id:'all',label:`Todas (${totalLessonQuestions})`},
                        {id:'odd',label:`Ímpares (${Math.ceil(totalLessonQuestions/2)})`},
                        {id:'even',label:`Pares (${Math.floor(totalLessonQuestions/2)})`},
                      ].map(option=><button key={option.id} onClick={()=>setVqQuestionParity(option.id)}
                        className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${vqQuestionParity===option.id?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-50')}`}>
                        {option.label}
                      </button>)}
                    </div>
                  </div>
                )}

                {/* Vazio */}
                {!hasSetup&&blockList.length===0&&(
                  <EmptyState
                    darkMode={dm}
                    icon={<GraduationCap className="w-7 h-7"/>}
                    title="Nenhuma questão ainda"
                    message="Clique em Gerar Questões para o Oráculo criar uma bateria baseada nesta aula."
                    action={
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ})}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                        <Sparkles className="w-5 h-5"/>Gerar Questões
                      </button>
                    }
                  />
                )}

	                {/* Cards de bloco */}
	                {blockList.length>0&&(
	                  <div className="space-y-3">
	                    {allLessonQuestionsDone&&(
	                      <div className={`rounded-2xl border p-5 ${dm?'border-green-800 bg-green-900/10':'border-green-200 bg-green-50'}`}>
	                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
	                          <div>
	                            <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-green-400':'text-green-700'}`}>Aula concluída</p>
	                            <h3 className={`text-lg font-serif font-bold mt-1 ${dm?'text-white':'text-gray-900'}`}>Questões de fixação finalizadas</h3>
	                            <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-600'}`}>Agora siga o próximo comando do plano ou avance para a próxima aula.</p>
	                          </div>
	                          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
	                            <button onClick={()=>{setCursoTab('plano');setView('curso');}}
	                              className={`px-4 py-3 rounded-xl font-bold text-sm border ${dm?'border-gray-700 text-gray-200 hover:bg-gray-800':'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
	                              Voltar ao Ciclo
	                            </button>
	                            <button onClick={()=>openCourseLessonFromVq(nextCourseLesson)} disabled={!nextCourseLesson}
	                              className={`px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-40 ${nextCourseLesson?'bg-yellow-600 hover:bg-yellow-700 text-white':(dm?'bg-gray-800 text-gray-500':'bg-gray-100 text-gray-400')}`}>
	                              Próxima aula
	                            </button>
	                          </div>
	                        </div>
	                      </div>
	                    )}
	                    <p className="text-xs font-bold uppercase opacity-40 mb-1">{blockList.length} bloco(s) · {aulaQCount(vqAula)} questões</p>
                    {blockList.map(([blockId, block], blockIndex)=>{
                      const allBlockQuestions = Array.isArray(block.questions) ? block.questions : [];
                      const blockOffset = blockList.slice(0, blockIndex).reduce((sum, [, item])=>sum + (Array.isArray(item.questions) ? item.questions.length : 0), 0);
                      const qs = vqQuestionParity === 'all' ? allBlockQuestions : allBlockQuestions.filter((question, index)=>{
                        const lessonNumber = blockOffset + index + 1;
                        return vqQuestionParity === 'odd' ? lessonNumber % 2 === 1 : lessonNumber % 2 === 0;
                      });
                      if (!qs.length && allBlockQuestions.length) return null;
                      const ans = (block.answers && typeof block.answers==='object' && !Array.isArray(block.answers)) ? block.answers : {};
                      const answered = qs.filter(q => Object.prototype.hasOwnProperty.call(ans, q.id)).length;
                      const correct = qs.filter(q=>isAnswerCorrect(q, ans[q.id])).length;
                      const pct = answered>0?Math.round(correct/answered*100):null;
                      const allDone = qs.length>0&&answered===qs.length;
                      const hasQs = qs.length>0;
                      const blockNum = blockId.replace('block','');
                      const isNamedCourseBlock = !/^block\d+$/i.test(blockId);
                      const blockTitle = block.title||`Bloco ${blockNum}`;
                      const blockErrorReviews = findErrorNotebookReviewsForSource({
                        subjectTitle:vqAula.title,
                        topicTitle:blockTitle,
                        questionIds:qs.map(q=>q.id),
                      });
                      const openBlockBizuario = () => {
                        if(!hasQs) return;
                        openBizuario(
                          {id:`course-${aulaIdNew}-${blockId}`, title:blockTitle, questions:qs, subtopics:block.subtopics||[]},
                          {id:`course-${aulaIdNew}`, title:vqAula.title, sourceMaterials:''}
                        );
                      };
                      const cardActions = hasQs ? [
                        {label:'Assistir aula', icon:<VideoIcon className="w-4 h-4"/>, fn:()=>{setView('videoaulas'); setActiveSubjectVid(vqSubject); setActiveSubtopicVid(`${vqTopic}::main`); setActiveAulaAndReset(vqAula);}},
                        {label:'Exportar', icon:<Printer className="w-4 h-4"/>, fn:()=>setExportModal({topic:{title:`${vqAula.title} — ${blockTitle}`,questions:qs},subject:null})},
                        {label:'Criar aula sobre isso', icon:<GraduationCap className="w-4 h-4"/>, fn:openBlockBizuario},
                        {label:Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length>0?`Gerenciar revisão (${Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length})`:'Revisão Espaçada', icon:<RepeatIcon className="w-4 h-4"/>, fn:()=>setSrModal({aulaId:aulaIdNew, blockId, blockTitle, questions:qs, answers:ans, notebookIds:Array.isArray(block.errorNotebook)?block.errorNotebook:[], meta:{source:'curso',aulaTitle:vqAula.title,blockTitle}})},
                        blockErrorReviews.length ? {label:blockErrorReviews.length>1?`Abrir revisões geradas (${blockErrorReviews.length})`:'Abrir revisão gerada', icon:<BookOpen className="w-4 h-4"/>, fn:()=>openErrorNotebookReviewResult(blockErrorReviews[0])} : null,
                        !meta.readOnly ? {label:'Recriar', icon:<RotateCcw className="w-4 h-4"/>, fn:()=>generateVqBlock(aulaIdNew,blockId)} : null,
                        {label:'Limpar respostas', icon:<Eraser className="w-4 h-4"/>, fn:()=>saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:{}}}}), danger:true},
                      ].filter(Boolean) : [];

                      return (
                        <div key={blockId} className={`relative rounded-2xl border overflow-visible transition-all ${dm?'bg-gray-800 border-gray-700 hover:border-gray-600':'bg-white border-gray-200 hover:border-gray-300'}`}>
                          <div
                            role="button"
                            tabIndex={block.generating ? -1 : 0}
                            onClick={()=>{
                              if (block.generating) return;
                              if(hasQs) setVqActiveBlockView({blockId,showWrong:false});
                              else generateVqBlock(aulaIdNew,blockId);
                            }}
                            onKeyDown={e=>{
                              if (block.generating) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if(hasQs) setVqActiveBlockView({blockId,showWrong:false});
                                else generateVqBlock(aulaIdNew,blockId);
                              }
                            }}
                            className="w-full p-5 flex items-center gap-4 text-left">
                            {/* Número / progresso — verde SÓ quando tudo respondido */}
                            <div className={`w-12 h-12 overflow-hidden rounded-xl flex-shrink-0 flex items-center justify-center font-bold font-serif text-lg ${allDone?'bg-green-500 text-white':hasQs?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                              {allDone?<CheckIcon className="w-6 h-6"/>:isNamedCourseBlock?<GraduationCap className="h-5 w-5"/>:blockNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate pr-9">{blockTitle}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {block.generating?(
                                  <span className="text-xs text-yellow-600 font-bold animate-pulse flex items-center gap-1">
                                    <Spinner className="w-3 h-3"/>Gerando{streamCount>0?` (${streamCount} questões)`:'...'}
                                  </span>
                                ):hasQs?(
                                  <>
                                    <div className={`h-1.5 rounded-full overflow-hidden flex-1 max-w-24 ${dm?'bg-gray-700':'bg-gray-100'}`}>
                                      <div className={`h-full rounded-full ${allDone?'bg-green-500':'bg-yellow-500'}`} style={{width:`${Math.round(answered/qs.length*100)}%`}}/>
                                    </div>
                                    <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{answered}/{qs.length} respondidas</span>
                                    {pct!==null&&<span className={`text-xs font-bold ml-1 ${pct>=70?'text-green-600':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</span>}
                                  </>
                                ):(
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-yellow-900/40 text-yellow-500':'bg-yellow-100 text-yellow-700'}`}>
                                    Toque para gerar
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${dm?'text-gray-600':'text-gray-300'}`}/>
                          </div>
                          {cardActions.length>0&&(
                            <div className="absolute right-3 top-3">
                              <button
                                onClick={e=>{e.preventDefault();e.stopPropagation();setBlockActionMenu(blockActionMenu===blockId?null:blockId);}}
                                title="Ações do bloco"
                                aria-label="Ações do bloco"
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${dm?'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-400':'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-yellow-700'}`}>
                                <MoreIcon className="w-4 h-4"/>
                              </button>
                              {blockActionMenu===blockId&&(
                                <div className={`mobile-safe-action-menu absolute right-0 top-10 z-40 w-56 rounded-xl border shadow-xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
                                  {cardActions.map(item=>(
                                    <button
                                      key={item.label}
                                      onClick={e=>{e.preventDefault();e.stopPropagation();setBlockActionMenu(null);item.fn();}}
                                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${item.danger?(dm?'text-red-400 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):item.active?(dm?'text-green-400 hover:bg-gray-800':'text-green-700 hover:bg-gray-50'):(dm?'text-gray-300 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>
                                      {item.icon}{item.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // LIST VIEW: navegação por assunto → tópico → aula
          return (
            <div className="max-w-3xl mx-auto">
              <button onClick={()=>setView('curso')} className={`flex items-center gap-2 mb-6 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Portal do Curso</button>
              <div className="flex items-center gap-3 mb-8">
                <GraduationCap className="w-8 h-8 text-yellow-600"/>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">Questões do Curso</h2>
              </div>

              {vqLoading&&<div className="flex justify-center py-16"><Spinner className="w-10 h-10 text-yellow-600"/></div>}

              {!vqLoading&&subjects.length===0&&(
                <div className="text-center py-16 opacity-50">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4"/>
                  <p className="font-bold text-lg">Nenhum conteúdo disponível</p>
                  <p className="text-sm mt-2">Acesse as Videoaulas para que o conteúdo apareça aqui.</p>
                </div>
              )}

              {!vqLoading&&subjects.map(subj=>{
                const isExp = vqExpandedSubj[subj]??true;
                const topics = data[subj]||{};
                // data[subj][topic] = { main:[], bonus:[] } — extrair aulas flat
                const allSubjAulas = Object.values(topics).flatMap(t=>[...(t.main||[]),...(t.bonus||[])]);
                const totalAulas = allSubjAulas.length;
                const totalQs = allSubjAulas.reduce((acc,a)=>acc+aulaQCount(a),0);
                return (
                  <div key={subj} className={`mb-3 rounded-2xl border overflow-hidden ${dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {/* Assunto header */}
                    <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExp}))} className="w-full p-5 flex items-center justify-between text-left hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-3">
                        <FolderIcon className="w-5 h-5 text-yellow-600"/>
                        <div>
                          <p className="font-bold">{capitalizeDisplayLabel(subj)}</p>
                          <p className="text-xs opacity-40 mt-0.5">{totalAulas} aulas{totalQs>0?` • ${totalQs} questões`:''}</p>
                        </div>
                      </div>
                      {isExp?<ChevronDown className="w-4 h-4 opacity-30"/>:<ChevronRight className="w-4 h-4 opacity-30"/>}
                    </button>

                    {isExp&&Object.entries(topics).map(([topic, cats])=>{
                      const aulas = [...(cats.main||[]),...(cats.bonus||[])];
                      const tExp = vqExpandedTopic[`${subj}/${topic}`]??false;
                      const topicQs = aulas.reduce((acc,a)=>acc+aulaQCount(a),0);
                      return (
                        <div key={topic} className={`border-t ${dm?'border-gray-700':'border-gray-100'}`}>
                          {/* Tópico header */}
                          <button onClick={()=>setVqExpandedTopic(p=>({...p,[`${subj}/${topic}`]:!tExp}))} className={`w-full flex items-center justify-between px-5 py-3 text-left ${dm?'hover:bg-gray-700':'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                              <LayersIcon className="w-4 h-4 text-yellow-600 opacity-70"/>
                              <div>
                                <p className="text-sm font-bold">{shortTopicName(topic)}</p>
                                <p className="text-xs opacity-40">{aulas.length} aulas{topicQs>0?` • ${topicQs} questões`:''}</p>
                              </div>
                            </div>
                            {tExp?<ChevronDown className="w-3.5 h-3.5 opacity-30"/>:<ChevronRight className="w-3.5 h-3.5 opacity-30"/>}
                          </button>

                          {tExp&&aulas.map((aula,ai)=>{
                            const key = aulaVqKey(aula);
                            const d = vqBlocks[key];
                            const qTotal  = d?.blocks ? blockValues(d.blocks).reduce((a,b)=>a+b.questions.length,0) : 0;
                            const qAns    = d?.blocks ? blockValues(d.blocks).reduce((a,b)=>a+Object.keys(b.answers).length,0) : 0;
                            const allDoneAula = qTotal>0 && qAns===qTotal;
                            const hasSetup = aulaHasVqData(aula);
                            return (
                              <button key={ai}
                                onClick={()=>{setVqSubject(subj);setVqTopic(topic);setVqAula(aula);setVqActiveBlock(null);setVqActiveBlockView(null);}}
                                className={`w-full flex items-center justify-between px-5 py-3 border-t text-left transition-colors ${dm?'border-gray-700/50 hover:bg-gray-700':'border-gray-50 hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${allDoneAula?'bg-green-500 text-white':hasSetup?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700':'bg-gray-100')}`}>
                                    {allDoneAula?<CheckIcon className="w-4 h-4"/>:hasSetup?<span className="text-xs font-bold">{qAns}/{qTotal}</span>:<PlayIcon className="w-3 h-3 opacity-30" style={{marginLeft:'1px'}}/>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-medium truncate ${dm?'text-gray-200':'text-gray-800'}`}>{aula.title}</p>
                                    {aula.duration_formatted&&<p className="text-xs opacity-40">⏱ {aula.duration_formatted}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                  {hasSetup&&!allDoneAula&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'}`}>{qTotal} questões</span>}
                                  {!hasSetup&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>Gerar</span>}
                                  <ChevronRight className="w-3.5 h-3.5 opacity-30"/>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
}
