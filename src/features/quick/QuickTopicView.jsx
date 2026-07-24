import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import QuickLessonContent from './QuickLessonContent.jsx';

export default function QuickTopicView() {
  const {
    activeSubject,
    activeTopic,
    ArrowLeft,
    BookOpen,
    BrainIcon,
    callWithRotation,
    canUseAdvancedFeatures,
    darkMode,
    EmptyState,
    Eraser,
    exportFlashcardsToAnki,
    FileText,
    getKey,
    handleAnswer,
    handleErrorNotebook,
    handleFavorite,
    isAdmin,
    parseHtmlText,
    QuestionView,
    QUICK_SOURCE,
    QUICK_SUBJECT_TITLE,
    quickStudyTab,
    resetQuickSessionAnswers,
    reviewQueue,
    saveSettings,
    Send,
    setDeleteId,
    setExportModal,
    setOpenAnswerModal,
    setQuickStudyTab,
    setSrModal,
    settings,
    settingsRef,
    setView,
    Trash2,
  } = useFeatureContext();

          const dm = darkMode;
          const allQs = activeTopic.questions || [];
          const directQs = allQs.filter(q => !q.isFlashcard);
          const flashcards = allQs.filter(q => q.isFlashcard);
          const answered = allQs.filter(q => activeTopic.answers?.[q.id]).length;
          const availableTabs = [
            activeTopic.quickLesson ? ['lesson', 'Aula', 1, <BookOpen className="w-4 h-4"/>] : null,
            directQs.length ? ['questions', 'Questões', directQs.length, <FileText className="w-4 h-4"/>] : null,
            flashcards.length ? ['flashcards', 'Flashcards', flashcards.length, <BrainIcon className="w-4 h-4"/>] : null,
          ].filter(Boolean);
          const contentSummary = [
            activeTopic.quickLesson ? 'Aula' : null,
            directQs.length ? `${directQs.length} questões` : null,
            flashcards.length ? `${flashcards.length} flashcards` : null,
            allQs.length ? `${answered}/${allQs.length} respondidas` : null,
          ].filter(Boolean).join(' · ');
          const returnFromPractice = () => activeTopic.quickLesson ? setQuickStudyTab('lesson') : setView('quick');
          const tabBtn = (key, label, count, icon) => (
            <button key={key} type="button" onClick={()=>setQuickStudyTab(key)} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${quickStudyTab===key?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
              {icon}{label}<span className={`text-[11px] rounded-full px-2 py-0.5 ${quickStudyTab===key?(dm?'bg-yellow-500 text-gray-950':'bg-yellow-600 text-white'):(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500')}`}>{count}</span>
            </button>
          );
          return (
            <div className="space-y-5">
              <section className="app-hero rounded-2xl p-5 md:p-6">
                <button onClick={()=>setView('quick')} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                  <ArrowLeft className="w-4 h-4"/>{QUICK_SUBJECT_TITLE}
                </button>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-yellow-500/80':'text-yellow-700/80'}`}>Dúvida rápida</p>
                    <h2 className="text-3xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight">{activeTopic.title}</h2>
                    <p className={`text-sm mt-2 ${dm?'text-gray-400':'text-gray-600'}`}>{contentSummary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isAdmin&&flashcards.length>0&&(
                      <button onClick={()=>exportFlashcardsToAnki({questions:flashcards,title:activeTopic.title,subjectTitle:activeTopic.title,deckTitle:QUICK_SUBJECT_TITLE,source:QUICK_SOURCE})} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
                        <Send className="w-4 h-4"/>Anki
                      </button>
                    )}
                    <button onClick={()=>resetQuickSessionAnswers(activeTopic)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${dm?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <Eraser className="w-4 h-4"/>Limpar
                    </button>
                    <button onClick={()=>setDeleteId({type:'quick-topic', id:activeTopic.id})} className={`h-10 w-10 rounded-xl border flex items-center justify-center ${dm?'border-gray-700 text-red-400 hover:bg-red-950/30':'border-red-100 text-red-500 hover:bg-red-50'}`} title="Excluir dúvida" aria-label="Excluir dúvida">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
                <div className={`grid grid-cols-1 ${availableTabs.length===2?'sm:grid-cols-2':availableTabs.length>=3?'sm:grid-cols-3':''} gap-2 mt-5`}>
                  {availableTabs.map(([key,label,count,icon])=>tabBtn(key,label,count,icon))}
                </div>
              </section>

              {quickStudyTab==='lesson'&&(
                <section className={`rounded-2xl border p-5 md:p-7 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                  {activeTopic.quickContext&&(
                    <div className={`mb-5 rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Contexto</p>
                      <p className={`text-sm leading-relaxed ${dm?'text-gray-300':'text-gray-700'}`}>{activeTopic.quickContext}</p>
                    </div>
                  )}
                  {activeTopic.quickLesson ? (
                    <div className="reading-content space-y-3"><QuickLessonContent lesson={activeTopic.quickLesson} darkMode={dm} renderText={parseHtmlText}/></div>
                  ) : (
                    <EmptyState darkMode={dm} icon={<BookOpen className="w-7 h-7"/>} title="Sem aula salva" message="Esta dúvida não possui uma aula, mas os outros conteúdos continuam disponíveis."/>
                  )}
                  {(directQs.length>0||flashcards.length>0)&&<div className={`grid grid-cols-1 ${directQs.length&&flashcards.length?'sm:grid-cols-2':''} gap-3 mt-7`}>
                    {directQs.length>0&&<button onClick={()=>setQuickStudyTab('questions')} style={{minHeight:64}} className="rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold flex items-center justify-center gap-2 py-4"><FileText className="w-4 h-4"/>Fazer questões</button>}
                    {flashcards.length>0&&<button onClick={()=>setQuickStudyTab('flashcards')} style={{minHeight:64}} className={`rounded-xl border font-bold flex items-center justify-center gap-2 py-4 ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}><BrainIcon className="w-4 h-4"/>Revisar flashcards</button>}
                  </div>}
                </section>
              )}

              {quickStudyTab==='questions'&&(directQs.length ? (
                <QuestionView title="Questões da dúvida" onBack={returnFromPractice} backLabel={activeTopic.quickLesson?'Aula':'Dúvida Rápida'} questions={directQs} answers={activeTopic.answers||{}} favorites={activeTopic.favorites||[]} onAnswer={(qId,l)=>handleAnswer(qId,l)} onToggleFavorite={(qId)=>handleFavorite(qId)} errorNotebook={activeTopic.errorNotebook||[]} showErrorNotebook={canUseAdvancedFeatures} onToggleErrorNotebook={(qId)=>handleErrorNotebook(qId)} onReset={()=>resetQuickSessionAnswers(activeTopic)} onExport={()=>setExportModal({topic:{...activeTopic, questions:directQs}, subject:activeSubject})} darkMode={dm} apiKey={getKey()} oracleLength={settings.oracleLength||'medium'} onCall={callWithRotation} onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})} displayMode={canUseAdvancedFeatures ? (settings.questionDisplayMode || 'list') : 'list'} onDisplayModeChange={canUseAdvancedFeatures ? (mode=>saveSettings({...settingsRef.current, questionDisplayMode:mode})) : null} adminQuestionExplanations={isAdmin} onAddToReview={canUseAdvancedFeatures ? ((qs, ans)=>setSrModal({aulaId:`lib_${activeSubject.id}`,blockId:`topic_${activeTopic.id}`,blockTitle:activeTopic.title,questions:qs,answers:ans,notebookIds:activeTopic.errorNotebook||[],meta:{source:QUICK_SOURCE,subjectId:activeSubject.id,topicId:activeTopic.id,subjectTitle:QUICK_SUBJECT_TITLE,blockTitle:activeTopic.title}})) : null} inReviewCount={canUseAdvancedFeatures ? Object.keys(reviewQueue[`lib_${activeSubject.id}`]?.[`topic_${activeTopic.id}`]||{}).length : 0}/>
              ) : <EmptyState darkMode={dm} icon={<FileText className="w-7 h-7"/>} title="Sem questões nesta dúvida" message="Use o conteúdo disponível ou gere uma nova dúvida selecionando Questões."/>)}

              {quickStudyTab==='flashcards'&&(flashcards.length ? (
                <QuestionView title="Flashcards da dúvida" onBack={returnFromPractice} backLabel={activeTopic.quickLesson?'Aula':'Dúvida Rápida'} questions={flashcards} answers={activeTopic.answers||{}} favorites={activeTopic.favorites||[]} onAnswer={(qId,l)=>handleAnswer(qId,l)} onToggleFavorite={(qId)=>handleFavorite(qId)} errorNotebook={activeTopic.errorNotebook||[]} showErrorNotebook={canUseAdvancedFeatures} onToggleErrorNotebook={(qId)=>handleErrorNotebook(qId)} onReset={()=>resetQuickSessionAnswers(activeTopic)} darkMode={dm} apiKey={getKey()} oracleLength={settings.oracleLength||'medium'} onCall={callWithRotation} displayMode={canUseAdvancedFeatures ? (settings.questionDisplayMode || 'list') : 'list'} onDisplayModeChange={canUseAdvancedFeatures ? (mode=>saveSettings({...settingsRef.current, questionDisplayMode:mode})) : null} onExportAnki={isAdmin ? (qs=>exportFlashcardsToAnki({questions:qs,title:activeTopic.title,subjectTitle:activeTopic.title,deckTitle:QUICK_SUBJECT_TITLE,source:QUICK_SOURCE})) : null} onAddToReview={canUseAdvancedFeatures ? ((qs, ans)=>setSrModal({aulaId:`lib_${activeSubject.id}`,blockId:`topic_${activeTopic.id}`,blockTitle:activeTopic.title,questions:qs,answers:ans,notebookIds:activeTopic.errorNotebook||[],meta:{source:QUICK_SOURCE,subjectId:activeSubject.id,topicId:activeTopic.id,subjectTitle:QUICK_SUBJECT_TITLE,blockTitle:activeTopic.title}})) : null} inReviewCount={canUseAdvancedFeatures ? Object.keys(reviewQueue[`lib_${activeSubject.id}`]?.[`topic_${activeTopic.id}`]||{}).length : 0}/>
              ) : <EmptyState darkMode={dm} icon={<BrainIcon className="w-7 h-7"/>} title="Sem flashcards nesta dúvida" message="Gere uma nova dúvida selecionando Flashcards."/>)}
            </div>
          );
}
